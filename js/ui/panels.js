/* ui/panels.js — Seçim paneli: birlik bilgisi ve emir düğmeleri. */
import {state} from '../state.js';
import {COVN,FINE,FMN,FORMN,INITN,PAYN,RANKN,STATEN,STN} from '../config.js';
import {leash} from '../systems/initiative.js';
import {altSel,autoSel,burnSel,dcToggle,deploySel,digSel,exfilSel,exitSel,holdSel,landSel,radarSel,rtbSel,setArm,setFastArm,setFormSel,setInitSel,setMissionArm,setPrecArm,setRunArm,shellSel,smokeSel,stanceSel,stopSel,unloadSel,wpnSel} from '../systems/orders.js';
import {rank} from '../systems/units.js';
import {effStance} from '../world/cover.js';

const fmtA=(w,a)=>typeof a==='object'?`TAH ${Math.floor(a.he)} · SİS ${Math.floor(a.smoke)}`:a===Infinity?'∞':`${Math.floor(a)} / ${w.ammo}`;
function selInfo(s){
  if(!s.length)return'<h3 class="muted">Seçili birlik yok</h3><div class="row"><span>Sol tık, sürükle veya çift tık (manga)</span></div>';
  if(s.length>1){const c={};for(const u of s)c[u.d.n]=(c[u.d.n]||0)+1;const sup=s.filter(u=>u.d.inf&&u.sup>65).length;
    return `<h3>${s.length} birlik seçili</h3>`+Object.entries(c).map(([n,k])=>`<div class="row"><span>${n}</span><b>×${k}</b></div>`).join('')+(sup?`<div class="row"><span>Baskı altında</span><b class="warn">${sup}</b></div>`:'')}
  const u=s[0];let h=`<h3>${u.d.n}</h3>`;
  if(u.sq&&u.sq.m.length>1)h+=`<div class="sub">${u.sq.n} · ${u.sq.m.filter(x=>x.hp>0).length}/${u.sq.m.length} ayakta</div>`;
  h+=`<div class="row"><span>Sağlamlık</span><b>${Math.ceil(u.hp)} / ${u.d.hp}</b></div><div class="mbar"><i style="width:${u.hp/u.d.hp*100}%"></i></div>`;
  if(!u.d.plane){const mor=u.panicT>0?'Panik, geri çekiliyor':u.stunT>0?'Sersemledi':u.sup>=90?'Kırılma eşiğinde':u.sup>65?(u.d.inf?'Yere yapıştı':'Mürettebat sarsıldı'):u.sup>30?'Baskı altında':'Sakin';
    h+=`<div class="row"><span>Moral</span><b class="${u.sup>65||u.panicT>0?'warn':''}">${mor}</b></div><div class="mbar sup"><i style="width:${u.sup}%"></i></div>`;
    h+=`<div class="row"><span>Rütbe</span><b>${RANKN[rank(u)]} · ${Math.round(u.xp)} TP</b></div><div class="row"><span>Atış modu</span><b>${FMN[u.fm]}</b></div>`;
    h+=`<div class="row"><span>İnisiyatif</span><b>${INITN[u.init||'on']}${(u.init||'on')!=='off'?` · ${Math.round(leash(u))} m alan`:''}</b></div>`;if(u.th&&state.time-u.th.t<12)h+=`<div class="row"><span>Son karar</span><b>${u.th.s}</b></div>`}
  if(u.d.radar)h+=`<div class="row"><span>Radar</span><b class="${u.radarOn?'warn':''}">${u.radarOn?'Açık (iz bırakıyor)':u.radarT>0?`Açılıyor ${Math.ceil(u.radarT)} sn`:'Kapalı'}</b></div>`;
  if(u.d.inf){h+=`<div class="row"><span>Duruş</span><b>${STN[effStance(u)]}${u.stM?'':' (oto)'}</b></div>`;
    h+=`<div class="row"><span>Siper</span><b>${u.inB?`Bina (${u.inB.occ.length}/${u.inB.cap})`:u.cov?COVN[u.cov.t]:u.dig>=0?`Kazıyor %${Math.round(u.dig*100)}`:'Açıkta'}</b></div>`;
    const cd=u.inB?'Her yönden %70':!u.cov?'Yok':u.cov.t==='trench'?'Her yönden %70, hat boyunca %15':u.cov.t==='fox'?'Her yönden %67':u.cov.t==='hedge'?'Önden %35, gizlenme':u.cov.r!=null?'Her yönden %50':'Önden %70, yandan yok';
    h+=`<div class="row"><span>İsabet koruması</span><b>${cd}</b></div>`;
}
  if(u.d.plane&&u.d.gvis)h+=`<div class="row"><span>Yer gözetlemesi</span><b>${u.d.vis} m${u.d.uav?' · hedefleri kendisi bulur':''}</b></div>`;
  if(u.d.plane){h+=`<div class="row"><span>Durum</span><b>${u.rtb?'Üsse dönüyor':u.run?(u.run.ph==='app'?'Koşuya yaklaşıyor':'Saldırı koşusunda'):u.strikes.length?`Hassas vuruş: ${u.strikes.length} hedef`:u.chase?'Hedef takibinde':'Devriyede'}</b></div>`;
    h+=`<div class="row"><span>İrtifa</span><b>${u.alt==='high'?'Yüksek':'Alçak'}</b></div><div class="row"><span>Yakıt</span><b class="${u.fuel<u.d.fuel*.25?'warn':''}">%${Math.round(u.fuel/u.d.fuel*100)}${u.burn?' · art yakıcı':''}</b></div><div class="mbar"><i style="width:${u.fuel/u.d.fuel*100}%;background:var(--amber)"></i></div>`;
    h+=`<div class="row"><span>Fişek</span><b>${Math.floor(u.flares)}</b></div>`;for(const k in u.pay)h+=`<div class="row"><span>${PAYN[k]}</span><b>${Math.floor(u.pay[k])} / ${u.d.pay[k]}</b></div>`;
    if(u.d.pay.gun!=null)h+=`<div class="row"><span>Koşu silahı</span><b>${u.runType==='rockets'?'Roket':'30 mm top'}</b></div>`;return h}
  if(u.d.drone){h+=`<div class="row"><span>Batarya</span><b class="${u.bat<u.d.bat*.25?'warn':''}">%${Math.round((u.bat??u.d.bat)/u.d.bat*100)}${u.home?' · üsse dönüyor':''}</b></div><div class="mbar"><i style="width:${(u.bat??u.d.bat)/u.d.bat*100}%;background:var(--amber)"></i></div>`;if(u.d.fpv)h+=`<div class="row"><span>Hedef</span><b>${u.kTgt?u.kTgt.d.n:'Arıyor (460 m)'}</b></div>`;return h}
  if(u.d.heli){h+=`<div class="row"><span>İrtifa</span><b>${u.altT>0?(u.altTo==='landed'?'İniyor':'Kalkıyor'):u.alt==='high'?'Yüksek':u.alt==='landed'?'Yerde':'Alçak (ağaç hizası)'}</b></div><div class="row"><span>Fişek</span><b>${Math.floor(u.flares)}</b></div>`;
    if(u.d.cap)h+=`<div class="row"><span>Yük</span><b>${u.cargo.length} / ${u.d.cap} asker</b></div>`}
  else if(u.d.inf);
  else{if(u.d.aF>1)h+=`<div class="row"><span>Zırh ön / yan / arka</span><b>${u.d.aF} / ${u.d.aS} / ${u.d.aR}</b></div>`;
    if(u.d.aps)h+=`<div class="row"><span>Aktif koruma (APS)</span><b>${Math.floor(u.aps)} / ${u.d.aps}${u.apsCd>0?' · dolduruluyor':''}</b></div>`;
    if(u.era)h+=`<div class="row"><span>Reaktif zırh ön / yan</span><b>${Math.floor(u.era.F)} / ${Math.floor(u.era.S)}</b></div>`;
    if(u.vcov)h+=`<div class="row"><span>Gövde siperi</span><b>${COVN[u.vcov.t]} arkasında</b></div>`;
    if(u.d.cap)h+=`<div class="row"><span>Yük</span><b>${u.cargo.length} / ${u.d.cap} asker</b></div>`;
    const dm=[];if(u.trk>0)dm.push(`Palet ${Math.ceil(u.trk)} sn`);if(u.tur>0)dm.push(`Taret ${Math.ceil(u.tur)} sn`);if(u.opt>0)dm.push('Optik');if(u.eng)dm.push('Motor');if(u.fire>0)dm.push('Yangın');h+=`<div class="row"><span>Hasar</span><b class="${dm.length?'warn':''}">${dm.join(' · ')||'Yok'}</b></div>`;
    if(u.d.smokeL)h+=`<div class="row"><span>Sis perdesi</span><b>${Math.floor(u.smokeL)}</b></div>`;
    if(u.d.supply)h+=`<div class="row"><span>İkmal</span><b>130 m içindeki dostlara</b></div>`}
  if(u.d.indirect){h+=`<div class="row"><span>Durum</span><b>${STATEN[u.st]}</b></div><div class="row"><span>Seçili mermi</span><b>${u.shell==='he'?'Tahrip':'Sis'}</b></div>`;
    h+=`<div class="row"><span>Görev</span><b>${u.mission?`${u.mission.n} atım kaldı`:u.auto?'Serbest atış':'Bekliyor'}</b></div>`}
  u.d.w.forEach((w,i)=>{h+=`<div class="row"><span>${w.n} · ${w.r||(w.rLow+(w.rHigh?' / '+w.rHigh:''))} m</span><b>${fmtA(w,u.ammo[i])}</b></div>`});
  if(u.d.gren)h+=`<div class="row"><span>El bombası</span><b>${Math.floor(u.gren)}</b></div>`;
  return h}
const btn=(a,l,k,on)=>`<button class="btn${on?' on':''}" data-a="${a}" type="button">${l}${k?`<kbd>${k}</kbd>`:''}</button>`;
const grpH=(n,b)=>`<div class="grp"><span>${n}</span><div class="btns">${b.join('')}</div></div>`;
function selButtons(s){if(!s.length)return'';const any=f=>s.some(f),all=f=>s.every(f);let h='';
  const em=[btn('atk','Saldırı','⇧A',state.attackArm),btn('fast','Hızlı','⇧D',state.fastArm),btn('stop','Dur','⇧S'),btn('exfil','Cepheden çek','M'),btn('hold',all(u=>u.fm===s[0].fm)?FMN[s[0].fm]:'Atış modu','H',s[0].fm!=='free')];
  if(s.some(u=>!u.d.air))em.push(btn('form',`Dizilim: ${all(u=>(u.form||'auto')===(s[0].form||'auto'))?FORMN[s[0].form||'auto']:'karışık'}`,'⇧W',(s[0].form||'auto')!=='auto'));
  if(s.some(u=>!u.d.plane))em.push(btn('init',`İnisiyatif: ${all(u=>(u.init||'on')===(s[0].init||'on'))?INITN[s[0].init||'on']:'karışık'}`,'',(s[0].init||'on')!=='off'));if(s.length===1&&FINE&&!s[0].d.air)em.push(btn('dc','Doğrudan','V',state.dc===s[0]));h+=grpH('EMİR',em);
  const inf=s.filter(u=>u.d.inf);if(inf.length){const st=v=>inf.every(u=>u.stM===v);
    const b=[btn('st-stand','Ayakta','Z',st('stand')),btn('st-crouch','Çömel','X',st('crouch')),btn('st-prone','Yat','C',st('prone')),btn('st-auto','Oto','B',st(null)),btn('dig','Siper kaz','K')];
    if(inf.some(u=>u.inB))b.push(btn('exit','Binadan çık','E'));h+=grpH('PİYADE',b)}
  const ind=s.filter(u=>u.d.indirect);if(ind.length){const dep=ind.some(u=>u.st==='deployed'||u.st==='deploying');
    h+=grpH('TOPÇU',[btn('deploy',dep?'Toparlan':'Mevzilen','G'),btn('mission','Ateş görevi','F',state.missionArm),btn('shell',ind.every(u=>u.shell==='he')?'Mermi: Tahrip':'Mermi: Sis','T'),btn('salvo',`Atım ×${state.salvo}`,'N'),btn('auto',ind.every(u=>u.auto)?'Serbest atış: açık':'Serbest atış: kapalı','O',ind.every(u=>u.auto))])}
  const pl=s.filter(u=>u.d.plane);let he=s.filter(u=>u.d.heli);const rd=s.filter(u=>u.d.radar);
  if(pl.length){const b=[];if(pl.some(u=>u.runType&&u.pay[u.runType]>=1))b.push(btn('run','Saldırı koşusu','J',state.runArm));if(pl.some(u=>u.d.pay.gun!=null))b.push(btn('wpn',pl.every(u=>u.runType!=='rockets')?'Silah: 30 mm':'Silah: roket',''));
    if(pl.some(u=>u.pay.lgb>=1||u.pay.mam>=1))b.push(btn('prec','Hassas vuruş','P',state.precArm));if(pl.some(u=>!u.d.highOnly))b.push(btn('alt',pl.every(u=>u.alt==='high')?'İrtifa: yüksek':'İrtifa: alçak','Y'));
    b.push(btn('burn','Art yakıcı','I',pl.every(u=>u.burn)),btn('rtb','Üsse dön','U'));h+=grpH('UÇAK',b)}
  const dr=he.filter(u=>u.d.drone);if(dr.length)h+=grpH('DRON',[btn('rtb','Üsse dön','U')]);
  he=he.filter(u=>!u.d.drone);if(he.length){const b=[btn('alt',he.every(u=>u.alt==='high')?'İrtifa: yüksek':'İrtifa: alçak','Y'),btn('land',he.every(u=>u.alt==='landed')?'Kalkış':'İniş','L')];
    if(he.some(u=>u.d.cap))b.push(btn('unload',`İndir (${he.reduce((a,u)=>a+(u.cargo?u.cargo.length:0),0)})`,'U'));h+=grpH('HELİ',b)}
  const tr=s.filter(u=>u.d.cap&&!u.d.heli&&u.cargo.length);if(tr.length)h+=grpH('NAKLİYE',[btn('unload',`İndir (${tr.reduce((a,u)=>a+u.cargo.length,0)})`,'U')]);
  if(rd.length)h+=grpH('RADAR',[btn('radar',rd.every(u=>u.radarOn||u.radarT>0)?'Radarı kapat':'Radarı aç','Y',rd.every(u=>u.radarOn))]);
  if(any(u=>u.d.smokeL))h+=grpH('ARAÇ',[btn('smoke',`Sis perdesi (${Math.floor(s.filter(u=>u.d.smokeL).reduce((a,u)=>a+u.smokeL,0))})`,'R')]);
  return h}
const ACT={form:setFormSel,init:setInitSel,atk:()=>setArm(!state.attackArm),stop:stopSel,hold:holdSel,dc:dcToggle,'st-stand':()=>stanceSel('stand'),'st-crouch':()=>stanceSel('crouch'),'st-prone':()=>stanceSel('prone'),'st-auto':()=>stanceSel(null),
  dig:digSel,exit:exitSel,fast:()=>setFastArm(!state.fastArm),deploy:deploySel,mission:()=>setMissionArm(!state.missionArm),shell:shellSel,salvo:()=>{state.salvo=state.salvo===1?3:state.salvo===3?6:1},auto:autoSel,smoke:smokeSel,
  run:()=>setRunArm(!state.runArm),prec:()=>setPrecArm(!state.precArm),wpn:wpnSel,alt:altSel,burn:burnSel,rtb:rtbSel,exfil:exfilSel,land:landSel,unload:unloadSel,radar:radarSel};

export {ACT,selButtons,selInfo};
