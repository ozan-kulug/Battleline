/* renderer.js — Sahne çizimi: birlik çizimleri, harita katmanları, savaş sisi, arayüz katmanları, mini harita. */
import {state} from './state.js';
import {toW} from './camera.js';
import {ctx,fctx,fogC,mctx,mmBase,tc} from './canvas.js';
import {COL,DEF,H,PI,TAU,W,ZK} from './config.js';
import {cam} from './state.js';
import {estSig,muzzle} from './systems/combat.js';
import {dep,deployZone} from './systems/deployment.js';
import {SPR,drawFX} from './systems/effects.js';
import {leash} from './systems/initiative.js';
import {sel} from './systems/orders.js';
import {flying,rank} from './systems/units.js';
import {ghosts,observed,visEff} from './systems/vision.js';
import {clamp,gauss,segInfo} from './utils/helpers.js';
import {effStance} from './world/cover.js';
import {refreshMini} from './world/terrain.js';

/* ---------- çizim ---------- */
function drawSoldier(c,u,x,y,s){const col=COL[u.side],st=effStance(u),k=u.key;c.save();c.translate(x,y);c.scale(s,s);c.rotate(u.ta);
  if(st==='prone'){c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(1,1.5,6,3,0,0,TAU);c.fill();
    c.fillStyle=col.hull;c.beginPath();c.ellipse(-1,0,5.5,2.7,0,0,TAU);c.fill();c.strokeStyle=col.dark;c.lineWidth=.9;c.stroke();
    c.fillStyle=col.tur;c.beginPath();c.arc(4,0,1.9,0,TAU);c.fill()}
  else{const r=st==='crouch'?3.1:3.6;c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.arc(1.3,1.3,r,0,TAU);c.fill();
    c.fillStyle=col.hull;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.strokeStyle=col.dark;c.lineWidth=.9;c.stroke();
    c.fillStyle=col.tur;c.beginPath();c.arc(.6,0,1.7,0,TAU);c.fill()}
  c.strokeStyle='#20241d';c.lineCap='round';const wy=st==='prone'?0:1.6,x0=st==='prone'?3:1;
  if(k==='rpg'){c.lineWidth=2.2;c.beginPath();c.moveTo(-5,wy);c.lineTo(8,wy);c.stroke()}
  else if(k==='manpads'){c.lineWidth=2.6;c.beginPath();c.moveTo(-6,wy);c.lineTo(9,wy);c.stroke();c.fillStyle='#20241d';c.fillRect(1,wy-3,3,2.5)}
  else if(k==='atgm'){c.lineWidth=2.6;c.beginPath();c.moveTo(-2,wy);c.lineTo(9,wy);c.stroke();c.fillStyle='#20241d';c.fillRect(2,wy-2.5,4,5)}
  else if(k==='mg'){c.lineWidth=1.9;c.beginPath();c.moveTo(x0,wy);c.lineTo(x0+10,wy);c.stroke()}
  else if(k==='dop'){c.fillStyle='#20241d';c.fillRect(2.5,-2.6,4.2,5.2);c.fillStyle='#7fd48a';c.fillRect(3.2,-1.9,2.8,3.8);c.strokeStyle='#20241d';c.lineWidth=.8;c.beginPath();c.moveTo(-1.5,-1);c.lineTo(-4,-6);c.stroke()}
  else if(k==='sniper'){c.lineWidth=1.1;c.beginPath();c.moveTo(x0,wy);c.lineTo(x0+12,wy);c.stroke()}
  else if(k==='mortar'){if(u.st==='deployed'||u.st==='deploying'){c.fillStyle='#20241d';c.beginPath();c.arc(7,-4,3,0,TAU);c.fill();c.fillStyle='#4a4f44';c.beginPath();c.arc(7,-4,1.6,0,TAU);c.fill()}else{c.lineWidth=2.2;c.beginPath();c.moveTo(-4,-2.6);c.lineTo(4,-2.6);c.stroke()}}
  else{c.lineWidth=1.3;c.beginPath();c.moveTo(x0,wy);c.lineTo(x0+7,wy);c.stroke()}
  if(k==='scout'||k==='sniper'){c.fillStyle='rgba(130,150,95,.95)';c.beginPath();c.arc(-1.4,0,1.5,0,TAU);c.fill()}
  if(u.flash>0&&k!=='mortar'){c.fillStyle='#ffd27a';c.beginPath();c.arc(x0+(k==='rpg'||k==='atgm'?10:k==='mg'?11:k==='sniper'?13:9),wy,2,0,TAU);c.fill()}
  c.restore()}
function drawVeh(c,u,x,y,s){const col=COL[u.abandoned?2:u.side],k=u.key;c.save();c.translate(x,y);c.scale(s,s);c.rotate(u.a);
  const L=k==='tank'?36:k==='ifv'?31:k==='supply'?32:34,Wd=k==='tank'?21:k==='ifv'?18:k==='supply'?15:15;
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(-L/2+3,-Wd/2+3,L,Wd);
  if(k==='sam'){c.fillStyle=col.dark;for(const yy of [-Wd/2-1,Wd/2-3]){c.fillRect(-L/2+3,yy,6,4);c.fillRect(-4,yy,6,4);c.fillRect(L/2-9,yy,6,4)}
    c.fillStyle=col.hull;c.fillRect(-L/2,-Wd/2,L,Wd);c.strokeStyle=col.dark;c.lineWidth=1;c.strokeRect(-L/2,-Wd/2,L,Wd);c.fillStyle=col.tur;c.fillRect(L/2-9,-Wd/2+1,9,Wd-2);
    c.save();c.translate(-5,0);c.rotate(u.ta-u.a);c.fillStyle='#5d6650';c.fillRect(-9,-6,18,12);c.strokeStyle=col.dark;c.strokeRect(-9,-6,18,12);c.fillStyle='#2b2f27';for(let i=0;i<3;i++)c.fillRect(6,-5+i*3.6,3,2.6);c.restore();
    c.strokeStyle=u.radarOn?'#7fd48a':col.dark;c.lineWidth=1.6;c.beginPath();c.arc(L/2-5,0,4,-1.2+state.time*(u.radarOn?3:0),1.2+state.time*(u.radarOn?3:0));c.stroke()}
  else if(k==='supply'){c.fillStyle=col.dark;for(const yy of [-Wd/2-1,Wd/2-3]){c.fillRect(-L/2+3,yy,6,4);c.fillRect(-4,yy,6,4);c.fillRect(L/2-9,yy,6,4)}
    c.fillStyle='#5d6650';c.fillRect(-L/2,-Wd/2,L*.66,Wd);c.strokeStyle=col.dark;c.lineWidth=1;c.strokeRect(-L/2,-Wd/2,L*.66,Wd);
    c.strokeStyle='rgba(0,0,0,.35)';c.beginPath();for(let i=1;i<3;i++){c.moveTo(-L/2+i*L*.22,-Wd/2);c.lineTo(-L/2+i*L*.22,Wd/2)}c.stroke();
    c.fillStyle=col.hull;c.fillRect(L/2-L*.3,-Wd/2+1,L*.3,Wd-2);c.strokeStyle=col.dark;c.strokeRect(L/2-L*.3,-Wd/2+1,L*.3,Wd-2);
    c.fillStyle=col.lt;c.fillRect(L/2-4,-Wd/2+3,2,Wd-6)}
  else if(k==='arty'){c.fillStyle=col.dark;for(const yy of [-Wd/2-1,Wd/2-3]){c.fillRect(-L/2+3,yy,6,4);c.fillRect(L/2-12,yy,6,4);c.fillRect(-2,yy,6,4)}
    c.fillStyle=col.hull;c.fillRect(-L/2,-Wd/2,L,Wd);c.fillStyle=col.tur;c.fillRect(L/2-10,-Wd/2+1,10,Wd-2);c.strokeStyle=col.dark;c.lineWidth=1.2;c.strokeRect(-L/2,-Wd/2,L,Wd);
    const dep=u.st==='deployed'||u.st==='deploying'||u.st==='packing';
    if(dep){c.strokeStyle=col.dark;c.lineWidth=2.4;c.beginPath();c.moveTo(-L/2,-4);c.lineTo(-L/2-11,-11);c.moveTo(-L/2,4);c.lineTo(-L/2-11,11);c.stroke()}
    if(!u.noTur){c.save();c.translate(-6,0);c.rotate(u.ta-u.a);const rc=u.recoil*5;c.fillStyle=col.dark;c.fillRect(-rc,-2,dep?34:28,4);c.fillStyle=col.tur;c.beginPath();c.arc(0,0,6,0,TAU);c.fill();
    if(u.flash>0){c.fillStyle='#ffd27a';c.beginPath();c.arc(36,0,6,0,TAU);c.fill()}c.restore()}}
  else{c.fillStyle=col.dark;c.fillRect(-L/2,-Wd/2-1,L,5);c.fillRect(-L/2,Wd/2-4,L,5);
    if(u.trk>0){c.strokeStyle='#e8a838';c.lineWidth=1.5;c.beginPath();c.moveTo(-6,-Wd/2-1);c.lineTo(-2,-Wd/2+3);c.lineTo(2,-Wd/2-1);c.lineTo(6,-Wd/2+3);c.stroke()}
    c.fillStyle=col.hull;c.beginPath();c.moveTo(-L/2+1,-Wd/2+3);c.lineTo(L/2-3,-Wd/2+3);c.lineTo(L/2,-Wd/2+6);c.lineTo(L/2,Wd/2-6);c.lineTo(L/2-3,Wd/2-3);c.lineTo(-L/2+1,Wd/2-3);c.closePath();c.fill();
    c.strokeStyle=col.dark;c.lineWidth=1.1;c.stroke();c.fillStyle='rgba(0,0,0,.25)';c.fillRect(-L/2+2,-3,5,6);
    if(!u.noTur){c.save();c.translate(k==='tank'?-2:3,0);c.rotate(u.ta-u.a);const rc=u.recoil*4;
    if(k==='tank'){c.fillStyle=col.dark;c.fillRect(6-rc,-1.6,24,3.2);c.fillStyle=col.tur;c.beginPath();c.moveTo(-9,-7);c.lineTo(7,-6);c.lineTo(10,-3);c.lineTo(10,3);c.lineTo(7,6);c.lineTo(-9,7);c.closePath();c.fill();c.strokeStyle=u.tur>0?'#e8a838':col.dark;c.stroke();
      c.fillStyle=col.hull;c.beginPath();c.arc(-3,-2,2.2,0,TAU);c.fill()}
    else if(k==='shorad'){c.fillStyle=col.dark;c.fillRect(2,-5,18,1.8);c.fillRect(2,3.2,18,1.8);c.fillStyle=col.tur;c.fillRect(-7,-6,12,12);c.strokeStyle=col.dark;c.strokeRect(-7,-6,12,12);c.strokeStyle=col.lt;c.lineWidth=1.3;c.beginPath();c.arc(-5,0,3.5,-1.3+state.time*4,1.3+state.time*4);c.stroke()}
    else{c.fillStyle=col.dark;c.fillRect(4,-1,16,2);c.fillStyle=col.tur;c.fillRect(-6,-5,11,10);c.strokeStyle=u.tur>0?'#e8a838':col.dark;c.strokeRect(-6,-5,11,10)}
    if(u.flash>0){c.fillStyle='#ffd27a';c.beginPath();c.arc(k==='tank'?32:21,0,k==='tank'?5:3,0,TAU);c.fill()}
    c.restore()}}
  c.restore()}
function drawPlane(c,u,x,y,s,sh){const col=COL[u.side],k=u.key;c.save();c.translate(x,y);c.scale(s,s);c.rotate(u.a);if(k==='bmb')c.scale(1.6,1.6);
  c.fillStyle=sh?'rgba(0,0,0,.26)':col.hull;c.strokeStyle=col.dark;c.lineWidth=.9;c.beginPath();
  if(k==='tb2'){c.moveTo(9,0);c.lineTo(7,-1.5);c.lineTo(1,-1.5);c.lineTo(1,-17);c.lineTo(-2,-17);c.lineTo(-2,-1.5);c.lineTo(-10,-1.2);c.lineTo(-14,-6);c.lineTo(-15,-5);c.lineTo(-12,0);c.lineTo(-15,5);c.lineTo(-14,6);c.lineTo(-10,1.2);c.lineTo(-2,1.5);c.lineTo(-2,17);c.lineTo(1,17);c.lineTo(1,1.5);c.lineTo(7,1.5)}
  else if(k==='cas'||k==='bmb'){c.moveTo(16,0);c.lineTo(12,-2);c.lineTo(2,-2);c.lineTo(0,-15);c.lineTo(-4,-15);c.lineTo(-4,-2);c.lineTo(-12,-2);c.lineTo(-15,-7);c.lineTo(-17,-7);c.lineTo(-16,0);c.lineTo(-17,7);c.lineTo(-15,7);c.lineTo(-12,2);c.lineTo(-4,2);c.lineTo(-4,15);c.lineTo(0,15);c.lineTo(2,2);c.lineTo(12,2)}
  else{c.moveTo(18,0);c.lineTo(10,-2.2);c.lineTo(-2,-3);c.lineTo(-9,-13);c.lineTo(-12,-13);c.lineTo(-9,-3);c.lineTo(-13,-3);c.lineTo(-17,-8);c.lineTo(-18,-8);c.lineTo(-16,0);c.lineTo(-18,8);c.lineTo(-17,8);c.lineTo(-13,3);c.lineTo(-9,3);c.lineTo(-12,13);c.lineTo(-9,13);c.lineTo(-2,3);c.lineTo(10,2.2)}
  c.closePath();c.fill();if(!sh){c.stroke();c.fillStyle=col.lt;c.beginPath();c.ellipse(9,0,3,1.2,0,0,TAU);c.fill();if(u.burn){c.fillStyle='rgba(255,170,70,.9)';c.beginPath();c.arc(-17,0,2.5,0,TAU);c.fill()}if(u.flash>0){c.fillStyle='#ffd27a';c.beginPath();c.arc(18,0,2.5,0,TAU);c.fill()}}
  c.restore()}
function drawHeli(c,u,x,y,s,sh){const col=COL[u.side],tr=u.key==='heliT';c.save();c.translate(x,y);c.scale(s,s);c.rotate(u.a);
  c.fillStyle=sh?'rgba(0,0,0,.26)':col.hull;c.strokeStyle=col.dark;c.lineWidth=.9;c.beginPath();c.ellipse(2,0,tr?11:9,tr?5:3.6,0,0,TAU);c.fill();if(!sh)c.stroke();
  c.fillRect(-16,-1.2,10,2.4);c.fillRect(-17,-4,2,8);
  if(!sh){c.fillStyle=col.lt;c.beginPath();c.ellipse(7,0,2.6,1.6,0,0,TAU);c.fill();if(!tr){c.fillStyle=col.dark;c.fillRect(-1,-6.5,4,2.5);c.fillRect(-1,4,4,2.5)}
    const spin=!(u.alt==='landed'&&!(u.altT>0)),ra=spin?state.time*30:.4,nb=tr?3:4;c.strokeStyle='rgba(28,28,28,.55)';c.lineWidth=1.4;c.beginPath();for(let i=0;i<nb;i++){const a=ra+i*TAU/nb;c.moveTo(1,0);c.lineTo(1+Math.cos(a)*15,Math.sin(a)*15)}c.stroke();
    if(spin){c.fillStyle='rgba(210,210,200,.08)';c.beginPath();c.arc(1,0,15,0,TAU);c.fill()}if(u.flash>0){c.fillStyle='#ffd27a';c.beginPath();c.arc(12,0,2.2,0,TAU);c.fill()}}
  c.restore()}
function drawDrone(c,u,x,y,s,sh){const col=COL[u.side],f=u.d.fpv;c.save();c.translate(x,y);c.scale(s,s);c.rotate(u.a);const L=f?6:8;
  c.strokeStyle=sh?'rgba(0,0,0,.25)':col.dark;c.lineWidth=f?1.6:2;c.beginPath();c.moveTo(-L,-L);c.lineTo(L,L);c.moveTo(-L,L);c.lineTo(L,-L);c.stroke();
  if(!sh){c.fillStyle=col.hull;c.fillRect(-3,-2.5,6,5);if(f){c.fillStyle='#e2584b';c.fillRect(2,-1.5,3,3)}else{c.fillStyle=col.lt;c.beginPath();c.arc(2.5,0,1.4,0,TAU);c.fill()}
    c.strokeStyle='rgba(30,30,30,.45)';c.lineWidth=.8;const ra=state.time*40;for(const [px,py] of [[-L,-L],[L,L],[-L,L],[L,-L]]){c.beginPath();c.arc(px,py,f?3:3.8,0,TAU);c.stroke();c.beginPath();c.moveTo(px+Math.cos(ra)*3.5,py+Math.sin(ra)*3.5);c.lineTo(px-Math.cos(ra)*3.5,py-Math.sin(ra)*3.5);c.stroke()}}
  c.restore()}
function drawUnit(c,u,x,y,s){if(u.d.plane)drawPlane(c,u,x,y,s);else if(u.d.drone)drawDrone(c,u,x,y,s);else if(u.d.heli)drawHeli(c,u,x,y,s);else if(u.d.inf)drawSoldier(c,u,x,y,s);else drawVeh(c,u,x,y,s)}
function render(){
  ctx.setTransform(state.DPR,0,0,state.DPR,0,0);ctx.fillStyle='#10130e';ctx.fillRect(0,0,state.VW,state.VH);
  const z=cam.z,shx=state.shake?gauss()*state.shake:0,shy=state.shake?gauss()*state.shake:0,WT=()=>ctx.setTransform(state.DPR*z,0,0,state.DPR*z,(-cam.x*z+shx)*state.DPR,(-cam.y*z+shy)*state.DPR);WT();
  const vx0=Math.max(0,cam.x),vy0=Math.max(0,cam.y),vx1=Math.min(W,cam.x+state.VW/z),vy1=Math.min(H,cam.y+state.VH/z);
  if(vx1>vx0&&vy1>vy0)ctx.drawImage(tc,vx0,vy0,vx1-vx0,vy1-vy0,vx0,vy0,vx1-vx0,vy1-vy0);
  for(const m of state.marks){if(m.ping)continue;if(m.x<cam.x-60||m.x>cam.x+state.VW/z+60||m.y<cam.y-60||m.y>cam.y+state.VH/z+60)continue;drawVeh(ctx,{key:m.key,a:m.a,ta:m.ta,side:3,noTur:m.noTur,recoil:0,flash:0,trk:0,tur:0,st:'travel',radarOn:false,d:DEF[m.key]},m.x,m.y,1)}
  for(const b of state.buildings){if(b.dead||!b.occ.length)continue;
    {const sd=b.occ[0].side;if(sd===0||b.occ.some(o=>state.vis[0].has(o.id))){ctx.strokeStyle=COL[sd].ring;ctx.lineWidth=2/z;ctx.strokeRect(b.x-2,b.y-2,b.w+4,b.h+4)}}}
  for(const o of state.objs){const oc=o.owner===0?'#62a6e6':o.owner===1?'#e2584b':'#d8d3bd';
    ctx.lineWidth=2/z;ctx.setLineDash([10,8]);ctx.strokeStyle=oc+'aa';ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=oc+'14';ctx.fill();
    if(Math.abs(o.own)>.5){ctx.strokeStyle=o.own>0?'#62a6e6':'#e2584b';ctx.lineWidth=5/Math.max(z,.5);ctx.beginPath();ctx.arc(o.x,o.y,o.r+6,-PI/2,-PI/2+TAU*Math.abs(o.own)/100*(o.own>0?1:-1),o.own<0);ctx.stroke()}
    ctx.fillStyle='rgba(16,19,14,.8)';ctx.fillRect(o.x-15,o.y-15,30,30);ctx.strokeStyle=oc;ctx.lineWidth=1.5;ctx.strokeRect(o.x-15,o.y-15,30,30);
    ctx.fillStyle=oc;ctx.font='800 22px "Saira Condensed",Impact,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(o.n,o.x,o.y+1);
    if(z>.3){const fz=11/Math.max(z,.45);ctx.font=`700 ${fz}px "Saira Condensed",sans-serif`;ctx.fillStyle='rgba(16,19,14,.75)';const tw=ctx.measureText(ZK[o.k].n.toLocaleUpperCase('tr')+'  +'+ZK[o.k].inc).width;ctx.fillRect(o.x-tw/2-4,o.y+18,tw+8,fz+4);ctx.fillStyle=oc;ctx.fillText(ZK[o.k].n.toLocaleUpperCase('tr')+'  +'+ZK[o.k].inc,o.x,o.y+20+fz/2)}}
  if(state.phase==='deploy')drawDeployZones(z);
  const S=sel();ctx.lineWidth=1/z;
  if(S.length&&S.length<=6)for(const u of S){if(!u.anchor||(u.init||'on')==='off'||u.d.air)continue;ctx.strokeStyle='rgba(127,212,138,.28)';ctx.setLineDash([2/z,5/z]);ctx.beginPath();ctx.arc(u.anchor.x,u.anchor.y,leash(u),0,TAU);ctx.stroke();ctx.setLineDash([])}
  const rngSeen=new Set();
  for(const u of S){const w=u.d.w[0],rk=u.d.inf&&u.sq?u.sq.id+u.key:null;if(w&&(S.length<8||!u.d.inf)&&!(rk&&rngSeen.has(rk))){if(rk)rngSeen.add(rk);ctx.strokeStyle='rgba(232,168,56,.3)';ctx.setLineDash([4/z,6/z]);ctx.beginPath();ctx.arc(u.x,u.y,w.r,0,TAU);ctx.stroke();
      if(w.min){ctx.beginPath();ctx.arc(u.x,u.y,w.min,0,TAU);ctx.stroke()}ctx.setLineDash([])}
    if(u.dest){ctx.strokeStyle=u.mode==='attack'?'rgba(232,168,56,.55)':u.mode==='fast'?'rgba(127,212,138,.6)':'rgba(98,166,230,.5)';ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(u.dest.x,u.dest.y);for(const q of u.queue)ctx.lineTo(q.x,q.y);ctx.stroke();
      ctx.fillStyle=ctx.strokeStyle;for(const q of u.queue){ctx.beginPath();ctx.arc(q.x,q.y,3/z,0,TAU);ctx.fill()}}}
  /* seçili piyade mangalarının çevresi: manga tek birim gibi görünür */
  {const done=new Set();for(const u of S){if(!u.d.inf||!u.sq||done.has(u.sq))continue;done.add(u.sq);const ms=u.sq.m.filter(m=>m.sel&&m.hp>0&&!m.gone&&!m.inHeli&&!m.inB);if(ms.length<2)continue;
    const cx=ms.reduce((a,m)=>a+m.x,0)/ms.length,cy=ms.reduce((a,m)=>a+m.y,0)/ms.length,r=Math.max(...ms.map(m=>Math.hypot(m.x-cx,m.y-cy)))+11;
    ctx.strokeStyle='rgba(232,168,56,.55)';ctx.lineWidth=1.3/z;ctx.setLineDash([5/z,4/z]);ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();ctx.setLineDash([])}}
  for(const u of state.units){if(u.d.air||(u.side===1&&!state.vis[0].has(u.id)))continue;
    if(u.sel){ctx.strokeStyle='#e8a838';ctx.lineWidth=1.4/z;ctx.beginPath();ctx.arc(u.x,u.y,u.d.inf?7:24,0,TAU);ctx.stroke()}
    drawUnit(ctx,u,u.x,u.y,u.inB?.85:1)}
  ctx.lineCap='round';
  const SKY={msl:1,agun:1,arock:1,bomb:1,lgb:1};
  for(const p of state.proj){if(SKY[p.k])continue;const arcK=p.k==='arty'||p.k==='mortar'||p.k==='gren';if(!(p.side===0||state.vis[0].has(p.from)||arcK))continue;
    if(arcK){const f=p.t/p.T,h=Math.sin(f*PI)*p.h;ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,TAU);ctx.fill();ctx.fillStyle=p.k==='gren'?'#2b3024':'#f2e3b5';ctx.beginPath();ctx.arc(p.x,p.y-h,p.k==='arty'?3.4:2.4,0,TAU);ctx.fill()}
    else if(p.k==='atgm'||p.k==='rpg'||p.k==='rocket'){ctx.fillStyle='#ffb04a';ctx.beginPath();ctx.arc(p.x,p.y,2.8,0,TAU);ctx.fill()}
    else{const L=p.k==='gun'?40:p.k==='snipe'?36:p.k==='auto'?20:12,a=Math.atan2(p.ty-p.sy,p.tx-p.sx);ctx.strokeStyle=p.k==='gun'||p.k==='snipe'?'rgba(255,240,200,.95)':p.side?'rgba(255,140,110,.9)':'rgba(255,220,140,.9)';
      ctx.lineWidth=p.k==='gun'?2.4:p.k==='snipe'?1:1.3;ctx.beginPath();ctx.moveTo(p.x-Math.cos(a)*L,p.y-Math.sin(a)*L);ctx.lineTo(p.x,p.y);ctx.stroke()}}
  drawFX(false);
  ctx.globalAlpha=1;
  for(const s of state.smokes){const gr=Math.min(1,.35+s.age/2.5),fd=Math.min(1,(s.life-s.age)/5);ctx.globalAlpha=.75*fd;for(const [bx,by,br] of s.b){const x=s.x+bx*gr,y=s.y+by*gr,rr=s.r*br*gr*1.35;ctx.drawImage(SPR.smokeL,x-rr,y-rr,rr*2,rr*2)}}ctx.globalAlpha=1;
  // sis perdesi (savaş sisi)
  const fw=fogC.width,fh=fogC.height,fs=fw/state.VW*z;
  fctx.globalCompositeOperation='source-over';fctx.clearRect(0,0,fw,fh);fctx.fillStyle='rgba(8,11,8,.6)';fctx.fillRect(0,0,fw,fh);fctx.globalCompositeOperation='destination-out';
  for(const o of state.objs){if(o.k!=='hill'||o.owner!==0)continue;const sx=(o.x-cam.x)*fs,sy=(o.y-cam.y)*fs,r=950*fs;const g=fctx.createRadialGradient(sx,sy,r*.7,sx,sy,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');fctx.fillStyle=g;fctx.beginPath();fctx.arc(sx,sy,r,0,TAU);fctx.fill()}
  for(const u of state.units){if(u.side!==0||!u.d.vis)continue;const sx=(u.x-cam.x)*fs,sy=(u.y-cam.y)*fs,r=visEff(u)*fs;if(sx<-r||sy<-r||sx>fw+r||sy>fh+r)continue;
    const g=fctx.createRadialGradient(sx,sy,r*.7,sx,sy,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');fctx.fillStyle=g;fctx.beginPath();fctx.arc(sx,sy,r,0,TAU);fctx.fill()}
  ctx.setTransform(state.DPR,0,0,state.DPR,0,0);ctx.drawImage(fogC,0,0,state.VW,state.VH);WT();
  drawFX(true);
  for(const [id,g] of ghosts){if(state.vis[0].has(id))continue;const age=state.time-g.t;ctx.globalAlpha=.42*(1-age/30);drawUnit(ctx,g.u,g.x,g.y,1);ctx.globalAlpha=Math.min(.8,1-age/30);ctx.fillStyle='#e2584b';ctx.font=`700 ${11/Math.max(z,.5)}px "Saira Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',g.x,g.y-(g.u.d.inf?11:24)/Math.max(z,.7));ctx.globalAlpha=1}
  // hava: uçaklar, helikopterler, füzeler, bombalar
  for(const p of state.proj){if(!SKY[p.k])continue;
    if(p.k==='msl'){const a=p.a||0;ctx.strokeStyle='rgba(240,240,232,.95)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(p.x-Math.cos(a)*9,p.y-Math.sin(a)*9);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.arc(p.x-Math.cos(a)*9,p.y-Math.sin(a)*9,1.8,0,TAU);ctx.fill()}
    else if(p.k==='agun'){const a=Math.atan2(p.ty-p.sy,p.tx-p.sx);ctx.strokeStyle='rgba(255,226,150,.95)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(p.x-Math.cos(a)*18,p.y-Math.sin(a)*18);ctx.lineTo(p.x,p.y);ctx.stroke()}
    else if(p.k==='arock'){ctx.fillStyle='#ffb04a';ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,TAU);ctx.fill()}
    else{const f=p.t/p.T,h=(1-f)*(p.k==='lgb'?50:40);ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,TAU);ctx.fill();ctx.fillStyle='#2b2e27';ctx.beginPath();ctx.ellipse(p.x,p.y-h,3.6,1.8,Math.atan2(p.ty-p.sy,p.tx-p.sx),0,TAU);ctx.fill()}}
  for(const u of state.units){if(!u.d.air||(u.side===1&&!state.vis[0].has(u.id)))continue;const fl=flying(u)||u.altT>0;
    const off=!fl?0:u.d.plane?(u.alt==='high'?60:24):(u.alt==='high'?32:13),sc=u.d.plane&&u.alt==='high'?.9:1,fn=u.d.plane?drawPlane:u.d.drone?drawDrone:drawHeli;
    if(off)fn(ctx,u,u.x+off*.5,u.y+off,sc*.85,true);
    if(u.sel){ctx.strokeStyle='#e8a838';ctx.lineWidth=1.4/z;ctx.beginPath();ctx.arc(u.x,u.y,u.d.plane?22:18,0,TAU);ctx.stroke()}
    fn(ctx,u,u.x,u.y,sc,false)}
  // üst katman
  const lw=1/z;
  for(const u of state.units){if(!u.d.radar||(u.side===1&&!state.vis[0].has(u.id)))continue;
    if(u.radarOn){const r=14+(state.time*20%16);ctx.strokeStyle=`rgba(127,212,138,${1-(r-14)/16})`;ctx.lineWidth=1.5*lw;ctx.beginPath();ctx.arc(u.x,u.y,r,0,TAU);ctx.stroke()}
    if(u.side===0&&state.proj.some(p=>p.k==='msl'&&p.mk==='arm'&&p.tgt===u&&!p.lost)){ctx.strokeStyle=`rgba(226,88,75,${.5+.5*Math.sin(state.time*20)})`;ctx.lineWidth=3*lw;ctx.beginPath();ctx.arc(u.x,u.y,30,0,TAU);ctx.stroke()}}
  for(const u of S){for(const w of u.d.w){if(!w.aaOnly)continue;ctx.setLineDash([6*lw,6*lw]);ctx.strokeStyle='rgba(127,212,138,.45)';ctx.lineWidth=lw;for(const r of [w.rLow,w.rHigh])if(r){ctx.beginPath();ctx.arc(u.x,u.y,r,0,TAU);ctx.stroke()}ctx.setLineDash([])}}
  const arrow=(ax,ay,bx,by,col)=>{const a=Math.atan2(by-ay,bx-ax);ctx.strokeStyle=col;ctx.lineWidth=2*lw;ctx.setLineDash([8*lw,5*lw]);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-Math.cos(a-.4)*14*lw*1.5,by-Math.sin(a-.4)*14*lw*1.5);ctx.moveTo(bx,by);ctx.lineTo(bx-Math.cos(a+.4)*14*lw*1.5,by-Math.sin(a+.4)*14*lw*1.5);ctx.stroke()};
  for(const u of state.units){if(u.side!==0||!u.d.plane)continue;if(u.run)arrow(u.run.ax,u.run.ay,u.run.bx,u.run.by,'rgba(232,168,56,.85)');
    for(const st of u.strikes){const x=st.t?st.t.x:st.x,y=st.t?st.t.y:st.y;ctx.strokeStyle='rgba(232,168,56,.9)';ctx.lineWidth=1.5*lw;ctx.beginPath();ctx.arc(x,y,12,0,TAU);ctx.moveTo(x-18,y);ctx.lineTo(x+18,y);ctx.moveTo(x,y-18);ctx.lineTo(x,y+18);ctx.stroke()}
    if(u.sel&&!u.run&&!u.strikes.length&&!u.rtb){ctx.strokeStyle='rgba(98,166,230,.4)';ctx.setLineDash([4*lw,6*lw]);ctx.lineWidth=lw;ctx.beginPath();ctx.arc(u.loiter.x,u.loiter.y,170,0,TAU);ctx.stroke();ctx.setLineDash([])}}
  if(state.drag&&state.drag.run){const a=toW(state.drag.sx,state.drag.sy),b=toW(state.drag.cx,state.drag.cy);if(Math.hypot(b.x-a.x,b.y-a.y)>20)arrow(a.x,a.y,b.x,b.y,'#e8a838')}
  for(const p of state.proj){if(p.k!=='arty'&&p.k!=='mortar')continue;const rem=p.T-p.t;
    if(p.side===1&&rem<1.6&&state.units.some(u=>u.side===0&&Math.hypot(u.x-p.tx,u.y-p.ty)<300)){ctx.strokeStyle=`rgba(226,88,75,${.4+.4*Math.sin(state.time*18)})`;ctx.lineWidth=2*lw;ctx.setLineDash([6*lw,5*lw]);ctx.beginPath();ctx.arc(p.tx,p.ty,p.w.splash,0,TAU);ctx.stroke();ctx.setLineDash([])}
    else if(p.side===0){ctx.strokeStyle='rgba(232,168,56,.7)';ctx.lineWidth=1.5*lw;ctx.beginPath();ctx.moveTo(p.tx-6,p.ty-6);ctx.lineTo(p.tx+6,p.ty+6);ctx.moveTo(p.tx+6,p.ty-6);ctx.lineTo(p.tx-6,p.ty+6);ctx.stroke()}}
  const fsz=10/Math.max(z,.55);ctx.font=`600 ${fsz}px "JetBrains Mono",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
  for(const u of state.units){if(u.side!==0||!u.mission)continue;const m=u.mission,sg=estSig(u,Math.hypot(m.x-u.x,m.y-u.y),observed(0,m.x,m.y),m.fired);
    ctx.strokeStyle='rgba(232,168,56,.75)';ctx.lineWidth=1.5*lw;ctx.setLineDash([3*lw,4*lw]);ctx.beginPath();ctx.arc(m.x,m.y,sg,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#e8a838';ctx.fillText(`${m.shell==='he'?'TAH':'SİS'} ×${m.n}`,m.x,m.y-sg-fsz)}
  for(const cb of state.cbs){if(cb.det!==0||cb.t<=0)continue;ctx.globalAlpha=Math.min(1,cb.t/3);ctx.strokeStyle='#e2584b';ctx.lineWidth=2*lw;const r=16;
    ctx.beginPath();ctx.arc(cb.x,cb.y,r,0,TAU);ctx.moveTo(cb.x-r-6,cb.y);ctx.lineTo(cb.x+r+6,cb.y);ctx.moveTo(cb.x,cb.y-r-6);ctx.lineTo(cb.x,cb.y+r+6);ctx.stroke();
    ctx.fillStyle='#e2584b';ctx.fillText(cb.k==='arty'?'OBÜS?':'HAVAN?',cb.x,cb.y+r+fsz+4);ctx.globalAlpha=1}
  ctx.textBaseline='top';
  if(z>.5)for(const u of state.units){if(u.side!==0||!u.cov||u.moving)continue;const c=u.cov;ctx.strokeStyle='rgba(127,212,138,.9)';ctx.lineWidth=1.6*lw;ctx.beginPath();
    if(c.r!=null||c.t==='trench')ctx.arc(u.x,u.y,6.5,0,TAU);else{const s=segInfo(c,u.x,u.y),a=Math.atan2(s.py-u.y,s.px-u.x);ctx.arc(u.x,u.y,7,a-1.1,a+1.1)}ctx.stroke()}
  for(const u of state.units){if(u.side===1&&!state.vis[0].has(u.id))continue;const yo=u.d.inf?8:19;const hpF=u.hp/u.d.hp,sc=1/Math.max(z,.6);
    if(u.d.plane&&u.sel){const bw=26*sc,bh=2.2*sc;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(u.x-bw/2,u.y-yo-bh*5,bw,bh);ctx.fillStyle=u.fuel<u.d.fuel*.25?'#e2584b':'#e8a838';ctx.fillRect(u.x-bw/2,u.y-yo-bh*5,bw*u.fuel/u.d.fuel,bh)}
    if(((u.d.veh||u.d.air)&&hpF<1)||u.sel){const bw=(u.d.inf?12:26)*sc,bh=2.6*sc;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(u.x-bw/2,u.y-yo-bh*2.5,bw,bh);ctx.fillStyle=hpF>.5?COL[u.side].ring:hpF>.25?'#e8a838':'#e2584b';ctx.fillRect(u.x-bw/2,u.y-yo-bh*2.5,bw*hpF,bh)}
    {const rk=rank(u);if(rk&&(u.sel||(!u.d.inf&&z>.6))){ctx.strokeStyle='#e8a838';ctx.lineWidth=1.2*sc;for(let i=0;i<rk;i++){const cx=u.x+(u.d.inf?9:16)*sc,cy=u.y-yo-2*sc+i*3*sc;ctx.beginPath();ctx.moveTo(cx-2.5*sc,cy+1.5*sc);ctx.lineTo(cx,cy);ctx.lineTo(cx+2.5*sc,cy+1.5*sc);ctx.stroke()}}}
    if(u.side===0&&u.th&&state.time-u.th.t<2.8&&z>.45){const al=Math.min(1,(2.8-(state.time-u.th.t))*1.5);ctx.globalAlpha=al;ctx.fillStyle='#7fd48a';ctx.font=`600 ${9.5/Math.max(z,.6)}px "JetBrains Mono",monospace`;ctx.fillText(u.th.s,u.x,u.y-yo-(u.d.inf?18:14)*sc-(state.time-u.th.t)*4);ctx.font=`600 ${fsz}px "JetBrains Mono",monospace`;ctx.globalAlpha=1}
    if(u.panicT>0){ctx.fillStyle=`rgba(226,88,75,${.6+.4*Math.sin(state.time*14)})`;ctx.font=`800 ${12*sc}px "Saira Condensed",sans-serif`;ctx.fillText('!',u.x,u.y-yo-16*sc);ctx.font=`600 ${fsz}px "JetBrains Mono",monospace`}
    if(u.abandoned&&z>.5){ctx.fillStyle='rgba(200,200,190,.9)';ctx.fillText('TERK',u.x,u.y+yo+4)}
    if(u.side===0&&u.d.inf&&u.sup>65){ctx.fillStyle='#e2584b';ctx.beginPath();ctx.arc(u.x,u.y-yo-6*sc,1.8*sc,0,TAU);ctx.fill()}
    if(u.dig>=0){const bw=14*sc;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(u.x-bw/2,u.y+8,bw,2.5*sc);ctx.fillStyle='#c9a35a';ctx.fillRect(u.x-bw/2,u.y+8,bw*u.dig,2.5*sc)}
    if(u.d.indirect&&(u.st==='deploying'||u.st==='packing')){const bw=20*sc,f=1-u.stT/(u.st==='deploying'?u.d.setupT:u.d.packT);ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(u.x-bw/2,u.y+yo,bw,2.5*sc);ctx.fillStyle='#e8a838';ctx.fillRect(u.x-bw/2,u.y+yo,bw*f,2.5*sc)}
    if((u.d.veh||u.d.air)&&(z<.95||u.sel)){ctx.fillStyle=u.side?'rgba(240,140,128,.95)':'rgba(150,200,245,.95)';ctx.fillText(u.d.tag,u.x,u.y+yo+4)}}
  /* dron kontrol bağlantıları: seçili operatörün menzili ve dronlarına, seçili dronun operatörüne çizgi */
  for(const d of state.units){if(!d.op||d.side!==0||d.hp<=0||d.gone||!(d.sel||d.op.sel))continue;const o=d.op,far=Math.hypot(o.x-d.x,o.y-d.y)>o.d.ctrl*.85;
    ctx.strokeStyle=far?'rgba(226,88,75,.8)':'rgba(127,212,138,.55)';ctx.lineWidth=lw;ctx.setLineDash([3*lw,5*lw]);ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(d.x,d.y);ctx.stroke();ctx.setLineDash([])}
  {const seen=new Set();for(const o of S){if(!o.d.dronOp||seen.has(o.sq))continue;seen.add(o.sq);ctx.strokeStyle='rgba(127,212,138,.35)';ctx.lineWidth=1.2*lw;ctx.setLineDash([10*lw,8*lw]);ctx.beginPath();ctx.arc(o.x,o.y,o.d.ctrl,0,TAU);ctx.stroke();ctx.setLineDash([])}}
  if(state.phase==='deploy')drawDeployTop(z,lw);
  for(let i=state.marks.length-1;i>=0;i--){const m=state.marks[i];if(!m.ping)continue;m.t+=1/60;if(m.t>.7){state.marks.splice(i,1);continue}ctx.strokeStyle=m.c;ctx.globalAlpha=1-m.t/.7;ctx.lineWidth=2*lw;ctx.beginPath();ctx.arc(m.x,m.y,6+m.t*30,0,TAU);ctx.stroke();ctx.globalAlpha=1}
  const mw=toW(state.mouse.x,state.mouse.y);
  if(state.dc){const u=state.dc,w=u.d.w[0];if(w){const [ox,oy]=muzzle(u);const ang=u.ta;const d=Math.min(Math.hypot(mw.x-u.x,mw.y-u.y),w.r);
      ctx.strokeStyle='rgba(232,168,56,.6)';ctx.lineWidth=lw;ctx.setLineDash([5*lw,5*lw]);ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(u.x+Math.cos(ang)*d,u.y+Math.sin(ang)*d);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(u.x,u.y,w.r,0,TAU);ctx.strokeStyle='rgba(232,168,56,.25)';ctx.stroke();
      const ready=u.cd[0]<=0,fr=ready?1:1-u.cd[0]/w.rl;ctx.strokeStyle=ready?'#e8a838':'rgba(232,168,56,.5)';ctx.lineWidth=2*lw;ctx.beginPath();ctx.arc(mw.x,mw.y,9*lw*1.5,-PI/2,-PI/2+TAU*clamp(fr,0,1));ctx.stroke();
      ctx.beginPath();ctx.moveTo(mw.x-5*lw,mw.y);ctx.lineTo(mw.x+5*lw,mw.y);ctx.moveTo(mw.x,mw.y-5*lw);ctx.lineTo(mw.x,mw.y+5*lw);ctx.stroke()}}
  if(state.missionArm&&state.mouse.in){const s=sel().filter(u=>u.d.indirect);if(s.length){const u=s[0],d=Math.hypot(mw.x-u.x,mw.y-u.y),w=u.d.w[0],ok=d<=w.r&&d>=w.min,ob=observed(0,mw.x,mw.y),sg=estSig(u,d,ob,0);
    ctx.strokeStyle=!ok?'#e2584b':ob?'#7fd48a':'#e8a838';ctx.lineWidth=1.5*lw;ctx.beginPath();ctx.arc(mw.x,mw.y,sg,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(mw.x,mw.y,w.splash,0,TAU);ctx.globalAlpha=.4;ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=ctx.strokeStyle;ctx.textBaseline='bottom';ctx.fillText(!ok?'MENZİL DIŞI':ob?'GÖZLEMLİ':'GÖZLEMSİZ — dağılım yüksek',mw.x,mw.y-sg-4)}}
  ctx.setTransform(state.DPR,0,0,state.DPR,0,0);
  if(state.drag&&state.drag.box){ctx.strokeStyle='#e8a838';ctx.fillStyle='rgba(232,168,56,.08)';ctx.lineWidth=1;const x=Math.min(state.drag.sx,state.drag.cx),y=Math.min(state.drag.sy,state.drag.cy),w=Math.abs(state.drag.cx-state.drag.sx),h=Math.abs(state.drag.cy-state.drag.sy);ctx.fillRect(x,y,w,h);ctx.strokeRect(x+.5,y+.5,w,h)}
}
/* ---------- konuşlanma safhası katmanları ---------- */
function drawDeployZones(z){for(const sd of [0,1]){const r=deployZone(sd),me=sd===0;
    ctx.fillStyle=me?'rgba(98,166,230,.09)':'rgba(226,88,75,.06)';ctx.fillRect(r.x0,r.y0,r.x1-r.x0,r.y1-r.y0);
    ctx.strokeStyle=me?'rgba(98,166,230,.85)':'rgba(226,88,75,.55)';ctx.lineWidth=2.5/z;ctx.setLineDash([14/z,9/z]);ctx.strokeRect(r.x0,r.y0,r.x1-r.x0,r.y1-r.y0);ctx.setLineDash([]);
    const fz=13/Math.max(z,.4);ctx.font=`800 ${fz}px "Saira Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=me?'#62a6e6':'#e2584b';
    ctx.fillText(me?'KONUŞLANMA BÖLGESİ':'DÜŞMAN KONUŞLANMA BÖLGESİ',(r.x0+r.x1)/2,r.y0+8/z)}}
function arrowFrom(x,y,a,len,col,w){const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len,h=Math.min(9,len*.4);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);
  ctx.moveTo(ex,ey);ctx.lineTo(ex-Math.cos(a-.5)*h,ey-Math.sin(a-.5)*h);ctx.moveTo(ex,ey);ctx.lineTo(ex-Math.cos(a+.5)*h,ey-Math.sin(a+.5)*h);ctx.stroke()}
function drawDeployTop(z,lw){const d=dep.drag,moving=d&&d.k==='move'&&d.cand?new Set(d.us.map(o=>o.u)):null;
  /* yön okları: her birimin savaş başında bakacağı yön */
  for(const u of state.units){if(u.side!==0||u.d.plane||(moving&&moving.has(u)))continue;const a=u.faceA??u.a,L=u.d.inf?13:34;
    arrowFrom(u.x+Math.cos(a)*(u.d.inf?6:20),u.y+Math.sin(a)*(u.d.inf?6:20),a,L-(u.d.inf?6:20)+8,u.sel?'rgba(232,168,56,.95)':'rgba(150,200,245,.55)',(u.sel?1.8:1.2)*lw)}
  if(d&&d.k==='move'&&d.cand&&d.moved){const ok=d.bad.every(b=>!b);
    for(let i=0;i<d.cand.length;i++){const c=d.cand[i],o=d.us[i];ctx.strokeStyle=ok?'rgba(127,212,138,.35)':'rgba(226,88,75,.35)';ctx.lineWidth=lw;ctx.setLineDash([3*lw,4*lw]);ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.6;drawUnit(ctx,{...c.u,x:c.x,y:c.y},c.x,c.y,1);ctx.globalAlpha=1;
      ctx.strokeStyle=d.bad[i]?'#e2584b':'#7fd48a';ctx.lineWidth=2*lw;ctx.beginPath();ctx.arc(c.x,c.y,c.u.d.inf?8:24,0,TAU);ctx.stroke()}
    const b=d.bad.find(Boolean),c0=d.cand[0];if(b){const fz=11/Math.max(z,.5);ctx.font=`700 ${fz}px "JetBrains Mono",monospace`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='#e2584b';ctx.fillText(b,c0.x,c0.y-(c0.u.d.inf?12:30))}}
  if(d&&d.k==='face'&&d.ang!=null){arrowFrom(d.c.x,d.c.y,d.ang,80/Math.max(z,.5),'#e8a838',2.5*lw);for(const u of d.us)arrowFrom(u.x,u.y,d.ang,u.d.inf?16:40,'rgba(232,168,56,.8)',1.5*lw)}}
function drawMini(){if(state.mmDirty){refreshMini();state.mmDirty=false}mctx.drawImage(mmBase,0,0);const sx=220/W,sy=138/H;
  for(const o of state.objs){mctx.fillStyle=o.owner===0?'#62a6e6':o.owner===1?'#e2584b':'#d8d3bd';mctx.fillRect(o.x*sx-4,o.y*sy-4,8,8);mctx.fillStyle='#10130e';mctx.font='800 8px sans-serif';mctx.textAlign='center';mctx.textBaseline='middle';mctx.fillText(o.n,o.x*sx,o.y*sy+.5)}
  mctx.strokeStyle='rgba(226,88,75,.6)';mctx.lineWidth=1;for(const [id,g] of ghosts)if(!state.vis[0].has(id))mctx.strokeRect(g.x*sx-1.5,g.y*sy-1.5,3,3);
  for(const u of state.units){if(u.side===1&&!state.vis[0].has(u.id))continue;mctx.fillStyle=u.abandoned?'#9a9c94':u.d.air?(u.side?'#ffb0a6':'#c6e2fb'):COL[u.side].ring;const s=u.d.inf?1.6:3;mctx.fillRect(u.x*sx-s/2,u.y*sy-s/2,s,s)}
  for(const cb of state.cbs)if(cb.det===0&&cb.t>0){mctx.strokeStyle='#e2584b';mctx.lineWidth=1;mctx.beginPath();mctx.arc(cb.x*sx,cb.y*sy,4,0,TAU);mctx.stroke()}
  mctx.strokeStyle='#e8a838';mctx.lineWidth=1;mctx.strokeRect(cam.x*sx+.5,cam.y*sy+.5,state.VW/cam.z*sx,state.VH/cam.z*sy)}

export {drawDrone,drawHeli,drawMini,drawPlane,drawSoldier,drawVeh,render};
