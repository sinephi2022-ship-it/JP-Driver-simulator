/* ---------- simulation ---------- */
function inWorld(x,z){return z<-E?(z>HW.end&&Math.abs(x-X0)<20):(x>=-E&&x<=MAXX+E&&z<=MAXZ+E);}
function drive(dt){
  const g=car.gear,pow=g==='D'||g==='R',s=g==='R'?-1:g==='D'?1:(car.v<0?-1:1),vm=g==='R'?4:36,grip=env.grip;let u=Math.max(0,car.v*s),acc=0;
  if(pow&&inp.gas)acc+=2.9*inp.gas*(1-u/vm)*(grip<0.5?0.7:1);else if(pow&&!inp.brake&&!car.hb&&u<1.4)acc+=0.8;else acc-=0.35+0.012*u+0.0009*u*u;
  acc-=8*inp.brake*grip;if(car.hb)acc-=6;u=Math.max(0,u+acc*dt);if(g==='P')u=0;car.v=u*s;car.braking=inp.brake>0.05;
  const maxS=0.6/(1+(u/6)*(u/6))*(grip<0.5?0.8:1),target=clamp(inp.right-inp.left+inp.steerA,-1,1)*maxS,rate=(target===0?2.4:1.3)*dt;
  car.steer+=clamp(target-car.steer,-rate,rate);car.steer=clamp(car.steer,-maxS,maxS);
  car.a+=car.v/2.6*Math.tan(car.steer)*dt;
  let nx=car.x+Math.sin(car.a)*car.v*dt,nz=car.z-Math.cos(car.a)*car.v*dt;
  if(!inWorld(nx,nz)){car.v=0;if(edgeT<time){edgeT=time+5;note(T('edge'));}return;}
  if(hitObst(nx,nz,car.a)){if(Math.abs(car.v)>1.2&&invuln<time){invuln=time+3;violate('crash');}car.v=0;return;}
  if(onRoad(nx,nz)){car.x=nx;car.z=nz;}
  else{if(onRoad(nx,car.z))car.x=nx;else if(onRoad(car.x,nz))car.z=nz;car.v*=Math.pow(0.05,dt);if(Math.abs(car.v)>0.8)violate('curb');}
}
function world(dt){
  time+=dt;
  // signals
  const ON={g:0x19e6a2,y:0xffc400,r:0xff2a2a},OFF=[0x143a30,0x40360f,0x431313],ORD=['g','y','r'];
  for(const k in nodes){const n=nodes[k];if(n.type!=='sig')continue;for(const ax of['h','v']){const st=sigState(n,ax);for(const set of n.lamps[ax])set.forEach((m,q)=>m.material.color.setHex(ORD[q]===st?ON[st]:OFF[q]));}}
  // railway
  if(!rail.alarm){rail.t-=dt;if(rail.t<=0){rail.alarm=true;rail.at=0;rail.train.position.x=-240;}}
  else{rail.at+=dt;if(rail.at>6){rail.train.visible=true;rail.train.position.x+=45*dt;if(rail.train.position.x>MAXX+240){rail.alarm=false;rail.train.visible=false;rail.t=38+Math.random()*25;}}
    rail.bellT-=dt;if(rail.bellT<=0){rail.bellT=0.45;if(state==='drive'&&Math.abs(car.z-ZR)<70)beep(Math.floor(time/0.45)%2?660:540,0.3,0.03,'sine');}}
  const fl=Math.floor(time*2.2)%2;
  for(const gr of rail.gear){gr.l1.material.color.setHex(rail.alarm&&fl?0xff2020:0x4a1414);gr.l2.material.color.setHex(rail.alarm&&!fl?0xff2020:0x4a1414);
    const tg=rail.alarm&&rail.at>1.5?0:1.4;gr.piv.rotation.z+=clamp(tg-gr.piv.rotation.z,-dt*0.9,dt*0.9);}
  // pedestrian on the mid-block crossing
  if(ped.state==='away'){ped.t-=dt;if(ped.t<=0){
      if(ped.first&&mode==='course'&&state==='drive'&&!ped.armed){ped.armed=true;ped.t=9999;}
      else{ped.state='wait';ped.tw=0;if(!ped.first)ped.side=Math.random()<0.5?-1:1;ped.first=false;ped.armed=false;ped.z=ped.side*(W+1.3);ped.mesh.visible=true;}}}
  else if(ped.state==='wait'){ped.tw+=dt;if(ped.tw>1.3&&!ped.threat&&!ped.npcThreat)ped.state='cross';}
  else{ped.z-=ped.side*1.35*dt;if(ped.z*ped.side<-(W+1.3)){ped.state='away';ped.t=10+Math.random()*14;ped.mesh.visible=false;}}
  ped.mesh.position.set(XC,0.15*(Math.abs(ped.z)>W?1:0),2*S+ped.z);
  updateTraffic(dt);updateEvents(dt);updateHighway(dt);updateEnv(dt);
  for(const m of playerBrake)m.color.setHex(car.braking?0xff2a1a:env.lights?0x9a1414:0x5a0d0d);
}
