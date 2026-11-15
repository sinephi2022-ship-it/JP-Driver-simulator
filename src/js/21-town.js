/* ---------- buildings, landmarks, trees ---------- */
const LMK={},FOOT=[];                                  // FOOT: footprints [x,z,w,d,tx,tz,label] for the placement self-check                                          // landmark groups by name
const underDeck=(x,z)=>{for(const e of ED)if(e.bump)for(let i=0;i<e.n;i++)if(e.elev[i]&&Math.abs(e.px[i]-x)<e.w+7&&Math.abs(e.pz[i]-z)<e.w+7)return true;return false;};
const sideW=(e,s,sd)=>{const i=idxAt(e,clamp(s,0,e.len));return sd>0?e.wl[i]:e.wr[i];};
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
  const kinds=[facade({col:'#d8d2c4'},3,4,{shop:'#b5482f'}),facade(IMG.brick?{img:IMG.brick}:{col:'#a8664f'},3,4,{shop:'#2f6b4f'}),facade({col:'#e7e2d7'},6,5,{balcony:'#f1efe9'}),facade({col:'#a9b3bc'},10,6,{}),facade({col:'#cfc6b4'},6,5,{balcony:'#b9a98e'}),facade({col:'#ece6da'},2,3,{door:1}),facade({col:'#7f93a6'},18,7,{}),
    facade({col:'#4f5660'},8,5,{}),facade({col:'#f1f1ee'},7,6,{balcony:'#7fa3c9'}),facade({col:'#6b4f3a'},2,3,{shop:'#2f3338'}),facade({col:'#c9ccd0'},5,3,{shop:'#1c4c9c'}),facade({col:'#d9b99a'},4,4,{balcony:'#fff5e6'}),facade({col:'#b9c4bd'},2,4,{door:1}),facade({col:'#5a4634'},2,3,{door:1}),facade({col:'#f4f2ec'},2,2,{door:1}),facade({col:'#8a7a62'},1,4,{door:1})];
  const isHouse=k=>k===5||k>=12;
  const pick=a=>a[Math.floor(R()*a.length)];
  const lots=[],roofs=[],avi=[],neon=[],units=[],occ=new Set(),NQ={e:null},key=(x,z)=>Math.round(x/8)+','+Math.round(z/8);
  const free=(x,z,r)=>{for(const p of PLACES)if(Math.hypot(x-p[2],z-p[3])<44)return false;for(const [a,b] of[[0,0],[r,0],[-r,0],[0,r],[0,-r]])if(occ.has(key(x+a,z+b)))return false;return true;};
  const claim=(x,z,r)=>{for(let a=-r;a<=r;a+=6)for(let b=-r;b<=r;b+=6)occ.add(key(x+a,z+b));};
  // every corner (and the middle) of a footprint must be off the carriageways, pavements and junction pads
  const clear=(x,z,w,d,tx,tz)=>{const hw2=w/2,hd=d/2;for(const [a,b] of[[0,0],[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]){const px=x+tx*a*hw2+tz*b*hd,pz=z+tz*a*hw2-tx*b*hd,o=nearest(px,pz,NQ,2);
      if(o&&o.d<Math.max(o.e.wl[o.i],o.e.wr[o.i])+(o.e.walk?3.1:1.3))return false;for(const k in ND){const n=ND[k];if(n.r&&Math.abs(px-n.x)<n.r+6&&Math.abs(pz-n.z)<n.r+6&&Math.hypot(px-n.x,pz-n.z)<n.r+5.4)return false;}}return true;};
  const CFG={down:{lot:[20,10],dep:[14,5],gap:1.5,p:1,rows:2},mid:{lot:[13,6],dep:[10,4],gap:1.5,p:0.95,rows:2},shop:{lot:[7,2.5],dep:[8,2],gap:0.5,p:1,rows:1,off:0.6},res:{lot:[10,3],dep:[8,2],gap:3,p:0.85,rows:2},sea:{lot:[11,4],dep:[8,2],gap:9,p:0.4,rows:1},farm:{lot:[13,5],dep:[10,3],gap:13,p:0.6,rows:1}};
  river(R,claim);prefabs(R,claim,free,clear);
  for(const e of ED){const c=CFG[e.dist];if(!c)continue;
    for(let row=0;row<c.rows;row++)for(const side of[1,-1]){let s=e.a.r+9+R()*4;while(s<e.len-e.b.r-12){const w=c.lot[0]+R()*c.lot[1],d=c.dep[0]+R()*c.dep[1],off=e.w+(e.walk?3.0:c.off||1.6)+d/2+row*(c.dep[0]+c.dep[1]+3),q=edgePos(e,s+w/2,side*off);s+=w+c.gap+(R()<0.15?c.gap*2:0);
        if(R()>c.p||TH(q.x,q.z)<1.7||q.x>coastX(q.z)-14)continue;const gy=groundY(q.x,q.z);if(Math.abs(gy-q.y)>2.5)continue;
        if(!clear(q.x,q.z,w,d,q.tx,q.tz))continue;if(ZR-q.z>-d/2-6&&ZR-q.z<d/2+6)continue;
        const r=Math.max(w,d)/2;if(!free(q.x,q.z,r*0.8))continue;claim(q.x,q.z,r*0.8);
        let h,kd;const t=R();
        if(e.dist==='down'){h=t<0.16?46+R()*46:t<0.34?26+R()*18:t<0.8?14+R()*7:7+R()*2.5;kd=h>45?6:h>24?pick([3,7,3]):h>12?pick([2,4,8,11,7]):pick([0,1,10]);}
        else if(e.dist==='mid'){h=t<0.35?12+R()*6:6.5+R()*3;kd=h>11?pick([2,4,8,11]):pick([0,1,10,9]);}
        else if(e.dist==='shop'){h=6+R()*2.5;kd=pick([0,1,9,9]);}
        else if(e.dist==='res'&&t<0.12){h=12+R()*4;kd=pick([4,8,11]);}else if(e.dist==='farm'){kd=pick([5,12,13,13,14,15]);h=kd===15?3.4+R():kd===14?6.5+R():5.2+R()*1.6;}else{h=5.2+R()*1.6;kd=R()<0.25?12:5;}
        lots.push({x:q.x,z:q.z,y:Math.min(gy,q.y)-0.4,w,d,h:h+0.4,kd,yaw:yawOf(q.tx,q.tz)});FOOT.push([q.x,q.z,w+(isHouse(kd)?1:0),d+(isHouse(kd)?1:0),q.tx,q.tz,'house '+e.key]);
        if(h>45)avi.push([q.x,Math.min(gy,q.y)+h+0.4,q.z]);if((e.dist==='down'||e.dist==='mid'||e.dist==='shop')&&row===0&&R()<0.5){const sh=Math.min(h*0.5,3+R()*5),a=edgePos(e,s-c.gap-w*(0.15+R()*0.7),side*(off-d/2-0.35));neon.push([a.x,Math.min(gy,q.y)+Math.min(h-1,3.2+sh/2+R()*3),a.z,yawOf(q.tx,q.tz),sh]);}if(h>13&&kd!==5)for(let u=0;u<1+Math.floor(R()*3);u++)units.push([q.x+(R()-0.5)*w*0.5,Math.min(gy,q.y)+h+0.4,q.z+(R()-0.5)*d*0.5,yawOf(q.tx,q.tz),1.2+R()*2.2,0.9+R()*1.4]);
        if(isHouse(kd))roofs.push([q.x,q.z,Math.min(gy,q.y)+h,w,d,yawOf(q.tx,q.tz),e.dist==='farm']);}}}
  const roof=L(0xb5b5b0),unit=new THREE.BoxGeometry(1,1,1),tint=[0xffffff,0xf3ede3,0xe9eef3,0xf6ebe0],houseTint=[0xf4efe6,0xe8dcc8,0xdfe6ea,0xf0e2d6,0xd9d2c4],dm=new THREE.Object3D(),col=new THREE.Color();
  kinds.forEach((f,kd)=>{const mine=lots.filter(b=>b.kd===kd);if(!mine.length)return;const wm=new THREE.MeshLambertMaterial({map:f.tex,emissive:0xffffff,emissiveMap:f.em,emissiveIntensity:0});NIGHT.push(wm);const inst=new THREE.InstancedMesh(unit,[wm,wm,roof,roof,wm,wm],mine.length);
    mine.forEach((b,k)=>{dm.rotation.set(0,b.yaw,0);dm.position.set(b.x,b.y+b.h/2,b.z);dm.scale.set(b.w,b.h,b.d);dm.updateMatrix();inst.setMatrixAt(k,dm.matrix);inst.setColorAt(k,col.setHex(kd>=13?0xffffff:(isHouse(kd)?houseTint:tint)[Math.floor(R()*(isHouse(kd)?5:4))]));});scene.add(inst);});
  {const g=new THREE.ConeGeometry(0.7072,1,4);g.rotateY(Math.PI/4);const rm=new THREE.InstancedMesh(g,L(0xffffff,{flatShading:true}),roofs.length),rc=[0x4a5560,0x6b4a3c,0x3f4a44,0x75807f,0x2f3338];
    roofs.forEach((b,k)=>{const rh=b[6]?3.2:2.2;dm.rotation.set(0,b[5],0);dm.position.set(b[0],b[2]+rh/2,b[1]);dm.scale.set(b[3]+1,rh,b[4]+1);dm.updateMatrix();rm.setMatrixAt(k,dm.matrix);rm.setColorAt(k,col.setHex(b[6]?[0x2f3338,0x3b4a5c,0x5a3a30,0x46524a,0x34383d][Math.floor(R()*5)]:rc[Math.floor(R()*5)]));});scene.add(rm);}
  // rooftop aviation lights on the towers, neon signs on shop fronts (they glow at night because they are unlit materials)
  {const am=new THREE.InstancedMesh(new THREE.BoxGeometry(0.7,0.5,0.7),aviMat,Math.max(1,avi.length));avi.forEach((q,k)=>{dm.rotation.set(0,0,0);dm.scale.set(1,1,1);dm.position.set(q[0],q[1],q[2]);dm.updateMatrix();am.setMatrixAt(k,dm.matrix);});scene.add(am);
    const nm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.9,1,0.25),new THREE.MeshBasicMaterial({color:0xffffff}),Math.max(1,neon.length)),nc=[0xff4b5c,0x38c6ff,0xffd23f,0x5cf2a0,0xff7ad9,0xffffff,0xff8a2b];
    neon.forEach((q,k)=>{dm.rotation.set(0,q[3],0);dm.scale.set(1,q[4],1);dm.position.set(q[0],q[1],q[2]);dm.updateMatrix();nm.setMatrixAt(k,dm.matrix);nm.setColorAt(k,col.setHex(nc[Math.floor(R()*nc.length)]));});scene.add(nm);}
  {const um=new THREE.InstancedMesh(unit,L(0xa9adb0),Math.max(1,units.length));units.forEach((q,k)=>{dm.rotation.set(0,q[3],0);dm.scale.set(q[4],q[5],q[4]*0.8);dm.position.set(q[0],q[1]+q[5]/2,q[2]);dm.updateMatrix();um.setMatrixAt(k,dm.matrix);});scene.add(um);}
  // street lamps on the pavements with a pool of light under each, hedges along the big streets
  {const lamps=[],hedge=[];for(const e of ED){if(e.kind==='hw'||e.kind==='ramp')continue;let k=0;for(let s=e.a.r+10;s<e.len-e.b.r-8;s+=e.walk?27:46,k++){const sd=e.walk?(k%2?1:-1):1,q=edgePos(e,s,sd*(sideW(e,s,sd)+(e.walk?0.5:1.1)));if(!nearSign(q.x,q.z,2.6)&&!(e.bump?false:underDeck(q.x,q.z)))lamps.push([q.x,q.y,q.z,Math.atan2(-q.tz*sd,q.tx*sd)]);}
      if(e.walk&&(e.kind==='main'||e.key==='S1-S2'||e.key==='S2-S3'))for(const sd of[1,-1])for(let s=e.a.r+8;s<e.len-e.b.r-10;s+=5.8){if(sideW(e,s,sd)>e.w+0.3)continue;const q=edgePos(e,s,sd*(e.w+0.5));if(Math.abs(q.z-ZR)>7&&!nearSign(q.x,q.z,3.4))hedge.push([q.x,q.y,q.z,yawOf(q.tx,q.tz)]);}}
    const po=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06,0.09,6.4,6),L(0x6f757c),lamps.length),hd=new THREE.InstancedMesh(new THREE.BoxGeometry(1.5,0.14,0.34),streetLampMat,lamps.length),cg=new THREE.CircleGeometry(1,20);cg.rotateX(-Math.PI/2);
    const pool=new THREE.InstancedMesh(cg,glowMat({}),lamps.length);pool.material.userData.k=0.2;
    lamps.forEach((q,k)=>{dm.scale.set(1,1,1);dm.rotation.set(0,0,0);dm.position.set(q[0],q[1]+3.4,q[2]);dm.updateMatrix();po.setMatrixAt(k,dm.matrix);const cx=Math.sin(q[3]),cz=Math.cos(q[3]);dm.rotation.set(0,q[3]+Math.PI/2,0);dm.position.set(q[0]-cx*0.7,q[1]+6.5,q[2]-cz*0.7);dm.updateMatrix();hd.setMatrixAt(k,dm.matrix);
      dm.rotation.set(0,0,0);dm.scale.set(8,1,8);dm.position.set(q[0]-cx*2.2,q[1]+0.12,q[2]-cz*2.2);dm.updateMatrix();pool.setMatrixAt(k,dm.matrix);});scene.add(po,hd,pool);
    const hm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.7,0.6,4.3),L(0x3f6b3a),hedge.length);hedge.forEach((q,k)=>{dm.scale.set(1,1,1);dm.rotation.set(0,q[3],0);dm.position.set(q[0],q[1]+0.5,q[2]);dm.updateMatrix();hm.setMatrixAt(k,dm.matrix);});scene.add(hm);}
  // --- landmarks: a few boxes each, with a name board facing the nearest road
  const mats={white:L(0xeef0f1),cream:L(0xe9e2cf),grey:L(0x9aa3ab),wood:L(0x6b4a32),dark:L(0x2f3338),red:L(0xc8372d),glass:L(0x33475a),blue:L(0x2d5fa8),stone:L(0xa9a59b),green:L(0x4f8a4a),sand:L(0xd9c48f)};
  const pyr=new THREE.ConeGeometry(0.7072,1,4);pyr.rotateY(Math.PI/4);const lmTrees=[];
  const M=n=>{if(mats[n])return mats[n];const f=kinds[+n.slice(1)],m=new THREE.MeshLambertMaterial({map:f.tex,emissive:0xffffff,emissiveMap:f.em,emissiveIntensity:0});NIGHT.push(m);return mats[n]=m;};
  const mk=(name,parts,o)=>{const p=PLACES.find(q=>q[0]===name),G=new THREE.Group(),nr=nearest(p[2],p[3],NQ,3),e=nr.e,rx=e.px[nr.i]-p[2],rz=e.pz[nr.i]-p[3];const yaw=Math.atan2(rx,rz),fx=Math.sin(yaw),fz=Math.cos(yaw);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    for(const q of parts){const b=q[0]==='pyr'||q[0]==='cyl'?1:0,w=q[0]==='cyl'?Math.max(q[2],q[4]):q[1+b],l=q[0]==='cyl'?w:q[3+b];x0=Math.min(x0,q[4+b]-w/2);x1=Math.max(x1,q[4+b]+w/2);z0=Math.min(z0,q[6+b]-l/2);z1=Math.max(z1,q[6+b]+l/2);}
    // slide the whole site away from any road it would overlap
    for(let it=0;it<30;it++){let hit=null;for(const [a,b] of[[x0,z1],[x1,z1],[(x0+x1)/2,z1],[x0,z0],[x1,z0],[x0,(z0+z1)/2],[x1,(z0+z1)/2],[(x0+x1)/2,z0],[0,0]]){const px=p[2]+fz*a+fx*b,pz=p[3]-fx*a+fz*b,o=nearest(px,pz,NQ,2);if(o&&o.d<Math.max(o.e.wl[o.i],o.e.wr[o.i])+(o.e.walk?3.4:1.8)){hit=[px-(o.e.px[o.i]+o.e.px[o.i+1])/2,pz-(o.e.pz[o.i]+o.e.pz[o.i+1])/2];break;}}
      if(!hit)break;const m=Math.hypot(hit[0],hit[1])||1;p[2]+=hit[0]/m*2.5;p[3]+=hit[1]/m*2.5;}
    FOOT.push([p[2]+fz*(x0+x1)/2+fx*(z0+z1)/2,p[3]-fx*(x0+x1)/2+fz*(z0+z1)/2,x1-x0,z1-z0,fz,-fx,'place '+name]);
    G.position.set(p[2],groundY(p[2],p[3]),p[3]);G.rotation.y=yaw;scene.add(G);
    for(const q of parts){const m=q[0]==='pyr'?new THREE.Mesh(pyr,M(q[1])):q[0]==='cyl'?new THREE.Mesh(new THREE.CylinderGeometry(q[2]/2,q[4]/2,q[3],16),M(q[1])):new THREE.Mesh(unit,q[0][0]==='f'?[M(q[0]),M(q[0]),mats.grey,mats.grey,M(q[0]),M(q[0])]:M(q[0]));const b=q[0]==='pyr'||q[0]==='cyl'?1:0;m.scale.set(q[0]==='cyl'?1:q[1+b],q[0]==='cyl'?1:q[2+b],q[0]==='cyl'?1:q[3+b]);m.position.set(q[4+b],q[5+b]+(q[0]==='cyl'?q[3]/2:q[2+b]/2),q[6+b]);G.add(m);}
    const bw=Math.max(3.2,name.length*0.95),bd=new THREE.Mesh(new THREE.PlaneGeometry(bw,1.1),dim(new THREE.MeshBasicMaterial({map:textBoard([name],bw,1.1,(o&&o.bg)||'#1c4c9c')})));bd.position.set((o&&o.bx)||0,(o&&o.by)||4.2,(o&&o.bz)||0);G.add(bd);LMK[name]=G;
    if(!(o&&o.bare)){const rr=(o&&o.tr)||26,gy=G.position.y;for(let a=0;a<8;a++){const an=a/8*6.283+0.4,x=p[2]+Math.cos(an)*rr,z=p[3]+Math.sin(an)*rr,nq=nearest(x,z,NQ,1);if(nq&&nq.d<Math.max(nq.e.wl[nq.i],nq.e.wr[nq.i])+4||x>coastX(z)-6)continue;lmTrees.push([x,z,0.8+R()*0.5,groundY(x,z)]);}}return G;};
  mk('若葉駅',[['stone',70,0.5,30,0,-0.4,0],['f10',46,7,12,0,0,-4],['dark',20,0.3,5,0,3.6,4],['grey',0.3,3.6,0.3,-9,0,6],['grey',0.3,3.6,0.3,9,0,6],['grey',60,1.1,5,0,0,-13],['white',44,0.25,6,0,4.4,-13],['dark',48,0.5,14,0,7,-4],['cream',6,12,6,0,0,-4],['white',4,3,0.3,0,8,-0.9]],{by:5.2,bz:2.2});
  mk('市役所',[['stone',52,0.5,40,0,-0.4,0],['f3',34,20,18,0,0,-6],['white',40,6,22,0,0,-6],['glass',14,4,0.4,0,0.6,5.1],['white',16,0.5,5,0,5.6,7],['white',0.6,5.6,0.6,-7,0,9],['white',0.6,5.6,0.6,7,0,9],['white',6,26,6,-12,0,-8],['grey',0.15,9,0.15,16,0,10],['red',1.6,1,0.05,16.8,7.8,10]],{by:7.2,bz:5.3});
  mk('ワカバモール',[['stone',78,0.5,62,0,-0.4,0],['f7',62,13,40,0,0,-8],['red',62.4,2,40.4,0,11.2,-8],['glass',30,6,0.4,0,0,12.2],['white',34,0.5,5,0,6.2,14],['grey',20,4,20,18,13,-12],['grey',58,1.1,0.3,0,13,11.6],['blue',6,7,0.4,-24,5,12.3],['cream',6,7,0.4,24,5,12.3]],{by:8.5,bz:12.5,bg:'#c8372d'});
  mk('若葉小学校',[['sand',70,0.3,50,0,-0.25,0],['f11',46,11,11,0,0,-12],['f11',14,8,20,-30,0,2],['grey',24,0.4,14,-30,8,2],['white',0.2,3,5,10,0,14],['white',0.2,3,5,18,0,14],['white',8.2,0.2,0.2,14,3,16.4],['cream',5,15,5,0,0,-12],['white',2.4,2.4,0.3,0,11.5,-9.3]],{by:4.5,bz:-6.2});
  mk('若葉団地',[['stone',64,0.5,64,0,-0.4,0],['f8',40,15,10,0,0,-20],['f8',40,15,10,0,0,0],['f8',40,15,10,0,0,20],['cream',4,17,4,-22,0,-20],['cream',4,17,4,-22,0,0],['cream',4,17,4,-22,0,20],['cyl','grey',3,3,3,-22,17,0],['green',10,0.3,8,24,0,10],['blue',3,2.4,0.3,24,0.3,10]],{by:3.2,bz:26});
  mk('若葉寺',[['stone',40,1.2,34,0,-0.6,0],['wood',16,5.5,11,0,0.6,-6],['pyr','dark',24,6,18,0,6.1,-6],['red',0.6,5,0.6,-3.2,0.6,12],['red',0.6,5,0.6,3.2,0.6,12],['pyr','dark',10,2.4,4,0,5.6,12],['stone',1.4,2.6,1.4,-9,0.6,6],['stone',1.4,2.6,1.4,9,0.6,6],['wood',5,4,5,13,0.6,-8],['pyr','dark',7.5,2,7.5,13,4.6,-8],['wood',3.4,3,3.4,13,6.2,-8],['pyr','dark',6,1.8,6,13,9.2,-8],['wood',2.2,2.6,2.2,13,10.6,-8],['pyr','dark',4.6,2.2,4.6,13,13.2,-8],['stone',12,0.4,3,0,0.6,2.5],['cyl','stone',1.2,1.6,1.6,-13,0.6,2]],{by:3.4,bz:14.2,bg:'#4a3a2c'});
  mk('中央公園',[['green',70,0.25,70,0,-0.1,0],['stone',10,0.5,10,0,0,0],['blue',6,0.6,6,0,0.1,0]],{by:2.6,bz:30});
  mk('若葉港',[['stone',70,0.6,46,6,-0.5,0],['grey',30,9,16,-8,0,-8],['blue',24,7,14,22,0,-10],['red',1.2,22,1.2,24,0,12],['red',16,1.2,1.2,30,20,12]],{by:5,bz:0.4,bx:-8});
  mk('海水浴場',[['sand',60,0.3,40,8,-0.2,0],['white',5,3,4,-10,0,-4],['blue',5,3,4,-2,0,-4],['red',5,3,4,6,0,-4],['wood',12,0.4,5,14,2.8,6]],{by:4,bx:-2,bz:-1.8});
  mk('岬の灯台',[['stone',14,1,14,0,-0.6,0],['cyl','white',3.2,16,4.4,0,0.4,0],['cyl','red',3.8,1.2,3.8,0,16.4,0],['cyl','glass',2.6,2.2,2.6,0,17.6,0],['pyr','red',3.4,1.6,3.4,0,19.8,0]],{by:3,bz:7.5});
  mk('青葉峠 展望台',[['stone',26,0.8,18,0,-0.5,0],['wood',10,0.4,8,-4,3,0],['wood',0.4,3,0.4,-8,0,-3],['wood',0.4,3,0.4,0,0,-3],['wood',0.4,3,0.4,-8,0,3],['wood',0.4,3,0.4,0,0,3],['pyr','dark',12,2.2,10,-4,3.4,0]],{by:2.6,bx:8});
  mk('道の駅 山手',[['stone',60,0.5,40,0,-0.4,0],['wood',30,5,12,0,0,-8],['pyr','dark',36,5,16,0,5,-8],['green',6,3,6,22,0,-8],['white',26,0.3,4,0,3.2,0],['wood',0.3,3.2,0.3,-12,0,1.8],['wood',0.3,3.2,0.3,12,0,1.8],['red',2,1.4,1,-18,0,2],['blue',2,1.4,1,-21,0,2]],{by:3.4,bz:-1.8,bg:'#0f7a4a'});
  mk('山手町役場',[['stone',36,0.5,28,0,-0.4,0],['f10',22,8,12,0,0,-4],['dark',23,0.5,13,0,8,-4],['white',8,0.4,4,0,3.4,3.5],['grey',0.15,8,0.15,13,0,6],['red',1.5,0.9,0.05,13.8,7,6]],{by:3,bz:2.3});
  mk('山手温泉',[['stone',34,0.5,28,0,-0.4,0],['wood',18,5,12,0,0,-4],['pyr','dark',24,4.5,16,0,5,-4],['cyl','stone',9,0.8,9,10,0,8],['cyl','blue',8,0.2,8,10,0.75,8]],{by:3.2,bz:2.3,bg:'#c8372d'});
  mk('棚田',[['red',0.5,5,0.5,-2.6,0,0],['red',0.5,5,0.5,2.6,0,0],['red',7.4,0.5,0.6,0,4.6,0],['red',6,0.35,0.5,0,3.7,0]],{by:6.2});
  // --- trees: forest on the mountains, street trees in town, a grove in the park
  const forest=[],street=[],TQ={e:null};
  for(let q=0;q<5200&&forest.length<2300;q++){const x=-260+R()*1380,z=-3170+R()*2330,t=TH(x,z);if(t<12||x>coastX(z)-8)continue;if(z<-2330&&R()<0.62)continue;const nr=nearest(x,z,TQ,1);if(nr&&nr.d<Math.max(nr.e.wl[nr.i],nr.e.wr[nr.i])+7)continue;if(!free(x,z,2))continue;forest.push([x,z,1.1+R()*1.3,groundY(x,z)-0.2]);}
  for(const e of ED)if(e.kind==='main'||e.kind==='coast'||e.key==='S2-S3'||e.key==='S1-S2')for(const side of[1,-1])for(let s=e.a.r+16;s<e.len-e.b.r-16;s+=23){const q=edgePos(e,s,side*(sideW(e,s,side)+(e.walk?1.5:2.4)));if(Math.abs(q.z-ZR)>9&&q.x<coastX(q.z)-10&&!nearSign(q.x,q.z,3.2))street.push([q.x,q.z,0.55+R()*0.3,q.y+0.1]);}
  {const p=PLACES.find(q=>q[0]==='中央公園');for(let q=0;q<46;q++){const a=R()*6.3,r=8+R()*26;street.push([p[2]+Math.cos(a)*r,p[3]+Math.sin(a)*r,0.9+R()*0.8,groundY(p[2],p[3])]);}}
  const sakura=[];for(const key of['N1-N2','N2-O2','O2-N3','N3-N4','C1-C2'])for(const side of[1,-1]){const e=EK[key];for(let s=e.a.r+9;s<e.len-e.b.r-9;s+=11.5){const q=edgePos(e,s,side*(sideW(e,s,side)+(e.walk?1.4:2.6)));if(q.x<coastX(q.z)-10&&!nearSign(q.x,q.z,3.2))sakura.push([q.x,q.z,0.75+R()*0.35,q.y+0.1]);}}
  {const p=PLACES.find(q=>q[0]==='中央公園');for(let q=0;q<22;q++){const a=q/22*6.283;sakura.push([p[2]+Math.cos(a)*33,p[3]+Math.sin(a)*33,1+R()*0.3,groundY(p[2],p[3])]);}}
  farmland(R,free,claim);
  for(const t of lmTrees)street.push(t);
  addTrees(forest,R,0);addTrees(street,R,1);addTrees(sakura,R,1,[0.93,0.55,0.78]);
}
/* ---------- expressway furniture: guard rails, tunnel, toll gates, parking area, road works ---------- */
function buildExpressway(R){
  const railing=L(0xd9dde1,{side:THREE.DoubleSide}),conc=L(0xb4b6b3,{side:THREE.DoubleSide}),tw=L(0x8a8780,{side:THREE.DoubleSide}),ceil=L(0x34332f,{side:THREE.DoubleSide}),lights=[];
  const nbT=PAinfo.nb,runs=(e,ok)=>{const out=[];let st=-1;for(let i=0;i<=e.n;i++){const g=i<e.n&&ok(e.ps[i],i);if(g&&st<0)st=i;if(!g&&st>=0){if(i-1>st)out.push([st,i-1]);st=-1;}}return out;};
  for(const e of ED){if(e.kind!=='hw')continue;const open=s=>s>95&&s<e.len-95&&!(s>e.tun[0]-1&&s<e.tun[1]+1),ramp=s=>e===nbT&&s>PAinfo.dec[0]-45&&s<PAinfo.acc[1]+8;
    for(const [a,b] of runs(e,s=>open(s)&&!ramp(s)))wall(e,a,b,k=>Math.max(e.wl[k],e.w)+0.6,0.3,0.85,railing);                 // outer guard rail, not across the PA ramps
    if(e===nbT)for(const [a,b] of runs(e,open))wall(e,a,b,-6.5,0,0.95,conc);}                                     // one median barrier for both carriageways
  // tunnel: one structure for both tubes, built along the northbound line (the southbound line is exactly 13 m to its right)
  {const e=nbT,[t0,t1]=idxR(e,e.tun[0],e.tun[1]),flo=L(0x4a4d52);
    wall(e,t0,t1,4.4,0,5.9,tw);wall(e,t0,t1,-6.5,0,5.9,tw);wall(e,t0,t1,-17.4,0,5.9,tw);strip(e,t0,t1,4.4,-17.4,5.9,ceil);strip(e,Math.max(0,idxAt(e,e.tun[0]-24)),Math.min(e.n-1,idxAt(e,e.tun[1]+24)+1),13,-26,0.02,flo);   // floor, continued as an apron outside both mouths
    for(let s=e.tun[0]+8;s<e.tun[1];s+=14)for(const u of[0,-13]){const q=edgePos(e,s,u);lights.push([q.x,q.y+5.8,q.z,yawOf(q.tx,q.tz)]);}
    for(const s of e.tun){const q=edgePos(e,s,0),G=new THREE.Group();G.position.set(q.x,q.y,q.z);G.rotation.y=yawOf(q.tx,q.tz);scene.add(G);   // portal head wall with two openings (local x = right of travel)
      box(conc,14,17,1.8,-11.4,8.5,0,G);box(conc,1.3,6,1.8,6.5,3,0,G);box(conc,14,17,1.8,24.4,8.5,0,G);box(conc,24,11,1.8,6.5,11.5,0,G);box(L(0x7f8286),50,0.8,2.4,6.5,17.2,0,G);}}
  {const lm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.35,0.08,1.6),new THREE.MeshBasicMaterial({color:0xffb45e}),lights.length),dm=new THREE.Object3D();lights.forEach((q,k)=>{dm.position.set(q[0],q[1],q[2]);dm.rotation.y=q[3];dm.updateMatrix();lm.setMatrixAt(k,dm.matrix);});scene.add(lm);}
  function idxR(e,s0,s1){return[idxAt(e,s0),Math.min(e.n-1,idxAt(e,s1)+1)];}
  // toll gates on the two access roads
  const etc=boardTex(256,96,'#5b2a8c',c=>{c.font='900 52px '+FONT;c.fillText('ETC専用',128,50);}),yel=L(0xf2c230);
  for(const e of ED)if(e.toll){const s=e.len/2,q=edgePos(e,s,0),G=new THREE.Group();G.position.set(q.x,q.y,q.z);G.rotation.y=yawOf(q.tx,q.tz);scene.add(G);e.feat.push({t:'toll',s});
    for(const x of[-e.w-0.4,0,e.w+0.4])box(conc,0.7,1,8,x,0.5,0,G);box(L(0x9aa6b2),1,2,3,0,2,0,G);box(L(0xe8eaec),2*e.w+3,0.4,9,0,4.9,0,G);for(const x of[-e.w-0.4,e.w+0.4])box(poleMat,0.2,4,0.2,x,2.9,0,G);
    for(const d of[1,-1]){const bd=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.0),dim(new THREE.MeshBasicMaterial({map:etc})));bd.position.set(d*e.w/2,5.7,d*4.6);bd.rotation.y=d>0?0:Math.PI;G.add(bd);
      const piv=new THREE.Group();piv.position.set(d*(e.w+0.1),1.0,-d*2);G.add(piv);box(yel,e.w-0.5,0.1,0.1,-d*(e.w-0.5)/2,0,0,piv);tollGates.push({piv,e,s,d:-d,sgn:-d});}}
  const nb=PAinfo.nb,board=(lines,s,u,w,h,bg,e)=>{const q=edgePos(e||nb,s,u);signPost(textBoard(lines,w,h,bg||'#0f7a4a'),w,h,q.x,q.y,q.z,q.tx,q.tz,3.4);};
  const lw=s=>nb.wl[idxAt(nb,s)]+2.6;
  board(['青葉トンネル','ライト点灯'],nb.tun[0]-150,lw(nb.tun[0]-150),4.6,2);board(['⬅ 青葉PA','すぐ先'],nb.tun[1]+16,6.4,4,2);board(['⬅ PA'],PAinfo.dec[0]+20,8.5,2.6,1.3);
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

/* ---------- convenience stores, petrol stations, coin parking ---------- */
const PROPS=[];                                        // parked cars used as scenery (solid)
function propCar(x,y,z,yaw,col){const v=makeVehicle(Math.random()<0.25?'van':'car',col);v.G.userData.dyn=false;if(v.beam)v.beam.visible=false;for(const f of v.flare)f.visible=false;v.G.position.set(x,y,z);v.G.rotation.y=yaw;PROPS.push(v);STATB.push(x,z,-Math.sin(yaw),-Math.cos(yaw),v.hl,v.wid/2);return v;}
function prefabs(R,claim,free,clear){
  const white=L(0xf2f3f4),glass=L(0x33475a),grey=L(0x8f969d),dark=L(0x2f3338),pad=P(0x45494f),line=decalMat({color:0xf0f2f4});
  const place=(key,f,side,w,d,build)=>{const e=EK[key];if(!e)return;const s=e.len*f,off=sideW(e,s,side)+(e.walk?3.2:1.8)+d/2,q=edgePos(e,s,side*off);if(!free(q.x,q.z,Math.max(w,d)*0.4)||!clear(q.x,q.z,w,d,q.tx,q.tz))return;claim(q.x,q.z,Math.max(w,d)*0.5);FOOT.push([q.x,q.z,w,d,q.tx,q.tz,'shop '+key]);
    const G=new THREE.Group();G.position.set(q.x,groundY(q.x,q.z),q.z);G.rotation.y=Math.atan2(-q.tz*side,q.tx*side)+Math.PI;scene.add(G);box(pad,w,0.24,d,0,0.02,0,G);build(G,q,side,e,s);};   // local +z faces the road
  const sign=(G,lines,w,h,bg,x,y,z,fg)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dim(new THREE.MeshBasicMaterial({map:textBoard(lines,w,h,bg,fg)})));m.position.set(x,y,z);G.add(m);return m;};
  const cars=(G,xs,z,yaw)=>{G.updateMatrixWorld(true);for(const x of xs){const p=new THREE.Vector3(x,0.14,z);G.localToWorld(p);propCar(p.x,p.y,p.z,G.rotation.y+yaw,VEH_COL[Math.floor(R()*VEH_COL.length)]);}};
  const konbini=(band)=>(G)=>{box(white,15,3.6,8,0,1.9,-4,G);box(L(band),15.1,0.7,8.1,0,3.3,-4,G);box(glass,13,2.2,0.1,0,1.4,0.02,G);sign(G,['コンビニ わかば'],8,0.62,'#ffffff',0,3.32,0.1,'#1c4c9c');
    for(const x of[-5,-2.5,0,2.5,5])box(line,0.12,0.02,4.6,x,0.15,4.4,G);cars(G,[-3.75,1.25],4.6,0);const pl=new THREE.Mesh(poleGeo,poleMat);pl.scale.set(2,6,2);pl.position.set(8.4,3,7);G.add(pl);sign(G,['24h'],1.8,1.2,'#1c4c9c',8.4,5.6,7.1);};
  const gas=(G)=>{box(white,16,0.5,9,0,5.2,1,G);box(L(0xd4222b),16.1,0.5,9.1,0,4.75,1,G);for(const x of[-6.5,6.5])for(const z of[-2.5,4.5])box(grey,0.4,5,0.4,x,2.5,z,G);for(const x of[-4,0,4]){box(L(0xf2c230),0.9,1.5,0.6,x,0.9,1,G);box(dark,1.6,0.2,1.2,x,0.2,1,G);}
    box(white,9,3.2,5,-3,1.7,-6.5,G);box(glass,7,1.8,0.1,-3,1.4,-3.98,G);sign(G,['ガソリン','レギュラー 168'],3.4,1.9,'#d4222b',9.2,5.2,6.6);const pl=new THREE.Mesh(poleGeo,poleMat);pl.scale.set(2.4,5,2.4);pl.position.set(9.2,2.5,6.5);G.add(pl);cars(G,[-4],3.2,Math.PI/2);};
  const coin=(G)=>{for(const x of[-7.5,-4.5,-1.5,1.5,4.5,7.5])box(line,0.12,0.02,5,x,0.15,0,G);sign(G,['P','空'],1.6,2,'#1c4c9c',8.6,3.4,5.5);const pl=new THREE.Mesh(poleGeo,poleMat);pl.scale.set(2,3,2);pl.position.set(8.6,1.5,5.4);G.add(pl);cars(G,[-6,-3,3],0,0);box(L(0xf2c230),0.5,1.3,0.4,-8.6,0.8,4.6,G);};
  place('S2-S3',0.3,1,18,13,konbini(0x2f9e5a));place('A1-N1',0.5,-1,18,13,konbini(0x2d5fa8));place('N3-N4',0.25,1,18,13,konbini(0xe07b1a));place('IC1-NE',0.5,-1,18,13,konbini(0x2f9e5a));place('V3-V2',0.42,-1,18,13,konbini(0x2d5fa8));place('A5-C1',0.45,-1,18,13,konbini(0xe07b1a));
  place('A4-A5',0.5,-1,20,17,gas);place('N3u-IC1',0.62,1,20,17,gas);place('V3-V1',0.5,1,20,17,gas);
  place('S3-A3',0.4,-1,19,7,coin);place('A2-N2',0.35,1,19,7,coin);place('S3-S4',0.55,-1,19,7,coin);place('N1-N2',0.5,-1,19,7,coin);
}
/* ---------- the countryside around 山手町: paddies, greenhouses, sheds, a small shrine ---------- */
function farmland(R,free,claim){
  const FQ={e:null},spots=(n,rad,test)=>{const out=[];for(let q=0;q<n*14&&out.length<n;q++){const x=250+R()*720,z=-3120+R()*760,o=nearest(x,z,FQ,2);if(o&&o.d<Math.max(o.e.wl[o.i],o.e.wr[o.i])+rad+3)continue;if(x>coastX(z)-40||Math.abs(TH(x+8,z)-TH(x-8,z))+Math.abs(TH(x,z+8)-TH(x,z-8))>1.6||!free(x,z,rad))continue;if(test&&!test(x,z))continue;claim(x,z,rad);out.push([x,z,groundY(x,z),R()*3.14]);}return out;};
  const dm=new THREE.Object3D(),inst=(geo,mat,list,f)=>{if(!list.length)return;const m=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((q,k)=>{f(q,dm);dm.updateMatrix();m.setMatrixAt(k,dm.matrix);});scene.add(m);};
  // flooded rice paddies with a low bank round each
  const pad=spots(46,13),wm=P(0x5f8f7a,{shininess:90,specular:0x9fb8b0}),pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);
  inst(new THREE.BoxGeometry(1,1,1),L(0x7a6a4a),pad,(q,d)=>{d.rotation.set(0,q[3],0);d.scale.set(24,0.5,17);d.position.set(q[0],q[2]-0.12,q[1]);});inst(pg,wm,pad,(q,d)=>{d.rotation.set(0,q[3],0);d.scale.set(22.6,1,15.6);d.position.set(q[0],q[2]+0.15,q[1]);});
  {const rows=[];for(const q of pad)for(let a=-9;a<=9;a+=2.2)for(let b=-6;b<=6;b+=2)rows.push([q[0]+Math.cos(q[3])*a+Math.sin(q[3])*b,q[1]-Math.sin(q[3])*a+Math.cos(q[3])*b,q[2]]);
    inst(new THREE.ConeGeometry(0.22,0.6,4),L(0x7fbf4a),rows,(q,d)=>{d.rotation.set(0,0,0);d.scale.set(1,1,1);d.position.set(q[0],q[2]+0.4,q[1]);});}
  // greenhouses
  const gh=spots(16,11),gg=new THREE.CylinderGeometry(3.2,3.2,1,10,1,false,0,Math.PI);gg.rotateZ(Math.PI/2);gg.rotateY(Math.PI/2);
  inst(gg,L(0xe9eef0,{side:THREE.DoubleSide,transparent:true,opacity:0.86}),gh,(q,d)=>{d.rotation.set(0,q[3],0);d.scale.set(1,1,18);d.position.set(q[0],q[2],q[1]);});
  // sheds with tin roofs, silos, hay bales
  const sh=spots(14,6),cg=new THREE.ConeGeometry(0.7072,1,4);cg.rotateY(Math.PI/4);
  inst(new THREE.BoxGeometry(1,1,1),L(0x8a6f52),sh,(q,d)=>{d.rotation.set(0,q[3],0);d.scale.set(7,3,5);d.position.set(q[0],q[2]+1.5,q[1]);});inst(cg,L(0x6f7b85,{flatShading:true}),sh,(q,d)=>{d.rotation.set(0,q[3],0);d.scale.set(8.4,1.6,6.2);d.position.set(q[0],q[2]+3.8,q[1]);});
  const si=spots(5,4);inst(new THREE.CylinderGeometry(1.6,1.6,7,12),L(0xc9ccd0),si,(q,d)=>{d.rotation.set(0,0,0);d.scale.set(1,1,1);d.position.set(q[0],q[2]+3.5,q[1]);});inst(new THREE.ConeGeometry(1.7,1.2,12),L(0x9a3b32),si,(q,d)=>{d.position.set(q[0],q[2]+7.6,q[1]);});
  const hb=spots(40,2),hg=new THREE.CylinderGeometry(0.75,0.75,1.3,10);hg.rotateZ(Math.PI/2);inst(hg,L(0xd9c27a),hb,(q,d)=>{d.rotation.set(0,q[3],0);d.scale.set(1,1,1);d.position.set(q[0],q[2]+0.75,q[1]);});
  {const g=[];for(let q=0;q<9000&&g.length<2600;q++){const x=250+R()*760,z=-3130+R()*800;if(x>coastX(z)-20)continue;const o=nearest(x,z,FQ,2);if(o&&o.d<Math.max(o.e.wl[o.i],o.e.wr[o.i])+1)continue;if(!free(x,z,1))continue;g.push([x,z,groundY(x,z)]);}
    const col=new THREE.Color(),m=new THREE.InstancedMesh(new THREE.ConeGeometry(0.3,0.7,4),L(0xffffff),g.length);g.forEach((q,k)=>{dm.rotation.set(0,R()*3,0);dm.scale.set(0.7+R(),0.6+R()*0.9,0.7+R());dm.position.set(q[0],q[2]+0.3,q[1]);dm.updateMatrix();m.setMatrixAt(k,dm.matrix);m.setColorAt(k,col.setHSL(0.22+R()*0.1,0.5,0.32+R()*0.14));});scene.add(m);}
  // utility poles along the village roads
  const po=[];for(const e of ED)if(e.dist==='farm')for(let s=20;s<e.len-20;s+=38){const q=edgePos(e,s,-(sideW(e,s,-1)+1.6));if(!nearSign(q.x,q.z,2.5))po.push([q.x,q.z,q.y]);}
  inst(new THREE.CylinderGeometry(0.1,0.14,8,6),L(0x6b5a48),po,(q,d)=>{d.rotation.set(0,0,0);d.scale.set(1,1,1);d.position.set(q[0],q[2]+4,q[1]);});inst(new THREE.BoxGeometry(1.5,0.1,0.1),L(0x4a4a4a),po,(q,d)=>{d.position.set(q[0],q[2]+7.4,q[1]);});
}

/* ---------- a stream through the valley of 山手町 (it passes under the lanes in culverts) ---------- */
function river(R,claim){
  const pts=[[236,-2440],[330,-2590],[300,-2790],[418,-2902],[560,-2936],[742,-2952],[900,-2990],[1100,-3085]],e={a:{x:pts[0][0],z:pts[0][1],y:0,ed:[]},b:{x:pts[pts.length-1][0],z:pts[pts.length-1][1],y:0,ed:[]},mid:pts.slice(1,-1),kind:'river',w:5,key:'river'};
  e.a.y=TH(e.a.x,e.a.z);e.b.y=TH(e.b.x,e.b.z);sampleEdge(e);for(let i=0;i<e.n;i++)e.py[i]=Math.min(e.py[i],groundY(e.px[i],e.pz[i]));
  const water=P(0x3f7fa6,{shininess:30,specular:0x2a4656,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),bank=L(0x6f7a52,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),NQ={e:null},rail=L(0xd9dde1,{side:THREE.DoubleSide});WET.push(water);
  let st=-1;for(let i=0;i<=e.n;i++){const o=i<e.n?nearest(e.px[i],e.pz[i],NQ,1):null,dry=i>=e.n||o&&o.d<Math.max(o.e.wl[o.i],o.e.wr[o.i])+1.2||e.px[i]>coastX(e.pz[i])+10;
    if(!dry){claim(e.px[i],e.pz[i],8);if(st<0)st=i;}else if(st>=0){if(i-1>st){strip(e,st,i-1,7.4,-7.4,0.1,bank);strip(e,st,i-1,5,-5,0.16,water);}st=-1;
      if(o&&i<e.n){const r=o.e,s0=o.s;for(const sd of[1,-1]){const a=idxAt(r,Math.max(0,s0-9)),b=Math.min(r.n-1,idxAt(r,Math.min(r.len,s0+9))+1);wall(r,a,b,sd*(r.w+0.3),0.1,0.95,rail);}}}}
  // reeds along the banks
  const reeds=[];for(let i=2;i<e.n-2;i+=1)for(const sd of[1,-1])if(R()<0.8){const u=sd*(5.6+R()*1.6),x=e.px[i]+e.tz[i]*u,z=e.pz[i]-e.tx[i]*u,o=nearest(x,z,NQ,1);if(o&&o.d<Math.max(o.e.wl[o.i],o.e.wr[o.i])+1.5)continue;reeds.push([x,z,e.py[i]]);}
  const dm=new THREE.Object3D(),m=new THREE.InstancedMesh(new THREE.ConeGeometry(0.28,1.3,4),L(0x7f9a4a),reeds.length);reeds.forEach((q,k)=>{dm.position.set(q[0],q[2]+0.7,q[1]);dm.scale.set(1,0.7+R()*0.8,1);dm.updateMatrix();m.setMatrixAt(k,dm.matrix);});scene.add(m);
}
