/* ---------- scripted events: broken-down car, child, cyclist, motorcycle, emergency vehicles ---------- */
const OBST=[];let obstZone=null,brokenCar,child,moto,emVeh={},evHint=null,bikeNpc={n:null};
let emerg={on:false,until:-99,nodes:new Set(),near:()=>false};
// a path of consecutive edges (all travelled a→b): 中央通り eastbound, 駅前通り eastbound
let MAINP=null,STP=null,TRAMP=null,tram={dwell:0},gar={};
function mkPath(keys){const p={ed:keys.map(k=>EK[k]),cum:[0]};for(const e of p.ed)p.cum.push(p.cum[p.cum.length-1]+e.len);p.len=p.cum[p.cum.length-1];p.nodes=new Set(p.ed.map(e=>e.b));return p;}
function pathPos(p,s,u){s=clamp(s,0,p.len-0.01);let k=0;while(k<p.ed.length-1&&p.cum[k+1]<=s)k++;const e=p.ed[k],q=edgePos(e,s-p.cum[k],typeof u==='function'?u(e):u);q.e=e;q.es=s-p.cum[k];return q;}
function pathS(p){const k=p.ed.indexOf(car.e);return k<0?null:p.cum[k]+car.s;}
function buildEvents(){
  MAINP=mkPath(['W0-A1','A1-A2','A2-O1','O1-A3','A3-A4','A4-A5']);STP=mkPath(['S0-S1','S1-S2','S2-S3','S3-S4','S4-S5']);
  // broken-down car on 桜通り, westbound lane between 小学校前 and 公園前
  {const e=EK['N3-N4'],s=e.len*0.55,q=edgePos(e,s,-e.w/2);brokenCar=makeVehicle('car',0x7d8791);brokenCar.G.position.set(q.x,q.y,q.z);brokenCar.G.rotation.y=yawOf(-q.tx,-q.tz);STATB.push(q.x,q.z,-q.tx,-q.tz,2.15,0.85);e.closedDir=-1;obstZone={e,s,dir:-1};
    const t=edgePos(e,s+16,-e.w/2),tri=cv(64,64,c=>{c.beginPath();c.moveTo(32,6);c.lineTo(60,56);c.lineTo(4,56);c.closePath();c.strokeStyle='#e0241b';c.lineWidth=9;c.lineJoin='round';c.stroke();});signPost(tri,0.55,0.55,t.x,t.y+0.1,t.z,-t.tx,-t.tz,0.05,null,true);}
  // school road (東本町 → 小学校前): a parked van, a child runs out from behind it
  {const e=EK['A4-N4'],s=e.len*0.5,v=edgePos(e,s-8.5,e.w-0.95),van=makeVehicle('van',0xb9bdc2);van.G.position.set(v.x,v.y,v.z);van.G.rotation.y=yawOf(v.tx,v.tz);STATB.push(v.x,v.z,v.tx,v.tz,2.25,0.9);
    const G=new THREE.Group();G.userData.dyn=true;put(G,new THREE.CylinderGeometry(0.15,0.18,0.75,8),L(0xf2c230),0,0.5,0);put(G,new THREE.SphereGeometry(0.15,10,8),L(0xe8c4a0),0,1.03,0);put(G,new THREE.BoxGeometry(0.3,0.3,0.14),L(0xb3272d),0,0.6,0.16);G.visible=false;scene.add(G);
    const bg=new THREE.Group();bg.userData.dyn=true;put(bg,new THREE.SphereGeometry(0.16,10,8),L(0xe0241b),0,0.2,0);bg.visible=false;scene.add(bg);child={G,ball:bg,e,s,on:false,t:0,cool:0};
    const sc=cv(256,256,c=>{c.translate(128,128);c.rotate(Math.PI/4);c.fillStyle='#f6c400';c.fillRect(-84,-84,168,168);c.strokeStyle='#111';c.lineWidth=7;c.strokeRect(-76,-76,152,152);c.rotate(-Math.PI/4);c.fillStyle='#111';for(const q of[[-22,1.0],[20,0.8]]){c.beginPath();c.arc(q[0],-36*q[1],13*q[1],0,7);c.fill();c.fillRect(q[0]-10*q[1],-22*q[1],20*q[1],46*q[1]);}});
    const p=edgePos(e,34,e.w+3.2);signPost(sc,1,1,p.x,p.y,p.z,p.tx,p.tz,2.2);}
  // tram line along 駅前通り: one stop with a safety island (S1–S2), one without (S2–S3)
  {TRAMP=mkPath(['S1-S2','S2-S3','S3-S4']);const p=TRAMP,stops=[p.cum[0]+p.ed[0].len*0.78,p.cum[1]+p.ed[1].len*0.5];tram={veh:makeVehicle('tram'),s:60,dir:1,v:0,dwell:0,stop:-1,stops,done:-1,turnT:0,pax:[]};
    const isl=L(0xc9c4b8),sh=L(0x8fa1ad),tb=textBoard(['電停'],1.1,0.6,'#1c4c9c');
    for(const d of[1,-1]){const a=pathPos(p,stops[0]+d*2,d*2.92),G=new THREE.Group();G.position.set(a.x,a.y,a.z);G.rotation.y=yawOf(a.tx,a.tz);scene.add(G);box(isl,0.8,0.28,15,0,0.2,0,G);box(sh,0.9,0.1,7,0,2.5,0,G);for(const z of[-3,3])box(poleMat,0.08,2.3,0.08,0,1.3,z,G);
      for(let k=-7;k<=7;k+=1.4){const o=pathPos(p,stops[0]+d*2+k,d*2.92);OBST.push({x:o.x,z:o.z,r:0.35});}
      signPost(tb,1.1,0.6,a.x+a.tx*8*d,a.y,a.z+a.tz*8*d,a.tx*d,a.tz*d,2.3);
      const b=pathPos(p,stops[1]+d*2,d*(p.ed[1].w+0.9));signPost(tb,1.1,0.6,b.x,b.y,b.z,b.tx*d,b.tz*d,2.3);
      const zone=pathPos(p,stops[1]+d*2,d*3.1);ground(decalMat({color:0xf0f2f4,opacity:0.5}),0.14,14,zone.x,zone.y+0.11,zone.z,yawOf(zone.tx,zone.tz));}
    const R2=rng(3);for(let k=0;k<3;k++){const G=pedFigure([0x35506b,0x6b3f3f,0x3f5f4a][k],R2);G.visible=false;tram.pax.push(G);}}
  // a car waiting to pull out of a driveway on 桜通り (公園前 → 桜町 direction)
  {const e=EK['O2-N3'],s0=e.len*0.52,q=edgePos(e,s0,-e.w-7.5),G=new THREE.Group();G.position.set(q.x,q.y,q.z);G.rotation.y=yawOf(q.tx,q.tz);scene.add(G);
    box(L(0xd9d2c4),5.5,2.6,6.5,-0.2,1.5,3.6,G);box(L(0x4a5560),6,0.2,5,0,2.5,-1.6,G);for(const x of[-2.7,2.7])box(poleMat,0.1,2.4,0.1,x,1.2,-3.9,G);
    gar={e,s0,phase:0,cool:0,t:0,n:null};}
  bikeNpc.veh=makeVehicle('bike');bikeNpc.n={veh:bikeNpc.veh,hl:0.85,wid:0.6,x:0,z:0,hx:1,hz:0,v:0,s:0};
  moto={veh:makeVehicle('moto'),on:false,s:0,v:0,cool:0,phase:0,flag:false};moto.veh.G.visible=false;
  for(const k of['ambulance','police','fire']){emVeh[k]=makeVehicle(k);emVeh[k].G.visible=false;}
}
function parkGarage(){const e=gar.e,q=edgePos(e,gar.s0,-e.w-5.2),n=gar.n;n.parked=true;n.e=e;n.dir=-1;n.s=gar.s0;n.u=-e.w-5.2;n.v=0;n.x=q.x;n.z=q.z;n.hx=q.tz;n.hz=-q.tx;n.sig=null;n.bez=null;n.next=null;n.mesh.position.set(q.x,q.y,q.z);n.mesh.rotation.y=yawOf(n.hx,n.hz);n.mesh.visible=true;gar.phase=0;}
function resetEvents(){if(!gar.n)gar.n=addNpc('car',{e:gar.e,dir:-1,s:gar.s0,k:0,vf:0.8,color:0x9c2f2f});parkGarage();gar.cool=0;tram.s=60;tram.dir=1;tram.v=0;tram.dwell=0;tram.done=-1;tram.turnT=0;
  child.on=false;child.G.visible=child.ball.visible=false;child.cool=0;moto.on=false;moto.veh.G.visible=false;moto.cool=0;if(emerg.veh)emerg.veh.G.visible=false;emerg={on:false,until:-99,cool:mode==='free'?40:0,n:emerg.n||0,nodes:MAINP.nodes,near:()=>false};evHint=null;bikeNpc.n.s=STP.cum[1]+30;bikeNpc.n.v=0;}
// solid obstacles and vehicles near the player, as flat list [x,z,hx,hz,halfLength,halfWidth]
const SOL=[],STATB=[];                                // STATB: parked vehicles as boxes
function solids(){SOL.length=0;const add=(x,z,hx,hz,hl,hw)=>{if(Math.abs(x-car.x)+Math.abs(z-car.z)<hl+14)SOL.push(x,z,hx,hz,hl,hw);};
  for(let i=0;i<STATB.length;i+=6)add(STATB[i],STATB[i+1],STATB[i+2],STATB[i+3],STATB[i+4],STATB[i+5]);
  for(const n of npcs)if(n.mesh.visible&&Math.abs(n.y-car.y)<3)add(n.x,n.z,n.hx,n.hz,n.hl,n.wid/2);const b=bikeNpc.n;add(b.x,b.z,b.hx,b.hz,0.85,0.3);
  if(tram.veh)add(tram.x,tram.z,tram.hx||1,tram.hz||0,6.5,1.15);if(moto.on)add(moto.x,moto.z,moto.hx,moto.hz,1,0.35);if(emerg.on)add(emerg.x,emerg.z,emerg.hx,emerg.hz,emerg.veh.hl,emerg.veh.wid/2);return SOL;}
// how deep the car (three circles along its length) is inside any obstacle at this pose; 0 = clear
function depthAt(x,z,a,S){const fx=Math.sin(a),fz=-Math.cos(a);let d=0;
  for(const k of[-1.35,0,1.35]){const px=x+fx*k,pz=z+fz*k;for(const o of OBST){const q=o.r+0.8-Math.hypot(px-o.x,pz-o.z);if(q>d)d=q;}
    for(let i=0;i<S.length;i+=6){const rx=px-S[i],rz=pz-S[i+1],q=Math.min(S[i+4]+0.8-Math.abs(rx*S[i+2]+rz*S[i+3]),S[i+5]+0.8-Math.abs(rx*S[i+3]-rz*S[i+2]));if(q>d)d=q;}}return d;}
function hitObst(x,z,a){const fx=Math.sin(a),fz=-Math.cos(a);for(const o of OBST)for(const k of[-1.5,0,1.5])if(Math.hypot(x+fx*k-o.x,z+fz*k-o.z)<o.r+0.75)return true;return false;}
function hitVehicle(veh,x,z,hx,hz){const rx=car.x-x,rz=car.z-z,al=rx*hx+rz*hz,lt=Math.abs(rx*hz-rz*hx);return Math.abs(al)<veh.hl+1.5&&lt<veh.wid/2+0.8;}
function pathSignalGap(p,s,hl){ // distance to the next red light on a path
  for(let k=0;k<p.ed.length;k++){const e=p.ed[k],n=e.b,g=p.cum[k+1]-(n.r+2.4)-s-hl;if(g>-1&&g<60&&n.ctrl==='sig'&&sigState(n,e)!=='g')return g;}return 1e9;}
function updateEvents(dt){
  evHint=null;const flash=Math.floor(time*2.7)%2===0,fx=Math.sin(car.a),fz=-Math.cos(car.a),drv=state==='drive',e=car.e;
  vehLights(brokenCar,false,'H',flash);
  if(drv&&e===obstZone.e&&car.dir===-1&&car.s>obstZone.s&&car.s<obstZone.s+48)evHint='hObst';
  // --- child
  if(drv&&e===child.e&&car.dir===1&&car.s<child.s)evHint='hSchool';
  if(!child.on){if(drv&&time>child.cool&&e===child.e&&car.dir===1&&child.s-car.s>13&&child.s-car.s<24&&car.v>1.5){child.on=true;child.t=0;child.cool=mode==='free'?time+75:1e9;}}
  else{child.t+=dt;const W=child.e.w,bu=W+0.6-5.2*child.t,cu=W+0.9-3.3*Math.max(0,child.t-0.5),b=edgePos(child.e,child.s+0.6,Math.max(bu,-W-1.5)),c=edgePos(child.e,child.s,cu);
    child.ball.visible=true;child.ball.position.set(b.x,b.y+0.07,b.z);child.G.visible=child.t>0.5;child.G.position.set(c.x,c.y+0.07,c.z);child.G.rotation.y=yawOf(c.tz,-c.tx)+Math.PI;
    if(child.G.visible&&cu>-W-0.2&&drv&&invuln<time&&Math.hypot(car.x+fx*1.3-c.x,car.z+fz*1.3-c.z)<1.35&&Math.abs(car.v)>0.4){invuln=time+4;car.v=0;violate('hitped');}
    if(cu<-W-2.5){child.on=false;child.G.visible=child.ball.visible=false;}}
  // --- cyclist along the left edge of 駅前通り
  {const b=bikeNpc.n,p=STP;let vt=4.2;const g=pathSignalGap(p,b.s,0.9);if(g<30)vt=Math.min(vt,g<0.3?0:Math.sqrt(3*g));
    const ps=pathS(p);if(ps!=null&&car.dir===1&&ps-b.s>1&&ps-b.s<9&&car.u>0.8)vt=Math.min(vt,Math.max(0,car.v-0.5));
    b.v+=clamp(vt-b.v,-5*dt,1.5*dt);b.s+=b.v*dt;if(b.s>p.len-12)b.s=8;const q=pathPos(p,b.s,ee=>ee.w-0.65);b.x=q.x;b.z=q.z;b.hx=q.tx;b.hz=q.tz;b.e=null;b.u=2.85;b.veh.G.position.set(q.x,q.y,q.z);b.veh.G.rotation.y=yawOf(q.tx,q.tz);
    if(drv){const rel=(car.x-b.x)*b.hx+(car.z-b.z)*b.hz,lt=Math.abs((car.x-b.x)*b.hz-(car.z-b.z)*b.hx);if(rel>-28&&rel<3&&lt<4.5&&fx*b.hx+fz*b.hz>0.5)evHint='hBike';
      if(Math.abs(rel)<2.6&&lt-1.15<0.8&&lt<3&&car.v>b.v+1.5)violate('sidegap');}}
  // --- motorcycle in the left-rear blind spot on 中央通り before 東本町
  const ms=pathS(MAINP),onMain=ms!=null&&car.dir===1,sA4=MAINP.cum[5];
  if(!moto.on){if(drv&&time>moto.cool&&onMain&&ms>sA4-150&&ms<sA4-120&&car.v>3&&!emerg.on){moto.on=true;moto.s=ms-11;moto.v=car.v;moto.phase=0;moto.flag=false;moto.pu=car.u;moto.cool=mode==='free'?time+90:1e9;moto.veh.G.visible=true;}}
  else{const m=moto,rel=m.s-(ms==null?-999:ms);let vt;if(m.phase===0){vt=clamp(car.v+((ms||0)-5.2-m.s)*1.6,0,17);if(!onMain||ms>sA4-48)m.phase=1;}else vt=Math.max(Math.abs(car.v)+4,10);
    const g=pathSignalGap(MAINP,m.s,1);if(g<40)vt=Math.min(vt,g<0.3?0:Math.sqrt(4.4*g));if(onMain&&car.u>3.3&&rel<-1.5&&rel>-14)vt=Math.min(vt,Math.max(0,car.v-1));
    const br=vt<m.v-0.05;m.v+=clamp(vt-m.v,-7*dt,3.2*dt);m.s+=m.v*dt;const q=pathPos(MAINP,m.s,6.05);m.x=q.x;m.z=q.z;m.hx=q.tx;m.hz=q.tz;m.veh.G.position.set(q.x,q.y,q.z);m.veh.G.rotation.y=yawOf(q.tx,q.tz);vehLights(m.veh,br,null,flash);
    if(drv&&onMain&&m.phase===0)evHint='hMoto';
    if(drv&&onMain&&!m.flag&&m.pu<=3.4&&car.u>3.4&&rel>-9&&rel<1.5){m.flag=true;violate('makikomi');}m.pu=car.u;
    if(m.s>MAINP.len-6){m.on=false;m.veh.G.visible=false;}}
  // --- emergency vehicle coming up from behind on 中央通り
  if(!emerg.on){const sA2=MAINP.cum[2],trig=mode==='course'?(ms>sA2+24&&ms<sA2+44):(time>emerg.cool&&ms>120&&ms<MAINP.len-260);
    if(drv&&onMain&&trig&&car.v>3&&!moto.on){const kind=['ambulance','police','fire'][emerg.n%3];emerg={on:true,veh:emVeh[kind],kind,s:Math.max(2,ms-88),v:15,u:1.75,ut:1.75,block:0,flag:false,n:emerg.n+1,until:0,sirT:0,nodes:MAINP.nodes};
      emerg.near=n=>{const k=MAINP.ed.indexOf(n.e);if(k<0)return false;const r=MAINP.cum[k]+n.s-emerg.s;return r>-6&&r<95;};emerg.veh.G.visible=true;}}
  else{const em=emerg,rel=(ms==null?-999:ms)-em.s;let vt=16.5;
    if(onMain&&rel>0&&rel<45&&Math.abs(car.u-em.u)<2.1){vt=Math.min(vt,Math.max(Math.abs(car.v),Math.sqrt(6*Math.max(0,rel-9))));if(rel<18){em.block+=dt;if(em.block>3.5){em.ut=-1.75;if(!em.flag){em.flag=true;violate('emerg');}}}}
    em.u+=clamp(em.ut-em.u,-2*dt,2*dt);em.v+=clamp(vt-em.v,-8*dt,3*dt);em.s+=em.v*dt;const q=pathPos(MAINP,em.s,em.u);em.x=q.x;em.z=q.z;em.hx=q.tx;em.hz=q.tz;em.veh.G.position.set(q.x,q.y,q.z);em.veh.G.rotation.y=yawOf(q.tx,q.tz);vehLights(em.veh,vt<em.v-0.1,null,flash);
    const dist=Math.hypot(car.x-q.x,car.z-q.z);if(drv&&onMain&&rel>-10&&rel<110)evHint='hEmerg';
    em.sirT-=dt;if(em.sirT<=0){em.sirT=0.55;if(drv&&dist<170)beep(Math.floor(time/0.55)%2?960:770,0.5,0.05*Math.max(0.15,1-dist/170),'sine');}
    if(em.s>MAINP.len-4||rel<-160){em.veh.G.visible=false;emerg={on:false,until:time,cool:time+110,n:em.n,nodes:MAINP.nodes,near:()=>false};}}
  vehLights(PAinfo.truck,false,'H',flash);
  // --- car pulling out of a driveway in front of the player
  {const g=gar,n=g.n,e=g.e;if(g.phase===0){if(drv&&e===car.e&&car.dir===-1&&car.s-g.s0>0&&car.s-g.s0<70)evHint='hGarage';
      if(drv&&time>g.cool&&e===car.e&&car.dir===-1&&car.s-g.s0>36&&car.s-g.s0<50&&car.v>3){g.phase=1;g.t=0;n.sig='L';const p0=edgePos(e,g.s0,-e.w-5.2),p2=edgePos(e,g.s0-9,-e.w/2),c=edgePos(e,g.s0-0.5,-e.w/2-0.6);g.b=[p0,c,p2];}}
    else if(g.phase===1){g.t+=dt*0.36;const t=Math.min(1,g.t),a=1-t,[p0,c,p2]=g.b;n.x=a*a*p0.x+2*a*t*c.x+t*t*p2.x;n.z=a*a*p0.z+2*a*t*c.z+t*t*p2.z;const hx=2*a*(c.x-p0.x)+2*t*(p2.x-c.x),hz=2*a*(c.z-p0.z)+2*t*(p2.z-c.z),m=Math.hypot(hx,hz);n.hx=hx/m;n.hz=hz/m;n.mesh.position.set(n.x,p2.y,n.z);n.mesh.rotation.y=yawOf(n.hx,n.hz);
      if(t>=1){n.parked=false;n.s=g.s0-9;n.u=n.ut=-e.w/2;n.v=3;g.phase=2;g.cool=mode==='free'?time+80:1e9;}}
    else if(time>g.cool&&Math.hypot(n.x-car.x,n.z-car.z)>230&&Math.hypot(edgePos(e,g.s0,0).x-car.x,edgePos(e,g.s0,0).z-car.z)>230)parkGarage();}
  // --- tram
  {const t=tram,p=TRAMP,hl=t.veh.hl;let vt=8.5;
    if(t.turnT>0){t.turnT-=dt;vt=0;if(t.turnT<=0)t.dir=-t.dir,t.done=-1;}
    else if(t.dwell>0){t.dwell-=dt;vt=0;}
    else{for(let k=0;k<2;k++){const q=t.dir>0?k:1-k;if(t.done===q)continue;const g=(t.stops[q]-t.s)*t.dir;if(g>-1&&g<60){vt=Math.min(vt,g<0.4?0:Math.sqrt(2.4*g));if(g<0.4&&t.v<0.1){t.dwell=11;t.stop=q;t.done=q;}break;}}
      const end=t.dir>0?p.len-10-t.s:t.s-10;if(end<40)vt=Math.min(vt,end<0.4?0:Math.sqrt(2.4*end));if(end<0.4&&t.v<0.1)t.turnT=7;
      for(let k=0;k<p.ed.length;k++){const n=t.dir>0?p.ed[k].b:p.ed[k].a,ns=t.dir>0?p.cum[k+1]:p.cum[k],g=(ns-t.s)*t.dir-(n.r+2.4)-hl;if(g>-1&&g<50&&n.ctrl==='sig'&&sigState(n,p.ed[k])!=='g')vt=Math.min(vt,g<0.4?0:Math.sqrt(2.4*g));}
      const ps=pathS(p);if(ps!=null&&Math.abs(car.u-t.dir*1.3)<1.7){const g=(ps-t.s)*t.dir-hl-2.4;if(g>-1&&g<26){vt=Math.min(vt,g<1?0:Math.sqrt(2.4*g));if(drv&&g<14&&Math.floor(time*2)%2===0&&t.bell!==Math.floor(time*2)){t.bell=Math.floor(time*2);beep(1250,0.12,0.04,'triangle');}}}}
    t.v+=clamp(vt-t.v,-2.2*dt,0.9*dt);t.s+=t.dir*t.v*dt;const q=pathPos(p,t.s,t.dir*1.3);t.x=q.x;t.z=q.z;t.hx=q.tx*t.dir;t.hz=q.tz*t.dir;t.e=q.e;t.es=q.es;t.veh.G.position.set(q.x,q.y,q.z);t.veh.G.rotation.y=yawOf(q.tx*t.dir,q.tz*t.dir);vehLights(t.veh,t.v<0.3,null,flash);
    // passengers walk between the pavement and the tram at the stop without an island
    const boarding=t.dwell>0&&t.stop===1;t.pax.forEach((G,k)=>{G.visible=boarding;if(boarding){const ph=clamp((11-t.dwell-1-k*1.2)/4,0,1),W=t.e.w,u=t.dir*lerp(W+1.4,2.7,k===1?1-ph:ph),a=pathPos(p,t.s+(k-1)*2.6,u);G.position.set(a.x,a.y+0.08,a.z);G.rotation.y=yawOf(a.tz,-a.tx);G.umb.visible=env.weather!=='clear';
        if(drv&&invuln<time&&Math.abs(u)<W-0.6&&Math.hypot(car.x+fx*1.3-a.x,car.z+fz*1.3-a.z)<1.3&&Math.abs(car.v)>0.4){invuln=time+4;car.v=0;violate('hitped');}}});
    const ps=pathS(p);if(drv&&ps!=null&&car.dir===t.dir&&Math.abs(car.u)>2.3){const rel=(ps-t.s)*t.dir;
      if(t.dwell>0&&t.stop===1){if(rel<-hl&&rel>-hl-45)evHint='hTramStop';if(t.prel!=null&&t.prel<=-hl-1.5&&rel>-hl-1.5&&car.v>0.5)violate('tramstop');}
      else if(t.dwell>0&&t.stop===0){if(rel<hl+3&&rel>-hl-40)evHint='hTramIsland';if(Math.abs(rel)<hl+3&&Math.abs(car.v)*3.6>17)violate('tramslow');}
      t.prel=rel;}else t.prel=null;
}
}
