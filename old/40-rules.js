/* ---------- rules ---------- */
function violate(id){
  if(state!=='drive'||(cool[id]||0)>time)return;cool[id]=time+4;
  const pts=PTS[id];violations.push({id,pts,t:time});score=Math.max(0,score-pts);
  const [name,tip]=T('r')[id],el=document.createElement('div');el.className='toast'+(pts?'':' crit');
  el.innerHTML='<span class="pt"></span><b></b>'+(hintsOn?'<p></p>':'');el.querySelector('.pt').textContent=pts?'−'+pts:T('stopTag');el.querySelector('b').textContent=name;if(hintsOn)el.querySelector('p').textContent=tip;
  const box=$('toasts');box.prepend(el);while(box.children.length>3)box.lastChild.remove();setTimeout(()=>el.remove(),5500);beep(pts?330:200,0.3,0.06,'sawtooth');
}
function note(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;$('toasts').prepend(el);setTimeout(()=>el.remove(),4000);}
function locate(x,z){const i=clamp(Math.round(x/S),0,COLS-1),j=clamp(Math.round(z/S),0,ROWS-1),dx=x-i*S,dz=z-j*S,cw=CW[i],rw=RW[j];
  if(Math.abs(dx)<=cw&&Math.abs(dz)<=rw)return{t:'n',i,j};if(Math.abs(dz)<=rw)return{t:'h',idx:j};if(Math.abs(dx)<=cw)return{t:'v',idx:i};return{t:'x'};}
function onRoad(x,z){if(z<-E)return hwRoad(x,z);const i=clamp(Math.round(x/S),0,COLS-1),j=clamp(Math.round(z/S),0,ROWS-1),ax=Math.abs(x-i*S),az=Math.abs(z-j*S);return az<=RW[j]-0.75||ax<=CW[i]-0.75||ax+az<=CW[i]+RW[j]+1.9;}
function approach(loc){
  if(loc.t!=='h'&&loc.t!=='v')return null;const fx=Math.sin(car.a),fz=-Math.cos(car.a);let d,i,j,dF;
  if(loc.t==='h'){if(Math.abs(fx)<0.5)return null;d=fx>0?1:3;j=loc.idx;i=d===1?Math.floor(car.x/S)+1:Math.ceil(car.x/S)-1;if(i<0||i>=COLS)return{out:true,d,axis:'h'};dF=Math.abs(car.x-i*S)-FRONT;}
  else{if(Math.abs(fz)<0.5)return null;d=fz>0?2:0;i=loc.idx;j=d===2?Math.floor(car.z/S)+1:Math.ceil(car.z/S)-1;if(j<0||j>=ROWS)return{out:true,d,axis:'v'};dF=Math.abs(car.z-j*S)-FRONT;}
  return{i,j,d,axis:loc.t,dF,align:Math.abs(loc.t==='h'?fx:fz)};
}
const turnDir=(d,m)=>m==='S'?d:m==='L'?(d+3)%4:(d+1)%4;
function nextAction(i,j,d){
  let c=CPS[cp];if(c[0]===i&&c[1]===j&&(c[2]==null||c[2]===d)){c=CPS[cp+1];if(!c)return'G';}
  const seen=new Set(),q=[];const push=(a,b,dd,m0)=>{for(const m of['S','L','R']){const nd=turnDir(dd,m),ni=a+DV[nd][0],nj=b+DV[nd][1];if(ni<0||nj<0||ni>=COLS||nj>=ROWS)continue;q.push([ni,nj,nd,m0||m]);}};
  push(i,j,d,null);
  while(q.length){const [a,b,dd,m]=q.shift(),k=a+','+b+','+dd;if(seen.has(k))continue;seen.add(k);if(a===c[0]&&b===c[1]&&(c[2]==null||c[2]===dd))return m;push(a,b,dd,m);}
  return'S';
}
let lastInstr='';
function setInstr(arrow,txt,dist){const k=arrow+txt+dist;if(k===lastInstr)return;lastInstr=k;$('iArrow').textContent=arrow;$('iTxt').textContent=txt;$('iDist').textContent=dist;}
let lastHint=null;function setHint(k){if(!hintsOn)k=null;if(k===lastHint)return;lastHint=k;$('hint').hidden=!k;if(k)$('hint').textContent=T(k);}

function setNav(i,j,dir,name){nav={i,j,dir,name};CPS=[dir!=null?[i,j,dir]:[i,j]];cp=0;trk=null;lastInstr='';note(T('navSet')(name));}
function clearNav(){nav=null;CPS=COURSE;cp=0;trk=null;lastInstr='';}
let sigSide=null,sigHold=0,laneIdx=null,busT=0,busFlag=false,laneCancel=0,rowEnterT=-99;
function speedCheck(dt){const kmh=Math.abs(car.v)*3.6;if(kmh>curLimit+2){overT+=dt;if(overT>1.2&&!overFlag){overFlag=true;violate('speed');}}else{overT=0;if(kmh<curLimit)overFlag=false;}}
function startHint(h){return h!=='hPark'&&Math.abs(car.v)<0.3&&(car.hb||car.gear==='P'||car.gear==='N')?'hStart':h;}
function rules(dt){
  if(blink!==sigSide){sigSide=blink;sigHold=0;}else sigHold+=dt;
  if(car.z<-E){if(nav)clearNav();hwRules(dt);return;}
  env.inTunnel=false;hws.lane=null;hws.pz=car.z;
  const loc=locate(car.x,car.z),ap=approach(loc),fx=Math.sin(car.a),fz=-Math.cos(car.a),stopped=Math.abs(car.v)<0.25;
  if(nav&&nav.dir==null&&loc.t==='n'&&loc.i===nav.i&&loc.j===nav.j){note(T('navDone')(nav.name));beep(880,0.25,0.05,'sine');clearNav();}
  let hint=env.weather!=='clear'?(env.wipers?'hWet':'hWiper'):null;if((env.night>0.6)&&!env.lights)hint='hLight';
  // --- intersections
  if(ap&&ap.out){if(ap.axis==='v'&&loc.idx===3&&ap.d===0)setInstr('↑',T('hwToll'),'');else setInstr('⟲',T('iU'),'');laneIdx=null;}
  else if(ap){
    const key=ap.i+','+ap.j+','+ap.d,n=nodes[ap.i+','+ap.j];
    if(!trk||trk.key!==key)trk={key,stopped:false,pg:null,on:{L:null,R:null},exp:null};
    const g=ap.dF-SLd(n,ap.axis),mustStop=n.type===(ap.axis==='h'?'sh':'sv'),st=n.type==='sig'?sigState(n,ap.axis):null;
    for(const s of['L','R']){if(blink===s){if(trk.on[s]==null)trk.on[s]=ap.dF;}else trk.on[s]=null;}
    if(mustStop&&g>-0.5&&g<4&&stopped)trk.stopped=true;
    if(trk.pg!=null&&trk.pg>-0.6&&g<=-0.6&&car.v>0){
      if(st==='r')violate('signal');if(mustStop&&!trk.stopped)violate('stop');
      pending={i:ap.i,j:ap.j,d:ap.d,on:{L:trk.on.L,R:trk.on.R},exp:trk.exp};}
    trk.pg=g;
    if(mode==='course'||nav){const act=nextAction(ap.i,ap.j,ap.d);trk.exp=act;const dist=g>0?Math.max(5,Math.round(g/5)*5)+' m':'';
      if(act==='G'&&nav)setInstr(nav.dir!=null?'↑':'◎',nav.dir!=null?T('navIC'):T('navNear')(nav.name),dist);
      else if(act==='G'){setInstr('P',T('iG'),'');if(car.z>GOAL.z0-30&&car.z<GOAL.z1)hint='hGoal';}
      else{setInstr(act==='L'?'←':act==='R'?'→':'↑',T('iAt')(n.name,T('act')[act]),dist);if((act==='L'||act==='R')&&blink!==act&&g>0&&g<55)hint='hBlink';}
    }else setInstr('↑',T('iFree')+' · '+n.name,'');
    if(g>0&&g<45){if(mustStop&&!trk.stopped)hint='hStop';else if(st==='r'||st==='y')hint='hRed';}
    // lane side, lane changes and the bus lane
    const lat=ap.axis==='h'?(car.z-loc.idx*S)*(ap.d===1?-1:1):(car.x-loc.idx*S)*(ap.d===0?-1:1);
    if(ap.align>0.85&&car.v>1){const exempt=ap.axis==='h'&&loc.idx===0&&ap.d===3&&car.x>XB-30&&car.x<XB+32;
      if(lat<-0.6&&!exempt){wrongT+=dt;if(wrongT>1&&!wrongFlag){wrongFlag=true;violate('wrong');}}else{wrongT=0;if(lat>0.2)wrongFlag=false;}}
    if(ap.axis==='h'&&loc.idx===1&&ap.align>0.85){const li=lat>3.5+(laneIdx===1?-0.35:0.35)?1:0;
      if(laneIdx!=null&&li!==laneIdx&&car.v>1.5){const side=li>laneIdx?'L':'R';if(!(blink===side&&sigHold>1.0))violate('lanesig');else if(ap.dF>60)laneCancel=time+1.6;}
      laneIdx=li;const ok=ap.dF<58||emerg.on||time<emerg.until+7||time<rowEnterT+9;
      if(li===1&&!ok&&car.v>1){busT+=dt;hint='hBus';if(busT>3.5&&!busFlag){busFlag=true;violate('buslane');}}else{busT=0;if(li===0)busFlag=false;}
    }else laneIdx=null;
    if(laneCancel&&time>laneCancel){blink=null;laneCancel=0;}
  }
  // --- leaving an intersection
  if(pending){const n=pending,dx=car.x-n.i*S,dz=car.z-n.j*S,cw=CW[n.i],rw=RW[n.j];
    if(Math.abs(dx)<cw+1&&Math.abs(dz)<rw+1)n.inside=true;
    if(n.inside&&(loc.t==='h'||loc.t==='v')&&(Math.abs(dx)>cw+2.5||Math.abs(dz)>rw+2.5)){
      const ex=loc.t==='h'?(dx>0?1:3):(dz>0?2:0),turn=(ex-n.d+4)%4;pending=null;
      if(turn!==2){
        if(turn===1||turn===3){const s=turn===1?'R':'L',on=n.on[s];if(on==null)violate('nosig');else if(on<24)violate('latesig');if(blink===s)blink=null;rowEnterT=time;laneIdx=null;}
        if(mode==='course'||nav){const c=CPS[cp];if(c[0]===n.i&&c[1]===n.j&&(c[2]==null||c[2]===n.d)){cp++;if(cp>=CPS.length)cp=CPS.length-1;}
          const did=turn===0?'S':turn===1?'R':'L';if(mode==='course'&&n.exp&&n.exp!=='G'&&n.exp!==did)note(T('off'));}
      }}}
  // --- speed
  if(loc.t==='h'||loc.t==='v')curLimit=limitOf(loc.t,loc.idx);
  speedCheck(dt);
  // --- railway crossing
  if(loc.t==='v'&&Math.abs(fz)>=0.5){const dir=fz>0?1:-1,rel=(ZR-car.z)*dir,g=rel-FRONT-4.5,key=loc.idx+','+dir;
    if(!rt||rt.key!==key)rt={key,stopped:false,pg:null};
    if(rel>0){if(g>-0.5&&g<4&&stopped)rt.stopped=true;
      if(rt.pg!=null&&rt.pg>-0.6&&g<=-0.6&&car.v>0){if(rail.alarm)violate('railAlarm');else if(!rt.stopped)violate('rail');}
      rt.pg=g;if(g>0&&g<45)hint=rail.alarm?'hAlarm':(rt.stopped?hint:'hRail');}
    else if(rel<-4)rt=null;}
  // --- mid-block crosswalk
  let threat=false;
  if(loc.t==='h'&&loc.idx===2&&car.x>0&&car.x<S&&Math.abs(fx)>=0.5){const dir=fx>0?1:-1,rel=(XC-car.x)*dir,g=rel-FRONT-3.5;
    if(!pc||pc.dir!==dir)pc={dir,pg:null};
    if(pc.pg!=null&&pc.pg>-0.6&&g<=-0.6&&car.v>0&&ped.state!=='away')violate('ped');
    pc.pg=g;threat=rel>-2&&rel<30&&car.v>0.4;
    if(ped.state!=='away'&&g>0&&g<45)hint='hPed';
    if(ped.first&&mode==='course'&&ped.state==='away'&&rel>20&&rel<50){ped.t=0;ped.side=-1;}
  }else pc=null;
  ped.threat=threat;
  if(evHint)hint=evHint;
  // --- goal
  if(mode==='course'&&cp===CPS.length-1&&car.x>GOAL.x0&&car.x<GOAL.x1&&car.z>GOAL.z0&&car.z<GOAL.z1&&fz>0.8&&stopped){hint='hPark';if(car.gear==='P'&&car.hb)goalT+=dt;
    if(goalT>0.5){if(blink!=='L')violate('parksig');if(car.x-S<2.0)violate('parkpos');finish(true);}}else goalT=0;
  setHint(startHint(hint));
}
