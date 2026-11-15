/* ---------- traffic ---------- */
const CLOSED=new Set(['h,0,-1']);                      // 桜通り westbound is blocked by the broken-down car: no through traffic
function endsFor(axis,idx,dir){const max=(axis==='h'?MAXX:MAXZ)+E+50,lo=(axis==='v'&&idx===3)?-100:-E-50;return dir>0?[lo,max]:[max,lo];}
function placeNpc(n){const l=leftOf(n.d);n.x=n.axis==='h'?n.s:n.line+l[0]*n.lane;n.z=n.axis==='h'?n.line+l[1]*n.lane:n.s;n.hx=DV[n.d][0];n.hz=DV[n.d][1];n.mesh.position.set(n.x,0,n.z);n.mesh.rotation.y=yawFor(n.d);}
function addNpc(kind,o){const veh=makeVehicle(kind,o.color!=null?o.color:VEH_COL[npcs.length%VEH_COL.length]);
  const n=Object.assign({kind,veh,mesh:veh.G,len:veh.len,hl:veh.hl,wid:veh.wid,v:0,grid:true,lane:1.75},o);
  n.d=n.axis==='h'?(n.dir>0?1:3):(n.dir>0?2:0);if(n.line==null)n.line=n.idx*S;if(!n.ends)n.ends=endsFor(n.axis,n.idx,n.dir);
  n.init={axis:n.axis,idx:n.idx,dir:n.dir,d:n.d,ends:n.ends,line:n.line,vmax:n.vmax,s:n.s,lane:n.lane};npcs.push(n);resetNpc(n);return n;}
function resetNpc(n){Object.assign(n,n.init);n.base=n.lane;n.v=n.grid?0:n.vmax;n.cleared=null;n.wait=0;n.turn=null;n.plan=null;n.sig=null;n.brake=false;n.stops=0;n.dwell=0;n.sigT=0;n.ovT=0;placeNpc(n);}
function spawnTraffic(R){
  const roads=[];for(let j=0;j<ROWS;j++)roads.push(['h',j]);for(let i=0;i<COLS;i++)roads.push(['v',i]);
  roads.forEach(([ax,idx],ri)=>{const span=(ax==='h'?MAXX:MAXZ)+2*E+100,main=ax==='h'&&idx===1;for(const dir of[1,-1]){if(CLOSED.has(ax+','+idx+','+dir))continue;
    (main?[0.08,0.4,0.72]:[0.18,0.68]).forEach((f,q)=>{let s=-E-50+span*((f+ri*0.137+(dir>0?0:0.31))%1);if(ax==='h'&&idx===2&&dir>0&&Math.abs(s+45)<50)s+=130;if(ax==='v'&&idx===3)s=Math.max(s,-60);
      const kind=(main&&q===1)||(ax==='v'&&idx===0&&q===0)?'truck':R()<0.3?'van':'car';
      addNpc(kind,{axis:ax,idx,dir,s,vmax:limitOf(ax,idx)/3.6*(kind==='truck'?0.8:0.82+R()*0.14)});});
    if(main)addNpc('bus',{axis:ax,idx,dir,s:dir>0?-90:MAXX+95,lane:5.25,vmax:10});}});
  bikeNpc=addNpc('bike',{axis:'h',idx:2,dir:1,s:18,lane:2.85,vmax:4.2});
  // expressway: northbound 走行車線 / 追越車線, plus the opposite carriageway
  const N=[HW.portal-2,HW.end],Sd=[HW.end,HW.portal-2];
  [[-330,25,'car'],[-700,22,'truck'],[-1050,26,'van'],[-1400,24.5,'car'],[-1780,22.5,'truck'],[-2150,26,'car'],[-520,29,'car'],[-1250,30,'car'],[-2380,28,'car']].forEach(q=>addNpc(q[2],{grid:false,axis:'v',idx:3,line:X0,dir:-1,s:q[0],lane:-1.75,vmax:q[1],ends:N}));
  [[-300,26,14.75,'car'],[-800,23,14.75,'truck'],[-1200,29,11.25,'car'],[-1600,26,14.75,'van'],[-2000,25,14.75,'car'],[-2400,29,11.25,'car']].forEach(q=>addNpc(q[3],{grid:false,opp:true,axis:'v',idx:3,line:X0,dir:1,s:q[0],lane:q[2],vmax:q[1],ends:Sd}));
}
function startTurn(n,node){const p=n.plan,d=DV[n.d],l=leftOf(n.d),ed=ext(node,n.axis),el=ext(node,p.nax);
  n.turn={th:0,cx:node.i*S-d[0]*(ed+2)+l[0]*(el+2),cz:node.j*S-d[1]*(ed+2)+l[1]*(el+2),rl:el+2-n.lane,rd:ed+2-1.75,d,l,yaw0:yawFor(n.d)};}
// is the lane beside vehicle n free? (lane = lateral offset on the same carriageway; player counts as a vehicle)
function laneFree(n,lane,back,front){
  for(const o of npcs)if(o!==n&&!o.grid===!n.grid&&o.axis===n.axis&&o.line===n.line&&o.dir===n.dir&&Math.abs(o.lane-lane)<1.7){const rel=(o.s-n.s)*n.dir;if(rel>-back&&rel<front)return false;}
  const l=leftOf(n.d),px=n.axis==='h'?n.s:n.line+l[0]*lane,pz=n.axis==='h'?n.line+l[1]*lane:n.s,rx=car.x-px,rz=car.z-pz,al=rx*n.hx+rz*n.hz,lt=Math.abs(rx*n.hz-rz*n.hx);
  return !(lt<2.6&&al>-back-6&&al<front+4);
}
function updateTraffic(dt){
  ped.npcThreat=false;const flash=Math.floor(time*2.7)%2===0;
  for(const n of npcs){
    let g=1e9,cap=n.vmax,latT=n.base,sig=null;
    if(n.grid&&!n.turn){const cnt=n.axis==='h'?COLS:ROWS;
      for(let k=0;k<cnt;k++){const node=n.axis==='h'?nodes[k+','+n.idx]:nodes[n.idx+','+k],sl=SLd(node,n.axis),gg=(k*S-n.dir*sl-n.s)*n.dir-n.hl;if(gg<-1)continue;
        if(node.type==='sig'){const st=sigState(node,n.axis);if(st==='r'||(st==='y'&&gg>n.v*n.v/5))g=Math.min(g,gg);
          if((n.kind==='car'||n.kind==='van')&&gg<42&&(!n.plan||n.plan.k!==k)){const nd=(n.d+3)%4,nax=n.axis==='h'?'v':'h',nidx=nax==='h'?node.j:node.i,ndir=(nd===1||nd===2)?1:-1;
            const ok=gg>22&&!(n.axis==='h'&&n.idx===1)&&!CLOSED.has(nax+','+nidx+','+ndir)&&!(nax==='v'&&nidx===3&&ndir<0);n.plan={k,act:ok&&Math.random()<0.32?'L':'S',nd,nax,nidx,ndir};}
          if(n.plan&&n.plan.k===k&&n.plan.act==='L'){sig='L';if(gg<16)cap=Math.min(cap,4.6);if((n.s-(k*S-n.dir*(ext(node,n.axis)+2)))*n.dir>=0){startTurn(n,node);break;}}}
        else if(node.type===(n.axis==='h'?'sh':'sv')&&n.cleared!==k){g=Math.min(g,gg);
          if(n.v<0.15&&gg<1.5){n.wait+=dt;let clear=n.wait>1.2;const cx=node.i*S,cz=node.j*S;
            if(clear)for(const o of npcs)if(o.grid&&o.axis!==n.axis&&Math.hypot(o.x-cx,o.z-cz)<24){clear=false;break;}
            if(clear&&Math.hypot(car.x-cx,car.z-cz)<15&&(car.x-n.x)*n.hx+(car.z-n.z)*n.hz>0)clear=false;
            if(clear){n.cleared=k;n.wait=0;}}}}
      if(n.axis==='h'&&n.idx===2&&ped.state!=='away'){const gg=(XC-n.dir*3.5-n.s)*n.dir-n.hl;if(gg>-1){g=Math.min(g,gg);if(gg<28&&n.v>0.4)ped.npcThreat=true;}}
      if(n.axis==='v'&&rail.alarm){const gg=(ZR-n.dir*4.5-n.s)*n.dir-n.hl;if(gg>-1)g=Math.min(g,gg);}
      if(n.kind==='bus'){const st=BUS_STOPS[n.dir][n.stops];if(st!=null){const gg=(st-n.s)*n.dir-n.hl;if(gg<-1)n.stops++;else{g=Math.min(g,gg);if(gg<32)sig='L';if(n.v<0.1&&gg<1.2){sig='H';n.dwell+=dt;if(n.dwell>5){n.stops++;n.dwell=0;n.sigT=time+3.5;}}}}if(time<n.sigT)sig='R';}
      if(n.axis==='v'&&n.idx===3&&n.dir<0&&n.s<84&&n.s>52)latT=0.35;                 // steer round the van parked on 小学校通り
      if(emerg.on&&n.axis==='h'&&n.idx===1&&n.dir===emerg.dir&&n.kind!=='bus'){const rel=(n.s-emerg.s)*n.dir;if(rel>-6&&rel<95)latT=5.25;}
    }
    // vehicle ahead in the same lane; pass slower ones where it is allowed
    let lead=null,gap=1e9;
    for(const o of npcs)if(o!==n&&!o.grid===!n.grid&&o.axis===n.axis&&o.line===n.line&&o.dir===n.dir&&Math.abs(o.lane-n.lane)<1.6){const q=(o.s-n.s)*n.dir-o.hl-n.hl;if(q>-2&&q<gap){gap=q;lead=o;}}
    const rx=car.x-n.x,rz=car.z-n.z,along=rx*n.hx+rz*n.hz,lat=Math.abs(rx*n.hz-rz*n.hx);let pl=false;
    if(along>0&&along<70&&lat<n.wid/2+1.2){const q=along-n.hl-2.3;if(q<gap){gap=q;lead=car;pl=true;}}
    if(lead===bikeNpc&&n.grid&&n.kind!=='bike'){latT=0.55;if(gap<14&&Math.abs(n.lane-0.55)<0.5){lead=null;gap=1e9;}else cap=Math.min(cap,6);}     // give the cyclist room
    if(!n.grid&&!n.opp){const inL2=n.base<-3,works=n.s<HW.wA+75&&n.s>HW.wB-15,lv=lead?(pl?Math.abs(car.v):lead.v):99;
      if(works)latT=n.base=-5.25;
      else if(!inL2&&n.kind!=='truck'&&lead&&gap<16+n.v*1.1&&lv<n.vmax-2&&n.s<HW.mergeEnd-40&&!(n.s<HW.tunA+60&&n.s>HW.tunB)&&laneFree(n,-5.25,26,45)){n.ovT+=dt;if(n.ovT>0.8){n.base=-5.25;n.ovT=0;}}
      else if(inL2&&Math.abs(n.lane+5.25)<0.3&&laneFree(n,-1.75,22+n.v*0.5,55)){n.ovT+=dt;if(n.ovT>1.5){n.base=-1.75;n.ovT=0;}}else n.ovT=0;
      latT=n.base;}
    if(lead)g=Math.min(g,gap-(n.grid?2.5:4+n.v*0.7));
    if(Math.abs(latT-n.lane)>0.05){sig=latT>n.lane?'L':'R';n.lane+=clamp(latT-n.lane,-1.3*dt,1.3*dt);}
    if(n.turn)cap=Math.min(cap,4.6);
    const vt=g<0.2?0:Math.min(cap,Math.sqrt(2*2.2*g)),heavy=n.kind==='truck'||n.kind==='bus'||n.kind==='fire';
    n.brake=vt<n.v-0.05||n.v<0.3;n.v=n.v<vt?Math.min(vt,n.v+(heavy?1.1:1.9)*dt):Math.max(vt,n.v-7*dt);n.sig=sig;
    if(n.turn){const t=n.turn;t.th+=n.v/((t.rl+t.rd)/2)*dt;const c=Math.cos(t.th),s=Math.sin(t.th);
      n.x=t.cx-t.l[0]*t.rl*c+t.d[0]*t.rd*s;n.z=t.cz-t.l[1]*t.rl*c+t.d[1]*t.rd*s;const tx=t.l[0]*t.rl*s+t.d[0]*t.rd*c,tz=t.l[1]*t.rl*s+t.d[1]*t.rd*c,tm=Math.hypot(tx,tz);n.hx=tx/tm;n.hz=tz/tm;
      n.mesh.position.set(n.x,0,n.z);n.mesh.rotation.y=t.yaw0+t.th;n.sig='L';
      if(t.th>=Math.PI/2){const p=n.plan;n.axis=p.nax;n.idx=p.nidx;n.dir=p.ndir;n.d=p.nd;n.line=n.idx*S;n.lane=n.base=1.75;n.ends=endsFor(n.axis,n.idx,n.dir);n.s=n.axis==='h'?n.x:n.z;n.vmax=limitOf(n.axis,n.idx)/3.6*0.88;n.turn=null;n.plan=null;n.cleared=null;placeNpc(n);}}
    else{n.s+=n.dir*n.v*dt;if((n.s-n.ends[1])*n.dir>0){n.s=n.ends[0];n.cleared=null;n.plan=null;n.stops=0;if(n.grid){n.lane=n.base=n.kind==='bus'?5.25:n.kind==='bike'?2.85:1.75;}else if(!n.opp){n.lane=n.base=n.init.lane;}}placeNpc(n);}
    vehLights(n.veh,n.brake,n.sig,flash);
    if(state==='drive'&&invuln<time&&Math.abs(along)<n.hl+1.35&&lat<n.wid/2+0.8){invuln=time+4;car.v=0;violate('crash');}
  }
}
