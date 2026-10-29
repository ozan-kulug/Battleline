/* ui/deck.js — Takviye destesi kartları ve sekmeleri. */
import {state} from '../state.js';
import {DEF,PAYN,SQUADS} from '../config.js';
import {drawDrone,drawHeli,drawPlane,drawSoldier,drawVeh} from '../renderer.js';
import {deploy} from '../systems/units.js';
import {$} from '../utils/helpers.js';

const cards=[];
function fakeUnit(k,side){const d=DEF[k];return{side,key:k,d,a:-.25,ta:-.15,hp:d.hp,flash:0,recoil:0,st:'deployed',sup:0,stM:null,moving:false,sees:[],inB:null,trk:0,tur:0,alt:'landed',altT:0,radarOn:false,burn:false}}
function buildDeck(){const dk=$('deck');const ci={};SQUADS.forEach((S,i)=>{const b=document.createElement('button');b.type='button';b.className='card';b.id='card-'+S.k;b.dataset.cat=S.cat;ci[S.cat]=(ci[S.cat]||0)+1;
  b.innerHTML=`<span class="hk">⇧${ci[S.cat]}</span><canvas width="148" height="80"></canvas><span class="nm">${S.n}</span><span class="ct">${S.cost} KP</span><span class="av"></span><span class="fill"></span>`;
  b.title=S.plane?`${S.n} (${S.cost} KP): hava üssüne gelir. ${Object.entries(DEF[S.plane].pay).map(([k,v])=>PAYN[k]+' ×'+v).join(', ')}`:`${S.n} (${S.cost} KP): ${S.m.map(k=>DEF[k].n).join(', ')}${S.k==='heliT'?' + Piyade Mangası (içinde)':''}`;
  b.addEventListener('click',()=>{if(state.running&&!state.over)deploy(0,i)});dk.appendChild(b);
  const c=b.querySelector('canvas').getContext('2d');c.setTransform(2,0,0,2,0,0);drawSquadArt(c,S);cards.push([b,S])});setTab('kara')}
/* kart görseli: 74×40 birimlik alana manga/araç/uçak çizimi (deste ve ordu kurma ekranı ortak kullanır) */
function drawSquadArt(c,S){
  if(S.plane){const f=fakeUnit(S.plane,0);f.a=-.35;drawPlane(c,f,37,20,S.plane==='bmb'?.8:S.plane==='tb2'?1.5:1.15)}
  else if(DEF[S.m[0]].drone){S.m.forEach((k,j)=>{const f=fakeUnit(k,0);f.a=-.35;drawDrone(c,f,S.m.length>1?16+j*21:37,S.m.length>1?14+(j%2)*12:20,S.m.length>1?1.4:2.2)})}
  else if(DEF[S.m[0]].heli){const f=fakeUnit(S.m[0],0);f.a=-.35;drawHeli(c,f,37,20,1.25)}
  else if(DEF[S.m[0]].inf){const n=S.m.length;S.m.forEach((k,j)=>{const f=fakeUnit(k,0);f.st='travel';drawSoldier(c,f,14+(j%3)*20+(j>=3?10:0),12+(j/3|0)*16+(n<=3?4:0),1.5)})}
  else drawVeh(c,fakeUnit(S.m[0],0),37,20,1.1)}
function setTab(t){state.deckTab=t;for(const [b,S] of cards)b.hidden=S.cat!==t;for(const x of $('tabs').children)x.classList.toggle('on',x.dataset.tab===t)}

/* olay dinleyicileri: main.js tarafından başlatılır */
export function initDeck(){
$('tabs').addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t)setTab(t.dataset.tab)});
}

export {buildDeck,cards,drawSquadArt};
