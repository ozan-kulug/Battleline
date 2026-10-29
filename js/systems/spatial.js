/* systems/spatial.js — Birlikler için uzamsal ızgara (yakındaki birlikleri hızlı bulma). */
import {state} from '../state.js';
import {W} from '../config.js';

/* birlikler için uzamsal ızgara: yalnızca yakın birlikler karşılaştırılır */
const UH=96;
const UHW=Math.ceil(W/UH)+1;
let uhash=new Map();
function buildHash(){uhash=new Map();for(const u of state.units){if(u.inB||u.inHeli)continue;const k=((u.y/UH|0)+1)*UHW+((u.x/UH|0)+1);const l=uhash.get(k);if(l)l.push(u);else uhash.set(k,[u])}}
function nearUnits(x,y,r,fn){const c0=(x-r)/UH|0,c1=(x+r)/UH|0,r0=(y-r)/UH|0,r1=(y+r)/UH|0;for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const l=uhash.get((cy+1)*UHW+cx+1);if(l)for(const u of l)fn(u)}}

export {UH,UHW,buildHash,nearUnits,uhash};
