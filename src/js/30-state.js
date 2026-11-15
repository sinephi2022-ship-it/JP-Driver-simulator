/* ---------- game state ---------- */
let playerBrake=[];
let state='menu',mode='course',hintsOn=true,soundOn=true,camMode=0;
const goal2Objs=[];
let violations=[],score=100,trk=null,pending=null,curLimit=40,overT=0,overFlag=false,wrongT=0,wrongFlag=false,goalT=0,invuln=0,blink=null,blinkT=0,blinkOn=false,lookOff=0,edgeT=0;
let dragYaw=0,dragPitch=0,dragging=false,mouseLook=false,mYaw=0,mPitch=0;const cool={};const inp={gas:0,brake:0,left:0,right:0,lookL:0,lookR:0,steerA:0};
let GOAL2=null;
function startAt(key,s,dir){const e=EK[key],u0=e.oneway?laneU(e,1,0):laneU(e,dir,lanesOf(e,dir)-1),q=edgePos(e,s,u0);car={x:q.x,z:q.z,y:q.y,a:Math.atan2(q.tx*dir,-q.tz*dir),v:0,steer:0,gear:'P',hb:true,pitch:0,slope:0,grade:0,e,s,u:u0,dir,tx:q.tx,tz:q.tz};}
function resetGame(){
  if(mode==='hw')startAt('N3u-IC1',EK['N3u-IC1'].len-80,1);else startAt('S0-S1',28,1);
  violations=[];score=100;nav=null;trk=pending=null;curLimit=40;overT=0;overFlag=false;wrongT=0;wrongFlag=false;goalT=0;invuln=0;blink=null;time=0;
  for(const k in cool)delete cool[k];for(const k in ft)delete ft[k];
  setGuide(mode==='course'?[...COURSE,'A2']:mode==='hw'?['IC1','IC0','VI','V3','V2']:null);
  npcs.forEach(resetNpc);resetEvents();laneId=null;busT=0;busFlag=false;rowEnterT=-99;owT=0;owFlag=false;hwS.was=false;
  ped.state='away';ped.t=6;ped.first=true;ped.mesh.visible=false;rail.alarm=false;rail.t=22;rail.train.visible=false;
  goalObjs.forEach(o=>o.visible=mode==='course');goal2Objs.forEach(o=>o.visible=mode==='hw');$('toasts').innerHTML='';lastInstr='';
}

/* ---------- audio ---------- */
let actx=null;
function beep(f,dur,vol,type){if(!actx||!soundOn)return;try{const o=actx.createOscillator(),g=actx.createGain(),t=actx.currentTime;o.type=type||'square';o.frequency.value=f;g.gain.setValueAtTime(vol||0.04,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+dur);}catch(e){}}

let eng=null;
function engine(){if(!actx)return;if(!eng){try{const o=actx.createOscillator(),o2=actx.createOscillator(),g=actx.createGain(),f=actx.createBiquadFilter();o.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=320;g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(actx.destination);o.start();o2.start();eng={o,o2,g};}catch(e){return;}}
  const on=soundOn&&state==='drive',t=actx.currentTime;eng.o.frequency.setTargetAtTime(38+rpm*17,t,0.05);eng.o2.frequency.setTargetAtTime(19+rpm*8.5,t,0.05);eng.g.gain.setTargetAtTime(on?0.012+(inp.gas?0.012:0):0,t,0.08);}
