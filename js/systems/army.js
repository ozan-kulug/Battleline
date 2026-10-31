/* systems/army.js — Savaş öncesi ordu: ordu puanı (OP) hesabı, doğrulama, YZ ordusu ve başlangıç birliklerinin mevcut oluşturma fonksiyonlarıyla sahaya konması. */
import {state} from '../state.js';
import {ARMY,COMBAT,DEF,H,MAP,SQUADS,W,coastX,edgeX,riverX,seaOnly,shipC} from '../config.js';
import {spawnLoaded} from './units.js';
import {buildingAt,isWater} from '../world/terrain.js';

/* oyuncunun ilk açılıştaki önerisi; eski başlangıç kuvvetiyle aynı (3 piyade, keşif, ZMA) */
const DEFAULT_ARMY=['inf','inf','recon','inf','ifv'];
/* YZ ordusu bu sırayla, bütçe ve adet sınırı içinde, birkaç tur dolaşılarak doldurulur */
const AI_TEMPLATE=['inf','inf','recon','inf','ifv','tank','at','mortar','supply','dronop','inf','manpads','mech','arty','tank','inf','at','shorad','ifv','inf','tank','heliA','mortar','inf','at','hfa'];
const sqIdx=k=>SQUADS.findIndex(S=>S.k===k);
const sqOf=k=>SQUADS[sqIdx(k)];
const armyCap=k=>{const S=sqOf(k);return S?state.sandbox?ARMY.sandCap:Math.min(ARMY.cap,S.av):0};
const armyCost=list=>list.reduce((a,k)=>a+(sqOf(k)?.cost||0),0);
const countOf=(list,k)=>list.reduce((a,x)=>a+(x===k),0);
/* eklemeyi engelleyen neden (yoksa null) */
/* yalnız-deniz gemisi (fırkateyn, destroyer) denizi olan haritada alınabilir */
const needSea=S=>!!S&&S.m.length>0&&seaOnly(DEF[S.m[0]])&&!MAP.coast;
function addBlock(list,k,budget){const S=sqOf(k);if(!S)return'Bilinmeyen birlik';if(needSea(S))return`${S.n}: yalnızca Kıyı Cephesi haritasında`;const c=armyCap(k);if(countOf(list,k)>=c)return`${S.n}: en fazla ${c} adet alınabilir`;
  const left=budget-armyCost(list);if(S.cost>left)return`Bütçe yetmiyor: ${S.n} ${S.cost} OP, kalan ${Math.max(0,left)} OP`;return null}
function checkArmy(list,budget){const err=[],cost=armyCost(list);
  if(!list.length)err.push('Ordu boş: en az bir birlik seç');
  else if(!list.some(k=>COMBAT.has(k)))err.push('En az bir muharebe birliği gerekli: piyade, tanksavar, ZMA, mekanize piyade veya tank');
  if(cost>budget)err.push(`Bütçe ${cost-budget} OP aşıldı: birlik çıkar veya bütçeyi yükselt`);
  for(const k of new Set(list)){const S=sqOf(k);if(needSea(S))err.push(`${S.n}: yalnızca Kıyı Cephesi haritasında`);if(!S)err.push(`Bilinmeyen birlik: ${k}`);else if(countOf(list,k)>armyCap(k))err.push(`${S.n}: en fazla ${armyCap(k)} adet`)}
  return{ok:!err.length,cost,err}}
function autoArmy(budget){const list=[];for(let added=true;added;){added=false;for(const k of AI_TEMPLATE)if(!addBlock(list,k,budget)){list.push(k);added=true}}return list}
/* başlangıç dizilişi: piyade önde, araçlar ortada, topçu ve ikmal üs içinde (orada ikmal alır) */
const LANE={inf:'f',at:'f',recon:'f',manpads:'f',mortar:'r',arty:'r',supply:'r',sam:'r',hfa:'r'};
const LANEX={f:360,m:270,r:170};
/* şerit boyunca j. birliğin y'si; kıyı haritasında oyuncu için koy satırları (sahil konuşlanmaya dar) atlanır */
function laneY(side,j,n){if(!MAP.coast||side)return Math.round(320+(j+.5)*(H-640)/n);
  const c=[];for(let y=320;y<=H-320;y+=10)if(coastX(y)<340)c.push(y);return c[Math.floor((j+.5)*c.length/n)]}
function freeX(x,y){for(const dx of [0,30,-30,60,-60])if(!buildingAt(x+dx,y)&&!isWater(x+dx,y))return x+dx;return x}
/* seçilen orduyu kurar: kara birlikleri spawnLoaded (takviyelerle aynı yol), uçaklar hava üssüne kalkışa hazır olarak girer */
function spawnArmy(side,list){const lanes={f:[],m:[],r:[]},sea=[];
  for(const k of list){const i=sqIdx(k);if(i<0)continue;const S=SQUADS[i];
    if(S.plane){state.airbase[side].push({id:state.abid++,key:S.plane,side,st:'ready',t:0,u:null});continue}
    if(S.m.length&&DEF[S.m[0]].naval){if(MAP.coast||!seaOnly(DEF[S.m[0]]))sea.push(i);continue}
    lanes[LANE[k]||'m'].push(i)}
  /* gemiler nehrin kendi yarısında kalan kesimlerine, kendi ucundan başlayarak dizilir */
  /* kıyı haritasında oyuncunun gemileri liman önünde, limandan başlayarak kuzeye-güneye dizilir */
  /* kıyıda gemiler kıyıya paralel (baş kuzeye) dizilir: büyükler önce, iskelelerin güneyinden başlayıp güneye-kuzeye, aralık gövde boyuna göre; x gövde boyunca en dar deniz şeridinin ortası */
  if(MAP.port&&!side){const Ls=idx=>shipC(DEF[SQUADS[idx].m[0]]).L,P=MAP.port.y;let up=P-170,dn=P+170;
    [...sea].sort((a,b)=>Ls(b)-Ls(a)).forEach((idx,j)=>{const L=Ls(idx);let y;if(j%2===0){y=dn+30+L/2;dn=y+L/2}else{y=up-30-L/2;up=y-L/2}
      const x=Math.min(...[-.5,-.25,0,.25,.5].map(t=>coastX(y+t*L)))*.5;spawnLoaded(side,idx,x,y)})}
  else{const ys=[];for(let y=H-120;y>120&&ys.length<sea.length;y-=110)if(riverX(y)<W/2-40)ys.push(y);
  sea.forEach((idx,j)=>{const y=ys[j]??H-120,x=riverX(y);spawnLoaded(side,idx,side?W-x:x,side?H-y:y)})}
  for(const [ln,ids] of Object.entries(lanes))ids.forEach((idx,j)=>{const y=laneY(side,j,ids.length),x=freeX(MAP.coast&&!side?edgeX(0,y)+LANEX[ln]-140:LANEX[ln],y);spawnLoaded(side,idx,side?W-x:x,side?H-y:y)})}

export {DEFAULT_ARMY,addBlock,armyCap,armyCost,autoArmy,checkArmy,countOf,spawnArmy,sqOf};
