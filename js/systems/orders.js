/* systems/orders.js — Oyuncu ve yapay zekâ emirleri: seçim, dizilimler, siper yerleşimi, hareket/saldırı/ateş görevi, uçak ve helikopter komutları, mod anahtarları. */
import {state} from '../state.js';
import {ECON,FORMN,H,MAP,PI,SQUADS,TAU,W,bodyR,edgeX,riverX} from '../config.js';
import {cam,recentImp} from '../state.js';
import {assignRunFor,strikeKey} from './air.js';
import {bridgeAt,orderRepair} from './bridges.js';
import {launchDrone} from './drones.js';
import {popSmoke} from './effects.js';
import {addKP,flying,giveMove,setFM,unloadHeli} from './units.js';
import {knownEnemies} from './vision.js';
import {log,updTip} from '../ui/feedback.js';
import {angDiff,gauss} from '../utils/helpers.js';
import {exitBld} from '../world/buildings.js';
import {buildingAt,chainAt,chainProj,isWater} from '../world/terrain.js';

function hitAbandoned(wx,wy){for(const u of state.units)if(u.abandoned&&(u.side===0||state.vis[0].has(u.id))&&Math.hypot(u.x-wx,u.y-wy)<22+5/cam.z)return u;return null}
/* ---------- emirler ---------- */
const sel=()=>state.units.filter(u=>u.sel&&u.side===0&&!u.abandoned);
function setFormSel(){const s=sel().filter(u=>!u.d.air);if(!s.length)return;const o=Object.keys(FORMN),nx=o[(o.indexOf(s[0].form||'auto')+1)%o.length];s.forEach(u=>u.form=nx)}
function setInitSel(){const s=sel().filter(u=>!u.d.plane);if(!s.length)return;const o=['on','free','off'],nx=o[(o.indexOf(s[0].init||'on')+1)%3];s.forEach(u=>u.init=nx)}
function faceAt(list,wx,wy){const side=list[0].side;let best=null,bd=900;for(const k of knownEnemies(side)){const d=Math.hypot(k.x-wx,k.y-wy);if(d<bd){bd=d;best=k}}
  if(best)return Math.atan2(best.y-wy,best.x-wx);const n=list.length,cx=list.reduce((a,u)=>a+u.x,0)/n,cy=list.reduce((a,u)=>a+u.y,0)/n;
  return Math.hypot(wx-cx,wy-cy)>80?Math.atan2(wy-cy,wx-cx):(side?PI:0)}
function chooseForm(list,wx,wy,face){const side=list[0].side,ks=knownEnemies(side).filter(k=>Math.hypot(k.x-wx,k.y-wy)<800);
  if(ks.length){const angs=ks.map(k=>Math.atan2(k.y-wy,k.x-wx));let spread=0;for(const a of angs)spread=Math.max(spread,Math.abs(angDiff(a,face)));return spread>1.3?'circle':'line'}
  if(recentImp.some(q=>state.time-q.t<40&&Math.hypot(q.x-wx,q.y-wy)<240))return'spread';
  if(state.objs.some(o=>Math.hypot(o.x-wx,o.y-wy)<o.r))return'circle';
  const n=list.length,cx=list.reduce((a,u)=>a+u.x,0)/n,cy=list.reduce((a,u)=>a+u.y,0)/n;return Math.hypot(wx-cx,wy-cy)>500?'wedge':'line'}
/* dizilim noktaları: o={sp: aralık, row: sıra arası, minR: çember en küçük yarıçapı, cols: en fazla sütun} */
function formPts(n,wx,wy,type,face,o){const sp=o.sp,fx=Math.cos(face),fy=Math.sin(face),px=-fy,py=fx,pts=[];
  for(let i=0;i<n;i++){let x,y,f=face;
    if(type==='wedge'){const k=Math.ceil(i/2),sg=i%2?1:-1;x=wx-fx*k*sp*.9+px*sg*k*sp;y=wy-fy*k*sp*.9+py*sg*k*sp}
    else if(type==='column'){x=wx-fx*i*sp;y=wy-fy*i*sp}
    else if(type==='circle'){const Rr=Math.max(o.minR,n*sp*1.15/TAU),a=face+i/n*TAU;x=wx+Math.cos(a)*Rr;y=wy+Math.sin(a)*Rr;f=a}
    else{const ss=type==='spread'?sp*2.6:sp,cols=Math.min(n,o.cols),r=i/cols|0,c=i%cols-(Math.min(cols,n-r*cols)-1)/2;x=wx+px*c*ss-fx*r*o.row;y=wy+py*c*ss-fy*r*o.row;if(type==='spread'&&c%2){x-=fx*sp;y-=fy*sp}}
    for(let k=0;k<4&&(isWater(x,y)||buildingAt(x,y));k++){x=wx+(x-wx)*.7+gauss()*4;y=wy+(y-wy)*.7+gauss()*4}
    pts.push({x,y,f})}
  return pts}
function formationEx(list,wx,wy,mode,type,face){if(!list.length)return;const inf=list[0].d.inf,pts=formPts(list.length,wx,wy,type,face,inf?{sp:14,row:18,minR:26,cols:8}:{sp:52,row:55,minR:72,cols:5});
  const left=[...list];for(const q of pts){let bi=0,bd=1e9;left.forEach((u,i)=>{const d=Math.hypot(u.x-q.x,u.y-q.y);if(d<bd){bd=d;bi=i}});const u=left.splice(bi,1)[0];giveMove(u,q.x,q.y,mode);u.faceA=q.f}}
/* ---------- manga ---------- */
/* bir birliğin mangadaki sağ ve sahada olan üyeleri (seçim ve emirlerin birimi) */
function squadOf(u){if(!u.sq)return[u];const m=u.sq.m.filter(x=>x.hp>0&&!x.gone&&!x.inHeli&&x.side===u.side);return m.includes(u)?m:[u]}
function groupSq(list){const g=new Map();for(const u of list){const k=u.sq||u;if(!g.has(k))g.set(k,[]);g.get(k).push(u)}return[...g.values()]}
const cen=l=>({x:l.reduce((a,u)=>a+u.x,0)/l.length,y:l.reduce((a,u)=>a+u.y,0)/l.length});
/* piyade mangaları blok olarak dizilir: önce manga merkezleri, sonra her manga kendi içinde */
function squadForm(list,wx,wy,mode,type,face){const gs=groupSq(list);if(gs.length<2){formationEx(list,wx,wy,mode,type,face);return}
  const ctr=formPts(gs.length,wx,wy,type,face,{sp:64,row:62,minR:70,cols:5}),inner=type==='column'?'column':type==='spread'?'spread':'line',left=[...gs];
  for(const p of ctr){let bi=0,bd=1e9;left.forEach((g,i)=>{const c=cen(g),d=Math.hypot(c.x-p.x,c.y-p.y);if(d<bd){bd=d;bi=i}});formationEx(left.splice(bi,1)[0],p.x,p.y,mode,inner,type==='circle'?p.f:face)}}
function formation(list,wx,wy,mode,sp){if(!list.length)return;const n=list.length,cx=list.reduce((a,u)=>a+u.x,0)/n,cy=list.reduce((a,u)=>a+u.y,0)/n,ang=Math.atan2(wy-cy,wx-cx);
  const cols=Math.ceil(Math.sqrt(n*2)),px=-Math.sin(ang),py=Math.cos(ang),fx=Math.cos(ang),fy=Math.sin(ang);
  [...list].sort((a,b)=>(a.x*px+a.y*py)-(b.x*px+b.y*py)).forEach((u,i)=>{const c=i%cols-(Math.min(cols,n)-1)/2,r=-(i/cols|0);let x=wx+px*c*sp+fx*r*sp,y=wy+py*c*sp+fy*r*sp;
    giveMove(u,x,y,mode)})}
/* Siper yuvaları: tıklanan hattın tamamı (bitişik parçalar dahil), sonra yakındaki diğer hatlar, çukurlar, enkazlar. Dolu yuvalar atlanır. */
function coverSlots(wx,wy,ref,side,skip,prim){const slots=[];
  const occ=(x,y)=>state.units.some(o=>o.side===side&&o.d.inf&&!o.inB&&!skip.has(o)&&Math.hypot((o.dest?o.dest.x:o.x)-x,(o.dest?o.dest.y:o.y)-y)<9);
  const addChain=(ch,s0,base)=>{const off=ch.t==='trench'?0:7,spc=12.5,n=Math.max(1,Math.floor((ch.len-4)/spc)+1),start=(ch.len-(n-1)*spc)/2;
    for(let k=0;k<n;k++){const s=start+k*spc,p=chainAt(ch,s),g=p.g,L=g.L||1,ux=(g.bx-g.ax)/L,uy=(g.by-g.ay)/L,cr=Math.sign((g.bx-g.ax)*(ref.y-g.ay)-(g.by-g.ay)*(ref.x-g.ax))||1;
      const x=p.x-uy*cr*off,y=p.y+ux*cr*off,dd=Math.hypot(x-wx,y-wy);if(base&&dd>170)continue;if(buildingAt(x,y))continue;if(!occ(x,y))slots.push({x,y,pr:base+(s0==null?dd:Math.abs(s-s0))})}};
  if(prim)addChain(prim.ch,prim.s,0);
  for(const ch of state.chains)if(!prim||ch!==prim.ch){if(chainProj(ch,wx,wy).d<150)addChain(ch,null,prim?1000:0)}
  for(const c of state.covers){if(c.r==null||Math.hypot(c.x-wx,c.y-wy)>150)continue;let pts;
    if(c.t==='fox')pts=[[c.x,c.y]];else if(c.t==='wreck')pts=[[c.x-7,c.y+9],[c.x+7,c.y-9]];else{const k=Math.max(2,Math.floor(c.r/6));pts=[];for(let i=0;i<k;i++){const a=i/k*TAU;pts.push([c.x+Math.cos(a)*c.r*.5,c.y+Math.sin(a)*c.r*.5])}}
    for(const [x,y] of pts)if(!occ(x,y)&&!buildingAt(x,y))slots.push({x,y,pr:(prim?1000:0)+Math.hypot(x-wx,y-wy)})}
  return slots.sort((a,b)=>a.pr-b.pr)}
/* yuvaları en yakın birliklere dağıtır */
function assignSlots(us,slots,mode){const left=[...us];for(const s of slots){if(!left.length)break;let bi=0,bd=1e9;left.forEach((u,i)=>{const d=Math.hypot(u.x-s.x,u.y-s.y);if(d<bd){bd=d;bi=i}});giveMove(left.splice(bi,1)[0],s.x,s.y,mode)}return left}
/* manga mangaya: her manga en iyi boş yuvanın çevresindeki bitişik yuvaları alır, mangalar siperde birbirine karışmaz */
function placeInCover(list,wx,wy,prim){const n=list.length,ref=cen(list);
  const avail=coverSlots(wx,wy,ref,list[0].side,new Set(list),prim),gs=groupSq(list).sort((a,b)=>{const p=cen(a),q=cen(b);return Math.hypot(p.x-wx,p.y-wy)-Math.hypot(q.x-wx,q.y-wy)}),left=[];
  for(const g of gs){if(!avail.length){left.push(...g);continue}const an=avail[0],pick=avail.slice().sort((a,b)=>Math.hypot(a.x-an.x,a.y-an.y)-Math.hypot(b.x-an.x,b.y-an.y)).slice(0,g.length);
    for(const p of pick)avail.splice(avail.indexOf(p),1);left.push(...assignSlots(g,pick,'move'))}
  if(left.length){let dx=ref.x-wx,dy=ref.y-wy;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
    left.forEach((u,i)=>{const c=i-(left.length-1)/2;giveMove(u,wx+dx*28-dy*c*13,wy+dy*28+dx*c*13,'move')});
    if(list[0].side===0)log(`Siperde yer kalmadı: ${left.length} asker arkada bekliyor`,'')}}
function orderGroup(list,wx,wy,mode){list=list.filter(u=>!u.d.air);if(!list.length)return;const inf=list.filter(u=>u.d.inf),veh=list.filter(u=>!u.d.inf);
  const b=buildingAt(wx,wy);
  /* binaya tıklanınca mangalar bütün olarak yerleşir: sığmayan manga en yakın boş binaya, o da yoksa önüne dizilir */
  if(b&&inf.length){const free=state.buildings.filter(o=>!o.dead&&o.cap>0&&!(o.burn>0)&&!(o.occ[0]&&o.occ[0].side!==inf[0].side)&&Math.hypot(o.x+o.w/2-wx,o.y+o.h/2-wy)<170).sort((p,q)=>(p===b?-1:q===b?1:Math.hypot(p.x+p.w/2-wx,p.y+p.h/2-wy)-Math.hypot(q.x+q.w/2-wx,q.y+q.h/2-wy))),room=new Map(free.map(o=>[o,o.cap-o.occ.length]));
    const out=[];for(const g of groupSq(inf)){const o=free.find(o=>room.get(o)>=g.length);if(!o){out.push(...g);continue}room.set(o,room.get(o)-g.length);g.forEach(u=>{giveMove(u,o.x+o.w/2,o.y+o.h/2,mode);u.enterB=o})}
    if(out.length)squadForm(out,wx,wy+b.h/2+30,mode,'line',faceAt(out,wx,wy));formation(veh,wx,wy,mode,48);return}
  let prim=null,bd=34;for(const ch of state.chains){const pj=chainProj(ch,wx,wy);if(pj.d<bd){bd=pj.d;prim={ch,s:pj.s}}}
  const nearC=state.covers.some(c=>c.r!=null&&Math.hypot(c.x-wx,c.y-wy)<c.r+22);
  const fms=new Set(list.map(u=>u.form||'auto')),fm=fms.size===1?[...fms][0]:'auto',face=faceAt(list,wx,wy),bx=-Math.cos(face)*55,by=-Math.sin(face)*55;
  if(fm==='auto'&&inf.length&&(prim||nearC)){placeInCover(inf,wx,wy,prim);inf.forEach(u=>u.faceA=face);formationEx(veh,wx+bx,wy+by,mode,'line',face);return}
  const type=fm==='auto'?chooseForm(list,wx,wy,face):fm;
  if(fm==='auto'&&list[0].side===0&&list.length>2&&mode!=='fast')log(`Otomatik dizilim: ${FORMN[type]}`,'');
  if(inf.length&&veh.length){squadForm(inf,wx,wy,mode,type,face);formationEx(veh,wx+bx,wy+by,mode,type==='circle'?'circle':type==='column'?'column':'line',face)}
  else if(inf.length)squadForm(inf,wx,wy,mode,type,face);
  else formationEx(list,wx,wy,mode,type,face)}
function rightOrder(wx,wy,atk,shift){const all=sel();if(!all.length)return;
  {const trk=all.filter(u=>u.d.supply),db=trk.length?bridgeAt(wx,wy,40):null;if(db&&db.dead){trk.forEach(u=>orderRepair(u,db));state.marks.push({ping:1,x:wx,y:wy,t:0,c:'#7fd48a'});return}}
  if(shift){const snap=new Map(all.map(u=>[u,{dest:u.dest,q:u.queue.slice(),mode:u.mode}]));rightOrder(wx,wy,atk,false);
    for(const [u,o] of snap){if(!o.dest||!u.dest||u.d.plane)continue;const nd=u.dest;u.dest=o.dest;u.queue=[...o.q,nd];u.mode=o.mode}return}
  const ab=hitAbandoned(wx,wy),infS=all.filter(u=>u.d.inf&&!u.d.indirect);
  if(ab&&infS.length){const c=infS.find(u=>u.key==='crew')||infS.reduce((a,b)=>Math.hypot(a.x-ab.x,a.y-ab.y)<Math.hypot(b.x-ab.x,b.y-ab.y)?a:b);giveMove(c,ab.x,ab.y,'move');c.crewTo=ab;state.marks.push({ping:1,x:ab.x,y:ab.y,t:0,c:'#e8a838'});return}
  const enemy=hitUnit(wx,wy,1);
  const pl=all.filter(u=>u.d.plane),he=all.filter(u=>u.d.heli),s=all.filter(u=>!u.d.air);
  const own=hitUnit(wx,wy,0);
  const drn=he.filter(u=>u.d.fpv);if(enemy&&!flying(enemy)&&drn.length){for(const u of drn){u.kTgt=enemy;u.home=false}state.marks.push({ping:1,x:enemy.x,y:enemy.y,t:0,c:'#e2584b'});if(drn.length===all.length)return}
  /* araca/helikoptere manga bütün olarak biner; sığmayan manga yerinde kalır */
  if(own&&own.d.cap&&s.some(u=>u.d.inf)){let room=own.d.cap-own.cargo.length;const inf=[];for(const g of groupSq(s.filter(u=>u.d.inf&&!u.d.indirect)))if(g.length<=room){inf.push(...g);room-=g.length}
    if(!inf.length&&own.side===0)log('Seçili manga araca sığmıyor','bad');inf.forEach(u=>{giveMove(u,own.x,own.y,'move');u.board=own});
    if(inf.length){own.dest=null;if(own.d.heli&&own.alt!=='landed')own.landReq=true}state.marks.push({ping:1,x:own.x,y:own.y,t:0,c:'#62a6e6'});return}
  for(const u of pl){u.rtb=false;
    if(enemy){if(flying(enemy)){u.chase=enemy;u.run=null;u.strikes=[]}else if(u.pay.lgb>=1||u.pay.mam>=1){u.strikes=[{t:enemy,x:enemy.x,y:enemy.y}];u.alt='high';u.run=null;u.chase=null}else if(!u.runType){u.loiter={x:enemy.x,y:enemy.y}}
      else{const a=Math.atan2(enemy.y-u.y,enemy.x-u.x),len=u.runType==='carpet'?320:200;assignRunFor(u,enemy.x-Math.cos(a)*len/2,enemy.y-Math.sin(a)*len/2,enemy.x+Math.cos(a)*len/2,enemy.y+Math.sin(a)*len/2)}}
    else{u.loiter={x:wx,y:wy};u.run=null;u.strikes=[];u.chase=null}}
  if(enemy){for(const u of [...he,...s]){if(u.d.indirect){setMission(u,enemy.x,enemy.y,3)}else{u.focus=enemy;u.mode='focus';u.dig=-1}}state.marks.push({ping:1,x:enemy.x,y:enemy.y,t:0,c:'#e2584b'});return}
  const md=state.fastArm?'fast':atk?'attack':'move';formation(he,wx,wy,md==='fast'?'move':md,54);
  orderGroup(s,wx,wy,md);state.marks.push({ping:1,x:wx,y:wy,t:0,c:atk?'#e8a838':'#62a6e6'})}
function assignRun(ax,ay,bx,by){let n=0;for(const u of sel().filter(u=>u.d.plane))if(assignRunFor(u,ax,ay,bx,by))n++;if(n)state.marks.push({ping:1,x:(ax+bx)/2,y:(ay+by)/2,t:0,c:'#e8a838'});else log('Seçili uçakta koşu mühimmatı yok','bad')}
function addStrike(wx,wy){const e=hitUnit(wx,wy,1),t=e&&!flying(e)?e:null;let n=0;for(const u of sel().filter(u=>u.d.plane&&(u.pay.lgb>=1||u.pay.mam>=1))){if(u.strikes.length<Math.floor(u.pay[strikeKey(u)])){u.strikes.push({t,x:wx,y:wy});u.alt='high';u.run=null;u.chase=null;u.rtb=false;n++}}
  if(n)state.marks.push({ping:1,x:wx,y:wy,t:0,c:'#e8a838'})}
function altSel(){for(const u of sel()){if(u.d.drone)continue;if(u.d.plane&&!u.d.highOnly)u.alt=u.alt==='high'?'low':'high';else if(u.d.heli&&u.alt!=='landed'&&!(u.altT>0))u.alt=u.alt==='high'?'low':'high'}}
function radarSel(){const rd=sel().filter(u=>u.d.radar);if(!rd.length)return;const on=!rd.every(u=>u.radarOn||u.radarT>0);for(const u of rd){if(on){if(!u.radarOn&&!(u.radarT>0))u.radarT=5}else{u.radarOn=false;u.radarT=0}u.radarOffT=0}}
function landSel(){const he=sel().filter(u=>u.d.heli&&!u.d.drone);const up=he.length&&he.every(u=>u.alt==='landed');for(const u of he){if(up)u.wantUp=true;else{u.dest=null;u.landReq=true}}}
function unloadSel(){for(const u of sel())if(u.d.cap&&u.cargo.length){u.dest=null;if(u.d.heli)u.unloadReq=true;else unloadHeli(u)}}
function rtbSel(){for(const u of sel()){if(u.d.plane){u.rtb=true;u.run=null;u.strikes=[];u.chase=null}else if(u.d.drone){u.kTgt=null;if(u.op)giveMove(u,u.op.x,u.op.y,'move');else giveMove(u,u.side?W-120:120,u.y,'move');u.home=true}}}
/* seçili dron operatörlerinin her biri bir kamikaze dron kaldırır; kalkan dronlar seçilir */
function droneLaunchSel(){const ops=sel().filter(u=>u.d.dronOp&&u.drones>=1),out=[];for(const u of ops){const d=launchDrone(u,null);if(d)out.push(d)}
  if(out.length){state.units.forEach(u=>u.sel=false);out.forEach(d=>d.sel=true);log(`${out.length} kamikaze dron havada: düşmana sağ tıkla`,'good')}else if(sel().some(u=>u.d.dronOp))log('Operatörlerin dron stoku boş','bad')}
/* kamikaze dron yönetimi: otomatik (operatör seçer) veya oyuncu */
function droneModeToggle(){state.droneManual=!state.droneManual;try{localStorage.setItem('cephe-hatti.dron',state.droneManual?'1':'0')}catch(e){}
  for(const d of state.units)if(d.op&&d.side===0)d.manual=state.droneManual;log(state.droneManual?'Kamikaze dronları sen yönetiyorsun':'Kamikaze dronları operatörler yönetiyor','')}
function burnSel(){const p=sel().filter(u=>u.d.plane);const v=!p.every(u=>u.burn);p.forEach(u=>u.burn=v)}
function wpnSel(){const p=sel().filter(u=>u.d.plane&&u.d.pay.gun!=null);const v=p.every(u=>u.runType!=='rockets')?'rockets':'gun';p.forEach(u=>u.runType=v)}
function setRunArm(v){state.runArm=v&&sel().some(u=>u.d.plane&&u.runType&&u.pay[u.runType]>=1);if(state.runArm){state.attackArm=state.missionArm=state.precArm=false}updTip()}
function setPrecArm(v){state.precArm=v&&sel().some(u=>u.d.plane&&(u.pay.lgb>=1||u.pay.mam>=1));if(state.precArm){state.attackArm=state.missionArm=state.runArm=false}updTip()}
function setMission(u,x,y,n){const w=u.d.w[0],d=Math.hypot(x-u.x,y-u.y);if(d>w.r||d<w.min)return false;u.mission={x,y,shell:u.shell,n,fired:0};u.dest=null;return true}
function assignMission(x,y){const s=sel().filter(u=>u.d.indirect);let ok=0,bad=0;for(const u of s)setMission(u,x,y,state.salvo)?ok++:bad++;
  if(ok)state.marks.push({ping:1,x,y,t:0,c:'#e8a838'});if(bad)log(`${bad} topçu birimi için hedef menzil dışında`,'bad')}
function hitUnit(wx,wy,side){let best=null,bd=1e9;for(const u of state.units){if(u.side!==side||u.abandoned)continue;if(side===1&&!state.vis[0].has(u.id))continue;const d=Math.hypot(u.x-wx,u.y-wy),r=(u.d.inf?8:bodyR(u.d)+2)+5/cam.z;if(d<r&&d<bd){bd=d;best=u}}return best}
function exfilSel(){for(const u of sel()){if(u.d.plane||u.d.fixed)continue;if(u.d.naval&&MAP.coast&&!u.side)giveMove(u,20,u.y,'fast');else if(u.d.naval){const y=u.side?20:H-20;giveMove(u,riverX(y),y,'fast')}else giveMove(u,u.side?W-10:edgeX(0,u.y)+10,u.y,'fast');u.exfil=true}}
/* kalan mühimmat oranı (0–1); mühimmatsız birlik 1 sayılır */
const ammoFrac=u=>{let s=0,n=0;u.d.w.forEach((w,i)=>{if(typeof w.ammo==='number'){s+=u.ammo[i]/w.ammo;n++}else if(w.ammo&&typeof w.ammo==='object'){let a=0,b=0;for(const k in w.ammo){a+=u.ammo[i][k];b+=w.ammo[k]}s+=a/b;n++}});return n?s/n:1};
function exfilOut(u){let v=Math.max(ECON.exfilMin,.5*u.hp/u.d.hp*(.5+.5*ammoFrac(u)))*(u.val||0);if(u.cargo)for(const c of u.cargo){v+=.5*c.val;c.gone=true;if(c.sq&&!c.sq.m.some(m=>m.hp>0&&!m.gone&&m!==c)){c.sq.ret=1;const ix=SQUADS.findIndex(S=>S.k===c.sq.k);if(ix>=0&&!c.sq.noCard)state.retQ.push({side:c.side,idx:ix,t:state.time+ECON.exfilCd})}}
  addKP(u.side,v);u.gone=true;u.sel=false;const sq=u.sq;
  if(sq&&!sq.ret&&!sq.noCard&&!sq.m.some(m=>m!==u&&m.hp>0&&!m.gone)){sq.ret=1;const ix=SQUADS.findIndex(S=>S.k===sq.k);if(ix>=0)state.retQ.push({side:u.side,idx:ix,t:state.time+ECON.exfilCd})}
  if(u.side===0)log(`${u.d.n} cepheden çekildi: +${Math.round(v)} KP`,'good')}
function stopSel(){for(const u of sel()){u.dest=null;u.focus=null;u.mission=null;u.enterB=null;u.dig=-1}}
function holdSel(){const s=sel();if(!s.length)return;const o=['free','ret','hold'],nx=o[(o.indexOf(s[0].fm)+1)%3];for(const u of s)setFM(u,nx)}
function setFastArm(v){state.fastArm=v&&sel().some(u=>!u.d.plane);if(state.fastArm)state.attackArm=state.missionArm=state.runArm=state.precArm=false;updTip()}
function stanceSel(v){for(const u of sel())if(u.d.inf)u.stM=v}
function digSel(){for(const u of sel())if(u.d.inf&&!u.inB&&!(u.cov&&(u.cov.t==='fox'||u.cov.t==='trench'))){u.dest=null;u.focus=null;u.dig=0}}
function exitSel(){for(const u of sel())if(u.inB)exitBld(u,u.x-40,u.y)}
function deploySel(){const s=sel().filter(u=>u.d.indirect);const anyDep=s.some(u=>u.st==='deployed'||u.st==='deploying');
  for(const u of s){if(anyDep){if(u.st==='deployed'||u.st==='deploying'){u.st='packing';u.stT=u.d.packT}}else if(u.st==='travel'){u.dest=null;u.st='deploying';u.stT=u.d.setupT}}}
function shellSel(){const s=sel().filter(u=>u.d.indirect);const v=s.every(u=>u.shell==='he')?'smoke':'he';for(const u of s)u.shell=v}
function autoSel(){const s=sel().filter(u=>u.d.indirect);const v=!s.every(u=>u.auto);for(const u of s)u.auto=v}
function smokeSel(){for(const u of sel())if(u.d.smokeL)popSmoke(u)}
function dcToggle(){if(state.dc){state.dc=null}else{const s=sel();if(s.length===1&&!s[0].d.air){state.dc=s[0];state.dc.dest=null;state.dc.focus=null;setArm(false);setMissionArm(false)}}updTip()}
function setArm(v){state.attackArm=v&&sel().length>0;if(state.attackArm)state.missionArm=state.runArm=state.precArm=state.fastArm=false;updTip()}
function setMissionArm(v){state.missionArm=v&&sel().some(u=>u.d.indirect);if(state.missionArm)state.attackArm=state.runArm=state.precArm=false;updTip()}

export {addStrike,altSel,assignMission,assignRun,autoSel,burnSel,cen,coverSlots,droneLaunchSel,droneModeToggle,groupSq,squadOf,dcToggle,deploySel,digSel,exfilOut,exfilSel,exitSel,hitUnit,holdSel,landSel,orderGroup,radarSel,rightOrder,rtbSel,sel,setArm,setFastArm,setFormSel,setInitSel,setMissionArm,setPrecArm,setRunArm,shellSel,smokeSel,stanceSel,stopSel,unloadSel,wpnSel};
