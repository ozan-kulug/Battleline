/* systems/drones.js — Dron operatörü: kamikaze dron fırlatma, kontrol bağlantısı, geri alma ve operatör yapay zekâsı.
   Otomatik modda operatör hedefi kendisi seçer: zor durumdaki dostların yanındaki ve ele geçirilmekte olan noktalardaki düşmanlar önce gelir,
   sonra cephedeki değerli hedefler (topçu, tank, zırhlı, toplu piyade). Oyuncu modunda (state.droneManual) oyuncunun dronlarını oyuncu yönetir. */
import {state} from '../state.js';
import {kill} from './combat.js';
import {flying,mkUnit} from './units.js';
import {log} from '../ui/feedback.js';

const opDrones=u=>state.units.filter(d=>d.op===u&&d.hp>0&&!d.gone);
const manualFor=side=>side===0&&state.droneManual;
function opLog(u,t,c){if(u.side!==0)return;const k=u.sq||u;if(state.time-(k.dlogT||-99)<6)return;k.dlogT=state.time;log(`${u.d.n}: ${t}`,c||'')}
/* operatörden bir dron kaldırır; tgt verilirse doğrudan hedefe dalar */
function launchDrone(u,tgt){if(!(u.drones>=1)||u.hp<=0)return null;u.drones--;
  let sq=u.dsq;if(!sq||!state.squads.has(sq.id)){sq={id:state.sqid++,side:u.side,k:'opfpv',n:'Kamikaze Dron',m:[],orderT:0,obj:null,dug:0};state.squads.set(sq.id,sq);u.dsq=sq}
  const a=u.ta,d=mkUnit(u.side,'fpv',u.x+Math.cos(a)*12,u.y+Math.sin(a)*12,sq,12);sq.m.push(d);
  d.op=u;d.alt='high';d.a=d.ta=a;d.manual=manualFor(u.side);d.bat=d.d.bat;
  if(tgt)d.kTgt=tgt;else d.dest={x:u.x+Math.cos(a)*70,y:u.y+Math.sin(a)*70};u.reveal=Math.max(u.reveal,1.5);return d}
/* operatör hedef seçimi (yalnızca tarafın gördüğü düşmanlar, kontrol menzili içinde) */
function pickOpTarget(u){const side=u.side,R=u.d.ctrl*.9;let best=null,bs=18;
  const taken=new Set(state.units.filter(d=>d.op&&d.side===side&&d.kTgt).map(d=>d.kTgt));
  const hurt=state.units.filter(f=>f.side===side&&!flying(f)&&!f.abandoned&&state.time-f.shotAtT<5);
  const flak=state.units.filter(e=>e.side!==side&&state.vis[side].has(e.id)&&e.d.w.some(w=>w.k==='flak'));
  for(const e of state.units){if(e.side===side||flying(e)||e.abandoned||e.hp<=0||e.gone||!state.vis[side].has(e.id)||taken.has(e))continue;
    const d=Math.hypot(e.x-u.x,e.y-u.y);if(d>R)continue;
    let s=e.val||20;
    if(e.d.indirect)s*=1.8;else if(e.key==='tank')s*=1.6;else if(e.d.veh)s*=1.3;
    else if(e.d.inf){let n=0;for(const o of state.units)if(o.side===e.side&&o.d.inf&&Math.abs(o.x-e.x)<45&&Math.hypot(o.x-e.x,o.y-e.y)<45)n++;s*=.4+.3*n}
    if(hurt.some(f=>Math.hypot(f.x-e.x,f.y-e.y)<420))s*=2;
    if(state.objs.some(o=>o.owner===side&&o.c&&o.c[1-side]&&Math.hypot(o.x-e.x,o.y-e.y)<o.r+80))s*=1.6;
    if(flak.some(a=>Math.hypot(a.x-e.x,a.y-e.y)<420))s*=.45;
    s*=1-.3*d/R;if(s>bs){bs=s;best=e}}
  return best}
/* her kare: otomatik modda boştaki operatör bekleme süresi dolunca hedefe dron gönderir (aynı anda en fazla 2) */
function opTick(u,dt){u.opCd=(u.opCd||0)-dt;if(u.panicT>0||u.stunT>0||u.inHeli||u.hp<=0||u.abandoned)return;
  if(manualFor(u.side)||u.hold||u.opCd>0||!(u.drones>=1))return;
  if(opDrones(u).length>=2){u.opCd=1;return}
  const t=pickOpTarget(u);u.opCd=t?7:1.5;if(!t)return;launchDrone(u,t);opLog(u,`kamikaze dron ${t.d.n.toLocaleLowerCase('tr')} hedefine gönderildi`)}
/* operatöre bağlı dron: bağlantı ve geri alma. true dönerse dron sahneden çıktı */
function opDroneTick(u){const o=u.op;
  if(!o||o.hp<=0||o.gone||o.side!==u.side||o.abandoned){u.hp=0;state.curSrc=null;kill(u);opLog(u,'operatör kayıp, dron bağlantısı koptu','bad');return true}
  const d=Math.hypot(o.x-u.x,o.y-u.y);if(d>o.d.ctrl){u.hp=0;state.curSrc=null;kill(u);opLog(o,'dron kontrol menzilini aştı, bağlantı koptu','bad');return true}
  /* otomatik dron hedefsiz kalır veya bataryası azalırsa operatöre döner; oyuncunun dronu yalnızca "üsse dön" ile döner */
  if(!u.kTgt&&!u.manual&&(!u.dest||u.bat<u.d.bat*.25))u.home=true;
  if(u.home&&!u.kTgt){u.dest={x:o.x,y:o.y};u.mode='move';if(d<24){o.drones=Math.min(o.d.drones,o.drones+1);u.gone=true;u.sel=false;opLog(o,'dron geri alındı');return true}}
  return false}

export {launchDrone,manualFor,opDrones,opDroneTick,opTick,pickOpTarget};
