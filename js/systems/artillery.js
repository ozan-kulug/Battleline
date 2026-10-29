/* systems/artillery.js — Topçu ve havan: mevzilenme, ateş görevleri, serbest atış hedefi. */
import {state} from '../state.js';
import {fireIndirect} from './combat.js';
import {flying,turnTurret} from './units.js';
import {log} from '../ui/feedback.js';
import {angDiff} from '../utils/helpers.js';

function updIndirect(u,dt,isDC){const w=u.d.w[0];
  if(u.st==='deploying'){u.stT-=dt;if(u.stT<=0)u.st='deployed'}
  else if(u.st==='packing'){u.stT-=dt;if(u.stT<=0)u.st='travel'}
  else if(u.st==='travel'&&!u.dest&&!u.moving&&(u.mission||u.wantDeploy)){u.st='deploying';u.stT=u.d.setupT;u.wantDeploy=false}
  if(isDC||u.st!=='deployed'||u.hold)return;
  let tx=null,ty=null;
  if(u.mission){tx=u.mission.x;ty=u.mission.y}
  else if(u.auto){if(state.time>u.pickT){u.autoTgt=pickIndirect(u);u.pickT=state.time+.7}const t=u.autoTgt;if(t&&t.hp>0&&state.vis[u.side].has(t.id)){tx=t.x;ty=t.y}}
  if(tx==null)return;
  const ang=Math.atan2(ty-u.y,tx-u.x);turnTurret(u,ang,dt);
  if(u.cd[0]>0||Math.abs(angDiff(ang,u.ta))>.05)return;
  const shell=u.mission?u.mission.shell:'he';
  if(u.ammo[0][shell]<1){if(u.mission){if(u.side===0)log(`${u.d.n}: ${shell==='he'?'tahrip':'sis'} mermisi bitti`,'bad');u.mission=null}return}
  fireIndirect(u,tx,ty,shell,u.mission);
  if(u.mission){u.mission.n--;u.mission.fired++;if(u.mission.n<=0)u.mission=null}}
function pickIndirect(u){const w=u.d.w[0];let best=null,bs=0;
  for(const e of state.units){if(e.side===u.side||!state.vis[u.side].has(e.id)||flying(e)||e.abandoned)continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d>w.r||d<w.min)continue;
    let danger=false;for(const f of state.units){if(f.side===u.side&&Math.hypot(f.x-e.x,f.y-e.y)<w.splash*1.6){danger=true;break}}if(danger)continue;
    let s=1;for(const o of state.units)if(o!==e&&o.side===e.side&&Math.hypot(o.x-e.x,o.y-e.y)<w.splash)s+=o.d.veh?1.5:1;
    if(e.d.veh&&!e.moving)s+=1.5;if(e.inB||(e.cov&&(e.cov.t==='trench'||e.cov.t==='fox')))s+=1;if(e.d.indirect)s+=2;if(e.moving)s*=.6;
    if(s>bs){bs=s;best=e}}return best}

export {updIndirect};
