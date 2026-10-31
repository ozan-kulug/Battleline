/* systems/zones.js — Stratejik noktaların sağlamlığı ve onarımı. Sağlamlık noktadaki binaların kalan canından (köprü noktasında köprünün
   canından) hesaplanır; gelir ve özel avantaj bu oranla düşer, ZONE.dead altında nokta yıkık sayılır (gelir/avantaj yok, ele geçirme ve zafer
   sayımı sürer). Noktayı tutan tarafın noktada duran ikmal kamyonları binaları onarır (en fazla ZONE.trucks kamyon hızlandırır). */
import {state} from '../state.js';
import {ZONE} from '../config.js';
import {log} from '../ui/feedback.js';
import {drawBld} from '../world/terrain.js';

/* maç başında: her noktaya bağlı binalar (merkezi nokta yarıçapının ZONE.reach katı içinde) ve köprü noktasının köprüsü */
function setupZones(){for(const o of state.objs){o.bl=state.buildings.filter(b=>Math.hypot(b.x+b.w/2-o.x,b.y+b.h/2-o.y)<o.r*ZONE.reach);
  o.br=o.k==='bridge'?state.bridges.reduce((a,b)=>!a||Math.hypot(b.x-o.x,b.y-o.y)<Math.hypot(a.x-o.x,a.y-o.y)?b:a,null):null;o.wasDead=false}}
/* sağlamlık 0..1 */
function zoneInt(o){if(o.br)return o.br.dead?0:o.br.hp/o.br.max;if(!o.bl||!o.bl.length)return 1;let h=0,m=0;for(const b of o.bl){m+=b.max;if(!b.dead)h+=Math.max(0,b.hp)}return m?h/m:1}
/* gelir ve avantaj çarpanı: yıkıksa 0 */
function zoneEff(o){const i=zoneInt(o);return i<ZONE.dead?0:i}
/* yıkık binayı yeniden kurar: enkaz siperi kalkar, bina yeniden çizilir */
function rebuild(b){b.dead=false;b.burn=0;b.occ=[];state.covers=state.covers.filter(c=>!(c.t==='rubble'&&Math.abs(c.x-(b.x+b.w/2))<1&&Math.abs(c.y-(b.y+b.h/2))<1));drawBld(b);state.mmDirty=true}
/* saniyede bir: kamyonla onarım ve yıkılma/onarılma bildirimleri */
function updZones(dt){for(const o of state.objs){
    if(o.owner>=0&&!o.br&&o.bl.length&&zoneInt(o)<1){
      const n=Math.min(ZONE.trucks,state.units.filter(u=>u.side===o.owner&&u.d.supply&&u.hp>0&&!u.abandoned&&!u.dest&&!u.moving&&Math.hypot(u.x-o.x,u.y-o.y)<o.r).length);
      if(n){let pool=o.bl.reduce((a,b)=>a+b.max,0)*n/ZONE.repT*dt;o.repT=state.time;
        /* önce yıkık, sonra en çok hasarlı binalar */
        for(const b of [...o.bl].sort((p,q)=>(p.dead?-1:p.hp/p.max)-(q.dead?-1:q.hp/q.max))){if(pool<=0)break;if(!b.dead&&b.hp>=b.max)continue;
          const was=b.dead;if(b.dead&&b.hp<0)b.hp=0;const add=Math.min(pool,b.max-b.hp);b.hp+=add;pool-=add;
          if(was&&b.hp>=b.max*ZONE.revive)rebuild(b);else if(!was&&b.hp>=b.max)drawBld(b)}}}
    const dead=zoneEff(o)===0;if(dead!==o.wasDead){o.wasDead=dead;if(o.owner>=0)log(dead?`${o.n} noktası yıkıldı, gelir ve avantaj durdu`:`${o.n} noktası onarıldı`,dead===(o.owner===0)?'bad':'good')}}}

export {setupZones,updZones,zoneEff,zoneInt};
