function finish(done){
  state='result';$('hud').hidden=true;const crit=violations.filter(v=>!v.pts).length,cut=mode!=='free'&&!done,ok=!crit&&score>=70&&!cut;
  const st=$('stamp');st.textContent=T(ok?'pass':cut&&!crit&&score>=70?'cut':'fail');st.className='stamp '+(ok?'pass':'fail');$('finalScore').textContent=score;
  $('resNote').textContent=ok?T('rPass'):crit?T('rCrit'):score<70?T('rLow'):T('rCut');
  const ul=$('resList');ul.innerHTML='';
  if(!violations.length){const li=document.createElement('li');li.style.borderLeftColor='var(--go)';li.textContent=T('noV');ul.append(li);}
  for(const v of violations){const [name,tip]=T('r')[v.id],li=document.createElement('li');if(!v.pts)li.className='crit';
    const pt=document.createElement('span');pt.className='pt';pt.textContent=v.pts?'−'+v.pts:T('stopTag');const b=document.createElement('b');b.textContent=name;const p=document.createElement('p');p.textContent=tip;li.append(pt,b,p);ul.append(li);}
  $('result').hidden=false;$('retryBtn').focus();
}

/* ---------- view ---------- */
const mapC=$('map'),mx=mapC.getContext('2d');
const mapCol=e=>e.kind==='hw'||e.kind==='ramp'?'#3f8f6a':e.kind==='main'?'#8b949f':e.kind==='narrow1'||e.kind==='lane'?'#566070':'#6b7480';
function drawRoads(g,X,Z,k,cx,cz,rad){g.lineCap='round';g.lineJoin='round';
  for(const e of ED){if(rad&&Math.min(Math.hypot(e.a.x-cx,e.a.z-cz),Math.hypot(e.b.x-cx,e.b.z-cz),Math.hypot(e.px[e.n>>1]-cx,e.pz[e.n>>1]-cz))>rad+e.len/2)continue;
    g.strokeStyle=mapCol(e);g.lineWidth=Math.max(2,e.w*2*k*(rad?1:1.6));g.beginPath();g.moveTo(X(e.px[0]),Z(e.pz[0]));for(let i=2;i<e.n;i+=2)g.lineTo(X(e.px[i]),Z(e.pz[i]));g.lineTo(X(e.px[e.n-1]),Z(e.pz[e.n-1]));g.stroke();}}
function drawMap(){ // minimap: north up, 520 m across, centred on the car
  const w=mapC.width,h=mapC.height,k=w/520,X=x=>(x-car.x)*k+w/2,Z=z=>(z-car.z)*k+h/2;mx.clearRect(0,0,w,h);mx.fillStyle='#1a2634';mx.fillRect(0,0,w,h);
  mx.fillStyle='#24506b';mx.beginPath();mx.moveTo(w,0);for(let z=car.z-h/k/2;z<=car.z+h/k/2+20;z+=20)mx.lineTo(X(coastX(z)+30),Z(z));mx.lineTo(w,h);mx.closePath();mx.fill();
  drawRoads(mx,X,Z,k,car.x,car.z,330);
  mx.setLineDash([6,5]);mx.strokeStyle='#b9a98e';mx.lineWidth=2.5;mx.beginPath();mx.moveTo(X(-260),Z(ZR));mx.lineTo(X(1090),Z(ZR));mx.stroke();mx.setLineDash([]);
  for(const q in ND){const n=ND[q];if(!n.ctrl||Math.abs(n.x-car.x)>280||Math.abs(n.z-car.z)>220)continue;mx.fillStyle=n.ctrl==='sig'?'#1fc79a':'#e3414a';mx.beginPath();mx.arc(X(n.x),Z(n.z),4,0,7);mx.fill();}
  if(guide){const t=guide.wp[Math.min(guide.wi,guide.wp.length-1)],dx=t.x-car.x,dz=t.z-car.z,m=Math.hypot(dx,dz),lim=w/2-12,f=Math.min(1,lim/(m*k));mx.fillStyle='#ff5a62';mx.beginPath();mx.arc(w/2+dx*k*f,h/2+dz*k*f*(h/w>0.7?1:1),7,0,7);mx.fill();}
  mx.fillStyle='#d5dae0';for(const n of npcs)if(Math.abs(n.x-car.x)<270&&Math.abs(n.z-car.z)<210)mx.fillRect(X(n.x)-2.5,Z(n.z)-2.5,5,5);
  mx.save();mx.translate(w/2,h/2);mx.rotate(car.a);mx.fillStyle='#f6b40e';mx.strokeStyle='#0f1622';mx.lineWidth=1.5;mx.beginPath();mx.moveTo(0,-9);mx.lineTo(6,7);mx.lineTo(0,4);mx.lineTo(-6,7);mx.closePath();mx.fill();mx.stroke();mx.restore();
}
const v3=new THREE.Vector3();
// touch: the light and wiper controls sit on top of the 3D stalks behind the steering wheel
function placeStalks(){const ar=app.getBoundingClientRect(),hr=$('stkR').parentNode.getBoundingClientRect();carMesh.updateMatrixWorld(true);camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  for(const [id,lx,fx] of[['stkR',0.3,0.66],['stkL',-0.3,0.34]]){const el=$(id);let x=fx*ar.width,y=ar.height*0.62;
    if(camMode===0){v3.set(lx,0.01,-0.04);tiltG.localToWorld(v3);v3.project(camera);if(v3.z<1&&Math.abs(v3.x)<0.94&&v3.y>-0.9&&v3.y<0.8){x=(v3.x+1)/2*ar.width;y=(1-v3.y)/2*ar.height;}}
    el.style.left=Math.round(x-(hr.left-ar.left))+'px';el.style.top=Math.round(y-(hr.top-ar.top))+'px';}
  $('stkR').className='stk'+(env.lights?' on':'')+(blink?' sig':'');$('stkR').firstElementChild.textContent=blink==='L'?'◀':blink==='R'?'▶':'';$('stkL').className='stk'+(env.wipers?' on':'');}
function drawBigMap(){
  const c=$('bigC'),g=c.getContext('2d'),x0=-300,x1=1300,z0=-3140,z1=160,k=Math.min(c.width/(x1-x0),c.height/(z1-z0)),ox=(c.width-(x1-x0)*k)/2,X=x=>(x-x0)*k+ox,Z=z=>(z-z0)*k;bigK={x0,z0,k,ox};
  g.fillStyle='#22364a';g.fillRect(0,0,c.width,c.height);
  // land tint by height, sea on the east
  for(let z=z0;z<z1;z+=40)for(let x=x0;x<x1;x+=40){const t=TH(x+20,z+20);g.fillStyle=t<0.5?'#24506b':t>60?'#3d5a3a':t>20?'#40603c':z<-2330?'#4a6b40':x>-170&&z>-815?'#39424d':'#44663e';g.fillRect(X(x),Z(z),40*k+1,40*k+1);}
  drawRoads(g,X,Z,k);
  g.setLineDash([7,6]);g.strokeStyle='#b9a98e';g.lineWidth=2;g.beginPath();g.moveTo(X(-260),Z(ZR));g.lineTo(X(1090),Z(ZR));g.stroke();g.setLineDash([]);
  g.textAlign='center';g.textBaseline='middle';
  for(const q in ND){const n=ND[q];if(!n.name)continue;g.fillStyle=n.ctrl==='sig'?'#1fc79a':n.ctrl==='stop'?'#e3414a':'#c9d2dc';g.beginPath();g.arc(X(n.x),Z(n.z),3.5,0,7);g.fill();}
  g.font='700 13px '+FONT;for(const p of PLACES){const x=X(p[2]),z=Z(p[3]),sel=nav&&nav.name===p[0];g.fillStyle=sel?'#ff5a62':'#f6b40e';g.fillRect(x-4,z-4,8,8);g.lineWidth=3;g.strokeStyle='#16202e';g.strokeText(p[0],x,z-12);g.fillStyle=sel?'#ffb3b7':'#f6e3a8';g.fillText(p[0],x,z-12);}
  g.fillStyle='#9fb0c2';g.font='700 15px '+FONT;g.fillText('若葉市',X(450),Z(-120));g.fillText('青葉山',X(300),Z(-1300));g.fillText('山手町',X(600),Z(-2880));g.fillText('海',X(1230),Z(-900));
  g.save();g.translate(X(car.x),Z(car.z));g.rotate(car.a);g.fillStyle='#fff';g.strokeStyle='#0f1622';g.lineWidth=2;g.beginPath();g.moveTo(0,-12);g.lineTo(8,9);g.lineTo(0,5);g.lineTo(-8,9);g.closePath();g.fill();g.stroke();g.restore();
}
let bigK=null;
let lastTxt={};function setTxt(id,v){if(lastTxt[id]!==v){lastTxt[id]=v;$(id).textContent=v;}}
function hud(dt){
  rpm+=((0.8+Math.min(5.2,Math.abs(car.v)*0.17)+inp.gas*0.9)-rpm)*Math.min(1,dt*4);
  const kmh=Math.round(Math.abs(car.v)*3.6);setTxt('spd',kmh);$('spd').classList.toggle('over',kmh>curLimit+2);setTxt('limit',curLimit);setTxt('score',score);$('score').classList.toggle('low',score<70);
  const crit=violations.filter(v=>!v.pts).length;$('crit').hidden=!crit;if(crit)setTxt('crit',T('critChip')(crit));
  if(blink){blinkT+=dt;if(blinkT>0.38){blinkT=0;blinkOn=!blinkOn;beep(blinkOn?1500:1150,0.025,0.03);}}else{blinkOn=false;blinkT=0.38;}
  $('bL').className='blk'+(blink==='L'?' on'+(blinkOn?' tick':''):'');$('bR').className='blk'+(blink==='R'?' on'+(blinkOn?' tick':''):'');
  setTxt('gear',car.gear);$('gear').classList.toggle('rev',car.gear==='R');$('hb').classList.toggle('on',car.hb);
  if(TOUCH){setTxt('spd2',kmh);$('spd2').classList.toggle('over',kmh>curLimit+2);setTxt('gearLbl',car.gear);$('gearBtn').classList.toggle('rev',car.gear==='R');$('hbBtn').classList.toggle('on',car.hb);
    placeStalks();
    const gi=GEARS.indexOf(car.gear),sp=$('gearStrip').children;for(let q=0;q<4;q++)sp[q].className=q===gi?'on':'';}$('dash').classList.toggle('fp',camMode===0);setTxt('lightBtn',T(env.lights?'lightOn':'lightOff'));$('lightBtn').classList.toggle('lit',env.lights);$('map').classList.toggle('fp',camMode===0);
}
const camV=new THREE.Vector3();let dbgCam=null;
function view(dt){
  carMesh.rotation.order='YXZ';carMesh.position.set(car.x,car.y+0.07,car.z);carMesh.rotation.set(car.pitch,-car.a,0);
  const fp=state!=='menu'&&camMode===0,fov=app.clientWidth<app.clientHeight?82:fp?74:62;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
  cockpit.visible=fp;cabin.visible=!fp;bodyMesh.visible=!fp;
  if(dbgCam){camera.position.set(dbgCam[0],dbgCam[1],dbgCam[2]);camera.lookAt(dbgCam[3],dbgCam[4],dbgCam[5]);cockpit.visible=false;cabin.visible=bodyMesh.visible=true;return;}
  if(state==='menu'){const t=time*0.05;camera.position.set(car.x-13*Math.cos(t),car.y+6.5,car.z+13*Math.sin(t));camera.lookAt(car.x,car.y+1,car.z);return;}
  const tl=(inp.lookR-inp.lookL)*1.3;lookOff+=clamp(tl-lookOff,-dt*5,dt*5);if(mouseLook){const kq=Math.min(1,dt*9);dragYaw+=(mYaw-dragYaw)*kq;dragPitch+=(mPitch-dragPitch)*kq;}else if(!dragging){const kq=Math.exp(-dt*5);dragYaw*=kq;dragPitch*=kq;}
  if(fp){carMesh.updateMatrixWorld(true);camV.set(0.38,1.27,0.15);carMesh.localToWorld(camV);camera.position.copy(camV);const la=lookOff+dragYaw;camera.rotation.set(clamp(-0.06+dragPitch+car.pitch*Math.cos(la),-0.9,0.6),-(car.a+la),0);
    wheel.rotation.z=-car.steer*8;stalk.rotation.z=blink==='R'?-0.24:blink==='L'?0.24:0;stalkL.rotation.z=env.wipers?-0.22:0;}
  else{const ya=car.a+lookOff*0.6+dragYaw,ox=Math.sin(ya),oz=-Math.cos(ya);camera.position.set(car.x-ox*7.5,car.y+3.6-dragPitch*5-car.pitch*7,car.z-oz*7.5);camera.rotation.set(-0.24+dragPitch*0.5+car.pitch,-ya,0);}
}
let prev=0,fpsN=0,fpsT=0,quality=1,lowFx=false;
function frame(ts){
  const dt=Math.min(0.05,(ts-prev)/1000||0.016);prev=ts;
  if(state==='drive'){if(autoOn)autopilot(dt);drive(dt);rules(dt);}
  if(state!=='pause'&&state!=='map')world(dt);view(dt);if(state==='drive'){hud(dt);const fc=fcount++;if(fc%3===0)drawMap();
    // mirrors: one of the three is re-rendered per frame (every other frame on phones / when the frame rate is low)
    if(camMode===0){if(fc&1)drawCluster(dt*2);if(fc%3===0)mapTex.needsUpdate=true;const slow=TOUCH||lowFx,q=slow?(fc&1?-1:(fc>>1)%4):fc%4;
      if(q>=0){cockpit.visible=false;bodyMesh.visible=true;const rt=q===1?rtL:q===3?rtR:rtRear;renderer.setRenderTarget(rt);renderer.render(scene,q===1?camL:q===3?camR:camRear);renderer.setRenderTarget(null);cockpit.visible=true;bodyMesh.visible=false;}}}
  engine();
  // adaptive quality: drop render resolution when the frame rate stays low
  fpsN++;fpsT+=dt;if(fpsT>2.5){const fps=fpsN/fpsT;fpsN=0;fpsT=0;if(state==='drive'&&fps<27&&quality>0.6){quality=Math.max(0.6,quality-0.2);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,TOUCH?1.5:2)*quality);resize();lowFx=quality<0.75;}}
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
