/* ---------- world: shared helpers ---------- */
const poleMat=L(0x9aa1a8),poleGeo=new THREE.CylinderGeometry(0.06,0.06,1,8),lampGeo=new THREE.SphereGeometry(0.17,12,8);
const streetLampMat=new THREE.MeshBasicMaterial({color:0x8d9399});
function asphaltFill(c,w,h,R){c.fillStyle='#3b3f45';c.fillRect(0,0,w,h);for(let q=0;q<w*h/40;q++){c.fillStyle=R()<0.5?'rgba(255,255,255,'+(0.02+R()*0.05)+')':'rgba(0,0,0,'+(0.04+R()*0.1)+')';c.fillRect(R()*w,R()*h,1+R()*2,1+R()*2);}}
const _round={};
function roundSignTex(n,blue){const k=n+(blue?'b':'');return _round[k]||(_round[k]=cv(256,256,c=>{c.beginPath();c.arc(128,128,108,0,7);c.fillStyle=blue?'#1c4c9c':'#fff';c.fill();if(!blue){c.lineWidth=30;c.strokeStyle='#d4222b';c.stroke();}
  c.fillStyle=blue?'#fff':'#1c4c9c';c.font='700 '+(n>99?100:124)+'px "Barlow Condensed",Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(n,128,blue?120:136);if(blue)c.fillRect(64,186,128,12);}));}
const backTri=cv(64,64,c=>{c.beginPath();c.moveTo(32,60);c.lineTo(3,7);c.lineTo(61,7);c.closePath();c.fillStyle='#8a9097';c.fill();}),backRound=cv(64,64,c=>{c.beginPath();c.arc(32,32,30,0,7);c.fillStyle='#8a9097';c.fill();}),backRect=cv(8,8,c=>{c.fillStyle='#8a9097';c.fillRect(0,0,8,8);});
// a sign on a pole, facing drivers travelling in direction d
function signPost(tex,w,h,x,z,d,y,back,noPole){if(!noPole){const p=new THREE.Mesh(poleGeo,poleMat);p.scale.set(w>1.5?2:1,y,w>1.5?2:1);p.position.set(x,y/2,z);scene.add(p);}
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dim(new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:0.4})));m.position.set(x,y+h*0.3,z);m.rotation.y=yawFor(d);scene.add(m);
  const f=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dim(new THREE.MeshBasicMaterial({map:back||backRect,alphaTest:0.4})));f.position.copy(m.position);f.rotation.y=yawFor(d)+Math.PI;scene.add(f);return m;}
function boardTex(w,h,bg,draw){return cv(w,h,c=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.strokeStyle='#fff';c.lineWidth=6;c.strokeRect(6,6,w-12,h-12);c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';draw(c,w,h);});}
function addTrees(trees,R){const dm=new THREE.Object3D(),col=new THREE.Color();
  const tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12,0.17,2.4,7),L(0x6b5440),trees.length),cr=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5,1),L(0xffffff),trees.length);
  trees.forEach((t,k)=>{const y0=t[3]||0.15;dm.rotation.set(0,R()*6,0);dm.position.set(t[0],y0+1.2*t[2],t[1]);dm.scale.set(t[2],t[2],t[2]);dm.updateMatrix();tr.setMatrixAt(k,dm.matrix);dm.position.y=y0+3.3*t[2];dm.scale.set(t[2],t[2]*(1+R()*0.3),t[2]);dm.updateMatrix();cr.setMatrixAt(k,dm.matrix);cr.setColorAt(k,col.setHSL(0.27+R()*0.07,0.42,0.3+R()*0.1));});
  tr.frustumCulled=cr.frustumCulled=false;scene.add(tr,cr);}

function buildWorld(){
  const R=rng(7);
  // base asphalt
  const baseTex=cv(256,256,(c,w,h)=>asphaltFill(c,w,h,R));baseTex.wrapS=baseTex.wrapT=THREE.RepeatWrapping;baseTex.repeat.set(200,200);
  const baseMat=P(0xffffff,{map:baseTex});WET.push(baseMat);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),baseMat);g.rotation.x=-Math.PI/2;g.position.set(MAXX/2,0,MAXZ/2);scene.add(g);
  // road surface with lane markings (10 m tiles)
  const roadTex=(center,dashed)=>{const t=cv(256,128,(c,w,h)=>{asphaltFill(c,w,h,R);c.fillStyle='#e9ecef';c.fillRect(0,5,w,4);c.fillRect(0,h-9,w,4);c.fillStyle=center;c.fillRect(0,h/2-2.5,dashed?w/2:w,5);});t.wrapS=THREE.RepeatWrapping;return t;};
  const wideTex=cv(256,256,(c,w,h)=>{asphaltFill(c,w,h,R);c.fillStyle='rgba(150,62,38,0.34)';c.fillRect(0,0,w,62);c.fillRect(0,h-62,w,62);c.fillStyle='#e9ecef';c.fillRect(0,3,w,3);c.fillRect(0,h-6,w,3);c.fillRect(0,62,w*0.55,4);c.fillRect(0,h-66,w*0.55,4);c.fillStyle='#f2c230';c.fillRect(0,h/2-5,w,3);c.fillRect(0,h/2+2,w,3);});wideTex.wrapS=THREE.RepeatWrapping;
  const rm=t=>{const m=P(0xffffff,{map:t,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});WET.push(m);return m;};
  const roadMat={w:rm(roadTex('#e9ecef',true)),y:rm(roadTex('#f2c230',false)),wide:rm(wideTex)};
  function seg(axis,idx,a,b){const len=b-a,wd=hw(axis,idx),geo=new THREE.PlaneGeometry(len,2*wd),uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setX(k,uv.getX(k)*len/10);
    const m=new THREE.Mesh(geo,wd>4?roadMat.wide:(axis==='v'&&idx===3)?roadMat.y:roadMat.w);m.rotation.set(-Math.PI/2,0,axis==='v'?Math.PI/2:0);
    if(axis==='h')m.position.set((a+b)/2,0.02,idx*S);else m.position.set(idx*S,0.02,(a+b)/2);scene.add(m);}
  for(let j=0;j<ROWS;j++){seg('h',j,-OUT,-CW[0]-5.5);for(let i=0;i<COLS-1;i++)seg('h',j,i*S+CW[i]+5.5,(i+1)*S-CW[i+1]-5.5);seg('h',j,MAXX+CW[COLS-1]+5.5,MAXX+OUT);}
  for(let i=0;i<COLS;i++){seg('v',i,i===3?-112:-OUT,-RW[0]-5.5);for(let j=0;j<ROWS-1;j++)seg('v',i,j*S+RW[j]+5.5,(j+1)*S-RW[j+1]-5.5);seg('v',i,MAXZ+RW[ROWS-1]+5.5,MAXZ+OUT);}
  // sidewalk slabs + buildings
  const xB=[[-OUT,-CW[0]]],zB=[[-OUT,-110],[-110,-RW[0]],[RW[0],S-RW[1]],[S+RW[1],ZR-3],[ZR+3,2*S-RW[2]],[2*S+RW[2],MAXZ+OUT]];
  for(let i=0;i<COLS-1;i++)xB.push([i*S+CW[i],(i+1)*S-CW[i+1]]);xB.push([MAXX+CW[COLS-1],MAXX+OUT]);
  const pave=cv(128,128,(c)=>{c.fillStyle='#b9bcbf';c.fillRect(0,0,128,128);for(let q=0;q<500;q++){c.fillStyle='rgba(0,0,0,'+(R()*0.06)+')';c.fillRect(R()*128,R()*128,3,3);}c.strokeStyle='rgba(70,75,80,0.55)';c.lineWidth=2;for(let q=0;q<=128;q+=32){c.beginPath();c.moveTo(q,0);c.lineTo(q,128);c.moveTo(0,q);c.lineTo(128,q);c.stroke();}});
  pave.wrapS=pave.wrapT=THREE.RepeatWrapping;pave.repeat.set(0.5,0.5);
  const slabMat=P(0xffffff,{map:pave}),lots=[],trees=[],poles=[];
  let grassMat=L(0x6f9a52);if(IMG.grass){const gt=new THREE.Texture(IMG.grass);gt.needsUpdate=true;gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(8,8);grassMat=new THREE.MeshLambertMaterial({map:gt});}
  xB.forEach(([x0,x1],xi)=>zB.forEach(([z0,z1],zi)=>{
    if(xi===4&&zi===0)return;                                   // expressway corridor
    {const c=Math.min(3,(z1-z0)/3),sh=new THREE.Shape();[[x0+c,z0],[x1-c,z0],[x1,z0+c],[x1,z1-c],[x1-c,z1],[x0+c,z1],[x0,z1-c],[x0,z0+c]].forEach((q,k)=>k?sh.lineTo(q[0],q[1]):sh.moveTo(q[0],q[1]));
      const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:0.15,bevelEnabled:false}),slabMat);m.rotation.x=Math.PI/2;m.position.y=0.15;scene.add(m);}
    if((xi===2&&zi===2)||(xi===1&&zi===4)){ // park blocks
      const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0-7,z1-z0-7),grassMat);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,0.17,(z0+z1)/2);scene.add(m);
      for(let q=0;q<(x1-x0)*(z1-z0)/110;q++)trees.push([x0+5+R()*(x1-x0-10),z0+5+R()*(z1-z0-10),0.9+R()*0.9]);return;}
    const ax=x0+3.4,az=z0+3.4,w=x1-x0-6.8,l=z1-z0-6.8,nx=Math.max(1,Math.floor(w/17)),nz=Math.max(1,Math.floor(l/17)),lw=w/nx,ll=l/nz;
    for(let a=0;a<nx;a++)for(let b=0;b<nz;b++){if(a>0&&a<nx-1&&b>0&&b<nz-1)continue;const cx=ax+(a+.5)*lw,cz=az+(b+.5)*ll;
      if(cx<-150||cx>MAXX+150||cz<-235||cz>MAXZ+150||R()<0.08)continue;const t=R();
      lots.push([cx,cz,lw*(0.66+R()*0.28),ll*(0.66+R()*0.28),t<0.14?22+R()*16:t<0.42?12+R()*6:6+R()*3.5]);}
  }));
  // street trees and utility poles (with lamps) along the kerbs
  const nearLine=(v,n)=>Math.abs(v-clamp(Math.round(v/S),0,n-1)*S);
  for(let j=0;j<ROWS;j++)for(const sg of[-1,1])for(let x=-150,q=0;x<=MAXX+150;x+=22,q++){if(nearLine(x,COLS)>26)trees.push([x+R()*3,j*S+sg*(RW[j]+1.5),0.55+R()*0.3]);if(sg>0&&q%2&&nearLine(x+9,COLS)>12)poles.push([x+9,j*S+sg*(RW[j]+0.8),0,-sg]);}
  for(let i=0;i<COLS;i++)for(const sg of[-1,1])for(let z=i===3?-88:-150,q=0;z<=MAXZ+150;z+=22,q++){const rl=Math.abs(z-ZR);if(nearLine(z,ROWS)>26&&rl>10)trees.push([i*S+sg*(CW[i]+1.5),z+R()*3,0.55+R()*0.3]);if(sg>0&&q%2&&nearLine(z+9,ROWS)>14&&Math.abs(z+9-ZR)>8)poles.push([i*S+sg*(CW[i]+0.8),z+9,1,-sg]);}
  addTrees(trees,R);
  const dm=new THREE.Object3D(),col=new THREE.Color();
  {const po=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12,0.17,9,8),L(0x9b9c98),poles.length),ar=new THREE.InstancedMesh(new THREE.BoxGeometry(1,0.1,0.1),L(0x6d6f70),poles.length*2),lp=new THREE.InstancedMesh(new THREE.BoxGeometry(0.9,0.14,0.3),streetLampMat,poles.length);
    poles.forEach((t,k)=>{dm.rotation.set(0,0,0);dm.scale.set(1,1,1);dm.position.set(t[0],4.65,t[1]);dm.updateMatrix();po.setMatrixAt(k,dm.matrix);dm.rotation.y=t[2]?0:Math.PI/2;dm.scale.set(1.7,1,1);dm.position.y=8.6;dm.updateMatrix();ar.setMatrixAt(k*2,dm.matrix);dm.position.y=7.9;dm.scale.set(1.3,1,1);dm.updateMatrix();ar.setMatrixAt(k*2+1,dm.matrix);
      dm.scale.set(1,1,1);dm.position.set(t[0]+(t[2]?t[3]*0.9:0),7.2,t[1]+(t[2]?0:t[3]*0.9));dm.updateMatrix();lp.setMatrixAt(k,dm.matrix);});scene.add(po,ar,lp);}
  // buildings: facade types, instanced; a second canvas lights the windows at night
  const facade=(base,rows,cols,o)=>{const lit=[];const tex=cv(256,256,(c)=>{
    if(base.img){c.drawImage(base.img,0,0,256,256);c.fillStyle='rgba(255,240,225,0.14)';c.fillRect(0,0,256,256);}else{c.fillStyle=base.col;c.fillRect(0,0,256,256);for(let q=0;q<900;q++){c.fillStyle='rgba(0,0,0,'+(R()*0.05)+')';c.fillRect(R()*256,R()*256,2+R()*3,1+R()*7);}}
    const ch=256/rows,cw=256/cols;
    for(let r=0;r<rows;r++){const y=r*ch;
      if(o.shop&&r===rows-1){c.fillStyle='#27303b';c.fillRect(8,y+ch*0.34,240,ch*0.66);c.fillStyle='rgba(255,255,255,0.12)';for(let k=0;k<4;k++)c.fillRect(14+k*60,y+ch*0.4,50,ch*0.5);c.fillStyle=o.shop;c.fillRect(0,y+ch*0.1,256,ch*0.24);lit.push([8,y+ch*0.34,240,ch*0.66,'#ffe2a8']);continue;}
      if(o.balcony){c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(0,y+ch*0.1,256,ch*0.52);}
      for(let k=0;k<cols;k++){const gq=R(),wx=k*cw+cw*0.16,wy=y+ch*0.18,ww=cw*0.68,wh=ch*(o.balcony?0.42:0.54);c.fillStyle=gq<0.1?'#ead9a2':gq<0.55?'#53667a':'#6d8297';c.fillRect(wx,wy,ww,wh);c.fillStyle='rgba(255,255,255,0.2)';c.fillRect(wx,wy,ww,ch*0.07);if(R()<0.42)lit.push([wx,wy,ww,wh,R()<0.7?'#ffd98a':'#cfe4ff']);}
      if(o.balcony){c.fillStyle=o.balcony;c.fillRect(0,y+ch*0.62,256,ch*0.3);c.fillStyle='rgba(0,0,0,0.18)';c.fillRect(0,y+ch*0.9,256,ch*0.04);}
    }});const em=cv(256,256,c=>{c.fillStyle='#000';c.fillRect(0,0,256,256);for(const q of lit){c.fillStyle=q[4];c.fillRect(q[0],q[1],q[2],q[3]);}});return {tex,em};};
  const kinds=[facade({col:'#d8d2c4'},3,4,{shop:'#b5482f'}),facade(IMG.brick?{img:IMG.brick}:{col:'#a8664f'},3,4,{shop:'#2f6b4f'}),facade({col:'#e7e2d7'},6,5,{balcony:'#f1efe9'}),facade({col:'#a9b3bc'},10,6,{}),facade({col:'#cfc6b4'},6,5,{balcony:'#b9a98e'})];
  const roof=L(0xb5b5b0),unit=new THREE.BoxGeometry(1,1,1),tint=[0xffffff,0xf3ede3,0xe9eef3,0xf6ebe0];
  lots.forEach(b=>{b[5]=b[4]<10?(R()<0.5?0:1):b[4]<19?(R()<0.5?2:4):3;});
  kinds.forEach((f,kd)=>{const mine=lots.filter(b=>b[5]===kd);if(!mine.length)return;const wall=new THREE.MeshLambertMaterial({map:f.tex,emissive:0xffffff,emissiveMap:f.em,emissiveIntensity:0});NIGHT.push(wall);const inst=new THREE.InstancedMesh(unit,[wall,wall,roof,roof,wall,wall],mine.length);
    mine.forEach((b,k)=>{dm.rotation.set(0,0,0);dm.position.set(b[0],0.15+b[4]/2,b[1]);dm.scale.set(b[2],b[4],b[3]);dm.updateMatrix();inst.setMatrixAt(k,dm.matrix);inst.setColorAt(k,col.setHex(tint[Math.floor(R()*tint.length)]));});inst.frustumCulled=false;scene.add(inst);});
  // markings and sign textures
  const white=decalMat({color:0xf0f2f4});
  const zebraT=n=>{const t=cv(64,8,(c)=>{c.fillStyle='#f0f2f4';c.fillRect(0,0,32,8);});t.wrapS=THREE.RepeatWrapping;t.repeat.x=n;return decalMat({map:t});};
  const zebraMat={3.5:zebraT(8),7:zebraT(16)};
  const stopSign=cv(256,256,(c)=>{c.lineJoin='round';c.beginPath();c.moveTo(128,238);c.lineTo(14,28);c.lineTo(242,28);c.closePath();c.fillStyle='#d4222b';c.fill();c.lineWidth=12;c.strokeStyle='#fff';c.stroke();c.fillStyle='#fff';c.font='900 56px '+FONT;c.textAlign='center';c.textBaseline='middle';c.fillText('止まれ',128,98);});
  const vText=(txt,h)=>cv(128,h,(c)=>{c.fillStyle='#f0f2f4';c.font='900 96px '+FONT;c.textAlign='center';c.textBaseline='middle';[...txt].forEach((s,k)=>c.fillText(s,64,56+k*104));});
  const stopRoad=decalMat({map:vText('止まれ',320)}),busRoad=decalMat({map:vText('バス専用',424)});
  const diamond=cv(64,192,(c)=>{c.strokeStyle='#f0f2f4';c.lineWidth=7;c.beginPath();c.moveTo(32,6);c.lineTo(58,96);c.lineTo(32,186);c.lineTo(6,96);c.closePath();c.stroke();});
  const stubName=d=>['北町','港','海岸','山手町'][d];
  const dest=(n,d)=>{const q=nodes[(n.i+DV[d][0])+','+(n.j+DV[d][1])];return q?q.name:(d===0&&n.i===3?'高速 若葉IC':stubName(d));};
  const guide=(n,d)=>boardTex(360,220,'#1c4c9c',(c)=>{c.strokeStyle='#fff';c.lineWidth=13;c.lineCap='butt';c.beginPath();c.moveTo(180,206);c.lineTo(180,82);c.moveTo(74,150);c.lineTo(286,150);c.stroke();
    const head=(x,y,dx,dy)=>{c.beginPath();c.moveTo(x+dx*22,y+dy*22);c.lineTo(x-dy*17,y+dx*17);c.lineTo(x+dy*17,y-dx*17);c.closePath();c.fill();};head(180,82,0,-1);head(74,150,-1,0);head(286,150,1,0);
    const txt=(s,x,y)=>{c.font='900 '+(s.length>5?22:28)+'px '+FONT;if(s.indexOf('高速')===0){const w=c.measureText(s).width+12;c.fillStyle='#0f7a4a';c.fillRect(x-w/2,y-17,w,34);c.fillStyle='#fff';}c.fillText(s,x,y);};
    txt(dest(n,d),180,36);txt(dest(n,(d+3)%4),82,108);txt(dest(n,(d+1)%4),278,108);});
  const plate=n=>boardTex(256,76,'#fff',(c)=>{c.strokeStyle='#1c4c9c';c.lineWidth=5;c.strokeRect(3,3,250,70);c.fillStyle='#1c4c9c';c.font='900 34px '+FONT;c.fillText(n.name,128,29);c.font='600 15px Arial,sans-serif';c.fillText(NAMES[n.i+','+n.j][1],128,58);});
  // intersections
  const headMat=L(0x2b3138);
  for(const k in nodes){const n=nodes[k],cx=n.i*S,cz=n.j*S,pl=n.type==='sig'?dim(new THREE.MeshBasicMaterial({map:plate(n)})):null;
    for(let d=0;d<4;d++){const [dx,dz]=DV[d],[lx,lz]=leftOf(d),axis=d%2?'h':'v',idx=axis==='h'?n.j:n.i,wd=hw(axis,idx),sl=SLd(n,axis),ex=ext(n,axis);
      const stopHere=n.type===(axis==='h'?'sh':'sv');
      if(n.type==='sig'||stopHere)ground(white,wd-0.3,0.5,cx-dx*sl+lx*wd/2,cz-dz*sl+lz*wd/2,d);
      if(stopHere){signPost(stopSign,1.05,1.05,cx-dx*(sl+0.4)+lx*(wd+0.9),cz-dz*(sl+0.4)+lz*(wd+0.9),d,2.1,backTri);ground(stopRoad,1.9,4.6,cx-dx*(sl+4.5)+lx*1.75,cz-dz*(sl+4.5)+lz*1.75,d);}
      if(n.type==='sig'){ground(zebraMat[wd],2*wd,3,cx+dx*(ex+2.5),cz+dz*(ex+2.5),d);
        const G=new THREE.Group(),arm=wd/2+0.85;G.position.set(cx+dx*(ex+3)+lx*wd/2,0,cz+dz*(ex+3)+lz*wd/2);G.rotation.y=yawFor(d);scene.add(G);
        const p=new THREE.Mesh(poleGeo,poleMat);p.scale.set(1.6,5.6,1.6);p.position.set(-arm,2.8,0);G.add(p);box(poleMat,arm,0.1,0.1,-arm/2,5.1,0,G);box(headMat,1.5,0.5,0.25,0,5.1,0,G);
        const lamps=[-0.47,0,0.47].map(x=>{const m=new THREE.Mesh(lampGeo,new THREE.MeshBasicMaterial({color:0x222222}));m.position.set(x,5.1,0.1);G.add(m);return m;});
        n.lamps[axis].push(lamps);
        const np=new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.56),pl);np.position.set(-arm/2-0.2,5.72,0.03);G.add(np);
        signPost(guide(n,d),3.1,1.9,cx-dx*(sl+38)+lx*(wd+1.4),cz-dz*(sl+38)+lz*(wd+1.4),d,4.2);
        if(wd>4)ground(busRoad,2.1,8.5,cx-dx*(sl+62)+lx*5.25,cz-dz*(sl+62)+lz*5.25,d);}
      // speed limit sign after leaving the node in direction d
      if(!(n.i===3&&n.j===0&&d===0))signPost(roundSignTex(limitOf(axis,idx)),0.85,0.85,cx+dx*(sl+9)+lx*(wd+0.9),cz+dz*(sl+9)+lz*(wd+0.9),d,2.3,backRound);
    }}
  // bus stops on 中央通り
  const stopTex=boardTex(128,128,'#1c4c9c',(c)=>{c.font='900 34px '+FONT;c.fillText('バス',64,44);c.fillText('のりば',64,86);});
  for(const dir of[1,-1])for(const sx of BUS_STOPS[dir]){const d=dir>0?1:3,lz=leftOf(d)[1],z=S+lz*(RW[1]+1.3);signPost(stopTex,0.7,0.7,sx+dir*4,z,d,2.3);
    box(L(0x8fa1ad),4.2,0.12,1.5,sx-dir*2,2.5,z+lz*0.6);for(const q of[-1.9,1.9])box(poleMat,0.08,2.4,0.08,sx-dir*2+q,1.3,z+lz*1.2);}
  // school zone sign on 小学校通り (col 3)
  const school=cv(256,256,c=>{c.translate(128,128);c.rotate(Math.PI/4);c.fillStyle='#f6c400';c.fillRect(-84,-84,168,168);c.strokeStyle='#111';c.lineWidth=7;c.strokeRect(-76,-76,152,152);c.rotate(-Math.PI/4);c.fillStyle='#111';for(const q of[[-22,1.0],[20,0.8]]){c.beginPath();c.arc(q[0],-36*q[1],13*q[1],0,7);c.fill();c.fillRect(q[0]-10*q[1],-22*q[1],20*q[1],46*q[1]);c.fillRect(q[0]-10*q[1],24*q[1]-22*q[1]+20,8*q[1],26*q[1]);c.fillRect(q[0]+2*q[1],24*q[1]-22*q[1]+20,8*q[1],26*q[1]);}});
  signPost(school,1.0,1.0,X0-CW[3]-0.9,S-RW[1]-16,0,2.2,backRect);
  // railway
  ground(P(0x8c8478,{polygonOffset:true,polygonOffsetFactor:-0.5,polygonOffsetUnits:-0.5}),MAXX+2*OUT,6,MAXX/2,ZR,0,0.012);
  const railMat=L(0x6f757c);box(railMat,MAXX+2*OUT,0.09,0.12,MAXX/2,0.07,ZR-0.72);box(railMat,MAXX+2*OUT,0.09,0.12,MAXX/2,0.07,ZR+0.72);
  rail={alarm:false,t:22,at:0,gear:[],train:new THREE.Group(),bellT:0};
  box(L(0xd9dde1),80,3,2.9,0,2.1,0,rail.train);box(L(0xe07b1a),80.1,0.45,2.95,0,1.5,0,rail.train);box(L(0x2c3440),80.1,0.9,2.95,0,2.7,0,rail.train);
  rail.train.position.z=ZR;rail.train.visible=false;scene.add(rail.train);
  const yel=L(0xf2c230),redOff=0x4a1414;
  for(let i=0;i<COLS;i++)for(const d of [0,2]){const [dx,dz]=DV[d],[lx,lz]=leftOf(d);
    ground(white,W-0.3,0.5,i*S+lx*W/2,ZR-dz*4.5,d);
    const G=new THREE.Group();G.position.set(i*S+lx*(W+0.7),0,ZR-dz*3.6);G.rotation.y=yawFor(d);scene.add(G);
    const p=new THREE.Mesh(poleGeo,poleMat);p.scale.set(1.5,3.3,1.5);p.position.y=1.65;G.add(p);
    const a=box(yel,1.5,0.17,0.05,0,3,0.08,G),b=box(yel,1.5,0.17,0.05,0,3,0.09,G);a.rotation.z=Math.PI/4;b.rotation.z=-Math.PI/4;
    const l1=new THREE.Mesh(lampGeo,new THREE.MeshBasicMaterial({color:redOff})),l2=new THREE.Mesh(lampGeo,new THREE.MeshBasicMaterial({color:redOff}));l1.position.set(-0.32,2.3,0.1);l2.position.set(0.32,2.3,0.1);G.add(l1,l2);
    const piv=new THREE.Group();piv.position.set(0.3,1.05,0);piv.rotation.z=1.4;G.add(piv);box(yel,3.7,0.1,0.1,1.85,0,0,piv);
    rail.gear.push({l1,l2,piv});}
  // mid-block crosswalk on row 2
  ground(zebraMat[3.5],2*W,3,XC,2*S,1);
  for(const d of [1,3]){const [dx]=DV[d],[lx,lz]=leftOf(d);ground(white,W-0.3,0.5,XC-dx*3.5,2*S+lz*W/2,d);
    for(const off of [30,50])ground(decalMat({map:diamond}),1.5,5,XC-dx*off,2*S+lz*W/2,d);}
  // goal zone
  goalObjs.push(ground(decalMat({color:0x2f7df0,opacity:0.42}),W-0.5,GOAL.z1-GOAL.z0,S+W/2+0.1,(GOAL.z0+GOAL.z1)/2,0,0.05));
  const gt=boardTex(256,128,'#1c4c9c',(c)=>{c.font='900 60px '+FONT;c.fillText('ゴール',128,66);});
  goalObjs.push(signPost(gt,1.8,0.9,S+W+1,GOAL.z1-2,2,2.2));
  // player car, traffic, events, expressway, environment
  const pm=playerModel();carMesh=pm.G;cabin=pm.cab;bodyMesh=pm.body;playerBrake=pm.brake;buildCockpit();
  spawnTraffic(R);buildEvents();buildHighway(R);buildEnv();
  // pedestrian
  const Pd=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.24,1.15,10),L(0xd4532a));body.position.y=0.73;const head=new THREE.Mesh(new THREE.SphereGeometry(0.17,12,10),L(0xe8c4a0));head.position.y=1.5;Pd.add(body,head);Pd.visible=false;scene.add(Pd);
  ped={mesh:Pd,state:'away',t:6,side:-1,z:0,tw:0,first:true};
}
