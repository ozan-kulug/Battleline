/* world/terrain.js — Harita üretimi ve arazi: ızgara, yükselti, nehir, yollar, binalar, siper hatları; arazinin tampon tuvale çizilmesi; bina ve siper sorguları. */
import {state} from '../state.js';
import {mbctx,tc,tctx} from '../canvas.js';
import {CROSS,CS,GH,GW,H,OBJL,PI,RIV,RL,T,TAU,W,ZK,riverX} from '../config.js';
import {R,clamp,gauss,rng,segInfo} from '../utils/helpers.js';

const grid=new Uint8Array(GW*GH);
const bgrid=new Int16Array(GW*GH);
const elev=new Float32Array(GW*GH);
const elevAt=(x,y)=>{const cx=x/CS|0,cy=y/CS|0;return(cx<0||cy<0||cx>=GW||cy>=GH)?0:elev[cy*GW+cx]};
/* siper dizini: 64 px hücreler; siper listesi değişince yeniden kurulur */
const CVC=64;
const CVW=Math.ceil(W/CVC)+2;
let cvIdx=null;
let cvRef=null;
let cvLen=-1;
function coversNear(x,y){if(cvRef!==state.covers||cvLen!==state.covers.length){cvRef=state.covers;cvLen=state.covers.length;cvIdx=new Map();
    for(const c of state.covers){const pad=16,x0=(c.r!=null?c.x-c.r:Math.min(c.x1,c.x2))-pad,x1=(c.r!=null?c.x+c.r:Math.max(c.x1,c.x2))+pad,y0=(c.r!=null?c.y-c.r:Math.min(c.y1,c.y2))-pad,y1=(c.r!=null?c.y+c.r:Math.max(c.y1,c.y2))+pad;
      for(let cy=Math.floor(y0/CVC);cy<=Math.floor(y1/CVC);cy++)for(let cx=Math.floor(x0/CVC);cx<=Math.floor(x1/CVC);cx++){const k=(cy+1)*CVW+cx+1,l=cvIdx.get(k);if(l)l.push(c);else cvIdx.set(k,[c])}}}
  return cvIdx.get((Math.floor(y/CVC)+1)*CVW+Math.floor(x/CVC)+1)||[]}
const cellAt=(x,y)=>{const cx=x/CS|0,cy=y/CS|0;return(cx<0||cy<0||cx>=GW||cy>=GH)?0:grid[cy*GW+cx]};
let OBJ0=[];
let ROADS=[];
let STREETS=[];
let hills=[];
let ridges=[];
let swamps=[];
function buildObjDefs(){const a=[];for(const o of OBJL){a.push({...o},{k:o.k,x:W-o.x,y:H-o.y})}
  a.push({k:'city',x:W/2,y:H/2},{k:'bridge',x:riverX(620),y:620},{k:'bridge',x:riverX(2380),y:2380});
  a.sort((p,q)=>p.x-q.x||p.y-q.y);a.forEach((o,i)=>{o.n=String.fromCharCode(65+i);o.r=ZK[o.k].r});return a}
/* Bitişik siper parçalarını tek bir hat (zincir) olarak birleştir: askerler parçalar arasında kesintisiz dağıtılır */
function buildChains(){const lin=state.covers.filter(c=>c.r==null),near=(ax,ay,bx,by)=>Math.abs(ax-bx)<2&&Math.abs(ay-by)<2,used=new Set();state.chains=[];
  for(const c of lin){if(used.has(c))continue;const comp=[c];used.add(c);
    for(let i=0;i<comp.length;i++){const a=comp[i];for(const b of lin){if(used.has(b)||b.t!==a.t)continue;
      if(near(a.x1,a.y1,b.x1,b.y1)||near(a.x1,a.y1,b.x2,b.y2)||near(a.x2,a.y2,b.x1,b.y1)||near(a.x2,a.y2,b.x2,b.y2)){used.add(b);comp.push(b)}}}
    const deg=(x,y)=>comp.filter(s=>near(s.x1,s.y1,x,y)||near(s.x2,s.y2,x,y)).length;
    let st=comp.find(s=>deg(s.x1,s.y1)===1),cx,cy;if(st){cx=st.x1;cy=st.y1}else{st=comp.find(s=>deg(s.x2,s.y2)===1)||comp[0];cx=st.x2;cy=st.y2}
    const segs=[],left=new Set(comp);
    while(left.size){let nx=null;for(const s of left){if(near(s.x1,s.y1,cx,cy)){nx={c:s,ax:s.x1,ay:s.y1,bx:s.x2,by:s.y2};break}if(near(s.x2,s.y2,cx,cy)){nx={c:s,ax:s.x2,ay:s.y2,bx:s.x1,by:s.y1};break}}
      if(!nx){const s=left.values().next().value;nx={c:s,ax:s.x1,ay:s.y1,bx:s.x2,by:s.y2}}left.delete(nx.c);segs.push(nx);cx=nx.bx;cy=nx.by}
    let acc=0;for(const s of segs){s.s0=acc;s.L=Math.hypot(s.bx-s.ax,s.by-s.ay);acc+=s.L}
    const ch={t:c.t,segs,len:acc};for(const s of segs)s.c.ch=ch;state.chains.push(ch)}}
function chainAt(ch,s){s=clamp(s,0,ch.len);for(const g of ch.segs)if(s<=g.s0+g.L+1e-6){const f=g.L?(s-g.s0)/g.L:0;return{x:g.ax+(g.bx-g.ax)*f,y:g.ay+(g.by-g.ay)*f,g}}
  const g=ch.segs[ch.segs.length-1];return{x:g.bx,y:g.by,g}}
function chainProj(ch,x,y){let best=0,bd=1e9;for(const g of ch.segs){const vx=g.bx-g.ax,vy=g.by-g.ay,L2=vx*vx+vy*vy||1,f=clamp(((x-g.ax)*vx+(y-g.ay)*vy)/L2,0,1),px=g.ax+vx*f,py=g.ay+vy*f,d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best=g.s0+f*g.L}}return{s:best,d:bd}}
function genTerrain(){
  const r=rng(1917);grid.fill(0);elev.fill(0);state.fields=[];state.buildings=[];state.covers=[];hills=[];swamps=[];
  const markC=(x,y,rad,t,skip)=>{for(let cy=Math.max(0,(y-rad)/CS|0);cy<=Math.min(GH-1,(y+rad)/CS|0);cy++)for(let cx=Math.max(0,(x-rad)/CS|0);cx<=Math.min(GW-1,(x+rad)/CS|0);cx++){const px=cx*CS+8,py=cy*CS+8;if((px-x)**2+(py-y)**2<=rad*rad){const i=cy*GW+cx;if(skip&&skip(grid[i]))continue;grid[i]=t}}};
  const markR=(x,y,w,h,t)=>{for(let cy=Math.max(0,y/CS|0);cy<Math.min(GH,(y+h)/CS|0);cy++)for(let cx=Math.max(0,x/CS|0);cx<Math.min(GW,(x+w)/CS|0);cx++)grid[cy*GW+cx]=t};
  const leftOK=(x,y)=>x<riverX(y)-170;
  // tepeler (yükselti)
  for(const [x,y,rad,h] of [[1700,1980,340,1.6],[620,1100,270,1],[1480,1220,230,.9],[1950,640,250,1.1],[420,2000,220,.8]])hills.push({x,y,r:rad,h},{x:W-x,y:H-y,r:rad,h});
  // sırtlar (h>0) ve vadiler (h<0): uzun yer şekilleri. Tepe ve sırt yamaçları düzdür (koni): tepeden etek görülür; vadiler içbükeydir [x1,y1,x2,y2,yarı genişlik,yükseklik]
  ridges=[];for(const [x1,y1,x2,y2,w,h] of [[880,300,1520,430,150,.9],[1250,2480,1900,2720,160,1],[1990,1230,2010,1760,120,.7],[260,1330,640,1520,110,.55],[720,690,1260,930,130,-.7],[880,1880,1400,2110,120,-.6],[300,2550,900,2850,130,-.45]])
    ridges.push({x1,y1,x2,y2,w,h},{x1:W-x1,y1:H-y1,x2:W-x2,y2:H-y2,w,h});
  for(let cy=0;cy<GH;cy++)for(let cx=0;cx<GW;cx++){const px=cx*CS+8,py=cy*CS+8;let e=0,lo=0;for(const hl of hills){const d=Math.hypot(px-hl.x,py-hl.y)/hl.r;if(d<1){const v=hl.h*(1-d);if(v>e)e=v}}
    for(const rg of ridges){if(px<Math.min(rg.x1,rg.x2)-rg.w||px>Math.max(rg.x1,rg.x2)+rg.w||py<Math.min(rg.y1,rg.y2)-rg.w||py>Math.max(rg.y1,rg.y2)+rg.w)continue;const d=segInfo(rg,px,py).d/rg.w;if(d<1){const v=rg.h>0?rg.h*(1-d):rg.h*(1-d*d);if(v>e)e=v;if(v<lo)lo=v}}
    // nehir vadisi: kıyılar nehre doğru alçalır
    const rd=Math.abs(px-riverX(py))/300;if(rd<1){const v=-.4*(1-rd*rd);if(v<lo)lo=v}
    elev[cy*GW+cx]=e+lo}
  // tarlalar
  for(let i=0;i<16;i++){const w=170+r()*230,h=120+r()*170,x=260+r()*1700,y=120+r()*2700;if(!leftOK(x+w,y)||!leftOK(x+w,y+h))continue;state.fields.push([x,y,w,h,r()<.5],[W-x-w,H-y-h,w,h,r()<.5]);markR(x,y,w,h,T.FIELD);markR(W-x-w,H-y-h,w,h,T.FIELD)}
  // ormanlar
  const blobs=[[1250,1350],[1900,1500],[800,1850],[1450,2650],[500,450],[2000,1150],[1050,950],[1550,2200]];
  for(let i=0;i<20;i++)blobs.push([320+r()*1800,140+r()*2720]);
  for(const [bx,by] of blobs){const n=5+r()*8|0;for(let k=0;k<n;k++){const x=bx+(r()-.5)*230,y=by+(r()-.5)*200,rad=45+r()*75;markC(x,y,rad,T.FOREST);markC(W-x,H-y,rad,T.FOREST)}}
  // bataklıklar: nehir kıyısında
  for(let i=0;i<7;i++){const y=150+r()*2700,sd=r()<.5?-1:1,x=riverX(y)+sd*(RIV.hw+70+r()*160),rad=70+r()*90;swamps.push([x,y,rad],[W-x,H-y,rad]);markC(x,y,rad,T.SWAMP);markC(W-x,H-y,rad,T.SWAMP)}
  for(const c of CROSS)if(c.t==='ford')for(const sd of [-1,1]){const x=riverX(c.y)+sd*(RIV.hw+80);swamps.push([x,c.y,90]);markC(x,c.y,90,T.SWAMP)}
  // köyler ve şehir
  const towns=[[520,1080,200,160],[1600,2650,220,150],[1900,950,180,150]];
  for(const [x,y,w,h] of towns){markR(x-w/2,y-h/2,w,h,T.TOWN);markR(W-x-w/2,H-y-h/2,w,h,T.TOWN)}
  const CW=980,CH=760;markR(W/2-CW/2,H/2-CH/2,CW,CH,T.TOWN);
  OBJ0=buildObjDefs();
  for(const o of OBJ0){if(o.k==='factory')markR(o.x-180,o.y-140,360,280,T.CONC);else if(o.k==='depot')markR(o.x-140,o.y-110,280,220,T.CONC);
    else if(o.k==='airfield'){const sg=o.x<W/2?1:-1;markR(o.x-420,o.y-40,840,80,T.CONC);markR(o.x-140,o.y+(sg>0?40:-170),280,130,T.CONC)}
    else if(o.k==='hill')markC(o.x,o.y,120,T.GRASS,t=>t!==T.FOREST);
    markC(o.x,o.y,70,T.GRASS,t=>t!==T.FOREST)}
  // nehir ve geçitler
  for(let y=0;y<H;y+=4){const x0=riverX(y);for(let x=x0-RIV.hw;x<=x0+RIV.hw;x+=4){const cx=x/CS|0,cy=y/CS|0;if(cx>=0&&cx<GW&&cy>=0&&cy<GH)grid[cy*GW+cx]=T.WATER}}
  for(const c of CROSS)if(c.t==='ford')for(let y=c.y-45;y<=c.y+45;y+=4){const x0=riverX(y);for(let x=x0-RIV.hw-6;x<=x0+RIV.hw+6;x+=4){const cx=x/CS|0,cy=y/CS|0;if(grid[cy*GW+cx]===T.WATER)grid[cy*GW+cx]=T.FORD}}
  // yollar, köprüler, şehir sokakları
  ROADS=[];for(const pl of RL)ROADS.push(pl,pl.map(([x,y])=>[W-x,H-y]));
  for(const c of CROSS)if(c.t==='bridge'){const x0=riverX(c.y);ROADS.push([[x0-RIV.hw-40,c.y],[x0+RIV.hw+40,c.y]])}
  STREETS=[];const cx0=W/2-CW/2,cy0=H/2-CH/2;for(let x=cx0+70;x<cx0+CW;x+=120)STREETS.push([[x,cy0],[x,cy0+CH]]);for(let y=cy0+70;y<cy0+CH;y+=120)STREETS.push([[cx0,y],[cx0+CW,y]]);
  const markLine=(pl,rad,t,skipWater)=>{for(let k=0;k<pl.length-1;k++){const [ax,ay]=pl[k],[bx,by]=pl[k+1],L=Math.hypot(bx-ax,by-ay);for(let d=0;d<=L;d+=6)markC(ax+(bx-ax)*d/L,ay+(by-ay)*d/L,rad,t,skipWater?(q=>q===T.WATER||q===T.FORD):null)}};
  for(const pl of STREETS)markLine(pl,11,T.ROAD,true);
  for(const pl of ROADS)markLine(pl,13,T.ROAD,false);
  for(let cy=0;cy<GH;cy++)for(let cx=0;cx<GW;cx++){const x=cx*CS;if((x<200||x>W-216)&&grid[cy*GW+cx]===T.FOREST)grid[cy*GW+cx]=T.GRASS}
  // tahkimat
  const add=(t,a,b)=>{state.covers.push({t,x1:a[0],y1:a[1],x2:b[0],y2:b[1]});state.covers.push({t,x1:W-a[0],y1:H-a[1],x2:W-b[0],y2:H-b[1]})};
  const poly=(t,p)=>{for(let i=0;i<p.length-1;i++)add(t,p[i],p[i+1])};
  const arc=(cx,cy,rad,a0,a1,n,t='sandbag')=>{const p=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;p.push([cx+Math.cos(a)*rad,cy+Math.sin(a)*rad])}poly(t,p)};
  const trz=(cx,cy,rad,a0,a1,n)=>{const p=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n,rr=rad+(i%2?14:-14);p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}poly('trench',p)};
  trz(1700,1980,210,-1.1,1.1,7);trz(1150,1650,175,-1,1,6);trz(1350,620,230,-.9,.9,7);trz(780,2400,470,-.35,.35,4);trz(620,1100,170,-1,1,5);
  for(const y of [620,1500]){const x0=riverX(y);arc(x0-RIV.hw-80,y,46,-1.2,1.2,3)}
  {const x0=riverX(620);arc(x0+RIV.hw+80,620,46,PI-1.2,PI+1.2,3)}
  for(const o of OBJL)arc(o.x+(o.k==='airfield'?450:o.k==='factory'?200:o.k==='depot'?160:120),o.y,52,-1.1,1.1,3);
  {const x=1150,y=1650;poly('wall',[[x-150,y-122],[x+40,y-122]]);poly('wall',[[x-150,y+122],[x+40,y+122]]);poly('wall',[[x-152,y-110],[x-152,y+10]])}
  poly('wall',[[W/2-470,H/2-200],[W/2-470,H/2-60]]);poly('wall',[[W/2-470,H/2+60],[W/2-470,H/2+200]]);poly('wall',[[W/2-330,H/2-370],[W/2-210,H/2-370]]);
  for(let i=0;i<state.fields.length;i+=2){const [x,y,w,h]=state.fields[i];if(r()<.8){const e=r()*4|0,q=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];add('hedge',q[e],q[(e+1)%4])}}
  state.covers=state.covers.filter(c=>{const L=Math.hypot(c.x2-c.x1,c.y2-c.y1);for(let d=0;d<=L;d+=8){const t=cellAt(c.x1+(c.x2-c.x1)*d/L,c.y1+(c.y2-c.y1)*d/L);if(t===T.WATER||t===T.FORD)return false}return true});
  for(const c of state.covers){const L=Math.hypot(c.x2-c.x1,c.y2-c.y1);for(let d=0;d<=L;d+=8)markC(c.x1+(c.x2-c.x1)*d/L,c.y1+(c.y2-c.y1)*d/L,16,T.GRASS,t=>t!==T.FOREST)}
  for(const c of state.covers)if(c.r==null)c.hp=({sandbag:260,wall:380,hedge:120})[c.t]??Infinity;
  buildChains();
  // binalar
  const free=(x,y,w,h)=>{for(const b of state.buildings)if(x<b.x+b.w+8&&x+w+8>b.x&&y<b.y+b.h+8&&y+h+8>b.y)return false;for(const c of state.covers)if(segInfo(c,x+w/2,y+h/2).d<Math.max(w,h)/2+12)return false;return true};
  const B=(x,y,w,h,sh,c)=>{if(free(x,y,w,h))state.buildings.push({x,y,w,h,sh,c:c||`hsl(${12+r()*14},${30+r()*14}%,${32+r()*8}%)`})};
  const BM=(x,y,w,h,sh,c)=>{B(x,y,w,h,sh,c);B(W-x-w,H-y-h,w,h,sh,c)};
  {const x=1350,y=620;BM(x-150,y-115,120,70,'ind');BM(x+10,y-118,130,60,'ind');BM(x-140,y+10,90,80,'ind');BM(x+30,y+25,115,70,'ind')}
  {const x=1150,y=1650;BM(x-125,y-95,40,40,'tank');BM(x-75,y-95,40,40,'tank');BM(x-125,y-45,40,40,'tank');BM(x-10,y-90,120,45,'ware');BM(x-10,y+5,120,45,'ware')}
  {const x=780,y=2400;BM(x-120,y+65,72,55,'hangar');BM(x-30,y+65,72,55,'hangar');BM(x+60,y+65,72,55,'hangar');BM(x+150,y+70,24,24,'house','hsl(40,6%,50%)')}
  {const x=1700,y=1980;BM(x-16,y-16,32,32,'dome')}
  const fillTown=(tx,ty,tw,th,n,mir)=>{for(let a=0;a<n;a++){const bw=24+r()*36,bh=20+r()*28,x=tx-tw/2+r()*(tw-bw),y=ty-th/2+r()*(th-bh);
    let ok=true;for(const [cx,cy] of [[x,y],[x+bw,y],[x,y+bh],[x+bw,y+bh],[x+bw/2,y+bh/2]])if(cellAt(cx,cy)!==T.TOWN){ok=false;break}
    if(ok){if(mir)BM(x,y,bw,bh,'house',r()<.6?null:`hsl(40,6%,${42+r()*10}%)`);else B(x,y,bw,bh,'house',r()<.55?null:`hsl(40,6%,${42+r()*10}%)`)}}};
  for(const [x,y,w,h] of towns)fillTown(x,y,w,h,160,true);
  fillTown(W/2,H/2,CW,CH,1300,false);
  state.buildings.forEach((b,i)=>{b.i=i;b.max=b.hp=Math.round(b.w*b.h*.35);b.cap=b.sh==='tank'?0:b.sh==='dome'?2:clamp(Math.floor(b.w*b.h/180),2,8);b.occ=[];b.dead=false});
  bgrid.fill(-1);bcell.clear();for(const b of state.buildings)for(let cy=b.y/CS|0;cy<=(b.y+b.h)/CS|0;cy++)for(let cx=b.x/CS|0;cx<=(b.x+b.w)/CS|0;cx++){const i=cy*GW+cx;bgrid[i]=b.i;const l=bcell.get(i);if(l)l.push(b);else bcell.set(i,[b])}
  drawTerrain(r);
}
function lineOn(g,c){g.beginPath();g.moveTo(c.x1,c.y1);g.lineTo(c.x2,c.y2);g.stroke()}
function drawCover(c){const g=tctx;g.save();g.lineCap='round';
  if(c.t==='trench'){g.strokeStyle='rgba(125,104,62,.55)';g.lineWidth=20;lineOn(g,c);g.strokeStyle='#2e2618';g.lineWidth=11;lineOn(g,c);g.strokeStyle='#1d180f';g.lineWidth=5;lineOn(g,c)}
  else if(c.t==='sandbag'){g.translate(2,2);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=9;lineOn(g,c);g.translate(-2,-2);g.strokeStyle='#a5966b';g.lineWidth=7;lineOn(g,c);
    const L=Math.hypot(c.x2-c.x1,c.y2-c.y1),ux=(c.x2-c.x1)/L,uy=(c.y2-c.y1)/L;g.strokeStyle='#6f6342';g.lineWidth=1;g.beginPath();for(let d=4;d<L;d+=7){const x=c.x1+ux*d,y=c.y1+uy*d;g.moveTo(x-uy*3.5,y+ux*3.5);g.lineTo(x+uy*3.5,y-ux*3.5)}g.stroke()}
  else if(c.t==='wall'){g.translate(2,2);g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=6;lineOn(g,c);g.translate(-2,-2);g.strokeStyle='#8e8b80';g.lineWidth=5;lineOn(g,c);g.strokeStyle='#64615a';g.lineWidth=1;g.setLineDash([4,3]);lineOn(g,c)}
  else if(c.t==='hedge'){const L=Math.hypot(c.x2-c.x1,c.y2-c.y1);for(let pass=0;pass<2;pass++)for(let d=0;d<=L;d+=6){const x=c.x1+(c.x2-c.x1)*d/L,y=c.y1+(c.y2-c.y1)*d/L,rr=4.5+((d*7)%3);
    g.fillStyle=pass?`hsl(${95+(d*13)%20},30%,${20+(d*5)%6}%)`:'rgba(0,0,0,.3)';g.beginPath();g.arc(x+(pass?0:2.5),y+(pass?0:2.5),rr,0,TAU);g.fill()}}
  else if(c.t==='fox'){g.fillStyle='#8a7a55';g.beginPath();g.arc(c.x,c.y,c.r+4,0,TAU);g.fill();g.fillStyle='#2a2216';g.beginPath();g.arc(c.x,c.y,c.r,0,TAU);g.fill()}
  g.restore()}
function drawRubble(b){const g=tctx;g.fillStyle='#5a544a';g.fillRect(b.x-3,b.y-3,b.w+6,b.h+6);
  for(let i=0;i<b.w*b.h/40;i++){g.fillStyle=R()<.5?'#6e675b':'#403b33';g.fillRect(b.x-4+R()*(b.w+8),b.y-4+R()*(b.h+8),2+R()*5,2+R()*4)}
  scorch(b.x+b.w/2,b.y+b.h/2,Math.max(b.w,b.h)*.7)}
function drawBld(b){const g=tctx,cx=b.x+b.w/2,cy=b.y+b.h/2;
  if(b.sh==='tank'||b.sh==='dome'){const rr=b.w/2;g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.arc(cx+5,cy+5,rr,0,TAU);g.fill();g.fillStyle=b.sh==='tank'?'#b6b5ab':'#dcdcd2';g.beginPath();g.arc(cx,cy,rr,0,TAU);g.fill();
    g.strokeStyle='#7e7d75';g.lineWidth=1.5;g.beginPath();g.arc(cx,cy,rr-5,0,TAU);g.stroke();if(b.sh==='dome'){g.strokeStyle='#8a8a80';g.beginPath();g.moveTo(cx-rr,cy);g.lineTo(cx+rr,cy);g.stroke()}return}
  g.fillStyle='rgba(0,0,0,.4)';g.fillRect(b.x+5,b.y+5,b.w,b.h);g.fillStyle=b.sh==='ind'?'#7c7f7b':b.sh==='ware'?'#968e79':b.sh==='hangar'?'#6d7367':b.c;g.fillRect(b.x,b.y,b.w,b.h);
  g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1.2;g.strokeRect(b.x+.5,b.y+.5,b.w-1,b.h-1);g.strokeStyle='rgba(255,255,255,.14)';g.beginPath();
  const lng=b.w>b.h;
  if(b.sh==='ind'||b.sh==='ware'||b.sh==='hangar'){const step=b.sh==='hangar'?7:12;if(lng)for(let x=b.x+step;x<b.x+b.w;x+=step){g.moveTo(x,b.y+2);g.lineTo(x,b.y+b.h-2)}else for(let y=b.y+step;y<b.y+b.h;y+=step){g.moveTo(b.x+2,y);g.lineTo(b.x+b.w-2,y)}}
  else if(lng){g.moveTo(b.x+3,cy);g.lineTo(b.x+b.w-3,cy)}else{g.moveTo(cx,b.y+3);g.lineTo(cx,b.y+b.h-3)}
  g.stroke();
  if(b.sh==='ind'){g.fillStyle='#3a3a37';g.beginPath();g.arc(b.x+b.w-9,b.y+9,6,0,TAU);g.fill();g.fillStyle='#22221f';g.beginPath();g.arc(b.x+b.w-9,b.y+9,3,0,TAU);g.fill()}}
function drawTerrain(r){
  const sm=document.createElement('canvas');sm.width=GW;sm.height=GH;const sc=sm.getContext('2d');const id=sc.createImageData(GW,GH);
  const hsl=(h,s,l)=>{s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return[f(0)*255,f(8)*255,f(4)*255]};
  for(let i=0;i<GW*GH;i++){const t=grid[i],cx=i%GW,cy=i/GW|0,nw=cx>0&&cy>0?elev[i-GW-1]:elev[i],se=cx<GW-1&&cy<GH-1?elev[i+GW+1]:elev[i],e=elev[i]*4+(nw-se)*26;let c;
    if(t===T.FOREST)c=hsl(98,24,17+r()*2+e);else if(t===T.FIELD)c=hsl(47,30,39+r()*3+e);else if(t===T.TOWN)c=hsl(68,10,33+r()*2);else if(t===T.WATER)c=hsl(198,26,27);else if(t===T.FORD)c=hsl(190,18,36);
    else if(t===T.SWAMP)c=hsl(82,20,22+r()*3);else if(t===T.CONC)c=hsl(60,5,43+r()*2);else c=hsl(78,23,29+r()*3+e);
    id.data[i*4]=c[0];id.data[i*4+1]=c[1];id.data[i*4+2]=c[2];id.data[i*4+3]=255}
  sc.putImageData(id,0,0);tctx.imageSmoothingEnabled=true;tctx.imageSmoothingQuality='high';tctx.drawImage(sm,0,0,W,H);
  for(let i=0;i<60000;i++){tctx.fillStyle=r()<.5?'rgba(0,0,0,.07)':'rgba(255,255,220,.04)';tctx.fillRect(r()*W,r()*H,2+r()*3,2+r()*3)}
  // tepe parlaması ve tüm yer şekilleri için eş yükselti çizgileri (tepeler kahverengi, vadiler koyu kesik çizgi)
  for(const hl of hills){const g=tctx.createRadialGradient(hl.x-hl.r*.3,hl.y-hl.r*.3,0,hl.x,hl.y,hl.r);g.addColorStop(0,'rgba(255,250,215,.10)');g.addColorStop(1,'rgba(255,250,215,0)');tctx.fillStyle=g;tctx.beginPath();tctx.arc(hl.x,hl.y,hl.r,0,TAU);tctx.fill()}
  for(const [lv,col,dash] of [[.3,'rgba(70,58,32,.3)',0],[.7,'rgba(70,58,32,.34)',0],[1.1,'rgba(70,58,32,.38)',0],[-.28,'rgba(20,36,40,.38)',1],[-.55,'rgba(20,36,40,.45)',1]]){
    tctx.strokeStyle=col;tctx.lineWidth=1.6;tctx.setLineDash(dash?[6,5]:[]);tctx.beginPath();contour(lv,(ax,ay,bx,by)=>{tctx.moveTo(ax,ay);tctx.lineTo(bx,by)});tctx.stroke()}
  tctx.setLineDash([]);
  for(const [x,y,w,h,v] of state.fields){tctx.save();tctx.beginPath();tctx.rect(x,y,w,h);tctx.clip();tctx.strokeStyle='rgba(70,52,18,.22)';tctx.lineWidth=2;tctx.beginPath();
    if(v)for(let k=x;k<x+w;k+=7){tctx.moveTo(k,y);tctx.lineTo(k,y+h)}else for(let k=y;k<y+h;k+=7){tctx.moveTo(x,k);tctx.lineTo(x+w,k)}tctx.stroke();tctx.restore()}
  // bataklık: su birikintileri ve sazlık
  for(const [sx,sy,rad] of swamps){for(let i=0;i<rad/6;i++){const a=r()*TAU,d=r()*rad*.85,x=sx+Math.cos(a)*d,y=sy+Math.sin(a)*d;if(cellAt(x,y)!==T.SWAMP)continue;
    tctx.fillStyle='rgba(38,58,60,.55)';tctx.beginPath();tctx.ellipse(x,y,5+r()*12,3+r()*6,r()*PI,0,TAU);tctx.fill()}
    tctx.strokeStyle='rgba(150,150,90,.35)';tctx.lineWidth=1;tctx.beginPath();for(let i=0;i<rad;i++){const a=r()*TAU,d=r()*rad,x=sx+Math.cos(a)*d,y=sy+Math.sin(a)*d;if(cellAt(x,y)!==T.SWAMP)continue;tctx.moveTo(x,y);tctx.lineTo(x+gauss()*2,y-4-r()*4)}tctx.stroke()}
  let g=tctx.createLinearGradient(0,0,220,0);g.addColorStop(0,'rgba(98,166,230,.16)');g.addColorStop(1,'rgba(98,166,230,0)');tctx.fillStyle=g;tctx.fillRect(0,0,220,H);
  g=tctx.createLinearGradient(W,0,W-220,0);g.addColorStop(0,'rgba(226,88,75,.16)');g.addColorStop(1,'rgba(226,88,75,0)');tctx.fillStyle=g;tctx.fillRect(W-220,0,220,H);
  tctx.lineJoin=tctx.lineCap='round';
  // şehir sokakları (asfalt)
  for(const [w,c] of [[24,'rgba(30,30,28,.5)'],[20,'#57564f'],[2,'rgba(220,215,190,.25)']]){tctx.strokeStyle=c;tctx.lineWidth=w;if(w===2)tctx.setLineDash([10,12]);for(const pl of STREETS){tctx.beginPath();pl.forEach(([x,y],i)=>i?tctx.lineTo(x,y):tctx.moveTo(x,y));tctx.stroke()}tctx.setLineDash([])}
  // nehir
  const bank=sd=>{const p=[];for(let y=-20;y<=H+20;y+=10)p.push([riverX(y)+sd*RIV.hw,y]);return p};
  const L=bank(-1),Rb=bank(1);tctx.beginPath();L.forEach(([x,y],i)=>i?tctx.lineTo(x,y):tctx.moveTo(x,y));for(let i=Rb.length-1;i>=0;i--)tctx.lineTo(Rb[i][0],Rb[i][1]);tctx.closePath();
  tctx.fillStyle='#3a5560';tctx.fill();tctx.strokeStyle='rgba(66,54,32,.75)';tctx.lineWidth=7;tctx.stroke();
  tctx.strokeStyle='rgba(200,225,230,.10)';tctx.lineWidth=1.5;tctx.beginPath();for(let i=0;i<700;i++){const y=r()*H,x=riverX(y)+(r()-.5)*RIV.hw*1.6;tctx.moveTo(x,y);tctx.lineTo(x+gauss()*3,y+8+r()*10)}tctx.stroke();
  for(const c of CROSS)if(c.t==='ford'){tctx.fillStyle='rgba(165,185,170,.35)';tctx.beginPath();for(let y=c.y-45;y<=c.y+45;y+=6)tctx.lineTo(riverX(y)-RIV.hw-2,y);for(let y=c.y+45;y>=c.y-45;y-=6)tctx.lineTo(riverX(y)+RIV.hw+2,y);tctx.closePath();tctx.fill();
    for(let i=0;i<60;i++){const y=c.y+(r()-.5)*86,x=riverX(y)+(r()-.5)*RIV.hw*1.8;tctx.fillStyle='rgba(120,115,95,.7)';tctx.beginPath();tctx.arc(x,y,1.5+r()*2.5,0,TAU);tctx.fill()}}
  // yollar
  for(const [w,c] of [[26,'rgba(40,32,18,.45)'],[19,'#93845f'],[5,'rgba(70,58,36,.25)']]){tctx.strokeStyle=c;tctx.lineWidth=w;for(const pl of ROADS){tctx.beginPath();pl.forEach(([x,y],i)=>i?tctx.lineTo(x,y):tctx.moveTo(x,y));tctx.stroke()}}
  // köprüler
  for(const c of CROSS)if(c.t==='bridge'){const x0=riverX(c.y),x1=x0-RIV.hw-24,x2=x0+RIV.hw+24;tctx.fillStyle='rgba(0,0,0,.35)';tctx.fillRect(x1+4,c.y-14,x2-x1,30);
    tctx.fillStyle='#7a7262';tctx.fillRect(x1,c.y-15,x2-x1,30);tctx.strokeStyle='#3f3a30';tctx.lineWidth=3;tctx.beginPath();tctx.moveTo(x1,c.y-15);tctx.lineTo(x2,c.y-15);tctx.moveTo(x1,c.y+15);tctx.lineTo(x2,c.y+15);tctx.stroke();
    tctx.strokeStyle='rgba(0,0,0,.18)';tctx.lineWidth=1;tctx.beginPath();for(let x=x1+6;x<x2;x+=8){tctx.moveTo(x,c.y-13);tctx.lineTo(x,c.y+13)}tctx.stroke()}
  // havaalanı pisti
  for(const o of OBJ0)if(o.k==='airfield'){tctx.fillStyle='#4a4a46';tctx.fillRect(o.x-410,o.y-32,820,64);tctx.strokeStyle='rgba(235,235,225,.75)';tctx.lineWidth=3;tctx.setLineDash([26,18]);tctx.beginPath();tctx.moveTo(o.x-370,o.y);tctx.lineTo(o.x+370,o.y);tctx.stroke();tctx.setLineDash([]);
    tctx.fillStyle='rgba(235,235,225,.7)';for(const e of [-1,1])for(let k=-3;k<=3;k++)tctx.fillRect(o.x+e*395-4,o.y+k*8-2,10,4)}
  for(const c of state.covers)if(c.t==='trench')drawCover(c);
  const trees=[];for(let cy=0;cy<GH;cy++)for(let cx=0;cx<GW;cx++)if(grid[cy*GW+cx]===T.FOREST)for(let k=0;k<2;k++)trees.push([cx*CS+r()*CS,cy*CS+r()*CS,7+r()*7,r()]);
  tctx.fillStyle='rgba(0,0,0,.28)';for(const [x,y,s] of trees){tctx.beginPath();tctx.arc(x+4,y+4,s,0,TAU);tctx.fill()}
  for(const [x,y,s,v] of trees){tctx.fillStyle=`hsl(${92+v*24},${26+v*10}%,${15+v*9}%)`;tctx.beginPath();tctx.arc(x,y,s,0,TAU);tctx.fill();tctx.fillStyle='rgba(200,230,140,.07)';tctx.beginPath();tctx.arc(x-s*.3,y-s*.3,s*.5,0,TAU);tctx.fill()}
  for(const c of state.covers)if(c.t!=='trench')drawCover(c);
  for(const b of state.buildings)drawBld(b);
  refreshMini();
}
/* eş yükselti çizgisi (kare yürütme): her hücrede seviyenin kestiği kenarlar birleştirilir; köşe sırası sol üst, sağ üst, sağ alt, sol alt */
function contour(lv,seg){for(let cy=0;cy<GH-1;cy++)for(let cx=0;cx<GW-1;cx++){const i=cy*GW+cx,a=elev[i],b=elev[i+1],c=elev[i+GW+1],d=elev[i+GW];
  const m=(a>lv)|(b>lv)<<1|(c>lv)<<2|(d>lv)<<3;if(m===0||m===15)continue;const x=cx*CS+8,y=cy*CS+8,f=(p,q)=>p===q?.5:(lv-p)/(q-p);
  const P=[];if((m&1)!==(m>>1&1))P.push([x+CS*f(a,b),y]);if((m>>1&1)!==(m>>2&1))P.push([x+CS,y+CS*f(b,c)]);if((m>>2&1)!==(m>>3&1))P.push([x+CS*f(d,c),y+CS]);if((m>>3&1)!==(m&1))P.push([x,y+CS*f(a,d)]);
  if(P.length===2)seg(P[0][0],P[0][1],P[1][0],P[1][1]);else if(P.length===4){if(m===5){seg(P[3][0],P[3][1],P[0][0],P[0][1]);seg(P[1][0],P[1][1],P[2][0],P[2][1])}else{seg(P[0][0],P[0][1],P[1][0],P[1][1]);seg(P[2][0],P[2][1],P[3][0],P[3][1])}}}}
function refreshMini(){mbctx.imageSmoothingQuality='high';mbctx.drawImage(tc,0,0,220,138)}
function scorch(x,y,rad){const g=tctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,'rgba(20,16,10,.55)');g.addColorStop(.6,'rgba(30,24,14,.3)');g.addColorStop(1,'rgba(30,24,14,0)');tctx.fillStyle=g;tctx.beginPath();tctx.arc(x,y,rad,0,TAU);tctx.fill()}
const bcell=new Map();
function buildingAt(x,y){const cx=x/CS|0,cy=y/CS|0;if(cx<0||cy<0||cx>=GW||cy>=GH)return null;const l=bcell.get(cy*GW+cx);if(!l)return null;for(const b of l)if(!b.dead&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return b;return null}
const isWater=(x,y)=>cellAt(x,y)===T.WATER;
/* gemiler için: nehir yatağı (köprü ve sığ geçit hücreleri dahil, köprünün altından geçilir) */
/* m: kıyıdan pay. Hareket gerçek su kenarına kadar (2), yol bulma ortaya yakın (14) kullanır, viraj dönüşünde gemi kıyıya takılmasın */
const riverAt=(x,y,m=6)=>x>=0&&y>=0&&x<W&&y<H&&Math.abs(x-riverX(y))<RIV.hw-m;

export {OBJ0,bgrid,buildChains,buildingAt,cellAt,chainAt,chainProj,coversNear,drawCover,drawRubble,elev,elevAt,genTerrain,grid,isWater,refreshMini,riverAt,scorch};
