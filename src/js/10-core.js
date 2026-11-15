/* ---------- world constants ---------- */
const S=110,W=3.5,E=70,COLS=4,ROWS=3,SL=W+5.5,ZR=1.5*S,XC=0.5*S,FRONT=2.1,OUT=240;
const MAXX=(COLS-1)*S,MAXZ=(ROWS-1)*S,X0=3*S;
const RW=[3.5,7,3.5],CW=[3.5,3.5,3.5,3.5];            // half widths: rows (中央通り is 4 lanes) / columns
const hw=(axis,idx)=>axis==='h'?RW[idx]:CW[idx];
const ext=(n,axis)=>axis==='h'?CW[n.i]:RW[n.j];       // half size of the junction box along the travel axis
const SLd=(n,axis)=>ext(n,axis)+5.5;                  // stop line distance from the junction centre
const NAMES={'0,0':['緑ヶ丘','Midorigaoka'],'1,0':['桜町','Sakuramachi'],'2,0':['公園前','Koen-mae'],'3,0':['小学校前','Shogakko-mae'],'0,1':['西本町','Nishi-honmachi'],'1,1':['本町','Honmachi'],'2,1':['市役所前','Shiyakusho-mae'],'3,1':['東本町','Higashi-honmachi'],'0,2':['駅西口','Eki-nishiguchi'],'1,2':['駅前','Ekimae'],'2,2':['南町','Minamimachi'],'3,2':['港入口','Minato-iriguchi']};
const BUS_STOPS={'1':[58,2.5*S+8],'-1':[2.5*S-8,52]};
const HW={gate:-125,rampA:-140,portal:-150,gore:-300,mergeEnd:-420,tunA:-900,tunB:-1300,wA:-1500,wB:-1650,exA:-1900,exB:-2050,gate2:-2200,goalA:-2250,goalB:-2292,rampEnd:-2300,end:-2560};
const DIM=[],NIGHT=[];                                 // unlit materials dimmed at night / facade materials that light up
const DV=[[0,-1],[1,0],[0,1],[-1,0]]; // N E S W
const leftOf=d=>DV[(d+3)%4];
const yawFor=d=>Math.atan2(-DV[d][0],-DV[d][1]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TYPES={'0,0':'sig','1,0':'sig','2,0':'sv','3,0':'sv','0,1':'sig','1,1':'sig','2,1':'sig','3,1':'sig','0,2':'sh','1,2':'sig','2,2':'sig','3,2':'sh'};
const nodes={};for(let i=0;i<COLS;i++)for(let j=0;j<ROWS;j++)nodes[i+','+j]={i,j,type:TYPES[i+','+j],off:(i*7+j*13)%32,lamps:{h:[],v:[]},name:NAMES[i+','+j][0]};
const limitOf=(axis,idx)=>axis==='h'?(idx===1?50:40):(idx===3?30:40);
const COURSE=[[0,2],[1,2],[1,1],[2,1],[3,1],[3,0],[2,0],[1,0],[1,1,2]];let CPS=COURSE,nav=null;
const GOAL={x0:S,x1:S+W,z0:40,z1:66};
let time=0;
function sigState(n,axis){if(emerg.on&&n.j===1)return axis==='h'?'g':'r';const t=(time+n.off)%32;if(axis==='h')return t<12?'g':t<15?'y':'r';return t<16?'r':t<28?'g':t<31?'y':'r';}

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
function ground(mat,w,l,x,z,d,y){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),mat);m.rotation.set(-Math.PI/2,0,yawFor(d||0));m.position.set(x,y||0.04,z);scene.add(m);return m;}
function box(mat,w,h,l,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),mat);m.position.set(x,y,z);(parent||scene).add(m);return m;}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

let tiltG,stalkL;
let car,carMesh,cabin,bodyMesh,cockpit,wheel,stalk,clusterCv,clusterTex,mapTex,rtRear,rtL,rtR,camRear,camL,camR,rpm=0.8,fcount=0,npcs=[],ped,rail,goalObjs=[];
function beam(mat,a,b,t,parent){const va=new THREE.Vector3(a[0],a[1],a[2]),vb=new THREE.Vector3(b[0],b[1],b[2]),m=new THREE.Mesh(new THREE.BoxGeometry(t,t,va.distanceTo(vb)),mat);m.position.copy(va).add(vb).multiplyScalar(0.5);parent.add(m);m.lookAt(vb);return m;}
