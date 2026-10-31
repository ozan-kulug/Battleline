/* systems/bridges.js — Yıkılabilir köprüler: ağır silah hasarı, yıkım (üstündekiler düşer, geçiş suya döner),
   ikmal kamyonuyla süreli onarım. Köprü kayıtları state.bridges'te (world/terrain.js genTerrain kurar). */
import {state} from '../state.js';
import {DMG,T} from '../config.js';
import {kill} from './combat.js';
import {explode} from './effects.js';
import {flying,giveMove} from './units.js';
import {log} from '../ui/feedback.js';
import {drawBridge,drawBridgeRuin,grid} from '../world/terrain.js';

/* tek kamyonla onarım süresi (sn); en fazla 3 kamyon birlikte hızlandırır */
const REPAIR_T=45;
/* silah türüne göre köprüye hasar çarpanı (dmg ile çarpılır); küçük silahlar köprüye zarar vermez */
const BR_HIT={arty:1.5,mortar:1.5,bomb:1.5,lgb:2,arock:1,rocket:.6,gun:.4,rpg:.4,atgm:.3};
/* köprünün yerel ekseni: u güverte boyunca (dx,dy; güverte yarım boyu L), v enine. Nehir haritasında güverte yataydır */
const loc=(b,x,y)=>{const ox=x-b.x,oy=y-b.y;return{u:ox*b.dx+oy*b.dy,v:-ox*b.dy+oy*b.dx}};
/* (x,y) noktasına pad mesafesindeki köprü */
function bridgeAt(x,y,pad){for(const b of state.bridges){const p=loc(b,x,y),du=Math.max(0,Math.abs(p.u)-b.L),dv=Math.max(0,Math.abs(p.v)-15);if(Math.hypot(du,dv)<=pad)return b}return null}
/* köprü hasar eşiği değişince bildirim ve kara rotalarının yenilenmesi */
function brStage(b,f0){const f1=b.hp/b.max,st=f=>f<DMG.brLight?2:f<DMG.brHeavy?1:0,a=st(f0),c=st(f1);if(a===c)return;
  log(c>a?(c===2?`${b.n}: yalnızca piyade geçebilir`:`${b.n}: ağır araçlar geçemez`):(c===0?`${b.n}: tüm araçlar yeniden geçebilir`:`${b.n}: hafif araçlar yeniden geçebilir`),c>a?'bad':'good');
  for(const u of state.units)if(!u.d.air&&!u.d.naval)u.pathFor=null}
function hitBridge(x,y,w,k){const f=BR_HIT[k];if(!f||!w.dmg)return;const b=bridgeAt(x,y,(w.splash||8)*.5);if(!b||b.dead)return;const f0=b.hp/b.max;b.hp-=w.dmg*f;if(b.hp<=0)destroyBridge(b);else brStage(b,f0)}
function destroyBridge(b){b.dead=true;b.hp=0;b.rep=0;for(const i of b.cells)grid[i]=T.WATER;drawBridgeRuin(b);state.mmDirty=true;
  for(let k=-2;k<=2;k++)explode(b.x+b.dx*k*22,b.y+b.dy*k*22,.9);
  for(const u of state.units){if(flying(u)||u.d.naval||u.hp<=0||u.inHeli)continue;const p=loc(b,u.x,u.y);if(Math.abs(p.v)<18&&Math.abs(p.u)<b.L-18){state.curSrc=null;u.hp=0;kill(u)}}
  /* kara birlikleri rotalarını yeniden hesaplasın (geçit veya diğer köprüler) */
  for(const u of state.units)if(!u.d.air&&!u.d.naval)u.pathFor=null;
  log(`${b.n} yıkıldı`,'')}
const ends=b=>{const e=b.L+30;return[{x:b.x-b.dx*e,y:b.y-b.dy*e},{x:b.x+b.dx*e,y:b.y+b.dy*e}]};
const nearEnd=(u,b)=>ends(b).some(e=>Math.hypot(u.x-e.x,u.y-e.y)<70);
/* kamyon nehrin kendi tarafındaki köprü başına gider ve onarıma başlar */
function orderRepair(u,b){const e=ends(b),p=loc(b,u.x,u.y).u<0?e[0]:e[1];giveMove(u,p.x,p.y,'move');u.repB=b}
/* aynı köprüde 2 kamyon kaybı (ölü ya da pusudan ağır hasarlı dönüş): YZ o köprüden 240 sn uzak durur */
function brLoss(b,side){const l=b.loss=b.loss||[0,0];if(++l[side]>=2){(b.aiNext=b.aiNext||[0,0])[side]=state.time+240;l[side]=0}}
/* yıkık köprü REPAIR_T içinde yeniden kurulur; hasarlı köprünün canı aynı hızla dolar */
function updBridges(dt){for(const b of state.bridges){if(!b.dead&&b.hp>=b.max)continue;let n=0;
  for(const u of state.units){if(u.repB!==b)continue;if(u.hp<=0||u.abandoned||u.gone){if(u.hp<=0)brLoss(b,u.side);u.repB=null;continue}if(!u.dest&&!u.moving&&nearEnd(u,b))n++}
  if(!n)continue;if(b.dead){b.rep+=dt*Math.min(3,n)/REPAIR_T;if(b.rep>=1)restoreBridge(b);continue}
  const f0=b.hp/b.max;b.hp=Math.min(b.max,b.hp+b.max*dt*Math.min(3,n)/REPAIR_T);brStage(b,f0);if(b.hp>=b.max)for(const u of state.units)if(u.repB===b)u.repB=null}}
function restoreBridge(b){b.dead=false;b.hp=b.max;b.rep=0;for(const i of b.cells)grid[i]=T.ROAD;drawBridge(b);state.mmDirty=true;
  for(const u of state.units){if(u.repB===b)u.repB=null;if(!u.d.air&&!u.d.naval)u.pathFor=null}
  log(`${b.n} onarıldı`,'good')}

export {brLoss,bridgeAt,destroyBridge,ends,hitBridge,nearEnd,orderRepair,updBridges};
