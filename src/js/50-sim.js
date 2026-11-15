/* ---------- simulation ---------- */
const PL={e:null},PL2={e:null};
function locatePlayer(dt){const nr=nearest(car.x,car.z,PL,1,null,car.y)||nearest(car.x,car.z,PL,1);if(!nr)return;const e=nr.e,i=nr.i,fx=Math.sin(car.a),fz=-Math.cos(car.a),al=fx*nr.tx+fz*nr.tz;
  car.inNode=null;for(const n of[e.a,e.b])if(n.r&&Math.hypot(car.x-n.x,car.z-n.z)<n.r+2)car.inNode=n;
  car.e=e;car.s=nr.s;car.u=nr.u;car.tx=nr.tx;car.tz=nr.tz;car.dir=Math.abs(al)>0.5?Math.sign(al):0;
  const g=(e.py[i+1]-e.py[i])/(e.ps[i+1]-e.ps[i]);car.grade=g;car.slope=g*al;const k=Math.min(1,dt*10);car.y+=(nr.y-car.y)*k;car.pitch+=(Math.atan(g*al)-car.pitch)*k;}
function drive(dt){
  const g=car.gear,pow=g==='D'||g==='R',gd=g==='R'?-1:1,vm=g==='R'?4:36,grip=env.grip;let v=car.v,a=-9.8*(car.slope||0);
  if(pow&&inp.gas)a+=gd*2.9*inp.gas*(1-Math.abs(v)/vm)*(grip<0.5?0.7:1);else if(pow&&!inp.brake&&!car.hb&&v*gd<1.4)a+=gd*0.8;
  const res=0.3+0.012*Math.abs(v)+0.0009*v*v+8*inp.brake*grip+(car.hb?6:0),dv=res*dt;v+=a*dt;if(Math.abs(v)>dv)v-=Math.sign(v)*dv;else v=0;if(g==='P')v=0;car.v=v;car.braking=inp.brake>0.05;
  const u=Math.abs(v),maxS=0.6/(1+(u/6)*(u/6))*(grip<0.5?0.8:1),target=clamp(inp.right-inp.left+inp.steerA,-1,1)*maxS,rate=(target===0?2.4:1.3)*dt;
  car.steer+=clamp(target-car.steer,-rate,rate);car.steer=clamp(car.steer,-maxS,maxS);
  car.a+=car.v/2.6*Math.tan(car.steer)*dt;
  const nx=car.x+Math.sin(car.a)*car.v*dt,nz=car.z-Math.cos(car.a)*car.v*dt;
  const S=solids(),d1=depthAt(nx,nz,car.a,S);
  if(d1>0&&d1>depthAt(car.x,car.z,car.a,S)+0.001){if(Math.abs(car.v)>1.2&&invuln<time){invuln=time+3;violate('crash');}car.v=0;}   // solid: cannot push further in, but can always back out
  else if(onRoad(nx,nz,car.y)){car.x=nx;car.z=nz;}
  else{if(onRoad(nx,car.z,car.y))car.x=nx;else if(onRoad(car.x,nz,car.y))car.z=nz;car.v*=Math.pow(0.05,dt);if(Math.abs(car.v)>0.8)violate('curb');}
  locatePlayer(dt);
}
function world(dt){
  time+=dt;
  const ON={g:0x19e6a2,y:0xffc400,r:0xff2a2a},OFF=[0x143a30,0x40360f,0x431313],ORD=['g','y','r'];
  for(const k in ND){const n=ND[k];for(const l of n.lamps){const st=sigState(n,l.e);l.set.forEach((m,q)=>m.material.color.setHex(ORD[q]===st?ON[st]:OFF[q]));}}
  // railway
  if(!rail.alarm){rail.t-=dt;if(rail.t<=0){rail.alarm=true;rail.at=0;rail.train.position.x=-420;}}
  else{rail.at+=dt;if(rail.at>6){rail.train.visible=true;rail.train.position.x+=45*dt;if(rail.train.position.x>1150){rail.alarm=false;rail.train.visible=false;rail.t=38+Math.random()*25;}}
    rail.bellT-=dt;if(rail.bellT<=0){rail.bellT=0.45;if(state==='drive'&&Math.abs(car.z-ZR)<70)beep(Math.floor(time/0.45)%2?660:540,0.3,0.03,'sine');}}
  const fl=Math.floor(time*2.2)%2;
  for(const gr of rail.gear){gr.l1.material.color.setHex(rail.alarm&&fl?0xff2020:0x4a1414);gr.l2.material.color.setHex(rail.alarm&&!fl?0xff2020:0x4a1414);const tg=rail.alarm&&rail.at>1.5?0:1.4;gr.piv.rotation.z+=clamp(tg-gr.piv.rotation.z,-dt*0.9,dt*0.9);}
  // pedestrian on the mid-block crossing
  {const e=PEDX.e,W=e.w;
    if(ped.state==='away'){ped.t-=dt;if(ped.t<=0){if(ped.first&&mode==='course'&&state==='drive'&&!ped.armed){ped.armed=true;ped.t=9999;}else{ped.state='wait';ped.tw=0;if(!ped.first)ped.side=Math.random()<0.5?-1:1;ped.first=false;ped.armed=false;ped.z=ped.side*(W+1.3);ped.mesh.visible=true;}}}
    else if(ped.state==='wait'){ped.tw+=dt;if(ped.tw>1.3&&!ped.threat&&!ped.npcThreat)ped.state='cross';}
    else{ped.z-=ped.side*1.35*dt;if(ped.z*ped.side<-(W+1.3)){ped.state='away';ped.t=10+Math.random()*14;ped.mesh.visible=false;}}
    const q=edgePos(e,PEDX.s,ped.z);ped.mesh.position.set(q.x,q.y+(Math.abs(ped.z)>W?0.2:0.07),q.z);}
  for(const b of tollGates){const q=edgePos(b.e,b.s,0),near=state==='drive'&&car.e===b.e&&car.dir===b.d&&(b.s-car.s)*b.d<26&&(b.s-car.s)*b.d>-6&&Math.abs(car.v)*3.6<=27;b.piv.rotation.z+=clamp((near?1.45:0)*b.sgn-b.piv.rotation.z,-dt*3,dt*3);}
  updateTraffic(dt);updateEvents(dt);updatePeds(dt);updateEnv(dt);
  for(const m of playerBrake)m.color.setHex(car.braking?0xff2a1a:env.lights?0x9a1414:0x5a0d0d);
}
