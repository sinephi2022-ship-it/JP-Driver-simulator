/* ---------- environment: time of day, weather, lights, wipers ---------- */
const env={sight:1,npcCap:1,npcDec:2.2,headway:0,mode:'day',weather:'clear',tod:12,night:0,lights:false,wipers:false,tunnel:0,inTunnel:false,grip:1,flash:0,flashCol:'#fff',nolT:0,nolFlag:false};
const WET=[],GLOW=[];                                    // additive light pools that fade in at night
const glowTex=cv(64,64,c=>{const g=c.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(255,236,190,0.9)');g.addColorStop(0.5,'rgba(255,225,170,0.3)');g.addColorStop(1,'rgba(255,220,160,0)');c.fillStyle=g;c.fillRect(0,0,64,64);});
const glowMat=o=>{const m=new THREE.MeshBasicMaterial(Object.assign({map:glowTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4},o));GLOW.push(m);return m;};
const beamMat=glowMat({}),aviMat=new THREE.MeshBasicMaterial({color:0x330808});let dome,rainLines,snowPts,headLamp,wiperPiv=[],rainOff,snowOff;
const cA=new THREE.Color(),cB=new THREE.Color();
function buildEnv(){
  dome=new THREE.Mesh(new THREE.SphereGeometry(395,16,10),new THREE.MeshBasicMaterial({color:0x070b18,side:THREE.BackSide,transparent:true,opacity:0,depthWrite:false,fog:false}));dome.renderOrder=-1;dome.frustumCulled=false;dome.userData.dyn=true;scene.add(dome);
  const NR=700,rp=new Float32Array(NR*6);rainOff=new Float32Array(NR*3);for(let k=0;k<NR*3;k+=3){rainOff[k]=(Math.random()-0.5)*36;rainOff[k+1]=Math.random()*14;rainOff[k+2]=(Math.random()-0.5)*36;}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rp,3));rainLines=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0xcfd9e4,transparent:true,opacity:0.55,fog:false}));rainLines.frustumCulled=false;rainLines.visible=false;scene.add(rainLines);
  const NS=900,sp=new Float32Array(NS*3);snowOff=new Float32Array(NS*3);for(let k=0;k<NS*3;k+=3){snowOff[k]=(Math.random()-0.5)*40;snowOff[k+1]=Math.random()*14;snowOff[k+2]=(Math.random()-0.5)*40;}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));snowPts=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:0.13,fog:false}));snowPts.frustumCulled=false;snowPts.visible=false;scene.add(snowPts);
  headLamp=new THREE.SpotLight(0xfff0cf,0,70,0.55,0.7,1.1);headLamp.position.set(0,0.85,-1.9);headLamp.target.position.set(0,-0.6,-30);carMesh.add(headLamp,headLamp.target);
  const wm=L(0x101216);for(const x of[-0.04,0.6]){const piv=new THREE.Group();piv.position.set(x,1.02,-1.02);piv.rotation.x=-0.95;cockpit.add(piv);const arm=new THREE.Group();piv.add(arm);box(wm,0.03,0.8,0.02,0,0.4,0,arm);box(wm,0.05,0.5,0.03,0,0.52,0.012,arm);arm.rotation.z=1.5;wiperPiv.push(arm);}
}
function setEnv(mode,weather){env.mode=mode;env.wxAuto=weather==='auto';if(env.wxAuto)weather='clear';env.wxT=50+Math.random()*50;env.weather=weather;env.tod=mode==='night'?22:mode==='dusk'?18:mode==='cycle'?15.5:12;env.lights=false;env.wipers=false;env.nolT=0;env.nolFlag=false;env.inTunnel=false;env.tunnel=0;env.flash=0;}
function updateEnv(dt){
  if(env.wxAuto&&state==='drive'){env.wxT-=dt;if(env.wxT<=0){const r=Math.random(),cold=env.night>0.5;env.weather=env.weather==='clear'?(r<0.75?'rain':'snow'):(r<0.7?'clear':env.weather==='rain'&&cold?'snow':'rain');env.wxT=70+Math.random()*90;}}
  const w=env.weather,drv=state==='drive';if(env.mode==='cycle'&&drv)env.tod=(env.tod+dt*24/420)%24;
  const h=env.tod,n=h<5?1:h<7?1-(h-5)/2:h<17?0:h<19?(h-17)/2:1;env.night=n;
  env.tunnel+=clamp((env.inTunnel?1:0)-env.tunnel,-dt*1.6,dt*1.6);const tu=env.tunnel;env.dimS=(env.dimS||1)+((w==='rain'?0.72:w==='snow'?0.86:1)-(env.dimS||1))*Math.min(1,dt*0.35);const dimW=env.dimS;
  env.grip=w==='rain'?0.7:w==='snow'?0.45:1;
  // other drivers see less far, drive slower and brake more gently in bad weather or at night
  env.sight=(w==='snow'?0.6:w==='rain'?0.8:1)*(n>0.6?0.85:1);env.npcCap=w==='snow'?0.7:w==='rain'?0.88:1;env.npcDec=2.2*(w==='snow'?0.55:w==='rain'?0.8:1);env.headway=w==='clear'?0:w==='rain'?0.35:0.7;
  let amb=(0.72+(0.21-0.72)*n)*dimW;amb+=(0.34-amb)*tu;hemi.intensity=amb;hemi.color.setHex(0xffffff).lerp(cA.setHex(0xffc98a),tu*0.8).lerp(cA.setHex(0x9fb4ff),n*0.35*(1-tu));
  sun.intensity=(0.38+(0.02-0.38)*n)*dimW*(1-tu);
  // sky: a tinted dome over the daytime skybox
  const dm=dome.material;if(w==='clear'){dm.color.setHex(0xd98a5c).lerp(cA.setHex(0x060a16),Math.min(1,n*1.25));dm.opacity=Math.min(0.95,n*1.5)*(n<0.5?0.75+n*0.5:1);}
  else{dm.color.setHex(w==='rain'?0x8a9299:0xc3c9ce).lerp(cA.setHex(0x060a16),n);dm.opacity=Math.max(0.86,n*0.95);}
  dome.position.copy(camera.position);
  cB.setHex(w==='rain'?0x969da4:w==='snow'?0xc9ced2:0xd9dad2).lerp(cA.setHex(0xc98f6a),w==='clear'?(1-Math.abs(2*n-1))*0.5:0).lerp(cA.setHex(0x0a0e18),n*n).lerp(cA.setHex(0x16130f),tu);
  scene.fog.color.copy(cB);{const kf=Math.min(1,dt*0.35),tn=w==='clear'?80:w==='rain'?38:28,tf=(w==='clear'?230:w==='rain'?160:130)*(1-0.12*n);env.fogN=(env.fogN||tn)+(tn-(env.fogN||tn))*kf;env.fogF=(env.fogF||tf)+(tf-(env.fogF||tf))*kf;scene.fog.near=env.fogN;scene.fog.far=env.fogF;}if(env.noFog){scene.fog.near=5000;scene.fog.far=9000;}
  else{const far=Math.round(scene.fog.far*1.04/10)*10;if(camera.far!==far){camera.far=far;camera.updateProjectionMatrix();dome.scale.setScalar((far-6)/395);camRear.far=camL.far=camR.far=Math.min(far,170);camRear.updateProjectionMatrix();camL.updateProjectionMatrix();camR.updateProjectionMatrix();}}
  const f=(1-0.6*Math.max(n*0.95,tu*0.5))*Math.sqrt(dimW);for(const m of DIM)m.color.copy(m.userData.base).multiplyScalar(f);
  for(const m of NIGHT)m.emissiveIntensity=n>0.3?n*0.9:0;streetLampMat.color.setHex(n>0.35?0xffe7b0:0x8d9399);
  for(const m of WET){m.shininess=w==='rain'?55:0;m.specular.setHex(w==='rain'?0x55595e:0x000000);m.color.setHex(w==='snow'?0xd6dadd:0xffffff);}
  const glw=Math.max(0,(Math.max(n,tu)-0.3)/0.7);for(const m of GLOW)m.opacity=glw*(m.userData.k||0.5);aviMat.color.setHex(n>0.4&&Math.floor(time*0.9)%2?0xff2a2a:0x330808);
  headLamp.intensity=env.lights?1.3+1.4*Math.max(n,tu):0;
  // rain / snow particles follow the camera; nothing falls inside the tunnel or the cabin
  const show=tu<0.5,cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;
  rainLines.visible=w==='rain'&&show;snowPts.visible=w==='snow'&&show;
  if(rainLines.visible){const p=rainLines.geometry.attributes.position.array;for(let k=0,q=0;k<rainOff.length;k+=3,q+=6){rainOff[k+1]-=22*dt;if(rainOff[k+1]<-2)rainOff[k+1]+=14;const ox=rainOff[k],oz=rainOff[k+2],hide=Math.abs(ox)<1.5&&Math.abs(oz)<2.6,y=hide?-50:cy-2+rainOff[k+1];
    p[q]=cx+ox;p[q+1]=y;p[q+2]=cz+oz;p[q+3]=cx+ox+0.04;p[q+4]=y+0.6;p[q+5]=cz+oz;}rainLines.geometry.attributes.position.needsUpdate=true;}
  if(snowPts.visible){const p=snowPts.geometry.attributes.position.array;for(let k=0;k<snowOff.length;k+=3){snowOff[k+1]-=2.2*dt;snowOff[k]+=Math.sin(time+k)*0.4*dt;if(snowOff[k+1]<-2)snowOff[k+1]+=14;const hide=Math.abs(snowOff[k])<1.5&&Math.abs(snowOff[k+2])<2.6;
    p[k]=cx+snowOff[k];p[k+1]=hide?-50:cy-2+snowOff[k+1];p[k+2]=cz+snowOff[k+2];}snowPts.geometry.attributes.position.needsUpdate=true;}
  const wa=1.5-(env.wipers?(Math.sin(time*3.6)+1)*0.66:0);for(const q of wiperPiv)q.rotation.z+=clamp(wa-q.rotation.z,-dt*6,dt*6);
  // tunnel entry / exit: the eyes need a moment to adapt; rain on the glass without wipers blurs the view
  env.flash=Math.max(0,env.flash-dt*0.5);const gl=$('glare'),haze=w!=='clear'&&!env.wipers&&show&&camMode===0&&state!=='menu'?0.3:0;
  if(env.flash>0.01){gl.style.background=env.flashCol;gl.style.opacity=env.flash.toFixed(2);}else{gl.style.background='#c9d3dc';gl.style.opacity=haze;}
  const need=n>0.6||env.inTunnel;if(drv&&need&&!env.lights&&Math.abs(car.v)>2){env.nolT+=dt;if(env.nolT>4&&!env.nolFlag){env.nolFlag=true;violate('nolight');}}else{env.nolT=0;if(env.lights||!need)env.nolFlag=false;}
}
