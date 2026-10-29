/* systems/bridges.js — Yıkılabilir köprüler: ağır silah hasarı, yıkım (üstündekiler düşer, geçiş suya döner),
   ikmal kamyonuyla süreli onarım. Köprü kayıtları state.bridges'te (world/terrain.js genTerrain kurar). */
import {state} from '../state.js';
import {RIV,T,riverX} from '../config.js';
import {kill} from './combat.js';
import {explode} from './effects.js';
import {flying,giveMove} from './units.js';
import {log} from '../ui/feedback.js';
import {drawBridge,drawBridgeRuin,grid} from '../world/terrain.js';

/* tek kamyonla onarım süresi (sn); en fazla 3 kamyon birlikte hızlandırır */
const REPAIR_T=45;
/* silah türüne göre köprüye hasar çarpanı (dmg ile çarpılır); küçük silahlar köprüye zarar vermez */
const BR_HIT={arty:1.5,mortar:1.5,bomb:1.5,lgb:2,arock:1,rocket:.6,gun:.4,rpg:.4,atgm:.3};
const span=b=>{const cx=riverX(b.y);return{x0:cx-RIV.hw-24,x1:cx+RIV.hw+24,cx}};
/* (x,y) noktasına pad mesafesindeki köprü */
function bridgeAt(x,y,pad){for(const b of state.bridges){const s=span(b),dx=x<s.x0?s.x0-x:x>s.x1?x-s.x1:0,dy=Math.max(0,Math.abs(y-b.y)-15);if(Math.hypot(dx,dy)<=pad)return b}return null}
function hitBridge(x,y,w,k){const f=BR_HIT[k];if(!f||!w.dmg)return;const b=bridgeAt(x,y,(w.splash||8)*.5);if(!b||b.dead)return;b.hp-=w.dmg*f;if(b.hp<=0)destroyBridge(b)}
function destroyBridge(b){b.dead=true;b.hp=0;b.rep=0;for(const i of b.cells)grid[i]=T.WATER;drawBridgeRuin(b.y);state.mmDirty=true;const s=span(b);
  for(let k=-2;k<=2;k++)explode(s.cx+k*22,b.y,.9);
  for(const u of state.units){if(flying(u)||u.d.naval||u.hp<=0||u.inHeli)continue;if(Math.abs(u.y-b.y)<18&&Math.abs(u.x-s.cx)<RIV.hw+6){state.curSrc=null;u.hp=0;kill(u)}}
  /* kara birlikleri rotalarını yeniden hesaplasın (geçit veya diğer köprüler) */
  for(const u of state.units)if(!u.d.air&&!u.d.naval)u.pathFor=null;
  log(`${b.n} yıkıldı`,'')}
const ends=b=>{const s=span(b);return[{x:s.x0-30,y:b.y},{x:s.x1+30,y:b.y}]};
const nearEnd=(u,b)=>ends(b).some(e=>Math.hypot(u.x-e.x,u.y-e.y)<70);
/* kamyon nehrin kendi tarafındaki köprü başına gider ve onarıma başlar */
function orderRepair(u,b){const e=ends(b),p=u.x<riverX(u.y)?e[0]:e[1];giveMove(u,p.x,p.y,'move');u.repB=b}
function updBridges(dt){for(const b of state.bridges){if(!b.dead)continue;let n=0;
  for(const u of state.units){if(u.repB!==b)continue;if(u.hp<=0||u.abandoned||u.gone){u.repB=null;continue}if(!u.dest&&!u.moving&&nearEnd(u,b))n++}
  if(n){b.rep+=dt*Math.min(3,n)/REPAIR_T;if(b.rep>=1)restoreBridge(b)}}}
function restoreBridge(b){b.dead=false;b.hp=b.max;b.rep=0;for(const i of b.cells)grid[i]=T.ROAD;drawBridge(b.y);state.mmDirty=true;
  for(const u of state.units){if(u.repB===b)u.repB=null;if(!u.d.air&&!u.d.naval)u.pathFor=null}
  log(`${b.n} onarıldı`,'good')}

export {bridgeAt,destroyBridge,ends,hitBridge,nearEnd,orderRepair,updBridges};
