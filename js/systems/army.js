/* systems/army.js — Savaş öncesi ordu: ordu puanı (OP) hesabı, doğrulama, YZ ordusu ve başlangıç birliklerinin mevcut oluşturma fonksiyonlarıyla sahaya konması. */
import {state} from '../state.js';
import {ARMY,COMBAT,H,SQUADS,W} from '../config.js';
import {spawnLoaded} from './units.js';
import {buildingAt,isWater} from '../world/terrain.js';

/* oyuncunun ilk açılıştaki önerisi; eski başlangıç kuvvetiyle aynı (3 piyade, keşif, ZMA) */
const DEFAULT_ARMY=['inf','inf','recon','inf','ifv'];
/* YZ ordusu bu sırayla, bütçe ve adet sınırı içinde, birkaç tur dolaşılarak doldurulur */
const AI_TEMPLATE=['inf','inf','recon','inf','ifv','tank','at','mortar','supply','inf','manpads','mech','arty','tank','inf','at','shorad','ifv','inf','tank','heliA','mortar','inf','at'];
const sqIdx=k=>SQUADS.findIndex(S=>S.k===k);
const sqOf=k=>SQUADS[sqIdx(k)];
const armyCap=k=>{const S=sqOf(k);return S?Math.min(ARMY.cap,S.av):0};
const armyCost=list=>list.reduce((a,k)=>a+(sqOf(k)?.cost||0),0);
const countOf=(list,k)=>list.reduce((a,x)=>a+(x===k),0);
/* eklemeyi engelleyen neden (yoksa null) */
function addBlock(list,k,budget){const S=sqOf(k);if(!S)return'Bilinmeyen birlik';const c=armyCap(k);if(countOf(list,k)>=c)return`${S.n}: en fazla ${c} adet alınabilir`;
  const left=budget-armyCost(list);if(S.cost>left)return`Bütçe yetmiyor: ${S.n} ${S.cost} OP, kalan ${Math.max(0,left)} OP`;return null}
function checkArmy(list,budget){const err=[],cost=armyCost(list);
  if(!list.length)err.push('Ordu boş: en az bir birlik seç');
  else if(!list.some(k=>COMBAT.has(k)))err.push('En az bir muharebe birliği gerekli: piyade, tanksavar, ZMA, mekanize piyade veya tank');
  if(cost>budget)err.push(`Bütçe ${cost-budget} OP aşıldı: birlik çıkar veya bütçeyi yükselt`);
  for(const k of new Set(list)){const S=sqOf(k);if(!S)err.push(`Bilinmeyen birlik: ${k}`);else if(countOf(list,k)>armyCap(k))err.push(`${S.n}: en fazla ${armyCap(k)} adet`)}
  return{ok:!err.length,cost,err}}
function autoArmy(budget){const list=[];for(let added=true;added;){added=false;for(const k of AI_TEMPLATE)if(!addBlock(list,k,budget)){list.push(k);added=true}}return list}
/* başlangıç dizilişi: piyade önde, araçlar ortada, topçu ve ikmal üs içinde (orada ikmal alır) */
const LANE={inf:'f',at:'f',recon:'f',manpads:'f',mortar:'r',arty:'r',supply:'r',sam:'r'};
const LANEX={f:360,m:270,r:170};
function freeX(x,y){for(const dx of [0,30,-30,60,-60])if(!buildingAt(x+dx,y)&&!isWater(x+dx,y))return x+dx;return x}
/* seçilen orduyu kurar: kara birlikleri spawnLoaded (takviyelerle aynı yol), uçaklar hava üssüne kalkışa hazır olarak girer */
function spawnArmy(side,list){const lanes={f:[],m:[],r:[]};
  for(const k of list){const i=sqIdx(k);if(i<0)continue;const S=SQUADS[i];
    if(S.plane){state.airbase[side].push({id:state.abid++,key:S.plane,side,st:'ready',t:0,u:null});continue}
    lanes[LANE[k]||'m'].push(i)}
  for(const [ln,ids] of Object.entries(lanes))ids.forEach((idx,j)=>{const y=Math.round(320+(j+.5)*(H-640)/ids.length),x=freeX(LANEX[ln],y);spawnLoaded(side,idx,side?W-x:x,side?H-y:y)})}

export {DEFAULT_ARMY,addBlock,armyCap,armyCost,autoArmy,checkArmy,countOf,spawnArmy,sqOf};
