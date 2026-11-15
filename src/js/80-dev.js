/* ---------- test driver (used by automated checks: follows the guidance and obeys the rules) ---------- */
let tramHold=null;
let autoOn=false,autoLog={stops:0},apPlan=null;
function autopilot(dt){
  const e=car.e,dir=car.dir||1;if(!e)return;if(car.gear!=='D'){car.gear='D';car.hb=false;}
  if(car.inNode&&apPlan&&apPlan.n===car.inNode||apPlan&&apPlan.f!==e&&Math.hypot(car.x-apPlan.n.x,car.z-apPlan.n.z)<apPlan.n.r+4){ // crossing a junction: aim along the planned exit
    const f=apPlan.f,fd=f.a===apPlan.n?1:-1,d=Math.hypot(car.x-apPlan.n.x,car.z-apPlan.n.z),rest=apPlan.n.r+5+(car.inNode?0:3),tp=edgePos(f,fd>0?rest:f.len-rest,f.oneway?laneU(f,1,0):laneU(f,fd,0));
    let err=Math.atan2(tp.x-car.x,-(tp.z-car.z))-car.a;while(err>Math.PI)err-=2*Math.PI;while(err<-Math.PI)err+=2*Math.PI;inp.steerA=clamp(err*2.4,-1,1);const v=Math.abs(car.v);inp.gas=v<(apPlan.tc==='S'?7:4)?0.6:0;inp.brake=v>(apPlan.tc==='S'?9:5.5)?0.4:0;
    for(const o of npcs){const rx=o.x-car.x,rz=o.z-car.z,al=rx*Math.sin(car.a)-rz*Math.cos(car.a),lt=Math.abs(rx*-Math.cos(car.a)-rz*Math.sin(car.a));if(al>0&&al<9&&lt<1.8){inp.gas=0;inp.brake=0.7;}}return;}
  if(apPlan&&apPlan.f===e)apPlan=null;
  const n=dir>0?e.b:e.a,D=dir>0?e.len-car.s:car.s,v=Math.abs(car.v);let lane=e.oneway?laneU(e,1,0):laneU(e,dir,0),vt=Math.min(e.limit,curLimit)/3.6*0.9,brake=false;
  if(obstZone.e===e&&dir===obstZone.dir&&car.s-obstZone.s<26&&car.s-obstZone.s>-10)lane=dir*-1.0;
  if(child.e===e&&dir===1&&child.s-car.s<26&&child.s-car.s>-9)lane=-0.3;
  const G=mode==='hw'?GOAL2:GOAL,goal=guide&&guide.wi>=guide.wp.length-1&&e===G.e;if(goal){lane=dir*(e.w/2+0.55);blink='L';}
  if(tram.dwell>0&&e===tram.e&&dir===tram.dir){const rel=(tram.es-car.s)*dir-tram.veh.hl-2.3;if(tram.stop===1&&rel>-1&&rel<40)tramHold=rel;else if(tram.stop===0&&Math.abs(rel+8)<16)vt=Math.min(vt,3.3);}
  // target point a little ahead, continuing on to the next edge through a junction
  const look=5+v*0.7;let tp;
  if(D-n.r>look||!trk||!trk.next||trk.next==='G'||n.r===0&&n.ed.length!==2){tp=edgePos(e,car.s+dir*Math.min(look,Math.max(1,D-0.5)),lane);}
  else{const f=trk.next,fd=f.a===n?1:-1,rest=look-(D-n.r)+n.r;tp=edgePos(f,fd>0?rest:f.len-rest,f.oneway?laneU(f,1,0):laneU(f,fd,0));}
  if(n.r===0&&n.ed.length===2&&D<look){const f=n.ed[0]===e?n.ed[1]:n.ed[0],fd=f.a===n?1:-1,rest=look-D;tp=edgePos(f,fd>0?rest:f.len-rest,f.oneway?laneU(f,1,0):laneU(f,fd,0));}
  let err=Math.atan2(tp.x-car.x,-(tp.z-car.z))-car.a;while(err>Math.PI)err-=2*Math.PI;while(err<-Math.PI)err+=2*Math.PI;inp.steerA=clamp(err*2.2,-1,1);
  vt=Math.min(vt,Math.max(3,9-Math.abs(err)*14));
  // junction control
  if(n.r>0&&trk&&trk.next&&trk.next!=='G'&&D<n.r+25)apPlan={n,f:trk.next,tc:trk.act};
  if(n.r>0&&trk){const g=D-FRONT-(n.r+2.4),st=n.ctrl==='sig'?sigState(n,e):null,must=n.ctrl==='stop'&&n.stops.includes(e.key)&&!trk.stopped;
    if(trk.act==='L'||trk.act==='R'){if(g<50&&g>-2)blink=trk.act;if(g<14)vt=Math.min(vt,4.5);}
    if(g>-0.3&&g<40&&((st&&st!=='g'&&!(st==='y'&&g<4))||must)){vt=Math.min(vt,g<1.2?0:Math.sqrt(2*2.2*(g-1)));if(g<1.2)brake=true;}}
  for(const f of e.feat){const rel=(f.s-car.s)*dir;if(f.t==='rail'){const q=ft[e.i+f.t+f.s+dir],g=rel-FRONT-4.5;if(g>-0.3&&g<30&&(rail.alarm||!(q&&q.stopped))){vt=Math.min(vt,g<1.2?0:Math.sqrt(4.4*(g-1)));if(g<1.2)brake=true;}}
    if(f.t==='xwalk'&&ped.state!=='away'){const g=rel-FRONT-3.5;if(g>-0.3&&g<30){vt=Math.min(vt,g<1.2?0:Math.sqrt(4.4*(g-1)));if(g<1.2)brake=true;}}
    if(f.t==='toll'&&rel>-2&&rel<40)vt=Math.min(vt,5);}
  if(child.on)brake=true;if(tramHold!=null){vt=Math.min(vt,tramHold<3?0:Math.sqrt(4*(tramHold-3)));if(tramHold<3)brake=true;tramHold=null;}
  if(gar.n&&gar.phase===1&&e===gar.e&&dir===-1&&car.s-gar.n.s<26&&car.s>gar.n.s-4)vt=Math.min(vt,2);
  // traffic ahead
  for(const o of npcs){const rx=o.x-car.x,rz=o.z-car.z,al=rx*Math.sin(car.a)-rz*Math.cos(car.a),lt=Math.abs(rx*-Math.cos(car.a)-rz*Math.sin(car.a));if(al>0&&al<12+v*1.6&&lt<1.7){const g=al-o.hl-2.3-3;vt=Math.min(vt,g<0.5?0:Math.sqrt(4*g)+o.v*0.5);}}
  if(goal&&dir===G.dir&&car.s*dir>((G.s0+G.s1)/2)*dir-1&&car.s>G.s0&&car.s<G.s1){brake=true;vt=0;if(v<0.1){car.gear='P';car.hb=true;}}
  if(emerg.on&&e.kind==='main'){lane=dir*5.25;}
  inp.gas=!brake&&v<vt?0.8:0;inp.brake=brake||v>vt+1.2?(v>vt+3?0.8:0.45):0;if(brake&&v<0.2)autoLog.stops++;
}
