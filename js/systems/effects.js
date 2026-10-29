/* systems/effects.js — Görsel efektler: parçacıklar, patlama, krater, yangın (orman ve bina), siper yıkımı, iz, efekt çizimi. */
import {state} from '../state.js';
import {ctx,tctx} from '../canvas.js';
import {CS,GH,GW,PI,T,TAU} from '../config.js';
import {cam} from '../state.js';
import {R,gauss,segInfo} from '../utils/helpers.js';
import {buildChains,cellAt,grid,scorch} from '../world/terrain.js';

function chute(u){state.parts.push({chute:1,x:u.x,y:u.y,vx:8,vy:5,life:0,max:9,r:5,g:5,col:'#e8e4d6'})}
function flareFx(t){for(let i=0;i<7;i++)state.parts.push({x:t.x,y:t.y,vx:gauss()*60-Math.cos(t.a)*40,vy:gauss()*60-Math.sin(t.a)*40,life:0,max:1.2+R()*.6,r:2.6,g:1,col:'rgba(255,236,180,.95)',fire:1})}
/* ---------- efektler: parçacıklar, yangın, yıkım ---------- */
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
function mkSprite(stops){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,64,64);return c}
const SPR={smoke:mkSprite([[0,'rgba(58,56,52,1)'],[.5,'rgba(58,56,52,.55)'],[1,'rgba(58,56,52,0)']]),smokeL:mkSprite([[0,'rgba(196,194,186,1)'],[.5,'rgba(196,194,186,.5)'],[1,'rgba(196,194,186,0)']]),
  dust:mkSprite([[0,'rgba(152,132,98,1)'],[.6,'rgba(152,132,98,.4)'],[1,'rgba(152,132,98,0)']]),fire:mkSprite([[0,'rgba(255,244,200,1)'],[.25,'rgba(255,182,72,.9)'],[.6,'rgba(222,72,22,.4)'],[1,'rgba(150,30,0,0)']]),
  glow:mkSprite([[0,'rgba(255,196,118,.9)'],[.4,'rgba(255,138,50,.35)'],[1,'rgba(255,100,30,0)']]),flash:mkSprite([[0,'rgba(255,255,236,1)'],[.3,'rgba(255,230,170,.8)'],[1,'rgba(255,200,120,0)']])};
let wind={x:9,y:-3};
let spreadT=0;
const fireCells=new Map();
const P=o=>{o.life=0;o.z=o.z||0;o.vz=o.vz||0;o.vx=o.vx||0;o.vy=o.vy||0;o.a=o.a??1;state.parts.push(o)};
function puff(x,y,n,col,sz){const light=+((col.match(/\d+/)||[0])[0])>180;for(let i=0;i<n;i++)P({k:light?'smokeL':'dust',x:x+gauss()*sz*.2,y:y+gauss()*sz*.2,vx:gauss()*16,vy:gauss()*16,vz:light?8:0,r:sz*.4,g:sz*1.1,max:1+R()*1.4,a:.6})}
function addShake(x,y,s){if(RM)return;const cx=cam.x+state.VW/cam.z/2,cy=cam.y+state.VH/cam.z/2,d=Math.hypot(x-cx,y-cy),reach=state.VW/cam.z*.8;if(d<reach)state.shake=Math.max(state.shake,Math.min(9,s*6*(1-d/reach)))}
function explode(x,y,s,o={}){s=Math.max(.2,s);
  P({k:'flash',x,y,r:18*s,g:80*s,max:.14});P({k:'glow',x,y,r:50*s,g:80*s,max:.5+.3*s,a:.9});
  for(let i=0;i<4+6*s;i++){const a=R()*TAU,v=15+R()*60*s;P({k:'fire',x:x+gauss()*6*s,y:y+gauss()*6*s,z:R()*8*s,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:15+R()*40*s,r:7*s,g:20*s,max:.35+R()*.45})}
  for(let i=0;i<5+9*s;i++){const a=R()*TAU,v=80+R()*240*s;P({k:'spark',x,y,z:4,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:60+R()*200*s,r:1,g:1,max:.5+R()*.6})}
  for(let i=0;i<3+6*s;i++){const a=R()*TAU,v=40+R()*130*s;P({k:'debris',x,y,z:2,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:100+R()*230*s,r:1.2+R()*2.4*s,g:0,rot:R()*TAU,vr:gauss()*12,max:3,col:o.dcol||'#2d2a24'})}
  P({k:'ring',x,y,r:5*s,g:85*s,max:.35,a:.55});
  for(let i=0;i<3+6*s;i++){const a=R()*TAU,v=20+R()*50*s;P({k:'dust',x:x+Math.cos(a)*10*s,y:y+Math.sin(a)*10*s,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:9*s,g:38*s,max:1.5+R()*1.5,a:.55})}
  for(let i=0;i<2+5*s;i++)P({k:'smoke',x:x+gauss()*10*s,y:y+gauss()*10*s,z:5,vx:gauss()*8,vy:gauss()*8,vz:16+R()*24,r:11*s,g:(38+R()*30)*s,max:4+R()*4*s,a:.55});
  addShake(x,y,s)}
function crater(x,y,rad){scorch(x,y,rad*1.4);const g=tctx;g.strokeStyle='rgba(125,104,70,.45)';g.lineWidth=Math.max(2,rad*.25);g.beginPath();g.arc(x,y,rad*.7,0,TAU);g.stroke();
  g.fillStyle='rgba(18,14,9,.6)';g.beginPath();g.arc(x,y,rad*.5,0,TAU);g.fill();for(let i=0;i<rad;i++){const a=R()*TAU,d=rad*(.7+R()*.7);g.fillStyle=R()<.5?'rgba(90,72,46,.6)':'rgba(40,32,22,.6)';g.fillRect(x+Math.cos(a)*d,y+Math.sin(a)*d,1+R()*3,1+R()*3)}state.mmDirty=true}
function ricochet(x,y,sx,sy){const a0=Math.atan2(y-sy,x-sx);for(let i=0;i<5;i++){const a=a0+PI+gauss()*1.1,v=120+R()*200;P({k:'spark',x,y,z:6,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:40+R()*120,r:1,g:1,max:.25+R()*.3})}P({k:'flash',x,y,r:3,g:12,max:.08})}
function addFire(x,y,r,t,int){state.fires.push({x,y,r,t,int:int||1});if(cellAt(x,y)===T.FOREST)igniteAt(x,y,r+10,.5)}
/* orman yangını: hücreden hücreye rüzgâr yönünde yayılır, yanan alan kömürleşir */
function igniteCell(cx,cy){if(fireCells.size>380||cx<0||cy<0||cx>=GW||cy>=GH)return;const i=cy*GW+cx;if(grid[i]!==T.FOREST||fireCells.has(i))return;fireCells.set(i,20+R()*12)}
function igniteAt(x,y,rad,ch){const c0=x/CS|0,r0=y/CS|0,n=Math.ceil(rad/CS);for(let cy=r0-n;cy<=r0+n;cy++)for(let cx=c0-n;cx<=c0+n;cx++)if(Math.hypot(cx*CS+8-x,cy*CS+8-y)<=rad&&R()<ch)igniteCell(cx,cy)}
function charCell(cx,cy){const g=tctx,x=cx*CS,y=cy*CS;g.fillStyle='rgba(30,26,20,.88)';g.fillRect(x-1,y-1,CS+2,CS+2);for(let i=0;i<6;i++){g.fillStyle=R()<.6?'rgba(70,64,56,.7)':'rgba(10,9,8,.8)';g.fillRect(x+R()*CS,y+R()*CS,1+R()*2.5,1+R()*2.5)}
  if(R()<.6){g.fillStyle='#120f0b';g.beginPath();g.arc(x+R()*CS,y+R()*CS,1.6,0,TAU);g.fill()}state.mmDirty=true}
function updCells(dt){spreadT+=dt;const spread=spreadT>=1;if(spread)spreadT=0;
  for(const [i,t] of fireCells){const cx=i%GW,cy=i/GW|0,nt=t-dt;
    if(nt<=0){fireCells.delete(i);grid[i]=T.BURNT;charCell(cx,cy);continue}fireCells.set(i,nt);const k=Math.min(1,nt/6),x=cx*CS+8,y=cy*CS+8;
    if(spread)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const ch=.045+(dx*wind.x+dy*wind.y>0?.06:0);if(R()<ch)igniteCell(cx+dx,cy+dy)}
    if(R()<dt*2.6*k)P({k:'fire',x:x+gauss()*9,y:y+gauss()*9,vx:wind.x*.3,vy:wind.y*.3,vz:20+R()*25,r:7+R()*4,g:18+R()*8,max:.6+R()*.5,a:.75});
    if(R()<dt*.7*k)P({k:'smoke',x,y,z:12,vx:wind.x*.5,vy:wind.y*.5,vz:30+R()*20,r:10,g:45+R()*30,max:6+R()*4,a:.5})}}
function igniteB(b){if(b.dead||b.burn>0||b.sh==='tank'&&false)return;b.burn=30+R()*20}
function charB(b){const g=tctx;g.fillStyle='rgba(15,12,9,.55)';g.fillRect(b.x,b.y,b.w,b.h);state.mmDirty=true}
function bldDamage(b,st){const g=tctx;for(let i=0;i<2+st*2;i++){const x=b.x+4+R()*(b.w-8),y=b.y+4+R()*(b.h-8),rr=2+R()*4*st;g.fillStyle='rgba(18,15,11,.85)';g.beginPath();g.ellipse(x,y,rr,rr*(.6+R()*.4),R()*PI,0,TAU);g.fill();g.strokeStyle='rgba(150,140,120,.35)';g.lineWidth=1;g.stroke()}
  if(st>=2){const cw=b.w*(.3+R()*.3),ch=b.h*(.3+R()*.3),cx=R()<.5?b.x:b.x+b.w-cw,cy=R()<.5?b.y:b.y+b.h-ch;g.fillStyle='rgba(32,28,22,.92)';g.fillRect(cx,cy,cw,ch);
    for(let i=0;i<12;i++){g.fillStyle=R()<.5?'#6e675b':'#403b33';g.fillRect(cx-4+R()*(cw+8),cy-4+R()*(ch+8),2+R()*4,2+R()*3)}}
  for(let i=0;i<6;i++)P({k:'dust',x:b.x+R()*b.w,y:b.y+R()*b.h,vx:gauss()*14,vy:gauss()*14,r:8,g:26,max:2+R(),a:.5});state.mmDirty=true}
/* örtüler: kum torbası, duvar ve çit patlamayla ya da üzerinden geçen araçla yıkılır */
function breakCover(c){state.covers=state.covers.filter(x=>x!==c);buildChains();const g=tctx,L=Math.hypot(c.x2-c.x1,c.y2-c.y1);
  for(let d=0;d<=L;d+=3){const x=c.x1+(c.x2-c.x1)*d/L+gauss()*5,y=c.y1+(c.y2-c.y1)*d/L+gauss()*5;g.fillStyle=c.t==='sandbag'?(R()<.5?'#8d8061':'#6c6249'):c.t==='wall'?(R()<.5?'#7e7b72':'#5a5850'):(R()<.5?'#3c4a26':'#5a4a30');g.fillRect(x,y,2+R()*3,1.5+R()*2.5)}
  puff((c.x1+c.x2)/2,(c.y1+c.y2)/2,4,'rgba(150,135,100,.5)',22);state.mmDirty=true}
function damageCovers(x,y,rad,dmg){for(const c of [...state.covers]){if(c.r!=null||!isFinite(c.hp))continue;const d=segInfo(c,x,y).d;if(d<rad){c.hp-=dmg*(1-d/rad)*1.2;if(c.hp<=0)breakCover(c)}}}
function trackMark(u){const g=tctx,w=(u.key==='tank'?21:u.key==='ifv'?18:15)/2-2,px=-Math.sin(u.a),py=Math.cos(u.a),road=cellAt(u.x,u.y)===T.ROAD;g.fillStyle=road?'rgba(25,20,12,.06)':'rgba(32,24,12,.13)';
  for(const s of [-1,1]){g.save();g.translate(u.x+px*w*s,u.y+py*w*s);g.rotate(u.a);g.fillRect(-3,-1.6,6,3.2);g.restore()}}
function drawTurDecal(x,y,rot){const g=tctx;g.save();g.translate(x,y);g.rotate(rot);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-7,-5,18,14);g.fillStyle='#2b2823';g.fillRect(-9,-7,18,14);g.fillStyle='#1b1915';g.fillRect(8,-1.5,20,3);g.restore();scorch(x,y,12);state.mmDirty=true}
function updParts(dt){
  for(let i=state.parts.length-1;i>=0;i--){const p=state.parts[i];if(!p.k){p.k=p.chute?'chute':p.ring?'ring':p.fire?'ember':(+((p.col||'').match(/\d+/)||[0])[0])<110?'smoke':'smokeL';p.z=p.z||0;p.vz=p.vz||(p.k==='smoke'||p.k==='smokeL'?10:0);p.a=p.a??.5}
    p.life+=dt;if(p.life>=p.max){state.parts.splice(i,1);continue}
    const k=p.k;
    if(k==='debris'||k==='spark'||k==='turret'||k==='ember'){p.vz-=(k==='ember'?60:420)*dt;p.z+=p.vz*dt;if(p.rot!=null)p.rot+=(p.vr||0)*dt;
      if(p.z<=0){p.z=0;if(k==='turret'){drawTurDecal(p.x,p.y,p.rot);state.parts.splice(i,1);continue}if(k==='debris'){if(R()<.35){tctx.fillStyle='rgba(30,26,20,.55)';tctx.fillRect(p.x,p.y,p.r,p.r)}p.vx*=.3;p.vy*=.3;p.vz=-p.vz*.25;if(Math.abs(p.vz)<30){p.vz=0;p.max=Math.min(p.max,p.life+.25)}}else{p.max=p.life}}}
    else if(k==='smoke'||k==='smokeL'){p.vx+=(wind.x-p.vx)*.3*dt;p.vy+=(wind.y-p.vy)*.3*dt;p.z+=p.vz*dt;p.vz*=1-.25*dt}
    else if(k==='fire'){p.z+=p.vz*dt;p.vx*=1-2*dt;p.vy*=1-2*dt}
    else if(k==='dust'){p.vx*=1-1.8*dt;p.vy*=1-1.8*dt}
    p.x+=p.vx*dt;p.y+=p.vy*dt}
  if(state.parts.length>2600)state.parts.splice(0,state.parts.length-2600)}
function drawFX(add){const c=ctx;
  if(!add){for(const p of state.parts){const k=p.k,f=p.life/p.max;
      if(k==='smoke'||k==='smokeL'||k==='dust'){const rr=p.r+(p.g-p.r)*(1-(1-f)*(1-f)),al=p.a*(f<.08?f/.08:1)*Math.pow(1-f,1.2);if(al<.01)continue;c.globalAlpha=al;c.drawImage(SPR[k],p.x-rr,p.y-p.z-rr,rr*2,rr*2)}
      else if(k==='ring'){const rr=p.r+(p.g-p.r)*f;c.globalAlpha=p.a*(1-f);c.strokeStyle='rgb(205,190,150)';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y,rr,0,TAU);c.stroke()}
      else if(k==='debris'){c.globalAlpha=Math.min(1,(p.max-p.life)*3);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(p.x+p.z*.25,p.y+p.z*.1,p.r,p.r);c.save();c.translate(p.x,p.y-p.z);c.rotate(p.rot);c.fillStyle=p.col;c.fillRect(-p.r,-p.r/2,p.r*2,p.r);c.restore()}
      else if(k==='turret'){c.globalAlpha=1;const sc=1+p.z/260;c.fillStyle='rgba(0,0,0,.3)';c.fillRect(p.x-8+p.z*.3,p.y-6+p.z*.15,16,12);c.save();c.translate(p.x,p.y-p.z);c.rotate(p.rot);c.scale(sc,sc);c.fillStyle='#2f2b25';c.fillRect(-9,-7,18,14);c.fillStyle='#1b1915';c.fillRect(8,-1.5,20,3);c.restore()}
      else if(k==='chute'){c.globalAlpha=1;c.fillStyle=p.col;c.beginPath();c.arc(p.x,p.y-6,5,PI,0);c.fill();c.strokeStyle='rgba(30,30,30,.7)';c.lineWidth=.6;c.beginPath();c.moveTo(p.x-5,p.y-6);c.lineTo(p.x,p.y);c.lineTo(p.x+5,p.y-6);c.stroke()}}
    c.globalAlpha=1;return}
  c.globalCompositeOperation='lighter';
  const x0=cam.x-60,y0=cam.y-60,x1=cam.x+state.VW/cam.z+60,y1=cam.y+state.VH/cam.z+60;
  for(const f of state.fires){if(f.x<x0||f.x>x1||f.y<y0||f.y>y1)continue;const rr=f.r*3.2*(.9+.1*Math.sin(state.time*13+f.x));c.globalAlpha=.35*Math.min(1,f.t/8)*f.int;c.drawImage(SPR.glow,f.x-rr,f.y-rr,rr*2,rr*2)}
  for(const b of state.buildings)if(b.burn>0&&!b.dead){const cx=b.x+b.w/2,cy=b.y+b.h/2;if(cx<x0||cx>x1||cy<y0||cy>y1)continue;const rr=Math.max(b.w,b.h)*1.6;c.globalAlpha=.32+.06*Math.sin(state.time*11+cx);c.drawImage(SPR.glow,cx-rr,cy-rr,rr*2,rr*2)}
  for(const [i] of fireCells){const x=(i%GW)*CS+8,y=(i/GW|0)*CS+8;if(x<x0||x>x1||y<y0||y>y1)continue;c.globalAlpha=.14+.05*Math.sin(state.time*9+i);c.drawImage(SPR.glow,x-34,y-34,68,68)}
  for(const p of state.parts){const k=p.k,f=p.life/p.max;
    if(k==='fire'){const rr=p.r+(p.g-p.r)*f;c.globalAlpha=p.a*(1-f);c.drawImage(SPR.fire,p.x-rr,p.y-p.z-rr,rr*2,rr*2)}
    else if(k==='flash'||k==='glow'){const rr=p.r+(p.g-p.r)*f;c.globalAlpha=p.a*Math.pow(1-f,k==='glow'?.7:1);c.drawImage(SPR[k],p.x-rr,p.y-rr,rr*2,rr*2)}
    else if(k==='spark'){c.globalAlpha=1-f;c.strokeStyle='rgb(255,214,140)';c.lineWidth=1.2;c.beginPath();c.moveTo(p.x-p.vx*.025,p.y-p.z+p.vz*.025-p.vy*.025);c.lineTo(p.x,p.y-p.z);c.stroke()}
    else if(k==='ember'){c.globalAlpha=1-f;c.fillStyle=p.col||'rgb(255,170,70)';c.beginPath();c.arc(p.x,p.y-p.z,p.r||1.2,0,TAU);c.fill()}}
  c.globalAlpha=1;c.globalCompositeOperation='source-over'}
function mkSmoke(x,y,r,life){return{x,y,r,age:0,life,b:Array.from({length:7},()=>[gauss()*r*.45,gauss()*r*.45,.45+R()*.35])}}
function popSmoke(u){if(u.smokeL<1)return;u.smokeL--;for(let i=-1;i<=1;i++){const a=u.ta+i*.55;state.smokes.push(mkSmoke(u.x+Math.cos(a)*60,u.y+Math.sin(a)*60,46,25))}puff(u.x,u.y,6,'rgba(230,230,225,.5)',16)}

export {P,SPR,addFire,bldDamage,breakCover,charB,chute,crater,damageCovers,drawFX,explode,fireCells,flareFx,igniteAt,igniteB,mkSmoke,popSmoke,puff,ricochet,trackMark,updCells,updParts,wind};
