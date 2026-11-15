/* ---------- buildings, landmarks, trees ---------- */
const LMK={};                                          // landmark groups by name
function buildTown(R){
  const facade=(base,rows,cols,o)=>{const lit=[];const tex=cv(256,256,(c)=>{
    if(base.img){c.drawImage(base.img,0,0,256,256);c.fillStyle='rgba(255,240,225,0.14)';c.fillRect(0,0,256,256);}else{c.fillStyle=base.col;c.fillRect(0,0,256,256);for(let q=0;q<900;q++){c.fillStyle='rgba(0,0,0,'+(R()*0.05)+')';c.fillRect(R()*256,R()*256,2+R()*3,1+R()*7);}}
    const ch=256/rows,cw=256/cols;
    for(let r=0;r<rows;r++){const y=r*ch;
      if(o.shop&&r===rows-1){c.fillStyle='#27303b';c.fillRect(8,y+ch*0.34,240,ch*0.66);c.fillStyle='rgba(255,255,255,0.12)';for(let k=0;k<4;k++)c.fillRect(14+k*60,y+ch*0.4,50,ch*0.5);c.fillStyle=o.shop;c.fillRect(0,y+ch*0.1,256,ch*0.24);lit.push([8,y+ch*0.34,240,ch*0.66,'#7a6238']);continue;}
      if(o.balcony){c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(0,y+ch*0.1,256,ch*0.52);}
      for(let k=0;k<cols;k++){const gq=R(),wx=k*cw+cw*0.16,wy=y+ch*0.18,ww=cw*0.68,wh=ch*(o.balcony?0.42:0.54);c.fillStyle=gq<0.1?'#ead9a2':gq<0.55?'#53667a':'#6d8297';c.fillRect(wx,wy,ww,wh);c.fillStyle='rgba(255,255,255,0.2)';c.fillRect(wx,wy,ww,ch*0.07);if(R()<0.42)lit.push([wx,wy,ww,wh,R()<0.7?'#ffd98a':'#cfe4ff']);}
      if(o.balcony){c.fillStyle=o.balcony;c.fillRect(0,y+ch*0.62,256,ch*0.3);c.fillStyle='rgba(0,0,0,0.18)';c.fillRect(0,y+ch*0.9,256,ch*0.04);}
      if(o.door&&r===rows-1){c.fillStyle='#4a3a2c';c.fillRect(108,y+ch*0.3,40,ch*0.7);}
    }});const em=cv(256,256,c=>{c.fillStyle='#000';c.fillRect(0,0,256,256);for(const q of lit){c.fillStyle=q[4];c.fillRect(q[0],q[1],q[2],q[3]);}});return {tex,em};};
  // 0 shop, 1 brick shop, 2 mansion, 3 office, 4 mansion (tan), 5 house
  const kinds=[facade({col:'#d8d2c4'},3,4,{shop:'#b5482f'}),facade(IMG.brick?{img:IMG.brick}:{col:'#a8664f'},3,4,{shop:'#2f6b4f'}),facade({col:'#e7e2d7'},6,5,{balcony:'#f1efe9'}),facade({col:'#a9b3bc'},10,6,{}),facade({col:'#cfc6b4'},6,5,{balcony:'#b9a98e'}),facade({col:'#ece6da'},2,3,{door:1}),facade({col:'#7f93a6'},18,7,{})];
  const lots=[],roofs=[],avi=[],neon=[],occ=new Set(),NQ={e:null},key=(x,z)=>Math.round(x/8)+','+Math.round(z/8);
  const free=(x,z,r)=>{for(const p of PLACES)if(Math.hypot(x-p[2],z-p[3])<44)return false;for(const [a,b] of[[0,0],[r,0],[-r,0],[0,r],[0,-r]])if(occ.has(key(x+a,z+b)))return false;return true;};
  const claim=(x,z,r)=>{for(let a=-r;a<=r;a+=6)for(let b=-r;b<=r;b+=6)occ.add(key(x+a,z+b));};
  const CFG={down:{lot:[20,10],dep:[14,5],gap:1.5,p:1,rows:2},mid:{lot:[13,6],dep:[10,4],gap:1.5,p:0.95,rows:2},shop:{lot:[7,2.5],dep:[8,2],gap:0.5,p:1,rows:1,off:0.6},res:{lot:[10,3],dep:[8,2],gap:3,p:0.85,rows:2},sea:{lot:[11,4],dep:[8,2],gap:9,p:0.4,rows:1},farm:{lot:[14,5],dep:[10,3],gap:22,p:0.42,rows:1}};
  for(const e of ED){const c=CFG[e.dist];if(!c)continue;
    for(let row=0;row<c.rows;row++)for(const side of[1,-1]){let s=e.a.r+9+R()*4;while(s<e.len-e.b.r-12){const w=c.lot[0]+R()*c.lot[1],d=c.dep[0]+R()*c.dep[1],off=e.w+(e.walk?3.0:c.off||1.6)+d/2+row*(c.dep[0]+c.dep[1]+3),q=edgePos(e,s+w/2,side*off);s+=w+c.gap+(R()<0.15?c.gap*2:0);
        if(R()>c.p||TH(q.x,q.z)<1.7||q.x>coastX(q.z)-14)continue;const gy=groundY(q.x,q.z);if(Math.abs(gy-q.y)>2.5)continue;
        const o=nearest(q.x,q.z,NQ,1,e);if(o&&o.d<Math.max(o.e.wl[o.i],o.e.wr[o.i])+(o.e.walk?3:1.2)+Math.max(w,d)/2+1)continue;if(ZR-q.z>-d/2-6&&ZR-q.z<d/2+6)continue;
        const r=Math.max(w,d)/2;if(!free(q.x,q.z,r*0.8))continue;claim(q.x,q.z,r*0.8);
        let h,kd;const t=R();
        if(e.dist==='down'){h=t<0.16?46+R()*46:t<0.34?26+R()*18:t<0.8?14+R()*7:7+R()*2.5;kd=h>45?6:h>24?3:h>12?(R()<0.5?2:4):(R()<0.5?0:1);}
        else if(e.dist==='mid'){h=t<0.35?12+R()*6:6.5+R()*3;kd=h>11?(R()<0.5?2:4):(R()<0.5?0:1);}
        else if(e.dist==='shop'){h=6+R()*2.5;kd=R()<0.5?0:1;}
        else if(e.dist==='res'&&t<0.1){h=12+R()*4;kd=4;}else{h=5.2+R()*1.6;kd=5;}
        lots.push({x:q.x,z:q.z,y:Math.min(gy,q.y)-0.4,w,d,h:h+0.4,kd,yaw:yawOf(q.tx,q.tz)});
        if(h>45)avi.push([q.x,Math.min(gy,q.y)+h+0.4,q.z]);if((e.dist==='down'||e.dist==='mid'||e.dist==='shop')&&row===0&&R()<0.5){const sh=Math.min(h*0.5,3+R()*5),a=edgePos(e,s-c.gap-w*(0.15+R()*0.7),side*(off-d/2-0.35));neon.push([a.x,Math.min(gy,q.y)+Math.min(h-1,3.2+sh/2+R()*3),a.z,yawOf(q.tx,q.tz),sh]);}if(kd===5)roofs.push([q.x,q.z,Math.min(gy,q.y)+h,w,d,yawOf(q.tx,q.tz),e.dist==='farm']);}}}
  const roof=L(0xb5b5b0),unit=new THREE.BoxGeometry(1,1,1),tint=[0xffffff,0xf3ede3,0xe9eef3,0xf6ebe0],houseTint=[0xf4efe6,0xe8dcc8,0xdfe6ea,0xf0e2d6,0xd9d2c4],dm=new THREE.Object3D(),col=new THREE.Color();
  kinds.forEach((f,kd)=>{const mine=lots.filter(b=>b.kd===kd);if(!mine.length)return;const wm=new THREE.MeshLambertMaterial({map:f.tex,emissive:0xffffff,emissiveMap:f.em,emissiveIntensity:0});NIGHT.push(wm);const inst=new THREE.InstancedMesh(unit,[wm,wm,roof,roof,wm,wm],mine.length);
    mine.forEach((b,k)=>{dm.rotation.set(0,b.yaw,0);dm.position.set(b.x,b.y+b.h/2,b.z);dm.scale.set(b.w,b.h,b.d);dm.updateMatrix();inst.setMatrixAt(k,dm.matrix);inst.setColorAt(k,col.setHex((kd===5?houseTint:tint)[Math.floor(R()*(kd===5?5:4))]));});scene.add(inst);});
  {const g=new THREE.ConeGeometry(0.7072,1,4);g.rotateY(Math.PI/4);const rm=new THREE.InstancedMesh(g,L(0xffffff,{flatShading:true}),roofs.length),rc=[0x4a5560,0x6b4a3c,0x3f4a44,0x75807f,0x2f3338];
    roofs.forEach((b,k)=>{const rh=b[6]?3.2:2.2;dm.rotation.set(0,b[5],0);dm.position.set(b[0],b[2]+rh/2,b[1]);dm.scale.set(b[3]+1,rh,b[4]+1);dm.updateMatrix();rm.setMatrixAt(k,dm.matrix);rm.setColorAt(k,col.setHex(b[6]?0x2f3338:rc[Math.floor(R()*5)]));});scene.add(rm);}
  // rooftop aviation lights on the towers, neon signs on shop fronts (they glow at night because they are unlit materials)
  {const am=new THREE.InstancedMesh(new THREE.BoxGeometry(0.7,0.5,0.7),aviMat,Math.max(1,avi.length));avi.forEach((q,k)=>{dm.rotation.set(0,0,0);dm.scale.set(1,1,1);dm.position.set(q[0],q[1],q[2]);dm.updateMatrix();am.setMatrixAt(k,dm.matrix);});scene.add(am);
    const nm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.9,1,0.25),new THREE.MeshBasicMaterial({color:0xffffff}),Math.max(1,neon.length)),nc=[0xff4b5c,0x38c6ff,0xffd23f,0x5cf2a0,0xff7ad9,0xffffff,0xff8a2b];
    neon.forEach((q,k)=>{dm.rotation.set(0,q[3],0);dm.scale.set(1,q[4],1);dm.position.set(q[0],q[1],q[2]);dm.updateMatrix();nm.setMatrixAt(k,dm.matrix);nm.setColorAt(k,col.setHex(nc[Math.floor(R()*nc.length)]));});scene.add(nm);}
  // street lamps on the pavements with a pool of light under each, hedges along the big streets
  {const lamps=[],hedge=[];for(const e of ED){if(!e.walk)continue;let k=0;for(let s=e.a.r+10;s<e.len-e.b.r-8;s+=27,k++){const sd=k%2?1:-1,q=edgePos(e,s,sd*(e.w+0.5));lamps.push([q.x,q.y,q.z,Math.atan2(-q.tz*sd,q.tx*sd)]);}
      if(e.kind==='main'||e.key==='S1-S2'||e.key==='S2-S3')for(const sd of[1,-1])for(let s=e.a.r+8;s<e.len-e.b.r-10;s+=5.8){const q=edgePos(e,s,sd*(e.w+0.5));if(Math.abs(q.z-ZR)>7)hedge.push([q.x,q.y,q.z,yawOf(q.tx,q.tz)]);}}
    const po=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06,0.09,6.4,6),L(0x6f757c),lamps.length),hd=new THREE.InstancedMesh(new THREE.BoxGeometry(1.5,0.14,0.34),streetLampMat,lamps.length),cg=new THREE.CircleGeometry(1,20);cg.rotateX(-Math.PI/2);
    const pool=new THREE.InstancedMesh(cg,glowMat({}),lamps.length);pool.material.userData.k=0.42;
    lamps.forEach((q,k)=>{dm.scale.set(1,1,1);dm.rotation.set(0,0,0);dm.position.set(q[0],q[1]+3.4,q[2]);dm.updateMatrix();po.setMatrixAt(k,dm.matrix);const cx=Math.sin(q[3]),cz=Math.cos(q[3]);dm.rotation.set(0,q[3]+Math.PI/2,0);dm.position.set(q[0]-cx*0.7,q[1]+6.5,q[2]-cz*0.7);dm.updateMatrix();hd.setMatrixAt(k,dm.matrix);
      dm.rotation.set(0,0,0);dm.scale.set(8,1,8);dm.position.set(q[0]-cx*2.2,q[1]+0.12,q[2]-cz*2.2);dm.updateMatrix();pool.setMatrixAt(k,dm.matrix);});scene.add(po,hd,pool);
    const hm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.7,0.6,4.3),L(0x3f6b3a),hedge.length);hedge.forEach((q,k)=>{dm.scale.set(1,1,1);dm.rotation.set(0,q[3],0);dm.position.set(q[0],q[1]+0.5,q[2]);dm.updateMatrix();hm.setMatrixAt(k,dm.matrix);});scene.add(hm);}
  // --- landmarks: a few boxes each, with a name board facing the nearest road
  const mats={white:L(0xeef0f1),cream:L(0xe9e2cf),grey:L(0x9aa3ab),wood:L(0x6b4a32),dark:L(0x2f3338),red:L(0xc8372d),glass:L(0x33475a),blue:L(0x2d5fa8),stone:L(0xa9a59b),green:L(0x4f8a4a),sand:L(0xd9c48f)};
  const pyr=new THREE.ConeGeometry(0.7072,1,4);pyr.rotateY(Math.PI/4);
  const mk=(name,parts,o)=>{const p=PLACES.find(q=>q[0]===name),G=new THREE.Group(),nr=nearest(p[2],p[3],NQ,3),e=nr.e,rx=e.px[nr.i]-p[2],rz=e.pz[nr.i]-p[3];G.position.set(p[2],groundY(p[2],p[3]),p[3]);G.rotation.y=Math.atan2(rx,rz);scene.add(G);
    for(const q of parts){const m=q[0]==='pyr'?new THREE.Mesh(pyr,mats[q[1]]):q[0]==='cyl'?new THREE.Mesh(new THREE.CylinderGeometry(q[2]/2,q[4]/2,q[3],16),mats[q[1]]):new THREE.Mesh(unit,mats[q[0]]);const b=q[0]==='pyr'||q[0]==='cyl'?1:0;m.scale.set(q[0]==='cyl'?1:q[1+b],q[0]==='cyl'?1:q[2+b],q[0]==='cyl'?1:q[3+b]);m.position.set(q[4+b],q[5+b]+(q[0]==='cyl'?q[3]/2:q[2+b]/2),q[6+b]);G.add(m);}
    const bw=Math.max(3.2,name.length*0.95),bd=new THREE.Mesh(new THREE.PlaneGeometry(bw,1.1),dim(new THREE.MeshBasicMaterial({map:textBoard([name],bw,1.1,(o&&o.bg)||'#1c4c9c')})));bd.position.set((o&&o.bx)||0,(o&&o.by)||4.2,(o&&o.bz)||0);G.add(bd);LMK[name]=G;return G;};
  mk('若葉駅',[['stone',70,0.5,30,0,-0.4,0],['cream',46,7,12,0,0,-4],['dark',48,0.5,14,0,7,-4],['cream',6,12,6,0,0,-4],['white',4,3,0.3,0,8,-0.9]],{by:5.2,bz:2.2});
  mk('市役所',[['stone',52,0.5,40,0,-0.4,0],['grey',34,20,18,0,0,-6],['glass',34.2,14,0.3,0,4,3.1],['white',40,6,22,0,0,-6],['white',6,26,6,-12,0,-8]],{by:7.2,bz:5.3});
  mk('ワカバモール',[['stone',78,0.5,62,0,-0.4,0],['white',62,13,40,0,0,-8],['red',62.4,2,40.4,0,9.5,-8],['glass',30,6,0.4,0,0,12.2],['grey',20,4,20,24,13,-12]],{by:8.5,bz:12.5,bg:'#c8372d'});
  mk('若葉小学校',[['sand',70,0.3,50,0,-0.25,0],['cream',46,11,11,0,0,-12],['glass',44,2.2,0.3,0,3.2,-6.4],['glass',44,2.2,0.3,0,7,-6.4],['cream',5,15,5,0,0,-12],['white',2.4,2.4,0.3,0,11.5,-9.3]],{by:4.5,bz:-6.2});
  mk('若葉団地',[['stone',64,0.5,64,0,-0.4,0],['cream',40,15,10,0,0,-20],['cream',40,15,10,0,0,0],['cream',40,15,10,0,0,20],['glass',40.2,1.2,10.2,0,4,-20],['glass',40.2,1.2,10.2,0,9,-20],['glass',40.2,1.2,10.2,0,4,0],['glass',40.2,1.2,10.2,0,9,0],['glass',40.2,1.2,10.2,0,4,20],['glass',40.2,1.2,10.2,0,9,20]],{by:3.2,bz:26});
  mk('若葉寺',[['stone',40,1.2,34,0,-0.6,0],['wood',16,5.5,11,0,0.6,-6],['pyr','dark',24,6,18,0,6.1,-6],['red',0.6,5,0.6,-3.2,0.6,12],['red',0.6,5,0.6,3.2,0.6,12],['pyr','dark',10,2.4,4,0,5.6,12],['stone',1.4,2.6,1.4,-9,0.6,6],['stone',1.4,2.6,1.4,9,0.6,6]],{by:3.4,bz:14.2,bg:'#4a3a2c'});
  mk('中央公園',[['green',70,0.25,70,0,-0.1,0],['stone',10,0.5,10,0,0,0],['blue',6,0.6,6,0,0.1,0]],{by:2.6,bz:30});
  mk('若葉港',[['stone',70,0.6,46,6,-0.5,0],['grey',30,9,16,-8,0,-8],['blue',24,7,14,22,0,-10],['red',1.2,22,1.2,24,0,12],['red',16,1.2,1.2,30,20,12]],{by:5,bz:0.4,bx:-8});
  mk('海水浴場',[['sand',60,0.3,40,8,-0.2,0],['white',5,3,4,-10,0,-4],['blue',5,3,4,-2,0,-4],['red',5,3,4,6,0,-4],['wood',12,0.4,5,14,2.8,6]],{by:4,bx:-2,bz:-1.8});
  mk('岬の灯台',[['stone',14,1,14,0,-0.6,0],['cyl','white',3.2,16,4.4,0,0.4,0],['cyl','red',3.8,1.2,3.8,0,16.4,0],['cyl','glass',2.6,2.2,2.6,0,17.6,0],['pyr','red',3.4,1.6,3.4,0,19.8,0]],{by:3,bz:7.5});
  mk('青葉峠 展望台',[['stone',26,0.8,18,0,-0.5,0],['wood',10,0.4,8,-4,3,0],['wood',0.4,3,0.4,-8,0,-3],['wood',0.4,3,0.4,0,0,-3],['wood',0.4,3,0.4,-8,0,3],['wood',0.4,3,0.4,0,0,3],['pyr','dark',12,2.2,10,-4,3.4,0]],{by:2.6,bx:8});
  mk('道の駅 山手',[['stone',60,0.5,40,0,-0.4,0],['wood',30,5,12,0,0,-8],['pyr','dark',36,5,16,0,5,-8],['green',6,3,6,22,0,-8]],{by:3.4,bz:-1.8,bg:'#0f7a4a'});
  mk('山手町役場',[['stone',36,0.5,28,0,-0.4,0],['cream',22,8,12,0,0,-4],['glass',20,1.6,0.3,0,5,2.1],['dark',23,0.5,13,0,8,-4]],{by:3,bz:2.3});
  mk('山手温泉',[['stone',34,0.5,28,0,-0.4,0],['wood',18,5,12,0,0,-4],['pyr','dark',24,4.5,16,0,5,-4],['cyl','stone',9,0.8,9,10,0,8],['cyl','blue',8,0.2,8,10,0.75,8]],{by:3.2,bz:2.3,bg:'#c8372d'});
  mk('棚田',[['red',0.5,5,0.5,-2.6,0,0],['red',0.5,5,0.5,2.6,0,0],['red',7.4,0.5,0.6,0,4.6,0],['red',6,0.35,0.5,0,3.7,0]],{by:6.2});
  // --- trees: forest on the mountains, street trees in town, a grove in the park
  const forest=[],street=[],TQ={e:null};
  for(let q=0;q<5200&&forest.length<2300;q++){const x=-260+R()*1380,z=-3170+R()*2330,t=TH(x,z);if(t<12||x>coastX(z)-8)continue;if(z<-2330&&R()<0.86)continue;const nr=nearest(x,z,TQ,1);if(nr&&nr.d<Math.max(nr.e.wl[nr.i],nr.e.wr[nr.i])+7)continue;if(!free(x,z,2))continue;forest.push([x,z,1.1+R()*1.3,groundY(x,z)-0.2]);}
  for(const e of ED)if(e.kind==='main'||e.kind==='coast'||e.key==='S2-S3'||e.key==='S1-S2')for(const side of[1,-1])for(let s=e.a.r+16;s<e.len-e.b.r-16;s+=23){const q=edgePos(e,s,side*(e.w+(e.walk?1.5:2.4)));if(Math.abs(q.z-ZR)>9&&q.x<coastX(q.z)-10)street.push([q.x,q.z,0.55+R()*0.3,q.y+0.1]);}
  {const p=PLACES.find(q=>q[0]==='中央公園');for(let q=0;q<46;q++){const a=R()*6.3,r=8+R()*26;street.push([p[2]+Math.cos(a)*r,p[3]+Math.sin(a)*r,0.9+R()*0.8,groundY(p[2],p[3])]);}}
  const sakura=[];for(const key of['N1-N2','N2-O2','O2-N3','N3-N4','C1-C2'])for(const side of[1,-1]){const e=EK[key];for(let s=e.a.r+9;s<e.len-e.b.r-9;s+=11.5){const q=edgePos(e,s,side*(e.w+(e.walk?1.4:2.6)));if(q.x<coastX(q.z)-10)sakura.push([q.x,q.z,0.75+R()*0.35,q.y+0.1]);}}
  {const p=PLACES.find(q=>q[0]==='中央公園');for(let q=0;q<22;q++){const a=q/22*6.283;sakura.push([p[2]+Math.cos(a)*33,p[3]+Math.sin(a)*33,1+R()*0.3,groundY(p[2],p[3])]);}}
  addTrees(forest,R,0);addTrees(street,R,1);addTrees(sakura,R,1,[0.93,0.55,0.78]);
}
/* ---------- expressway furniture: guard rails, tunnel, toll gates, parking area, road works ---------- */
function buildExpressway(R){
  const railing=L(0xd9dde1,{side:THREE.DoubleSide}),conc=L(0xb4b6b3,{side:THREE.DoubleSide}),tw=L(0x8a8780,{side:THREE.DoubleSide}),ceil=L(0x34332f,{side:THREE.DoubleSide}),lights=[];
  for(const e of ED){if(e.kind!=='hw')continue;const [t0,t1]=idxR(e,e.tun[0],e.tun[1]);
    for(const [a,b] of[[0,t0],[t1,e.n-1]]){wall(e,a,b,k=>e.wl[k]+0.6,0.3,0.85,railing);wall(e,a,b,-6.5,0,0.95,conc);}
    wall(e,t0,t1,k=>e.wl[k]+0.9,0,5.9,tw);wall(e,t0,t1,-6.5,0,5.9,tw);strip(e,t0,t1,k=>e.wl[k]+0.9,-6.5,5.9,ceil);
    for(let s=e.tun[0]+8;s<e.tun[1];s+=14){const q=edgePos(e,s,0);lights.push([q.x,q.y+5.8,q.z,yawOf(q.tx,q.tz)]);}
    for(const s of e.tun){const q=edgePos(e,s,0),G=new THREE.Group();G.position.set(q.x,q.y,q.z);G.rotation.y=yawOf(q.tx,q.tz);scene.add(G);box(conc,2,8,1.6,-e.w-1.9,4,0,G);box(conc,2,8,1.6,7.5,4,0,G);box(conc,e.w+10.4,2.4,1.6,2.8,7,0,G);}}
  {const lm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.35,0.08,1.6),new THREE.MeshBasicMaterial({color:0xffb45e}),lights.length),dm=new THREE.Object3D();lights.forEach((q,k)=>{dm.position.set(q[0],q[1],q[2]);dm.rotation.y=q[3];dm.updateMatrix();lm.setMatrixAt(k,dm.matrix);});scene.add(lm);}
  function idxR(e,s0,s1){return[idxAt(e,s0),Math.min(e.n-1,idxAt(e,s1)+1)];}
  // toll gates on the two access roads
  const etc=boardTex(256,96,'#5b2a8c',c=>{c.font='900 52px '+FONT;c.fillText('ETC専用',128,50);}),yel=L(0xf2c230);
  for(const e of ED)if(e.toll){const s=e.len/2,q=edgePos(e,s,0),G=new THREE.Group();G.position.set(q.x,q.y,q.z);G.rotation.y=yawOf(q.tx,q.tz);scene.add(G);e.feat.push({t:'toll',s});
    for(const x of[-e.w-0.4,0,e.w+0.4])box(conc,0.7,1,8,x,0.5,0,G);box(L(0x9aa6b2),1,2,3,0,2,0,G);box(L(0xe8eaec),2*e.w+3,0.4,9,0,4.9,0,G);for(const x of[-e.w-0.4,e.w+0.4])box(poleMat,0.2,4,0.2,x,2.9,0,G);
    for(const d of[1,-1]){const bd=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.0),dim(new THREE.MeshBasicMaterial({map:etc})));bd.position.set(d*e.w/2,5.7,d*4.6);bd.rotation.y=d>0?0:Math.PI;G.add(bd);
      const piv=new THREE.Group();piv.position.set(d*(e.w+0.1),1.0,-d*2);G.add(piv);box(yel,e.w-0.5,0.1,0.1,-d*(e.w-0.5)/2,0,0,piv);tollGates.push({piv,e,s:s+d*2,d,sgn:d});}}
  const nb=PAinfo.nb,board=(lines,s,u,w,h,bg,e)=>{const q=edgePos(e||nb,s,u);signPost(textBoard(lines,w,h,bg||'#0f7a4a'),w,h,q.x,q.y,q.z,q.tx,q.tz,3.4);};
  const lw=s=>nb.wl[idxAt(nb,s)]+2.6;
  board(['青葉トンネル','ライト点灯'],nb.tun[0]-150,lw(nb.tun[0]-150),4.6,2);board(['⬅ 青葉PA','300m'],PAinfo.dec[0]-300,6.1,4,2);board(['⬅ PA'],PAinfo.dec[0]+20,8.5,2.6,1.3);
  board(['工事中','左車線規制'],PAinfo.works[0]-190,6.1,4.2,2,'#c98a00');board(['山手 出口','料金所'],nb.len-190,6.1,4,2);
  const sb=EK['VI-IC0'];board(['青葉トンネル','ライト点灯'],sb.tun[0]-150,6.1,4.6,2,null,sb);board(['若葉 出口','料金所'],sb.len-190,6.1,4,2,null,sb);
  for(const [e,s,n,bl] of[[nb,60,100],[nb,90,50,1],[nb,nb.tun[0]-60,80],[nb,nb.tun[1]+30,100],[nb,PAinfo.works[0]-90,60],[nb,PAinfo.works[1]+40,100],[sb,60,100],[sb,sb.tun[0]-60,80],[sb,sb.tun[1]+30,100]]){const q=edgePos(e,s,e.wl[idxAt(e,s)]+1.3);signPost(roundSignTex(n,bl),1,1,q.x,q.y,q.z,q.tx,q.tz,2.6,backRound);}
  // parking area: a wide apron beside the PA road, a rest house
  {const e=PAinfo.lot;strip(e,0,e.n-1,18,e.w,0.07,P(0x3b3f45,{polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));const q=edgePos(e,e.len/2,26),G=new THREE.Group();G.position.set(q.x,q.y,q.z);G.rotation.y=yawOf(q.tx,q.tz)-Math.PI/2;scene.add(G);
    box(L(0xe9e2cf),22,4.5,9,0,2.25,0,G);box(L(0x2f3338),24,0.5,11,0,4.75,0,G);const bd=new THREE.Mesh(new THREE.PlaneGeometry(5,1.2),dim(new THREE.MeshBasicMaterial({map:textBoard(['青葉PA'],5,1.2,'#0f7a4a')})));bd.position.set(0,3.4,4.6);G.add(bd);
    const pk=decalMat({color:0xf0f2f4});for(let s=8;s<e.len-6;s+=3){const a=edgePos(e,s,10);ground(pk,0.14,5,a.x,a.y+0.1,a.z,yawOf(a.tx,a.tz)+Math.PI/2);}
    const bay=edgePos(e,e.len/2,10);PAinfo.bay={x:bay.x,z:bay.z};}
  // road works: the left lane is coned off
  {const pts=[],[w0,w1]=PAinfo.works;for(let s=w0-70;s<w0;s+=6)pts.push([s,3.2-(s-w0+70)/70*3.0]);for(let s=w0;s<=w1;s+=7)pts.push([s,0.15]);for(let s=w1;s<w1+26;s+=6)pts.push([s,0.2+(s-w1)/26*3.0]);
    const cone=new THREE.InstancedMesh(new THREE.ConeGeometry(0.2,0.7,8),L(0xf26a1b),pts.length),dm=new THREE.Object3D();pts.forEach((p,k)=>{const q=edgePos(nb,p[0],p[1]);dm.position.set(q.x,q.y+0.42,q.z);dm.updateMatrix();cone.setMatrixAt(k,dm.matrix);});scene.add(cone);
    const arrow=cv(128,128,c=>{c.fillStyle='#16181b';c.fillRect(0,0,128,128);c.fillStyle='#ffb000';c.beginPath();c.moveTo(112,64);c.lineTo(68,22);c.lineTo(68,46);c.lineTo(16,46);c.lineTo(16,82);c.lineTo(68,82);c.lineTo(68,106);c.closePath();c.fill();});
    const a=edgePos(nb,w0+4,1.75);signPost(arrow,1.6,1.6,a.x,a.y,a.z,a.tx,a.tz,1.2);const tk=makeVehicle('truck',0xf2c230),b=edgePos(nb,w0+40,1.75);tk.G.position.set(b.x,b.y,b.z);tk.G.rotation.y=yawOf(b.tx,b.tz);PAinfo.truck=tk;}
}
