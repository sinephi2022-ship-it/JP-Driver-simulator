let openMap=()=>{},closeMap=()=>{};
/* ---------- input ---------- */
function toggleBlink(s){blink=blink===s?null:s;blinkT=0.38;blinkOn=false;}
const GEARS=['P','R','N','D'];let noteT=0;
function buzz(){try{navigator.vibrate&&navigator.vibrate(15);}catch(e){}}
function shiftGear(dir,wrap){const i=GEARS.indexOf(car.gear);let ni=i+dir;if(wrap)ni=(ni+4)%4;else ni=clamp(ni,0,3);if(ni===i)return;const to=GEARS[ni],nd=(car.gear==='N'&&to==='D')||(car.gear==='D'&&to==='N');
  const warn=k=>{if(noteT<performance.now()){noteT=performance.now()+2500;note(T(k));}};
  if(!nd&&Math.abs(car.v)>0.3)return warn('needStop');if(car.gear==='P'&&!inp.brake)return warn('needBrake');
  car.gear=to;if(!nd)car.v=0;buzz();beep(520,0.04,0.03);}
function toggleGear(){shiftGear(1,true);}
function toggleHb(){car.hb=!car.hb;buzz();beep(car.hb?300:420,0.06,0.04);}
const KEY={KeyW:'gas',ArrowUp:'gas',KeyS:'brake',ArrowDown:'brake',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyZ:'lookL',KeyC:'lookR'};
function setPause(on){if(on&&state==='drive'){state='pause';for(const k in inp)inp[k]=0;$('pause').hidden=false;$('resumeBtn').focus();}else if(!on&&state==='pause'){state='drive';$('pause').hidden=true;}}
window.addEventListener('keydown',e=>{if(state==='map'&&(e.code==='KeyM'||e.code==='Escape')){closeMap();e.preventDefault();return;}if(e.code==='KeyP'||e.code==='Escape'){if(state==='drive'||state==='pause'){setPause(state==='drive');e.preventDefault();}return;}if(state!=='drive')return;const k=KEY[e.code];if(k){inp[k]=1;e.preventDefault();return;}
  if(e.repeat)return;if(e.code==='KeyQ')toggleBlink('L');else if(e.code==='KeyE')toggleBlink('R');else if(e.code==='KeyX')shiftGear(-1,false);else if(e.code==='ShiftLeft'||e.code==='ShiftRight')shiftGear(1,true);else if(e.code==='Space'){toggleHb();e.preventDefault();}else if(e.code==='KeyV')camMode=1-camMode;else if(e.code==='KeyL')toggleLights();else if(e.code==='KeyM')openMap();else if(e.code==='KeyK')env.wipers=!env.wipers;});
window.addEventListener('keyup',e=>{const k=KEY[e.code];if(k)inp[k]=0;});
window.addEventListener('blur',()=>{for(const k in inp)inp[k]=0;});
document.querySelectorAll('[data-hold]').forEach(b=>{const k=b.dataset.hold,on=e=>{e.preventDefault();inp[k]=1;try{b.setPointerCapture(e.pointerId);}catch(_){}},off=()=>{inp[k]=0;};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);b.addEventListener('contextmenu',e=>e.preventDefault());});
// mouse: the view follows the cursor (centre = straight ahead); touch: drag to look
{const curve=(v,dead)=>{const a=Math.max(0,Math.abs(v)-dead)/(1-dead);return Math.sign(v)*Math.pow(a,1.4);};
window.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;mouseLook=true;const r=app.getBoundingClientRect();
  mYaw=curve(clamp((e.clientX-r.left)/r.width*2-1,-1,1),0.14)*2.5;mPitch=-curve(clamp((e.clientY-r.top)/r.height*2-1,-1,1),0.3)*0.55;});
document.addEventListener('mouseleave',()=>{mYaw=0;mPitch=0;});window.addEventListener('blur',()=>{mYaw=0;mPitch=0;});}
{let lx=0,ly=0,pid=null;canvas.style.touchAction='none';
canvas.addEventListener('pointerdown',e=>{if(state!=='drive'||e.pointerType==='mouse')return;mouseLook=false;dragging=true;pid=e.pointerId;lx=e.clientX;ly=e.clientY;try{canvas.setPointerCapture(pid);}catch(_){}});
canvas.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==pid)return;dragYaw=clamp(dragYaw+(e.clientX-lx)*0.006,-2.7,2.7);dragPitch=clamp(dragPitch-(e.clientY-ly)*0.004,-0.7,0.5);lx=e.clientX;ly=e.clientY;});
const end=e=>{if(e.pointerId===pid){dragging=false;pid=null;}};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);}
function stick(id,onMove,onDouble){const el=$(id),nub=el.querySelector('.nub'),R=42;let pid=null,t0=0,x0=0,y0=0,lastTap=0,moved=false;
  const pos=e=>{let x=(e.clientX-x0)/R,y=(e.clientY-y0)/R;const m=Math.hypot(x,y);if(m*R>9)moved=true;if(m>1){x/=m;y/=m;}nub.style.transform='translate('+(x*R)+'px,'+(y*R)+'px)';onMove(x,y);};
  el.addEventListener('pointerdown',e=>{e.preventDefault();if(pid!==null)return;pid=e.pointerId;t0=performance.now();x0=e.clientX;y0=e.clientY;moved=false;try{el.setPointerCapture(pid);}catch(_){}});
  el.addEventListener('pointermove',e=>{if(e.pointerId===pid)pos(e);});
  const up=e=>{if(e.pointerId!==pid)return;pid=null;nub.style.transform='';onMove(0,0);const now=performance.now();if(!moved&&now-t0<280){if(now-lastTap<480){lastTap=0;onDouble();}else lastTap=now;}};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('contextmenu',e=>e.preventDefault());}
{let armB=false;const dz=(v,d)=>Math.abs(v)<d?0:Math.sign(v)*(Math.abs(v)-d)/(1-d);
// stalks behind the wheel: right = lights (tap) and turn signals (flick up / down), left = wipers
function stalkCtl(id,onTap,onFlick){const el=$(id);let pid=null,y0=0,done=false;
  el.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;y0=e.clientY;done=false;try{el.setPointerCapture(pid);}catch(_){}});
  el.addEventListener('pointermove',e=>{if(e.pointerId!==pid||done)return;const dy=e.clientY-y0;if(Math.abs(dy)>22){done=true;buzz();onFlick(dy<0?-1:1);}});
  const up=e=>{if(e.pointerId!==pid)return;pid=null;if(!done&&e.type==='pointerup'){buzz();onTap();}};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('contextmenu',e=>e.preventDefault());}
stalkCtl('stkR',()=>toggleLights(),d=>toggleBlink(d<0?'L':'R'));stalkCtl('stkL',()=>{env.wipers=!env.wipers;},()=>{env.wipers=!env.wipers;});
// big map: view the town, pick a destination
openMap=function(){if(state!=='drive')return;state='map';for(const k in inp)inp[k]=0;$('mapTip').textContent=T(mode==='free'?'mapTitle':'mapRO');$('navClear').hidden=!nav;drawBigMap();$('bigmap').hidden=false;};
closeMap=function(){if(state==='map'){state='drive';$('bigmap').hidden=true;}};
$('map').addEventListener('click',openMap);$('mapBtn').onclick=openMap;$('mapClose').onclick=closeMap;$('navClear').onclick=()=>{clearNav();closeMap();};
$('bigC').addEventListener('click',e=>{if(mode!=='free'||!bigK)return;const c=$('bigC'),r=c.getBoundingClientRect(),wx=(e.clientX-r.left)/r.width*c.width/bigK.k+bigK.x0,wz=(e.clientY-r.top)/r.height*c.height/bigK.k+bigK.z0;
  if(Math.hypot(wx-X0,wz+128)<42){setNav(3,0,0,'高速 若葉IC');closeMap();return;}
  let best=null,bd=48;for(const q in nodes){const n=nodes[q],d=Math.hypot(wx-n.i*S,wz-n.j*S);if(d<bd){bd=d;best=n;}}if(best){setNav(best.i,best.j,null,best.name);closeMap();}});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{$({course:'modeCourse',free:'modeFree',hw:'modeHw'}[b.dataset.mode]).checked=true;$('pause').hidden=true;begin();});
// gear: hold the button and slide up / down
{const gb=$('gearBtn'),strip=$('gearStrip');let gid=null,gy=0;
gb.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='drive')return;gid=e.pointerId;gy=e.clientY;strip.hidden=false;try{gb.setPointerCapture(gid);}catch(_){}});
gb.addEventListener('pointermove',e=>{if(e.pointerId!==gid)return;while(e.clientY-gy>30){shiftGear(1,false);gy+=30;}while(e.clientY-gy<-30){shiftGear(-1,false);gy-=30;}});
const up=e=>{if(e.pointerId===gid){gid=null;strip.hidden=true;}};gb.addEventListener('pointerup',up);gb.addEventListener('pointercancel',up);gb.addEventListener('contextmenu',e=>e.preventDefault());}
$('lightBtn').onclick=toggleLights;$('hbBtn').onclick=()=>{if(state==='drive')toggleHb();};
stick('stR',(x,y)=>{inp.steerA=dz(x,0.14);inp.gas=Math.max(0,dz(-y,0.18));inp.brake=Math.max(0,dz(y,0.18));},()=>{camMode=1-camMode;});}
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause(true);});
$('hb').onclick=toggleHb;$('bL').onclick=()=>toggleBlink('L');$('bR').onclick=()=>toggleBlink('R');$('gear').onclick=toggleGear;
$('camBtn').onclick=()=>{camMode=1-camMode;};$('sndBtn').onclick=$('pSnd').onclick=()=>{soundOn=!soundOn;applyLang();};$('pEnd').onclick=()=>{if(state==='pause'){$('pause').hidden=true;state='drive';finish();}};
$('endBtn').onclick=()=>{if(state==='drive')finish();};$('pauseBtn').onclick=()=>setPause(true);$('resumeBtn').onclick=()=>setPause(false);$('pRestart').onclick=()=>{$('pause').hidden=true;begin();};$('pMenu').onclick=()=>{$('pause').hidden=true;$('hud').hidden=true;resetGame();state='menu';$('start').hidden=false;};
function toggleLights(){env.lights=!env.lights;beep(700,0.03,0.03);}
function begin(){
  mode=$('modeFree').checked?'free':$('modeHw').checked?'hw':'course';hintsOn=$('hintsOn').checked;
  setEnv(document.querySelector('input[name=tod]:checked').value,document.querySelector('input[name=wx]:checked').value);resetGame();for(const k in inp)inp[k]=0;
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume();}catch(e){}
  try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{});}catch(e){}
  if(TOUCH&&window.innerHeight>window.innerWidth)setTimeout(()=>note(T('rotate')),400);
  $('start').hidden=true;$('result').hidden=true;$('hud').hidden=false;lastHint=null;$('hint').hidden=true;state='drive';canvas.focus&&canvas.focus();
}
$('startBtn').onclick=begin;$('retryBtn').onclick=begin;
$('menuBtn').onclick=()=>{resetGame();state='menu';$('result').hidden=true;$('start').hidden=false;};
['langZh','langJa'].forEach(id=>$(id).addEventListener('change',e=>{lang=e.target.value;try{localStorage.setItem('rojo-lang',lang);}catch(_){}applyLang();}));
try{const s=localStorage.getItem('rojo-lang');if(s==='ja'){lang='ja';$('langJa').checked=true;}}catch(_){}

window.__sim={env,get npcs(){return npcs},get emerg(){return emerg},get moto(){return moto},get child(){return child},get hws(){return hws},tp(x,z,a,v){car.x=x;car.z=z;car.a=a;car.v=v||0;car.gear='D';car.hb=false;},get state(){return state},sig:(i,j,ax)=>sigState(nodes[i+','+j],ax),get car(){return car},get v(){return violations},get cp(){return cp},get ped(){return ped},get rail(){return rail}};
/* ---------- boot ---------- */
let booted=false;
function boot(){if(booted)return;booted=true;buildWorld();resetGame();applyLang();resize();requestAnimationFrame(frame);}
applyLang();
if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('900 56px "Zen Kaku Gothic New"','止まれゴール仮免許練習中'),document.fonts.load('700 100px "Barlow Condensed"','345'),loadImg('brick','tex/brick.jpg'),loadImg('grass','tex/grasslight.jpg')]).then(boot,boot);setTimeout(boot,4000);}else Promise.all([loadImg('brick','tex/brick.jpg'),loadImg('grass','tex/grasslight.jpg')]).then(boot);
