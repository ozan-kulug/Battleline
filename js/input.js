/* input.js — Fare, dokunmatik ve klavye kontrolleri. */
import {state} from './state.js';
import {clampCam,toW,zoomAt} from './camera.js';
import {cvs,mm} from './canvas.js';
import {H,SQUADS,W} from './config.js';
import {cam,md} from './state.js';
import {addStrike,altSel,assignMission,assignRun,autoSel,burnSel,dcToggle,deploySel,digSel,exfilSel,exitSel,hitUnit,holdSel,landSel,orderGroup,radarSel,rightOrder,rtbSel,sel,setArm,setFastArm,setFormSel,setInitSel,setMissionArm,setPrecArm,setRunArm,shellSel,smokeSel,squadOf,stanceSel,stopSel,unloadSel} from './systems/orders.js';
import {deploy} from './systems/units.js';
import {cards} from './ui/deck.js';
import {depDown,depMove,depUp} from './ui/deploy.js';
import {log,updTip} from './ui/feedback.js';
import {updUI} from './ui/hud.js';
import {ACT} from './ui/panels.js';
import {$} from './utils/helpers.js';
import {buildingAt} from './world/terrain.js';

let lastClick={id:0,t:0};
const touches=new Map();
let pinch=null;
function selectSquadOf(u){const g=new Set(squadOf(u));state.units.forEach(x=>x.sel=g.has(x))}
/* seçim birimi mangadır: bir askere tıklamak tüm mangayı seçer; Alt ile tek asker seçilir */
function clickSelect(wx,wy,shift,alt){const u=hitUnit(wx,wy,0);const now=performance.now();
  if(u&&lastClick.id===u.id&&now-lastClick.t<350){selectSquadOf(u);lastClick={id:0,t:0};return}
  lastClick={id:u?u.id:0,t:now};
  if(!u){const b=buildingAt(wx,wy);if(b&&b.occ.length&&b.occ[0].side===0){if(!shift)state.units.forEach(x=>x.sel=false);b.occ.forEach(o=>o.sel=true);return}}
  if(!shift)state.units.forEach(x=>x.sel=false);if(u){const on=shift?!u.sel:true;for(const m of alt?[u]:squadOf(u))m.sel=on}}
function endPointer(e){
  if(state.phase==='deploy'&&depUp(e)){md[e.button]=false;return}
  if(e.pointerType==='touch'){touches.delete(e.pointerId);if(touches.size<2)pinch=null;
    if(state.drag&&state.drag.touch&&!state.drag.moved&&touches.size===0&&state.running)tapAt(e.offsetX,e.offsetY);if(touches.size===0)state.drag=null;return}
  md[e.button]=false;
  if(!state.drag)return;const d=state.drag;state.drag=null;if(d.pan||!state.running)return;
  if(d.run){const a=toW(d.sx,d.sy),b=toW(d.cx,d.cy);assignRun(a.x,a.y,b.x,b.y);setRunArm(false);return}
  if(d.box){const a=toW(Math.min(d.sx,d.cx),Math.min(d.sy,d.cy)),b=toW(Math.max(d.sx,d.cx),Math.max(d.sy,d.cy));if(!d.shift)state.units.forEach(u=>u.sel=false);
    for(const u of state.units)if(u.side===0&&u.x>=a.x&&u.x<=b.x&&u.y>=a.y&&u.y<=b.y)for(const m of d.alt?[u]:squadOf(u))m.sel=true;return}
  const w=toW(d.sx,d.sy);
  if(state.attackArm||state.fastArm){rightOrder(w.x,w.y,state.attackArm,d.shift);setArm(false);setFastArm(false);return}
  clickSelect(w.x,w.y,d.shift,d.alt)}
function tapAt(sx,sy){const w=toW(sx,sy);
  if(state.missionArm){assignMission(w.x,w.y);setMissionArm(false);return}
  if(state.runArm){assignRun(w.x,w.y,w.x,w.y);setRunArm(false);return}
  if(state.precArm){addStrike(w.x,w.y);setPrecArm(false);return}
  const u=hitUnit(w.x,w.y,0);const now=performance.now();
  if(u){if(lastClick.id===u.id&&now-lastClick.t<400){selectSquadOf(u);lastClick={id:0,t:0};return}lastClick={id:u.id,t:now};const on=!u.sel;for(const m of squadOf(u))m.sel=on;return}
  const b=buildingAt(w.x,w.y);if(b&&b.occ.length&&b.occ[0].side===0&&!sel().some(x=>x.d.inf&&!x.inB)){b.occ.forEach(o=>o.sel=true);return}
  if(sel().length){rightOrder(w.x,w.y,state.attackArm);setArm(false);setFastArm(false)}}
function selectGroup(n){const ids=state.groups[n];if(!ids)return;state.units.forEach(u=>u.sel=u.side===0&&ids.includes(u.id));const s=sel();const now=performance.now();
  if(state.lastGrp.n===n&&now-state.lastGrp.t<400&&s.length){const cx=s.reduce((a,u)=>a+u.x,0)/s.length,cy=s.reduce((a,u)=>a+u.y,0)/s.length;cam.x=cx-state.VW/cam.z/2;cam.y=cy-state.VH/cam.z/2;clampCam()}state.lastGrp={n,t:now}}

/* olay dinleyicileri: main.js tarafından başlatılır */
export function initInput(){
cvs.addEventListener('contextmenu',e=>e.preventDefault());
cvs.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.offsetX,e.offsetY,Math.exp(-e.deltaY*.0015))},{passive:false});
cvs.addEventListener('pointerdown',e=>{cvs.setPointerCapture(e.pointerId);state.mouse={x:e.offsetX,y:e.offsetY,in:true};
  /* konuşlanma safhası: birlik sürükleme ve yön verme önce denenir; kaydırma, yakınlaştırma ve iki parmak hareketi aşağıdaki mevcut yoldan sürer */
  if(state.phase==='deploy'&&!(e.pointerType==='touch'&&touches.size)&&depDown(e))return;
  if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
    if(touches.size===2){const [a,b]=[...touches.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.z};state.drag=null}
    else state.drag={touch:1,sx:e.offsetX,sy:e.offsetY,cx:e.offsetX,cy:e.offsetY,cam:{x:cam.x,y:cam.y},moved:false};return}
  if(e.button===1){state.drag={pan:1,sx:e.offsetX,sy:e.offsetY,cam:{x:cam.x,y:cam.y}};e.preventDefault();return}
  if(!state.running)return;
  if(state.dc){md[e.button]=true;return}
  const w=toW(e.offsetX,e.offsetY);
  if(e.button===2){if(state.missionArm){setMissionArm(false);return}if(state.runArm){setRunArm(false);return}if(state.precArm){setPrecArm(false);return}rightOrder(w.x,w.y,e.ctrlKey||state.attackArm,e.shiftKey);setArm(false);setFastArm(false);return}
  if(e.button===0){if(state.missionArm){assignMission(w.x,w.y);setMissionArm(false);return}
    if(state.runArm){state.drag={run:1,sx:e.offsetX,sy:e.offsetY,cx:e.offsetX,cy:e.offsetY};return}
    if(state.precArm){addStrike(w.x,w.y);if(!e.shiftKey)setPrecArm(false);return}
    state.drag={sx:e.offsetX,sy:e.offsetY,cx:e.offsetX,cy:e.offsetY,shift:e.shiftKey,alt:e.altKey,box:false}}});
cvs.addEventListener('pointermove',e=>{state.mouse={x:e.offsetX,y:e.offsetY,in:true};
  if(state.phase==='deploy'&&depMove(e))return;
  if(e.pointerType==='touch'){if(!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
    if(pinch&&touches.size>=2){const [a,b]=[...touches.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);zoomAt((a.x+b.x)/2,(a.y+b.y)/2,pinch.z*d/pinch.d/cam.z);return}
    if(state.drag&&state.drag.touch){state.drag.cx=e.offsetX;state.drag.cy=e.offsetY;if(Math.hypot(state.drag.cx-state.drag.sx,state.drag.cy-state.drag.sy)>10)state.drag.moved=true;if(state.drag.moved){cam.x=state.drag.cam.x-(state.drag.cx-state.drag.sx)/cam.z;cam.y=state.drag.cam.y-(state.drag.cy-state.drag.sy)/cam.z;clampCam()}}return}
  if(!state.drag)return;if(state.drag.pan){cam.x=state.drag.cam.x-(e.offsetX-state.drag.sx)/cam.z;cam.y=state.drag.cam.y-(e.offsetY-state.drag.sy)/cam.z;clampCam();return}
  state.drag.cx=e.offsetX;state.drag.cy=e.offsetY;if(!state.drag.run&&Math.hypot(state.drag.cx-state.drag.sx,state.drag.cy-state.drag.sy)>6)state.drag.box=true});
cvs.addEventListener('pointerup',endPointer);
cvs.addEventListener('pointercancel',endPointer);
cvs.addEventListener('pointerleave',()=>{state.mouse.in=false});
mm.addEventListener('pointerdown',e=>{const go=ev=>{const r=mm.getBoundingClientRect();cam.x=(ev.clientX-r.left)/r.width*W-state.VW/cam.z/2;cam.y=(ev.clientY-r.top)/r.height*H-state.VH/cam.z/2;clampCam()};
  if(e.button===2)return;go(e);const mv=ev=>go(ev),up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up)};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
mm.addEventListener('contextmenu',e=>{e.preventDefault();if(!state.running)return;const r=mm.getBoundingClientRect();orderGroup(sel(),(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H,e.ctrlKey?'attack':'move')});
/* W A S D kamerayı kaydırır (doğrudan kontrolde aracı sürer); eski W/A/S/D komutları Shift ile çalışır */
const CAMK=['KeyW','KeyA','KeyS','KeyD'];
addEventListener('keydown',e=>{const c=e.code;if(e.target.closest&&e.target.closest('input,textarea'))return;const camK=CAMK.includes(c);
  if(!(camK&&e.shiftKey))state.keys[c]=true;if(!state.running)return;
  if(c==='Space'){e.preventDefault();if(!state.over){state.paused=!state.paused;$('pause').hidden=!state.paused}return}
  if(e.repeat)return;
  if(c.startsWith('Digit')){const n=+c.slice(5);if(e.shiftKey){const vis=cards.filter(([b,S])=>S.cat===state.deckTab);if(n>=1&&n<=vis.length)deploy(0,SQUADS.indexOf(vis[n-1][1]));return}if(e.ctrlKey||e.metaKey){e.preventDefault();state.groups[n]=sel().map(u=>u.id);if(state.groups[n].length)log(`Grup ${n} atandı (${state.groups[n].length} birlik)`,'');return}selectGroup(n);return}
  if(camK&&(state.dc||!e.shiftKey))return;
  const map={KeyA:()=>setArm(!state.attackArm),KeyS:stopSel,KeyH:holdSel,KeyD:()=>setFastArm(!state.fastArm),KeyZ:()=>stanceSel('stand'),KeyX:()=>stanceSel('crouch'),KeyC:()=>stanceSel('prone'),KeyB:()=>stanceSel(null),
    KeyK:digSel,KeyE:exitSel,KeyG:deploySel,KeyF:()=>setMissionArm(!state.missionArm),KeyT:shellSel,KeyN:ACT.salvo,KeyO:autoSel,KeyR:smokeSel,KeyV:dcToggle,KeyJ:()=>setRunArm(!state.runArm),KeyP:()=>setPrecArm(!state.precArm),KeyY:()=>{altSel();radarSel()},KeyI:burnSel,KeyU:()=>{rtbSel();unloadSel()},KeyL:landSel,KeyM:exfilSel,
    KeyQ:()=>state.units.forEach(u=>u.sel=u.side===0&&u.x>0&&!u.d.plane),KeyW:setFormSel,Comma:setInitSel,
    Escape:()=>{if(state.dc){state.dc=null;updTip()}else if(state.missionArm||state.attackArm||state.runArm||state.precArm||state.fastArm){setArm(false);setMissionArm(false);setRunArm(false);setPrecArm(false);setFastArm(false)}else state.units.forEach(u=>u.sel=false)}};
  if(map[c]){map[c]();updUI()}});
addEventListener('keyup',e=>{state.keys[e.code]=false});
addEventListener('blur',()=>{state.keys={};state.mouse.in=false;md.fill(false)});
}
