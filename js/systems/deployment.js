/* systems/deployment.js — Savaş öncesi konuşlanma: bölgeler, yerleştirme kuralları ve sürükleme önizlemesi (çizim renderer.js'te, girdi ui/deploy.js'te). */
import {state} from '../state.js';
import {H,MAP,T,W,bodyR,coastX,seaOnly} from '../config.js';
import {flying} from './units.js';
import {buildingAt,cellAt,shipAt} from '../world/terrain.js';

/* sürükleme önizlemesi: ui/deploy.js yazar, renderer.js okur */
const dep={drag:null};
/* Konuşlanma bölgesi haritadan çıkarılır: kendi kenarından, kendi yarısındaki en yakın stratejik noktanın
   alanına 40 m kalana kadar. Böylece hiçbir nokta savaş başlamadan ele geçirilemez. Bölgeler merkeze göre simetriktir. */
function deployZone(side){let depth=W/2-300;
  for(const o of state.objs){const d=side?W-o.x-o.r:o.x-o.r;if((side?o.x>W/2:o.x<W/2)&&d<depth)depth=d}
  depth=Math.max(240,depth-40);return side?{x0:W-depth,x1:W-30,y0:30,y1:H-30}:{x0:30,x1:depth,y0:30,y1:H-30}}
const footR=u=>u.d.inf?6:bodyR(u.d)-2;
/* bir birliğin (x,y) noktasına konamamasının nedeni; uygunsa null. moving: birlikte taşınan birlikler (çakışma sayılmaz) */
function placeErr(u,x,y,moving){const z=deployZone(u.side);
  /* gemi: bölgede su olmadığı için nehrin kendi yarısındaki kısmına konuşlanır */
  if(u.d.naval){if(!shipAt(u.d,x,y))return seaOnly(u.d)?'Bu gemi yalnızca açık denize konabilir':MAP.coast?'Gemi yalnızca suya konabilir':'Gemi yalnızca nehre konabilir';if(u.side?x<W/2:x>W/2)return'Nehrin düşman yarısında';}
  else if(x<z.x0||x>z.x1||y<z.y0||y>z.y1)return'Konuşlanma bölgesi dışında';
  if(flying(u))return null;
  if(!u.d.naval){const c=cellAt(x,y);if(c===T.WATER||c===T.FORD)return x<coastX(y)+24?'Denize konamaz':'Nehir veya sığ geçit üzerine konamaz';if(buildingAt(x,y))return'Bina üzerine konamaz'}
  for(const o of state.units){if(o===u||o.side!==u.side||flying(o)||(moving&&moving.has(o)))continue;if(Math.hypot(o.x-x,o.y-y)<footR(o)+footR(u))return'Başka bir birlikle çakışıyor'}
  return null}
/* aday konumların her biri için hata (veya null) */
function placeErrs(cands){const mv=new Set(cands.map(c=>c.u));return cands.map(c=>placeErr(c.u,c.x,c.y,mv))}

export {dep,deployZone,placeErr,placeErrs};
