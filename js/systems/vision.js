/* systems/vision.js — Görüş: görüş hattı, gizlenme, taraf başına görünen düşmanlar, hava tespiti, son görülen konumlar. */
import {state} from '../state.js';
import {CS,GH,GW,T} from '../config.js';
import {buildHash,nearUnits} from './spatial.js';
import {flying} from './units.js';
import {log} from '../ui/feedback.js';
import {clamp} from '../utils/helpers.js';
import {coverAt,effStance,vehCover} from '../world/cover.js';
import {bgrid,cellAt,elev,elevAt,grid} from '../world/terrain.js';

/* ---------- görüş ---------- */
/* nf: orman görüşü kesmez (yüksekten bakış). sky: yüksek irtifadan bakış, yer şekilleri de kesmez.
   Arazi: iki göz yüksekliği arasındaki çizginin altında kalan sırt görüşü keser. */
const EYE=.12;
function los(ax,ay,bx,by,ia,ib,nf,sky){const dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy),n=Math.ceil(d/8);let fd=0;const ha=elevAt(ax,ay)+EYE,hb=elevAt(bx,by)+EYE;
  for(let k=1;k<n;k++){const x=ax+dx*k/n,y=ay+dy*k/n,cx=x/CS|0,cy=y/CS|0;if(cx<0||cy<0||cx>=GW||cy>=GH)continue;const ci=cy*GW+cx;
    if(!sky&&elev[ci]>ha+(hb-ha)*k/n+.04)return false;
    if(grid[ci]===T.FOREST&&!nf){fd+=8;if(fd>120)return false}
    const bi=bgrid[ci];if(bi>=0&&bi!==ia&&bi!==ib){const b=state.buildings[bi];if(!b.dead&&x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h)return false}
    if(!(k&1))for(const s of state.smokes){if(s.age>1.2&&s.age<s.life-2){const rr=s.r*.8;if((x-s.x)**2+(y-s.y)**2<rr*rr)return false}}}
  return true}
function conceal(t){let m;const c=cellAt(t.x,t.y);
  if(t.d.inf){if(t.inB)m=t.reveal>0?.75:.4;else{m=c===T.FOREST?.4:c===T.TOWN?.6:c===T.SWAMP?.6:.85;const st=effStance(t);m*=st==='prone'?.6:st==='crouch'?.8:1;
      if(t.cov&&(t.cov.t==='fox'||t.cov.t==='trench'))m*=.75;else if(t.cov&&t.cov.t==='hedge')m*=.7;else if(t.cov)m*=.85;if(t.moving)m*=1.2}}
  else m=c===T.FOREST?.6:c===T.TOWN?.8:1;
  if(t.d.stealth)m*=.7;if(t.reveal>0)m=Math.max(m,t.inB?.75:.9);return m}
const visEff=f=>f.d.vis*(1+.3*clamp(elevAt(f.x,f.y),-.6,1))*(f.opt>0?.6:1)*(f.inB?1.2:1)*(f.d.inf&&effStance(f)==='prone'?.85:1)*(f.d.heli&&f.alt==='high'?1.3:1);
function computeVis(){for(const u of state.units){u.sees=[];if(u.d.inf)u.cov=coverAt(u);else if(!u.d.air)u.vcov=vehCover(u)}
  buildHash();const cc=new Map();const conc=e=>{let c=cc.get(e.id);if(c===undefined){c=conceal(e);cc.set(e.id,c)}return c};
  const airU=state.units.filter(e=>flying(e)),inBU=state.units.filter(e=>e.inB);
  for(const s of [0,1]){const v=new Set();for(const f of state.units){if(f.side!==s||f.abandoned||f.inHeli)continue;const ve=visEff(f),ia=f.inB?f.inB.i:-1,cand=[];
    if(f.d.plane&&!f.d.gvis){for(const e of airU)if(e.side!==s)cand.push(e)}
    else{nearUnits(f.x,f.y,ve,e=>{if(e.side!==s)cand.push(e)});for(const e of inBU)if(e.side!==s&&Math.abs(e.x-f.x)<ve)cand.push(e);for(const e of airU)if(e.side!==s&&!cand.includes(e))cand.push(e)}
    for(const e of cand){
      if(flying(e)){if(airSpot(f,e)){v.add(e.id);if(!f.d.plane)f.sees.push(e);if(s===0&&!e.seenA&&e.d.plane){e.seenA=1;log(`Düşman ${e.d.n.toLocaleLowerCase('tr')} tespit edildi`,'bad')}}continue}
      if(f.d.plane&&!f.d.gvis)continue;
      const d=Math.hypot(e.x-f.x,e.y-f.y);if(d>ve)continue;
      if(f.d.gvis){if(d<ve*conc(e)*(f.alt==='low'?.85:1)&&skyLos(f.x,f.y,e.x,e.y)){v.add(e.id);if(f.d.uav)f.sees.push(e)}continue}
      if(d<55||(d<ve*conc(e)&&los(f.x,f.y,e.x,e.y,ia,e.inB?e.inB.i:-1,(f.d.heli&&f.alt==='high')||elevAt(f.x,f.y)>elevAt(e.x,e.y)+.5,f.d.heli&&f.alt==='high'))){f.sees.push(e);v.add(e.id)}}}
    for(const o of state.objs){if(o.k!=='hill'||o.owner!==s)continue;for(const e of state.units){if(e.side===s||e.abandoned)continue;if(flying(e)){v.add(e.id);continue}const d=Math.hypot(e.x-o.x,e.y-o.y);if(d<950*conc(e)&&los(o.x,o.y,e.x,e.y,-1,e.inB?e.inB.i:-1,true))v.add(e.id)}}
    state.vis[s]=v}
  for(const u of state.units)if(u.side===1&&state.vis[0].has(u.id))ghosts.set(u.id,{u,x:u.x,y:u.y,t:state.time});for(const [id,g] of ghosts)if(g.u.hp<=0||g.u.gone||state.time-g.t>30)ghosts.delete(id)}
/* hava hedefi tespiti: uçaklar yer birliklerini kendileri göremez; radar açıkken çok uzaktan görülür; alçak helikopteri ağaç ve bina saklar */
function skyLos(ax,ay,bx,by){for(const s of state.smokes){if(s.age<1.2)continue;const vx=bx-ax,vy=by-ay,L2=vx*vx+vy*vy||1,t=clamp(((s.x-ax)*vx+(s.y-ay)*vy)/L2,0,1);if(Math.hypot(ax+vx*t-s.x,ay+vy*t-s.y)<s.r*.7&&Math.hypot(bx-s.x,by-s.y)<s.r)return false}return true}
function airSpot(f,e){const d=Math.hypot(e.x-f.x,e.y-f.y);
  if(e.d.uav){const sm=f.d.radar&&f.radarOn?(e.d.plane?1100:450):e.d.plane?(f.d.plane?900:600):(f.d.plane?400:240);return d<sm}
  if(f.d.plane)return(f.key==='cas'||f.key==='bmb')?d<500:d<1500;
  if(f.d.radar&&f.radarOn){const rr=e.d.plane?(e.alt==='high'?1800:900):(e.alt==='high'?900:600);if(d<rr&&(e.d.plane||e.alt==='high'||los(f.x,f.y,e.x,e.y,-1,-1)))return true}
  if(e.d.plane)return d<(e.alt==='high'?1100:700);
  if(e.alt==='high')return d<750;
  return d<Math.max(220,visEff(f)*.95)&&(d<80||los(f.x,f.y,e.x,e.y,f.inB?f.inB.i:-1,-1,f.d.heli&&f.alt==='high'))}
function observed(side,x,y){for(const o of state.objs)if(o.k==='hill'&&o.owner===side&&Math.hypot(o.x-x,o.y-y)<950&&los(o.x,o.y,x,y,-1,-1,true))return true;for(const f of state.units){if(f.side!==side||f.d.indirect&&!f.d.inf)continue;const d=Math.hypot(f.x-x,f.y-y);if(d<visEff(f)*.95&&los(f.x,f.y,x,y,f.inB?f.inB.i:-1,-1))return true}return false}
const ghosts=new Map();
const keCache=[{t:-1,a:null},{t:-1,a:null}];
function knownEnemies(side){const kc=keCache[side];if(kc.t===state.time)return kc.a;const a=[];kc.t=state.time;kc.a=a;for(const e of state.units)if(e.side!==side&&!flying(e)&&!e.abandoned&&state.vis[side].has(e.id))a.push({x:e.x,y:e.y,e});
  if(side===0)for(const [id,g] of ghosts)if(!state.vis[0].has(id)&&state.time-g.t<20)a.push({x:g.x,y:g.y,e:g.u});return a}

export {computeVis,ghosts,knownEnemies,los,observed,visEff};
