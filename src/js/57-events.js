/* ---------- scripted events: broken-down car, child, motorcycle, emergency vehicles ---------- */
const OBST=[];                                         // static boxes the player can hit
const XB=2.5*S+12,CZ=56;
let brokenCar,child,moto,emerg={on:false,until:-99},emVeh={},evHint=null,bikeNpc=null;
function buildEvents(){
  brokenCar=makeVehicle('car',0x7d8791);brokenCar.G.position.set(XB,0,1.75);brokenCar.G.rotation.y=yawFor(3);OBST.push({x:XB,z:1.75,hx:2.25,hz:0.95});
  const tri=cv(64,64,c=>{c.beginPath();c.moveTo(32,6);c.lineTo(60,56);c.lineTo(4,56);c.closePath();c.strokeStyle='#e0241b';c.lineWidth=9;c.lineJoin='round';c.stroke();});
  signPost(tri,0.55,0.55,XB+16,1.75,3,0.15,null,true);
  const van=makeVehicle('van',0xb9bdc2);van.G.position.set(X0-2.55,0,CZ+8.5);van.G.rotation.y=yawFor(0);OBST.push({x:X0-2.55,z:CZ+8.5,hx:0.95,hz:2.3});
  const G=new THREE.Group();put(G,new THREE.CylinderGeometry(0.15,0.18,0.75,8),L(0xf2c230),0,0.5,0);put(G,new THREE.SphereGeometry(0.15,10,8),L(0xe8c4a0),0,1.03,0);put(G,new THREE.BoxGeometry(0.3,0.3,0.14),L(0xb3272d),0,0.6,0.16);G.visible=false;scene.add(G);
  const ball=put(scene,new THREE.SphereGeometry(0.16,10,8),L(0xe0241b),0,0.2,0);ball.visible=false;
  child={G,ball,on:false,t:0,x:0,cool:0};
  moto={veh:makeVehicle('moto'),on:false,s:0,v:0,cool:0,phase:0,flag:false};moto.veh.G.visible=false;
  for(const k of['ambulance','police','fire']){emVeh[k]=makeVehicle(k);emVeh[k].G.visible=false;}
}
function resetEvents(){child.on=false;child.G.visible=child.ball.visible=false;child.cool=0;moto.on=false;moto.veh.G.visible=false;moto.cool=0;if(emerg.veh)emerg.veh.G.visible=false;emerg={on:false,until:-99,cool:mode==='free'?40:0,n:emerg.n||0};evHint=null;}
function hitObst(x,z,a){const fx=Math.sin(a),fz=-Math.cos(a);
  for(const o of OBST)for(const k of[-1.5,0,1.5]){const px=x+fx*k,pz=z+fz*k;if(Math.abs(px-o.x)<o.hx+0.8&&Math.abs(pz-o.z)<o.hz+0.8)return true;}return false;}
function hitVehicle(veh,x,z,hx,hz){const rx=car.x-x,rz=car.z-z,al=rx*hx+rz*hz,lt=Math.abs(rx*hz-rz*hx);return Math.abs(al)<veh.hl+1.5&&lt<veh.wid/2+0.8;}
function updateEvents(dt){
  evHint=null;const flash=Math.floor(time*2.7)%2===0,fx=Math.sin(car.a),fz=-Math.cos(car.a),drv=state==='drive';
  vehLights(brokenCar,false,'H',flash);
  if(drv&&Math.abs(car.z-1.75)<5&&fx<-0.6&&car.x>XB&&car.x<XB+45)evHint='hObst';
  // --- child running out from behind a parked van
  if(drv&&Math.abs(car.x-X0)<3.5&&fz<-0.6&&car.z<S-12&&car.z>CZ)evHint='hSchool';
  if(!child.on){if(drv&&time>child.cool&&Math.abs(car.x-X0)<3.5&&fz<-0.7&&car.z>CZ+13&&car.z<CZ+24&&car.v>1.5){child.on=true;child.t=0;child.cool=mode==='free'?time+75:1e9;}}
  else{child.t+=dt;const bx=Math.min(X0+5.2,X0-4+5.2*child.t),cx=X0-4.4+3.3*Math.max(0,child.t-0.5);child.ball.visible=true;child.ball.position.set(bx,0.2,CZ-0.6);child.G.visible=child.t>0.5;child.G.position.set(cx,cx<X0-3.5||cx>X0+3.5?0.15:0,CZ);child.G.rotation.y=-Math.PI/2;
    if(child.G.visible&&cx<X0+3.6&&drv&&invuln<time&&Math.hypot(car.x+fx*1.3-cx,car.z+fz*1.3-CZ)<1.35&&Math.abs(car.v)>0.4){invuln=time+4;car.v=0;violate('hitped');}
    if(cx>X0+6){child.on=false;child.G.visible=child.ball.visible=false;}}
  // --- cyclist: side clearance when overtaking
  if(bikeNpc&&drv){const rel=(car.x-bikeNpc.x)*bikeNpc.hx+(car.z-bikeNpc.z)*bikeNpc.hz,lt=Math.abs((car.x-bikeNpc.x)*bikeNpc.hz-(car.z-bikeNpc.z)*bikeNpc.hx);
    if(rel>-28&&rel<3&&lt<4&&fx>0.6)evHint='hBike';if(Math.abs(rel)<2.6&&lt-1.15<0.8&&lt<3&&car.v>bikeNpc.v+1.5)violate('sidegap');}
  // --- motorcycle in the left-rear blind spot before 東本町
  const onMain=Math.abs(car.z-S)<RW[1],plat=fx>0?-(car.z-S):(car.z-S);
  if(!moto.on){if(drv&&time>moto.cool&&onMain&&fx>0.8&&car.x>2*S+16&&car.x<2*S+40&&car.v>3){moto.on=true;moto.s=car.x-11;moto.v=car.v;moto.phase=0;moto.flag=false;moto.plat=plat;moto.cool=mode==='free'?time+90:1e9;moto.veh.G.visible=true;}}
  else{const m=moto,rel=m.s-car.x;let vt;
    if(m.phase===0){vt=clamp(car.v+(car.x-5.2-m.s)*1.6,0,17);if(car.x>X0-48||!onMain)m.phase=1;}else vt=Math.max(car.v+4,10);
    const n31=nodes['3,1'],gg=X0-SLd(n31,'h')-m.s-1;if(gg>-1&&sigState(n31,'h')!=='g')vt=Math.min(vt,gg<0.3?0:Math.sqrt(4.4*gg));
    if(plat>3.3&&rel>1.5&&rel<14&&fx>0.5)vt=Math.min(vt,Math.max(0,car.v-1));                 // the player is already in its lane ahead
    const br=vt<m.v-0.05;m.v+=clamp(vt-m.v,-7*dt,3.2*dt);m.s+=m.v*dt;m.veh.G.position.set(m.s,0,S-6.05);m.veh.G.rotation.y=yawFor(1);vehLights(m.veh,br,null,flash);
    if(drv&&fx>0.5&&m.phase===0&&car.x>2*S+30)evHint='hMoto';
    if(drv&&!m.flag&&m.plat<=3.4&&plat>3.4&&rel>-9&&rel<1.5&&onMain){m.flag=true;violate('makikomi');}m.plat=plat;
    if(drv&&invuln<time&&hitVehicle(m.veh,m.s,S-6.05,1,0)){invuln=time+4;car.v=0;violate('crash');}
    if(m.s>MAXX+E+45){m.on=false;m.veh.G.visible=false;}}
  // --- emergency vehicle coming up from behind on 中央通り
  if(!emerg.on){const trig=mode==='course'?(cp===3&&fx>0.8&&car.x>S+24&&car.x<S+44):(time>emerg.cool&&Math.abs(fx)>0.85&&car.x>20&&car.x<MAXX-20&&Math.abs((car.x%S)-S/2)<25);
    if(drv&&onMain&&trig&&car.v>3&&!moto.on){const kind=['ambulance','police','fire'][emerg.n%3],dir=fx>0?1:-1;emerg={on:true,veh:emVeh[kind],kind,dir,s:car.x-dir*88,v:15,lane:1.75,laneT:1.75,block:0,flag:false,n:emerg.n+1,until:0,sirT:0};emerg.veh.G.visible=true;}}
  else{const e=emerg,rel=(car.x-e.s)*e.dir,pl=e.dir>0?-(car.z-S):(car.z-S);let vt=16.5;
    if(onMain&&rel>0&&rel<45&&Math.abs(pl-e.lane)<2.1){vt=Math.min(vt,Math.max(Math.abs(car.v),Math.sqrt(6*Math.max(0,rel-9))));if(rel<18){e.block+=dt;if(e.block>3.5){e.laneT=-1.75;if(!e.flag){e.flag=true;violate('emerg');}}}}
    e.lane+=clamp(e.laneT-e.lane,-2*dt,2*dt);e.v+=clamp(vt-e.v,-8*dt,3*dt);e.s+=e.dir*e.v*dt;const z=S+(e.dir>0?-1:1)*e.lane;e.veh.G.position.set(e.s,0,z);e.veh.G.rotation.y=yawFor(e.dir>0?1:3);vehLights(e.veh,vt<e.v-0.1,null,flash);
    if(drv&&rel>-10&&rel<110)evHint='hEmerg';
    e.sirT-=dt;if(e.sirT<=0){e.sirT=0.55;const dist=Math.hypot(car.x-e.s,car.z-z);if(drv&&dist<170)beep(Math.floor(time/0.55)%2?960:770,0.5,0.05*Math.max(0.15,1-dist/170),'sine');}
    if(drv&&invuln<time&&hitVehicle(e.veh,e.s,z,e.dir,0)){invuln=time+4;car.v=0;violate('crash');}
    if(rel<-140||e.s<-E-60||e.s>MAXX+E+60){e.veh.G.visible=false;emerg={on:false,until:time,cool:time+110,n:e.n};}}
}
