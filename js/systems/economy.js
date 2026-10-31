/* systems/economy.js — Ekonomi ve hedefler: nokta ele geçirme, gelir, bakım gideri, ikmal, kart iadesi. */
import {state} from '../state.js';
import {tr} from '../i18n.js';
import {AIDIF,CS,ECON,GW,SQUADS,W,ZK} from '../config.js';
import {damage,panic,stress} from './combat.js';
import {fireCells} from './effects.js';
import {addKP,flying,inBase,upkMul} from './units.js';
import {endGame,log} from '../ui/feedback.js';
import {updZones,zoneEff} from './zones.js';
import {$,R,clamp} from '../utils/helpers.js';

function nearSupply(u){for(const s of state.units)if(s.d.supply&&s.side===u.side&&s!==u&&(s.x-u.x)**2+(s.y-u.y)**2<130*130)return true;return inBase(u)}
let objAcc=0;
function updObjs(dt0){objAcc+=dt0;if(objAcc<.25)return;const dt=objAcc;objAcc=0;for(const o of state.objs){const c=[0,0];for(const u of state.units){if(u.d.indirect&&u.d.veh||u.d.supply||u.d.air||u.d.naval||u.abandoned||u.panicT>0||u.x<0||u.x>W)continue;if((u.x-o.x)**2+(u.y-o.y)**2<o.r*o.r)c[u.side]++}
  o.c=c;let rate=0;if(c[0]&&!c[1])rate=Math.min(c[0],4)*6;else if(c[1]&&!c[0])rate=-Math.min(c[1],4)*6;
  /* çekişmeli bölge: iki taraf da varsa yavaşça tarafsıza kayar */
  else if(c[0]&&c[1]&&o.own)rate=-Math.sign(o.own)*Math.min(ECON.contestDecay,Math.abs(o.own)/dt);
  const prev=o.owner;o.own=clamp(o.own+rate*dt,-100,100);
  if(o.own>=100)o.owner=0;else if(o.own<=-100)o.owner=1;else if((o.owner===0&&o.own<=0)||(o.owner===1&&o.own>=0))o.owner=-1;
  if(prev!==o.owner&&o.owner!==-1)log(o.owner===0?`${o.n} noktası ele geçirildi`:`${o.n} noktası düşmana geçti`,o.owner===0?'good':'bad');
  else if(prev!==o.owner&&prev!==-1)log(`${o.n} noktası tarafsız`,'')}}
function resupply(u,k){if(u.abandoned)return;if(u.eng&&R()<.12*k)u.eng=false;if(u.fire>0&&R()<.3*k)u.fire=0;if(u.d.aps&&u.aps<u.d.aps)u.aps=Math.min(u.d.aps,u.aps+.08*k);if(u.era)for(const f in u.d.era)u.era[f]=Math.min(u.d.era[f],u.era[f]+.04*k);
  u.d.w.forEach((w,i)=>{if(typeof w.ammo==='object'){for(const s in w.ammo)if(u.ammo[i][s]<w.ammo[s])u.ammo[i][s]=Math.min(w.ammo[s],u.ammo[i][s]+(s==='he'?.6:.3)*k)}
    else if(w.ammo!=null&&u.ammo[i]<w.ammo)u.ammo[i]=Math.min(w.ammo,u.ammo[i]+(w.ammo>50?6:.5)*k)});
  if(u.d.gren&&u.gren<u.d.gren)u.gren=Math.min(u.d.gren,u.gren+.2*k);
  if(u.d.dronOp&&u.drones<u.d.drones)u.drones=Math.min(u.d.drones,u.drones+.04*k);
  if((u.d.veh||u.d.heli)&&u.hp<u.d.hp)u.hp=Math.min(u.d.hp,u.hp+3*k);if(u.d.flares&&u.flares<u.d.flares)u.flares=Math.min(u.d.flares,u.flares+.25*k);if(u.d.smokeL&&u.smokeL<u.d.smokeL)u.smokeL=Math.min(u.d.smokeL,u.smokeL+.05*k)}
function perSecond(){const h=[0,0];for(const o of state.objs)if(o.owner>=0)h[o.owner]++;
  for(const u of state.units){if(flying(u))continue;const ci=(u.y/CS|0)*GW+(u.x/CS|0);if(fireCells.has(ci)){state.curSrc=null;if(u.d.inf){stress(u,25);damage(u,{dmg:6,ap:0,k:'fire',soft:1},u.x,u.y,1)}else u.hp-=2}}
  for(const u of state.units)if(!u.d.air&&!u.abandoned&&!u.d.plane&&u.sup>=92&&!(u.panicT>0)&&R()<(u.cov||u.inB?.12:.3))panic(u);
  const pts=[0,0],inc=[ECON.base,ECON.base],brk={};for(const o of state.objs)if(o.owner>=0){const z=ZK[o.k],zi=z.inc*(o.k==='factory'?1:ECON.objMul)*zoneEff(o);pts[o.owner]+=z.pts;inc[o.owner]+=zi;if(o.owner===0)brk[z.n]=(brk[z.n]||0)+zi}
  /* bakım gideri: cephedeki birliklerin değeri kademelere göre geliri düşürür (ECON.upk) */
  const upk=[0,1].map(sd=>{let v=0;for(const u of state.units)if(u.side===sd&&!u.abandoned)v+=u.val||0;return upkMul(v)});
  const net=[inc[0]*upk[0],inc[1]*upk[1]];addKP(0,net[0]);addKP(1,net[1]*AIDIF[state.aiDiff].inc);
  if(!ECON.tickets);else if(pts[0]>pts[1])state.tickets[1]=Math.max(0,state.tickets[1]-(pts[0]-pts[1])*.5);else if(pts[1]>pts[0])state.tickets[0]=Math.max(0,state.tickets[0]-(pts[1]-pts[0])*.5);
  {const bk=Math.round((1-upk[0])*100);$('inc').textContent=tr(`+${Math.round(net[0]*60)}/dk`+(bk?` (−%${bk})`:''));
  $('inc').title=tr(`Taban +${ECON.base*60}/dk`+Object.entries(brk).map(([n,v])=>` · ${n} +${Math.round(v*60)}/dk`).join('')+` · Bakım gideri −%${bk} · Rezerv tavanı ${ECON.cap} KP · Düşman imhası değerinin %${Math.round(ECON.killBounty*100)}'u ayrıca`)}
  /* nokta avantajları sağlamlıkla ölçeklenir; yıkık nokta (zoneEff 0) avantaj vermez */
  updZones(1);
  for(const o of state.objs){const ze=zoneEff(o);if(o.owner<0||!ze)continue;if(o.k==='depot')for(const u of state.units)if(u.side===o.owner&&!flying(u)&&Math.hypot(u.x-o.x,u.y-o.y)<300)resupply(u,1.2*ze);
    if(o.k==='airfield')for(const u of state.units)if(u.side===o.owner&&u.d.heli&&u.alt==='landed'&&Math.hypot(u.x-o.x,u.y-o.y)<300)resupply(u,4*ze)}
  for(let i=state.retQ.length-1;i>=0;i--)if(state.time>=state.retQ[i].t){const q=state.retQ.splice(i,1)[0];state.avail[q.side][q.idx]++;if(q.side===0)log(`${SQUADS[q.idx].n} kartı yeniden kullanılabilir`,'')}
  for(const s of state.units){if(!s.d.supply)continue;for(const u of state.units)if(u.side===s.side&&u!==s&&!flying(u)&&(u.x-s.x)**2+(u.y-s.y)**2<130*130)resupply(u,u.d.heli?3:1)}
  for(const u of state.units)if(inBase(u)&&!flying(u))resupply(u,u.d.heli?4:1.5);
  if(state.over)return;
  if(ECON.tickets){if(state.tickets[0]<=0||state.tickets[1]<=0)endGame(state.tickets[1]<=0);return}
  const n=state.objs.length;if(h[0]===n)endGame(true);else if(h[1]===n)endGame(false)}

export {nearSupply,perSecond,updObjs};
