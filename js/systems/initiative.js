/* systems/initiative.js — Birlik inisiyatifi: emir verilen nokta çevresinde güvenli küçük kararlar. */
import {state} from '../state.js';
import {CS,GW,H,PI,W} from '../config.js';
import {fireCells,popSmoke} from './effects.js';
import {cen,coverSlots,squadOf} from './orders.js';
import {flying} from './units.js';
import {knownEnemies,los} from './vision.js';
import {log} from '../ui/feedback.js';
import {R,clamp,gauss,sideOf} from '../utils/helpers.js';
import {bCap,exitBld} from '../world/buildings.js';
import {buildingAt,isWater} from '../world/terrain.js';

const leash=u=>(u.d.inf?80:u.d.supply?280:120)*(u.init==='free'?1.8:1);
function threat(u){let best=null,bd=750;for(const k of knownEnemies(u.side)){const d=Math.hypot(k.x-u.x,k.y-u.y);if(d<bd){bd=d;best={x:k.x,y:k.y,d,e:k.e}}}
  if(!best&&u.lastShot&&state.time-u.lastShot.t<6)best={x:u.lastShot.x,y:u.lastShot.y,d:Math.hypot(u.lastShot.x-u.x,u.lastShot.y-u.y),e:null};
  if(best)best.at=best.e?(!!(best.e.d.w[0]&&best.e.d.w[0].anti)||best.e.key==='tank'):state.time-(u.lastHeavy||-9)<6;return best}
function incomingAt(side,x,y,rad){return state.proj.some(p=>(p.k==='arty'||p.k==='mortar'||p.k==='bomb')&&p.side!==side&&Math.hypot(p.tx-x,p.ty-y)<rad)}
function safeSpot(u,x,y){if(x<10||y<10||x>W-10||y>H-10||isWater(x,y)||buildingAt(x,y)||fireCells.has((y/CS|0)*GW+(x/CS|0)))return false;
  const a=u.anchor||u;if(Math.hypot(x-a.x,y-a.y)>leash(u))return false;
  const fw=u.side?-1:1;if((x-a.x)*fw>25&&(x-u.x)*fw>0)return false;
  for(const k of knownEnemies(u.side)){const d0=Math.hypot(k.x-u.x,k.y-u.y);if(d0<900&&Math.hypot(k.x-x,k.y-y)<d0-15)return false}
  if(incomingAt(u.side,x,y,90))return false;return true}
function autoMove(u,x,y,why){u.dest={x,y};u.mode='move';u.queue=[];u.amv=true;u.enterB=null;u.dig=-1;if(why)note(u,why)}
function note(u,txt){u.th={s:txt,t:state.time};if(u.side!==0)return;const k=u.sq||u;if(state.time-(k.noteT||-99)<9)return;k.noteT=state.time;log(`${u.sq&&u.sq.m.length>1?u.sq.n:u.d.n}: ${txt}`,'')}
function initiative(u,dt){
  if(!u.init)u.init='on';
  if(u.init==='off'||u.d.plane||u.abandoned||u.panicT>0||u.inHeli||u.gone||u.hp<=0)return;
  u.iT=(u.iT||0)-dt;if(u.iT>0)return;u.iT=.6+R()*.5;
  if(!u.anchor)u.anchor={x:(u.dest||u).x,y:(u.dest||u).y};
  const idle=!u.dest&&!u.moving&&!u.board&&!u.crewTo&&!u.exfil&&!u.enterB&&u.dig<0&&state.time-(u.ordT||-9)>2.5&&!u.hold&&!u.repB;
  const th=threat(u),fw=u.side?-1:1;
  // helikopter: füze geliyorsa veya ağır hasarlıysa alçalıp geri kaç
  if(u.d.heli&&!u.d.drone){if(flying(u)&&!(u.altT>0)&&(state.time>(u.evT||0))&&(state.proj.some(p=>p.k==='msl'&&p.tgt===u&&!p.lost)||(u.hp<u.d.hp*.4&&state.time-u.shotAtT<3))){
      u.evT=state.time+9;u.alt='low';u.dest={x:clamp(u.x-fw*260,40,W-40),y:clamp(u.y+gauss()*60,40,H-40)};u.mode='move';note(u,'kaçış manevrası yaptı')}return}
  if(u.d.drone)return;
  // araçlar
  if(!u.d.inf){
    if(u.d.smokeL&&u.smokeL>=1&&u.lastHeavy&&state.time-u.lastHeavy<1.5&&u.hp<u.d.hp*.75&&!u.smoked){u.smoked=state.time;popSmoke(u);note(u,'sis perdesi attı')}
    if(u.smoked&&state.time-u.smoked>12)u.smoked=0;
    if(u.d.indirect){
      if(u.st==='deployed'&&!u.mission&&incomingAt(u.side,u.x,u.y,150)){const a=Math.atan2(0,fw)+(R()<.5?1:-1)*PI/2;for(const k of [1,-1]){const x=u.x+Math.cos(a)*140*k,y=u.y+Math.sin(a)*140*k;if(safeSpot(u,x,y)){autoMove(u,x,y,'karşı batarya ateşinden kaçıyor');u.wantDeploy=true;break}}return}
      if(u.side===0&&u.auto&&u.st==='deployed'&&!u.mission&&!u.hold){for(const cb of state.cbs){if(cb.det!==u.side||cb.t<6||cb['u'+u.id])continue;cb['u'+u.id]=1;const d=Math.hypot(cb.x-u.x,cb.y-u.y),w=u.d.w[0];
        if(d<=w.r&&d>=w.min&&u.ammo[0].he>=2){u.mission={x:cb.x,y:cb.y,shell:'he',n:2,fired:0};note(u,'karşı batarya ateşi açtı');break}}}
      return}
    if(!idle)return;
    if(u.d.supply){if(th&&th.d<350){const x=u.x+(u.x-th.x)/th.d*90,y=u.y+(u.y-th.y)/th.d*90;if(safeSpot(u,x,y))autoMove(u,x,y,'ateşten uzaklaştı');return}
      let best=null,bs=0;for(const f of state.units){if(f.side!==u.side||f===u||flying(f)||f.abandoned||f.d.plane)continue;const da=Math.hypot(f.x-u.anchor.x,f.y-u.anchor.y);if(da>leash(u))continue;
        let need=f.d.veh?(1-f.hp/f.d.hp):0;f.d.w.forEach((w,i)=>{if(typeof w.ammo==='number')need+=1-f.ammo[i]/w.ammo});if(need<.25||Math.hypot(f.x-u.x,f.y-u.y)<110)continue;if(need>bs){bs=need;best=f}}
      if(best){const a=Math.atan2(u.y-best.y,u.x-best.x),x=best.x+Math.cos(a)*55,y=best.y+Math.sin(a)*55;if(safeSpot(u,x,y))autoMove(u,x,y,'ikmal için yaklaştı')}return}
    if(th)u.faceA=Math.atan2(th.y-u.y,th.x-u.x);
    if(th&&state.time-u.shotAtT<3&&(u.hp<u.d.hp*.5||(th.at&&!u.sees.includes(th.e)))&&!(u.vcov&&sideOf(u.vcov,th.x,th.y)!==sideOf(u.vcov,u.x,u.y))){const x=u.x-(th.x-u.x)/th.d*75,y=u.y-(th.y-u.y)/th.d*75;
      if(safeSpot(u,x,y))autoMove(u,x,y,'geri çekilip gizlendi')}
    return}
  // piyade
  if(u.inB){const b=u.inB;if((b.burn>0||b.hp<b.max*.18)&&!u.d.indirect){exitBld(u,b.x+b.w/2-fw*(b.w/2+14),b.y+b.h/2);u.ordT=state.time-3;note(u,'yıkılmak üzere olan binayı terk etti')}return}
  /* piyade kararları manga düzeyinde: lider (binada olmayan ilk sağ üye) tüm manga adına karar verir, üyeler birlikte hareket eder */
  const ms=squadOf(u).filter(m=>m.d.inf&&!m.inB);if(ms[0]!==u)return;
  if(!ms.every(isIdle)||ms.some(m=>m.d.indirect&&m.st!=='travel'))return;
  const c=cen(ms),sth=threatAt(u.side,c,ms),n=ms.length,inCov=ms.filter(m=>m.cov).length,sup=ms.reduce((a,m)=>a+m.sup,0)/n;
  const underFire=ms.some(m=>state.time-m.shotAtT<4)||sup>30;
  if((sth&&sth.d<520||underFire)&&inCov*2<n){
    const ref=sth?{x:c.x-(sth.x-c.x)/Math.max(sth.d,1)*120,y:c.y-(sth.y-c.y)/Math.max(sth.d,1)*120}:{x:c.x-fw*120,y:c.y};
    const sl=coverSlots(c.x,c.y,ref,u.side,new Set(ms),null).filter(q=>Math.hypot(q.x-c.x,q.y-c.y)<90&&safeSpot(u,q.x,q.y));
    if(sl.length>=Math.ceil(n*.6)){const an=sl.reduce((a,q)=>Math.hypot(q.x-c.x,q.y-c.y)<Math.hypot(a.x-c.x,a.y-c.y)?q:a),pick=sl.sort((a,q)=>Math.hypot(a.x-an.x,a.y-an.y)-Math.hypot(q.x-an.x,q.y-an.y)).slice(0,n),left=[...ms];
      for(const q of pick){let bi=0,bd=1e9;left.forEach((m,i)=>{const d=Math.hypot(m.x-q.x,m.y-q.y);if(d<bd){bd=d;bi=i}});autoMove(left.splice(bi,1)[0],q.x,q.y)}note(u,'siper aldı');return}
    for(const b of state.buildings){if(b.dead||bCap(b)-b.occ.length<n||(b.occ[0]&&b.occ[0].side!==u.side)||b.burn>0)continue;const bx=b.x+b.w/2,by=b.y+b.h/2;
      if(Math.hypot(bx-c.x,by-c.y)<90&&safeSpot(u,clamp(c.x,b.x-8,b.x+b.w+8),clamp(c.y,b.y-8,b.y+b.h+8))){for(const m of ms){m.dest={x:bx,y:by};m.mode='move';m.amv=true;m.enterB=b}note(u,'binaya girdi');return}}}
  if(sup>80&&sth&&sth.d<170&&inCov*2<n){const ox=-(sth.x-c.x)/sth.d*60,oy=-(sth.y-c.y)/sth.d*60;if(ms.every(m=>safeSpot(m,m.x+ox,m.y+oy))){for(const m of ms)autoMove(m,m.x+ox,m.y+oy);note(u,'baskı altında geri çekildi');return}}
  const anti=ms.some(m=>m.d.w[0]&&m.d.w[0].anti),rng=Math.max(...ms.map(m=>m.d.w[0]?m.d.w[0].r:0));
  if(rng&&sth&&sth.e&&!ms.some(m=>m.sees.includes(sth.e))&&sth.d<rng*1.05&&(!inCov||anti&&!sth.e.d.inf)){
    const a=Math.atan2(sth.y-c.y,sth.x-c.x),px=-Math.sin(a),py=Math.cos(a);
    for(const [o,b] of [[40,0],[-40,0],[75,0],[-75,0],[0,-30]]){const ox=px*o+Math.cos(a)*b,oy=py*o+Math.sin(a)*b;
      if(ms.every(m=>safeSpot(m,m.x+ox,m.y+oy))&&los(c.x+ox,c.y+oy,sth.x,sth.y,-1,sth.e.inB?sth.e.inB.i:-1)){for(const m of ms)autoMove(m,m.x+ox,m.y+oy);note(u,'atış pozisyonu değiştirdi');return}}}
}
function isIdle(m){return!m.dest&&!m.moving&&!m.board&&!m.crewTo&&!m.exfil&&!m.enterB&&m.dig<0&&state.time-(m.ordT||-9)>2.5&&!m.hold&&!(m.panicT>0)}
/* manga merkezine en yakın bilinen düşman; yoksa üyelerden birine son 6 sn içinde ateş edilen yer */
function threatAt(side,c,ms){let best=null,bd=750;for(const k of knownEnemies(side)){const d=Math.hypot(k.x-c.x,k.y-c.y);if(d<bd){bd=d;best={x:k.x,y:k.y,d,e:k.e}}}
  if(!best){let ls=null;for(const m of ms)if(m.lastShot&&state.time-m.lastShot.t<6&&(!ls||m.lastShot.t>ls.t))ls=m.lastShot;if(ls)best={x:ls.x,y:ls.y,d:Math.hypot(ls.x-c.x,ls.y-c.y),e:null}}
  return best}

export {initiative,leash};
