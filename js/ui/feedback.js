/* ui/feedback.js — Oyuncuya geri bildirim: olay akışı (log), mod ipucu, oyun sonu ekranı. */
import {state} from '../state.js';
import {tr} from '../i18n.js';
import {$} from '../utils/helpers.js';

function updTip(){const t=$('modeTip');let s='';
  if(state.dc)s=`DOĞRUDAN KONTROL — ${state.dc.d.n}: WASD sür, fareyle nişan al, sol tık ana silah${state.dc.d.w[1]?', sağ tık ikincil':''} · V veya Esc ile çık`;
  else if(state.missionArm)s='ATEŞ GÖREVİ — hedef noktaya tıkla · sağ tık iptal';
  else if(state.runArm)s='SALDIRI KOŞUSU — başlangıçtan bitişe sürükle (tıklarsan uçağın geliş yönünde koşu) · sağ tık iptal';
  else if(state.precArm)s='HASSAS VURUŞ — hedefe tıkla, Shift ile birden fazla hedef · sağ tık bitir';
  else if(state.attackArm)s='SALDIRI HAREKETİ — hedef noktaya tıkla';
  else if(state.fastArm)s='HIZLI HAREKET — hedefe tıkla; birlikler ateş etmeden koşar';
  t.textContent=tr(s);t.hidden=!s}
/* ---------- arayüz ---------- */
function log(t,c){const d=document.createElement('div');d.textContent=tr(t);if(c)d.className=c;const f=$('feed');f.prepend(d);while(f.children.length>5)f.lastChild.remove();setTimeout(()=>d.remove(),6000)}
/* ---------- döngü ---------- */
function endGame(win){state.over=true;state.running=false;state.dc=null;updTip();
  $('ovt').textContent=tr(win?'ZAFER':'YENİLGİ');
  $('ovp').textContent=tr(win?`Kızıl kuvvetin direnci kırıldı. ${state.stats.kills[0]} düşman askeri ve aracı imha edildi, ${state.stats.lost[0]} kayıp verildi. Süre: ${Math.floor(state.time/60)} dk ${Math.floor(state.time%60)} sn.`
    :`Cephe çöktü. ${state.stats.kills[0]} düşman askeri ve aracı imha edildi, ${state.stats.lost[0]} kayıp verildi. Siperleri kullan, kanatları koru ve topçunu bir gözcüyle besle.`);
  $('ovl').hidden=true;$('goBtn').textContent=tr('YENİDEN SAVAŞ');$('ov').hidden=false}

export {endGame,log,updTip};
