/* systems/movement.js — Hareket: arazi hızı, nehir geçişi, engel kaçınma, sıkışma çözme, ezme, doğrudan kontrol, birlik ayrışması. */
import {state} from '../state.js';
import {toW} from '../camera.js';
import {tctx} from '../canvas.js';
import {CROSS,PI,RIV,T,TAU,riverX} from '../config.js';
import {md} from '../state.js';
import {canUse,fire,fireIndirect,hurtB,inRange,kill} from './combat.js';
import {P,breakCover,trackMark} from './effects.js';
import {findPath} from './pathfinding.js';
import {UH,UHW,buildHash,uhash} from './spatial.js';
import {flying,turnTurret} from './units.js';
import {R,angDiff,clamp,gauss,segInfo} from '../utils/helpers.js';
import {exitBld} from '../world/buildings.js';
import {effStance} from '../world/cover.js';
import {buildingAt,cellAt,coversNear,elevAt,isWater} from '../world/terrain.js';

/* ---------- güncelleme ---------- */
function terrSpeed(u){const c=cellAt(u.x,u.y);if(u.d.inf)return c===T.ROAD?1.1:c===T.CONC?1.05:c===T.FOREST?.75:c===T.TOWN?.9:c===T.FORD?.45:c===T.SWAMP?.6:c===T.WATER?.3:1;
  return c===T.ROAD?1.35:c===T.CONC?1.3:c===T.FOREST?.45:c===T.TOWN?.75:c===T.FIELD?.85:c===T.FORD?.4:c===T.SWAMP?.3:c===T.WATER?.2:1}
/* manga birlikte yürür: hedefine en uzak (en geride kalan) üyenin kalan yolu; ondan çok önde olan asker yavaşlayıp bekler */
function sqLag(sq){if(sq.lagT===state.time)return sq.lag;sq.lagT=state.time;let mx=0;
  for(const m of sq.m)if(m.d.inf&&m.hp>0&&!m.gone&&!m.inHeli&&!m.inB&&m.dest&&!m.amv&&!(m.panicT>0)){const d=Math.hypot(m.dest.x-m.x,m.dest.y-m.y);if(d>mx)mx=d}return sq.lag=mx}
/* yokuş yukarı yavaşlar (araçlar piyadeden çok); iniş ve düzlük etkilenmez */
function slopeMul(u,a){const de=elevAt(u.x+Math.cos(a)*16,u.y+Math.sin(a)*16)-elevAt(u.x,u.y);return de>0?1-Math.min(u.d.inf?.25:.4,de*(u.d.inf?1.5:2.5)):1}
/* nehri geçmek gerekiyorsa en uygun köprüyü veya sığ geçidi seç */
function routeFor(u,dx,dy){if(u.d.air)return[];const off=u.x-riverX(u.y);if(Math.abs(off)<RIV.hw+10)return[];const s1=Math.sign(off),s2=Math.sign(dx-riverX(dy))||s1;if(s1===s2)return[];
  let best=[],bc=1e9;for(const c of CROSS){const cx=riverX(c.y),A={x:cx+s1*(RIV.hw+55),y:c.y},B={x:cx-s1*(RIV.hw+55),y:c.y};
    const cost=Math.hypot(A.x-u.x,A.y-u.y)+Math.hypot(B.x-dx,B.y-dy)+(c.t==='ford'?(u.d.inf?80:320):0);if(cost<bc){bc=cost;best=[A,B]}}return best}
/* bina veya suya sıkışan birliği en yakın serbest noktaya çıkar */
function unstick(u){if(u.d.air||u.inB||u.inHeli)return;if(u.d.inf){const b=buildingAt(u.x,u.y);if(b&&b!==u.enterB){const l=u.x-b.x,r=b.x+b.w-u.x,t=b.y+b.h-u.y,tp=u.y-b.y,m=Math.min(l,r,t,tp);if(m===l)u.x=b.x-4;else if(m===r)u.x=b.x+b.w+4;else if(m===tp)u.y=b.y-4;else u.y=b.y+b.h+4}}
  if(cellAt(u.x,u.y)===T.WATER){const sd=Math.sign(u.x-riverX(u.y))||1;u.x=riverX(u.y)+sd*(RIV.hw+28)}}
const outward=(x,y,u)=>Math.abs(x-riverX(y))>Math.abs(u.x-riverX(u.y));
function blockedAt(x,y,u){const b=buildingAt(x,y);if(b&&b!==u.enterB)return true;return isWater(x,y)&&(!isWater(u.x,u.y)||!outward(x,y,u))}
function moveUnit(u,dt){u.moving=false;if(u.inB||!u.dest)return;
  if(u.d.indirect&&u.st!=='travel'){if(u.st==='deployed'||u.st==='deploying'){u.st='packing';u.stT=u.d.packT}return}
  if(u.trk>0)return;
  if(u.pathFor!==u.dest){u.pathFor=u.dest;u.path=routeFor(u,u.dest.x,u.dest.y);u.prog=null;
    if(u.d.inf&&!u.enterB&&buildingAt(u.dest.x,u.dest.y)){const b=buildingAt(u.dest.x,u.dest.y),cx=b.x+b.w/2,cy=b.y+b.h/2,dx=u.x-cx,dy=u.y-cy,sc=Math.min((b.w/2+8)/Math.max(Math.abs(dx),1e-3),(b.h/2+8)/Math.max(Math.abs(dy),1e-3));u.dest={x:cx+dx*sc,y:cy+dy*sc};u.pathFor=u.dest}}
  {const dd=Math.hypot(u.dest.x-u.x,u.dest.y-u.y);if(dd<18&&u.prog&&state.time-u.prog.t>1.2&&!u.enterB&&!u.board&&!u.crewTo){u.dest=null;u.prog=null;return}if(!u.prog||dd<u.prog.d-10){u.prog={d:dd,t:state.time}}else if(state.time-u.prog.t>2&&!(u.sup>65)&&!(u.mode==='attack'&&u.sees.length)){u.prog={d:dd,t:state.time};if(state.time-(u.pfT||-9)>4){u.pfT=state.time;const pth=findPath(u,u.dest.x,u.dest.y);if(pth&&pth.length)u.path=pth;else if(u.d.inf){u.x+=gauss()*6;u.y+=gauss()*6}}}}
  let tg=u.dest;if(u.path&&u.path.length){if(Math.hypot(u.path[0].x-u.x,u.path[0].y-u.y)<18)u.path.shift();if(u.path.length)tg=u.path[0]}
  const dx=tg.x-u.x,dy=tg.y-u.y,d=Math.hypot(dx,dy);
  if(tg===u.dest&&d<5){if(u.d.inf&&!blockedAt(u.dest.x,u.dest.y,u)){u.x=u.dest.x;u.y=u.dest.y}u.dest=null;return}
  if(u.mode==='attack'&&u.sees.some(e=>e.hp>0&&inRange(u,e)))return;
  let wa=Math.atan2(dy,dx),sp=u.d.sp*terrSpeed(u)*slopeMul(u,wa);
  if(u.mode==='fast')sp*=u.d.inf?1.35:1.2;if(u.eng)sp*=.5;
  if(u.d.inf){const st=effStance(u);sp*=st==='prone'?.22:st==='crouch'?.55:1;if(u.sup>65&&!(u.panicT>0))sp*=.35;
    if(u.sq&&u.mode!=='fast'&&!u.amv&&!(u.panicT>0)&&!u.enterB&&!u.board){const rem=Math.hypot(u.dest.x-u.x,u.dest.y-u.y);if(sqLag(u.sq)-rem>45)sp*=.5}
    u.a+=clamp(angDiff(wa,u.a),-7*dt,7*dt);const s=Math.min(d,sp*dt),nx=u.x+Math.cos(wa)*s,ny=u.y+Math.sin(wa)*s;
    if(!blockedAt(nx,ny,u)){u.x=nx;u.y=ny;u.avs=0}
    else{if(!u.avs)u.avs=R()<.5?1:-1;let moved=false;
      for(const sg of [u.avs,-u.avs]){for(const da of [.5,1,1.57,2.2]){const a2=wa+da*sg,tx=u.x+Math.cos(a2)*s,ty=u.y+Math.sin(a2)*s;if(!blockedAt(tx,ty,u)){u.x=tx;u.y=ty;moved=true;break}}if(moved){u.avs=sg;break}}}
    u.moving=true;return}
  let back=false;if(u.d.aF>=4&&Math.abs(angDiff(wa,u.a))>2.1&&d<340){back=true;wa+=PI}
  u.a+=clamp(angDiff(wa,u.a),-u.d.turn*dt,u.d.turn*dt);const al=Math.abs(angDiff(wa,u.a));
  if(u.crush)sp*=.35;
  if(al<.7){const s=Math.min(d,sp*(back?.45:1)*(1-al/.7*.6)*dt)*(back?-1:1),ox=u.x,oy=u.y;u.x+=Math.cos(u.a)*s;u.y+=Math.sin(u.a)*s;
    if(isWater(u.x,u.y)&&(!isWater(ox,oy)||Math.abs(u.x-riverX(u.y))<=Math.abs(ox-riverX(oy)))){u.x=ox;u.y=oy;u.wb=(u.wb||0)+dt;if(u.wb>2.5){u.wb=0;u.dest=null}}else u.wb=0}
  u.moving=true;crushCheck(u,dt)}
function crushCheck(u,dt){const b=buildingAt(u.x,u.y);u.crush=!!b;if(b){hurtB(b,(u.key==='tank'?90:40)*dt);if(R()<dt*6)P({k:'dust',x:u.x,y:u.y,vx:gauss()*10,vy:gauss()*10,r:6,g:22,max:1.5,a:.5})}
  for(const c of coversNear(u.x,u.y)){if(c.r!=null||!isFinite(c.hp))continue;if(segInfo(c,u.x,u.y).d<11){c.hp-=(u.key==='tank'?320:180)*dt;if(c.hp<=0){breakCover(c);break}}}
  u.tmk=(u.tmk||0)+u.d.sp*dt;if(u.tmk>7){u.tmk=0;trackMark(u);if(cellAt(u.x,u.y)===T.FOREST&&R()<.25){const g=tctx,a=R()*TAU,x=u.x+gauss()*8,y=u.y+gauss()*8;g.strokeStyle='rgba(70,52,30,.8)';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*12,y+Math.sin(a)*12);g.stroke();g.fillStyle='rgba(40,60,28,.8)';g.beginPath();g.arc(x+Math.cos(a)*12,y+Math.sin(a)*12,4,0,TAU);g.fill()}}
  if(cellAt(u.x,u.y)!==T.ROAD&&cellAt(u.x,u.y)!==T.CONC&&R()<dt*3)P({k:'dust',x:u.x-Math.cos(u.a)*14,y:u.y-Math.sin(u.a)*14,vx:-Math.cos(u.a)*10,vy:-Math.sin(u.a)*10,r:5,g:18,max:1.3,a:.35})}
function dcControl(u,dt){u.moving=false;const k=state.keys,mw=toW(state.mouse.x,state.mouse.y);
  if(u.inB&&(k.KeyW||k.KeyA||k.KeyS||k.KeyD))exitBld(u,mw.x,mw.y);
  if(u.d.inf){let vx=(k.KeyD?1:0)-(k.KeyA?1:0),vy=(k.KeyS?1:0)-(k.KeyW?1:0);if((vx||vy)&&!u.inB){const l=Math.hypot(vx,vy),st=effStance(u);
      const sp=u.d.sp*terrSpeed(u)*(st==='prone'?.22:st==='crouch'?.55:1)*(u.sup>65?.35:1)*dt;const nx=u.x+vx/l*sp,ny=u.y+vy/l*sp;
      if(!blockedAt(nx,ny,u)){u.x=nx;u.y=ny}u.a=Math.atan2(vy,vx);u.moving=true;u.dig=-1}}
  else if(!(u.d.indirect&&u.st!=='travel')){const turn=(k.KeyD?1:0)-(k.KeyA?1:0);u.a+=turn*u.d.turn*dt;const f=(k.KeyW?1:0)-(k.KeyS?.5:0);
    if(f&&u.trk<=0){const sp=u.d.sp*terrSpeed(u)*(u.crush?.35:1)*f*dt,ox=u.x,oy=u.y;u.x+=Math.cos(u.a)*sp;u.y+=Math.sin(u.a)*sp;if(isWater(u.x,u.y)&&!isWater(ox,oy)){u.x=ox;u.y=oy}u.moving=true;crushCheck(u,dt)}else if(turn)u.moving=true}
  u.dest=null;
  if(!(u.d.indirect&&u.key==='arty'&&u.st!=='deployed'))turnTurret(u,Math.atan2(mw.y-u.y,mw.x-u.x),dt);
  if(md[0])tryManual(u,0,mw);if(md[2]&&u.d.w[1])tryManual(u,1,mw)}
function tryManual(u,i,mw){const w=u.d.w[i];if(!w||u.cd[i]>0)return;
  if(u.d.indirect){if(u.st!=='deployed')return;const d=Math.hypot(mw.x-u.x,mw.y-u.y);if(d>w.r||d<w.min)return;if(Math.abs(angDiff(Math.atan2(mw.y-u.y,mw.x-u.x),u.ta))>.06)return;
    const sh=u.shell;if(u.ammo[0][sh]<1)return;fireIndirect(u,mw.x,mw.y,sh,null);return}
  if(w.stat&&u.moving)return;if(!canUse(u,i))return;
  const ang=Math.atan2(mw.y-u.y,mw.x-u.x);if(u.d.veh&&Math.abs(angDiff(ang,u.ta))>.08)return;
  let px=mw.x,py=mw.y;const d=Math.hypot(px-u.x,py-u.y);if(d>w.r){px=u.x+Math.cos(ang)*w.r;py=u.y+Math.sin(ang)*w.r}
  let t=null,bd=1e9;for(const e of state.units){if(e.side===u.side)continue;const dd=Math.hypot(e.x-px,e.y-py),lim=e.d.inf?14:24;if(dd<lim&&dd<bd){bd=dd;t=e}}
  fire(u,i,t,px,py,true)}
function separate(){buildHash();for(const a of state.units){if(a.inB||a.inHeli||flying(a))continue;const cx=(a.x/UH|0),cy=(a.y/UH|0);for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++){const l=uhash.get((yy+1)*UHW+xx+1);if(l)for(const b of l){if(b.id<=a.id||b.inB||flying(b))continue;
  const dx=b.x-a.x,dy=b.y-a.y,ra=a.d.inf?5:20,rb=b.d.inf?5:20,m=ra+rb,d2=dx*dx+dy*dy;if(d2>=m*m||d2<.01)continue;
  if(a.side!==b.side&&a.d.inf!==b.d.inf){const v=a.d.inf?b:a,s=a.d.inf?a:b;if(v.moving&&!v.d.supply&&!v.abandoned){state.curSrc=v.id;s.hp=0;kill(s);continue}}
  const d=Math.sqrt(d2),p=(m-d)*.25,ux=dx/d,uy=dy/d;
  if(a.d.inf&&!b.d.inf){b.x+=ux*p*.2;b.y+=uy*p*.2;a.x-=ux*p*1.8;a.y-=uy*p*1.8}else if(b.d.inf&&!a.d.inf){a.x-=ux*p*.2;a.y-=uy*p*.2;b.x+=ux*p*1.8;b.y+=uy*p*1.8}
  else if(a.side===b.side&&a.moving!==b.moving)continue;
  else{const aa=anchored(a),ab=anchored(b),ka=aa&&!ab?0:ab&&!aa?2:aa&&ab?.1:1,kb=ab&&!aa?0:aa&&!ab?2:aa&&ab?.1:1;a.x-=ux*p*ka;a.y-=uy*p*ka;b.x+=ux*p*kb;b.y+=uy*p*kb}}}}}
const anchored=u=>u.d.inf&&!u.dest&&!u.moving&&!!u.cov;

export {dcControl,moveUnit,separate,unstick};
