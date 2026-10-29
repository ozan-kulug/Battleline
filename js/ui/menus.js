/* ui/menus.js — Başlangıç/yardım ekranı, zorluk seçimi. */
import {state} from '../state.js';
import {lang,setLang,tr} from '../i18n.js';
import {startMatch} from '../game.js';
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
$('diffRow').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;state.aiDiff=b.dataset.d;for(const x of $('diffRow').querySelectorAll('[data-d]'))x.classList.toggle('on',x===b)});
$('helpBtn').addEventListener('click',()=>{if(state.over)return;state.running=false;$('ovt').textContent=tr('BATTLELINE');$('goBtn').textContent=tr(state.phase==='deploy'?'KONUŞLANMAYA DÖN':state.matchOn?'DEVAM ET':QUICK?'HIZLI BAŞLAT':'ORDU KUR');$('ovl').hidden=false;$('ov').hidden=false});
}
