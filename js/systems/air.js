/* systems/air.js — Hava: helikopter, dron, uçak uçuşu, saldırı koşusu, hava-hava ve SEAD otomatikleri. */
import {state} from '../state.js';
import {AW,H,PI,SQUADS,W} from '../config.js';
import {damage,fireMissile,hurtB,inRange,kill,splashDmg,suppress} from './combat.js';
import {opDroneTick} from './drones.js';
import {explode} from './effects.js';
import {flying,giveMove,inBase,mkUnit,unloadHeli} from './units.js';
import {log} from '../ui/feedback.js';
import {angDiff,clamp,gauss} from '../utils/helpers.js';
import {buildingAt} from '../world/terrain.js';

/* ---------- hava ---------- */
function moveHeli(u,dt){u.moving=false;
  if(u.altT>0){u.altT-=dt;if(u.altT<=0){u.altT=0;u.alt=u.altTo;if(u.alt==='landed'&&u.unloadReq)unloadHeli(u)}return}
  if(u.alt==='landed'){if(u.dest||u.wantUp){u.wantUp=false;u.altTo='low';u.altT=1.5}else if(u.unloadReq)unloadHeli(u);return}
  if((u.landReq||u.unloadReq)&&!u.dest){u.landReq=false;if(!buildingAt(u.x,u.y)){u.altTo='landed';u.altT=2}else u.dest={x:u.x+30,y:u.y+20};return}
  if(!u.dest)return;
  const dx=u.dest.x-u.x,dy=u.dest.y-u.y,d=Math.hypot(dx,dy);if(d<6){u.dest=null;return}
  if(u.mode==='attack'&&u.sees.some(e=>e.hp>0&&inRange(u,e)))return;
  const wa=Math.atan2(dy,dx);u.a+=clamp(angDiff(wa,u.a),-(u.d.drone?6:3)*dt,(u.d.drone?6:3)*dt);const s=Math.min(d,u.d.sp*(u.alt==='high'&&!u.d.drone?1.35:1)*(u.kTgt?1.3:1)*dt);u.x+=Math.cos(wa)*s;u.y+=Math.sin(wa)*s;u.moving=true}
/* dronlar: batarya biter, üste şarj olur; kamikaze dron hedefe dalar */
function updDrone(u,dt){u.alt='high';if(u.bat==null)u.bat=u.d.bat;
  if(inBase(u)&&!u.moving){u.bat=Math.min(u.d.bat,u.bat+12*dt);if(u.home&&u.bat>=u.d.bat)u.home=false}else u.bat-=dt;
  if(u.bat<=0){state.curSrc=null;if(u.side===0)log(`${u.d.n}: batarya bitti, düştü`,'bad');u.hp=0;kill(u);return true}
  if(!u.d.fpv&&!u.home&&u.bat<u.d.bat*.2){u.home=true;giveMove(u,u.side?W-120:120,u.y,'move');if(u.side===0)log(`${u.d.n}: batarya azaldı, üsse dönüyor`,'')}
  if(!u.d.fpv)return false;
  if(u.kTgt&&(u.kTgt.hp<=0||u.kTgt.gone||u.kTgt.abandoned))u.kTgt=null;
  /* kamikaze dron gördüğü hedefe kendiliğinden dalar (ateşkes/hold emri yoksa) */
  if(!u.kTgt&&!u.hold){let best=null,bs=1e9;for(const e of state.units){if(e.side===u.side||e.hp<=0||e.gone||flying(e)||e.abandoned||!state.vis[u.side].has(e.id))continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d>460)continue;const sc=d*(e.d.inf?3:e.key==='tank'?.6:1);if(sc<bs){bs=sc;best=e}}if(best)u.kTgt=best}
  if(u.op&&opDroneTick(u))return true;
  if(u.kTgt){const t=u.kTgt,d=Math.hypot(t.x-u.x,t.y-u.y);u.home=false;u.dest={x:t.x,y:t.y};u.mode='move';u.queue=[];
    if(d<14){state.curSrc=u.id;explode(t.x,t.y,.55);if(t.inB)hurtB(t.inB,120,.2);damage(t,AW.fpv,t.x,t.y-40,1);splashDmg(t.x,t.y,AW.fpv,u.side,false,t);suppress(t.x,t.y,40,60,u.side);u.gone=true;u.sel=false;return true}}
  return false}
function launch(e){if(e.st!=='ready')return null;const side=e.side,y=clamp(H/2+gauss()*800,150,H-150),S=SQUADS.find(q=>q.plane===e.key);
  const u=mkUnit(side,e.key,side?W+260:-260,y,null,S.cost);u.ab=e;u.a=u.ta=side?PI:0;u.loiter={x:side?W-650:650,y};e.st='air';e.u=u;
  if(side===0)log(`${u.d.n} kalkış yaptı`,'good');return u}
function steerTo(u,ang,dt){const tr=u.d.turn*(u.burn?.8:1)*dt;u.a+=clamp(angDiff(ang,u.a),-tr,tr)}
function updPlane(u,dt){const d=u.d,ab=u.ab;u.flash-=dt;u.aaCd-=dt;u.lgbCd=(u.lgbCd||0)-dt;
  u.fuel-=dt*(u.burn?3:1);
  if(u.fuel<=0){if(u.side===0)log(`${d.n}: yakıt bitti, pilot atladı`,'bad');u.hp=0;kill(u);return}
  if(!u.fuelWarn&&u.fuel<d.fuel*.25&&!u.rtb){u.fuelWarn=1;if(u.side===0)log(`${d.n}: yakıt azaldı, üsse dön (U)`,'bad')}
  if(!u.rtb&&!u.run&&Object.keys(u.d.pay).length&&!Object.values(u.pay).some(v=>v>=1)){u.rtb=true;if(u.side===0)log(`${d.n}: mühimmat bitti, üsse dönüyor`,'')}
  let tx=u.loiter.x,ty=u.loiter.y,orbit=true;
  if(u.rtb){tx=u.side?W+700:-700;ty=u.y;orbit=false;u.run=null;u.strikes=[]}
  else if(u.run){const r=u.run,ux=(r.bx-r.ax)/r.L,uy=(r.by-r.ay)/r.L;orbit=false;
    if(r.ph==='app'){tx=r.ax-ux*380;ty=r.ay-uy*380;if(Math.hypot(tx-u.x,ty-u.y)<140)r.ph='run'}
    if(r.ph==='run'){tx=r.bx+ux*500;ty=r.by+uy*500;const t=((u.x-r.ax)*ux+(u.y-r.ay)*uy)/r.L;runRelease(u,r,t,ux,uy,dt);
      if(t>1.15){u.run=null;if(r.used)u.pay[r.type]=Math.max(0,u.pay[r.type]-1)}}}
  else if(u.strikes.length){orbit=false;const s=u.strikes[0];if(s.t&&(s.t.hp<=0||s.t.gone))s.t=null;const sx=s.t?s.t.x:s.x,sy=s.t?s.t.y:s.y;tx=sx;ty=sy;
    const dd=Math.hypot(sx-u.x,sy-u.y),ang=Math.atan2(sy-u.y,sx-u.x);
    const sk=strikeKey(u);
    if(!sk||u.pay[sk]<1)u.strikes=[];
    else if(dd<AW[sk].range&&dd>(u.d.uav?120:200)&&Math.abs(angDiff(ang,u.a))<(u.d.uav?1.4:.6)&&u.alt==='high'&&u.lgbCd<=0){u.pay[sk]--;u.lgbCd=u.d.uav?2.5:1.2;u.strikes.shift();
      state.proj.push({k:'lgb',x:u.x,y:u.y,sx:u.x,sy:u.y,tx:sx,ty:sy,t:0,T:dd/(u.d.uav?260:320),w:AW[sk],side:u.side,from:u.id,tgt:s.t,hit:!!s.t,ox:u.x,oy:u.y-60})}}
  else if(u.chase){if(u.chase.hp<=0||u.chase.gone||!state.vis[u.side].has(u.chase.id))u.chase=null;else{tx=u.chase.x;ty=u.chase.y;orbit=false}}
  let ang=Math.atan2(ty-u.y,tx-u.x);if(orbit){const dd=Math.hypot(tx-u.x,ty-u.y);if(dd<320)ang+=PI/2*(dd>170?.55:1)}
  steerTo(u,ang,dt);const sp=d.sp*(u.burn?1.45:1);u.x+=Math.cos(u.a)*sp*dt;u.y+=Math.sin(u.a)*sp*dt;u.moving=true;
  if(!u.rtb){u.x=clamp(u.x,-500,W+500);u.y=clamp(u.y,-400,H+400)}
  planeAuto(u);
  if(u.rtb&&(u.x<-300||u.x>W+300)){u.gone=true;u.sel=false;ab.st='rearm';ab.t=Math.round(d.rearm*(1+.8*(1-u.hp/d.hp)));ab.u=null;if(u.side===0)log(`${d.n} üsse indi, ikmal ${ab.t} sn`,'')}}
function runRelease(u,r,t,ux,uy,dt){const L=r.L;
  if(r.type==='gun'){if(u.pay.gun<1)return;if(t>-.1&&t<1){r.used=1;r.cd-=dt;if(r.cd<=0){r.cd=.06;const s=clamp(t*L+150,0,L),px=r.ax+ux*s-uy*gauss()*10,py=r.ay+uy*s+ux*gauss()*10;
      state.proj.push({k:'agun',x:u.x,y:u.y,sx:u.x,sy:u.y,tx:px,ty:py,t:0,T:Math.hypot(px-u.x,py-u.y)/1500,w:AW.gun,side:u.side,from:u.id});u.flash=.05}}}
  else if(r.type==='rockets'){if(u.pay.rockets<1)return;const n=16;while(r.k<n&&t>-.2+r.k/n*.6){const s=clamp((r.k+.5)/n*L,0,L),px=r.ax+ux*s+gauss()*22,py=r.ay+uy*s+gauss()*22;
      state.proj.push({k:'arock',x:u.x,y:u.y,sx:u.x,sy:u.y,tx:px,ty:py,t:0,T:Math.hypot(px-u.x,py-u.y)/650,w:AW.rockets,side:u.side,from:u.id});r.k++;r.used=1}}
  else if(r.type==='carpet'){if(u.pay.carpet<1)return;const n=16;while(r.k<n&&t>r.k/(n-1)-.25){const s=r.k/(n-1)*L,px=r.ax+ux*s+gauss()*18,py=r.ay+uy*s+gauss()*18;
      state.proj.push({k:'bomb',x:u.x,y:u.y,sx:u.x,sy:u.y,tx:px,ty:py,t:0,T:1.3,w:AW.carpet,side:u.side,from:u.id});r.k++;r.used=1}}}
const strikeKey=u=>u.pay.lgb!=null?'lgb':u.pay.mam!=null?'mam':null;
function planeAuto(u){if(u.aaCd>0||u.hold)return;
  if(u.pay.mam>=1&&!u.strikes.length&&!u.run&&!u.rtb){let best=null,bs=1e9;for(const e of state.units){if(e.side===u.side||flying(e)||e.abandoned||!state.vis[u.side].has(e.id))continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d>900)continue;const sc=d*(e.d.inf?2.5:1);if(sc<bs){bs=sc;best=e}}
    if(best){u.strikes=[{t:best,x:best.x,y:best.y}];u.aaCd=1}}
  if(u.pay.arm>=1){let best=null,bd=AW.arm.range;for(const e of state.units){if(e.side===u.side||!e.d.radar||!e.radarOn)continue;const d=Math.hypot(e.x-u.x,e.y-u.y);
      if(d<bd&&!state.proj.some(p=>p.k==='msl'&&p.tgt===e&&p.side===u.side)){bd=d;best=e}}if(best){u.pay.arm--;u.aaCd=1.5;fireMissile(u,AW.arm,best,u.x,u.y);return}}
  for(const k of ['aam','ir']){if(!(u.pay[k]>=1))continue;const wd=AW[k];let best=null,bd=wd.range;
    for(const e of state.units){if(e.side===u.side||!flying(e)||!state.vis[u.side].has(e.id))continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<bd&&!state.proj.some(p=>p.k==='msl'&&p.tgt===e&&p.side===u.side)){bd=d;best=e}}
    if(best){u.pay[k]--;u.aaCd=2;fireMissile(u,wd,best,u.x,u.y);return}}}
function assignRunFor(u,ax,ay,bx,by){const type=u.runType;if(!type||!(u.pay[type]>=1))return false;
  if(Math.hypot(bx-ax,by-ay)<40){const a=Math.atan2(ay-u.y,ax-u.x),len=type==='carpet'?320:type==='rockets'?220:200;const cx=(ax+bx)/2,cy=(ay+by)/2;ax=cx-Math.cos(a)*len/2;ay=cy-Math.sin(a)*len/2;bx=cx+Math.cos(a)*len/2;by=cy+Math.sin(a)*len/2}
  u.run={ax,ay,bx,by,L:Math.hypot(bx-ax,by-ay)||1,type,ph:'app',k:0,cd:0,used:0};u.strikes=[];u.chase=null;u.rtb=false;
  if(type==='carpet')u.alt='high';else if(!u.d.highOnly)u.alt='low';return true}

export {assignRunFor,launch,moveHeli,strikeKey,updDrone,updPlane};
