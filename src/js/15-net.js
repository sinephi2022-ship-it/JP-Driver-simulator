/* ---------- road network: sampled centre lines, heights, spatial hash, routing ---------- */
const CELL=24,HASH=new Map();
function buildNet(){
  for(const k in ND){const n=ND[k];n.y=TH(n.x,n.z);n.off=(Math.abs(n.x*7+n.z*13)|0)%32;}
  // southbound carriageway of the expressway: the northbound line shifted 13 m to the right, reversed
  {const nb=ED.find(e=>e.kind==='hw'),pts=[[nb.a.x,nb.a.z],...nb.mid,[nb.b.x,nb.b.z]],mid=[];
    for(let i=pts.length-2;i>=1;i--){const dx=pts[i+1][0]-pts[i-1][0],dz=pts[i+1][1]-pts[i-1][1],m=Math.hypot(dx,dz);mid.push([pts[i][0]-dz/m*13,pts[i][1]+dx/m*13]);}
    ed('VI','IC0','hw',mid,{flat:true});}
  for(const e of ED)sampleEdge(e);
  addPA();
  for(const e of ED){EK[e.key]=e;for(let i=0;i<e.n-1;i++){const k=Math.floor((e.px[i]+e.px[i+1])/2/CELL)+','+Math.floor((e.pz[i]+e.pz[i+1])/2/CELL);let l=HASH.get(k);if(!l)HASH.set(k,l=[]);l.push(e.i,i);}}
  for(const k in ND){const n=ND[k];n.r=n.ed.length<=2?0:Math.max(...n.ed.map(e=>e.w))+2.2;n.phase={};
    if(n.ctrl==='sig'){const m=n.ed.reduce((a,b)=>b.w>a.w?b:a),ax=away(n,m);for(const e of n.ed){const v=away(n,e);n.phase[e.i]=Math.abs(v[0]*ax[0]+v[1]*ax[1])>0.5?0:1;}}}
}
function sampleEdge(e){
  const pts=[[e.a.x,e.a.z],...e.mid,[e.b.x,e.b.z]],X=[],Z=[];
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||[2*pts[i][0]-pts[i+1][0],2*pts[i][1]-pts[i+1][1]],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||[2*p2[0]-p1[0],2*p2[1]-p1[1]],st=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/3.5));
    for(let k=0;k<st;k++){const t=k/st,t2=t*t,t3=t2*t;for(const c of[0,1])(c?Z:X).push(0.5*(2*p1[c]+(-p0[c]+p2[c])*t+(2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t2+(-p0[c]+3*p1[c]-3*p2[c]+p3[c])*t3));}}
  X.push(e.b.x);Z.push(e.b.z);finishEdge(e,X,Z);
}
function finishEdge(e,X,Z){
  const n=X.length;e.n=n;e.px=Float32Array.from(X);e.pz=Float32Array.from(Z);e.py=new Float32Array(n);e.ps=new Float32Array(n);e.tx=new Float32Array(n);e.tz=new Float32Array(n);e.wl=new Float32Array(n).fill(e.w);e.wr=new Float32Array(n).fill(e.w);
  for(let i=1;i<n;i++)e.ps[i]=e.ps[i-1]+Math.hypot(X[i]-X[i-1],Z[i]-Z[i-1]);e.len=e.ps[n-1];
  for(let i=0;i<n;i++){const a=Math.max(0,i-1),b=Math.min(n-1,i+1),dx=X[b]-X[a],dz=Z[b]-Z[a],m=Math.hypot(dx,dz)||1;e.tx[i]=dx/m;e.tz[i]=dz/m;}
  const ya=e.ya!=null?e.ya:e.a.y,yb=e.yb!=null?e.yb:e.b.y;
  if(e.flat){for(let i=0;i<n;i++)e.py[i]=lerp(ya,yb,sstep(0,1,e.ps[i]/e.len));}
  else{for(let i=0;i<n;i++)e.py[i]=TH(X[i],Z[i]);e.py[0]=ya;e.py[n-1]=yb;for(let q=0;q<(e.kind==='mount'?320:e.kind==='hill'?40:14);q++)for(let i=1;i<n-1;i++)e.py[i]=(e.py[i-1]+2*e.py[i]+e.py[i+1])/4;}
  if(e.kind==='hw'){let s0=null,s1=null;for(let i=0;i<n;i++)if(TH(X[i],Z[i])-e.py[i]>7.5){if(s0==null)s0=e.ps[i];s1=e.ps[i];}if(s0!=null)e.tun=[s0,s1];}
  e.feat=[];
  for(let i=0;i<n-1;i++)if((Z[i]-ZR)*(Z[i+1]-ZR)<0&&e.kind==='city'&&X[i]<1090)e.feat.push({t:'rail',s:e.ps[i]+(e.ps[i+1]-e.ps[i])*(ZR-Z[i])/(Z[i+1]-Z[i])});
}
// parking area on the northbound expressway: deceleration lane → PA → acceleration lane back on to the main line
let PAinfo=null;
function addPA(){const nb=ED.find(e=>e.kind==='hw'),sA=nb.tun[1]+90,off=(s,u)=>{const p=edgePos(nb,s,u);return[p.x,p.z,p.y];};
  const mk=(key,list,o)=>{const e=Object.assign({i:ED.length,a:{id:key+'a',x:list[0][0],z:list[0][1],y:list[0][2],ed:[],r:0},b:{id:key+'b',x:list[list.length-1][0],z:list[list.length-1][1],y:list[list.length-1][2],ed:[],r:0},kind:'ramp',mid:list.slice(1,-1),key,flat:true},KIND.ramp,o);ED.push(e);e.ya=e.a.y;e.yb=e.b.y;sampleEdge(e);return e;};
  const out=[],lot=[],inn=[];for(let s=sA+110;s<=sA+200;s+=30)out.push(off(s,5.4+(s-sA-110)/90*19));for(let s=sA+200;s<=sA+300;s+=25)lot.push(off(s,24.4));for(let s=sA+300;s<=sA+390;s+=30)inn.push(off(s,24.4-(s-sA-300)/90*19));
  const e1=mk('PAin',out,{limit:40}),e2=mk('PAlot',lot,{limit:20,w:4.5}),e3=mk('PAout',inn,{limit:60});
  e1.b=e2.a;e2.b=e3.a;e2.a.ed=[e1,e2];e3.a.ed=[e2,e3];e3.a=e2.b;e2.b.ed=[e2,e3];e1.b.ed=[e1,e2];
  // the main line is one lane wider on the left beside the two ramps (deceleration / acceleration lanes)
  for(let i=0;i<nb.n;i++){const s=nb.ps[i];nb.wl[i]=nb.w+3.8*Math.max(sstep(sA-40,sA,s)*(1-sstep(sA+110,sA+112,s)),sstep(sA+388,sA+390,s)*(1-sstep(sA+560,sA+610,s)));}
  PAinfo={nb,sA,dec:[sA-40,sA+110],acc:[sA+390,sA+610],lot:e2,works:[sA+640,sA+760]};
  for(let i=0;i<nb.n;i++){const s=nb.ps[i];if(s>PAinfo.works[0]&&s<PAinfo.works[1])nb.wl[i]=0;}
}
function away(n,e){const i=e.a===n?0:e.n-1,s=e.a===n?1:-1;return[e.tx[i]*s,e.tz[i]*s];}
function idxAt(e,s){let lo=0,hi=e.n-2;while(lo<hi){const m=(lo+hi+1)>>1;if(e.ps[m]<=s)lo=m;else hi=m-1;}return lo;}
// world position on an edge: s along a→b, u metres to the left of a→b
function edgePos(e,s,u){s=clamp(s,0,e.len);const i=idxAt(e,s),t=(s-e.ps[i])/((e.ps[i+1]-e.ps[i])||1),tx=lerp(e.tx[i],e.tx[i+1],t),tz=lerp(e.tz[i],e.tz[i+1],t);
  return{x:lerp(e.px[i],e.px[i+1],t)+tz*u,z:lerp(e.pz[i],e.pz[i+1],t)-tx*u,y:lerp(e.py[i],e.py[i+1],t),tx,tz};}
const NR={e:null,i:0,s:0,u:0,d:0,y:0,tx:0,tz:0};
function nearest(x,z,out,rad,skip){let be=null,bi=0,bt=0,bd=1e9;const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL),R=rad||1;
  for(let a=-R;a<=R;a++)for(let b=-R;b<=R;b++){const l=HASH.get((cx+a)+','+(cz+b));if(!l)continue;for(let q=0;q<l.length;q+=2){const e=ED[l[q]],i=l[q+1];if(e===skip)continue;
    const x0=e.px[i],z0=e.pz[i],dx=e.px[i+1]-x0,dz=e.pz[i+1]-z0,t=clamp(((x-x0)*dx+(z-z0)*dz)/(dx*dx+dz*dz),0,1),qx=x0+dx*t-x,qz=z0+dz*t-z,d=qx*qx+qz*qz;if(d<bd){bd=d;be=e;bi=i;bt=t;}}}
  if(!be)return null;const o=out||NR,e=be,i=bi,dx=e.px[i+1]-e.px[i],dz=e.pz[i+1]-e.pz[i],m=Math.hypot(dx,dz);
  o.e=e;o.i=i;o.d=Math.sqrt(bd);o.tx=dx/m;o.tz=dz/m;o.s=e.ps[i]+m*bt;o.y=lerp(e.py[i],e.py[i+1],bt);o.u=((x-e.px[i])*dz-(z-e.pz[i])*dx)/m;return o;}
function onRoad(x,z){const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=HASH.get((cx+a)+','+(cz+b));if(!l)continue;for(let q=0;q<l.length;q+=2){const e=ED[l[q]],i=l[q+1];
    const x0=e.px[i],z0=e.pz[i],dx=e.px[i+1]-x0,dz=e.pz[i+1]-z0,l2=dx*dx+dz*dz,tr=((x-x0)*dx+(z-z0)*dz)/l2;if(tr<-0.3||tr>1.3)continue;const t=clamp(tr,0,1),m=Math.sqrt(l2),u=((x-x0)*dz-(z-z0)*dx)/m,al=Math.abs(tr-t)*m;
    if(al<0.8&&u<=e.wl[i]-0.75&&u>=-(e.wr[i]-0.75))return true;}}
  for(const k in ND){const n=ND[k];if(n.r&&Math.abs(x-n.x)<n.r+3.7&&Math.abs(z-n.z)<n.r+3.7&&Math.hypot(x-n.x,z-n.z)<n.r+3.6)return true;}return false;}
// shortest route over directed edges (no U-turns): returns [[edge,dir],...] from the far end of (e0,d0) to node `to`
function findRoute(e0,d0,to){const dist=new Map(),prev=new Map(),key=(e,d)=>e.i*2+(d>0?1:0),open=[[0,e0,d0]];dist.set(key(e0,d0),0);let goal=null;
  while(open.length){let bi=0;for(let q=1;q<open.length;q++)if(open[q][0]<open[bi][0])bi=q;const [c,e,d]=open.splice(bi,1)[0],n=d>0?e.b:e.a;if(c>dist.get(key(e,d)))continue;if(n===to){goal=[e,d];break;}
    for(const f of n.ed){if(f===e&&n.ed.length>1)continue;const fd=f.a===n?1:-1;if(f.oneway&&fd<0)continue;if(f.a===f.b)continue;const nc=c+f.len/f.limit+(f.kind==='lane'||f.kind==='narrow1'?3:0),k=key(f,fd);if(!(dist.get(k)<=nc)){dist.set(k,nc);prev.set(k,[e,d]);open.push([nc,f,fd]);}}}
  if(!goal)return null;const out=[];let cur=goal;while(cur&&!(cur[0]===e0&&cur[1]===d0)){out.unshift(cur);cur=prev.get(key(cur[0],cur[1]));}return out;}
// turn made when going from edge e (arriving at node n) to edge f: 'L' | 'R' | 'S' | 'U'
function turnClass(n,e,f){const a=away(n,e),b=away(n,f),ix=-a[0],iz=-a[1],dot=ix*b[0]+iz*b[1],cr=ix*b[1]-iz*b[0];return dot<-0.75?'U':cr>0.5?'R':cr<-0.5?'L':'S';}
