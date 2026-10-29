/* ui/menus.js — Başlangıç/yardım ekranı, zorluk seçimi. */
import {state} from '../state.js';
import {newGame} from '../game.js';
import {$} from '../utils/helpers.js';


/* olay dinleyicileri: main.js tarafından başlatılır */
export function initMenus(){
$('goBtn').addEventListener('click',()=>{if(state.over)newGame();$('ov').hidden=true;$('ovl').hidden=false;state.running=true;state.over=false;state.paused=false;$('pause').hidden=true;state.last=performance.now()});
$('diffRow').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;state.aiDiff=b.dataset.d;for(const x of $('diffRow').querySelectorAll('[data-d]'))x.classList.toggle('on',x===b)});
$('helpBtn').addEventListener('click',()=>{if(state.over)return;state.running=false;$('ovt').textContent='CEPHE HATTI';$('goBtn').textContent=state.time>0?'DEVAM ET':'SAVAŞA BAŞLA';$('ovl').hidden=false;$('ov').hidden=false});
}
