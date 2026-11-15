/* ---------- world: shared helpers ---------- */
const poleMat=L(0x9aa1a8),poleGeo=new THREE.CylinderGeometry(0.06,0.06,1,8),lampGeo=new THREE.SphereGeometry(0.17,12,8);
const streetLampMat=new THREE.MeshBasicMaterial({color:0x8d9399});
const NT={e:null};
function asphaltFill(c,w,h,R){c.fillStyle='#3b3f45';c.fillRect(0,0,w,h);for(let q=0;q<w*h/40;q++){c.fillStyle=R()<0.5?'rgba(255,255,255,'+(0.02+R()*0.05)+')':'rgba(0,0,0,'+(0.04+R()*0.1)+')';c.fillRect(R()*w,R()*h,1+R()*2,1+R()*2);}}
const _round={};
function roundSignTex(n,blue){const k=n+(blue?'b':'');return _round[k]||(_round[k]=cv(256,256,c=>{c.beginPath();c.arc(128,128,108,0,7);c.fillStyle=blue?'#1c4c9c':'#fff';c.fill();if(!blue){c.lineWidth=30;c.strokeStyle='#d4222b';c.stroke();}
  c.fillStyle=blue?'#fff':'#1c4c9c';c.font='700 '+(n>99?100:124)+'px "Barlow Condensed",Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(n,128,blue?120:136);if(blue)c.fillRect(64,186,128,12);}));}
const backTri=cv(64,64,c=>{c.beginPath();c.moveTo(32,60);c.lineTo(3,7);c.lineTo(61,7);c.closePath();c.fillStyle='#8a9097';c.fill();}),backRound=cv(64,64,c=>{c.beginPath();c.arc(32,32,30,0,7);c.fillStyle='#8a9097';c.fill();}),backRect=cv(8,8,c=>{c.fillStyle='#8a9097';c.fillRect(0,0,8,8);});
// a sign on a pole at (x,y,z), facing drivers who travel along (tx,tz)
const SIGNS=[];const nearSign=(x,z,r)=>{for(let i=0;i<SIGNS.length;i+=2)if(Math.abs(SIGNS[i]-x)<r&&Math.abs(SIGNS[i+1]-z)<r)return true;return false;};
function signPost(tex,w,h,x,y,z,tx,tz,ph,back,noPole){const yaw=yawOf(tx,tz);SIGNS.push(x,z);if(!noPole){const p=new THREE.Mesh(poleGeo,poleMat);p.scale.set(w>1.5?2:1,ph,w>1.5?2:1);p.position.set(x,y+ph/2,z);scene.add(p);}
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dim(new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:0.4})));m.position.set(x,y+ph+h*0.3,z);m.rotation.y=yaw;scene.add(m);
  const f=new THREE.Mesh(new THREE.PlaneGeometry(w,h),dim(new THREE.MeshBasicMaterial({map:back||backRect,alphaTest:0.4})));f.position.copy(m.position);f.rotation.y=yaw+Math.PI;scene.add(f);return m;}
function boardTex(w,h,bg,draw){return cv(w,h,c=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.strokeStyle='#fff';c.lineWidth=6;c.strokeRect(6,6,w-12,h-12);c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';draw(c,w,h);});}
const textBoard=(lines,w,h,bg,fg)=>boardTex(Math.round(w*56),Math.round(h*56),bg,(c,cw,ch)=>{c.fillStyle=fg||'#fff';lines.forEach((s,k)=>{c.font='900 '+Math.min(Math.round(ch/(lines.length+0.7)),Math.round(cw/(s.length+0.5)*1.05))+'px '+FONT;c.fillText(s,cw/2,ch*(k+0.5)/lines.length+2);});});
function addTrees(trees,R,detail,hsl){trees=trees.filter(t=>!(t[3]<12&&underDeck(t[0],t[1])));if(!trees.length)return;const dm=new THREE.Object3D(),col=new THREE.Color();
  const tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12,0.17,2.4,5),L(0x6b5440),trees.length),cr=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5,detail),L(0xffffff,{flatShading:!detail}),trees.length);
  trees.forEach((t,k)=>{dm.rotation.set(0,R()*6,0);dm.position.set(t[0],t[3]+1.2*t[2],t[1]);dm.scale.set(t[2],t[2],t[2]);dm.updateMatrix();tr.setMatrixAt(k,dm.matrix);dm.position.y=t[3]+3.3*t[2];dm.scale.set(t[2],t[2]*(1+R()*0.3),t[2]);dm.updateMatrix();cr.setMatrixAt(k,dm.matrix);cr.setColorAt(k,hsl?col.setHSL(hsl[0]+R()*0.03,hsl[1],hsl[2]+R()*0.08):col.setHSL(0.27+R()*0.07,0.42,0.26+R()*0.1));});
  scene.add(tr,cr);}
// terrain height with the ground benched level around roads (not above tunnels)
function groundY(x,z){let t=TH(x,z);const nr=nearest(x,z,NT,3,null,null,true);if(!nr)return t;const e=nr.e;if(e.tun&&nr.s>e.tun[0]&&nr.s<e.tun[1])return nr.d<26?Math.max(t,nr.y+6.9):t;
  const w=Math.max(e.wl[nr.i],e.wr[nr.i])+(e.walk?3:0.8);return lerp(nr.y-0.22,t,sstep(w+17.5,w+46,nr.d));}
// a strip of road surface between two lateral offsets (functions of the sample index)
function strip(e,i0,i1,fL,fR,dy,mat,vert){const n=i1-i0+1,pos=new Float32Array(n*6),uv=new Float32Array(n*4),idx=[];
  for(let k=0;k<n;k++){const i=i0+k,nx=e.tz[i],nz=-e.tx[i],l=typeof fL==='function'?fL(i):fL,r=typeof fR==='function'?fR(i):fR,y=e.py[i];
    if(vert){pos.set([e.px[i]+nx*l,y+fR,e.pz[i]+nz*l,e.px[i]+nx*l,y+dy,e.pz[i]+nz*l],k*6);}else pos.set([e.px[i]+nx*l,y+dy,e.pz[i]+nz*l,e.px[i]+nx*r,y+dy,e.pz[i]+nz*r],k*6);
    uv.set([0,e.ps[i]/10,1,e.ps[i]/10],k*4);if(k<n-1)idx.push(2*k,2*k+1,2*k+2,2*k+1,2*k+3,2*k+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);scene.add(m);return m;}
const wall=(e,i0,i1,off,y0,y1,mat)=>strip(e,i0,i1,off,y0,y1,mat,true);
let TERR=null;
// height of the built terrain mesh at a point (used by the self-check)
function meshY(x,z){const nb=PAinfo.nb;for(const [s0,d] of[[nb.tun[0],1],[nb.tun[1],-1]]){const q=edgePos(nb,s0,0),rx=x-q.x,rz=z-q.z,al=(rx*q.tx+rz*q.tz)*d;if(al>-17&&al<17&&Math.abs(rx*q.tz-rz*q.tx)<26)return -99;}const t=TERR,fx=clamp((x-t.x0)/t.dx,0,t.nx-0.001),fz=clamp((z-t.z0)/t.dz,0,t.nz-0.001),i=Math.floor(fx),j=Math.floor(fz),a=fx-i,b=fz-j,H=(q,r)=>t.h[r*(t.nx+1)+q];return Math.max(lerp(lerp(H(i,j),H(i+1,j),a),lerp(H(i,j+1),H(i+1,j+1),a),b),a+b<1?H(i,j)+(H(i+1,j)-H(i,j))*a+(H(i,j+1)-H(i,j))*b:H(i+1,j+1)+(H(i,j+1)-H(i+1,j+1))*(1-a)+(H(i+1,j)-H(i+1,j+1))*(1-b));}
let GOAL=null,PEDX=null,tollGates=[];

function buildWorld(){
  const R=rng(7);buildNet();
  // --- terrain
  {const x0=-280,x1=1420,z0=-3200,z1=300,nx=Math.round((x1-x0)/12),nz=Math.round((z1-z0)/12),g=new THREE.PlaneGeometry(x1-x0,z1-z0,nx,nz);g.rotateX(-Math.PI/2);g.translate((x0+x1)/2,0,(z0+z1)/2);
    const p=g.attributes.position,col=new Float32Array(p.count*3),c=new THREE.Color(),farm=[0x8fb35a,0xbfae5c,0x6fa04e,0x9a8456,0x7fae62];
    for(let k=0;k<p.count;k++){const x=p.getX(k),z=p.getZ(k),y=groundY(x,z),t=TH(x,z);p.setY(k,y);
      const city=z>-815&&x>-170&&x<coastX(z)-25&&t<6.5,sl=Math.abs(TH(x+6,z)-TH(x-6,z))+Math.abs(TH(x,z+6)-TH(x,z-6));
      if(y<0.3)c.setHex(0xbfb08a);else if(t<2.6&&x>coastX(z)-60)c.setHex(0xdccb9c);else if(city)c.setHex(0xa6aaac).offsetHSL(0,0,(R()-0.5)*0.03);
      else if(z<-2330&&sl<3)c.setHex(farm[Math.abs(Math.floor(x/34)*7+Math.floor(z/26)*13)%5]).offsetHSL(0,0,(R()-0.5)*0.03);
      else if(sl>9)c.setHex(0x7d7f76);else c.setHex(0x55813f).offsetHSL((R()-0.5)*0.02,0,(R()-0.5)*0.05);
      col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
    {const nb=PAinfo.nb,mouths=[[nb.tun[0],1],[nb.tun[1],-1]].map(([s,d])=>{const q=edgePos(nb,s,0);return[q.x,q.z,q.tx*d,q.tz*d];}),ix=g.index.array,keep=[];
      for(let k=0;k<ix.length;k+=3){const cx=(p.getX(ix[k])+p.getX(ix[k+1])+p.getX(ix[k+2]))/3,cz=(p.getZ(ix[k])+p.getZ(ix[k+1])+p.getZ(ix[k+2]))/3;let cut=false;
        for(const m of mouths){const rx=cx-m[0],rz=cz-m[1],al=rx*m[2]+rz*m[3],u=(rx*m[3]-rz*m[2])*(m===mouths[0]?1:-1);if(al>-17&&al<17&&u>-25&&u<12)cut=true;}
        if(!cut)keep.push(ix[k],ix[k+1],ix[k+2]);}g.setIndex(keep);}
    TERR={x0,z0,dx:(x1-x0)/nx,dz:(z1-z0)/nz,nx,nz,h:Float32Array.from({length:p.count},(_,k)=>p.getY(k))};
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));scene.add(m);
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(2600,4600),P(0x2f6f96,{shininess:60,specular:0x6f8fa0,transparent:true,opacity:0.92}));sea.rotation.x=-Math.PI/2;sea.position.set(1900,0,-1450);scene.add(sea);
    const far=new THREE.Mesh(new THREE.PlaneGeometry(4000,6000),L(0x55813f));far.rotation.x=-Math.PI/2;far.position.set(-2279,1.9,-1450);scene.add(far);const nth=new THREE.Mesh(new THREE.PlaneGeometry(2200,1500),L(0x6fa04e));nth.rotation.x=-Math.PI/2;nth.position.set(570,39.5,-3949);scene.add(nth);
    const south=new THREE.Mesh(new THREE.PlaneGeometry(1700,1500),L(0xa6aaac));south.rotation.x=-Math.PI/2;south.position.set(570,1.9,1050);scene.add(south);}
  // --- road surfaces
  const tex=(wM,lines,tint,bed)=>{const t=cv(Math.max(64,Math.round(wM*22)),256,(c,w,h)=>{asphaltFill(c,w,h,R);if(bed){c.fillStyle='rgba(150,140,120,0.42)';c.fillRect(w*3.5/12,0,w*5/12,h);c.strokeStyle='rgba(60,60,60,0.35)';for(let y=0;y<h;y+=16){c.beginPath();c.moveTo(w*3.5/12,y);c.lineTo(w*8.5/12,y);c.stroke();}}if(tint){c.fillStyle='rgba(150,62,38,0.34)';c.fillRect(0,0,w*0.25,h);c.fillRect(w*0.75,0,w*0.25,h);}
      for(const [at,st,col] of lines){c.fillStyle=col||'#e9ecef';const x=at/wM*w;if(st==='d')c.fillRect(x-2,0,4,h*0.5);else if(st==='t')c.fillRect(x-3.5,0,7,h*0.42);else c.fillRect(x-2,0,4,h);}});t.wrapT=THREE.RepeatWrapping;
    const m=P(0xffffff,{map:t,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});WET.push(m);return m;};
  const Y='#f2c230',RM={main:tex(14,[[0.15,'s'],[3.5,'d'],[6.82,'s',Y],[7.18,'s',Y],[10.5,'d'],[13.85,'s']],true),city:tex(7,[[0.15,'s'],[3.5,'d'],[6.85,'s']]),hill:tex(6,[[0.15,'s'],[3,'d'],[5.85,'s']]),rural:tex(6.4,[[0.15,'s'],[3.2,'d'],[6.25,'s']]),
    coast:tex(7,[[0.15,'s'],[3.5,'s',Y],[6.85,'s']]),coast3:tex(10.5,[[0.15,'s'],[3.5,'d'],[7,'s',Y],[10.35,'s']]),bay:tex(6,[]),mount:tex(6.2,[[0.15,'s'],[3.1,'s',Y],[6.05,'s']]),narrow1:tex(4.6,[[0.12,'s'],[4.48,'s']]),lane:tex(5,[]),tram:tex(12,[[0.15,'s'],[3.5,'s',Y],[8.5,'s',Y],[11.85,'s'],[3.98,'s','#8d9399'],[5.42,'s','#8d9399'],[6.58,'s','#8d9399'],[8.02,'s','#8d9399']],false,true),hw:tex(7,[[0.15,'s'],[3.5,'d'],[6.85,'s']]),ramp:tex(4,[[0.15,'s'],[3.85,'s']]),extra:tex(3.8,[[0.15,'s'],[3.7,'t']])};
  const padTex=cv(128,128,(c,w,h)=>asphaltFill(c,w,h,R));padTex.wrapS=padTex.wrapT=THREE.RepeatWrapping;padTex.repeat.set(1,1);
  const baseMat=P(0xffffff,{map:padTex,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});WET.push(baseMat);
  const pave=cv(128,128,(c)=>{c.fillStyle='#b9bcbf';c.fillRect(0,0,128,128);for(let q=0;q<500;q++){c.fillStyle='rgba(0,0,0,'+(R()*0.06)+')';c.fillRect(R()*128,R()*128,3,3);}c.strokeStyle='rgba(70,75,80,0.55)';c.lineWidth=2;for(let q=0;q<=128;q+=64){c.beginPath();c.moveTo(q,0);c.lineTo(q,128);c.moveTo(0,q);c.lineTo(128,q);c.stroke();}});
  pave.wrapS=pave.wrapT=THREE.RepeatWrapping;pave.repeat.set(1,5);const walkMat=P(0xffffff,{map:pave}),railing=L(0xd9dde1,{side:THREE.DoubleSide}),conc=L(0xb4b6b3);
  const idxR=(e,s0,s1)=>[Math.min(e.n-2,idxAt(e,Math.max(0,s0))+(s0>0?1:0)),Math.min(e.n-1,idxAt(e,Math.min(e.len,s1)))];
  for(const e of ED){strip(e,0,e.n-1,e.w,-e.w,0.07,RM[e.kind]);
    for(const sd of[1,-1]){const arr=sd>0?e.wl:e.wr;let st=-1;for(let i=0;i<=e.n;i++){const wide=i<e.n&&arr[i]>e.w+0.3;if(wide&&st<0)st=i;if(!wide&&st>=0){const a=Math.max(0,st-1),b=Math.min(e.n-1,i);
          if(sd>0)strip(e,a,b,k=>e.wl[k],e.w,0.07,e.kind==='hw'?RM.extra:RM.bay);else strip(e,a,b,-e.w,k=>-e.wr[k],0.07,RM.bay);st=-1;}}}
    if(e.walk){const [i0,i1]=idxR(e,e.a.r?e.a.r+3.5:0,e.len-(e.b.r?e.b.r+3.5:0));if(i1>i0){strip(e,i0,i1,k=>e.wl[k]+2.7,k=>e.wl[k],0.2,walkMat);strip(e,i0,i1,k=>-e.wr[k],k=>-e.wr[k]-2.7,0.2,walkMat);}}
    if(e.kind==='mount'||e.kind==='coast'||e.kind==='coast3'){const [i0,i1]=idxR(e,e.a.r?e.a.r+9:0,e.len-(e.b.r?e.b.r+9:0));if(i1>i0){wall(e,i0,i1,k=>e.wl[k]+0.5,0.35,0.8,railing);wall(e,i0,i1,k=>-e.wr[k]-0.5,0.35,0.8,railing);}}}
  // flyover: parapets, the underside of the deck, piers and abutments
  for(const e of ED){if(!e.bump)continue;let i0=-1,i1=-1,j0=-1,j1=-1;for(let i=0;i<e.n;i++){if(e.bh[i]>0.5){if(i0<0)i0=i;i1=i;}if(e.elev[i]){if(j0<0)j0=i;j1=i;}}const W2=e.w+3.0,cm=L(0xa9aaa6,{side:THREE.DoubleSide});
    wall(e,i0,i1,W2,-0.75,1.15,cm);wall(e,i0,i1,-W2,-0.75,1.15,cm);strip(e,j0,j1,W2,-W2,-0.75,cm);
    const ab=e.bump[0]==='a'?j1:j0,pier=e.bump[0]==='a'?Math.round((j0*0.35+j1*0.65)):Math.round((j0*0.65+j1*0.35));
    for(const [i,full] of[[ab,true],[pier,false]]){const q=edgePos(e,e.ps[i],0),gy=groundY(q.x,q.z),h=e.py[i]-0.75-gy,G=new THREE.Group();G.position.set(q.x,gy,q.z);G.rotation.y=yawOf(q.tx,q.tz);scene.add(G);box(cm,full?2*W2:2*W2-3,h,full?2.2:1.3,0,h/2,0,G);}}
  {const hl=cv(256,256,c=>{c.beginPath();c.arc(128,128,108,0,7);c.fillStyle='#fff';c.fill();c.lineWidth=28;c.strokeStyle='#d4222b';c.stroke();c.fillStyle='#1c4c9c';c.font='700 78px "Barlow Condensed",Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('3.8m',128,132);for(const d of[1,-1]){c.beginPath();c.moveTo(128,128-d*92);c.lineTo(110,128-d*70);c.lineTo(146,128-d*70);c.closePath();c.fill();}});
    for(const [key,d] of[['O2-N3',1],['N3-N4',-1]]){const e=EK[key],q=edgePos(e,d>0?e.len-38:38,d*(e.w+1.0));signPost(hl,0.9,0.9,q.x,q.y,q.z,q.tx*d,q.tz*d,2.3,backRound);}}
  for(const k in ND){const n=ND[k];if(!n.poly)continue;const sh=new THREE.Shape();n.poly.forEach((p,q)=>q?sh.lineTo(p[0]-n.x,-(p[1]-n.z)):sh.moveTo(p[0]-n.x,-(p[1]-n.z)));const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);
    const uv=g.attributes.uv;for(let q=0;q<uv.count;q++)uv.setXY(q,uv.getX(q)/6,uv.getY(q)/6);const m=new THREE.Mesh(g,baseMat);m.position.set(n.x,n.y+0.085,n.z);scene.add(m);}
  // --- markings, signals, signs
  const white=decalMat({color:0xf0f2f4});
  const zebraT=n=>{const t=cv(64,8,(c)=>{c.fillStyle='#f0f2f4';c.fillRect(0,0,32,8);});t.wrapS=THREE.RepeatWrapping;t.repeat.x=n;return decalMat({map:t});},zebra={};
  const stopSign=cv(256,256,(c)=>{c.lineJoin='round';c.beginPath();c.moveTo(128,238);c.lineTo(14,28);c.lineTo(242,28);c.closePath();c.fillStyle='#d4222b';c.fill();c.lineWidth=12;c.strokeStyle='#fff';c.stroke();c.fillStyle='#fff';c.font='900 56px '+FONT;c.textAlign='center';c.textBaseline='middle';c.fillText('止まれ',128,98);});
  const vText=(txt,h)=>cv(128,h,(c)=>{c.fillStyle='#f0f2f4';c.font='900 96px '+FONT;c.textAlign='center';c.textBaseline='middle';[...txt].forEach((s,k)=>c.fillText(s,64,56+k*104));});
  const stopRoad=decalMat({map:vText('止まれ',320)}),busRoad=decalMat({map:vText('バス専用',424)});
  const noEntry=cv(256,256,c=>{c.beginPath();c.arc(128,128,112,0,7);c.fillStyle='#d4222b';c.fill();c.fillStyle='#fff';c.fillRect(48,104,160,48);});
  const oneWay=boardTex(256,96,'#1c4c9c',c=>{c.beginPath();c.moveTo(232,48);c.lineTo(180,14);c.lineTo(180,34);c.lineTo(24,34);c.lineTo(24,62);c.lineTo(180,62);c.lineTo(180,82);c.closePath();c.fill();});
  const plate=n=>boardTex(256,76,'#fff',(c)=>{c.strokeStyle='#1c4c9c';c.lineWidth=5;c.strokeRect(3,3,250,70);c.fillStyle='#1c4c9c';c.font='900 '+(n.name.length>4?30:38)+'px '+FONT;c.fillText(n.name,128,40);});
  const headMat=L(0x2b3138);
  for(const k in ND){const n=ND[k];if(!n.r)continue;const pl=n.ctrl==='sig'&&n.name?dim(new THREE.MeshBasicMaterial({map:plate(n)})):null;
    for(const e of n.ed){if(e.oneway&&e.b!==n){ // traffic leaves the junction on this one-way street
        const q=edgePos(e,n.r+5,0);signPost(oneWay,1.1,0.42,q.x+q.tz*(e.w+0.8),q.y,q.z-q.tx*(e.w+0.8),-q.tx,-q.tz,2.3);continue;}
      const aw=away(n,e),tx=-aw[0],tz=-aw[1],lx=tz,lz=-tx,two=!e.oneway,inn=(e.b===n?1:-1)*(e.c||0),half=two?(inn+e.w)/2:0,wd=two?e.w-inn:2*e.w,D=n.r+2.4,sp=e.a===n?D:e.len-D,q=edgePos(e,sp,0),yaw=yawOf(tx,tz);
      const stopHere=n.ctrl==='stop'&&n.stops.includes(e.key);
      if(n.ctrl==='sig'||stopHere)ground(white,wd-0.3,0.5,q.x+lx*half,q.y+0.11,q.z+lz*half,yaw);
      if(stopHere){signPost(stopSign,1.05,1.05,q.x-tx*0.4+lx*(e.w+0.9),q.y,q.z-tz*0.4+lz*(e.w+0.9),tx,tz,2.1,backTri);ground(stopRoad,1.7,4.2,q.x-tx*4.4+lx*half,q.y+0.11,q.z-tz*4.4+lz*half,yaw);}
      if(n.ctrl==='sig'){const zk=Math.round(e.w*2.3);ground(zebra[zk]||(zebra[zk]=zebraT(zk)),2*e.w,3,n.x-tx*(n.r-0.1),n.y+0.11,n.z-tz*(n.r-0.1),yaw);
        const G=new THREE.Group(),arm=(two?e.w-half:e.w)+0.9;G.position.set(n.x+tx*(n.r+1.3)+lx*half,n.y,n.z+tz*(n.r+1.3)+lz*half);G.rotation.y=yaw;scene.add(G);
        const p=new THREE.Mesh(poleGeo,poleMat);p.scale.set(1.6,5.6,1.6);p.position.set(-arm,2.8,0);G.add(p);box(poleMat,arm,0.1,0.1,-arm/2,5.1,0,G);box(headMat,1.5,0.5,0.25,0,5.1,0,G);
        n.lamps.push({e,set:[-0.47,0,0.47].map(x=>{const m=new THREE.Mesh(lampGeo,new THREE.MeshBasicMaterial({color:0x222222}));m.position.set(x,5.1,0.1);G.add(m);return m;})});
        if(pl){const np=new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.56),pl);np.position.set(-arm/2-0.2,5.72,0.03);G.add(np);}
        if(e.kind==='main'){const b=edgePos(e,e.a===n?D+60:e.len-D-60,0);if(e.len>150)ground(busRoad,2.1,8.5,b.x+lx*5.25,b.y+0.11,b.z+lz*5.25,yaw);}}
      if(e.oneway&&e.kind==='narrow1'){const o=edgePos(e,e.len-n.r-1,0);for(const sd of[-1,1])signPost(noEntry,0.8,0.8,o.x+o.tz*sd*(e.w+0.7),o.y,o.z-o.tx*sd*(e.w+0.7),-o.tx,-o.tz,2.2,backRound);}
    }}
  // direction boards before the signalled junctions
  const dest=(n,f)=>{let m=f.a===n?f.b:f.a,pv=f;for(let q=0;q<8;q++){if(m.id==='IC0'||m.id==='VI'||pv.kind==='hw')return'高速';if(m.name)return m.name;if(m.ed.length!==2)break;pv=m.ed[0]===pv?m.ed[1]:m.ed[0];m=pv.a===m?pv.b:pv.a;}return m.name||'';};
  for(const k in ND){const n=ND[k];if(n.ctrl!=='sig'||n.ed.length<3)continue;for(const e of n.ed){if(e.oneway&&e.b!==n||e.len<n.r+70)continue;const d={};for(const f of n.ed){if(f===e||f.oneway&&f.b===n)continue;const tc=turnClass(n,e,f);if(tc!=='U'&&!d[tc])d[tc]=dest(n,f);}
      const t=boardTex(360,220,'#1c4c9c',c=>{c.strokeStyle='#fff';c.lineWidth=13;c.beginPath();if(d.S){c.moveTo(180,206);c.lineTo(180,82);}else{c.moveTo(180,206);c.lineTo(180,150);}if(d.L){c.moveTo(74,150);c.lineTo(186,150);}if(d.R){c.moveTo(174,150);c.lineTo(286,150);}c.stroke();
        const head=(x,y,dx,dy)=>{c.beginPath();c.moveTo(x+dx*22,y+dy*22);c.lineTo(x-dy*17,y+dx*17);c.lineTo(x+dy*17,y-dx*17);c.closePath();c.fill();};if(d.S)head(180,82,0,-1);if(d.L)head(74,150,-1,0);if(d.R)head(286,150,1,0);
        const txt=(s,x,y)=>{if(!s)return;c.font='900 '+(s.length>4?22:28)+'px '+FONT;if(s==='高速'){c.fillStyle='#0f7a4a';c.fillRect(x-36,y-17,72,34);c.fillStyle='#fff';}c.fillText(s,x,y);};txt(d.S,180,36);txt(d.L,82,108);txt(d.R,278,108);});
      const aw=away(n,e),tx=-aw[0],tz=-aw[1],D=n.r+42,q=edgePos(e,e.a===n?D:e.len-D,0),off=e.w+(e.walk?3.3:1.6);signPost(t,3.1,1.9,q.x+tz*off,q.y,q.z-tx*off,tx,tz,4.2);}}
  // bus stops on 中央通り (the buses pull in and wait here)
  {const st=boardTex(128,128,'#1c4c9c',c=>{c.font='900 34px '+FONT;c.fillText('バス',64,44);c.fillText('のりば',64,86);}),sh=L(0x8fa1ad);
    for(const key of['A1-A2','A3-A4'])for(const dir of[1,-1]){const e=EK[key],s=e.len*(dir>0?0.45:0.55);e.feat.push({t:'bus',s,dir});const q=edgePos(e,s+dir*5,dir*(e.w+1.2)),G=new THREE.Group();signPost(st,0.7,0.7,q.x,q.y+0.2,q.z,q.tx*dir,q.tz*dir,2.3);
      const a=edgePos(e,s-dir*2,dir*(e.w+2.0));G.position.set(a.x,a.y+0.2,a.z);G.rotation.y=yawOf(a.tx,a.tz);scene.add(G);box(sh,1.5,0.12,4.4,0,2.5,0,G);for(const z of[-2,2])box(poleMat,0.08,2.4,0.08,dir*0.6,1.25,z,G);}}
  // speed limit signs a little after each junction, both directions
  for(const e of ED){if(e.kind==='hw'||e.kind==='ramp'||e.len<70)continue;for(const d of e.oneway?[1]:[1,-1]){const n0=d>0?e.a:e.b,q=edgePos(e,d>0?n0.r+15:e.len-n0.r-15,0),tx=q.tx*d,tz=q.tz*d;signPost(roundSignTex(e.limit),0.85,0.85,q.x+tz*(e.w+(e.walk?1.0:0.8)),q.y,q.z-tx*(e.w+(e.walk?1.0:0.8)),tx,tz,2.3,backRound);}}
  // --- pedestrian crossing in the middle of 駅前通り (S1–S2)
  {const e=EK['S1-S2'],s=e.len*0.5,q=edgePos(e,s,0),yaw=yawOf(q.tx,q.tz),diamond=decalMat({map:cv(64,192,(c)=>{c.strokeStyle='#f0f2f4';c.lineWidth=7;c.beginPath();c.moveTo(32,6);c.lineTo(58,96);c.lineTo(32,186);c.lineTo(6,96);c.closePath();c.stroke();})});
    e.feat.push({t:'xwalk',s});ground(zebra[8]||(zebra[8]=zebraT(8)),2*e.w,3,q.x,q.y+0.11,q.z,yaw);
    for(const d of[1,-1]){const a=edgePos(e,s-d*3.5,d*e.w/2);ground(white,e.w-0.3,0.5,a.x,a.y+0.11,a.z,yaw);for(const off of[30,50]){const b=edgePos(e,s-d*off,d*e.w/2);ground(diamond,1.5,5,b.x,b.y+0.11,b.z,yawOf(b.tx*d,b.tz*d));}}
    PEDX={e,s};}
  // --- railway (straight, east–west) and its level crossings
  {const y=2.02,len=1360,cx=410;ground(P(0x8c8478,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),len,6,cx,y+0.03,ZR,0);
    const rm=L(0x6f757c);box(rm,len,0.09,0.12,cx,y+0.14,ZR-0.72);box(rm,len,0.09,0.12,cx,y+0.14,ZR+0.72);
    rail={alarm:false,t:22,at:0,gear:[],train:new THREE.Group(),bellT:0};box(L(0xd9dde1),80,3,2.9,0,2.1,0,rail.train);box(L(0xe07b1a),80.1,0.45,2.95,0,1.5,0,rail.train);box(L(0x2c3440),80.1,0.9,2.95,0,2.7,0,rail.train);
    rail.train.position.set(-400,y,ZR);rail.train.visible=false;scene.add(rail.train);const yel=L(0xf2c230);
    for(const e of ED)for(const f of e.feat)if(f.t==='rail')for(const d of[1,-1]){const q=edgePos(e,f.s-d*4.5,d*e.w/2),tx=q.tx*d,tz=q.tz*d,lx=tz,lz=-tx;ground(white,e.w-0.3,0.5,q.x,q.y+0.11,q.z,yawOf(tx,tz));
      const G=new THREE.Group();G.position.set(q.x+tx*0.9+lx*(e.w/2+0.8),q.y,q.z+tz*0.9+lz*(e.w/2+0.8));G.rotation.y=yawOf(tx,tz);scene.add(G);
      const p=new THREE.Mesh(poleGeo,poleMat);p.scale.set(1.5,3.3,1.5);p.position.y=1.65;G.add(p);const a=box(yel,1.5,0.17,0.05,0,3,0.08,G),b=box(yel,1.5,0.17,0.05,0,3,0.09,G);a.rotation.z=Math.PI/4;b.rotation.z=-Math.PI/4;
      const l1=new THREE.Mesh(lampGeo,new THREE.MeshBasicMaterial({color:0x4a1414})),l2=new THREE.Mesh(lampGeo,new THREE.MeshBasicMaterial({color:0x4a1414}));l1.position.set(-0.32,2.3,0.1);l2.position.set(0.32,2.3,0.1);G.add(l1,l2);
      const piv=new THREE.Group();piv.position.set(0.3,1.05,0);piv.rotation.z=1.4;G.add(piv);box(yel,3.7,0.1,0.1,1.85,0,0,piv);rail.gear.push({l1,l2,piv});}}
  {const pk=decalMat({color:0xf0f2f4}),pt=boardTex(128,128,'#1c4c9c',c=>{c.font='900 96px Arial,sans-serif';c.fillText('P',64,70);});
    for(const p of PLACES){const b=p.bay;if(!b)continue;const e=b.e;for(let k=-2;k<=2;k++){const a=edgePos(e,b.s+k*5.2,b.side*(e.w+3.3));ground(pk,0.14,5.4,a.x,a.y+0.11,a.z,yawOf(a.tx,a.tz)+Math.PI/2);}
      const a=edgePos(e,b.s,b.side*(e.w+0.25));ground(pk,0.14,22,a.x,a.y+0.11,a.z,yawOf(a.tx,a.tz));const q=edgePos(e,b.s-b.side*13.5,b.side*(e.w+7.1));signPost(pt,0.8,0.8,q.x,q.y,q.z,q.tx*b.side,q.tz*b.side,2.3);}}
  for(const p of PLACES){const b=p.bay;if(!b)continue;for(const k of[-2,1]){if(R()<0.35)continue;const a=edgePos(b.e,b.s+k*5.2+2.6,b.side*(b.e.w+3.4));propCar(a.x,a.y+0.07,a.z,yawOf(a.tz*b.side,-a.tx*b.side),VEH_COL[Math.floor(R()*VEH_COL.length)]);}}
  buildTown(R);buildExpressway(R);
  // --- goal bay for the test course: on 桜町→本町, left side
  {const e=EK['A2-N2'],s1=e.len-ND.N2.r-28,s0=s1-24;GOAL={e,s0,s1};const q=edgePos(e,(s0+s1)/2,-e.w/2-0.1);goalObjs.push(ground(decalMat({color:0x2f7df0,opacity:0.42}),e.w-0.5,24,q.x,q.y+0.12,q.z,yawOf(-q.tx,-q.tz)));
    const g=edgePos(e,s0+2,-e.w-3.2);goalObjs.push(signPost(textBoard(['ゴール'],1.8,0.9,'#1c4c9c'),1.8,0.9,g.x,g.y,g.z,-g.tx,-g.tz,2.2));}
  {const e=EK['V3-V2'],s1=e.len-ND.V2.r-26,s0=s1-24;GOAL2={e,s0,s1,dir:1};GOAL.dir=-1;const q=edgePos(e,(s0+s1)/2,e.w/2+0.1);goal2Objs.push(ground(decalMat({color:0x2f7df0,opacity:0.42}),e.w-0.5,24,q.x,q.y+0.12,q.z,yawOf(q.tx,q.tz)));}
  const pm=playerModel();carMesh=pm.G;cabin=pm.cab;bodyMesh=pm.body;playerBrake=pm.brake;buildCockpit();
  spawnTraffic(R);buildEvents();buildEnv();buildPeds(R);
  const Pd=new THREE.Group();Pd.userData.dyn=true;const body=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.24,1.15,10),L(0xd4532a));body.position.y=0.73;const head=new THREE.Mesh(new THREE.SphereGeometry(0.17,12,10),L(0xe8c4a0));head.position.y=1.5;Pd.add(body,head);Pd.visible=false;scene.add(Pd);
  ped={mesh:Pd,state:'away',t:6,side:-1,z:0,tw:0,first:true};
  // performance: static objects never recompute their matrices; instanced batches are not culled as a single tiny sphere
  carMesh.userData.dyn=rail.train.userData.dyn=true;for(const g of rail.gear)g.piv.userData.dyn=true;for(const g of tollGates)g.piv.userData.dyn=true;
  const freeze=o=>{if(o.userData.dyn||o.isCamera||o.isLight)return;o.matrixAutoUpdate=false;o.updateMatrix();if(o.isInstancedMesh)o.frustumCulled=false;for(const c of o.children)freeze(c);};
  for(const c of scene.children)freeze(c);scene.updateMatrixWorld(true);
}
