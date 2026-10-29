/* systems/units.js — Birlik ve manga oluşturma, takviye çağırma ve gelişi, nakliyeden indirme, temel hareket emri. */
import {state} from '../state.js';
import {DEF,H,PI,RIV,SQUADS,TAU,W,riverX} from '../config.js';
import {log} from '../ui/feedback.js';
import {R,angDiff,clamp,gauss} from '../utils/helpers.js';
import {exitBld} from '../world/buildings.js';
import {isWater} from '../world/terrain.js';

const flying=u=>u.d.air&&u.alt!=='landed';
const rank=u=>u.xp>=600?3:u.xp>=280?2:u.xp>=100?1:0;
function setFM(u,fm){u.fm=fm;u.hold=fm==='hold'}
function mkUnit(side,key,x,y,sq,val){const d=DEF[key];const u={id:state.uid++,side,key,d,sq,val,x,y,a:side?PI:0,ta:side?PI:0,hp:d.hp,
  cd:d.w.map(()=>R()*.8),ammo:d.w.map(w=>typeof w.ammo==='object'?{...w.ammo}:(w.ammo??Infinity)),
  dest:null,mode:'move',focus:null,sel:false,reveal:0,moving:false,stM:null,sup:0,supT:-9,cov:null,inB:null,enterB:null,dig:-1,
  st:d.indirect?'travel':null,stT:0,mission:null,auto:true,shell:'he',hold:false,trk:0,tur:0,smokeL:d.smokeL||0,gren:d.gren||0,gcd:0,
  sees:[],flash:0,recoil:0,pickT:0,autoTgt:null,smT:0,crush:false,wantDeploy:false,
  alt:d.air?(d.plane?'high':'low'):null,altT:0,flares:d.flares||0,fuel:d.fuel||0,pay:d.pay?{...d.pay}:{},burn:false,run:null,strikes:[],chase:null,rtb:false,
  cargo:d.cap?[]:null,inHeli:null,board:null,landReq:false,unloadReq:false,wantUp:false,radarOn:false,radarT:d.radar?5:0,radarOffT:0,aaCd:0,
  runType:d.pay?(d.pay.gun!=null?'gun':d.pay.carpet!=null?'carpet':null):null,loiter:null,
  fm:'free',xp:0,stunT:0,panicT:0,shotAtT:-99,queue:[],aps:d.aps||0,apsCd:0,era:d.era?{...d.era}:null,opt:0,eng:false,fire:0,lts:[],sol:[],stk:[],abandoned:false,vcov:null,crewTo:null,veh:null};
  state.units.push(u);return u}
function spawnSquad(side,idx,cx,cy,dx,dy){const S=SQUADS[idx],sq={id:state.sqid++,side,k:S.k,n:S.n,m:[],orderT:0,obj:null,dug:0};state.squads.set(sq.id,sq);
  const val=S.cost/S.m.length;S.m.forEach((k,i)=>{const off=(i-(S.m.length-1)/2)*16;const u=mkUnit(side,k,cx+(side?1:-1)*(i%2)*12,cy+off,sq,val);
    if(dx!=null)u.dest={x:dx+(R()-.5)*16,y:dy+off};sq.m.push(u)});return sq}
function deploy(side,idx){const S=SQUADS[idx];if(!S||state.money[side]<S.cost||state.avail[side][idx]<1)return false;state.money[side]-=S.cost;state.avail[side][idx]--;
  if(S.plane){state.airbase[side].push({id:state.abid++,key:S.plane,side,st:'prep',t:10,u:null});if(side===0)log(`${S.n} hava üssüne ulaştı, hazırlanıyor`,'good');return true}
  state.pending[side].push({idx,t:S.eta});if(side===0)log(`${S.n} çağrıldı, ${S.eta} sn içinde cephede`,'');return true}
function arrive(side,idx){const S=SQUADS[idx];
  const lane=[700,1500,2300][R()*3|0]+gauss()*80;const sq=spawnSquad(side,idx,side?W+30:-30,lane,side?W-200-R()*40:200+R()*40,lane);
  if(S.k==='heliT'||S.k==='mech'){const h=sq.m[0],cs=spawnSquad(side,0,h.x,h.y);for(const c of cs.m){c.inHeli=h;h.cargo.push(c)}state.units=state.units.filter(u=>!u.inHeli)}
  if(side===0)log(`${S.n} cepheye ulaştı`,'good');return true}
const inBase=u=>u.side?u.x>W-230:u.x<230;
function unloadHeli(h){const n=h.cargo.length;h.cargo.forEach((c,i)=>{const a=i/n*TAU;c.x=h.x+Math.cos(a)*24;c.y=h.y+Math.sin(a)*24;c.inHeli=null;c.dest=null;c.a=c.ta=a;state.units.push(c)});
  if(n&&h.side===0)log(`${h.d.n}: ${n} asker indirildi`,'good');h.cargo=[];h.unloadReq=false}
function turnTurret(u,want,dt){if(u.d.inf){u.ta+=clamp(angDiff(want,u.ta),-8*dt,8*dt);return}if(u.tur>0)return;const ts=(u.d.ts||u.d.trav||1)*dt;u.ta+=clamp(angDiff(want,u.ta),-ts,ts)}
function giveMove(u,x,y,mode){if(u.panicT>0)return;u.exfil=false;u.amv=false;u.ordT=state.time;u.faceA=null;if(!u.d.air&&isWater(x,y)){const sd=Math.sign(u.x-riverX(y))||1;x=riverX(y)+sd*(RIV.hw+24)}u.queue=[];u.crewTo=null;u.board=null;if(u.inB)exitBld(u,x,y);u.dest={x:clamp(x,8,W-8),y:clamp(y,8,H-8)};u.anchor={x:u.dest.x,y:u.dest.y};u.mode=mode;u.focus=null;u.enterB=null;u.dig=-1;if(u.d.indirect)u.mission=null}

export {arrive,deploy,flying,giveMove,inBase,mkUnit,rank,setFM,spawnSquad,turnTurret,unloadHeli};
