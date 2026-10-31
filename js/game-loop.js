/* game-loop.js — Ana döngü: simülasyon adımı, çizim zamanlaması, pencere boyutu. */
import {state} from './state.js';
import {clampCam} from './camera.js';
import {cvs,fogC} from './canvas.js';
import {DEF,FINE} from './config.js';
import {drawMini,render} from './renderer.js';
import {cam} from './state.js';
import {aiTick} from './systems/ai.js';
import {updBridges} from './systems/bridges.js';
import {updFires} from './systems/combat.js';
import {perSecond,updObjs} from './systems/economy.js';
import {zoneEff} from './systems/zones.js';
import {updCells,updParts,wind} from './systems/effects.js';
import {separate} from './systems/movement.js';
import {updProj} from './systems/projectiles.js';
import {updUnit} from './systems/unit-update.js';
import {arrive} from './systems/units.js';
import {computeVis} from './systems/vision.js';
import {log} from './ui/feedback.js';
import {updUI} from './ui/hud.js';
import {clamp,gauss} from './utils/helpers.js';

/* tek simülasyon adımı (çizimden bağımsız) */
function simStep(dt){state.time+=dt;state.visT-=dt;if(state.visT<=0){computeVis();state.visT=.15}
    for(const u of state.units)updUnit(u,dt);separate();updProj(dt);updObjs(dt);updBridges(dt);
    state.units=state.units.filter(u=>u.hp>0&&!u.gone&&!u.inHeli);
    for(const s of [0,1])for(let i=state.pending[s].length-1;i>=0;i--){const q=state.pending[s][i];if((q.t-=dt)<=0){state.pending[s].splice(i,1);arrive(s,q.idx)}}
    for(const s of [0,1]){const af=1+.4*state.objs.reduce((a,o)=>a+(o.k==='airfield'&&o.owner===s?zoneEff(o):0),0);for(const e of state.airbase[s])if((e.st==='prep'||e.st==='rearm')&&(e.t-=dt*af)<=0){e.st='ready';if(s===0)log(`${DEF[e.key].n} kalkışa hazır`,'good')}}
    for(let i=state.smokes.length-1;i>=0;i--){const s=state.smokes[i];s.age+=dt;s.x+=5*dt;if(s.age>=s.life)state.smokes.splice(i,1)}
    for(let i=state.cbs.length-1;i>=0;i--){state.cbs[i].t-=dt;if(state.cbs[i].t<=0)state.cbs.splice(i,1)}
    for(let i=state.timers.length-1;i>=0;i--)if(state.time>=state.timers[i].t){const f=state.timers[i].f;state.timers.splice(i,1);f()}
    updFires(dt);updCells(dt);wind.x+=(gauss()*.5)*dt;wind.y+=(gauss()*.5)*dt;wind.x=clamp(wind.x,4,16);wind.y=clamp(wind.y,-8,4);
    state.secT+=dt;if(state.secT>=1){state.secT-=1;perSecond()}
    state.aiT-=dt;if(state.aiT<=0){aiTick();state.aiT=1.5}}
let uiT=0;
function frame(now){const dt=clamp((now-state.last)/1000,0,.05);state.last=now;
  if(state.dc){const tx=state.dc.x-state.VW/cam.z/2,ty=state.dc.y-state.VH/cam.z/2;cam.x+=(tx-cam.x)*Math.min(1,dt*5);cam.y+=(ty-cam.y)*Math.min(1,dt*5)}
  else{const ps=600/cam.z*dt,k=state.keys;if(k.ArrowLeft||k.KeyA)cam.x-=ps;if(k.ArrowRight||k.KeyD)cam.x+=ps;if(k.ArrowUp||k.KeyW)cam.y-=ps;if(k.ArrowDown||k.KeyS)cam.y+=ps;
    if(state.mouse.in&&!state.drag&&(state.running||state.phase==='deploy')&&FINE){const m=8;if(state.mouse.x<m)cam.x-=ps;if(state.mouse.x>state.VW-m)cam.x+=ps;if(state.mouse.y<m)cam.y-=ps;if(state.mouse.y>state.VH-m)cam.y+=ps}}
  clampCam();
  if(state.running&&!state.paused)simStep(dt);
  if(!state.paused)updParts(dt);state.shake*=Math.pow(.015,dt);if(state.shake<.15)state.shake=0;
  render();
  if(now-uiT>200){drawMini();updUI();uiT=now}
  requestAnimationFrame(frame)}
function resize(){state.DPR=Math.min(2,devicePixelRatio||1);state.VW=innerWidth;state.VH=innerHeight;cvs.width=Math.round(state.VW*state.DPR);cvs.height=Math.round(state.VH*state.DPR);fogC.width=Math.ceil(state.VW/2);fogC.height=Math.ceil(state.VH/2);clampCam()}

export {frame,resize,simStep};
