/* ---------- vehicle models ---------- */
const VEH_COL=[0x2d5fa8,0x8a8f96,0x9c2f2f,0x2f6b4f,0x3a3f48,0xc9a227,0x6b7c93,0x7a4a2b,0xe8e8e4,0x1d1f24,0x4a6fa5,0xb9bdc2];
const wheelGeo=new THREE.CylinderGeometry(0.32,0.32,0.24,12);wheelGeo.rotateZ(Math.PI/2);
const tyreMat=L(0x16181b),glassMat=L(0x1b2532),greyMat=L(0x8f969d);
const beamGeo=new THREE.PlaneGeometry(1,1);beamGeo.rotateX(-Math.PI/2);const flareGeo=new THREE.PlaneGeometry(1.5,0.9);
function taper(w,h,l,f,r,side){const g=new THREE.BoxGeometry(w,h,l),p=g.attributes.position;for(let k=0;k<p.count;k++)if(p.getY(k)>0){p.setZ(k,p.getZ(k)<0?p.getZ(k)+f:p.getZ(k)-r);p.setX(k,p.getX(k)*(side||0.86));}g.computeVertexNormals();return g;}
function put(G,geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);G.add(m);return m;}
function lampBox(G,col,w,h,x,y,z){return put(G,new THREE.BoxGeometry(w,h,0.06),new THREE.MeshBasicMaterial({color:col}),x,y,z).material;}
function makeVehicle(kind,color){
  const G=new THREE.Group(),v={G,kind,brake:[],bl:[],br:[],beacon:[],head:[],flare:[]};G.userData.dyn=true;let len=4.3,wid=1.7;
  const wheels=(xs,zs,r)=>{for(const x of xs)for(const z of zs){const m=put(G,wheelGeo,tyreMat,x,0.32*(r||1),z);m.scale.set(1,r||1,r||1);}};
  const lights=(w,yh,yt,zf,zr)=>{for(const sx of[-1,1]){v.head.push(lampBox(G,0xfff6d8,0.3,0.14,sx*(w/2-0.3),yh,zf-0.01));const fl=put(G,flareGeo,flareMat,sx*(w/2-0.3),yh,zf-0.06);fl.rotation.y=Math.PI;v.flare.push(fl);v.brake.push(lampBox(G,0x5a0d0d,0.32,0.14,sx*(w/2-0.32),yt,zr+0.01));
    (sx<0?v.bl:v.br).push(lampBox(G,0x5a3d08,0.14,0.14,sx*(w/2-0.07),yh,zf-0.012),lampBox(G,0x5a3d08,0.14,0.14,sx*(w/2-0.07),yt,zr+0.012));}};
  const beacon=(y,z,w)=>{v.beacon.push(lampBox(G,0x551010,w/2,0.16,-w/4,y,z),lampBox(G,0x551010,w/2,0.16,w/4,y,z));put(G,new THREE.BoxGeometry(w+0.1,0.06,0.3),greyMat,0,y-0.1,z);};
  const rider=(c)=>{put(G,new THREE.CylinderGeometry(0.2,0.22,0.75,8),L(c),0,1.25,0.1);put(G,new THREE.SphereGeometry(0.17,10,8),L(0x22262c),0,1.78,0.05);};
  if(kind==='car'||kind==='police'){const pol=kind==='police',body=L(pol?0x17191c:color),top=L(pol?0xf2f3f4:color);
    put(G,new THREE.BoxGeometry(1.7,0.34,4.3),body,0,0.47,0);put(G,new THREE.BoxGeometry(1.7,0.24,4.3),top,0,0.76,0);
    put(G,taper(1.58,0.5,2.6,0.6,0.38),glassMat,0,1.13,0.2);put(G,new THREE.BoxGeometry(1.3,0.05,1.55),top,0,1.4,0.3);
    wheels([-0.78,0.78],[-1.35,1.35]);lights(1.7,0.72,0.74,-2.15,2.15);if(pol)beacon(1.52,0.3,1.0);}
  else if(kind==='van'||kind==='ambulance'){const amb=kind==='ambulance';len=amb?5.2:4.5;const c=L(amb?0xf4f5f6:color);
    put(G,new THREE.BoxGeometry(1.75,0.7,len),c,0,0.67,0);put(G,taper(1.75,0.95,len,0.75,0.05,0.93),c,0,1.5,0);
    put(G,new THREE.BoxGeometry(1.66,0.42,len*0.62),glassMat,0,1.5,0.15);const ws=put(G,new THREE.BoxGeometry(1.45,0.5,0.05),glassMat,0,1.5,-len/2+0.4);ws.rotation.x=-0.65;
    if(amb){put(G,new THREE.BoxGeometry(1.77,0.14,len+0.02),L(0xd4222b),0,0.95,0);beacon(2.05,-len/2+1.2,1.2);}
    wheels([-0.8,0.8],[-len/2+0.95,len/2-0.95]);lights(1.75,0.72,0.8,-len/2,len/2);wid=1.75;}
  else if(kind==='truck'||kind==='fire'){const fire=kind==='fire';len=7.6;wid=2.3;const c=L(fire?0xc81e1e:color);
    put(G,new THREE.BoxGeometry(2.0,0.3,7.2),tyreMat,0,0.6,0.1);put(G,new THREE.BoxGeometry(2.2,1.9,1.9),c,0,1.55,-2.8);put(G,new THREE.BoxGeometry(1.9,0.7,0.05),glassMat,0,1.95,-3.76);
    if(fire){put(G,new THREE.BoxGeometry(2.25,1.5,5.1),c,0,1.45,0.95);put(G,new THREE.BoxGeometry(0.7,0.25,5.4),greyMat,0,2.4,0.7);beacon(2.62,-2.8,1.4);}
    else put(G,new THREE.BoxGeometry(2.3,2.5,5.2),L(0xd9dde1),0,2.0,0.95);
    wheels([-0.95,0.95],[-2.7,1.7,2.9],1.35);lights(2.2,0.85,0.7,-3.75,3.55);}
  else if(kind==='bus'){len=10.5;wid=2.45;put(G,new THREE.BoxGeometry(2.45,2.6,10.5),L(0xe9e3d2),0,1.75,0);put(G,new THREE.BoxGeometry(2.47,0.9,9.6),glassMat,0,2.25,0.1);
    put(G,new THREE.BoxGeometry(2.47,0.3,10.52),L(0x2f6b4f),0,1.0,0);put(G,new THREE.BoxGeometry(2.15,1.2,0.05),glassMat,0,2.05,-5.26);lampBox(G,0xff9a1a,1.4,0.24,0,2.86,-5.27);
    wheels([-1.05,1.05],[-3.4,3.0],1.3);lights(2.45,0.8,0.85,-5.25,5.25);}
  else if(kind==='tram'){len=13;wid=2.3;put(G,new THREE.BoxGeometry(2.3,2.6,13),L(0x2f6b4f),0,1.75,0);put(G,new THREE.BoxGeometry(2.32,1.0,12.4),L(0xe9e3d2),0,2.5,0);put(G,new THREE.BoxGeometry(2.34,0.7,11.6),glassMat,0,2.45,0);put(G,new THREE.BoxGeometry(1.9,1.0,0.05),glassMat,0,2.3,-6.51);put(G,new THREE.BoxGeometry(1.9,1.0,0.05),glassMat,0,2.3,6.51);
    put(G,new THREE.BoxGeometry(1.6,0.25,3),greyMat,0,3.2,0);put(G,new THREE.BoxGeometry(0.08,1.1,0.08),greyMat,0,3.8,0);put(G,new THREE.BoxGeometry(1.8,0.3,12),tyreMat,0,0.3,0);lampBox(G,0xff9a1a,1.2,0.22,0,3.0,-6.52);lights(2.3,0.8,0.8,-6.5,6.5);}
  else if(kind==='moto'){len=2;wid=0.7;put(G,new THREE.BoxGeometry(0.36,0.5,1.5),L(0x20242a),0,0.68,0);rider(0x2d5fa8);wheels([0],[-0.68,0.68],0.95);
    lampBox(G,0xfff6d8,0.16,0.14,0,0.95,-0.78);v.brake.push(lampBox(G,0x5a0d0d,0.16,0.1,0,0.85,0.78));v.bl.push(lampBox(G,0x5a3d08,0.08,0.08,-0.25,0.85,0.76));v.br.push(lampBox(G,0x5a3d08,0.08,0.08,0.25,0.85,0.76));}
  else if(kind==='bike'){len=1.7;wid=0.6;put(G,new THREE.BoxGeometry(0.07,0.38,1.25),L(0x4a5563),0,0.62,0);rider(0xd4532a);wheels([0],[-0.55,0.55],0.9);}
  if(kind!=='bike'&&kind!=='tram'){const b=v.beam=new THREE.Mesh(beamGeo,beamMat);b.position.set(0,0.1,-len/2-5);b.scale.set(kind==='moto'?2.2:4.6,1,10);G.add(b);}
  v.len=len;v.hl=len/2;v.wid=wid;scene.add(G);return v;
}
function vehLights(v,brake,sig,flash){
  const hd=env.night>0.4||env.tunnel>0.5?0xfffbe6:0xa9a79c;for(const m of v.head)m.color.setHex(hd);
  const tail=env.night>0.5?0x9a1414:0x5a0d0d;for(const m of v.brake)m.color.setHex(brake?0xff2a1a:tail);
  const l=(sig==='L'||sig==='H')&&flash,r=(sig==='R'||sig==='H')&&flash;for(const m of v.bl)m.color.setHex(l?0xffb000:0x5a3d08);for(const m of v.br)m.color.setHex(r?0xffb000:0x5a3d08);
  if(v.beacon.length){const a=Math.floor(time*6)%2;v.beacon[0].color.setHex(a?0xff2020:0x551010);v.beacon[1].color.setHex(a?0x551010:0xff2020);}
}
function playerModel(){
  const G=new THREE.Group(),white=L(0xf4f5f6);
  const body=put(G,new THREE.BoxGeometry(1.7,0.56,4.3),white,0,0.62,0),cab=new THREE.Group();G.add(cab);
  put(cab,taper(1.58,0.5,2.6,0.6,0.38),glassMat,0,1.14,0.2);put(cab,new THREE.BoxGeometry(1.3,0.05,1.55),white,0,1.41,0.3);
  for(const x of[-0.78,0.78])for(const z of[-1.35,1.35])put(G,wheelGeo,tyreMat,x,0.32,z);
  const brake=[];for(const sx of[-1,1]){brake.push(lampBox(body,0x5a0d0d,0.32,0.14,sx*0.53,0.12,2.16));lampBox(body,0xfff6d8,0.3,0.14,sx*0.55,0.1,-2.16);}
  const pt=cv(256,80,(c)=>{c.fillStyle='#fff';c.fillRect(0,0,256,80);c.strokeStyle='#111';c.lineWidth=5;c.strokeRect(3,3,250,74);c.fillStyle='#111';c.font='900 36px '+FONT;c.textAlign='center';c.textBaseline='middle';c.fillText('仮免許練習中',128,42);});
  put(body,new THREE.PlaneGeometry(1.0,0.31),dim(new THREE.MeshBasicMaterial({map:pt})),0,0.05,2.17);
  scene.add(G);return {G,cab,body,brake};
}
