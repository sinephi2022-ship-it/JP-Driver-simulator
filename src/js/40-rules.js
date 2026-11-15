/* ---------- rules ---------- */
function violate(id){
  if(state!=='drive'||(cool[id]||0)>time)return;cool[id]=time+4;
  const pts=PTS[id];violations.push({id,pts,t:time});score=Math.max(0,score-pts);
  const [name,tip]=T('r')[id],el=document.createElement('div');el.className='toast'+(pts?'':' crit');
  el.innerHTML='<span class="pt"></span><b></b>'+(hintsOn?'<p></p>':'');el.querySelector('.pt').textContent=pts?'−'+pts:T('stopTag');el.querySelector('b').textContent=name;if(hintsOn)el.querySelector('p').textContent=tip;
  const bx=$('toasts');bx.prepend(el);while(bx.children.length>3)bx.lastChild.remove();setTimeout(()=>el.remove(),5500);beep(pts?330:200,0.3,0.06,'sawtooth');
}
function note(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;$('toasts').prepend(el);setTimeout(()=>el.remove(),4000);}
let lastInstr='';
function setInstr(arrow,txt,dist){const k=arrow+txt+dist;if(k===lastInstr)return;lastInstr=k;$('iArrow').textContent=arrow;$('iTxt').textContent=txt;$('iDist').textContent=dist;}
let lastHint=null;function setHint(k){if(!hintsOn)k=null;if(k===lastHint)return;lastHint=k;$('hint').hidden=!k;if(k)$('hint').textContent=T(k);}
// --- guidance: a list of waypoint nodes; the next edge to take at a junction comes from the shortest route
let guide=null,gCache={k:'',v:null};
function setGuide(ids,name){guide=ids?{wp:ids.map(i=>ND[i]),wi:0,name}:null;gCache.k='';trk=null;lastInstr='';}
function setNav(nodeId,name){nav={name};setGuide([nodeId],name);note(T('navSet')(name));}
function clearNav(){nav=null;setGuide(null);}
function nextEdge(n,e,dir){ // edge to take after arriving at node n along (e,dir): an edge, 'G' at the destination, or null
  if(!guide)return null;const k=e.i+','+dir+','+guide.wi;if(gCache.k===k)return gCache.v;let v=null,wi=guide.wi;
  if(n===guide.wp[wi])wi++;if(wi>=guide.wp.length)v='G';else{const r=findRoute(e,dir,guide.wp[wi]);v=r&&r.length?r[0][0]:null;}
  gCache.k=k;gCache.v=v;return v;}
let tbT=0,tbFlag=false;
let sigSide=null,sigHold=0,laneId=null,laneCancel=0,busT=0,busFlag=false,rowEnterT=-99,owT=0,owFlag=false,ft={},hwS={gapT:0,slowT:0,passT:0,was:false,pa:false};
function speedCheck(dt){const kmh=Math.abs(car.v)*3.6;if(kmh>curLimit+2){overT+=dt;if(overT>1.2&&!overFlag){overFlag=true;violate('speed');}}else{overT=0;if(kmh<curLimit)overFlag=false;}}
function startHint(h){return h!=='hPark'&&Math.abs(car.v)<0.3&&(car.hb||car.gear==='P'||car.gear==='N')?'hStart':h;}
function rules(dt){
  if(blink!==sigSide){sigSide=blink;sigHold=0;}else sigHold+=dt;
  const e=car.e,dir=car.dir,fx=Math.sin(car.a),fz=-Math.cos(car.a),stopped=Math.abs(car.v)<0.25,kmh=Math.abs(car.v)*3.6;if(!e)return;
  let hint=env.weather!=='clear'?(env.wipers?'hWet':'hWiper'):null;if(env.night>0.6&&!env.lights)hint='hLight';
  const lat=car.u*dir,hwy=e.kind==='hw',ramp=e.kind==='ramp';
  curLimit=e.limit;env.inTunnel=false;
  // --- junction ahead (inside the junction itself the nearest road is ambiguous: keep the last state)
  if(dir&&!car.inNode){const n=dir>0?e.b:e.a,D=dir>0?e.len-car.s:car.s;
    if(n.r>0){const key=e.i+','+dir;if(!trk||trk.key!==key)trk={key,stopped:false,pg:null,on:{L:null,R:null},next:null};
      const dF=D-FRONT,g=dF-(n.r+2.4),mustStop=n.ctrl==='stop'&&n.stops.includes(e.key),st=n.ctrl==='sig'?sigState(n,e):null;
      for(const s of['L','R']){if(blink===s){if(trk.on[s]==null)trk.on[s]=dF;}else trk.on[s]=null;}
      if(mustStop&&g>-0.5&&g<4&&stopped)trk.stopped=true;
      if(trk.pg!=null&&trk.pg>-0.6&&g<=-0.6&&car.v>0){if(st==='r')violate('signal');if(mustStop&&!trk.stopped)violate('stop');pending={n,e,dir,on:{L:trk.on.L,R:trk.on.R},next:trk.next};}
      trk.pg=g;
      const nx=nextEdge(n,e,dir),dist=g>0?Math.max(5,Math.round(g/5)*5)+' m':'';trk.next=nx;
      if(nx==='G')setInstr('◎',T('navNear')(guide.name||n.name||''),dist);
      else if(nx){const tc=turnClass(n,e,nx);trk.act=tc;setInstr(tc==='L'?'←':tc==='R'?'→':tc==='U'?'⟲':'↑',n.name?T('iAt')(n.name,T('act')[tc]||T('act').S):T('iNext')(T('act')[tc]||T('act').S),dist);if((tc==='L'||tc==='R')&&blink!==tc&&g>0&&g<55)hint='hBlink';}
      else if(!hwy&&!ramp)setInstr('↑',T('iFree')+(n.name?' · '+n.name:''),'');
      if(g>0&&g<45){if(mustStop&&!trk.stopped)hint='hStop';else if(st==='r'||st==='y')hint='hRed';}
    }else{trk=null;if(n.ed.length===1&&D<60)setInstr('⟲',T('iU'),'');else if(!hwy&&!ramp){const nx=guide?nextEdge(n,e,dir):null;setInstr('↑',nx==='G'?T('navNear')(guide.name||''):guide?T('iFollow'):T('iFree'),'');}}
    // side of the road, one-way streets
    if(Math.abs(fx*car.tx+fz*car.tz)>0.85&&Math.abs(car.v)>1){
      if(e.oneway){if(dir<0){owT+=dt;if(owT>1&&!owFlag){owFlag=true;violate('oneway');}}else{owT=0;owFlag=false;}}
      else{const ex=obstZone&&obstZone.e===e&&dir===obstZone.dir&&Math.abs(car.s-obstZone.s)<32;if(lat<-0.6&&!ex&&car.v>0){wrongT+=dt;if(wrongT>1&&!wrongFlag){wrongFlag=true;violate('wrong');}}else{wrongT=0;if(lat>0.2)wrongFlag=false;}}}
    // lanes: bus lane on 中央通り, lane changes there and on the expressway
    let li=null;if(e.kind==='main')li=lat>3.5+(laneId===1?-0.35:0.35)?1:0;else if(hwy)li=car.u>3.5?2:car.u>0?1:0;else if(ramp&&e!==PAinfo.lot)li=2;
    if(li!=null&&laneId!=null&&li!==laneId&&car.v>2&&Math.abs(fx*car.tx+fz*car.tz)>0.8){const side=li>laneId?'L':'R';if(!(blink===side&&sigHold>1.0))violate('lanesig');else if(hwy||D>60)laneCancel=time+1.7;}
    laneId=li;if(laneCancel&&time>laneCancel){blink=null;laneCancel=0;}
    if(e.kind==='main'){const ok=D<58+n.r||emerg.on||time<emerg.until+7||time<rowEnterT+9;if(li===1&&!ok&&car.v>1){busT+=dt;hint='hBus';if(busT>3.5&&!busFlag){busFlag=true;violate('buslane');}}else{busT=0;if(li===0)busFlag=false;}}
    if(e.kind==='tram'){if(Math.abs(car.u)<2.1&&car.v>1.5&&!(trk&&trk.act==='R'&&D<n.r+34)&&Math.abs(fx*car.tx+fz*car.tz)>0.9){tbT+=dt;hint='hTrack';if(tbT>3&&!tbFlag){tbFlag=true;violate('trackbed');}}else{tbT=0;if(Math.abs(car.u)>2.6)tbFlag=false;}}
    // features on this road: level crossing, pedestrian crossing, toll gate
    for(const f of e.feat){const rel=(f.s-car.s)*dir,k=e.i+f.t+f.s+dir,q=ft[k]||(ft[k]={pg:null,stopped:false});
      if(f.t==='rail'){const g=rel-FRONT-4.5;if(rel>0){if(g>-0.5&&g<4&&stopped)q.stopped=true;if(q.pg!=null&&q.pg>-0.6&&g<=-0.6&&car.v>0){if(rail.alarm)violate('railAlarm');else if(!q.stopped)violate('rail');}q.pg=g;if(g>0&&g<45)hint=rail.alarm?'hAlarm':(q.stopped?hint:'hRail');}else if(rel<-5){q.stopped=false;q.pg=null;}}
      else if(f.t==='xwalk'){const g=rel-FRONT-3.5;if(q.pg!=null&&q.pg>-0.6&&g<=-0.6&&car.v>0&&ped.state!=='away')violate('ped');q.pg=rel>-3?g:null;ped.threat=rel>-2&&rel<30&&car.v>0.4;if(ped.state!=='away'&&g>0&&g<45)hint='hPed';if(ped.first&&mode==='course'&&ped.state==='away'&&rel>20&&rel<50){ped.t=0;ped.side=-1;}}
      else if(f.t==='toll'){if(q.pg!=null&&q.pg>0&&rel<=0&&kmh>25)violate('etc');q.pg=rel;if(rel>0&&rel<60){hint='hEtc';curLimit=Math.min(curLimit,40);}}}
    if(!e.feat.some(f=>f.t==='xwalk'))ped.threat=false;
  }
  // --- after a junction: which way did we go?
  if(pending){const p=pending,dn=Math.hypot(car.x-p.n.x,car.z-p.n.z);if(dn<p.n.r)p.inside=true;
    if(p.inside&&dn>p.n.r+2.5){pending=null;if(e!==p.e&&(e.a===p.n||e.b===p.n)){const tc=turnClass(p.n,p.e,e);
        if(tc==='L'||tc==='R'){const on=p.on[tc];if(on==null)violate('nosig');else if(on<24)violate('latesig');if(blink===tc)blink=null;rowEnterT=time;laneId=null;}
        if(guide){if(p.n===guide.wp[guide.wi]){guide.wi++;gCache.k='';}if(mode==='course'&&p.next&&p.next!=='G'&&p.next!==e)note(T('off'));}}}}
  if(nav&&guide&&guide.wi>=guide.wp.length-1&&Math.hypot(car.x-guide.wp[guide.wp.length-1].x,car.z-guide.wp[guide.wp.length-1].z)<Math.max(14,guide.wp[guide.wp.length-1].r+4)){note(T('navDone')(nav.name));beep(880,0.25,0.05,'sine');clearNav();}
  // --- expressway
  if(hwy||ramp){const nbm=e===PAinfo.nb,s=car.s;let lead=1e9;for(const n of npcs)if(n.e===e&&Math.abs(n.u-car.u)<1.7){const q=(n.s-s)*n.dir-n.hl-2.2;if(q>0&&q<lead)lead=q;}
    if(hwy){env.inTunnel=s>e.tun[0]&&s<e.tun[1];if(env.inTunnel)curLimit=80;
      let ins=['↑',T('hwMain'),''];const dist=d=>Math.max(0,Math.round(d/10)*10)+' m';
      if(s<e.tun[0]){ins=['↑',T('hwTunnelAhead'),dist(e.tun[0]-s)];if(e.tun[0]-s<170&&!env.lights)hint='hLight';}else if(env.inTunnel){ins=['↑',T('hwTunnel'),dist(e.tun[1]-s)];hint=env.lights?'hTunnel':'hLight';}
      else if(nbm&&s<PAinfo.dec[1]){ins=['⬅',T('hwPA'),dist(PAinfo.dec[0]-s)];if(s>PAinfo.dec[0]-120)hint='hDecel';}
      else if(nbm&&s>PAinfo.acc[0]-10&&s<PAinfo.acc[1]&&laneId===2){ins=['➜',T('hwMerge'),dist(PAinfo.acc[1]-s)];hint='hMerge';}
      else if(nbm&&s<PAinfo.works[1]+20&&s>PAinfo.works[0]-420){ins=['➜',T('hwWorks'),dist(PAinfo.works[0]-s)];if(s>PAinfo.works[0]-240)curLimit=60;}
      else ins=[laneId===0?'⬅':'↑',T(laneId===0?'hwBack':'hwEnd'),dist(e.len-s)];
      if(!e.feat.length)setInstr(ins[0],ins[1],ins[2]);
      const free=!(nbm&&s>PAinfo.works[0]-260&&s<PAinfo.works[1]+60);
      if(s>300&&s<e.len-260&&kmh<50&&lead>50&&car.gear==='D'&&laneId!==2){hwS.slowT+=dt;if(hwS.slowT>7){hwS.slowT=0;violate('minspeed');}}else hwS.slowT=0;
      if(car.v>15&&lead<car.v*0.75){hwS.gapT+=dt;hint='hGap';if(hwS.gapT>2.5){hwS.gapT=0;violate('gap');}}else{hwS.gapT=0;if(lead<car.v*2.2&&laneId===1&&free&&!env.inTunnel)hint=hint||'hOvertake';}
      if(laneId===0&&free){hwS.passT+=dt;if(hwS.passT>10&&lead>60)hint='hKeepLeft';if(hwS.passT>24){hwS.passT=0;violate('passlane');}}else hwS.passT=0;
      if(env.inTunnel&&!hwS.was){env.flash=0.62;env.flashCol='#000';}if(!env.inTunnel&&hwS.was&&env.night<0.5){env.flash=0.85;env.flashCol='#fff';}hwS.was=env.inTunnel;
    }else if(e===PAinfo.lot){setInstr('P',T('hwPAin'),'');hint='hPA';}else if(e.key==='PAin'){setInstr('↑',T('hwPAin'),'');hint='hDecel';}else{setInstr('➜',T('hwMerge'),'');hint='hRamp';}
  }else hwS.was=false;
  speedCheck(dt);
  if(Math.abs(car.grade)>0.055&&!hwy)hint=hint||(car.grade*(car.dir||1)>0?'hUp':'hDown');
  if(evHint)hint=evHint;
  // --- goal bay
  const G=mode==='hw'?GOAL2:GOAL;
  if(mode!=='free'&&guide&&guide.wi>=guide.wp.length-1&&e===G.e){setInstr('P',T('iG'),'');if(blink!=='L'&&!stopped)hint='hGoal';
    if(car.s>G.s0&&car.s<G.s1&&dir===G.dir&&lat>0.3&&stopped){hint='hPark';if(car.gear==='P'&&car.hb)goalT+=dt;if(goalT>0.5){if(blink!=='L')violate('parksig');if(lat<e.w/2+0.25)violate('parkpos');finish(true);return;}}else goalT=0;}
  setHint(startHint(hint));
}
