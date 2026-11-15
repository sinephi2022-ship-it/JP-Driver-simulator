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
function drawMap(){
  if(car.z<-E){drawHwMap();return;}
  const k=mapC.width/(MAXX+2*E),X=x=>(x+E)*k,Z=z=>(z+E)*k;mx.clearRect(0,0,mapC.width,mapC.height);
  mx.lineCap='butt';mx.strokeStyle='#59616d';mx.lineWidth=13;mx.beginPath();mx.moveTo(X(-E),Z(S));mx.lineTo(X(MAXX+E),Z(S));mx.stroke();mx.lineWidth=7;mx.beginPath();
  for(let j=0;j<ROWS;j++){mx.moveTo(X(-E),Z(j*S));mx.lineTo(X(MAXX+E),Z(j*S));}for(let i=0;i<COLS;i++){mx.moveTo(X(i*S),Z(-E));mx.lineTo(X(i*S),Z(MAXZ+E));}mx.stroke();
  mx.setLineDash([6,5]);mx.strokeStyle='#b9a98e';mx.lineWidth=2.5;mx.beginPath();mx.moveTo(X(-E),Z(ZR));mx.lineTo(X(MAXX+E),Z(ZR));mx.stroke();mx.setLineDash([]);
  if(mode==='course'){mx.strokeStyle='#4f8df5';mx.lineWidth=3;mx.beginPath();mx.moveTo(X(-45),Z(2*S));for(let q=0;q<COURSE.length-1;q++)mx.lineTo(X(COURSE[q][0]*S),Z(COURSE[q][1]*S));mx.lineTo(X(S),Z(GOAL.z1-6));mx.stroke();
    mx.fillStyle='#4f8df5';mx.fillRect(X(S)-6,Z(GOAL.z1-6)-6,12,12);mx.fillStyle='#fff';mx.font='700 11px sans-serif';mx.textAlign='center';mx.textBaseline='middle';mx.fillText('G',X(S),Z(GOAL.z1-6)+0.5);}
  for(const q in nodes){const n=nodes[q];mx.fillStyle=n.type==='sig'?'#1fc79a':'#e3414a';mx.beginPath();if(n.type==='sig')mx.arc(X(n.i*S),Z(n.j*S),4,0,7);else{const x=X(n.i*S),z=Z(n.j*S);mx.moveTo(x-5,z-4);mx.lineTo(x+5,z-4);mx.lineTo(x,z+5);}mx.fill();}
  if(nav){mx.strokeStyle='#ff5a62';mx.lineWidth=4;mx.beginPath();mx.arc(X(nav.i*S),Z(nav.j*S-(nav.dir!=null?60:0)),11,0,7);mx.stroke();}
  mx.fillStyle='#d5dae0';for(const n of npcs)if(n.grid)mx.fillRect(X(n.x)-2.5,Z(n.z)-2.5,5,5);if(emerg.on){mx.fillStyle='#ff3b3b';mx.fillRect(X(emerg.s)-4,Z(S)-4,8,8);}
  mx.save();mx.translate(X(car.x),Z(car.z));mx.rotate(car.a);mx.fillStyle='#f6b40e';mx.strokeStyle='#0f1622';mx.lineWidth=1.5;mx.beginPath();mx.moveTo(0,-9);mx.lineTo(6,7);mx.lineTo(0,4);mx.lineTo(-6,7);mx.closePath();mx.fill();mx.stroke();mx.restore();
}
const v3=new THREE.Vector3();
// touch: the light and wiper controls sit on top of the 3D stalks behind the steering wheel
function placeStalks(){const ar=app.getBoundingClientRect(),hr=$('stkR').parentNode.getBoundingClientRect();carMesh.updateMatrixWorld(true);camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  for(const [id,lx,fx] of[['stkR',0.3,0.66],['stkL',-0.3,0.34]]){const el=$(id);let x=fx*ar.width,y=ar.height*0.62;
    if(camMode===0){v3.set(lx,0.01,-0.04);tiltG.localToWorld(v3);v3.project(camera);if(v3.z<1&&Math.abs(v3.x)<0.94&&v3.y>-0.9&&v3.y<0.8){x=(v3.x+1)/2*ar.width;y=(1-v3.y)/2*ar.height;}}
    el.style.left=Math.round(x-(hr.left-ar.left))+'px';el.style.top=Math.round(y-(hr.top-ar.top))+'px';}
  $('stkR').className='stk'+(env.lights?' on':'')+(blink?' sig':'');$('stkR').firstElementChild.textContent=blink==='L'?'◀':blink==='R'?'▶':'';$('stkL').className='stk'+(env.wipers?' on':'');}
function drawBigMap(){
  const c=$('bigC'),g=c.getContext('2d'),x0=-E-25,z0=-165,k=Math.min(c.width/(MAXX+2*E+50),c.height/(MAXZ+E+25-z0)),X=x=>(x-x0)*k,Z=z=>(z-z0)*k;bigK={x0,z0,k};
  g.fillStyle='#16202e';g.fillRect(0,0,c.width,c.height);g.fillStyle='#22364a';g.fillRect(X(S+RW[1]),Z(RW[0]),(S-2*RW[1])*k,(S-RW[0]-RW[1])*k);
  g.lineCap='butt';g.strokeStyle='#69727e';for(let j=0;j<ROWS;j++){g.lineWidth=RW[j]*2*k*1.5;g.beginPath();g.moveTo(X(-E),Z(j*S));g.lineTo(X(MAXX+E),Z(j*S));g.stroke();}
  g.lineWidth=7*k*1.5;for(let i=0;i<COLS;i++){g.beginPath();g.moveTo(X(i*S),Z(i===3?-150:-E));g.lineTo(X(i*S),Z(MAXZ+E));g.stroke();}
  g.setLineDash([9,7]);g.strokeStyle='#b9a98e';g.lineWidth=3;g.beginPath();g.moveTo(X(-E),Z(ZR));g.lineTo(X(MAXX+E),Z(ZR));g.stroke();g.setLineDash([]);
  g.textAlign='center';g.textBaseline='middle';
  for(const q in nodes){const n=nodes[q],x=X(n.i*S),z=Z(n.j*S),sel=nav&&nav.dir==null&&nav.i===n.i&&nav.j===n.j;g.fillStyle=n.type==='sig'?'#1fc79a':'#e3414a';g.beginPath();g.arc(x,z,7,0,7);g.fill();
    if(sel){g.strokeStyle='#ff5a62';g.lineWidth=4;g.beginPath();g.arc(x,z,16,0,7);g.stroke();}
    g.font='700 17px '+FONT;g.lineWidth=4;g.strokeStyle='#16202e';g.strokeText(n.name,x,z-20);g.fillStyle='#f2f5f8';g.fillText(n.name,x,z-20);}
  g.fillStyle='#0f7a4a';g.fillRect(X(X0)-62,Z(-128)-15,124,30);g.fillStyle='#fff';g.font='700 16px '+FONT;g.fillText('高速 若葉IC',X(X0),Z(-128));if(nav&&nav.dir!=null){g.strokeStyle='#ff5a62';g.lineWidth=4;g.strokeRect(X(X0)-66,Z(-128)-19,132,38);}
  g.fillStyle='#9fb0c2';g.font='600 14px '+FONT;g.fillText('中央通り（バスレーン）',X(1.5*S),Z(S)+RW[1]*k+16);g.fillText('公園',X(1.5*S),Z(S/2));g.fillText('踏切',X(-E+22),Z(ZR)-12);
  for(const lm of LANDMARKS){g.fillStyle='#f6b40e';g.fillRect(X(lm.x)-5,Z(lm.z)-5,10,10);g.fillStyle='#f6d98a';g.fillText(lm.name,X(lm.x),Z(lm.z)+16);}
  g.save();g.translate(X(car.x),Z(Math.max(car.z,-150)));g.rotate(car.a);g.fillStyle='#f6b40e';g.strokeStyle='#0f1622';g.lineWidth=2;g.beginPath();g.moveTo(0,-15);g.lineTo(10,11);g.lineTo(0,6);g.lineTo(-10,11);g.closePath();g.fill();g.stroke();g.restore();
}
let bigK=null;const LANDMARKS=[];
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
function view(dt){
  carMesh.position.set(car.x,0,car.z);carMesh.rotation.y=-car.a;
  const fx=Math.sin(car.a),fz=-Math.cos(car.a),rx=Math.cos(car.a),rz=Math.sin(car.a);
  const fp=state!=='menu'&&camMode===0,fov=app.clientWidth<app.clientHeight?82:fp?74:62;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
  cockpit.visible=fp;cabin.visible=!fp;bodyMesh.visible=!fp;
  if(state==='menu'){camera.position.set(car.x-9,5.5,car.z+9);camera.lookAt(car.x+8,1,car.z-3);return;}
  const tl=(inp.lookR-inp.lookL)*1.3;lookOff+=clamp(tl-lookOff,-dt*5,dt*5);if(mouseLook){const kq=Math.min(1,dt*9);dragYaw+=(mYaw-dragYaw)*kq;dragPitch+=(mPitch-dragPitch)*kq;}else if(!dragging){const kq=Math.exp(-dt*5);dragYaw*=kq;dragPitch*=kq;}
  if(fp){camera.position.set(car.x+rx*0.38-fx*0.15,1.27,car.z+rz*0.38-fz*0.15);camera.rotation.set(clamp(-0.06+dragPitch,-0.9,0.6),-(car.a+lookOff+dragYaw),0);
    wheel.rotation.z=-car.steer*8;stalk.rotation.z=blink==='R'?-0.24:blink==='L'?0.24:0;stalkL.rotation.z=env.wipers?-0.22:0;}
  else{{const ya=car.a+lookOff*0.6+dragYaw,ox=Math.sin(ya),oz=-Math.cos(ya);camera.position.set(car.x-ox*7.5,3.6-dragPitch*5,car.z-oz*7.5);camera.rotation.set(-0.24+dragPitch*0.5,-ya,0);}}
}
let prev=0,fpsN=0,fpsT=0,quality=1,lowFx=false;
function frame(ts){
  const dt=Math.min(0.05,(ts-prev)/1000||0.016);prev=ts;
  if(state==='drive'){drive(dt);rules(dt);}
  if(state!=='pause')world(dt);view(dt);if(state==='drive'){hud(dt);drawMap();
    if(camMode===0){drawCluster(dt);mapTex.needsUpdate=true;cockpit.visible=false;bodyMesh.visible=true;const fc=fcount++,slow=TOUCH||lowFx,sd=slow?(fc>>1)&1:fc&1;
      if(!slow||!(fc&1)){renderer.setRenderTarget(rtRear);renderer.render(scene,camRear);}
      if(!slow||(fc&1)){renderer.setRenderTarget(sd?rtL:rtR);renderer.render(scene,sd?camL:camR);}renderer.setRenderTarget(null);cockpit.visible=true;bodyMesh.visible=false;}}
  engine();
  // adaptive quality: drop render resolution when the frame rate stays low
  fpsN++;fpsT+=dt;if(fpsT>2.5){const fps=fpsN/fpsT;fpsN=0;fpsT=0;if(state==='drive'&&fps<27&&quality>0.6){quality=Math.max(0.6,quality-0.2);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,TOUCH?1.5:2)*quality);resize();lowFx=quality<0.75;}}
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
