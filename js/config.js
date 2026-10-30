/* config.js — Sabitler ve oyun verisi: harita boyutları, arazi türleri, renkler, birlik/silah tanımları (DEF), takviye destesi (SQUADS), stratejik bölgeler (ZK), nehir geometrisi, yapay zekâ zorlukları. */

const W=4800;
const H=3000;
const CS=16;
const GW=W/CS;
const GH=H/CS;
const PI=Math.PI;
const TAU=PI*2;
const T={GRASS:0,FOREST:1,TOWN:2,ROAD:3,FIELD:4,WATER:5,FORD:6,SWAMP:7,CONC:8,BURNT:9};
const FINE=matchMedia('(pointer:fine)').matches;
const COL=[{hull:'#46657f',tur:'#5b819f',dark:'#1d2a35',ring:'#62a6e6',lt:'#9fcaf2'},{hull:'#82463c',tur:'#a05a4c',dark:'#341a16',ring:'#e2584b',lt:'#f2958a'},{hull:'#666861',tur:'#7a7c74',dark:'#2c2d29',ring:'#9a9c94',lt:'#b4b6ad'},{hull:'#2d2a25',tur:'#37332d',dark:'#141310',ring:'#555',lt:'#4a463f'}];
const DEF={
 rifle:{n:'Tüfekçi',tag:'TÜF',hp:20,sp:34,vis:400,inf:1,gren:2,w:[{n:'Piyade tüfeği',r:270,dmg:9,ap:0,rl:1.2,acc:.42,k:'rifle',sup:5}]},
 mg:{n:'Makineli Tüfekçi',tag:'MAK',hp:22,sp:28,vis:400,inf:1,w:[{n:'Makineli tüfek',r:340,dmg:6,ap:0,rl:.14,acc:.17,k:'mg',sup:9,proneBonus:1.8}]},
 rpg:{n:'Roketatarcı',tag:'RKT',hp:20,sp:32,vis:380,inf:1,w:[{n:'Roketatar',r:230,dmg:120,ap:11,rl:5,acc:.5,k:'rpg',pen:'heat',ammo:5,soft:.35,splash:18,sup:25,anti:1},{n:'Tabanca',r:150,dmg:5,ap:0,rl:1.2,acc:.35,k:'rifle',sup:2}]},
 atgm:{n:'Güdümlü Füze Atıcı',tag:'GFA',hp:20,sp:26,vis:420,inf:1,w:[{n:'Güdümlü füze',r:420,dmg:140,ap:14,rl:7,acc:.75,k:'atgm',pen:'heat',ammo:4,soft:.3,stat:1,anti:1,sup:25},{n:'Tabanca',r:150,dmg:5,ap:0,rl:1.2,acc:.35,k:'rifle',sup:2}]},
 scout:{n:'Keşifçi',tag:'KŞF',hp:20,sp:42,vis:680,inf:1,stealth:1,w:[{n:'Karabina',r:240,dmg:8,ap:0,rl:1.1,acc:.42,k:'rifle',sup:4}]},
 sniper:{n:'Keskin Nişancı',tag:'KNŞ',hp:20,sp:34,vis:600,inf:1,stealth:1,w:[{n:'Keskin nişancı tüfeği',r:520,dmg:22,ap:0,rl:4,acc:.72,k:'snipe',sup:30,stat:1}]},
 mortar:{n:'Havancı',tag:'HVN',hp:20,sp:28,vis:360,inf:1,indirect:1,setupT:2.5,packT:1.5,trav:3,w:[{n:'81 mm havan',r:950,min:120,dmg:45,ap:3,rl:3.5,k:'mortar',splash:45,soft:1,sup:45,ammo:{he:18,smoke:6},scat:26,spd:380,base:1.4}]},
 ifv:{n:'Zırhlı Muharebe Aracı',tag:'ZMA',hp:240,stab:.65,crew:2,cap:6,sp:72,vis:460,aF:4,aS:3,aR:2,turn:2.2,ts:2.6,veh:1,smokeL:2,w:[{n:'25 mm top',r:350,dmg:15,ap:3,rl:.5,acc:.45,k:'auto',pen:'ke',ammo:150,sup:12},{n:'Eş eksenli makineli',r:300,dmg:5,ap:0,rl:.2,acc:.3,k:'mg',sup:8}]},
 tank:{n:'Ana Muharebe Tankı',tag:'TNK',hp:400,stab:.85,aps:3,era:{F:2,S:2},crew:3,sp:56,vis:420,aF:10,aS:6,aR:4,turn:1.4,ts:1.7,veh:1,smokeL:2,w:[{n:'120 mm top',r:440,dmg:120,ap:13,rl:4,acc:.7,k:'gun',pen:'ke',ammo:36,soft:.7,splash:22,sup:40,anti:1},{n:'Makineli tüfek',r:300,dmg:5,ap:0,rl:.2,acc:.3,k:'mg',sup:8}]},
 arty:{n:'155 mm Obüs',tag:'OBS',hp:150,sp:40,vis:280,aF:1,aS:1,aR:1,turn:1.2,veh:1,indirect:1,setupT:5,packT:3,trav:.6,w:[{n:'155 mm obüs',r:1700,min:350,dmg:110,ap:6,rl:7,k:'arty',splash:80,soft:1.2,sup:70,ammo:{he:24,smoke:8},scat:55,spd:450,base:2.2}]},
 supply:{n:'İkmal Kamyonu',tag:'İKM',hp:120,sp:68,vis:300,aF:1,aS:1,aR:1,turn:2,veh:1,supply:1,w:[]},
 crew:{n:'Mürettebat',tag:'MÜR',hp:16,sp:36,vis:380,inf:1,w:[{n:'Tabanca',r:150,dmg:5,ap:0,rl:1.2,acc:.35,k:'rifle',sup:2}]},
 manpads:{n:'Omuzdan Füze Atıcı',tag:'OAF',hp:20,sp:30,vis:420,inf:1,w:[{n:'Omuzdan atılan füze',k:'irm',aaOnly:1,rLow:560,rHigh:0,dmg:100,pk:.62,rl:5,ammo:2,msp:620,stat:1},{n:'Tabanca',r:150,dmg:5,ap:0,rl:1.2,acc:.35,k:'rifle',sup:2}]},
 shorad:{n:'Kısa Menzilli Hava Savunma',tag:'KMH',hp:200,stab:.6,crew:2,sp:62,vis:460,aF:3,aS:2,aR:2,turn:2,ts:3,veh:1,w:[{n:'35 mm uçaksavar topu',r:480,dmg:12,ap:3,rl:.12,acc:.32,k:'flak',pen:'ke',ammo:400,sup:12},{n:'Kızılötesi füze',k:'irm',aaOnly:1,rLow:950,rHigh:950,dmg:110,pk:.72,rl:2.5,ammo:8,msp:680}]},
 sam:{n:'Orta Menzilli Hava Savunma',tag:'OMH',hp:150,sp:50,vis:300,aF:1,aS:1,aR:1,turn:1.4,ts:2,veh:1,radar:1,w:[{n:'Radar güdümlü füze',k:'sam',aaOnly:1,rLow:850,rHigh:1800,dmg:140,pk:.75,rl:4,ammo:6,msp:780,needRadar:1}]},
 heliA:{n:'Taarruz Helikopteri',tag:'THK',hp:180,sp:105,vis:520,aF:0,aS:0,aR:0,ts:3,air:1,heli:1,flares:4,w:[{n:'Tanksavar füzesi',r:500,dmg:140,ap:14,rl:5,acc:.78,k:'atgm',pen:'heat',ammo:8,soft:.3,stat:1,anti:1,sup:25},{n:'Roket',r:400,dmg:30,ap:3,rl:.3,acc:.4,k:'rocket',pen:'heat',ammo:38,splash:26,sup:35,soft:1},{n:'20 mm top',r:360,dmg:10,ap:3,rl:.12,acc:.35,k:'auto',pen:'ke',ammo:300,sup:10}]},
 heliT:{n:'Nakliye Helikopteri',tag:'NHK',hp:200,sp:115,vis:420,aF:0,aS:0,aR:0,ts:3,air:1,heli:1,flares:4,cap:12,w:[{n:'Kapı makineli tüfeği',r:300,dmg:5,ap:0,rl:.18,acc:.3,k:'mg',sup:8}]},
 cas:{n:'Taarruz Uçağı',tag:'TUÇ',hp:170,sp:200,turn:1.05,vis:0,air:1,plane:1,fuel:150,flares:6,rearm:45,pay:{gun:3,rockets:2},w:[]},
 mr:{n:'Çok Rollü Uçak',tag:'ÇRU',hp:110,sp:245,turn:1.2,vis:0,air:1,plane:1,fuel:120,flares:6,rearm:50,pay:{lgb:4,aam:2},w:[]},
 sead:{n:'SEAD Uçağı',tag:'SEAD',hp:110,sp:245,turn:1.2,vis:0,air:1,plane:1,fuel:120,flares:6,rearm:55,pay:{arm:4,aam:2},w:[]},
 ftr:{n:'Hava Üstünlük Uçağı',tag:'AVC',hp:120,sp:265,turn:1.45,vis:0,air:1,plane:1,fuel:130,flares:8,rearm:40,pay:{aam:4,ir:2},w:[]},
 rec:{n:'Keşif Uçağı',tag:'KŞU',hp:100,sp:270,turn:1.3,vis:780,gvis:1,air:1,plane:1,fuel:150,flares:8,rearm:40,pay:{},w:[]},
 tb2:{n:'Silahlı İHA',tag:'SİHA',hp:70,sp:120,turn:1.1,vis:620,gvis:1,air:1,plane:1,uav:1,highOnly:1,fuel:280,flares:0,rearm:45,pay:{mam:4},w:[]},
 uav:{n:'Keşif Dronu',tag:'DRN',hp:25,sp:62,vis:520,aF:0,aS:0,aR:0,ts:4,air:1,heli:1,drone:1,uav:1,bat:160,flares:0,w:[]},
 fpv:{n:'Kamikaze Dron',tag:'KMK',hp:15,sp:115,vis:300,aF:0,aS:0,aR:0,ts:6,air:1,heli:1,drone:1,uav:1,fpv:1,bat:110,flares:0,w:[]},
 /* dron operatörü: kamikaze dron fırlatır ve yönetir; drones: başlangıç stoku (kişi başı), ctrl: kontrol menzili (aşılırsa bağlantı kopar) */
 dop:{n:'Dron Operatörü',tag:'DOP',hp:20,sp:32,vis:420,inf:1,dronOp:1,drones:3,ctrl:1400,w:[{n:'Karabina',r:240,dmg:8,ap:0,rl:1.1,acc:.4,k:'rifle',sup:4}]},
 /* gemiler için hazırlık: naval:1 olan birlik yalnızca nehirde yüzer (köprü altından geçer), karaya çıkamaz.
    Yeni gemi sınıfı: DEF'e naval:1 birlik, SQUADS sonuna {k,n,cost,m:[...],cat:'deniz'}, AVE ve ROLE'a birer satır. */
 boat:{n:'Devriye Botu',tag:'BOT',hp:160,sp:64,vis:480,aF:2,aS:2,aR:1,turn:1.6,ts:2.5,veh:1,naval:1,w:[{n:'12,7 mm makineli',r:360,dmg:8,ap:1,rl:.18,acc:.3,k:'mg',sup:10}]},
 bmb:{n:'Stratejik Bombardıman',tag:'BMB',hp:280,sp:165,turn:.55,vis:0,air:1,plane:1,highOnly:1,fuel:170,flares:10,rearm:90,pay:{carpet:1},w:[]},
};
const SQUADS=[
 {k:'inf',n:'Piyade Mangası',cost:70,m:['rifle','rifle','rifle','rifle','mg','rpg'],cat:'kara'},
 {k:'at',n:'Tanksavar Timi',cost:110,m:['atgm','atgm','rifle'],cat:'kara'},
 {k:'recon',n:'Keşif Timi',cost:80,m:['scout','scout','sniper'],cat:'kara'},
 {k:'mortar',n:'Havan Timi',cost:100,m:['mortar','mortar'],cat:'kara'},
 {k:'supply',n:'İkmal Kamyonu',cost:80,m:['supply'],cat:'kara'},
 {k:'ifv',n:'Zırhlı Muharebe Aracı',cost:160,m:['ifv'],cat:'kara'},
 {k:'mech',n:'Mekanize Piyade',cost:220,m:['ifv'],cat:'kara'},
 {k:'tank',n:'Ana Muharebe Tankı',cost:280,m:['tank'],cat:'kara'},
 {k:'arty',n:'Obüs Bataryası',cost:210,m:['arty'],cat:'kara'},
 {k:'manpads',n:'Hava Savunma Timi',cost:90,m:['manpads','manpads'],cat:'hsv'},
 {k:'shorad',n:'Kısa Menzilli Hava Savunma',cost:170,m:['shorad'],cat:'hsv'},
 {k:'sam',n:'Orta Menzilli Hava Savunma',cost:220,m:['sam'],cat:'hsv'},
 {k:'heliA',n:'Taarruz Helikopteri',cost:240,m:['heliA'],cat:'hava'},
 {k:'heliT',n:'Hava İndirme Mangası',cost:190,m:['heliT'],cat:'hava'},
 {k:'cas',n:'Taarruz Uçağı',cost:220,plane:'cas',m:[],cat:'hava'},
 {k:'mr',n:'Çok Rollü Uçak',cost:240,plane:'mr',m:[],cat:'hava'},
 {k:'sead',n:'SEAD Uçağı',cost:200,plane:'sead',m:[],cat:'hava'},
 {k:'ftr',n:'Hava Üstünlük Uçağı',cost:200,plane:'ftr',m:[],cat:'hava'},
 {k:'bmb',n:'Stratejik Bombardıman',cost:340,plane:'bmb',m:[],cat:'hava'},
 {k:'rec',n:'Keşif Uçağı',cost:120,plane:'rec',m:[],cat:'hava'},
 {k:'tb2',n:'Silahlı İHA',cost:210,plane:'tb2',m:[],cat:'hava'},
 {k:'uav',n:'Keşif Dronu',cost:55,m:['uav'],cat:'hava'},
 {k:'fpv',n:'Kamikaze Dron Timi',cost:110,m:['fpv','fpv','fpv'],cat:'hava'},
 /* sona eklendi: önceki dizinler (deste, varsayılan başlangıç) değişmesin */
 {k:'dronop',n:'Dron Operatör Timi',cost:130,m:['dop','dop'],cat:'kara'},
 /* gemiler (cat:'deniz'): deste ve ordu ekranında Deniz sekmesi/kategorisi otomatik görünür */
 {k:'bot',n:'Devriye Botu',cost:120,m:['boat'],cat:'deniz'},
];
/* uçak mühimmatı */
const AW={
 gun:{n:'30 mm top',dmg:22,ap:7,splash:14,sup:30,k:'agun',soft:1,top:1},
 rockets:{n:'Roket salvosu',dmg:40,ap:4,splash:30,sup:45,k:'arock',soft:1,top:1},
 lgb:{n:'Lazer güdümlü bomba',dmg:240,ap:20,splash:50,sup:80,k:'lgb',soft:1.2,top:1,range:900},
 carpet:{n:'Halı bombardımanı',dmg:150,ap:10,splash:60,sup:90,k:'bomb',soft:1.2,top:1},
 aam:{n:'Radar güdümlü hava-hava füzesi',k:'aam',dmg:130,pk:.72,range:1250,msp:950},
 ir:{n:'Kızılötesi hava-hava füzesi',k:'irm',dmg:110,pk:.78,range:520,msp:800},
 arm:{n:'Anti-radyasyon füzesi',k:'arm',dmg:180,ap:20,pk:.9,range:1500,msp:700},
 mam:{n:'Akıllı mikro mühimmat',dmg:140,ap:16,splash:18,sup:50,k:'lgb',soft:1,top:1,range:700},
 fpv:{n:'Kamikaze harp başlığı',dmg:170,ap:18,splash:16,sup:60,k:'fpv',soft:1,top:1},
};
const PAYN={gun:'30 mm top (geçiş)',rockets:'Roket salvosu',lgb:'Lazer güdümlü bomba',aam:'Hava-hava füzesi (radar)',ir:'Hava-hava füzesi (IR)',arm:'Anti-radyasyon füzesi',carpet:'Halı bombardımanı',mam:'Akıllı mikro mühimmat'};
const AIRMUL={rifle:.15,mg:.45,snipe:.2,auto:.9,flak:1,gun:.6,rpg:.8,atgm:.9,rocket:.5};
const RANKN=['Acemi','Tecrübeli','Kıdemli','Elit'];
const FMN={free:'Serbest ateş',ret:'Sadece karşılık',hold:'Ateş kes'};
const AVE={inf:[14,5],mech:[8,10],at:[8,6],recon:[6,5],mortar:[5,7],supply:[5,8],ifv:[8,10],tank:[8,14],arty:[4,16],manpads:[8,6],shorad:[5,12],sam:[3,14],heliA:[5,10],heliT:[5,10],cas:[4,0],mr:[3,0],sead:[3,0],ftr:[4,0],bmb:[2,0],rec:[3,0],tb2:[3,0],uav:[6,6],fpv:[6,6],dronop:[5,7],bot:[3,8]};
SQUADS.forEach(S=>{S.av=AVE[S.k][0];S.eta=AVE[S.k][1]});
const GREN={n:'El bombası',dmg:40,ap:1,splash:34,soft:1,sup:50,k:'gren'};
const COVN={trench:'Siper hattı',sandbag:'Kum torbası',wall:'Taş duvar',hedge:'Çit',fox:'Tüfekçi çukuru',rubble:'Enkaz',wreck:'Araç enkazı'};
const STN={stand:'Ayakta',crouch:'Çömelmiş',prone:'Yatık'};
const STATEN={travel:'Seyir',deploying:'Mevzileniyor',deployed:'Mevzide',packing:'Toparlanıyor'};
/* ---------- harita ---------- */
/* Nehir haritayı ikiye böler; geçitler: 3 köprü, 2 sığ geçit. Harita merkeze göre simetrik. */
const RIV={A:230,P:1750,hw:40};
const riverX=y=>W/2+RIV.A*Math.sin(TAU*(y-H/2)/RIV.P);
const CROSS=[{y:620,t:'bridge'},{y:1060,t:'ford'},{y:1500,t:'bridge'},{y:1940,t:'ford'},{y:2380,t:'bridge'}];
/* stratejik bölgeler: ele geçirene gelir ve özel avantaj sağlar */
const ZK={
 airfield:{n:'Havaalanı',inc:3,v:2,r:165,pts:1,b:'Uçak ikmali %40 hızlı · inen helikopter ikmal alır'},
 factory:{n:'Fabrika',inc:7,v:3,r:145,pts:1,b:'Yüksek gelir'},
 depot:{n:'İkmal Deposu',inc:3,v:2,r:125,pts:1,b:'300 m içinde ikmal ve onarım'},
 hill:{n:'Radar Tepesi',inc:2,v:2,r:125,pts:1,b:'950 m gözetleme · tüm düşman uçakları görünür · topçuya gözcü'},
 city:{n:'Şehir Merkezi',inc:4,v:3,r:175,pts:2,b:'Çift puan'},
 bridge:{n:'Köprü',inc:2,v:1,r:120,pts:1,b:'Nehir geçidi'},
};
const OBJL=[{k:'factory',x:1350,y:620},{k:'depot',x:1150,y:1650},{k:'hill',x:1700,y:1980},{k:'airfield',x:780,y:2400}];
const RL=[
 [[0,700],[700,660],[1350,620],[riverX(620)-RIV.hw-40,620]],
 [[0,1500],[600,1560],[1150,1650],[1700,1520],[riverX(1500)-RIV.hw-40,1500]],
 [[0,2300],[780,2400],[1400,2320],[1700,1980],[1500,1800],[1150,1650]],
 [[1350,620],[1280,1100],[1150,1650]],
 [[riverX(620)+RIV.hw+40,620],[2950,660],[3350,900],[3650,1350]],
 [[riverX(1060)-RIV.hw-60,1060],[1950,1120],[1700,1520]],
 [[riverX(1060)+RIV.hw+60,1060],[2850,1020],[3100,1020]],
];
const AIDIF={easy:{n:'Kolay',inc:.8,plan:5,coord:.5},normal:{n:'Normal',inc:1,plan:3,coord:1},hard:{n:'Zor',inc:1.25,plan:2,coord:1}};
/* ---------- maç içi ekonomi (öneri değerleri; tempo görevi buradan ölçekler) ----------
   start: başlangıç KP · cap: rezerv tavanı · base: taban gelir (KP/sn) · objMul: nokta geliri çarpanı (fabrika hariç)
   upk: sahadaki birlik değeri kademesi → gelir çarpanı · killBounty: düşman imhasında değer payı
   deadCd: ölen kartın bekleme süresi (sn), deadCdCost maliyet aralığında doğrusal · exfilCd: geri çekilen kart bekleme süresi
   exfilMin: en az iade oranı · contestDecay: çekişmeli bölgede tarafsıza kayma (puan/sn) · aiMinUpk: YZ bu çarpanın altında acil değilse almaz */
const ECON={start:400,cap:1500,base:3,objMul:.5,upk:[[1500,1],[3000,.85],[5000,.6],[Infinity,.35]],killBounty:.1,deadCd:[60,180],deadCdCost:[60,340],exfilCd:20,exfilMin:.2,contestDecay:3,aiMinUpk:.6};
const COMBAT=new Set(['inf','at','ifv','tank','mech']);
/* ---------- birlik inisiyatifi ----------
   Birlik yalnızca boştayken, emir verilen noktanın (çapa) çevresindeki küçük bir alanda karar verir.
   Hiçbir otomatik hareket düşmana yaklaştıramaz ve çapanın ötesine, düşman tarafına geçemez. */
const INITN={off:'Kapalı',on:'Temkinli',free:'Aktif'};
const FORMN={auto:'Otomatik',line:'Hat',wedge:'Kama',column:'Kol',spread:'Dağınık',circle:'Çevre savunması'};
/* ---------- savaş öncesi ordu ----------
   Ordu puanı (OP) yalnızca başlangıç kuvvetini belirler; savaş içindeki KP ekonomisinden ve takviye destesinden ayrıdır.
   İki taraf da aynı bütçeyle başlar. cap: bir birlik türünden en fazla kaç adet (kart sayısıyla da sınırlı). */
const ARMY={budgets:[600,1000,1500],bn:{600:'Öncü',1000:'Tabur',1500:'Tugay'},def:1000,cap:6,name:'1. Tabur'};
const ARMYCAT=[
 {k:'inf',n:'Piyade',m:['inf','at','dronop']},
 {k:'recon',n:'Keşif',m:['recon','uav']},
 {k:'tank',n:'Tanklar',m:['tank']},
 {k:'arm',n:'Zırhlı Araçlar',m:['ifv','mech']},
 {k:'arty',n:'Topçu',m:['mortar','arty']},
 {k:'aa',n:'Hava Savunma',m:['manpads','shorad','sam']},
 {k:'air',n:'Hava Kuvvetleri',m:['heliA','heliT','fpv','cas','mr','sead','ftr','bmb','rec','tb2']},
 {k:'sup',n:'Destek',m:['supply']},
 {k:'naval',n:'Deniz Kuvvetleri',m:SQUADS.filter(S=>S.cat==='deniz').map(S=>S.k)},
].filter(c=>c.m.length);
const ROLE={inf:'Hat piyadesi · nokta tutar, el bombası atar',at:'Zırh avcısı · güdümlü tanksavar füzesi',recon:'Gözcü · geniş görüş, gizlenme, keskin nişancı',uav:'Hava gözcüsü · topçuya hedef gösterir',
 tank:'Ağır zırh · cephenin ana vurucu gücü',ifv:'Piyade desteği · 25 mm top, sis perdesi',mech:'ZMA ve içinde tam piyade mangası',mortar:'Hafif dolaylı ateş · çabuk mevzilenir',arty:'Ağır dolaylı ateş · çok uzun menzil',
 manpads:'Omuzdan füze · alçak uçan hedefler',shorad:'Uçaksavar topu ve kızılötesi füze',sam:'Radarlı uzun menzil · ARM hedefi olur',heliA:'Tanksavar füzesi, roket ve top',heliT:'Nakliye helikopteri ve içinde piyade mangası',
 fpv:'Üç kamikaze dron · hedefe dalar',cas:'30 mm top veya roket koşusu',mr:'Lazer güdümlü bomba ve hava-hava füzesi',sead:'Radar avcısı · anti-radyasyon füzesi',ftr:'Hava üstünlüğü · düşman uçağı avlar',
 bmb:'Halı bombardımanı · geniş alan',rec:'Yer gözetlemesi · hedefleri açığa çıkarır',tb2:'Silahlı İHA · akıllı mühimmat',supply:'İkmal ve onarım · 130 m çevre',dronop:'Kamikaze dron yönetir · 1400 m kontrol menzili, 6 dron',bot:'Nehir devriyesi · makineli tüfek, köprü altından geçer'};

export {AIDIF,AIRMUL,ARMY,ARMYCAT,AW,ECON,COL,COMBAT,COVN,CROSS,CS,DEF,FINE,FMN,FORMN,GH,GREN,GW,H,INITN,OBJL,PAYN,PI,RANKN,RIV,ROLE,RL,SQUADS,STATEN,STN,T,TAU,W,ZK,riverX};
