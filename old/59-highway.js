/* ---------- expressway: 若葉IC → 青葉トンネル → 山手IC ---------- */
let hwBars=[],hws={};
function hwRoad(x,z){const u=x-X0,m=0.75,q=(a,b)=>u>=a+m&&u<=b-m;
  if(z>HW.rampA)return q(-3.5,3.5);if(z>HW.portal)return q(-3.5,0);if(z>HW.gore)return q(-3.5,0)||q(0,7);if(z>HW.mergeEnd)return q(-3.5,7);
  if(z<=HW.wA&&z>=HW.wB)return q(3.5,7);if(z<=HW.exA&&z>=HW.exB)return q(-3.5,7);if(z<HW.exB&&z>=HW.rampEnd)return q(-3.5,0)||q(0,7);return q(0,7)&&z>HW.end+5;}
function buildHighway(R){
  const xb=(mat,x0,x1,y0,y1,z0,z1)=>box(mat,x1-x0,y1-y0,Math.abs(z1-z0),X0+(x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
  // ground: grass north of the city
  let gm=P(0x6f9a52);if(IMG.grass){const gt=new THREE.Texture(IMG.grass);gt.needsUpdate=true;gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(160,220);gm=P(0xffffff,{map:gt});}
  const gr=new THREE.Mesh(new THREE.PlaneGeometry(2000,2700),gm);gr.rotation.x=-Math.PI/2;gr.position.set(X0,0.012,-112-1350);scene.add(gr);
  // road surfaces: lane lines drawn across the tile, repeated every 10 m
  const lanes=(wM,lines)=>{const t=cv(Math.round(wM*24),256,(c,w,h)=>{asphaltFill(c,w,h,R);c.fillStyle='#e9ecef';for(const [at,st] of lines){const x=at/wM*w;if(st==='d')c.fillRect(x-2,0,4,h*0.5);else if(st==='t')c.fillRect(x-4,0,8,h*0.42);else c.fillRect(x-2,0,4,h);}});t.wrapT=THREE.RepeatWrapping;const m=P(0xffffff,{map:t,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});WET.push(m);return m;};
  const road=(mat,x0,x1,z0,z1)=>{const len=Math.abs(z1-z0),geo=new THREE.PlaneGeometry(x1-x0,len),uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setY(k,uv.getY(k)*len/10);const m=new THREE.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.position.set(X0+(x0+x1)/2,0.03,(z0+z1)/2);scene.add(m);};
  const m2=lanes(7,[[0.15,'s'],[3.5,'d'],[6.85,'s']]),m1=lanes(3.5,[[0.15,'s'],[3.35,'s']]),m3=lanes(10.5,[[0.15,'s'],[3.5,'t'],[7,'d'],[10.35,'s']]),mA=lanes(7,[[0.15,'s'],[3.5,'s'],[6.85,'s']]);
  road(mA,-3.5,3.5,-112,HW.rampA);road(m1,-3.5,0,HW.rampA,HW.gore);road(m2,0,7,HW.portal,HW.gore);road(m3,-3.5,7,HW.gore,HW.mergeEnd);road(m2,0,7,HW.mergeEnd,HW.exA);
  road(m3,-3.5,7,HW.exA,HW.exB);road(m2,0,7,HW.exB,HW.end);road(m1,-3.5,0,HW.exB,HW.rampEnd);road(m2,9.5,16.5,HW.portal,HW.end);
  // barriers
  const conc=L(0xb4b6b3),rail=L(0xd5d8da),dark=L(0x2a2d31);
  xb(conc,7.9,8.6,0,0.95,HW.portal,HW.end);xb(rail,16.9,17.1,0.35,0.85,HW.portal,HW.end);xb(conc,-0.25,0.25,0,0.8,HW.portal,HW.gore);xb(conc,-0.25,0.25,0,0.8,HW.exB,HW.rampEnd);
  xb(rail,-3.95,-3.8,0.35,0.85,HW.rampA,HW.mergeEnd);xb(rail,-0.45,-0.3,0.35,0.85,HW.mergeEnd,HW.exA);xb(rail,-3.95,-3.8,0.35,0.85,HW.exA,HW.rampEnd);xb(rail,-0.45,-0.3,0.35,0.85,HW.rampEnd,HW.end);
  xb(conc,-3.9,0.3,0,1.2,HW.rampEnd,HW.rampEnd-1);
  // the mainline emerges from an underpass at the edge of the city
  xb(conc,-0.3,17.4,5.2,7.4,HW.portal+9,HW.portal-1);xb(dark,0.3,7.9,0,5.2,HW.portal+8.5,HW.portal+8);xb(dark,8.6,16.9,0,5.2,HW.portal+8.5,HW.portal+8);xb(conc,3.5,17.4,0,5.2,HW.rampA,HW.portal+9);
  // toll gates with ETC bars
  const etc=boardTex(256,96,'#5b2a8c',c=>{c.font='900 52px '+FONT;c.fillText('ETC専用',128,50);}),yel=L(0xf2c230);
  const gate=(z,x0,x1)=>{const xc=(x0+x1)/2;xb(conc,x0-0.5,x0+0.2,0,1.0,z+4,z-4);xb(conc,x1-0.2,x1+0.5,0,1.0,z+4,z-4);xb(L(0x9aa6b2),x1-0.15,x1+0.9,1.0,3.0,z+1.5,z-1.5);
    xb(L(0xe8eaec),x0-1.2,x1+1.6,4.7,5.1,z+4.5,z-4.5);for(const x of[x0-0.2,x1+0.2])xb(poleMat,x-0.1,x+0.1,1,4.7,z+0.1,z-0.1);
    const s=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.0),dim(new THREE.MeshBasicMaterial({map:etc})));s.position.set(X0+xc,5.75,z+4.55);scene.add(s);
    const piv=new THREE.Group();piv.position.set(X0+x0+0.25,1.0,z-2);scene.add(piv);box(yel,x1-x0-0.5,0.1,0.1,(x1-x0-0.5)/2,0,0,piv);hwBars.push({piv,z:z-2});
    signPost(roundSignTex(20),0.8,0.8,X0+x0-0.9,z+16,0,2.2,backRound);};
  gate(HW.gate,-3.5,0);gate(HW.gate2,-3.5,0);xb(conc,0,3.5,0,1.0,HW.gate+4,HW.gate-4);
  // signs
  const green=(lines,w,h,x,y,z)=>{const t=boardTex(Math.round(w*64),Math.round(h*64),'#0f7a4a',(c,cw,ch)=>{lines.forEach((s,k)=>{c.font='900 '+Math.round(ch/(lines.length+0.9))+'px '+FONT;c.fillText(s,cw/2,ch*(k+0.75)/(lines.length+0.5));});});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dim(new THREE.MeshBasicMaterial({map:t})));m.position.set(X0+x,y,z);scene.add(m);return m;};
  const gantry=(lines,z,x0,x1)=>{xb(poleMat,x0-0.6,x0-0.3,0,7.3,z+0.15,z-0.15);xb(poleMat,x1+0.3,x1+0.6,0,7.3,z+0.15,z-0.15);xb(poleMat,x0-0.6,x1+0.6,7.0,7.3,z+0.15,z-0.15);green(lines,Math.min(6.4,x1-x0-0.4),2.2,(x0+x1)/2,5.8,z+0.2);};
  gantry(['高速 若葉IC','山手・青葉 方面'],-100,-3.6,3.6);gantry(['本線 合流','右へ ➜'],HW.gore+40,-3.6,7.9);gantry(['青葉トンネル 400m','ライト点灯'],HW.tunA+170,-0.3,7.9);
  gantry(['工事中 600m先','左車線 規制'],HW.tunB-40,-0.3,7.9);gantry(['山手 出口 1km'],HW.exA+1000>HW.tunB?HW.wB-90:HW.exA+1000,-0.3,7.9);gantry(['⬅ 山手 出口','EXIT 500m'],HW.exA+320,-0.3,7.9);gantry(['⬅ 出口 EXIT'],HW.exA-10,-3.6,7.9);
  const rs=(n,z,blue)=>signPost(roundSignTex(n,blue),1.0,1.0,X0-(z>HW.mergeEnd||z<HW.exA?4.4:1.0),z,0,2.6,backRound);
  rs(40,HW.rampA+18);rs(60,HW.rampA-30);rs(100,HW.mergeEnd-60);rs(50,HW.mergeEnd-90,true);rs(80,HW.tunA+60);rs(100,HW.tunB-25);rs(60,HW.wA+140);rs(100,HW.wB-40);rs(40,HW.exB-20);
  // tunnel: tube, portals, hill, lights
  const tw=L(0x8a8780),th=L(0x5f7f4a),tA=HW.tunA,tB=HW.tunB;
  xb(tw,-1.1,-0.6,0,5.6,tA,tB);xb(tw,17.2,17.7,0,5.6,tA,tB);xb(L(0x3a3936),-1.1,17.7,5.6,6.1,tA,tB);
  xb(th,-160,-1.1,0,24,tA-6,tB+6);xb(th,17.7,180,0,24,tA-6,tB+6);xb(th,-1.1,17.7,6.1,24,tA-6,tB+6);
  for(const z of[tA,tB]){const s=z===tA?1:-1;xb(conc,-2.2,-0.6,0,7.6,z+s*1.2,z-s*0.2);xb(conc,17.2,18.8,0,7.6,z+s*1.2,z-s*0.2);xb(conc,-2.2,18.8,5.6,7.6,z+s*1.2,z-s*0.2);}
  {const cnt=Math.floor((tA-tB)/14),lm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.35,0.08,1.6),new THREE.MeshBasicMaterial({color:0xffb45e}),cnt*4),dm=new THREE.Object3D();
    for(let k=0;k<cnt;k++)[1.2,5.8,10.7,15.3].forEach((x,q)=>{dm.position.set(X0+x,5.5,tA-7-k*14);dm.updateMatrix();lm.setMatrixAt(k*4+q,dm.matrix);});lm.frustumCulled=false;scene.add(lm);}
  // construction zone: left lane closed
  {const pts=[];for(let z=HW.wA+72;z>HW.wA;z-=6)pts.push([0.4+(HW.wA+72-z)/72*3.2,z]);for(let z=HW.wA;z>=HW.wB;z-=7.5)pts.push([3.65,z]);for(let z=HW.wB;z>HW.wB-24;z-=6)pts.push([3.6-(HW.wB-z)/24*3.2,z]);
    const cone=new THREE.InstancedMesh(new THREE.ConeGeometry(0.2,0.7,8),L(0xf26a1b),pts.length),dm=new THREE.Object3D();pts.forEach((p,k)=>{dm.position.set(X0+p[0],0.36,p[1]);dm.updateMatrix();cone.setMatrixAt(k,dm.matrix);});cone.frustumCulled=false;scene.add(cone);
    const arrow=cv(128,128,c=>{c.fillStyle='#16181b';c.fillRect(0,0,128,128);c.fillStyle='#ffb000';c.beginPath();c.moveTo(112,64);c.lineTo(68,22);c.lineTo(68,46);c.lineTo(16,46);c.lineTo(16,82);c.lineTo(68,82);c.lineTo(68,106);c.closePath();c.fill();});
    signPost(arrow,1.6,1.6,X0+1.75,HW.wA-4,0,1.2);const tk=makeVehicle('truck',0xf2c230);tk.G.position.set(X0+1.75,0,HW.wA-40);hws.workTruck=tk;
    const wk=boardTex(192,192,'#f6c400',c=>{c.fillStyle='#111';c.font='900 56px '+FONT;c.fillText('工事中',96,70);c.font='900 40px '+FONT;c.fillText('車線減少',96,130);});signPost(wk,1.5,1.5,X0-1.2,HW.wA+230,0,2.2);}
  // goal bay after the exit toll
  hws.goal=ground(decalMat({color:0x2f7df0,opacity:0.42}),3.0,HW.goalA-HW.goalB,X0-1.75,(HW.goalA+HW.goalB)/2,0,0.06);
  // roadside trees and noise walls
  const trees=[];for(let z=-170;z>HW.end;z-=17){if(z<tA+10&&z>tB-10)continue;trees.push([X0-9-R()*45,z+R()*8,0.8+R()*0.9,0.02]);trees.push([X0+24+R()*45,z+R()*8,0.8+R()*0.9,0.02]);if(R()<0.4)trees.push([X0-60-R()*80,z,1+R(),0.02]);}
  addTrees(trees,R);xb(L(0xa9b7b0),-4.5,-4.3,0,3.2,HW.mergeEnd-40,HW.mergeEnd-330);xb(L(0xa9b7b0),17.5,17.7,0,3.2,-560,-820);
}
function resetHighway(){hws.lane=null;hws.pz=0;hws.gapT=0;hws.slowT=0;hws.passT=0;hws.missed=false;hws.goalT=0;hws.cancel=0;hws.was=false;hws.goal.visible=mode!=='course';}
function updateHighway(dt){for(const b of hwBars){const open=state==='drive'&&Math.abs(car.x-X0+1.75)<2.5&&car.z-b.z<26&&car.z-b.z>-6&&Math.abs(car.v)*3.6<=27;b.piv.rotation.z+=clamp((open?1.45:0)-b.piv.rotation.z,-dt*3,dt*3);}
  if(hws.workTruck)vehLights(hws.workTruck,false,'H',Math.floor(time*2.7)%2===0);}
function hwRules(dt){
  const u=car.x-X0,z=car.z,kmh=Math.abs(car.v)*3.6,ln=u<0?-1:u<3.5?0:1,stopped=Math.abs(car.v)<0.25,dist=d=>Math.max(0,Math.round(d/10)*10)+' m';let hint=null,ins=['↑',T('hwMain'),''];
  // lane changes need a signal for a few seconds beforehand
  if(hws.lane!=null&&ln!==hws.lane&&z<HW.gore&&z>HW.exB&&car.v>2){const side=ln>hws.lane?'R':'L';if(!(blink===side&&sigHold>1.2))violate('lanesig');hws.cancel=time+1.8;}
  hws.lane=ln;if(hws.cancel&&time>hws.cancel){blink=null;hws.cancel=0;}
  const crossed=g=>hws.pz>g&&z<=g;
  env.inTunnel=z<HW.tunA&&z>HW.tunB;if(env.inTunnel&&!hws.was){env.flash=0.62;env.flashCol='#000';}if(!env.inTunnel&&hws.was&&env.night<0.5&&z<HW.tunB+5){env.flash=0.85;env.flashCol='#fff';}hws.was=env.inTunnel;
  let lead=1e9;for(const n of npcs)if(!n.grid&&!n.opp&&Math.abs(n.x-car.x)<1.7){const q=car.z-n.z-n.hl-2.2;if(q>0&&q<lead)lead=q;}
  if(z>HW.rampA){curLimit=40;ins=['↑',T('hwToll'),dist(z-HW.gate)];hint='hEtc';if(crossed(HW.gate-1)&&kmh>25)violate('etc');}
  else if(ln<0&&z>HW.gore){curLimit=60;ins=['↑',T('hwRamp'),dist(z-HW.gore)];hint='hRamp';}
  else if(ln<0&&z>HW.mergeEnd){curLimit=100;ins=['➜',T('hwMerge'),dist(z-HW.mergeEnd)];hint='hMerge';}
  else if(ln<0){curLimit=z>HW.exB?80:40;hint=z>HW.exB?'hDecel':null;ins=z>HW.goalA+8?['↑',T('hwExitRamp'),dist(z-HW.gate2)]:['P',T('hwGoal'),''];if(z<HW.exB&&z>HW.gate2)hint='hEtc';if(crossed(HW.gate2-1)&&kmh>25)violate('etc');
    if(z<HW.goalA&&z>HW.goalB&&stopped){hint='hPark';if(car.gear==='P'&&car.hb)hws.goalT+=dt;if(hws.goalT>0.5&&mode==='hw'){finish(true);return;}}else hws.goalT=0;}
  else{const works=z<HW.wA+240&&z>HW.wB;curLimit=env.inTunnel?80:works?60:100;
    if(z>HW.tunA)ins=['↑',T('hwMain'),''];else if(env.inTunnel){ins=['↑',T('hwTunnel'),dist(z-HW.tunB)];hint='hTunnel';}
    else if(z>HW.wA)ins=['➜',T('hwWorks'),dist(z-HW.wA)];else if(z>HW.wB-30)ins=['↑',T('hwWorks'),dist(z-HW.wB)];else if(z>HW.exA+10)ins=[ln===1?'⬅':'↑',T(ln===1?'hwBack':'hwExit'),dist(z-HW.exA)];else ins=['⬅',T('hwExit'),''];
    if(z<HW.tunA+170&&z>HW.tunB&&!env.lights)hint='hLight';
    if(z<HW.mergeEnd-120&&kmh<50&&lead>50&&car.gear==='D'){hws.slowT+=dt;if(hws.slowT>7){hws.slowT=0;violate('minspeed');}}else hws.slowT=0;
    if(car.v>15&&lead<car.v*0.75){hws.gapT+=dt;hint='hGap';if(hws.gapT>2.5){hws.gapT=0;violate('gap');}}else{hws.gapT=0;if(lead<car.v*2.2&&ln===0&&!works&&!env.inTunnel&&z<HW.mergeEnd)hint=hint||'hOvertake';}
    if(ln===1&&!(z<HW.wA+260&&z>HW.wB-60)){hws.passT+=dt;if(hws.passT>10&&lead>60)hint='hKeepLeft';if(hws.passT>24){hws.passT=0;violate('passlane');}}else hws.passT=0;
    if(z<HW.exB-25&&!hws.missed){hws.missed=true;note(T('hwMissed'));if(mode==='hw'){finish(false);return;}}}
  if(env.weather!=='clear'&&!hint)hint='hWet';
  speedCheck(dt);setInstr(ins[0],ins[1],ins[2]);setHint(startHint(hint));hws.pz=z;
}
function drawHwMap(){
  const w=mapC.width,h=mapC.height,Z=z=>h-14-(HW.rampA+70-z)/(HW.rampA+70-HW.rampEnd)*(h-28),m=T('map');mx.clearRect(0,0,w,h);mx.strokeStyle='#59616d';mx.lineWidth=9;mx.beginPath();mx.moveTo(w*0.3,Z(-70));mx.lineTo(w*0.3,Z(HW.rampEnd));mx.stroke();
  mx.strokeStyle='#2c3138';mx.beginPath();mx.moveTo(w*0.3,Z(HW.tunA));mx.lineTo(w*0.3,Z(HW.tunB));mx.stroke();mx.strokeStyle='#f26a1b';mx.lineWidth=4;mx.beginPath();mx.moveTo(w*0.3-3,Z(HW.wA));mx.lineTo(w*0.3-3,Z(HW.wB));mx.stroke();
  mx.fillStyle='#e8ecf0';mx.font='700 17px sans-serif';mx.textAlign='left';mx.textBaseline='middle';[[HW.gate,m.toll],[HW.gore-60,m.merge],[(HW.tunA+HW.tunB)/2,m.tunnel],[(HW.wA+HW.wB)/2,m.works],[HW.exA-60,m.exit],[HW.gate2,m.toll]].forEach(q=>mx.fillText(q[1],w*0.3+16,Z(q[0])));
  mx.fillStyle='#d5dae0';for(const n of npcs)if(!n.grid&&!n.opp)mx.fillRect(w*0.3-3,Z(n.z)-3,6,6);
  mx.fillStyle='#f6b40e';mx.beginPath();mx.arc(w*0.3,Z(car.z),7,0,7);mx.fill();
}
