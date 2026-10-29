/* ui/deploy.js — Konuşlanma safhası arayüzü: birlik sürükleme, yön verme, birlik listesi, savaşı başlatma.
   Simülasyon bu safhada state.running=false olduğu için ilerlemez; yalnızca birliklerin konumu ve yönü değişir. */
import {state} from '../state.js';
import {clampCam,toW} from '../camera.js';
import {DEF,FINE,PI} from '../config.js';
import {cam} from '../state.js';
import {beginBattle} from '../game.js';
import {dep,placeErr,placeErrs} from '../systems/deployment.js';
import {hitUnit,sel} from '../systems/orders.js';
import {computeVis} from '../systems/vision.js';
import {log} from './feedback.js';
import {updUI} from './hud.js';
import {$} from '../utils/helpers.js';

let info={name:'',cost:0,back:null},msgT=0;
const own=()=>state.units.filter(u=>u.side===0&&!u.d.plane);
const movable=()=>sel().filter(u=>!u.d.plane);
const cent=l=>({x:l.reduce((a,u)=>a+u.x,0)/l.length,y:l.reduce((a,u)=>a+u.y,0)/l.length});
function pickOwn(x,y){const u=hitUnit(x,y,0);return u&&!u.d.plane?u:null}
/* birlik tek tek değil, mangasıyla seçilir; Shift mangayı seçime ekler veya çıkarır */
function selectSq(u,add){const on=add?!u.sel:true;if(!add)state.units.forEach(x=>x.sel=false);for(const m of state.units)if(m.side===0&&(m===u||(u.sq&&m.sq===u.sq)))m.sel=on}
function setFace(list,a){for(const u of list){u.a=u.ta=a;u.faceA=a}}
function hint(){const h=$('depHint');h.classList.remove('warn');
  h.textContent=FINE?'Birliği sürükle: yer değiştir · Sağ tık + sürükle: yön · Q / E: döndür · Shift: çoklu seçim · Esc: iptal':'Birliğe dokun ve sürükle: yer değiştir · boş alanı sürükle: haritayı kaydır'}
function say(t){const h=$('depHint');h.textContent=t;h.classList.add('warn');const t0=msgT=performance.now();setTimeout(()=>{if(msgT===t0&&state.phase==='deploy')hint()},3500)}
function after(){computeVis();roster();updUI();place()}
/* safha çubuğu üst şeridin, liste de çubuğun hemen altına konur; dar ekranda üst şerit birkaç satıra bölündüğü için ölçülerek yerleştirilir.
   Liste alttaki seçim paneline (en fazla 420 px / dar ekranda %34) yer bırakır. */
function place(){if($('dep').hidden)return;const bar=$('depBar'),r=$('depR');bar.style.top=Math.round($('top').getBoundingClientRect().bottom+8)+'px';
  const t=Math.round(bar.getBoundingClientRect().bottom+8),res=innerWidth<=820?innerHeight*.34+30:Math.min(innerHeight*.6,420)+30;
  r.style.top=t+'px';r.style.bottom='auto';r.style.maxHeight=Math.max(90,innerHeight-t-res)+'px'}
/* seçili grubu merkezi çevresinde döndürür (konum ve yön); bir birim bile geçersiz düşerse hiçbiri değişmez */
function rotate(step){const s=movable();if(!s.length)return;const c=cent(s),co=Math.cos(step),si=Math.sin(step);
  const cands=s.map(u=>({u,x:c.x+(u.x-c.x)*co-(u.y-c.y)*si,y:c.y+(u.x-c.x)*si+(u.y-c.y)*co})),err=placeErrs(cands).find(Boolean);
  if(err){say(`Döndürülemedi: ${err}`);return}for(const k of cands){k.u.x=k.x;k.u.y=k.y;setFace([k.u],(k.u.faceA??k.u.a)+step)}after()}
function roster(){const rows=[];
  for(const sq of state.squads.values()){if(sq.side!==0||!sq.m.length||sq.m[0].inHeli)continue;const ms=sq.m.filter(u=>u.hp>0);if(!ms.length)continue;
    const bad=ms.some(u=>placeErr(u,u.x,u.y,null)),on=ms.every(u=>u.sel),cg=ms.find(u=>u.cargo&&u.cargo.length);
    rows.push(`<button type="button" class="dp-r${on?' on':''}${bad?' bad':''}" data-sq="${sq.id}"><span>${sq.n}</span><small>${ms.length>1?`${ms.length} birim`:DEF[ms[0].key].tag}${cg?` · içinde ${cg.cargo.length} asker`:''}${bad?' · geçersiz konum':''}</small></button>`)}
  for(const e of state.airbase[0])rows.push(`<div class="dp-r air"><span>${DEF[e.key].n}</span><small>Hava üssünde · savaş başlayınca kalkabilir</small></div>`);
  const h=rows.join(''),l=$('depList');if(l.dataset.h!==h){l.innerHTML=h;l.dataset.h=h}
  $('depN').textContent=`${own().length} birim sahada`}
/* ---------- tuval girdisi (input.js çağırır; true dönerse olay tüketilmiştir) ---------- */
function depDown(e){if(e.button===1)return false;
  if(dep.drag){if(e.pointerType==='touch'){dep.drag=null;return false}return true}
  const w=toW(e.offsetX,e.offsetY),u=pickOwn(w.x,w.y);
  if(e.pointerType==='touch'&&!u)return false;
  if(e.button===2){if(u&&!u.sel)selectSq(u,false);const s=movable();if(s.length)dep.drag={k:'face',id:e.pointerId,sx:e.offsetX,sy:e.offsetY,c:cent(s),us:s,ang:null,moved:false};after();return true}
  if(u){if(e.shiftKey)selectSq(u,true);else if(!u.sel)selectSq(u,false);
    if(u.sel)dep.drag={k:'move',id:e.pointerId,sx:e.offsetX,sy:e.offsetY,w0:w,us:movable().map(x=>({u:x,x:x.x,y:x.y})),cand:null,bad:null,moved:false};after();return true}
  state.drag={dep:1,sx:e.offsetX,sy:e.offsetY,cx:e.offsetX,cy:e.offsetY,shift:e.shiftKey,box:false};return true}
function depMove(e){const d=dep.drag;if(!d||e.pointerId!==d.id)return false;const w=toW(e.offsetX,e.offsetY);
  if(Math.hypot(e.offsetX-d.sx,e.offsetY-d.sy)>5)d.moved=true;
  if(d.k==='move'){const dx=w.x-d.w0.x,dy=w.y-d.w0.y;d.cand=d.us.map(o=>({u:o.u,x:o.x+dx,y:o.y+dy}));d.bad=placeErrs(d.cand)}
  else d.ang=Math.atan2(w.y-d.c.y,w.x-d.c.x);
  return true}
function depUp(e){const d=dep.drag;
  if(e.type==='pointercancel'){if(d&&e.pointerId===d.id){dep.drag=null;return true}if(state.drag&&state.drag.dep){state.drag=null;return true}return false}
  if(d&&e.pointerId===d.id){dep.drag=null;
    if(d.k==='move'&&d.moved&&d.cand){const err=placeErrs(d.cand).find(Boolean);if(err)say(`Yerleştirilemedi: ${err}`);else for(const c of d.cand){c.u.x=c.x;c.u.y=c.y}}
    else if(d.k==='face'){const w=toW(e.offsetX,e.offsetY);if(d.moved||Math.hypot(w.x-d.c.x,w.y-d.c.y)>12)setFace(d.us,d.moved&&d.ang!=null?d.ang:Math.atan2(w.y-d.c.y,w.x-d.c.x))}
    after();return true}
  const b=state.drag;if(b&&b.dep){state.drag=null;
    if(b.box){const a=toW(Math.min(b.sx,b.cx),Math.min(b.sy,b.cy)),c=toW(Math.max(b.sx,b.cx),Math.max(b.sy,b.cy));if(!b.shift)state.units.forEach(u=>u.sel=false);
      for(const u of own())if(u.x>=a.x&&u.x<=c.x&&u.y>=a.y&&u.y<=c.y)u.sel=true}
    else if(!b.shift)state.units.forEach(u=>u.sel=false);
    after();return true}
  return false}
/* ---------- safha geçişleri ---------- */
function close(){dep.drag=null;state.drag=null;$('dep').hidden=true;document.body.classList.remove('deploying')}
/* o: {name, cost, back}: back ordu kurma ekranını açar (seçilen ordu orada korunur) */
function enterDeploy(o){info=o;dep.drag=null;state.units.forEach(u=>u.sel=false);$('depName').textContent=`${o.name} · ${o.cost} OP`;
  document.body.classList.add('deploying');$('dep').hidden=false;hint();after()}
/* tüm birimler geçerli konumdaysa savaş başlar; değilse geçersiz olanlar seçilir ve neden gösterilir */
function go(){const bad=own().filter(u=>placeErr(u,u.x,u.y,null));
  if(bad.length){state.units.forEach(u=>u.sel=false);bad.forEach(u=>u.sel=true);say(`${bad.length} birim geçersiz konumda: ${placeErr(bad[0],bad[0].x,bad[0].y,null)}`);after();return}
  close();for(const u of own())u.dest=null;beginBattle();log(`${info.name}: savaş başladı · ${own().length} birim cephede`,'good')}
function toBuilder(){state.phase=null;close();if(info.back)info.back()}

/* olay dinleyicileri: main.js tarafından başlatılır */
export function initDeploy(){
$('depGo').addEventListener('click',go);
addEventListener('resize',place);
$('depBack').addEventListener('click',toBuilder);
$('depList').addEventListener('click',e=>{const r=e.target.closest('[data-sq]');if(!r)return;const sq=state.squads.get(+r.dataset.sq);if(!sq||!sq.m.length)return;
  selectSq(sq.m[0],e.shiftKey);const c=cent(sq.m);cam.x=c.x-state.VW/cam.z/2;cam.y=c.y-state.VH/cam.z/2;clampCam();after()});
addEventListener('keydown',e=>{if(state.phase!=='deploy'||!$('ov').hidden||e.repeat||(e.target.closest&&e.target.closest('input,textarea')))return;
  if(e.code==='KeyQ')rotate(-PI/12);else if(e.code==='KeyE')rotate(PI/12);
  else if(e.code==='Escape'){if(dep.drag||state.drag){dep.drag=null;state.drag=null}else state.units.forEach(u=>u.sel=false);after()}});
}

export {depDown,depMove,depUp,enterDeploy};
