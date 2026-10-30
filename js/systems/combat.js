/* systems/combat.js — Savaş: hedef seçimi, atış, isabet, zırh ve delme, hasar, baskı ve moral, kritik hasar, mürettebat terki, ölüm, bina hasarı. */
import {state} from '../state.js';
import {tctx} from '../canvas.js';
import {AIRMUL,ECON,GREN,H,MAP,PI,RANKN,RIV,SQUADS,TAU,W,bodyR,coastX,rivNear,riverX,shipC} from '../config.js';
import {P,addFire,bldDamage,charB,chute,crater,explode,igniteB,puff,ricochet,wind} from './effects.js';
import {addKP,cardCd,flying,mkUnit,rank,unloadHeli} from './units.js';
import {observed} from './vision.js';
import {log,updTip} from '../ui/feedback.js';
import {R,angDiff,clamp,gauss,sideOf} from '../utils/helpers.js';
import {exitBld,layoutB} from '../world/buildings.js';
import {braced,coverMult,effStance,splashCov} from '../world/cover.js';
import {drawRubble,elevAt,navSnap,scorch} from '../world/terrain.js';

/* kinetik (KE) mermi menzille delme gücü kaybeder, kimyasal (HEAT) kaybetmez */
const apAt=(w,d)=>w.pen==='ke'?w.ap*(1.15-.3*Math.min(1,d/(w.r||400))):w.ap;
/* stres: zırh baskıyı azaltır, tecrübe dayanıklılığı artırır; ani büyük stres sersemletir */
function stress(u,amt){if(!amt||flying(u)||u.abandoned)return;if(!u.d.inf)amt*=Math.max(.1,1-.08*(u.d.aF||0));amt*=1-.1*rank(u);
  u.sup=Math.min(100,u.sup+amt);u.supT=state.time;if(amt>=45&&!(u.stunT>0))u.stunT=u.d.inf?2:3}
function panic(u){if(u.panicT>0||u.d.air||u.abandoned||u.d.fixed)return;u.panicT=u.d.inf?10:7;if(u.inB)exitBld(u,u.x+(u.side?60:-60),u.y);
  /* kıyı haritasında oyuncunun gemisi: nehirdeyse koydaki nehir ağzına, denizdeyse batıya kaçar */
  if(u.d.naval&&MAP.coast&&!u.side){const n=rivNear(u.x,u.y),inR=n&&n.d<RIV.hw&&u.x>coastX(u.y);u.dest=inR?{x:MAP.rp[0][0],y:MAP.rp[0][1]}:navSnap(Math.max(30,u.x-280),u.y,u.d)}
  else if(u.d.naval){const y=clamp(u.y+(u.side?-1:1)*280,20,H-20);u.dest={x:riverX(y),y}}else u.dest={x:clamp(u.x+(u.side?1:-1)*280,10,W-10),y:clamp(u.y+gauss()*70,10,H-10)};u.mode='move';u.focus=null;u.dig=-1;u.queue=[];u.board=null;u.crewTo=null;u.enterB=null;u.mission=null;
  if(u.side===0)log(`${u.d.n} paniğe kapıldı, geri çekiliyor`,'bad')}
function crit(t){if(R()>.35)return;const r=R();let m;
  if(r<.25){t.trk=25;m=t.d.naval?'dümen hasar gördü':'paletler koptu'}else if(r<.42){t.tur=12;m='taret sıkıştı'}else if(r<.57){t.opt=20;m='optik hasar gördü'}else if(r<.7){t.eng=true;m='motor hasar gördü'}else if(r<.85){t.fire=8;m='yangın çıktı'}else{t.stunT=4;m='mürettebat sersemledi'}
  if(t.side===0)log(`${t.d.n}: ${m}`,'bad')}
/* mürettebat aracı terk eder; terk edilmiş araç herhangi bir piyade tarafından yeniden ele geçirilebilir */
function bail(t){t.abandoned=true;t.dest=null;t.focus=null;t.queue=[];t.sel=false;t.mission=null;t.fire=0;if(t.sq){t.sq.m=t.sq.m.filter(x=>x!==t);t.sq=null}if(state.dc===t){state.dc=null;updTip()}
  if(t.cargo&&t.cargo.length){t.cargo.forEach(c=>{c.sup=85;c.supT=state.time});unloadHeli(t)}
  const n=t.d.crew||2,sq={id:state.sqid++,side:t.side,k:'crew',n:'Mürettebat',m:[],orderT:0,obj:null,dug:0};state.squads.set(sq.id,sq);
  for(let i=0;i<n;i++){const a=t.a+PI+(i-(n-1)/2)*.6,c=mkUnit(t.side,'crew',t.x+Math.cos(a)*24,t.y+Math.sin(a)*24,sq,25);c.veh=t;c.sup=70;c.supT=state.time;sq.m.push(c)}
  log(t.side===0?`${t.d.n}: mürettebat aracı terk etti`:`Düşman ${t.d.n.toLocaleLowerCase('tr')} mürettebatı aracı terk etti`,t.side===0?'bad':'good')}
function hurtB(b,a,fc){if(!b||b.dead)return;const f0=b.hp/b.max;b.hp-=a;const f1=b.hp/b.max;if(b.hp<=0){destroyB(b);return}
  if(f0>.66&&f1<=.66)bldDamage(b,1);if(f0>.33&&f1<=.33)bldDamage(b,2);if(fc&&!(b.burn>0)&&R()<fc)igniteB(b)}
function destroyB(b){b.dead=true;const occ=b.occ;b.occ=[];
  for(const u of occ){u.inB=null;u.x=b.x+R()*b.w;u.y=b.y+R()*b.h;u.hp-=10;u.sup=100;u.supT=state.time;if(u.hp<=0)kill(u)}
  state.covers.push({t:'rubble',x:b.x+b.w/2,y:b.y+b.h/2,r:Math.max(b.w,b.h)*.55});drawRubble(b);
  const cx=b.x+b.w/2,cy=b.y+b.h/2,sz=Math.max(b.w,b.h);b.burn=0;
  if(b.sh==='tank'){explode(cx,cy,3.2);crater(cx,cy,30);addFire(cx,cy,30,70,1.8);for(const u of state.units){const d=Math.hypot(u.x-cx,u.y-cy);if(d<95&&!flying(u))damage(u,{dmg:90,ap:5,k:'arty',soft:1.2},cx,cy,1-d/95)}for(const n of state.buildings)if(n!==b&&!n.dead&&Math.hypot(n.x+n.w/2-cx,n.y+n.h/2-cy)<110)igniteB(n)}
  else explode(cx,cy,.7,{dcol:'#5f594d'});
  for(let i=0;i<10+sz/3;i++){const a=R()*TAU,v=10+R()*40;P({k:'dust',x:b.x+R()*b.w,y:b.y+R()*b.h,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:12,g:40+sz*.6,max:3+R()*3,a:.6})}
  for(let i=0;i<8;i++){const a=R()*TAU,v=30+R()*90;P({k:'debris',x:cx,y:cy,z:4,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:60+R()*140,r:1.5+R()*3,rot:R()*TAU,vr:gauss()*10,max:3,col:R()<.5?'#6e675b':'#4a443a'})}
  state.mmDirty=true}
/* ---------- savaş ---------- */
function armorFacing(t,sx,sy){const a=Math.abs(angDiff(Math.atan2(sy-t.y,sx-t.x),t.a));return a<PI/4?t.d.aF:a<PI*.75?t.d.aS:t.d.aR}
function armorFace(t,sx,sy){const a=Math.abs(angDiff(Math.atan2(sy-t.y,sx-t.x),t.a));return a<PI/4?'F':a<PI*.75?'S':'R'}
function eff(w,t,sx,sy){if(t.d.inf)return w.soft??1;const a=armorFacing(t,sx,sy),ap=apAt(w,Math.hypot(t.x-sx,t.y-sy));return ap>=a?1:Math.pow(Math.max(0,ap)/Math.max(a,.01),2)}
function canUse(u,i){const a=u.ammo[i];return a===Infinity||a>=1}
const aaRange=(w,e)=>e.d.heli?w.rLow*(e.alt==='high'?1.25:1):(e.alt==='high'?w.rHigh:w.rLow);
function airHit(w,e){if(e.d.drone)return w.k==='flak'||w.k==='auto'||w.k==='mg'||w.k==='rifle';if(e.d.plane)return w.k==='flak'&&e.alt==='low';if(e.alt==='high')return w.k==='flak'||w.k==='auto';
  return w.k==='rifle'||w.k==='mg'||w.k==='auto'||w.k==='flak'||((w.k==='rpg'||w.k==='gun'||w.k==='atgm')&&!e.moving)}
function pickTarget(u,w,i){if(!canUse(u,i))return null;let best=null,bs=1e9;
  if(w.aaOnly){if(w.needRadar&&!u.radarOn)return null;for(const e of state.units){if(e.side===u.side||!flying(e)||e.hp<=0||!state.vis[u.side].has(e.id))continue;
      const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<=aaRange(w,e)&&d<bs&&!state.proj.some(p=>p.k==='msl'&&p.tgt===e&&p.from===u.id)){bs=d;best=e}}return best}
  for(const e of u.sees){if(e.hp<=0||e.abandoned)continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d>w.r)continue;
    if(w.k==='snipe'&&!e.d.inf)continue;
    if(flying(e)){if(!airHit(w,e))continue;const sc=d*(w.k==='flak'?.4:1.6);if(sc<bs){bs=sc;best=e}continue}
    let s;if(e.d.inf){if(w.anti){if(w.k==='atgm'&&!e.inB)continue;s=d*(e.inB?1:3)}else s=d}
    else{const ef=eff(w,e,u.x,u.y);if(ef<.04)continue;s=d/(ef+.05)}
    if(e===u.lts[i])s*=.6;if(u.focus===e)s=-1;if(s<bs){bs=s;best=e}}return best}
function shooterMod(u,w){let m=1+.07*rank(u);if(u.moving)m*=u.d.inf?(u.mode==='fast'?.3:.5):(u.d.stab||.55);if(!u.d.inf)m*=1-u.sup/220;if(u.d.inf){const st=effStance(u);m*=st==='prone'?(w.proneBonus||1.25):st==='crouch'?1.1:1;m*=1-u.sup/130;if(u.inB||braced(u))m*=1.15}return m}
function muzzle(u){const l=u.d.inf?6:u.d.fixed?shipC(u.d).L*.45:u.key==='tank'?32:u.key==='ifv'?22:20;return[u.x+Math.cos(u.ta)*l,u.y+Math.sin(u.ta)*l]}
function fire(u,i,t,px,py,manual){const w=u.d.w[i];if(!canUse(u,i))return false;if(u.ammo[i]!==Infinity)u.ammo[i]--;
  u.cd[i]=w.rl*(.9+R()*.2)*(1-.06*rank(u))*(u.d.inf?1:1+u.sup/150);u.reveal=w.k==='snipe'?1.2:2.5;u.flash=.08;const [ox,oy]=muzzle(u);if(t){t.shotAtT=state.time;t.lastShot={x:u.x,y:u.y,t:state.time}}
  let hit=false,tx=px,ty=py;
  if(t){const d=Math.hypot(t.x-u.x,t.y-u.y);let p=w.acc*(1-.45*Math.min(1,d/w.r))*shooterMod(u,w)*coverMult(t,u.x,u.y);
    p*=1+.08*Math.min(3,u.stk[i]||0);u.stk[i]=(u.stk[i]||0)+1;
    if(t.vcov&&!flying(t)&&sideOf(t.vcov,u.x,u.y)!==sideOf(t.vcov,t.x,t.y))p*=.6;
    if(!u.d.air&&elevAt(u.x,u.y)>elevAt(t.x,t.y)+.4)p*=1.12;
    if(flying(t))p*=(t.moving?.45:.8)*(w.k==='flak'?1.5:1)*(t.d.drone?.4:1);else if(!t.d.inf)p=Math.min(.95,p*1.35);if(t.moving)p*=.85;if(manual)p*=1.1;hit=R()<p;
    if(hit){tx=t.x;ty=t.y}else{const s=t.d.inf?16:bodyR(t.d)+6;tx=t.x+gauss()*s;ty=t.y+gauss()*s}}
  else{const d=Math.hypot(px-u.x,py-u.y),s=4+d*.02;tx=px+gauss()*s;ty=py+gauss()*s}
  const sp={rifle:1700,mg:1700,snipe:2400,auto:1500,gun:1900,rpg:520,atgm:420,rocket:700,flak:1400}[w.k]||1500;
  state.proj.push({k:w.k,x:ox,y:oy,sx:ox,sy:oy,tx,ty,t:0,T:Math.max(.03,Math.hypot(tx-ox,ty-oy)/sp),w,side:u.side,from:u.id,src:u,tgt:t,hit,ox:u.x,oy:u.y});
  if(w.k==='gun'){puff(ox,oy,4,'rgba(230,220,200,.45)',22);P({k:'flash',x:ox,y:oy,r:6,g:26,max:.1});P({k:'ring',x:ox,y:oy,r:4,g:40,max:.3,a:.35});u.recoil=1}
  if(w.k==='rpg'||w.k==='atgm'||w.k==='rocket')puff(u.x-Math.cos(u.ta)*8,u.y-Math.sin(u.ta)*8,4,'rgba(220,215,200,.5)',14);
  return true}
function fireIndirect(u,tx,ty,shell,mission){const w=u.d.w[0];u.ammo[0][shell]--;u.cd[0]=w.rl*(.9+R()*.2);u.reveal=3;u.flash=.15;u.recoil=1;
  const d=Math.hypot(tx-u.x,ty-u.y);let sig=estSig(u,d,observed(u.side,tx,ty),mission?mission.fired:-1);
  const ix=tx+gauss()*sig,iy=ty+gauss()*sig,TT=w.base+d/w.spd;const [mx,my]=muzzle(u);
  state.proj.push({k:w.k,shell,x:mx,y:my,sx:mx,sy:my,tx:ix,ty:iy,t:0,T:TT,h:Math.min(420,TT*95),w,side:u.side,from:u.id});
  puff(mx,my,u.key==='arty'?10:4,'rgba(220,210,190,.5)',u.key==='arty'?30:14);
  state.cbs.push({det:1-u.side,x:u.x+gauss()*45,y:u.y+gauss()*45,t:10,k:u.key,done:0})}
function estSig(u,d,obs,fired){const w=u.d.w[0];let s=(w.scat+d*(u.key==='arty'?.03:.04))*(obs?.55:1);return s*(fired>=0?Math.max(.4,1-.15*fired):.85)}
function damage(t,w,sx,sy,mult){if(t.hp<=0)return;let d;
  if(flying(t))d=w.dmg*(AIRMUL[w.k]??1);
  else if(t.d.inf)d=w.dmg*(w.soft??1);
  else{const top=w.k==='arty'||w.k==='mortar'||w.k==='gren'||w.top;const f=top?'R':armorFace(t,sx,sy),a=f==='F'?t.d.aF:f==='S'?t.d.aS:t.d.aR;
    let ap=top?w.ap:apAt(w,Math.hypot(t.x-sx,t.y-sy));
    if(w.pen==='heat'&&!top&&t.era&&t.era[f]>=1){t.era[f]--;ap-=6;puff(t.x,t.y,3,'rgba(255,210,150,.7)',10)}
    const pen=ap>=a;d=pen?w.dmg:w.dmg*Math.pow(Math.max(0,ap)/Math.max(a,.01),2);
    if(!pen&&!top&&w.ap>=2&&R()<.8)ricochet(t.x+gauss()*5,t.y+gauss()*5,sx,sy);else if(pen&&w.ap>=8&&!top)P({k:'fire',x:t.x,y:t.y,vz:30,r:5,g:16,max:.45});
    if(w.ap>=8&&!top)t.lastHeavy=state.time;
    if(!t.abandoned){if(pen&&w.ap>=8&&!top&&t.hp-d*mult>0)crit(t);stress(t,pen?35:Math.min(12,w.sup||5))}
    if(pen&&!top&&t.d.crew&&!t.abandoned&&t.hp-d*mult>0&&t.hp-d*mult<t.d.hp*.3&&R()<.35){t.hp-=d*mult;bail(t);return}}
  t.hp-=d*mult;if(t.hp<=0)kill(t)}
function suppress(x,y,rad,amt,side){if(!amt)return;for(const e of state.units){if(e.side===side||flying(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<rad){e.shotAtT=state.time;stress(e,amt*(1-d/rad)*(e.inB?.5:e.cov?.6:1)*(e.d.inf?1:.6))}}}
function splashDmg(x,y,w,side,gren,skip){for(const e of state.units){if(e.side===side||e===skip||e.inB||e.hp<=0||flying(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d>=w.splash)continue;
  const f=1-d/w.splash*.8;if(e.d.inf)damage(e,w,x,y,f*splashCov(e,gren));else if(w.k==='arty'||w.k==='mortar'||w.top)damage(e,w,x,y,f)}}
function kill(t){if(t.dead)return;t.dead=1;t.hp=0;
  {const k=state.curSrc!=null&&state.units.find(x=>x.id===state.curSrc);if(k&&k.side!==t.side&&!t.abandoned){const r0=rank(k);k.xp+=t.val;if(rank(k)>r0&&k.side===0)log(`${k.d.n} terfi etti: ${RANKN[rank(k)]}`,'good')}}
  if(t.sq)for(const m of t.sq.m)if(m!==t&&m.hp>0&&Math.hypot(m.x-t.x,m.y-t.y)<220)stress(m,22);
  if(!t.d.inf&&!flying(t))for(const m of state.units)if(m.side===t.side&&m!==t&&Math.hypot(m.x-t.x,m.y-t.y)<90)stress(m,18);if(t.inB){const b=t.inB;b.occ=b.occ.filter(x=>x!==t);layoutB(b);t.inB=null}
  if(ECON.tickets)state.tickets[t.side]=Math.max(0,state.tickets[t.side]-t.val/6);if(!t.abandoned)addKP(1-t.side,t.val*ECON.killBounty);
  if(t.sq&&!t.sq.ret&&!t.sq.noCard&&!t.sq.m.some(m=>m!==t&&m.hp>0&&!m.gone)){t.sq.ret=1;const ix=SQUADS.findIndex(S=>S.k===t.sq.k);if(ix>=0&&!SQUADS[ix].pre)state.retQ.push({side:t.side,idx:ix,t:state.time+cardCd(SQUADS[ix].cost)})}state.stats.lost[t.side]++;state.stats.kills[1-t.side]++;
  if(t.cargo&&t.cargo.length){const cg=t.cargo,air=flying(t);t.cargo=[];cg.forEach((c,i)=>{c.inHeli=null;const a=i/cg.length*TAU;c.x=t.x+Math.cos(a)*20;c.y=t.y+Math.sin(a)*20;if(air||R()<.5)kill(c);else{state.units.push(c);c.sup=90;c.supT=state.time}})}
  if(t.ab){t.ab.st='lost';t.ab.u=null}
  if(flying(t)){explode(t.x,t.y,1.1);const cx=t.x+Math.cos(t.a)*70,cy=t.y+Math.sin(t.a)*70;state.timers.push({t:state.time+.6,f:()=>{explode(cx,cy,1.4,{dcol:'#3a3a36'});crater(cx,cy,22);addFire(cx,cy,16,25+R()*15,1.1)}});if(t.d.plane)chute(t);
    log(t.side===0?`${t.d.n} düşürüldü`:`Düşman ${t.d.n.toLocaleLowerCase('tr')} düşürüldü`,t.side===0?'bad':'good')}
  else if(t.d.inf){tctx.fillStyle=t.side?'rgba(70,30,26,.75)':'rgba(30,42,52,.75)';tctx.beginPath();tctx.ellipse(t.x,t.y,5,2.5,t.ta,0,TAU);tctx.fill()}
  else{const cat=(t.key==='tank'&&R()<.45)||(t.key==='ifv'&&R()<.35)||R()<.15,mk={x:t.x,y:t.y,a:t.a,ta:t.ta,key:t.key,noTur:false};
    explode(t.x,t.y,cat?2:1.3,{dcol:'#26241f'});scorch(t.x,t.y,cat?44:34);
    if(cat&&(t.key==='tank'||t.key==='ifv'||t.key==='shorad')){mk.noTur=true;P({k:'turret',x:t.x,y:t.y,z:6,vx:gauss()*70,vy:gauss()*70,vz:260+R()*130,rot:t.ta,vr:gauss()*6,r:0,g:0,max:8})}
    for(let i=0;i<(cat?7:2);i++)state.timers.push({t:state.time+.3+R()*(cat?3.5:2),f:()=>{explode(t.x+gauss()*8,t.y+gauss()*8,.32);if(R()<.5)P({k:'spark',x:t.x,y:t.y,z:8,vx:gauss()*160,vy:gauss()*160,vz:200+R()*200,max:.7})}});
    if(t.d.naval){puff(t.x,t.y,8,'rgba(225,235,235,.6)',26)}else{if(t.d.veh||t.d.heli){state.marks.push(mk);addFire(t.x,t.y,12,(cat?45:25)+R()*20,cat?1.3:.9)}state.covers.push({t:'wreck',x:t.x,y:t.y,r:15})}
    log(t.side===0?`${t.d.n} kaybedildi`:`Düşman ${t.d.n.toLocaleLowerCase('tr')} imha edildi`,t.side===0?'bad':'good')}
  if(t.sq&&t.d.inf&&!t.sq.m.some(u=>u!==t&&u.hp>0))log(t.side===0?`${t.sq.n} yok edildi`:`Düşman ${t.sq.n.toLocaleLowerCase('tr')} yok edildi`,t.side===0?'bad':'good');
  if(state.dc===t){state.dc=null;updTip()}}
function fireMissile(u,w,t,sx,sy){state.proj.push({k:'msl',mk:w.k,x:sx,y:sy,ax:t.x,ay:t.y,a:Math.atan2(t.y-sy,t.x-sx),tgt:t,sp:w.msp,w,side:u.side,from:u.id,life:7});u.reveal=3;
  if(w.k==='arm'){if(t.side===0&&(!t.armWarn||state.time-t.armWarn>5)){t.armWarn=state.time;log(`${t.d.n}: anti-radyasyon füzesi geliyor, radarı kapat (Y)`,'bad')}
    if(t.side===1&&R()<.7){t.radarOn=false;t.radarT=0;t.radarOffT=9}}}
function launchAA(u,i,t){const w=u.d.w[i];u.ammo[i]--;u.cd[i]=w.rl*(.9+R()*.2);fireMissile(u,w,t,u.x,u.y);puff(u.x,u.y,3,'rgba(220,215,200,.5)',12)}
function updFires(dt){for(let i=state.fires.length-1;i>=0;i--){const f=state.fires[i];f.t-=dt;if(f.t<=0){state.fires.splice(i,1);continue}const k=Math.min(1,f.t/8)*f.int;
  if(R()<dt*14*k)P({k:'fire',x:f.x+gauss()*f.r*.4,y:f.y+gauss()*f.r*.4,vx:wind.x*.3+gauss()*4,vy:wind.y*.3+gauss()*4,vz:25+R()*30,r:4+R()*5*k,g:12*k+4,max:.5+R()*.4,a:.95});
  if(R()<dt*4*k)P({k:'smoke',x:f.x+gauss()*f.r*.3,y:f.y+gauss()*f.r*.3,z:10,vx:wind.x*.5,vy:wind.y*.5,vz:30+R()*20,r:8,g:36+R()*34,max:6+R()*4,a:.55});
  if(R()<dt*1.5*k)P({k:'ember',x:f.x,y:f.y,z:8,vx:wind.x+gauss()*14,vy:wind.y+gauss()*14,vz:50+R()*60,r:1.2,g:1,max:1.4,col:'rgba(255,170,70,.95)'})}
  for(const b of state.buildings){if(!(b.burn>0)||b.dead)continue;b.burn-=dt;state.curSrc=null;hurtB(b,b.max*.012*dt);if(b.dead)continue;
    if(R()<dt*(6+b.w*b.h/300))P({k:'fire',x:b.x+R()*b.w,y:b.y+R()*b.h,vx:wind.x*.3,vy:wind.y*.3,vz:25+R()*30,r:5,g:14+R()*8,max:.6+R()*.4});
    if(R()<dt*3)P({k:'smoke',x:b.x+R()*b.w,y:b.y+R()*b.h,z:14,vx:wind.x*.5,vy:wind.y*.5,vz:30+R()*20,r:12,g:50+R()*40,max:7+R()*4,a:.55});
    for(const o of [...b.occ]){stress(o,15*dt);if(R()<dt*.6)damage(o,{dmg:4,ap:0,k:'fire',soft:1},o.x,o.y,1);if(o.hp>0&&R()<dt*.5)exitBld(o,o.x+(o.side?40:-40),o.y)}
    if(R()<dt*.05)for(const n of state.buildings)if(n!==b&&!n.dead&&!(n.burn>0)&&n.x<b.x+b.w+24&&n.x+n.w+24>b.x&&n.y<b.y+b.h+24&&n.y+n.h+24>b.y){igniteB(n);break}
    if(b.burn<=0)charB(b)}}
function inRange(u,e){const w=u.d.w[0];if(!w)return false;const d=Math.hypot(e.x-u.x,e.y-u.y);return d<=w.r*.95&&(e.d.inf?!(w.k==='atgm'&&!e.inB):eff(w,e,u.x,u.y)>.04)}
function throwGren(u,e){u.gren--;u.gcd=5;u.reveal=2;const tx=e.x+gauss()*8,ty=e.y+gauss()*8;state.proj.push({k:'gren',x:u.x,y:u.y,sx:u.x,sy:u.y,tx,ty,t:0,T:.9,h:30,side:u.side,from:u.id,tgtB:e.inB,w:GREN})}

export {canUse,damage,estSig,fire,fireIndirect,fireMissile,hurtB,inRange,kill,launchAA,muzzle,panic,pickTarget,splashDmg,stress,suppress,throwGren,updFires};
