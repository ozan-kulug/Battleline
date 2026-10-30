/* systems/projectiles.js — Mermi, füze ve bomba uçuşu ile çarpma sonuçları. */
import {state} from '../state.js';
import {T,bodyR} from '../config.js';
import {recentImp} from '../state.js';
import {hitBridge} from './bridges.js';
import {damage,hurtB,splashDmg,suppress} from './combat.js';
import {P,crater,damageCovers,explode,flareFx,igniteAt,mkSmoke,puff} from './effects.js';
import {flying} from './units.js';
import {los} from './vision.js';
import {R,clamp,gauss,segInfo} from '../utils/helpers.js';
import {buildingAt,cellAt} from '../world/terrain.js';

function updMissile(p,dt,i){p.life-=dt;const t=p.tgt;state.curSrc=p.from;
  if(!p.lost){if(t&&t.hp>0&&!t.gone&&(p.mk!=='arm'||t.radarOn)&&(p.mk==='arm'||flying(t))){p.ax=t.x;p.ay=t.y}else{p.lost=1;if(p.mk==='arm'){p.ax+=gauss()*70;p.ay+=gauss()*70}}}
  if(!p.lost&&!p.fl&&t&&t.flares>=1&&p.mk!=='arm'&&Math.hypot(t.x-p.x,t.y-p.y)<320){p.fl=1;t.flares--;flareFx(t);if(R()<(p.mk==='irm'?.55:.3)){p.lost=1;p.ax=t.x+gauss()*70;p.ay=t.y+gauss()*70}}
  const dx=p.ax-p.x,dy=p.ay-p.y,d=Math.hypot(dx,dy),st=p.sp*dt;
  if(R()<.8)state.parts.push({x:p.x,y:p.y,vx:gauss()*3,vy:gauss()*3,life:0,max:1.1,r:1.5,g:6,col:'rgba(225,222,212,.4)'});
  if(d<=st+6||p.life<=0){state.proj.splice(i,1);
    if(!p.lost&&t&&t.hp>0){let pk=p.w.pk;if(t.burn)pk*=.85;if(p.mk==='sam'&&t.alt==='low')pk*=.85;if(R()<pk){explode(t.x,t.y,.6);damage(t,p.w,p.x,p.y,1)}else explode(p.x+gauss()*20,p.y+gauss()*20,.3)}
    else explode(p.x,p.y,.3);return}
  p.a=Math.atan2(dy,dx);p.x+=dx/d*st;p.y+=dy/d*st}
/* gemi yakın savunması (CIWS): her top, bu gemiye doğru gelen en yakın düşman roket, füze, bomba ya da mermisiyle uğraşır;
   vurursa mermi havada patlar, ıskalarsa (p.pd) diğer toplar yine deneyebilir. Her angajman 0,7 sn sürer */
const PD_K=new Set(['rpg','atgm','rocket','arock','gun','arty','mortar','bomb','lgb','msl']);
function pointDefense(dt){for(const u of state.units){const n=u.d.ciws;if(!n||u.hp<=0||u.abandoned)continue;const cd=u.pdCd||(u.pdCd=[]),near=bodyR(u.d)+60;
  for(let m=0;m<n;m++){cd[m]=(cd[m]||0)-dt;if(cd[m]>0)continue;let bi=-1,bd=u.d.ciwsR;
    for(let i=0;i<state.proj.length;i++){const p=state.proj[i];if(p.side===u.side||!PD_K.has(p.k)||(p.pd||0)>=n)continue;const tx=p.k==='msl'?p.ax:p.tx,ty=p.k==='msl'?p.ay:p.ty;
      if(Math.hypot(tx-u.x,ty-u.y)>near)continue;const d=Math.hypot(p.x-u.x,p.y-u.y);if(d<bd){bd=d;bi=i}}
    if(bi<0)continue;const p=state.proj[bi];cd[m]=.7;u.flash=.05;state.parts.push({x:u.x,y:u.y,vx:(p.x-u.x)*2,vy:(p.y-u.y)*2,life:0,max:.3,r:1.2,g:1,col:'rgba(255,210,120,.9)'});
    if(R()<u.d.ciwsPk){state.proj.splice(bi,1);explode(p.x,p.y,.35)}else p.pd=(p.pd||0)+1}}}
function updProj(dt){pointDefense(dt);for(let i=state.proj.length-1;i>=0;i--){const p=state.proj[i];
  if(p.k==='msl'){updMissile(p,dt,i);continue}
  if(p.k==='atgm'&&p.hit&&p.src){const s=p.src,t=p.tgt;if(s.hp<=0||s.gone||s.sup>70||s.stunT>0||s.panicT>0||(t&&!los(s.x,s.y,t.x,t.y,s.inB?s.inB.i:-1,t.inB?t.inB.i:-1,s.d.heli&&s.alt==='high',s.d.heli&&s.alt==='high'))){p.hit=false;p.tx+=gauss()*34;p.ty+=gauss()*34}}
  if(p.hit&&p.tgt&&p.tgt.hp>0){p.tx=p.tgt.x;p.ty=p.tgt.y}
  p.t+=dt;const f=Math.min(1,p.t/p.T);p.x=p.sx+(p.tx-p.sx)*f;p.y=p.sy+(p.ty-p.sy)*f;
  if((p.k==='atgm'||p.k==='rpg'||p.k==='arock'||p.k==='rocket')&&R()<.7)state.parts.push({x:p.x,y:p.y,vx:gauss()*4,vy:gauss()*4,life:0,max:.9,r:2,g:7,col:'rgba(210,205,190,.45)'});
  if(f>=1){state.proj.splice(i,1);impact(p)}}}
function bldSplash(x,y,w,side){for(const b of state.buildings){if(b.dead)continue;const cx=clamp(x,b.x,b.x+b.w),cy=clamp(y,b.y,b.y+b.h),d=Math.hypot(cx-x,cy-y);
  if(d<w.splash){hurtB(b,w.dmg*1.3*(1-d/w.splash),w.k==='bomb'||w.k==='lgb'?.4:.22);for(const o of [...b.occ])if(o.side!==side&&R()<.5)damage(o,w,x,y,.25)}}}
function impact(p){const w=p.w,x=p.tx,y=p.ty;state.curSrc=p.from;if(p.shell!=='smoke')hitBridge(x,y,w,p.k);
  if(p.hit&&p.tgt&&p.tgt.hp>0&&p.tgt.aps>=1&&p.tgt.apsCd<=0&&!p.tgt.abandoned&&(p.k==='rpg'||p.k==='atgm'||p.k==='rocket'||p.k==='gun')&&R()<(w.pen==='heat'?.8:.3)){
    const t=p.tgt,a=Math.atan2(p.oy-t.y,p.ox-t.x);t.aps--;t.apsCd=4;explode(t.x+Math.cos(a)*18,t.y+Math.sin(a)*18,.3);return}
  if(p.k==='arty'||p.k==='mortar'){if(p.shell==='smoke'){state.smokes.push(mkSmoke(x,y,p.k==='arty'?80:55,p.k==='arty'?45:30));puff(x,y,8,'rgba(235,235,230,.6)',24);return}
    recentImp.push({x,y,t:state.time});if(recentImp.length>60)recentImp.shift();
    explode(x,y,p.k==='arty'?1.25:.75);crater(x,y,p.k==='arty'?18:10);damageCovers(x,y,w.splash*.6,w.dmg*1.5);if(cellAt(x,y)===T.FOREST)igniteAt(x,y,p.k==='arty'?26:14,p.k==='arty'?.35:.2);splashDmg(x,y,w,p.side,false,null);suppress(x,y,w.splash*1.8,w.sup,p.side);
    bldSplash(x,y,w,p.side);return}
  if(p.k==='agun'||p.k==='arock'||p.k==='bomb'||p.k==='lgb'){explode(x,y,p.k==='agun'?.22:p.k==='arock'?.5:1.4);if(p.k!=='agun'){crater(x,y,p.k==='arock'?9:24);damageCovers(x,y,w.splash*.6,w.dmg*1.2);if(cellAt(x,y)===T.FOREST)igniteAt(x,y,p.k==='arock'?14:40,p.k==='arock'?.15:.55)}else if(R()<.4)puff(x,y,1,'rgba(150,130,95,.6)',8);
    if(p.k==='lgb'&&p.tgt&&p.tgt.hp>0&&Math.hypot(p.tgt.x-x,p.tgt.y-y)<24)damage(p.tgt,w,x,y,1);
    splashDmg(x,y,w,p.side,false,p.k==='lgb'?p.tgt:null);suppress(x,y,w.splash*1.8,w.sup,p.side);if(p.k!=='agun')bldSplash(x,y,w,p.side);return}
  if(p.k==='gren'){explode(x,y,.35);damageCovers(x,y,20,40);const b=p.tgtB;if(b&&!b.dead){const occ=b.occ.filter(o=>o.side!==p.side);for(let k=0;k<3&&occ.length;k++){const o=occ.splice(R()*occ.length|0,1)[0];damage(o,w,x,y,.55)}hurtB(b,30)}
    splashDmg(x,y,w,p.side,true,null);suppress(x,y,60,w.sup,p.side);return}
  const big=p.k==='gun'||p.k==='rpg'||p.k==='atgm'||p.k==='rocket';
  if(p.hit&&p.tgt&&p.tgt.hp>0){const t=p.tgt;if(big)explode(x,y,.5);else if(p.k==='auto')puff(x,y,2,'rgba(255,200,120,.6)',6);
    damage(t,w,p.ox,p.oy,1);if(t.d.inf){t.sup=Math.min(100,t.sup+w.sup*1.5);t.supT=state.time}if(t.inB&&big)hurtB(t.inB,w.dmg*.6,.15)}
  else if(big){explode(x,y,.4);if(p.k!=='atgm')crater(x,y,6);damageCovers(x,y,22,w.dmg*.6);const b=buildingAt(x,y);if(b)hurtB(b,w.dmg*.8,.12);if(cellAt(x,y)===T.FOREST&&R()<.25)igniteAt(x,y,10,.4)}
  else if(!p.hit&&p.k!=='flak'&&R()<.3)P({k:'dust',x,y,vx:gauss()*6,vy:gauss()*6,r:2,g:7,max:.6,a:.5});
  else if(p.tgt&&p.tgt.cov&&p.tgt.cov.x1!=null&&R()<.6){const s=segInfo(p.tgt.cov,p.tgt.x,p.tgt.y);puff(s.px,s.py,2,'rgba(170,150,105,.65)',6)}
  if(w.splash&&(p.k==='gun'||p.k==='rpg'||p.k==='rocket'))splashDmg(x,y,{...w,dmg:w.dmg*.35},p.side,false,p.hit?p.tgt:null);
  suppress(x,y,w.splash?w.splash*2:26,w.sup,p.side)}

export {updProj};
