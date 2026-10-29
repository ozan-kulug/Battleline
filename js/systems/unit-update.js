/* systems/unit-update.js — Tek bir birliğin her karedeki güncellemesi (tüm sistemleri sırayla çağırır). */
import {state} from '../state.js';
import {W} from '../config.js';
import {moveHeli,updDrone,updPlane} from './air.js';
import {updIndirect} from './artillery.js';
import {canUse,fire,kill,launchAA,pickTarget,throwGren} from './combat.js';
import {nearSupply} from './economy.js';
import {popSmoke} from './effects.js';
import {initiative} from './initiative.js';
import {dcControl,moveUnit,unstick} from './movement.js';
import {exfilOut} from './orders.js';
import {rank,turnTurret} from './units.js';
import {log} from '../ui/feedback.js';
import {R,angDiff,clamp,gauss} from '../utils/helpers.js';
import {enterBld,exitBld} from '../world/buildings.js';
import {makeFox} from '../world/cover.js';

function updUnit(u,dt){
  if(((u.id+((state.time*4)|0))&3)===0&&!u.d.air)unstick(u);
  if(u.d.plane){updPlane(u,dt);return}
  if(u.d.drone&&updDrone(u,dt))return;
  if(u.exfil&&(u.side?u.x>W-30:u.x<30)){exfilOut(u);return}
  if(u.d.radar){if(u.radarT>0){u.radarT-=dt;if(u.radarT<=0){u.radarT=0;u.radarOn=true}}if(u.radarOffT>0){u.radarOffT-=dt;if(u.radarOffT<=0&&!u.radarOn)u.radarT=5}}
  if(u.fire>0){u.fire-=dt;state.curSrc=null;u.hp-=3*dt;if(R()<dt*8)state.parts.push({x:u.x+gauss()*6,y:u.y+gauss()*6,vx:gauss()*6,vy:-6+gauss()*4,life:0,max:.8,r:3,g:7,col:'rgba(255,150,60,.85)',fire:1});if(u.hp<=0){kill(u);return}}
  if(u.abandoned){u.moving=false;u.dest=null;return}
  u.stunT-=dt;u.apsCd-=dt;u.opt-=dt;
  if(u.panicT>0){u.panicT-=dt;if(u.panicT<=0){u.sup=55;u.dest=null}}
  if(u.crewTo){const v=u.crewTo;if(v.hp<=0||!v.abandoned){u.crewTo=null}else{u.dest={x:v.x,y:v.y};u.mode='move';
    if(Math.hypot(v.x-u.x,v.y-u.y)<26){const old=v.side;v.side=u.side;v.abandoned=false;v.sup=30;v.stunT=0;v.queue=[];if(u.inB)exitBld(u,v.x,v.y);if(u.sq)u.sq.m=u.sq.m.filter(x=>x!==u);u.gone=true;u.sel=false;
      const sq={id:state.sqid++,side:u.side,k:v.key,n:v.d.n,m:[v],orderT:0,obj:null,dug:0};state.squads.set(sq.id,sq);v.sq=sq;
      if(u.side===0||old===0)log(old!==u.side?(u.side===0?`Düşman ${v.d.n.toLocaleLowerCase('tr')} ele geçirildi`:`${v.d.n} düşmanın eline geçti`):`${v.d.n} yeniden mürettebat aldı`,u.side===0?'good':'bad');return}}}
  if(u.board){const h=u.board;if(h.hp<=0||h.gone||h.abandoned||h.cargo.length>=h.d.cap){u.board=null}else{if(h.d.heli&&h.alt!=='landed'&&!h.dest&&!(h.altT>0))h.landReq=true;u.dest={x:h.x,y:h.y};u.mode='move';
    if(Math.hypot(h.x-u.x,h.y-u.y)<28&&(h.d.heli?(h.alt==='landed'&&!(h.altT>0)):!h.moving)){if(u.inB)exitBld(u,h.x,h.y);h.cargo.push(u);u.inHeli=h;u.board=null;u.sel=false;u.dest=null;u.cov=null}}}
  u.reveal-=dt;u.flash-=dt;u.recoil=Math.max(0,u.recoil-dt*3);u.gcd-=dt;
  if(u.trk>0||u.tur>0){const k=nearSupply(u)?3:1;u.trk-=dt*k;u.tur-=dt*k}
  if(state.time-u.supT>2)u.sup=Math.max(0,u.sup-(u.d.inf?10:14)*(u.cov||u.inB?1.5:1)*(1+.15*rank(u))*dt);
  if(u.focus&&u.focus.hp<=0)u.focus=null;
  for(let i=0;i<u.cd.length;i++)u.cd[i]-=dt;
  const isDC=state.dc===u;
  if(u.enterB&&!u.inB){const b=u.enterB;if(b.dead){u.enterB=null;u.dest=null}else if(u.x>b.x-7&&u.x<b.x+b.w+7&&u.y>b.y-7&&u.y<b.y+b.h+7)enterBld(u,b)}
  if(u.dig>=0){if(u.dest||u.inB){u.dig=-1}else{u.dig+=dt/10*(u.sup>40?.4:1);if(u.dig>=1){makeFox(u);u.dig=-1}}}
  if(u.d.indirect)updIndirect(u,dt,isDC);
  else if(!isDC){let aim=null;
    if(!u.hold&&!(u.panicT>0)&&!(u.stunT>0)&&!(u.mode==='fast'&&u.dest)&&!(u.d.heli&&(u.alt==='landed'||u.altT>0)))u.d.w.forEach((w,i)=>{if(w.stat&&u.moving)return;const t=pickTarget(u,w,i);if(!t)return;
      if(u.fm==='ret'&&!w.aaOnly&&state.time-u.shotAtT>6&&Math.hypot(t.x-u.x,t.y-u.y)>w.r*.5)return;
      if(!aim&&!w.aaOnly)aim=t;
      if(u.lts[i]!==t){u.lts[i]=t;u.sol[i]=state.time+(u.d.inf?.35:.9)*(1-.1*rank(u));u.stk[i]=0}if(state.time<u.sol[i]||u.cd[i]>0)return;
      if(w.aaOnly){launchAA(u,i,t);return}
      if(u.d.veh&&i===0&&Math.abs(angDiff(Math.atan2(t.y-u.y,t.x-u.x),u.ta))>.1)return;
      if(u.d.inf&&i>0&&u.d.w[0].anti&&canUse(u,0)&&pickTarget(u,u.d.w[0],0))return;
      fire(u,i,t)});
    if(u.key==='rifle'&&u.gren>=1&&u.gcd<=0&&!u.hold&&!u.inB){for(const e of u.sees){if(e.hp<=0||!e.d.inf)continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<95&&d>18&&(e.inB||e.cov)){throwGren(u,e);break}}}
    if(u.focus&&!state.vis[u.side].has(u.focus.id))u.focus=null;
    if(u.focus&&u.mode==='focus'&&!u.inB){const d=Math.hypot(u.focus.x-u.x,u.focus.y-u.y);if(d>u.d.w[0].r*.9||!u.sees.includes(u.focus))u.dest={x:u.focus.x,y:u.focus.y};else u.dest=null}
    const want=aim?Math.atan2(aim.y-u.y,aim.x-u.x):(u.d.inf?(u.moving?u.a:(u.faceA??u.ta)):(!u.moving&&u.faceA!=null?u.faceA:u.a));
    turnTurret(u,want,dt);if(u.d.heli&&!u.moving&&aim)u.a+=clamp(angDiff(u.ta,u.a),-2*dt,2*dt);
    if(u.side===1&&u.d.smokeL&&u.smokeL>=1&&u.hp<u.d.hp*.55&&u.sees.some(e=>e.d.w[0]&&e.d.w[0].anti)&&R()<dt*.5)popSmoke(u);
  }
  if(u.d.heli)moveHeli(u,dt);else if(isDC)dcControl(u,dt);else moveUnit(u,dt);
  if(!isDC)initiative(u,dt);
  if(!u.d.inf&&!u.d.air&&!u.dest&&!u.moving&&u.faceA!=null&&u.init!=='off'&&u.trk<=0&&!u.d.indirect&&!u.d.supply&&!(u.stunT>0)&&!u.abandoned&&Math.abs(angDiff(u.faceA,u.a))>.08)u.a+=clamp(angDiff(u.faceA,u.a),-u.d.turn*.6*dt,u.d.turn*.6*dt);
  if(!u.dest&&u.queue.length&&!u.inB&&!(u.panicT>0))u.dest=u.queue.shift();
  if(u.d.veh&&u.hp<u.d.hp*.35&&R()<dt*5)state.parts.push({x:u.x+gauss()*6,y:u.y+gauss()*6,vx:6+gauss()*4,vy:-4+gauss()*4,life:0,max:2.5,r:4,g:18,col:'rgba(40,38,34,.5)'});
}

export {updUnit};
