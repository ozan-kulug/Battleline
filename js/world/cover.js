/* world/cover.js — Siper ve duruş: siper bulma, yönlü siper koruması, duruş (ayakta/çömel/yat), tüfekçi çukuru. */
import {state} from '../state.js';
import {T} from '../config.js';
import {segInfo,sideOf} from '../utils/helpers.js';
import {cellAt,coversNear,drawCover} from './terrain.js';

function vehCover(u){let best=null,bd=24;for(const c of coversNear(u.x,u.y)){if(c.r!=null||c.t==='trench')continue;const s=segInfo(c,u.x,u.y);if(s.d<bd){bd=s.d;best=c}}return best}
/* ---------- siper, bina ---------- */
function coverAt(u){if(!u.d.inf||u.inB)return null;let best=null,bd=1e9;
  for(const c of coversNear(u.x,u.y)){let d;if(c.r!=null){if(Math.abs(u.x-c.x)>c.r+4||Math.abs(u.y-c.y)>c.r+4)continue;d=Math.hypot(u.x-c.x,u.y-c.y)-c.r;if(d<3&&d<bd){bd=d;best=c}}else{if(u.x<Math.min(c.x1,c.x2)-13||u.x>Math.max(c.x1,c.x2)+13||u.y<Math.min(c.y1,c.y2)-13||u.y>Math.max(c.y1,c.y2)+13)continue;const s=segInfo(c,u.x,u.y);if(s.d<(c.t==='trench'?9:12)&&s.d<bd){bd=s.d;best=c}}}return best}
function effStance(u){if(!u.d.inf)return'stand';if(u.panicT>0||(u.mode==='fast'&&u.moving))return'stand';if(u.inB)return'crouch';if(u.sup>65)return'prone';if(u.stM)return u.stM;if(u.moving)return'stand';if(u.init!=='off'&&!u.cov&&(u.sup>35||state.time-u.shotAtT<3))return'prone';return(u.cov||u.sees.length)?'crouch':'stand'}
/* siperden ateş: silah dayanaklı, isabet artar */
const braced=u=>u.d.inf&&!u.moving&&u.cov&&u.cov.t!=='hedge';
function coverMult(t,sx,sy){if(!t.d.inf)return 1;let m=1;const c=t.cov;
  if(t.inB){const f=Math.max(0,t.inB.hp/t.inB.max);m=.3+.4*(1-f)}
  else if(c){if(c.t==='fox')m=.33;else if(c.t==='rubble')m=.45;else if(c.t==='wreck')m=.5;
    else if(c.t==='trench'){const la=Math.atan2(c.y2-c.y1,c.x2-c.x1),aa=Math.atan2(sy-t.y,sx-t.x);m=Math.abs(Math.sin(aa-la))<.34?.85:.3}
    else if(sideOf(c,sx,sy)!==sideOf(c,t.x,t.y))m=c.t==='hedge'?.65:c.t==='wall'?.28:.3}
  else{const ce=cellAt(t.x,t.y);if(ce===T.FOREST)m=.7;else if(ce===T.TOWN)m=.85}
  const st=effStance(t);if(!t.inB)m*=st==='prone'?.5:st==='crouch'?.75:1;return Math.max(.1,m)}
function splashCov(e,gren){if(!e.d.inf)return 1;const c=e.cov;let m=1;
  if(c)m=(c.t==='fox'||c.t==='trench')?(gren?.8:.3):(c.t==='rubble'||c.t==='wreck')?.5:(gren?.6:.75);
  const st=effStance(e);m*=st==='prone'?.55:st==='crouch'?.85:1;return m}
function makeFox(u){if(state.covers.some(c=>c.r!=null&&Math.hypot(c.x-u.x,c.y-u.y)<12))return;const c={t:'fox',x:u.x,y:u.y,r:8};state.covers.push(c);drawCover(c);u.cov=c;state.mmDirty=true}

export {braced,coverAt,coverMult,effStance,makeFox,splashCov,vehCover};
