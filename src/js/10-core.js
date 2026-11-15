/* ---------- world constants ---------- */
const FRONT=2.1,ZR=-185,DIM=[],NIGHT=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const yawOf=(tx,tz)=>Math.atan2(-tx,-tz);              // three.js yaw for an object whose -z should point along (tx,tz)
let time=0;
// terrain: flat city by the sea, a hill district in the north-west, a mountain ridge, a high plateau village in the north
const coastX=z=>1125+30*Math.sin(z/260);
function TH(x,z){
  let h=2+21*Math.exp(-((x-20)*(x-20)+(z+770)*(z+770))/45000);
  const R=Math.exp(-(z+1300)*(z+1300)/57800),A=(96+30*Math.sin(x/230+1))*(0.1+0.9*sstep(1150,820,x));
  h+=A*R+38*sstep(-1500,-2300,z);
  if(z<-880||x<-40)h+=1.6*Math.sin(x/37)*Math.sin(z/29)*sstep(-880,-1000,z>-880?-1000+(-40-x):z);
  return lerp(h,-9,sstep(coastX(z)+4,coastX(z)+85,x));
}
/* ---------- map: 若葉市 – 海岸 – 青葉山 – 山手町 ---------- */
const ND={},ED=[];
const KIND={main:{w:7,lanes:2,limit:50,dist:'down',walk:1},city:{w:3.5,lanes:1,limit:40,dist:'mid',walk:1},narrow1:{w:2.3,lanes:1,limit:20,oneway:true,dist:'shop'},hill:{w:3,lanes:1,limit:30,dist:'res'},
  coast:{w:3.5,lanes:1,limit:50,dist:'sea'},coast3:{w:5.25,lanes:1,lf:2,lb:1,c:-1.75,limit:50,dist:'sea'},mount:{w:3.1,lanes:1,limit:30},rural:{w:3.2,lanes:1,limit:40,dist:'farm'},lane:{w:2.5,lanes:1,limit:30,dist:'farm',quiet:true},
  tram:{w:6,lanes:1,limit:40,dist:'mid',walk:1,inner:2.5},hw:{w:3.5,lanes:2,limit:100,oneway:true},ramp:{w:2,lanes:1,limit:60,oneway:true,quiet:true}};
function nd(id,x,z,name,ctrl,stops){ND[id]={id,x,z,name:name||null,ctrl:ctrl||null,stops:stops||[],ed:[],lamps:[]};}
function ed(a,b,kind,mid,o){const e=Object.assign({i:ED.length,a:ND[a],b:ND[b],kind,mid:mid||[],key:a+'-'+b},KIND[kind],o||{});ED.push(e);ND[a].ed.push(e);ND[b].ed.push(e);return e;}
nd('S0',-110,-82,'駅西','stop',['S0-S1']);nd('S1',120,-80,'駅西口','stop',['S0-S1','S1-S2']);nd('S2',340,-70,'駅前','sig');nd('S3',570,-60,'南町','sig');nd('S4',800,-52,'港入口','stop',['S3-S4','S4-S5']);nd('S5',1012,-48,'港','stop',['S4-S5','SS-S5']);nd('SS',346,95,'駅南','stop',['S2-SS']);
nd('W0',-130,-296);nd('A1',100,-300,'西本町','sig');nd('A2',330,-310,'本町','sig');nd('O1',445,-306,'商店街');nd('A3',560,-300,'市役所前','sig');nd('A4',790,-280,'東本町','sig');nd('A5',1002,-250,'海岸通り','sig');
nd('N1',90,-540,'緑ヶ丘','sig');nd('N2',320,-560,'桜町','sig');nd('O2',441,-556,null,'stop',['O3-O2']);nd('N3',550,-550,'公園前');nd('N3u',551,-551);nd('N4',780,-530,'小学校前','stop',['A4-N4','N4-NE']);
nd('O3',443,-430);nd('CM',556,-425,null,'stop',['O3-CM']);
nd('NN',330,-730,'寺下','stop',['N2-NN']);nd('IC1',560,-770,'若葉IC入口','sig');nd('NE',790,-740,'北浜','stop',['N4-NE']);nd('IC0',560,-858);
nd('H1',-70,-690,'団地前');nd('H2',110,-820,'若葉寺');
nd('C1',1040,-500,'海水浴場');nd('C2',1000,-750,'北浜海岸','stop',['NE-C2']);nd('C3',1060,-1010,'灯台');nd('C4',1010,-1300,'青葉峠');nd('C5',1000,-2590);
nd('VI',660,-2570);nd('V3',640,-2650,'山手IC入口','stop',['VI-V3']);nd('V1',480,-2760,'役場前');nd('V2',790,-2750,'道の駅','stop',['V5-V2']);nd('V4',400,-2980,'山手温泉');nd('V5',700,-3010,'棚田');
ed('W0','A1','main');ed('A1','A2','main',[[215,-300]]);ed('A2','O1','main');ed('O1','A3','main');ed('A3','A4','main',[[675,-296]]);ed('A4','A5','main',[[900,-262]]);
ed('S0','S1','city');ed('S1','S2','tram',[[230,-80]]);ed('S2','S3','tram',[[455,-62]]);ed('S3','S4','tram',[[685,-60]]);ed('S4','S5','city',[[905,-46]]);ed('S2','SS','city',[[348,10]],{limit:30});
ed('W0','S0','city',[[-152,-190]],{dist:'res'});ed('S0','SS','city',[[-92,32],[120,102]],{dist:'res'});ed('SS','S5','city',[[620,114],[905,98],[990,38]],{dist:'sea'});
ed('N1','N2','city',[[205,-556]],{dist:'res'});ed('N2','O2','city',null,{dist:'res'});ed('O2','N3','city',null,{dist:'res'});ed('N3','N4','city',[[665,-546]],{dist:'res'});
ed('S1','A1','city',[[104,-190]]);ed('A1','N1','city',[[88,-420]],{dist:'res'});ed('S2','A2','city',[[338,-190]]);ed('A2','N2','city',[[322,-435]]);
ed('S3','A3','city',[[568,-180]]);ed('A3','CM','city');ed('CM','N3u','city',null,{bump:['b',5.9,84]});ed('S4','A4','city',[[798,-165]]);ed('A4','N4','city',[[788,-405]],{limit:30,dist:'res',school:true});
ed('O1','O3','narrow1');ed('O3','O2','narrow1');ed('O3','CM','narrow1');
ed('N2','NN','city',[[322,-645]],{dist:'res'});ed('N3u','IC1','city',[[552,-660]],{dist:'res',bump:['a',5.9,84]});ed('N4','NE','city',[[786,-635]],{dist:'res'});ed('NN','IC1','city',[[445,-758]],{dist:'res'});ed('IC1','NE','city',[[675,-762]],{dist:'res'});ed('NE','C2','city',[[895,-748]],{dist:'sea'});
ed('N1','H1','hill',[[10,-585],[-55,-630]]);ed('H1','H2','hill',[[-62,-770],[15,-838]]);ed('H2','NN','hill',[[205,-805],[280,-762]]);
ed('S5','A5','coast3',[[1028,-150]]);ed('A5','C1','coast3',[[1034,-370]]);ed('C1','C2','coast3',[[1038,-630]]);ed('C2','C3','coast',[[1012,-880]]);
ed('C3','C4','mount',[[1085,-1085],[1035,-1150],[1075,-1225]]);ed('C4','C5','mount',[[1062,-1390],[1005,-1480],[1060,-1600],[1018,-1750],[1064,-1900],[1026,-2060],[1066,-2220],[1018,-2400]]);ed('C5','V2','rural',[[905,-2680]]);
ed('IC1','IC0','city',null,{limit:40,dist:null,toll:true});
ed('IC0','VI','hw',[[548,-960],[600,-1100],[680,-1230],[702,-1450],[690,-1700],[640,-1950],[600,-2200],[640,-2420]],{flat:true});
ed('VI','V3','city',null,{limit:40,dist:null,toll:true});
ed('V3','V1','rural',[[560,-2712]]);ed('V3','V2','rural',[[720,-2702]]);ed('V1','V4','lane',[[428,-2860]]);ed('V4','V5','lane',[[545,-3042]]);ed('V5','V2','lane',[[772,-2890]]);
const EK={};                                           // edges by key, filled in buildNet
const PLACES=[                                         // destinations: name, node, position of the building
  ['若葉駅','S2',262,-26],['市役所','A3',596,-338],['ワカバモール','A4',838,-322],['若葉小学校','N4',826,-490],['若葉団地','H1',-118,-712],['若葉寺','H2',96,-868],['中央公園','N3',500,-490],
  ['若葉港','S5',1068,-16],['海水浴場','C1',1085,-505],['岬の灯台','C3',1104,-1012],['青葉峠 展望台','C4',968,-1302],['高速 若葉IC','IC0',600,-812],['道の駅 山手','V2',832,-2782],['山手町役場','V1',440,-2735],['山手温泉','V4',352,-3002],['棚田','V5',705,-3055]];
const COURSE=['S1','S2','A2','A3','A4','N4','N2'];  // 検定コース: waypoints, the goal bay is after the last one
let nav=null;
function sigState(n,e){if(emerg.on&&emerg.nodes.has(n)){return e.kind==='main'?'g':'r';}const t=(time+n.off)%32,ph=n.phase[e.i];return ph===0?(t<12?'g':t<15?'y':'r'):(t<16?'r':t<28?'g':t<31?'y':'r');}

/* ---------- three setup ---------- */
const canvas=$('gl'),app=$('app');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
const TOUCH=window.matchMedia('(hover:none),(pointer:coarse)').matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,TOUCH?1.5:2));
const scene=new THREE.Scene();const SKY=0xd9dad2;scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,80,230);
new THREE.CubeTextureLoader().setPath('tex/').load(['px.jpg','nx.jpg','py.jpg','ny.jpg','pz.jpg','nz.jpg'],t=>{scene.background=t;});
const IMG={};function loadImg(k,u){return new Promise(r=>{const im=new Image();im.onload=()=>{IMG[k]=im;r();};im.onerror=()=>r();im.src=u;});}
const camera=new THREE.PerspectiveCamera(62,1,0.1,420);camera.rotation.order='YXZ';
const hemi=new THREE.HemisphereLight(0xffffff,0x8f96a0,0.72);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,0.38);sun.position.set(80,140,60);scene.add(sun);
function resize(){const w=app.clientWidth,h=app.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);

const FONT='"Zen Kaku Gothic New","Noto Sans JP","Hiragino Sans","Yu Gothic","Noto Sans SC",sans-serif';
function cv(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;}
const L=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o));
const dim=m=>{DIM.push(m);m.userData.base=m.color.clone();return m;};
const decalMat=o=>dim(new THREE.MeshBasicMaterial(Object.assign({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3},o)));
const P=(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:c,shininess:0,specular:0x000000},o));
function ground(mat,w,l,x,y,z,yaw){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),mat);m.rotation.set(-Math.PI/2,0,yaw||0);m.position.set(x,y,z);scene.add(m);return m;}
function box(mat,w,h,l,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),mat);m.position.set(x,y,z);(parent||scene).add(m);return m;}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

let tiltG,stalkL;
let car,carMesh,cabin,bodyMesh,cockpit,wheel,stalk,clusterCv,clusterTex,mapTex,rtRear,rtL,rtR,camRear,camL,camR,rpm=0.8,fcount=0,npcs=[],ped,rail,goalObjs=[];
function beam(mat,a,b,t,parent){const va=new THREE.Vector3(a[0],a[1],a[2]),vb=new THREE.Vector3(b[0],b[1],b[2]),m=new THREE.Mesh(new THREE.BoxGeometry(t,t,va.distanceTo(vb)),mat);m.position.copy(va).add(vb).multiplyScalar(0.5);parent.add(m);m.lookAt(vb);return m;}
