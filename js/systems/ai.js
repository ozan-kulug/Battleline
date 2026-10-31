/* systems/ai.js — Düşman yapay zekâsı: hafıza, nokta değerlendirmesi, görevler, saldırı aşamaları, destek birlikleri, satın alma, hava. */
import {state} from '../state.js';
import {AIDIF,COMBAT,DMG,ECON,H,PI,SQUADS,T,TAU,W,ZK,riverX} from '../config.js';
import {assignRunFor,launch} from './air.js';
import {brLoss,ends,nearEnd,orderRepair} from './bridges.js';
import {zoneInt} from './zones.js';
import {bCap} from '../world/buildings.js';
import {orderGroup} from './orders.js';
import {deploy,flying,giveMove,unloadHeli,upkMul} from './units.js';
import {log} from '../ui/feedback.js';
import {R,clamp,dist2,gauss} from '../utils/helpers.js';
import {buildingAt,cellAt,isWater} from '../world/terrain.js';

const mkAI=()=>({mem:new Map(),memA:[],tasks:[],planT:0,save:null,saveT:0,posture:'bal',warn:new Set(),focus:null,tid:1});
const AIS=[mkAI(),mkAI()];
const fwd=sd=>sd?-1:1;
const baseX=sd=>sd?W-240:240;
const behind=(sd,x,d)=>clamp(x-fwd(sd)*d,60,W-60);
function aiReset(){AIS[0]=mkAI();AIS[1]=mkAI();for(const o of state.objs){o.eS=[0,0];o.oS=[0,0];o.front=[false,false];o.cool=[0,0]}}
function uStr(u){if(!u||u.d.plane||u.abandoned||u.hp<=0)return 0;let v=(u.val||20)*(u.hp/u.d.hp);if(u.d.indirect||u.d.supply||u.d.drone)v*=.3;if(u.inB||u.cov)v*=1.3;return v}
function enemyNear(sd,x,y,r){let s=0;for(const m of AIS[sd].memA){if(m.air)continue;if(Math.abs(m.x-x)<r&&Math.hypot(m.x-x,m.y-y)<r)s+=m.v*Math.max(.35,1-(state.time-m.t)/70)}return s}
function ourNear(sd,x,y,r){let s=0;for(const u of state.units)if(u.side===sd&&!u.d.plane&&!u.abandoned&&Math.abs(u.x-x)<r&&Math.hypot(u.x-x,u.y-y)<r)s+=uStr(u);return s}
const sqStr=q=>q.m.reduce((a,u)=>a+uStr(u),0);
const sqPos=q=>{const n=q.m.length||1;return{x:q.m.reduce((a,u)=>a+u.x,0)/n,y:q.m.reduce((a,u)=>a+u.y,0)/n}};
function aiMemory(sd){const A=AIS[sd],en=1-sd;
  for(const e of state.units)if(e.side===en&&state.vis[sd].has(e.id)&&!e.abandoned&&!e.d.plane)A.mem.set(e.id,{u:e,x:e.x,y:e.y,t:state.time,v:uStr(e),air:flying(e),armor:!e.d.inf&&(e.d.aF||0)>=4,inf:e.d.inf,dug:!!(e.cov||e.inB),aa:e.d.w.some(w=>w.aaOnly||w.k==='flak'),ind:!!e.d.indirect});
  for(const [id,m] of A.mem){if(m.u.hp<=0||m.u.gone||m.u.side!==en||m.u.abandoned||state.time-m.t>70){A.mem.delete(id);continue}
    if(!state.vis[sd].has(id)&&state.units.some(f=>f.side===sd&&!f.d.air&&Math.abs(f.x-m.x)<110&&Math.hypot(f.x-m.x,f.y-m.y)<110))A.mem.delete(id)}
  A.memA=[...A.mem.values()]}
function stagePt(sd,o){let dx=-fwd(sd),dy=0;const own=state.objs.filter(q=>q.owner===sd&&q!==o).sort((a,b)=>dist2(a,o)-dist2(b,o))[0];
  if(own&&dist2(own,o)<1400){const d=dist2(own,o)||1;dx=(own.x-o.x)/d;dy=(own.y-o.y)/d}
  let x=o.x+dx*(o.r+330),y=o.y+dy*(o.r+330);for(let k=0;k<8&&(isWater(x,y)||buildingAt(x,y));k++){x+=dx*40;y+=dy*40+gauss()*25}return{x:clamp(x,60,W-60),y:clamp(y,60,H-60)}}
function evalObjs(sd){const A=AIS[sd];for(const o of state.objs){o.eS[sd]=enemyNear(sd,o.x,o.y,o.r+260);
  const seen=A.memA.some(m=>state.time-m.t<25&&dist2(m,o)<o.r+300)||state.units.some(u=>u.side===sd&&!u.d.plane&&dist2(u,o)<o.r+150);
  if(o.owner===1-sd&&!seen)o.eS[sd]=Math.max(o.eS[sd],200);o.oS[sd]=ourNear(sd,o.x,o.y,o.r+260);o.front[sd]=o.owner===sd&&state.objs.some(q=>q.owner!==sd&&dist2(q,o)<1300)}}
function aaNear(sd,p){for(const m of AIS[sd].memA)if(m.aa&&dist2(m,p)<800)return true;return false}
function sqGo(q,x,y,mode,key){if(q.go===key)return;q.go=key;q.goT=state.time;const lead=q.m[0];
  if(lead.d.inf&&mode!=='fast'&&!lead.d.indirect){const b=state.buildings.filter(b=>!b.dead&&bCap(b)>=Math.min(q.m.length,4)&&b.occ.length===0&&!(b.burn>0)&&Math.hypot(b.x+b.w/2-x,b.y+b.h/2-y)<110).sort((a,c)=>Math.hypot(a.x+a.w/2-x,a.y+a.h/2-y)-Math.hypot(c.x+c.w/2-x,c.y+c.h/2-y))[0];
    if(b&&R()<.6){orderGroup(q.m,b.x+b.w/2,b.y+b.h/2,mode);return}}
  orderGroup(q.m,x,y,mode)}
function leaveTask(q){if(q.task){q.task.sqs=q.task.sqs.filter(x=>x!==q);q.task=null}q.gar=null;q.go=null}
function retreatSq(sd,q){const p=sqPos(q),lead=q.m[0];let x=behind(sd,p.x,350),y=p.y;
  if(lead.d.inf){const own=state.objs.filter(o=>o.owner===sd&&(p.x-o.x)*fwd(sd)>-50&&o.eS[sd]<60).sort((a,b)=>dist2(a,p)-dist2(b,p))[0];if(own){x=own.x;y=own.y}}
  else{const s=state.units.find(u=>u.side===sd&&u.d.supply&&!u.dest&&dist2(u,p)<1200),dep=state.objs.find(o=>o.k==='depot'&&o.owner===sd);if(s){x=s.x-fwd(sd)*30;y=s.y}else if(dep){x=dep.x;y=dep.y}else x=baseX(sd)}
  q.go=null;orderGroup(q.m,x,y,'fast');q.goT=state.time}
function sqBroken(q){const lead=q.m[0];if(lead.d.inf){const n=q.m.length;return n/(q.max||n)<=.34||q.m.reduce((a,u)=>a+u.sup,0)/n>80}return lead.hp<lead.d.hp*.35}
/* tükenmiş iki piyade mangasını birleştir */
function mergeSquads(sd,sqs){const weak=sqs.filter(q=>q.k==='inf'&&!q.task&&q.m.length<=3&&q.m.every(u=>!u.dest));
  for(let i=0;i<weak.length;i++)for(let j=i+1;j<weak.length;j++){const a=weak[i],b=weak[j];if(!a.m.length||!b.m.length||a.m.length+b.m.length>6||dist2(sqPos(a),sqPos(b))>350)continue;
    for(const u of b.m){u.sq=a;a.m.push(u)}b.m=[];state.squads.delete(b.id);a.max=a.m.length;a.ret=0;a.go=null;a.gar=a.gar||b.gar}}
function aiPrep(sd,t){const A=AIS[sd],o=t.o;let any=false;const tg=A.memA.filter(m=>!m.air&&dist2(m,o)<o.r+220);
  const pts=tg.map(m=>({x:m.x,y:m.y,s:tg.reduce((a,n)=>a+(dist2(n,m)<90?n.v*(n.dug?1.5:1):0),0)})).sort((a,b)=>b.s-a.s);
  let k=0;for(const u of state.units){if(u.side!==sd||!u.d.indirect||u.st!=='deployed'||u.mission)continue;const p=pts[k%Math.max(1,pts.length)]||o,w=u.d.w[0],d=dist2(p,u);
    if(d>w.r||d<w.min||u.ammo[0].he<2)continue;u.mission={x:p.x+gauss()*15,y:p.y+gauss()*15,shell:'he',n:u.key==='hfa'?1:u.key==='arty'?3:4,fired:0};any=true;k++}
  const L=dist2(t.stage,o)||1,sx=o.x+(t.stage.x-o.x)/L*(o.r+60),sy=o.y+(t.stage.y-o.y)/L*(o.r+60);let open=0;for(let f=0;f<=1.001;f+=.1){const c=cellAt(o.x+(t.stage.x-o.x)*f,o.y+(t.stage.y-o.y)*f);if(c!==T.FOREST&&c!==T.TOWN)open++}
  if(open>=8){const sm=state.units.find(u=>u.side===sd&&u.d.indirect&&u.st==='deployed'&&!u.mission&&u.ammo[0].smoke>=2&&Math.hypot(sx-u.x,sy-u.y)<u.d.w[0].r&&Math.hypot(sx-u.x,sy-u.y)>u.d.w[0].min);if(sm){sm.mission={x:sx,y:sy,shell:'smoke',n:2,fired:0};any=true}}
  const armor=tg.filter(m=>m.armor);if(tg.length&&!aaNear(sd,o))for(const e of state.airbase[sd]){if(e.st!=='ready'||(e.key!=='cas'&&e.key!=='mr'))continue;const u=launch(e);if(!u)continue;
    if(e.key==='mr'&&armor.length){u.strikes=armor.slice(0,4).map(m=>({t:m.u,x:m.x,y:m.y}));u.alt='high'}
    else{const a=(sd?PI:0)+gauss()*.3,c=pts[0]||o;u.runType=u.pay.rockets>=1&&!armor.length?'rockets':'gun';assignRunFor(u,c.x-Math.cos(a)*110,c.y-Math.sin(a)*110,c.x+Math.cos(a)*110,c.y+Math.sin(a)*110)}any=true;break}
  if(any&&sd===1&&t.sqs.some(q=>q.m.some(u=>state.vis[0].has(u.id))))log(`Düşman ${o.n} noktasına hazırlık ateşi açıyor`,'bad');return any}
function runAttack(sd,t){const o=t.o;
  if(o.owner===sd){const inf=t.sqs.find(q=>q.m[0].d.inf);for(const q of t.sqs){q.task=null;q.go=null}if(inf)inf.gar=o;t.done=1;o.cool[sd]=state.time+15;return}
  if(!t.sqs.length&&state.time-t.t0>20){t.done=1;o.cool[sd]=state.time+10;return}
  if(t.easy&&o.eS[sd]>120){t.easy=0;t.ph='gather';t.t0=state.time;t.need=Math.max(300,o.eS[sd]*1.8);for(const q of t.sqs)q.go=null}
  const str=t.sqs.reduce((a,q)=>a+sqStr(q),0);
  if(t.ph==='gather'){
    const px=-(t.stage.y-o.y),py=t.stage.x-o.x,L=Math.hypot(px,py)||1;
    t.sqs.forEach((q,i)=>{const off=(i-(t.sqs.length-1)/2)*70,p=sqPos(q),far=dist2(p,t.stage)>700&&enemyNear(sd,t.stage.x,t.stage.y,500)<50;sqGo(q,t.stage.x+px/L*off,t.stage.y+py/L*off,far?'fast':'move','g'+t.id)});
    const ready=t.sqs.filter(q=>dist2(sqPos(q),t.stage)<260).reduce((a,q)=>a+sqStr(q),0);
    if(t.sqs.length&&(ready>=t.need*.85||(state.time-t.t0>75&&ready>=t.need*.55))){t.ph='prep';t.pt=state.time;t.prep=R()<AIDIF[state.aiDiff].coord?aiPrep(sd,t):false}
    else if(state.time-t.t0>140){o.cool[sd]=state.time+60;t.done=1;for(const q of t.sqs){q.task=null;q.go=null}}
    if(sd===1&&!AIS[sd].warn.has(t.id)&&t.sqs.some(q=>q.m.some(u=>state.vis[0].has(u.id)))){AIS[sd].warn.add(t.id);log(`İstihbarat: düşman ${o.n} noktası önünde toplanıyor`,'bad')}
    return}
  if(t.ph==='prep'){if(state.time-t.pt>(t.prep?9:1.5)){t.ph='assault';t.s0=Math.max(1,str);t.at=state.time}return}
  if(!t.s0||str>t.s0)t.s0=Math.max(1,str);
  const L=dist2(t.stage,o)||1,ux=(t.stage.x-o.x)/L,uy=(t.stage.y-o.y)/L,px=-uy,py=ux;let ii=0;
  for(const q of t.sqs){const lead=q.m[0];if(state.time-(q.goT||0)>25&&q.m.every(u=>!u.dest)&&dist2(sqPos(q),o)>o.r*.8)q.go=null;
    if(lead.d.inf){const sp=(ii++%3-1)*o.r*.45;sqGo(q,o.x+px*sp+ux*o.r*.15,o.y+py*sp+uy*o.r*.15,'attack','a'+t.id)}
    else if(q.k==='mech'&&lead.cargo&&lead.cargo.length){q.unloadAt={x:o.x+ux*(o.r+110),y:o.y+uy*(o.r+110)};sqGo(q,q.unloadAt.x,q.unloadAt.y,'move','a'+t.id)}
    else{const back=lead.key==='tank'?o.r*.9:o.r*.45,j=gauss()*60;sqGo(q,o.x+ux*back+px*j,o.y+uy*back+py*j,'attack','a'+t.id)}}
  if(str<t.s0*.45&&o.eS[sd]>str*.8){o.cool[sd]=state.time+70;t.done=1;for(const q of t.sqs){q.task=null;q.ret=1;retreatSq(sd,q)}if(sd===1&&t.sqs.some(q=>q.m.some(u=>state.vis[0].has(u.id))))log(`Düşmanın ${o.n} taarruzu püskürtüldü, geri çekiliyorlar`,'good')}
  else if(state.time-t.at>180){o.cool[sd]=state.time+40;t.done=1;for(const q of t.sqs){q.task=null;q.go=null}}}
function runDefend(sd,t){const o=t.o;
  if(o.owner!==sd){t.type='attack';t.ph='gather';t.t0=state.time;t.stage=stagePt(sd,o);t.need=Math.max(300,o.eS[sd]*1.6);for(const q of t.sqs)q.go=null;return}
  if(o.eS[sd]<40){t.calm=(t.calm||0)+1;if(t.calm>6){t.done=1;t.sqs.forEach((q,i)=>{q.task=null;q.go=null;if(i===0&&q.m[0].d.inf)q.gar=o})}return}else t.calm=0;
  t.sqs.forEach((q,i)=>{const a=i/Math.max(1,t.sqs.length)*TAU,lead=q.m[0];if(lead.d.inf)sqGo(q,o.x+Math.cos(a)*o.r*.4,o.y+Math.sin(a)*o.r*.4,'move','d'+t.id);
    else sqGo(q,behind(sd,o.x,o.r*.6)+gauss()*30,o.y+gauss()*80,'attack','d'+t.id)})}
function placeIndirect(sd,u,o){if(!o||u.mission||u.dest||u.st==='packing'||u.st==='deploying')return;const w=u.d.w[0],A=AIS[sd];
  const tk=A.tasks.map(t=>t.o),pts=tk.length?tk:[o,...state.objs.filter(q=>q.front&&q.front[sd])],inR=p=>{const d=dist2(u,p);return d>w.min*1.1&&d<w.r*.9};
  const hot=A.memA.some(m=>!m.air&&state.time-m.t<40&&inR(m));
  if(pts.some(inR)||hot){if(u.st==='travel')u.wantDeploy=true;return}
  if(state.time-(u.relT||-99)<45)return;u.relT=state.time;
  const tgt=pts.reduce((a,b)=>dist2(a,u)<dist2(b,u)?a:b);const x=behind(sd,tgt.x,w.r*.6),y=clamp(tgt.y+gauss()*100,60,H-60);giveMove(u,x,y,'move');u.wantDeploy=true}
function aiPlan(sd){const A=AIS[sd],en=1-sd;evalObjs(sd);
  const pts=[0,0];for(const o of state.objs)if(o.owner>=0)pts[o.owner]+=ZK[o.k].pts;
  A.posture=(state.tickets[sd]<state.tickets[en]-40||pts[sd]<pts[en])?'agg':(state.tickets[sd]>state.tickets[en]+80&&pts[sd]>pts[en])?'def':'bal';
  let sqs=[...state.squads.values()].filter(q=>q.side===sd&&q.m.length&&!q.m[0].inHeli&&!q.m[0].abandoned);
  mergeSquads(sd,sqs);sqs=sqs.filter(q=>q.m.length);
  A.tasks=A.tasks.filter(t=>!t.done);for(const t of A.tasks)t.sqs=t.sqs.filter(q=>state.squads.has(q.id)&&q.m.length&&q.task===t);
  for(const q of sqs){if(!COMBAT.has(q.k))continue;if(!q.max)q.max=q.m.length;const lead=q.m[0];
    if(q.ret){const ok=lead.d.inf?(q.m.reduce((a,u)=>a+u.sup,0)/q.m.length<30&&q.m.every(u=>!u.dest)):(lead.hp>lead.d.hp*.7);if(ok||state.time-(q.goT||0)>90){q.ret=0;if(!ok||sqBroken(q))q.worn=1}continue}
    if(q.worn&&!sqBroken(q))q.worn=0;
    if(!q.worn&&sqBroken(q)){leaveTask(q);q.ret=1;retreatSq(sd,q)}}
  for(const q of sqs)if(q.gar&&q.gar.owner!==sd)q.gar=null;
  for(const o of state.objs)if(o.owner===sd&&o.eS[sd]>60&&!A.tasks.some(t=>t.o===o))A.tasks.push({id:A.tid++,o,type:'defend',sqs:[],t0:state.time});
  for(const t of A.tasks)if(t.type==='defend'){t.need=t.o.eS[sd]*1.25;t.def=t.need-t.o.oS[sd]}
  const cmb=sqs.filter(q=>COMBAT.has(q.k)&&!q.ret),freeStr=cmb.filter(q=>!q.task&&!q.gar).reduce((a,q)=>a+sqStr(q),0),nAtt=Math.min(3,{def:1,bal:1,agg:2}[A.posture]+Math.floor(freeStr/900));
  const cx=cmb.length?cmb.reduce((a,q)=>a+sqPos(q).x,0)/cmb.length:baseX(sd),cy=cmb.length?cmb.reduce((a,q)=>a+sqPos(q).y,0)/cmb.length:H/2;
  {let ez=A.tasks.filter(t=>t.easy).length;for(const o of state.objs.filter(o=>o.owner<0&&o.eS[sd]<40&&o.cool[sd]<=state.time&&!A.tasks.some(t=>t.o===o)).sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy))){
    if(ez>=3)break;A.tasks.push({id:A.tid++,o,type:'attack',easy:1,ph:'assault',sqs:[],t0:state.time,at:state.time,stage:stagePt(sd,o),need:150});ez++}}
  const freeN=cmb.filter(q=>!q.task&&!q.gar&&!q.worn).length;
  for(let k=A.tasks.filter(t=>t.type==='attack'&&!t.easy).length;k<(freeN?nAtt:0);k++){let best=null,bs=-1e9;for(const o of state.objs){if(o.owner===sd||o.cool[sd]>state.time||A.tasks.some(t=>t.o===o))continue;const z=ZK[o.k];
      const sc=z.v*130+z.inc*25+(o.owner===en?70:0)-o.eS[sd]*.55-Math.hypot(o.x-cx,o.y-cy)*.12+R()*40;if(sc>bs){bs=sc;best=o}}
    if(!best)break;const easy=best.owner<0&&best.eS[sd]<40;A.tasks.push({id:A.tid++,o:best,type:'attack',ph:easy?'assault':'gather',sqs:[],t0:state.time,at:state.time,stage:stagePt(sd,best),need:easy?150:Math.max(300,best.eS[sd]*1.8)})}
  for(const q of sqs)if(q.worn&&!q.gar&&!q.task){const o=state.objs.filter(o=>o.owner===sd&&!sqs.some(x=>x.gar===o)).sort((a,b)=>dist2(a,sqPos(q))-dist2(b,sqPos(q)))[0];if(o)q.gar=o}
  const free=sqs.filter(q=>COMBAT.has(q.k)&&!q.ret&&!q.task&&!q.gar&&!q.worn);
  const garN=Math.ceil(free.length/3)+(A.posture==='def'?2:1);let gn=sqs.filter(q=>q.gar).length;
  for(const o of state.objs.filter(o=>o.owner===sd&&(o.front[sd]||ZK[o.k].v>=2)&&!sqs.some(q=>q.gar===o)&&!A.tasks.some(t=>t.o===o)).sort((a,b)=>ZK[b.k].v-ZK[a.k].v)){
    if(gn>=garN)break;const c=free.filter(q=>q.m[0].d.inf).sort((a,b)=>dist2(sqPos(a),o)-dist2(sqPos(b),o))[0];if(!c)break;free.splice(free.indexOf(c),1);c.gar=o;c.dug=0;gn++}
  for(const q of sqs)if(q.gar){const o=q.gar;sqGo(q,o.x+gauss()*25,o.y+gauss()*25,'move','G'+o.n);
    if(!q.dug&&q.m.every(u=>!u.dest)&&!q.m.some(u=>u.sees.length)){q.dug=1;q.m.forEach(u=>{if(!u.cov&&!u.inB&&u.d.inf)u.dig=0})}}
  const ord=[...A.tasks].sort((a,b)=>(a.type==='defend'?0:1)-(b.type==='defend'?0:1)||(b.def||0)-(a.def||0));
  for(const t of ord){let have=t.sqs.reduce((a,q)=>a+sqStr(q),0);const tgt=t.type==='defend'?t.o:t.stage,o=t.o;
    const armorThreat=A.memA.some(m=>m.armor&&dist2(m,o)<o.r+400);
    const score=(q,hasInf)=>dist2(sqPos(q),tgt)-(armorThreat&&(q.k==='at'||q.k==='tank')?400:0)-(!hasInf&&q.m[0].d.inf?300:0);
    while(have<t.need&&free.length){const hasInf=t.sqs.some(x=>x.m[0].d.inf);let bi=0,bv=1e9;free.forEach((q,i)=>{const v=score(q,hasInf);if(v<bv){bv=v;bi=i}});
      const q=free.splice(bi,1)[0];q.task=t;q.go=null;t.sqs.push(q);have+=sqStr(q)}
    if(t.type==='defend'&&have<t.need)for(const a of A.tasks){if(a.type!=='attack'||a.ph!=='gather')continue;while(have<t.need&&a.sqs.length){const q=a.sqs.pop();q.task=t;q.go=null;t.sqs.push(q);have+=sqStr(q)}}}
  const atkT=A.tasks.filter(t=>t.type==='attack');if(atkT.length)while(free.length>2){const q=free.pop(),t=atkT.reduce((a,b)=>(a.sqs.length<=b.sqs.length?a:b));q.task=t;q.go=null;t.sqs.push(q)}
  const main=A.tasks.find(t=>t.type==='defend')||A.tasks.find(t=>t.type==='attack'&&t.ph!=='gather')||A.tasks.find(t=>t.type==='attack');
  A.focus=main?main.o:state.objs.filter(o=>o.owner===sd&&o.front[sd]).sort((a,b)=>(a.x-b.x)*fwd(sd)*-1)[0]||state.objs.slice().sort((a,b)=>(b.x-a.x)*fwd(sd)*-1)[0];
  const rally=main?(main.stage||{x:behind(sd,main.o.x,main.o.r+250),y:main.o.y}):{x:behind(sd,A.focus.x,A.focus.r+250),y:A.focus.y};
  for(const q of free)if(dist2(sqPos(q),rally)>350)sqGo(q,rally.x+gauss()*80,rally.y+gauss()*120,'move','R'+Math.round(rally.x/200)+'_'+Math.round(rally.y/200));
  for(const t of A.tasks){t.sqs=t.sqs.filter(q=>q.task===t&&q.m.length);if(t.type==='attack')runAttack(sd,t);else runDefend(sd,t)}
  aiSupport(sd,sqs,main)}
function aiSupport(sd,sqs,main){const f=AIS[sd].focus;if(!f)return;const st=main&&main.stage?main.stage:{x:behind(sd,f.x,f.r+200),y:f.y};
  for(const q of sqs){if(!q.m.length)continue;const lead=q.m[0];
    if(q.k==='arty'||q.k==='mortar'||q.k==='hfa'){for(const u of q.m)placeIndirect(sd,u,f);continue}
    if(q.k==='supply'){const brT=b=>{const e=ends(b)[sd];return enemyNear(sd,e.x,e.y,450)>40},cd=b=>{const a=b.aiNext=b.aiNext||[0,0];a[sd]=Math.max(a[sd]||0,state.time+90)};
      if(lead.repB){const b=lead.repB;if(!b.dead&&b.hp>=b.max)lead.repB=null;else if(brT(b)){if(lead.hp<lead.d.hp*.75)brLoss(b,sd);lead.repB=null;cd(b)}else{if(!lead.dest&&!nearEnd(lead,b))orderRepair(lead,b);continue}}
      /* hasarlı kendi noktası: güvenliyse bir kamyon gidip noktada durarak onarır */
      if(lead.repZ){const o=lead.repZ;if(o.owner!==sd||zoneInt(o)>=.99||enemyNear(sd,o.x,o.y,450)>40)lead.repZ=null;else{if(!lead.dest&&Math.hypot(lead.x-o.x,lead.y-o.y)>o.r*.6)sqGo(q,o.x,o.y,'move','z'+o.n);continue}}
      {const zo=state.objs.find(o=>o.owner===sd&&!o.br&&zoneInt(o)<.7&&enemyNear(sd,o.x,o.y,450)<=40&&!state.units.some(u=>u.side===sd&&u.repZ===o));if(zo){lead.repZ=zo;sqGo(q,zo.x,zo.y,'move','z'+zo.n);continue}}
      const need=state.units.find(u=>u.side===sd&&!u.abandoned&&!u.d.supply&&!u.sees.length&&dist2(u,lead)<1100&&((u.d.veh&&u.hp<u.d.hp*.6)||(u.d.indirect&&u.ammo[0].he<5)));
      if(!need){const db=state.bridges.find(b=>(b.dead||b.hp<b.max*DMG.brHeavy)&&state.time>=((b.aiNext||[])[sd]||0)&&!brT(b)&&!state.units.some(u=>u.side===sd&&u.repB===b));if(db){orderRepair(lead,db);cd(db);continue}}
      if(need)sqGo(q,need.x-fwd(sd)*40,need.y,'move','n'+need.id);else if(state.time-(q.goT||0)>25)sqGo(q,behind(sd,st.x,180),st.y+gauss()*60,'move','s'+Math.round(st.x/120)+'_'+Math.round(st.y/120));continue}
    if(q.k==='recon'){const L=dist2(st,f)||1;sqGo(q,f.x+(st.x-f.x)/L*(f.r+240),f.y+(st.y-f.y)/L*(f.r+240)+gauss()*60,'move','r'+f.n);continue}
    if(q.k==='manpads'||q.k==='shorad'){sqGo(q,behind(sd,st.x,110),st.y+gauss()*90,'move','aa'+f.n+(main?main.id:''));continue}
    if(q.k==='sam'){sqGo(q,behind(sd,f.x,650),clamp(f.y+gauss()*120,60,H-60),'move','sam'+f.n);continue}
    if(q.k==='uav'){const L=dist2(st,f)||1;if(!q.m.some(u=>u.home))sqGo(q,f.x+(st.x-f.x)/L*150,f.y+(st.y-f.y)/L*150,'move','u'+f.n);continue}
    /* dron operatörü cephenin gerisinde, kontrol menzili içinde durur; hedefleri kendisi seçer (systems/drones.js) */
    /* gemi (hazırlık): odak noktasının hizasında nehirde devriye */
    if(lead.d.naval){const y=clamp(f.y+gauss()*160,80,H-80);sqGo(q,riverX(y),y,'attack','nv'+f.n);continue}
    if(q.k==='dronop'){sqGo(q,behind(sd,st.x,220),clamp(st.y+gauss()*90,60,H-60),'move','do'+f.n);continue}
    if(q.k==='fpv'){if(main&&main.type==='attack'&&main.ph==='assault')sqGo(q,main.o.x,main.o.y,'attack','fa'+main.id);else sqGo(q,st.x,st.y,'move','fs'+f.n);continue}}}
function aiMicro(sd){const A=AIS[sd];
  for(const sq of state.squads.values()){if(sq.side!==sd)continue;sq.m=sq.m.filter(u=>u.hp>0&&!u.gone);if(!sq.m.length){state.squads.delete(sq.id);continue}
    const lead=sq.m[0];if(lead.inHeli)continue;
    if(sq.k==='crew'){if(state.time>sq.orderT){sq.orderT=state.time+25;sq.m.forEach(u=>{if(!u.crewTo&&!u.dest)giveMove(u,baseX(sd),u.y,'move')})}continue}
    if(sq.k==='mech'&&lead.cargo&&lead.cargo.length){const t=sq.task,p=sq.unloadAt||(t&&t.type==='defend'?t.o:null);
      if(p&&(dist2(lead,p)<90||(lead.sees.length&&dist2(lead,p)<500))){const cq=lead.cargo[0].sq;unloadHeli(lead);sq.unloadAt=null;if(cq&&t&&!t.done){cq.task=t;cq.go=null;t.sqs.push(cq)}}continue}
    if(sq.k==='heliA'){const h=lead,amm=(h.ammo[0]+h.ammo[1]/5)/(8+38/5);
      if(amm<.25&&!h.rearming){h.rearming=1;giveMove(h,sd?W-160:160,h.y,'move');continue}
      if(h.rearming){if(!h.dest&&h.alt!=='landed'&&!(h.altT>0))h.landReq=true;if(h.alt==='landed'&&amm>.95){h.rearming=0;h.wantUp=true;sq.orderT=0}continue}
      if(state.time>sq.orderT){sq.orderT=state.time+20;const aa=A.memA.filter(m=>m.aa);let tgt=null,bs=1e9;
        for(const m of A.memA){if(!m.armor||m.air||aa.some(a=>dist2(a,m)<650))continue;const d=dist2(m,h);if(d<bs){bs=d;tgt=m}}
        if(tgt){const a=Math.atan2(h.y-tgt.y,h.x-tgt.x);h.alt='low';giveMove(h,tgt.x+Math.cos(a)*420,tgt.y+Math.sin(a)*420,'attack')}
        else if(A.focus){const f=A.focus;giveMove(h,behind(sd,f.x,f.r+380),f.y+gauss()*80,'move')}}continue}
    if(sq.k==='heliT'){const h=lead;if(h.cargo.length){if(!sq.fly){const t=A.tasks.find(t=>t.type==='attack')||A.tasks[0],p=t?(t.stage||{x:behind(sd,t.o.x,t.o.r+200),y:t.o.y}):(A.focus?{x:behind(sd,A.focus.x,300),y:A.focus.y}:{x:behind(sd,W/2,600),y:H/2});sq.fly=1;sq.dropT=t;giveMove(h,p.x,p.y,'move')}
        else if(!h.dest&&!h.unloadReq&&h.alt!=='landed'){h.unloadReq=true;const cq=h.cargo[0].sq,t=sq.dropT;if(cq&&t&&!t.done){cq.task=t;cq.go=null;t.sqs.push(cq)}}}
      else if(!sq.home){sq.home=1;h.unloadReq=false;giveMove(h,sd?W-150:150,h.y,'move')}continue}}}
/* satın alma: gördüğü düşman kompozisyonuna göre ihtiyaç puanı; pahalı birim gerekirse para biriktirir */
function aiBuy(sd){if(state.pending[sd].length>=3)return;const A=AIS[sd],en=1-sd;
  const our=[...state.squads.values()].filter(q=>q.side===sd&&q.m.length),cnt=k=>our.filter(q=>q.k===k).length+state.pending[sd].filter(p=>SQUADS[p.idx].k===k).length,abc=k=>state.airbase[sd].filter(e=>e.key===k&&e.st!=='lost').length;
  const mem=A.memA,eArm=mem.filter(m=>m.armor).length,eInf=mem.filter(m=>m.inf).length,eDug=mem.filter(m=>m.dug).length,eInd=mem.filter(m=>m.ind).length;
  const eAir=state.units.filter(u=>u.side===en&&flying(u)&&state.vis[sd].has(u.id)).length+state.airbase[en].filter(e=>e.st==='air').length,ePlanes=state.airbase[en].some(e=>e.st!=='lost'),eRadar=state.units.some(u=>u.side===en&&u.d.radar&&u.radarOn&&state.vis[sd].has(u.id));
  const ourAT=cnt('at')*2+cnt('tank')*2+cnt('heliA')*2+cnt('fpv'),ourAA=cnt('manpads')+cnt('shorad')*2+cnt('sam')*2,ourInf=cnt('inf')+cnt('mech'),veh=state.units.filter(u=>u.side===sd&&u.d.veh&&!u.abandoned).length;
  const urgent=A.tasks.some(t=>t.type==='defend'&&t.def>80);
  let v=0;for(const u of state.units)if(u.side===sd&&!u.abandoned)v+=u.val||0;const upk=upkMul(v);if(upk<ECON.aiMinUpk&&!urgent)return;
  const kw={inf:2+Math.max(0,6-ourInf)*.8+eInf*.04,mech:1.1+(ourInf<4?.6:0),at:.4+Math.max(0,eArm*1.5-ourAT)*.6,recon:cnt('recon')<1?2.2:cnt('recon')<2?.5:0,
    mortar:cnt('mortar')<1?1.6:cnt('mortar')<2?.5+eDug*.08:.1,supply:cnt('supply')<Math.min(2,Math.ceil(veh/3))?1.4:0,ifv:1.1+eInf*.03,tank:1+Math.max(0,eArm-cnt('tank'))*.5+(A.posture==='agg'?.5:0),
    arty:cnt('arty')<1?1.2+eDug*.06:cnt('arty')<2?.5+(eInd?.3:0):0,manpads:Math.max(0,eAir*1.2-ourAA)*.7+(eAir?.2:0),shorad:Math.max(0,eAir*1.5-ourAA)*.6+(eAir?.3:0),sam:cnt('sam')<1&&ePlanes?.9:0,
    heliA:cnt('heliA')<2&&eArm?1.2:.25,heliT:.3,cas:abc('cas')<1&&state.time>60?1.1+eArm*.1:0,mr:abc('mr')<1&&eArm>1?1:0,sead:eRadar&&abc('sead')<1?1.4:0,ftr:eAir&&abc('ftr')<1?1.2:0,
    bmb:abc('bmb')<1&&state.money[sd]>600&&eDug>3?.5:0,rec:abc('rec')<1&&mem.length<6?.8:0,tb2:abc('tb2')<1&&state.time>90?.9:0,uav:cnt('uav')<1?1:cnt('uav')<2?.3:0,fpv:eArm>1?.7:.15,bot:cnt('bot')<1&&state.time>40?.45:cnt('bot')<2?.12:0,dronop:cnt('dronop')<1?1.1+eArm*.08:cnt('dronop')<2?.35+eArm*.05:0};
  const CAT={bot:'arm',dronop:'fire',inf:'inf',mech:'inf',ifv:'arm',tank:'arm',at:'at',mortar:'fire',arty:'fire',recon:'eyes',uav:'eyes',rec:'eyes',supply:'log',manpads:'aa',shorad:'aa',sam:'aa',heliA:'heli',heliT:'heli',fpv:'heli',cas:'air',mr:'air',sead:'air',ftr:'air',bmb:'air',tb2:'air'};
  const want={inf:.3,arm:.26,at:.06+Math.min(.12,eArm*.02),fire:.11+Math.min(.06,eDug*.01),eyes:.05,log:.05,aa:.03+Math.min(.1,eAir*.03),heli:.05,air:.06},have={};let tot=0;
  for(const q of our){const S=SQUADS.find(x=>x.k===q.k);if(!S)continue;have[CAT[q.k]]=(have[CAT[q.k]]||0)+S.cost;tot+=S.cost}
  for(const e of state.airbase[sd])if(e.st!=='lost'){const S=SQUADS.find(x=>x.plane===e.key);have.air=(have.air||0)+S.cost;tot+=S.cost}
  for(const p of state.pending[sd]){const S=SQUADS[p.idx];have[CAT[S.k]]=(have[CAT[S.k]]||0)+S.cost;tot+=S.cost}
  const share=c=>tot?(have[c]||0)/tot:0,adj=k=>{const c=CAT[k];if(!c||tot<400)return 1;const df=want[c]-share(c);return df>0?1+8*df:1/(1-6*df)};
  const sc=SQUADS.map((S,i)=>({i,s:state.avail[sd][i]>0?(kw[S.k]||0)*adj(S.k)/Math.pow(S.cost,.35)*(.85+R()*.3):0})).filter(o=>o.s>0).sort((a,b)=>b.s-a.s);if(!sc.length)return;
  const best=sc[0].i;if(state.money[sd]>=SQUADS[best].cost){deploy(sd,best);A.save=null;return}
  if(A.save!==best){A.save=best;A.saveT=state.time}
  if(urgent||state.time-A.saveT>35||state.money[sd]>=ECON.cap*.9){const alt=sc.slice(0,6).find(o=>state.money[sd]>=SQUADS[o.i].cost);if(alt){deploy(sd,alt.i);A.saveT=state.time}}}
function aiAir(sd){const A=AIS[sd],en=1-sd,ev=state.units.filter(u=>u.side===en&&state.vis[sd].has(u.id)),eAir=ev.filter(flying),eRadar=state.units.filter(u=>u.side===en&&u.d.radar&&u.radarOn);
  const eAA=ev.filter(u=>u.d.w.some(w=>w.aaOnly||w.k==='flak')),grd=ev.filter(u=>!flying(u)&&!u.abandoned);
  const cluster=pref=>{let best=null,bs=0;for(const e of grd){if(eAA.some(a=>Math.hypot(a.x-e.x,a.y-e.y)<750)&&R()<.85)continue;let s=0;for(const o of grd)if(Math.abs(o.x-e.x)<120&&Math.hypot(o.x-e.x,o.y-e.y)<120)s+=o.d.inf?1:2;if(pref&&!e.d.inf)s+=3;if(s>bs){bs=s;best=e}}return bs>=3?best:null};
  for(const e of state.airbase[sd]){if(e.st!=='ready')continue;const go=e.key==='rec'||e.key==='tb2'?true:e.key==='ftr'?eAir.length>0:e.key==='sead'?eRadar.length>0:!!cluster(e.key==='mr');if(go)launch(e)}
  for(const u of state.units){if(u.side!==sd||!u.d.plane||u.rtb)continue;
    if(u.fuel<u.d.fuel*.3||(u.flares<1&&u.hp<u.d.hp*.6&&!u.d.uav)){u.rtb=true;continue}
    if(u.run||u.strikes.length)continue;
    if(u.key==='ftr'){if(u.chase&&(u.chase.hp<=0||!flying(u.chase)))u.chase=null;if(!u.chase&&eAir.length)u.chase=eAir.reduce((a,b)=>dist2(a,u)<dist2(b,u)?a:b);u.idle=eAir.length?0:(u.idle||0)+1.5;if(u.idle>20)u.rtb=true;continue}
    if(u.key==='rec'||u.key==='tb2'){if(!u.lt||state.time>u.lt){u.lt=state.time+25;const o=(A.focus&&A.focus.owner!==sd?A.focus:null)||state.objs.filter(q=>q.owner!==sd).sort((a,b)=>(b.x-a.x)*-fwd(sd))[0]||state.objs[0];u.loiter={x:clamp(o.x+(u.key==='rec'?fwd(sd)*200:-fwd(sd)*150),200,W-200),y:o.y+gauss()*150}}continue}
    if(u.key==='sead'){if(eRadar.length){const r=eRadar.reduce((a,b)=>dist2(a,u)<dist2(b,u)?a:b);u.loiter={x:behind(sd,r.x,700),y:r.y};u.idle=0}else{u.idle=(u.idle||0)+1.5;if(u.idle>15)u.rtb=true}continue}
    const t=cluster(u.key==='mr');if(!t){u.idle=(u.idle||0)+1.5;if(u.idle>25)u.rtb=true;continue}u.idle=0;
    if(u.key==='mr'){const tg=grd.filter(o=>!o.d.inf&&dist2(o,t)<400).slice(0,Math.floor(u.pay.lgb||0));if(!tg.length)tg.push(t);u.strikes=tg.map(o=>({t:o,x:o.x,y:o.y}));u.alt='high'}
    else{if(u.key==='cas')u.runType=u.pay.gun>=1?'gun':'rockets';const ang=(sd?PI:0)+gauss()*.4,len=u.key==='bmb'?320:220;
      assignRunFor(u,t.x-Math.cos(ang)*len/2,t.y-Math.sin(ang)*len/2,t.x+Math.cos(ang)*len/2,t.y+Math.sin(ang)*len/2)}}}
function bestObj(lead){const sd=lead.side;let best=null,bs=1e9;for(const o of state.objs){let s=Math.hypot(o.x-lead.x,o.y-lead.y)-ZK[o.k].v*200;
  if(o.owner===sd&&o.own*fwd(sd)>=99&&!o.c[1-sd])s+=1300;if(o.owner===1-sd)s-=250;if(o.c[1-sd])s-=200;s+=R()*450;if(s<bs){bs=s;best=o}}return best}
function aiSide(sd){aiMemory(sd);aiBuy(sd);
  for(const cb of state.cbs){if(cb.det!==sd||cb['ai'+sd])continue;cb['ai'+sd]=1;for(const u of state.units){if(u.side!==sd||!u.d.indirect||u.st!=='deployed'||u.mission||R()>.75)continue;
    const w=u.d.w[0],d=Math.hypot(cb.x-u.x,cb.y-u.y);if(d<=w.r&&d>=w.min&&u.ammo[0].he>=1)u.mission={x:cb.x,y:cb.y,shell:'he',n:3,fired:0}}}
  aiAir(sd);
  for(const v of state.units){if(!v.abandoned||state.units.some(u=>u.crewTo===v))continue;const near=state.units.filter(u=>u.side===sd&&u.d.inf&&!u.d.indirect&&!u.crewTo&&!u.inB&&!u.sees.length&&!(u.panicT>0)&&Math.hypot(u.x-v.x,u.y-v.y)<350);
    if(near.length){const c=near.find(u=>u.key==='crew')||near[0];giveMove(c,v.x,v.y,'move');c.crewTo=v;break}}
  aiMicro(sd);
  if(state.time>=AIS[sd].planT){AIS[sd].planT=state.time+AIDIF[state.aiDiff].plan;aiPlan(sd)}}
function aiTick(){for(const sd of state.AI_SIDES)aiSide(sd)}

export {aiReset,aiTick};
