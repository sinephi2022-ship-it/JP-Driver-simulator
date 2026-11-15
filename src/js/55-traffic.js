/* ---------- traffic on the road network ---------- */
// lateral offset (in the a→b frame) of lane k for travel direction dir
const lanesOf=(e,dir)=>e.oneway?e.lanes:dir>0?(e.lf||e.lanes):(e.lb||e.lanes);
function laneU(e,dir,k){if(e.oneway)return e.w-(k+0.5)*e.w/e.lanes*2;const c=e.c||0,inner=e.inner||0,span=(dir>0?e.w-c:e.w+c)-inner;return c+dir*(inner+(k+0.5)*span/lanesOf(e,dir));}
function placeNpc(n){const q=edgePos(n.e,n.s,n.u);n.x=q.x;n.z=q.z;n.y=q.y;n.hx=q.tx*n.dir;n.hz=q.tz*n.dir;n.mesh.position.set(q.x,q.y,q.z);n.mesh.rotation.y=yawOf(n.hx,n.hz);}
function addNpc(kind,o){const veh=makeVehicle(kind,o.color!=null?o.color:VEH_COL[npcs.length%VEH_COL.length]);veh.G.rotation.order='YXZ';
  const n=Object.assign({kind,veh,mesh:veh.G,len:veh.len,hl:veh.hl,wid:veh.wid,v:0,k:0},o);n.init={e:n.e,dir:n.dir,s:n.s,k:n.k};npcs.push(n);resetNpc(n);return n;}
function resetNpc(n){Object.assign(n,n.init);n.u=n.ut=laneU(n.e,n.dir,n.k);n.v=n.e.kind==='hw'?(n.vmaxF||20)*0.9:0;n.next=null;n.bez=null;n.wait=0;n.cleared=null;n.sig=null;n.brake=false;n.ovT=0;n.served=null;n.dwell=0;n.sigT=0;placeNpc(n);}
const drivable=e=>!e.quiet&&e.kind!=='ramp';
function spawnTraffic(R){
  const pool=ED.filter(e=>drivable(e)&&e.kind!=='hw'&&e.len>70&&!e.toll);let c=0;
  for(const e of pool){const cnt=e.kind==='main'?2:e.kind==='mount'||e.kind==='rural'?(e.len>600?2:1):1;for(const dir of e.oneway?[1]:[1,-1])for(let q=0;q<cnt;q++){if(e.key==='S0-S1'&&dir>0)continue;if(e.closedDir===dir)continue;if(R()<0.28&&e.kind!=='main')continue;
      const kind=e.kind==='main'&&q===1&&dir>0?'truck':R()<0.28?'van':'car';addNpc(kind,{e,dir,s:e.len*(0.2+0.6*((q+R()*0.6)/cnt)),k:e.kind==='main'?0:lanesOf(e,dir)-1,vf:kind==='truck'?0.8:0.82+R()*0.14});c++;}}
  for(const [key,sf] of[['A1-A2',0.5],['A3-A4',0.4]]){const e=EK[key];addNpc('bus',{e,dir:1,s:e.len*sf,k:1,vf:0.7});addNpc('bus',{e,dir:-1,s:e.len*sf,k:1,vf:0.7});}
  for(const e of ED)if(e.kind==='hw')[[0.12,'car',25],[0.3,'truck',22],[0.46,'van',26],[0.62,'car',24.5],[0.8,'truck',22.5],[0.22,'car',29],[0.7,'car',30]].forEach((q,i)=>addNpc(q[1],{e,dir:1,s:e.len*q[0],k:i>4?1:0,vmaxF:q[2]}));
}
function pickNext(n){const node=n.dir>0?n.e.b:n.e.a,opts=[];
  for(const f of node.ed){if(f===n.e||!drivable(f)&&!f.toll)continue;const fd=f.a===node?1:-1;if(f.oneway&&fd<0||f.closedDir===fd)continue;const tc=turnClass(node,n.e,f);if(tc==='U')continue;
    if(n.kind==='bus'&&(f.kind!=='main'||tc!=='S'))continue;if((n.kind==='truck'||n.kind==='bus')&&(f.kind==='narrow1'||f.kind==='hill'))continue;
    let w=tc==='S'?3:tc==='L'?1.4:(node.ctrl==='sig'&&node.ed.length>3?0:0.8);if(f.kind==='hw'||f.toll)w*=0.5;if(w>0)opts.push([f,fd,tc,w]);}
  if(!opts.length)return null;let t=Math.random()*opts.reduce((a,b)=>a+b[3],0);for(const o of opts){t-=o[3];if(t<=0)return{e:o[0],dir:o[1],tc:o[2],node};}return{e:opts[0][0],dir:opts[0][1],tc:opts[0][2],node};}
function respawn(n){for(let q=0;q<20;q++){const e=ED[Math.floor(Math.random()*ED.length)];if(!drivable(e)||e.kind==='hw'||e.toll||e.len<70)continue;const dir=e.oneway?1:(Math.random()<0.5?1:-1);if(e.closedDir===dir)continue;const s=e.len*(0.3+Math.random()*0.4),p=edgePos(e,s,0);if(Math.hypot(p.x-car.x,p.z-car.z)<260)continue;
    if(npcs.some(o=>o!==n&&o.e===e&&o.dir===dir&&Math.abs(o.s-s)<25))continue;n.e=e;n.dir=dir;n.s=s;n.k=n.kind==='bus'&&e.kind==='main'?1:e.kind==='main'?0:lanesOf(e,dir)-1;n.u=n.ut=laneU(e,dir,n.k);n.v=0;n.next=null;n.bez=null;n.cleared=null;return;}}
function laneFree(n,u,back,front){for(const o of npcs)if(o!==n&&o.e===n.e&&!o.bez&&Math.abs(o.u-u)<1.7){const rel=(o.s-n.s)*n.dir;if(rel>-back&&rel<front)return false;}
  if(car.e===n.e&&Math.abs(car.u-u)<2.2){const rel=(car.s-n.s)*n.dir;if(rel>-back-6&&rel<front+4)return false;}return true;}
function updateTraffic(dt){
  ped.npcThreat=false;const flash=Math.floor(time*2.7)%2===0,active=state!=='menu';
  for(const n of npcs){if(n.parked){vehLights(n.veh,false,n.sig,flash);continue;}
    const e=n.e,hwy=e.kind==='hw',lim=(n.vmaxF||e.limit/3.6*(n.vf||0.85))*env.npcCap;
    // far from the player: keep moving cheaply, skip the detailed logic for most frames
    const pd=Math.abs(n.x-car.x)+Math.abs(n.z-car.z);n.mesh.visible=pd<420;
    let g=1e9,cap=lim,sig=null;const node=n.dir>0?e.b:e.a,D=n.dir>0?e.len-n.s:n.s;
    if(!n.bez){
      if(node.r>0||node.ed.length!==2){if(!n.next&&D<60)n.next=pickNext(n)||{dead:true};
        const gg=D-(node.r+2.4)-n.hl;
        if(gg>-1){if(node.ctrl==='sig'){const st=sigState(node,e);if(st==='r'||(st==='y'&&gg>n.v*n.v/5))g=Math.min(g,gg);}
          else if(node.ctrl==='stop'&&node.stops.includes(e.key)&&n.cleared!==node){g=Math.min(g,gg);if(n.v<0.15&&gg<1.5){n.wait+=dt;let clear=n.wait>1.2;
              if(clear)for(const o of npcs)if(o!==n&&o.e!==e&&o.v>1&&Math.hypot(o.x-node.x,o.z-node.z)<24){clear=false;break;}
              if(clear&&car.e!==e&&Math.abs(car.v)>1&&Math.hypot(car.x-node.x,car.z-node.z)<22)clear=false;if(clear){n.cleared=node;n.wait=0;}}}}
        if(n.next&&!n.next.dead){if(n.next.tc!=='S'){sig=n.next.tc;if(D<node.r+16)cap=Math.min(cap,4.8);}else if(node.r>0&&D<node.r+10)cap=Math.min(cap,9);}
        else if(n.next&&n.next.dead&&D<30)cap=Math.min(cap,5);}
      else if(D<1.5){const f=node.ed[0]===e?node.ed[1]:node.ed[0],fd=f.a===node?1:-1;if(f.oneway&&fd<0||!drivable(f)&&!f.toll)n.next={dead:true};else{n.e=f;n.dir=fd;n.s=fd>0?0.01:f.len-0.01;n.k=f.kind==='main'||f.oneway?Math.min(n.k,lanesOf(f,fd)-1):lanesOf(f,fd)-1;n.u=n.ut=laneU(f,fd,n.k);continue;}}
      if(tram.dwell>0&&tram.stop===1&&e===tram.e&&n.dir===tram.dir){const rel=(tram.es-n.s)*n.dir-tram.veh.hl-n.hl-2.5;if(rel>-1)g=Math.min(g,rel);}
      if(n.kind==='bus')for(const f of e.feat)if(f.t==='bus'&&f.dir===n.dir&&n.served!==f){const rel=(f.s-n.s)*n.dir-n.hl;if(rel<-1)continue;g=Math.min(g,rel);if(rel<32)sig='L';if(n.v<0.1&&rel<1.3){sig='H';n.dwell=(n.dwell||0)+dt;if(n.dwell>5.5){n.served=f;n.dwell=0;n.sigT=time+3.5;}}}
      if(n.sigT>time)sig='R';
      for(const f of e.feat){const rel=(f.s-n.s)*n.dir-n.hl;if(f.t==='rail'&&rail.alarm&&rel-4.5>-1)g=Math.min(g,rel-4.5);if(f.t==='xwalk'&&ped.state!=='away'&&rel-3.5>-1){g=Math.min(g,rel-3.5);if(rel<30&&n.v>0.4)ped.npcThreat=true;}if(f.t==='toll'&&rel>0&&rel<25)cap=Math.min(cap,5.5);}
    }
    // vehicle ahead: same lane by distance along the road, and anything in the box straight ahead
    let lead=null,gap=1e9,lv=0;
    if(pd<520){for(const o of npcs){if(o===n)continue;if(o.e===e&&o.dir===n.dir&&!o.bez&&!n.bez){if(Math.abs(o.u-n.u)<1.6){const q=(o.s-n.s)*n.dir-o.hl-n.hl;if(q>-2&&q<gap){gap=q;lead=o;lv=o.v;}}continue;}
        const rx=o.x-n.x,rz=o.z-n.z,al=rx*n.hx+rz*n.hz;if(al>0&&al<26*env.sight&&Math.abs(rx*n.hz-rz*n.hx)<1.6&&o.hx*n.hx+o.hz*n.hz>0.2&&Math.abs(o.y-n.y)<3){const q=al-o.hl-n.hl;if(q<gap){gap=q;lead=o;lv=o.v;}}}}
    const rx=car.x-n.x,rz=car.z-n.z,along=rx*n.hx+rz*n.hz,lat=Math.abs(rx*n.hz-rz*n.hx);
    if(along>0&&along<(hwy?75:40)*env.sight&&lat<n.wid/2+1.2&&Math.abs(car.y-n.y)<3){const q=along-n.hl-2.3;if(q<gap){gap=q;lead=car;lv=Math.abs(car.v);}}
    {const b=bikeNpc.n,bx=b.x-n.x,bz=b.z-n.z,al=bx*n.hx+bz*n.hz;if(al>0&&al<26&&Math.abs(bx*n.hz-bz*n.hx)<1.9&&b.hx*n.hx+b.hz*n.hz>0.2){const q=al-b.hl-n.hl;if(q<gap){gap=q;lead=b;lv=b.v;}}}
    if(lead===bikeNpc.n){n.ut=laneU(e,n.dir,0)-n.dir*1.2;if(gap<14&&Math.abs(n.u-n.ut)<0.5){lead=null;gap=1e9;}else cap=Math.min(cap,6);}
    else if(hwy&&!n.bez){const works=e===PAinfo.nb&&n.s>PAinfo.works[0]-90&&n.s<PAinfo.works[1]+15,L0=laneU(e,1,0),L1=laneU(e,1,1),inR=n.k===1;
      if(works){n.k=1;}else if(!inR&&n.kind!=='truck'&&lead&&gap<16+n.v*1.1&&lv<lim-2&&!(n.s>e.tun[0]-60&&n.s<e.tun[1])&&n.s<e.len-300&&laneFree(n,L1,26,45)){n.ovT+=dt;if(n.ovT>0.8){n.k=1;n.ovT=0;}}
      else if(inR&&Math.abs(n.u-L1)<0.3&&laneFree(n,L0,22+n.v*0.5,55)){n.ovT+=dt;if(n.ovT>1.5){n.k=0;n.ovT=0;}}else n.ovT=0;
      n.ut=n.k?L1:L0;if(n.s>e.len-260)cap=Math.min(cap,Math.max(8,(e.len-n.s)/9));}
    else if(!n.bez)n.ut=(emerg.on&&e.kind==='main'&&n.dir===1&&n.kind!=='bus'&&emerg.near(n))?laneU(e,n.dir,1):laneU(e,n.dir,n.k);
    if(lead)g=Math.min(g,gap-(hwy?4+n.v*0.7:2.5)-n.v*env.headway);
    if(!n.bez&&Math.abs(n.ut-n.u)>0.05){if(Math.abs(n.ut-n.u)>0.4)sig=(n.ut-n.u)*n.dir>0?'L':'R';n.u+=clamp(n.ut-n.u,-1.3*dt,1.3*dt);}
    if(n.bez)cap=Math.min(cap,n.bez.tc==='S'?9:4.8);
    const vt=g<0.2?0:Math.min(cap,Math.sqrt(2*env.npcDec*g)),heavy=n.kind==='truck'||n.kind==='bus';
    n.brake=vt<n.v-0.05||n.v<0.3;n.v=n.v<vt?Math.min(vt,n.v+(heavy?1.1:1.9)*env.grip*dt):Math.max(vt,n.v-7*env.grip*dt);n.sig=sig;
    if(n.bez){const b=n.bez;b.t+=n.v*dt/b.len;const t=Math.min(1,b.t),a=1-t;n.x=a*a*b.x0+2*a*t*b.cx+t*t*b.x2;n.z=a*a*b.z0+2*a*t*b.cz+t*t*b.z2;n.y=lerp(b.y0,b.y2,t);
      const hx=2*a*(b.cx-b.x0)+2*t*(b.x2-b.cx),hz=2*a*(b.cz-b.z0)+2*t*(b.z2-b.cz),m=Math.hypot(hx,hz)||1;n.hx=hx/m;n.hz=hz/m;n.mesh.position.set(n.x,n.y,n.z);n.mesh.rotation.y=yawOf(n.hx,n.hz);n.sig=b.tc==='S'?null:b.tc;
      if(b.t>=1){n.e=b.e;n.dir=b.dir;n.s=b.s;n.u=b.u;n.bez=null;n.next=null;n.cleared=null;}}
    else{n.s+=n.dir*n.v*dt;const D2=n.dir>0?e.len-n.s:n.s;
      if(D2<=Math.max(0.5,node.r)){const nx=n.next;if(!nx||nx.dead){if(D2<1){respawn(n);placeNpc(n);}}
        else{const f=nx.e,k=n.kind==='bus'?1:f.kind==='main'?0:f.oneway?Math.min(n.k,f.lanes-1):lanesOf(f,nx.dir)-1,u2=laneU(f,nx.dir,k),s2=nx.dir>0?node.r+0.5:f.len-node.r-0.5,p0=edgePos(e,n.s,n.u),p2=edgePos(f,s2,u2),h=Math.hypot(p2.x-p0.x,p2.z-p0.z)*0.55;
          n.bez={e:f,dir:nx.dir,s:s2,u:u2,tc:nx.tc,t:0,x0:p0.x,z0:p0.z,y0:p0.y,x2:p2.x,z2:p2.z,y2:p2.y,cx:(p0.x+p0.tx*n.dir*h+p2.x-p2.tx*nx.dir*h)/2,cz:(p0.z+p0.tz*n.dir*h+p2.z-p2.tz*nx.dir*h)/2,len:Math.max(3,Math.hypot(p2.x-p0.x,p2.z-p0.z)*1.08)};n.k=k;n.ut=u2;}}
      else placeNpc(n);}
    if(n.mesh.visible)vehLights(n.veh,n.brake,n.sig,flash);
    if(active&&along>-3&&along<n.hl+2.6&&lat<n.wid/2+1.0&&n.v>0.3&&Math.abs(car.y-n.y)<3){n.v=0;}
    // nose to nose with the player and nobody moving: back off a few metres so that neither is trapped
    if(active&&!n.bez&&along>0&&along<n.hl+4.5&&lat<n.wid/2+1.2&&Math.abs(car.v)<0.3&&n.v<0.1&&n.hx*Math.sin(car.a)-n.hz*Math.cos(car.a)<-0.3&&Math.abs(car.y-n.y)<3){n.faceT=(n.faceT||0)+dt;if(n.faceT>2.5&&n.faceT<8){n.s-=n.dir*1.1*dt;n.s=clamp(n.s,1,e.len-1);placeNpc(n);}}else n.faceT=0;                    // never drive into the player
  }
}
