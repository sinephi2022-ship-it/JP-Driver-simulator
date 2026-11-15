/* ---------- people walking on the pavements (umbrellas up when it rains or snows) ---------- */
const walkers=[];
function pedFigure(body,R){const G=new THREE.Group();G.userData.dyn=true;put(G,new THREE.CylinderGeometry(0.19,0.23,1.1,8),L(body),0,0.72,0);put(G,new THREE.SphereGeometry(0.16,10,8),L(0xe8c4a0),0,1.46,0);
  const u=new THREE.Group();put(u,new THREE.ConeGeometry(0.62,0.28,10),L([0x2d5fa8,0xd4222b,0xf2f3f4,0x1d1f24,0xf2c230,0x5cba8a][Math.floor(R()*6)],{side:THREE.DoubleSide}),0.12,2.02,0);put(u,new THREE.CylinderGeometry(0.012,0.012,0.75,5),L(0x555a60),0.12,1.6,0);u.visible=false;G.add(u);G.umb=u;scene.add(G);return G;}
function buildPeds(R){
  const pool=ED.filter(e=>e.walk&&e.len>80),cols=[0x35506b,0x6b3f3f,0x3f5f4a,0x4a4a55,0xa9805a,0x8a8fa0,0x2f3338,0xb35a6a];
  for(let k=0;k<(TOUCH?26:44);k++){const e=pool[Math.floor(R()*pool.length)];walkers.push({e,s:e.a.r+6+R()*(e.len-e.a.r-e.b.r-12),side:R()<0.5?1:-1,dir:R()<0.5?1:-1,v:1.05+R()*0.5,ph:R()*6,G:pedFigure(cols[Math.floor(R()*cols.length)],R)});}
}
function updatePeds(dt){const wet=env.weather!=='clear'&&env.tunnel<0.5;
  for(const w of walkers){const e=w.e;w.s+=w.dir*w.v*dt;if(w.s>e.len-e.b.r-4){w.dir=-1;}else if(w.s<e.a.r+4){w.dir=1;}
    const q=edgePos(e,w.s,w.side*(e.w+1.75)),near=Math.abs(q.x-car.x)+Math.abs(q.z-car.z)<190;w.G.visible=near;if(!near)continue;
    w.G.position.set(q.x,q.y+0.2+Math.abs(Math.sin(time*6+w.ph))*0.03,q.z);w.G.rotation.y=yawOf(q.tx*w.dir,q.tz*w.dir);w.G.umb.visible=wet;}
}
