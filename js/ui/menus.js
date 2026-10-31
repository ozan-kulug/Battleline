/* ui/menus.js — Başlangıç/yardım ekranı, zorluk seçimi. */
import {state} from '../state.js';
import {lang,setLang,tr} from '../i18n.js';
import {newGame,startMatch} from '../game.js';
import {droneModeToggle} from '../systems/orders.js';
import {openArmy} from './army-builder.js';
import {$} from '../utils/helpers.js';

/* geliştirici kısayolu: adres ?hizli ile açılırsa ordu kurma ekranı atlanır, iki taraf eski varsayılan kuvvetle başlar */
const QUICK=new URLSearchParams(location.search).has('hizli');

/* olay dinleyicileri: main.js tarafından başlatılır */
export function initMenus(){
if(QUICK)$('goBtn').textContent=tr('HIZLI BAŞLAT');
/* savaş yoksa (ilk açılış veya oyun sonu) ordu kurma ekranına, savaş sürüyorsa kaldığı yere döner */
$('goBtn').addEventListener('click',()=>{if(state.phase==='deploy'){$('ov').hidden=true;$('ovl').hidden=false;return}
  if(!state.matchOn||state.over){if(QUICK)startMatch();else openArmy();return}
  $('ov').hidden=true;$('ovl').hidden=false;state.running=true;state.over=false;state.paused=false;$('pause').hidden=true;state.last=performance.now()});
/* kamikaze dron yönetimi: operatör (otomatik) veya oyuncu; tercih tarayıcıda hatırlanır, savaşta seçim panelinden de değişir */
try{state.droneManual=localStorage.getItem('cephe-hatti.dron')==='1'}catch(e){}
const dmSync=()=>{for(const x of $('droneRow').querySelectorAll('[data-dm]'))x.classList.toggle('on',(x.dataset.dm==='1')===state.droneManual)};dmSync();
$('droneRow').addEventListener('click',e=>{const b=e.target.closest('[data-dm]');if(!b)return;if((b.dataset.dm==='1')!==state.droneManual)droneModeToggle();dmSync()});
$('helpBtn').addEventListener('click',dmSync);
/* dil: seçilince sayfa yeniden yüklenir (sabit metinler açılışta bir kez çevrilir) */
for(const x of $('langRow').querySelectorAll('[data-lang]'))x.classList.toggle('on',x.dataset.lang===lang);
$('langRow').addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(!b||b.dataset.lang===lang)return;setLang(b.dataset.lang);const u=new URL(location.href);u.searchParams.delete('lang');location.href=u.href});
/* mod: normal ya da sandbox (sınırsız KP ve kart); ?sandbox ile de açılır, tercih hatırlanır */
try{state.sandbox=new URLSearchParams(location.search).has('sandbox')||localStorage.getItem('cephe-hatti.mod')==='sandbox'}catch(e){}
const modeSync=()=>{for(const x of $('modeRow').querySelectorAll('[data-mode]'))x.classList.toggle('on',(x.dataset.mode==='sandbox')===state.sandbox)};modeSync();
$('modeRow').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;state.sandbox=b.dataset.mode==='sandbox';try{localStorage.setItem('cephe-hatti.mod',b.dataset.mode)}catch(e){}modeSync()});
/* harita: nehir (varsayılan) veya kıyı; ?map=coast ile de açılır, tercih hatırlanır. Savaş sürerken seçim sonraki maça geçer */
try{state.mapK=new URLSearchParams(location.search).get('map')||localStorage.getItem('cephe-hatti.harita')||'river'}catch(e){}
const mapSync=()=>{for(const x of $('mapRow').querySelectorAll('[data-map]'))x.classList.toggle('on',x.dataset.map===state.mapK)};mapSync();
$('mapRow').addEventListener('click',e=>{const b=e.target.closest('[data-map]');if(!b||b.dataset.map===state.mapK)return;state.mapK=b.dataset.map;try{localStorage.setItem('cephe-hatti.harita',state.mapK)}catch(e){}mapSync();
  if(state.phase!=='deploy'&&(!state.matchOn||state.over))newGame()});
$('diffRow').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;state.aiDiff=b.dataset.d;for(const x of $('diffRow').querySelectorAll('[data-d]'))x.classList.toggle('on',x===b)});
$('helpBtn').addEventListener('click',()=>{if(state.over)return;state.running=false;$('ovt').textContent=tr('BATTLELINE');$('goBtn').textContent=tr(state.phase==='deploy'?'KONUŞLANMAYA DÖN':state.matchOn?'DEVAM ET':QUICK?'HIZLI BAŞLAT':'ORDU KUR');$('ovl').hidden=false;$('ov').hidden=false});
}
