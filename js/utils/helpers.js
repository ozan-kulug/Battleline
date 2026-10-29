/* utils/helpers.js — Ortak yardımcılar: DOM seçici, rastgele sayı, açı ve geometri fonksiyonları. */
import {PI,TAU} from '../config.js';

const $=id=>document.getElementById(id);
/* ---------- yardımcılar ---------- */
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=Math.random;
const angDiff=(a,b)=>{let d=(a-b)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const gauss=()=>(R()+R()+R()-1.5)/1.5;
function segInfo(c,x,y){const vx=c.x2-c.x1,vy=c.y2-c.y1,L2=vx*vx+vy*vy||1;const t=clamp(((x-c.x1)*vx+(y-c.y1)*vy)/L2,0,1);const px=c.x1+vx*t,py=c.y1+vy*t;return{d:Math.hypot(x-px,y-py),px,py,t}}
const sideOf=(c,x,y)=>Math.sign((c.x2-c.x1)*(y-c.y1)-(c.y2-c.y1)*(x-c.x1));
const dist2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export {$,R,angDiff,clamp,dist2,gauss,rng,segInfo,sideOf};
