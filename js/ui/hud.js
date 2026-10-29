/* ui/hud.js — Üst şerit, hava üssü paneli ve arayüz güncellemesi. */
import {state} from '../state.js';
import {clampCam} from '../camera.js';
import {DEF,SQUADS,ZK} from '../config.js';
import {cam} from '../state.js';
import {launch} from '../systems/air.js';
import {sel} from '../systems/orders.js';
import {cards} from './deck.js';
import {ACT,selButtons,selInfo} from './panels.js';
import {$} from '../utils/helpers.js';

function buildObjUI(){$('objs').innerHTML=state.objs.map(o=>`<div class="ob" id="ob${o.n}" title="${o.n} · ${ZK[o.k].n}: +${ZK[o.k].inc} KP/sn · ${ZK[o.k].b}"><svg viewBox="0 0 36 36"><rect x="1" y="1" width="34" height="34" fill="none" stroke-width="3" pathLength="100" stroke-dasharray="0 100"/></svg><span>${o.n}</span></div>`).join('')}
const ABST={prep:'Hazırlanıyor',ready:'Kalkışa hazır',air:'Havada',rearm:'İkmalde',lost:'Kayıp'};
function updAB(){const list=state.airbase[0].filter(e=>e.st!=='lost'),el=$('abp');el.hidden=!list.length;if(!list.length)return;
  const h=list.map(e=>{const d=DEF[e.key],u=e.u;let st=ABST[e.st];if(e.st==='prep'||e.st==='rearm')st+=` · ${Math.ceil(e.t)} sn`;if(e.st==='air'&&u)st=(u.rtb?'Üsse dönüyor':u.run?'Saldırı koşusu':u.strikes.length?'Hassas vuruş':u.chase?'Takipte':'Devriyede')+` · yakıt %${Math.round(u.fuel/d.fuel*100)}`;
    return `<div class="abr${e.st==='air'?' air':''}" data-sel="${e.id}"><b>${d.n}</b><small>${st}</small>${e.st==='ready'?`<button class="btn" type="button" data-ab="${e.id}">Kalkış</button>`:''}</div>`}).join('');
  const l=$('abl');if(l.dataset.h!==h){l.innerHTML=h;l.dataset.h=h}}
function updUI(){$('kp').textContent=`${Math.floor(state.money[0])} KP`;updAB();
  $('eta').textContent=state.pending[0].length?'Yolda: '+state.pending[0].map(q=>`${SQUADS[q.idx].n} ${Math.ceil(q.t)} sn`).join(' · '):'';
  for(const [b,S] of cards){const ix=SQUADS.indexOf(S),av=state.avail[0][ix],ok=state.money[0]>=S.cost&&av>0;b.querySelector('.av').textContent=`×${av}`;b.setAttribute('aria-disabled',ok?'false':'true');b.querySelector('.fill').style.width=Math.min(100,state.money[0]/S.cost*100)+'%'}
  for(const i of [0,1]){$('tk'+i).textContent=Math.ceil(state.tickets[i]);$('tb'+i).style.width=state.tickets[i]/500*100+'%'}
  for(const o of state.objs){const el=$('ob'+o.n);if(!el)continue;el.style.color=o.owner===0?'var(--blue)':o.owner===1?'var(--red)':'var(--fg)';
    const r=el.querySelector('rect');r.setAttribute('stroke',o.own>=0?'#62a6e6':'#e2584b');r.setAttribute('stroke-dasharray',`${Math.abs(o.own)} 100`)}
  const s=sel();$('selp').classList.toggle('empty',!s.length);
  const hi=selInfo(s),hb=selButtons(s),si=$('seli'),sb=$('selb');if(si.dataset.h!==hi){si.innerHTML=hi;si.dataset.h=hi}if(sb.dataset.h!==hb){sb.innerHTML=hb;sb.dataset.h=hb}}

/* olay dinleyicileri: main.js tarafından başlatılır */
export function initHud(){
$('abl').addEventListener('pointerdown',ev=>{if(!state.running)return;const b=ev.target.closest('[data-ab]');if(b){const e=state.airbase[0].find(x=>x.id===+b.dataset.ab);const u=e&&launch(e);if(u){state.units.forEach(x=>x.sel=false);u.sel=true}updAB();updUI();return}
  const r=ev.target.closest('[data-sel]');if(r){const e=state.airbase[0].find(x=>x.id===+r.dataset.sel);if(e&&e.u){state.units.forEach(x=>x.sel=false);e.u.sel=true;cam.x=e.u.x-state.VW/cam.z/2;cam.y=e.u.y-state.VH/cam.z/2;clampCam();updUI()}}});
$('selb').addEventListener('click',e=>{const a=e.target.closest('[data-a]')?.dataset.a;if(a&&ACT[a]&&state.running){ACT[a]();updUI()}});
}

export {buildObjUI,updUI};
