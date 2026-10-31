/* ui/army-builder.js — Savaş öncesi ordu kurma ekranı: taraflar, kategoriler, birlik ayrıntısı, ordu puanı ve seçili ordu paneli. */
import {state} from '../state.js';
import {ARMY,ARMYCAT,AW,DEF,PAYN,ROLE,SQUADS} from '../config.js';
import {tr} from '../i18n.js';
import {DEFAULT_ARMY,addBlock,armyCap,autoArmy,checkArmy,countOf,sqOf} from '../systems/army.js';
import {startMatch} from '../game.js';
import {drawSquadArt} from './deck.js';
import {enterDeploy} from './deploy.js';
import {$} from '../utils/helpers.js';

/* son kurulan ordu bu tarayıcıda hatırlanır (yalnızca kolaylık; okunamazsa önerilen orduyla açılır) */
const STORE='cephe-hatti.ordu';
/* sandbox modunda ordu bütçesi sınırsız */
const bud=()=>state.sandbox?Infinity:ab.budget;
const ab={list:null,budget:ARMY.def,cat:ARMYCAT[0].k,pick:ARMYCAT[0].m[0],name:ARMY.name,msg:null,msgT:0};
const catOf=k=>ARMYCAT.find(c=>c.m.includes(k));
let built=false;
function load(){let s=null;try{s=JSON.parse(localStorage.getItem(STORE)||'null')}catch(e){}
  if(s&&ARMY.budgets.includes(s.budget))ab.budget=s.budget;if(s&&typeof s.name==='string'&&s.name.trim())ab.name=s.name.slice(0,24);
  ab.list=[];for(const k of (s&&Array.isArray(s.list)?s.list:DEFAULT_ARMY))if(sqOf(k)&&countOf(ab.list,k)<armyCap(k))ab.list.push(k)}
function save(){try{localStorage.setItem(STORE,JSON.stringify({budget:ab.budget,list:ab.list,name:ab.name}))}catch(e){}}
/* ---------- birlik bilgisi ---------- */
function members(S){const c={};for(const k of S.plane?[S.plane]:S.m)c[k]=(c[k]||0)+1;return{c,cargo:S.k==='mech'||S.k==='heliT'?SQUADS[0]:null}}
function stats(S){const {c}=members(S),ks=Object.keys(c),d=DEF[ks[0]],n=ks.reduce((a,k)=>a+c[k],0),s=[];
  if(d.inf&&n>1)s.push(['Asker',n],['Toplam sağlamlık',ks.reduce((a,k)=>a+DEF[k].hp*c[k],0)]);else s.push(['Sağlamlık',d.hp]);
  s.push(['Hız',d.sp]);s.push(['Görüş',d.plane&&!d.gvis?'Yeri görmez':`${d.vis} m`]);
  if(d.veh&&d.aF!=null)s.push(['Zırh Ö / Y / A',`${d.aF} / ${d.aS} / ${d.aR}`]);
  if(d.aps)s.push(['Aktif koruma',`${d.aps} atım`]);if(d.era)s.push(['Reaktif zırh',`Ön ${d.era.F} · Yan ${d.era.S}`]);
  if(d.cap)s.push(['Taşıma',`${d.cap} asker`]);if(d.fuel)s.push(['Yakıt',`${d.fuel} sn`]);if(d.bat)s.push(['Batarya',`${d.bat} sn`]);
  if(d.flares)s.push(['Fişek',d.flares]);if(d.smokeL)s.push(['Sis perdesi',d.smokeL]);if(d.stealth)s.push(['Gizlenme','Yüksek']);
  if(d.indirect)s.push(['Mevzilenme',`${d.setupT} sn`]);if(d.radar)s.push(['Radar','Var · iz bırakır']);if(d.supply)s.push(['İkmal','130 m']);
  return s}
function weapons(S){const rows=[],seen=new Set(),{c}=members(S);
  for(const k of Object.keys(c)){const d=DEF[k];
    for(const w of d.w){if(seen.has(w.n))continue;seen.add(w.n);
      rows.push([w.n,w.r??`${w.rLow}${w.rHigh?' / '+w.rHigh:''}`,w.dmg,w.ap??'—',w.ammo==null?'∞':typeof w.ammo==='object'?`T ${w.ammo.he} · S ${w.ammo.smoke}`:w.ammo])}
    for(const [p,v] of Object.entries(d.pay||{})){const a=AW[p];rows.push([PAYN[p],a.range??'—',a.dmg,a.ap??'—',`×${v}`])}
    if(d.fpv&&!seen.has('fpv')){seen.add('fpv');rows.push([AW.fpv.n,460,AW.fpv.dmg,AW.fpv.ap,'1 / dron'])}}
  return rows}
/* ---------- çizim ---------- */
function build(){if(built)return;built=true;
  $('armyBudget').innerHTML=tr(ARMY.budgets.map(b=>`<button type="button" class="btn" data-b="${b}">${ARMY.bn[b]} <b>${b}</b></button>`).join(''));
  $('armyCats').innerHTML=tr(ARMYCAT.map(c=>`<button type="button" class="ab-cat" data-tab="${c.k}"><span>${c.n}</span><small></small></button>`).join(''));
  const g=$('armyCards');
  for(const c of ARMYCAT)for(const k of c.m){const S=sqOf(k),el=document.createElement('div');el.className='ab-card';el.dataset.k=k;el.dataset.cat=c.k;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',tr(`${S.n}, ${S.cost} OP`));
    el.innerHTML=tr(`<span class="ab-cnt"></span><span class="ab-cost">${S.cost}</span><div class="ab-art"><canvas width="148" height="80"></canvas></div><b class="ab-nm">${S.n}</b><span class="ab-role">${ROLE[k]}</span>`+
      `<div class="ab-ctl"><button type="button" class="btn" data-rem="${k}" aria-label="Bir ${S.n} çıkar">−</button><button type="button" class="btn" data-add="${k}" aria-label="Bir ${S.n} ekle">+</button></div>`);
    const cx=el.querySelector('canvas').getContext('2d');cx.setTransform(2,0,0,2,0,0);drawSquadArt(cx,S);g.appendChild(el)}}
function renderInfo(){const k=ab.pick,S=sqOf(k),cat=catOf(k),{c,cargo}=members(S),n=countOf(ab.list,k),blk=addBlock(ab.list,k,bud()),w=weapons(S);
  const comp=Object.entries(c).map(([u,q])=>`${q}× ${DEF[u].n}`).join(' · ')+(cargo?` · içinde ${cargo.n}`:'');
  const el=$('armyInfo');
  el.innerHTML=tr(`<div class="ab-ih"><div><small>${cat.n.toLocaleUpperCase('tr')}</small><h2>${S.n}</h2></div><b>${S.cost}<small> OP</small></b></div>`+
    `<p class="ab-rl">${ROLE[k]}</p><div class="ab-prev"><canvas width="296" height="160"></canvas></div><p class="ab-comp">${comp}</p>`+
    `<div class="ab-stats">${stats(S).map(([l,v])=>`<div><small>${l}</small><b>${v}</b></div>`).join('')}</div>`+
    (w.length?`<table class="ab-wt"><thead><tr><th>Silah</th><th>Menzil</th><th>Hasar</th><th>Delme</th><th>Cephane</th></tr></thead><tbody>${w.map(r=>`<tr>${r.map((x,i)=>i?`<td>${x}</td>`:`<th>${x}</th>`).join('')}</tr>`).join('')}</tbody></table>`:'<p class="muted ab-now">Silahsız birlik</p>')+
    `<div class="ab-iadd"><span>Orduda <b>×${n}</b> · en fazla ${armyCap(k)}</span><button type="button" class="btn" data-rem="${k}"${n?'':' disabled'}>Çıkar</button><button type="button" class="btn on" data-add="${k}"${blk?` disabled title="${blk}"`:''}>Orduya ekle</button></div>`+(blk?`<p class="ab-blk">${blk}</p>`:''));
  const cx=el.querySelector('canvas').getContext('2d');cx.setTransform(4,0,0,4,0,0);drawSquadArt(cx,S)}
function renderList(){const rows=[];
  for(const cat of ARMYCAT){const ks=cat.m.filter(k=>countOf(ab.list,k));if(!ks.length)continue;rows.push(`<div class="ab-lh">${cat.n}</div>`);
    for(const k of ks){const S=sqOf(k),q=countOf(ab.list,k);
      rows.push(`<div class="ab-row${k===ab.pick?' sel':''}" data-k="${k}"><span class="nm">${S.n}</span><span class="q">×${q}</span><span class="c">${S.cost*q}</span>`+
        `<button type="button" class="btn" data-rem="${k}" aria-label="Bir ${S.n} çıkar">−</button><button type="button" class="btn" data-add="${k}" aria-label="Bir ${S.n} ekle"${addBlock(ab.list,k,bud())?' disabled':''}>+</button></div>`)}}
  $('armyRows').innerHTML=tr(rows.length?rows.join(''):'<p class="ab-empty">Henüz birlik seçilmedi.<br>Kategorilerden birlik ekle veya otomatik doldur.</p>')}
function update(){const chk=checkArmy(ab.list,bud()),left=bud()-chk.cost,cat=ARMYCAT.find(c=>c.k===ab.cat);
  $('armyPts').textContent=tr(`${chk.cost} / ${state.sandbox?'∞':ab.budget}`);$('armyBar').style.width=Math.min(100,chk.cost/bud()*100)+'%';$('armyBudget').hidden=state.sandbox;$('armyTot').classList.toggle('over',chk.cost>ab.budget);
  $('armyUsed').textContent=tr(`${chk.cost} OP`);$('armyLeft').textContent=tr(`${left} OP`);$('armyLeft').classList.toggle('warn',left<0);$('armyN').textContent=tr(`${ab.list.length} birlik`);
  for(const b of $('armyBudget').children)b.classList.toggle('on',+b.dataset.b===ab.budget);
  for(const b of $('armyCats').children){const c=ARMYCAT.find(x=>x.k===b.dataset.tab),q=ab.list.filter(k=>c.m.includes(k)).length;b.classList.toggle('on',c===cat);b.querySelector('small').textContent=tr(q?`×${q}`:'')}
  $('armyCatT').textContent=tr(cat.n);$('armyCatS').textContent=tr(`${cat.m.length} birlik türü · çift tıkla veya + ile ekle`);
  for(const el of $('armyCards').children){const k=el.dataset.k,q=countOf(ab.list,k),blk=addBlock(ab.list,k,bud()),ad=el.querySelector('[data-add]');
    el.hidden=el.dataset.cat!==ab.cat;el.classList.toggle('in',q>0);el.classList.toggle('sel',k===ab.pick);el.classList.toggle('na',!!blk&&!q);
    el.querySelector('.ab-cnt').textContent=tr(q?`×${q}`:'');el.querySelector('[data-rem]').disabled=!q;ad.disabled=!!blk;ad.title=tr(blk||'Orduya ekle')}
  renderInfo();renderList();
  const m=$('armyMsg'),flash=ab.msg&&performance.now()-ab.msgT<3500;m.textContent=tr(flash?ab.msg:chk.ok?`Hazır · ${left} OP kullanılmadı`:chk.err[0]);m.className=flash||!chk.ok?'warn':'ok';
  $('armyGo').disabled=!chk.ok;save()}
/* ---------- eylemler ---------- */
function add(k){const blk=addBlock(ab.list,k,bud());ab.pick=k;if(blk){ab.msg=blk;ab.msgT=performance.now();setTimeout(update,3600)}else{ab.list.push(k);ab.msg=null}update()}
function rem(k){const i=ab.list.lastIndexOf(k);if(i>=0)ab.list.splice(i,1);ab.pick=k;ab.msg=null;update()}
function pick(k){ab.pick=k;ab.cat=catOf(k).k;update()}
function pickCat(c){ab.cat=c;const cat=ARMYCAT.find(x=>x.k===c);if(!cat.m.includes(ab.pick))ab.pick=cat.m[0];update()}
function back(){$('army').hidden=true;$('ov').hidden=false}
/* doğrulanan oyuncu ordusu ve aynı bütçeyle kurulan YZ ordusu mevcut başlatma akışına verilir; savaş konuşlanma onayıyla başlar */
function go(){const chk=checkArmy(ab.list,bud());if(!chk.ok){update();return}
  const mine=ab.list.slice(),foe=autoArmy(ab.budget);$('army').hidden=true;startMatch({armies:[mine,foe],deploy:true});
  enterDeploy({name:ab.name,cost:chk.cost,back:openArmy})}
function openArmy(){if(!ab.list)load();build();$('armyName').value=ab.name;$('ov').hidden=true;$('army').hidden=false;update()}

/* olay dinleyicileri: main.js tarafından başlatılır */
export function initArmy(){
$('armyBack').addEventListener('click',back);
$('armyGo').addEventListener('click',go);
$('armyClr').addEventListener('click',()=>{ab.list=[];ab.msg=null;update()});
$('armyAuto').addEventListener('click',()=>{ab.list=autoArmy(ab.budget);ab.msg=null;update()});
$('armyName').addEventListener('input',e=>{ab.name=e.target.value.trim().slice(0,24)||ARMY.name;save()});
$('army').addEventListener('click',e=>{const a=e.target.closest('[data-add]'),r=e.target.closest('[data-rem]');if(a){add(a.dataset.add);return}if(r){rem(r.dataset.rem);return}
  const t=e.target.closest('[data-tab]');if(t){pickCat(t.dataset.tab);return}
  const b=e.target.closest('[data-b]');if(b){ab.budget=+b.dataset.b;ab.msg=null;update();return}
  const k=e.target.closest('[data-k]');if(k)pick(k.dataset.k)});
$('army').addEventListener('dblclick',e=>{const c=e.target.closest('.ab-card');if(c&&!e.target.closest('button'))add(c.dataset.k)});
$('army').addEventListener('keydown',e=>{if($('army').hidden)return;if(e.key==='Escape'){back();return}
  const c=e.target.closest&&e.target.closest('.ab-card');if(c&&e.target===c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();add(c.dataset.k)}});
}

export {openArmy};
