function buildCockpit(){
  const C=new THREE.Group();carMesh.add(C);cockpit=C;
  const dk=L(0x1c2027),md=L(0x2b3039),lt=L(0x444b57),bk=L(0x14171c),X=0.38;
  box(dk,1.64,0.14,0.52,0,0.93,-0.77,C);box(md,1.64,0.46,0.1,0,0.66,-0.53,C);          // dash top + face
  box(L(0xf4f5f6),1.7,0.5,1.3,0,0.59,-1.6,C);box(bk,1.66,0.5,2.7,0,0.3,0.45,C);box(md,0.26,0.2,0.9,0,0.62,0.1,C); // bonnet, floor, centre console
  box(dk,0.54,0.24,0.14,X,1.0,-0.57,C);box(dk,0.56,0.03,0.2,X,1.127,-0.57,C);          // instrument binnacle
  clusterCv=document.createElement('canvas');clusterCv.width=512;clusterCv.height=192;clusterTex=new THREE.CanvasTexture(clusterCv);
  const cl=new THREE.Mesh(new THREE.PlaneGeometry(0.46,0.1725),new THREE.MeshBasicMaterial({map:clusterTex,fog:false}));cl.position.set(X,1.0,-0.485);cl.rotation.x=-0.18;C.add(cl);
  // centre navigation screen (shows the course map)
  mapTex=new THREE.CanvasTexture($('map'));const nav=new THREE.Group();nav.position.set(-0.12,0.89,-0.47);nav.rotation.y=0.32;C.add(nav);
  box(bk,0.26,0.2,0.03,0,0,-0.02,nav);nav.add(new THREE.Mesh(new THREE.PlaneGeometry(0.235,0.18),new THREE.MeshBasicMaterial({map:mapTex,fog:false,color:0xdddddd})));
  box(lt,0.4,0.05,0.02,-0.55,0.84,-0.475,C);      // vents
  // steering wheel, column, indicator stalk (on the right, as in Japanese cars)
  beam(dk,[X,0.97,-0.32],[X,0.8,-0.64],0.09,C);
  const tilt=new THREE.Group();tilt.position.set(X,0.97,-0.32);tilt.rotation.x=-0.42;C.add(tilt);wheel=new THREE.Group();tilt.add(wheel);
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.2,0.016,10,40),bk));box(bk,0.39,0.035,0.02,0,0,0,wheel);box(bk,0.035,0.2,0.02,0,-0.1,0,wheel);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.05,20),lt);hub.rotation.x=Math.PI/2;wheel.add(hub);
  tiltG=tilt;stalk=new THREE.Group();stalk.position.set(0.05,0,-0.04);tilt.add(stalk);box(lt,0.23,0.022,0.022,0.115,0,0,stalk);box(bk,0.05,0.035,0.035,0.24,0,0,stalk);
  stalkL=new THREE.Group();stalkL.position.set(-0.05,0,-0.04);tilt.add(stalkL);box(lt,0.23,0.022,0.022,-0.115,0,0,stalkL);box(bk,0.05,0.035,0.035,-0.24,0,0,stalkL);
  // body shell
  for(const sg of[-1,1]){box(md,0.06,0.52,2.3,sg*0.84,0.76,0.25,C);beam(dk,[sg*0.83,1.0,-1.0],[sg*0.72,1.63,-0.3],0.08,C);beam(dk,[sg*0.84,1.02,0.55],[sg*0.75,1.63,0.55],0.1,C);}
  box(md,1.5,0.04,1.9,0,1.66,0.62,C);box(dk,1.46,0.06,0.08,0,1.63,-0.3,C);
  // mirrors rendered from rear-facing cameras
  rtRear=TOUCH?new THREE.WebGLRenderTarget(384,112):new THREE.WebGLRenderTarget(768,224);rtL=new THREE.WebGLRenderTarget(TOUCH?128:256,TOUCH?83:166);rtR=new THREE.WebGLRenderTarget(TOUCH?128:256,TOUCH?83:166);
  [rtRear,rtL,rtR].forEach(t=>{t.texture.wrapS=THREE.RepeatWrapping;t.texture.repeat.x=-1;});
  const mir=(rt,w,h,x,y,z,ry,shell)=>{const G=new THREE.Group();G.position.set(x,y,z);G.rotation.y=ry;C.add(G);box(shell,w+0.03,h+0.03,0.05,0,0,0,G);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:rt.texture,fog:false}));m.position.z=0.027;G.add(m);};
  mir(rtRear,0.36,0.105,0.04,1.42,-0.45,0.42,bk);box(bk,0.03,0.2,0.03,0.04,1.55,-0.47,C);
  mir(rtR,0.2,0.13,1.0,1.08,-0.72,-0.3,L(0xf4f5f6));mir(rtL,0.2,0.13,-1.0,1.08,-0.72,0.5,L(0xf4f5f6));
  camRear=new THREE.PerspectiveCamera(21,0.36/0.105,0.6,300);camRear.position.set(0,1.38,1.0);camRear.rotation.y=Math.PI;
  camR=new THREE.PerspectiveCamera(27,0.2/0.13,0.5,300);camR.position.set(1.04,1.08,-0.5);camR.rotation.y=Math.PI+0.1;
  camL=new THREE.PerspectiveCamera(27,0.2/0.13,0.5,300);camL.position.set(-1.04,1.08,-0.5);camL.rotation.y=Math.PI-0.1;carMesh.add(camRear,camR,camL);
}
function drawCluster(dt){
  const c=clusterCv.getContext('2d'),kmh=Math.abs(car.v)*3.6;
  c.fillStyle='#07090d';c.fillRect(0,0,512,192);c.textAlign='center';c.textBaseline='middle';
  const dial=(cx,cy,r,max,step,val,label,red)=>{c.lineWidth=3;c.strokeStyle='#39424f';c.beginPath();c.arc(cx,cy,r,0,7);c.stroke();
    for(let v=0;v<=max;v+=step){const a=(135+270*v/max)*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);c.strokeStyle=red!=null&&v>=red?'#e3414a':'#dfe5ec';c.lineWidth=2.5;c.beginPath();c.moveTo(cx+ca*(r-4),cy+sa*(r-4));c.lineTo(cx+ca*(r-14),cy+sa*(r-14));c.stroke();c.fillStyle='#dfe5ec';c.font='600 16px "Barlow Condensed",Arial';c.fillText(v,cx+ca*(r-27),cy+sa*(r-27));}
    const a=(135+270*Math.min(val,max)/max)*Math.PI/180;c.strokeStyle='#ff5a3c';c.lineWidth=4;c.beginPath();c.moveTo(cx-Math.cos(a)*10,cy-Math.sin(a)*10);c.lineTo(cx+Math.cos(a)*(r-16),cy+Math.sin(a)*(r-16));c.stroke();c.fillStyle='#222a35';c.beginPath();c.arc(cx,cy,9,0,7);c.fill();
    c.fillStyle='#8f9bab';c.font='500 12px Arial';c.fillText(label,cx,cy+r*0.58);};
  dial(112,98,86,180,20,kmh,'km/h');dial(400,98,86,8,1,rpm,'×1000 r/min',6);
  c.fillStyle=kmh>curLimit+2?'#ff5a62':'#f2f5f8';c.font='700 58px "Barlow Condensed",Arial';c.fillText(Math.round(kmh),256,92);c.fillStyle='#8f9bab';c.font='500 13px Arial';c.fillText('km/h',256,126);
  ['P','R','N','D'].forEach((g,k)=>{const on=g===car.gear;c.fillStyle=on?(g==='R'?'#f6b40e':'#1fe0a0'):'#4a5563';c.font=(on?'700 22px':'600 17px')+' "Barlow Condensed",Arial';c.fillText(g,223+k*22,160);});
  const arrow=(x,dir,on)=>{c.fillStyle=on?'#1fe0a0':'#17231f';c.beginPath();c.moveTo(x+dir*16,30);c.lineTo(x,18);c.lineTo(x,25);c.lineTo(x-dir*14,25);c.lineTo(x-dir*14,35);c.lineTo(x,35);c.lineTo(x,42);c.closePath();c.fill();};
  c.fillStyle=env.lights?'#3fe08a':'#16261d';c.font='700 13px Arial';c.fillText('≡D',256,52);c.fillStyle=car.hb?'#ff3b3b':'#2a1717';c.font='700 17px Arial';c.fillText('(P)',256,31);
  arrow(222,-1,blink==='L'&&blinkOn);arrow(290,1,blink==='R'&&blinkOn);clusterTex.needsUpdate=true;
}

