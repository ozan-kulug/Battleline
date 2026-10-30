/* i18n.js — Dil desteği. Kaynak metinler Türkçe kalır; İngilizce (varsayılan) seçiliyse ekrana çıkan metin tr() ile çevrilir.
   Önce cümle kalıpları (değişkenler yakalanıp korunur), sonra sözlük (kelime sınırına göre, uzun ifade önce) uygulanır.
   Dil: ?lang=tr|en adresi veya menüdeki dil düğmesi (tarayıcıda hatırlanır). */
const KEY='cephe-hatti.lang';
let lang='en';
try{const q=new URLSearchParams(location.search).get('lang');lang=q==='tr'||q==='en'?q:(localStorage.getItem(KEY)==='tr'?'tr':'en')}catch(e){}
const setLang=l=>{try{localStorage.setItem(KEY,l)}catch(e){}};

/* cümle kalıpları: [Türkçe düzenli ifade, İngilizce karşılık] — $1, $2 yakalanan değişkenlerdir */
const PAT=[
 [/^(.+) çağrıldı, (\d+) sn içinde cephede$/,'$1 called in, at the front in $2 s'],
 [/: (\d+) asker indirildi$/,': $1 soldiers dropped off'],
 [/^Düşman (.+) mürettebatı aracı terk etti$/,'Enemy $1 crew bailed out'],
 [/^(\S+) noktası ele geçirildi$/,'Point $1 captured'],
 [/^(\S+) noktası düşmana geçti$/,'Point $1 lost to the enemy'],
 [/^(\S+) noktası tarafsız$/,'Point $1 is neutral'],
 [/^(.+) kartı yeniden kullanılabilir$/,'$1 card available again'],
 [/^Siperde yer kalmadı: (\d+) asker arkada bekliyor$/,'No room in cover: $1 soldiers waiting behind'],
 [/^(\d+) topçu birimi için hedef menzil dışında$/,'Target out of range for $1 artillery units'],
 [/^Grup (\d+) atandı \((\d+) birlik\)$/,'Group $1 assigned ($2 units)'],
 [/^(\d+) kamikaze dron havada: düşmana sağ tıkla$/,'$1 kamikaze drones airborne: right-click an enemy'],
 [/: kamikaze dron (.+) hedefine gönderildi$/,': kamikaze drone sent at $1'],
 [/^İstihbarat: düşman (\S+) noktası önünde toplanıyor$/,'Intel: enemy massing in front of point $1'],
 [/^Düşman (\S+) noktasına hazırlık ateşi açıyor$/,'Enemy opening preparatory fire on point $1'],
 [/^Düşmanın (\S+) taarruzu püskürtüldü, geri çekiliyorlar$/,'Enemy assault on point $1 repelled, they are falling back'],
 [/üsse indi, ikmal (\d+) sn$/,'landed at base, rearming $1 s'],
 [/(\d+) düşman askeri ve aracı imha edildi, (\d+) kayıp verildi\./,'$1 enemy soldiers and vehicles destroyed, $2 losses.'],
 [/Süre: (\d+) dk (\d+) sn\./,'Time: $1 min $2 s.'],
 [/: en fazla (\d+) adet alınabilir/g,': at most $1 allowed'],
 [/: en fazla (\d+) adet$/,': at most $1'],
 [/Bütçe yetmiyor: ([^"<>]+?) (\d+) OP, kalan (-?\d+) OP/g,'Not enough budget: $1 costs $2 AP, $3 AP left'],
 [/^Bütçe (\d+) OP aşıldı: birlik çıkar veya bütçeyi yükselt$/,'Budget exceeded by $1 AP: remove units or raise the budget'],
 [/^Hazır · (-?\d+) OP kullanılmadı$/,'Ready · $1 AP unused'],
 [/aria-label="Bir ([^"]+) ekle"/g,'aria-label="Add one $1"'],
 [/aria-label="Bir ([^"]+) çıkar"/g,'aria-label="Remove one $1"'],
 [/>([^<>]+) arkasında</g,'>Behind $1<'],
 [/Kazıyor %(\d+)/g,'Digging $1%'],
 [/(\d+) atım kaldı/g,'$1 rounds left'],
 [/Hassas vuruş: (\d+) hedef/g,'Precision strike: $1 targets'],
 [/havada (\d+)/g,'$1 airborne'],
 [/Bakım gideri −%(\d+)/g,'Upkeep −$1%'],
 [/Düşman imhası değerinin %(\d+)'(?:si|u|ü|ı) ayrıca/g,'plus $1% of destroyed enemy value'],
 [/%(\d+)/g,'$1%'],
];
/* sözlük: Türkçe → İngilizce. Büyük/küçük harf biçimleri (FABRİKA, ana muharebe tankı) otomatik eklenir */
const PH={
 'MAVİ KUVVET':'BLUE FORCE','KIZIL KUVVET':'RED FORCE','Mavi Kuvvet':'Blue Force','Kızıl Kuvvet':'Red Force','Yardım':'Help',
 // birimler
 'Tüfekçi':'Rifleman','Makineli Tüfekçi':'Machine Gunner','Roketatarcı':'RPG Gunner','Güdümlü Füze Atıcı':'ATGM Gunner','Keşifçi':'Scout','Keskin Nişancı':'Sniper','Havancı':'Mortarman',
 'Zırhlı Muharebe Aracı':'Infantry Fighting Vehicle','Ana Muharebe Tankı':'Main Battle Tank','155 mm Obüs':'155 mm Howitzer','İkmal Kamyonu':'Supply Truck','Mürettebat':'Crew',
 'Omuzdan Füze Atıcı':'MANPADS Gunner','Kısa Menzilli Hava Savunma':'Short-Range Air Defense','Orta Menzilli Hava Savunma':'Medium-Range Air Defense','Taarruz Helikopteri':'Attack Helicopter',
 'Nakliye Helikopteri':'Transport Helicopter','Taarruz Uçağı':'Attack Aircraft','Çok Rollü Uçak':'Multirole Aircraft','SEAD Uçağı':'SEAD Aircraft','Hava Üstünlük Uçağı':'Air Superiority Fighter',
 'Keşif Uçağı':'Recon Aircraft','Silahlı İHA':'Armed UAV','Keşif Dronu':'Recon Drone','Kamikaze Dron':'Kamikaze Drone','Dron Operatörü':'Drone Operator','Stratejik Bombardıman':'Strategic Bomber','Devriye Botu':'Patrol Boat',
 'Piyade Mangası':'Infantry Squad','Tanksavar Timi':'Anti-Tank Team','Keşif Timi':'Recon Team','Havan Timi':'Mortar Team','Mekanize Piyade':'Mechanized Infantry','Obüs Bataryası':'Howitzer Battery',
 'Hava Savunma Timi':'Air Defense Team','Hava İndirme Mangası':'Air Assault Squad','Kamikaze Dron Timi':'Kamikaze Drone Team','Dron Operatör Timi':'Drone Operator Team',
 'TÜF':'RIF','MAK':'MG','RKT':'RPG','GFA':'ATGM','KŞF':'SCT','KNŞ':'SNP','HVN':'MOR','ZMA':'IFV','TNK':'MBT','OBS':'HOW','İKM':'SUP','MÜR':'CRW','OAF':'MPD','KMH':'SHO','OMH':'SAM','THK':'AH','NHK':'TH',
 'TUÇ':'CAS','ÇRU':'MRF','AVC':'FTR','KŞU':'RCN','SİHA':'UCAV','DRN':'UAV','KMK':'FPV','BOT':'PB','TAH':'HE','SİS':'SMK','KP':'CP','OP':'AP','TP':'XP',
 // silahlar ve mühimmat
 'Piyade tüfeği':'Rifle','Makineli tüfek':'Machine gun','Roketatar':'RPG','Tabanca':'Pistol','Güdümlü füze':'Guided missile','Karabina':'Carbine','Keskin nişancı tüfeği':'Sniper rifle','81 mm havan':'81 mm mortar',
 '25 mm top':'25 mm cannon','Eş eksenli makineli':'Coaxial MG','120 mm top':'120 mm gun','155 mm obüs':'155 mm howitzer','Omuzdan atılan füze':'Shoulder-fired missile','35 mm uçaksavar topu':'35 mm AA gun',
 'Kızılötesi füze':'IR missile','Radar güdümlü füze':'Radar-guided missile','Tanksavar füzesi':'Anti-tank missile','Roket':'Rocket','20 mm top':'20 mm cannon','Kapı makineli tüfeği':'Door gun','12,7 mm makineli':'12.7 mm MG',
 '30 mm top':'30 mm cannon','30 mm top (geçiş)':'30 mm cannon (strafe)','Roket salvosu':'Rocket salvo','Lazer güdümlü bomba':'Laser-guided bomb','Halı bombardımanı':'Carpet bombing','Radar güdümlü hava-hava füzesi':'Radar-guided air-to-air missile',
 'Kızılötesi hava-hava füzesi':'IR air-to-air missile','Anti-radyasyon füzesi':'Anti-radiation missile','Akıllı mikro mühimmat':'Smart micro munition','Kamikaze harp başlığı':'Kamikaze warhead','El bombası':'Grenade',
 'Hava-hava füzesi (radar)':'Air-to-air missile (radar)','Hava-hava füzesi (IR)':'Air-to-air missile (IR)',
 // bölgeler
 'Havaalanı':'Airfield','Fabrika':'Factory','İkmal Deposu':'Supply Depot','Radar Tepesi':'Radar Hill','Şehir Merkezi':'City Center','Köprü':'Bridge',
 'Uçak ikmali':'Aircraft rearm','hızlı':'faster','inen helikopter ikmal alır':'landed helicopters resupply','Yüksek gelir':'High income','300 m içinde ikmal ve onarım':'Resupply and repair within 300 m',
 '950 m gözetleme':'950 m observation','tüm düşman uçakları görünür':'all enemy aircraft visible','topçuya gözcü':'artillery spotter','Çift puan':'Double points','Nehir geçidi':'River crossing',
 // siper, duruş, durumlar
 'Siper hattı':'Trench','Kum torbası':'Sandbags','Taş duvar':'Stone wall','Çit':'Hedge','Tüfekçi çukuru':'Foxhole','Enkaz':'Rubble','Araç enkazı':'Vehicle wreck',
 'Ayakta':'Standing','Çömelmiş':'Crouching','Yatık':'Prone','Seyir':'Traveling','Mevzileniyor':'Deploying','Mevzide':'Deployed','Toparlanıyor':'Packing up',
 'Acemi':'Rookie','Tecrübeli':'Experienced','Kıdemli':'Veteran','Elit':'Elite','Serbest ateş':'Fire at will','Sadece karşılık':'Return fire only','Ateş kes':'Hold fire',
 'Kapalı':'Off','Temkinli':'Cautious','Aktif':'Active','Otomatik':'Auto','Hat':'Line','Kama':'Wedge','Kol':'Column','Dağınık':'Spread','Çevre savunması':'Perimeter','karışık':'mixed',
 'Kolay':'Easy','Zor':'Hard','Öncü':'Vanguard','Tabur':'Battalion','Tugay':'Brigade','1. Tabur':'1st Battalion',
 // kategoriler ve roller
 'Piyade':'Infantry','Keşif':'Recon','Tanklar':'Tanks','Zırhlı Araçlar':'Armored Vehicles','Topçu':'Artillery','Hava Savunma':'Air Defense','Hava Kuvvetleri':'Air Force','Destek':'Support','Deniz Kuvvetleri':'Navy',
 'Hat piyadesi · nokta tutar, el bombası atar':'Line infantry · holds points, throws grenades','Zırh avcısı · güdümlü tanksavar füzesi':'Armor hunter · guided anti-tank missile',
 'Gözcü · geniş görüş, gizlenme, keskin nişancı':'Spotter · wide vision, stealth, sniper','Hava gözcüsü · topçuya hedef gösterir':'Aerial spotter · marks targets for artillery',
 'Ağır zırh · cephenin ana vurucu gücü':'Heavy armor · main striking force','Piyade desteği · 25 mm top, sis perdesi':'Infantry support · 25 mm cannon, smoke screen','ZMA ve içinde tam piyade mangası':'IFV carrying a full infantry squad',
 'Hafif dolaylı ateş · çabuk mevzilenir':'Light indirect fire · deploys quickly','Ağır dolaylı ateş · çok uzun menzil':'Heavy indirect fire · very long range','Omuzdan füze · alçak uçan hedefler':'Shoulder-fired missile · low-flying targets',
 'Uçaksavar topu ve kızılötesi füze':'AA gun and IR missiles','Radarlı uzun menzil · ARM hedefi olur':'Radar, long range · ARM target','Tanksavar füzesi, roket ve top':'Anti-tank missiles, rockets and cannon',
 'Nakliye helikopteri ve içinde piyade mangası':'Transport helicopter carrying an infantry squad','Üç kamikaze dron · hedefe dalar':'Three kamikaze drones · dive onto targets','30 mm top veya roket koşusu':'30 mm cannon or rocket run',
 'Lazer güdümlü bomba ve hava-hava füzesi':'Laser-guided bombs and air-to-air missiles','Radar avcısı · anti-radyasyon füzesi':'Radar hunter · anti-radiation missiles','Hava üstünlüğü · düşman uçağı avlar':'Air superiority · hunts enemy aircraft',
 'Halı bombardımanı · geniş alan':'Carpet bombing · wide area','Yer gözetlemesi · hedefleri açığa çıkarır':'Ground surveillance · reveals targets','Silahlı İHA · akıllı mühimmat':'Armed UAV · smart munitions',
 'İkmal ve onarım · 130 m çevre':'Resupply and repair · 130 m radius','Kamikaze dron yönetir · 1400 m kontrol menzili, 6 dron':'Controls kamikaze drones · 1400 m control range, 6 drones',
 // panel
 'Seçili birlik yok':'No unit selected','Sol tık: manga seçer · Alt+tık: tek asker':'Left click: selects squad · Alt+click: single soldier','birlik seçili':'units selected','Baskı altında':'Suppressed',
 'Sağlamlık':'Health','Moral':'Morale','Moral (ortalama)':'Morale (average)','Panik, geri çekiliyor':'Panicking, falling back','Sersemledi':'Stunned','Kırılma eşiğinde':'Breaking','Yere yapıştı':'Pinned',
 'Mürettebat sarsıldı':'Crew shaken','Sakin':'Calm','Rütbe':'Rank','Atış modu':'Fire mode','İnisiyatif':'Initiative','m alan':'m area','Son karar':'Last decision','Radar':'Radar',
 'Açık (iz bırakıyor)':'On (emitting)','Açılıyor':'Starting','Duruş':'Stance','(oto)':'(auto)','Siper':'Cover','Bina':'Building','Açıkta':'In the open','İsabet koruması':'Hit protection',
 'Her yönden':'All sides','hat boyunca':'along the line','Önden %35, gizlenme':'Front 35%, concealment','Önden %70, yandan yok':'Front 70%, none from flanks','Yok':'None',
 'Yer gözetlemesi':'Ground surveillance','hedefleri kendisi bulur':'finds targets itself','Durum':'Status','Üsse dönüyor':'Returning to base','Koşuya yaklaşıyor':'Approaching run','Saldırı koşusunda':'On attack run',
 'Hedef takibinde':'Tracking target','Devriyede':'Patrolling','İrtifa':'Altitude','Yüksek':'High','Alçak':'Low','Yakıt':'Fuel','art yakıcı':'afterburner','Fişek':'Flares','Koşu silahı':'Run weapon',
 'Batarya':'Battery','üsse dönüyor':'returning to base','Hedef':'Target','Arıyor':'Searching','İniyor':'Landing','Kalkıyor':'Taking off','Yerde':'Landed','Alçak (ağaç hizası)':'Low (treetop)','Yük':'Cargo','asker':'soldiers',
 'Zırh ön / yan / arka':'Armor front / side / rear','Aktif koruma (APS)':'Active protection (APS)','dolduruluyor':'reloading','Reaktif zırh ön / yan':'Reactive armor front / side','Gövde siperi':'Hull-down',
 'Hasar':'Damage','Palet':'Tracks','Taret':'Turret','Optik':'Optics','Motor':'Engine','Yangın':'Fire','Sis perdesi':'Smoke screen','İkmal':'Supply','130 m içindeki dostlara':'to friendlies within 130 m',
 'Seçili mermi':'Selected shell','Tahrip':'HE','Sis':'Smoke','Görev':'Mission','Serbest atış':'Free fire','Bekliyor':'Waiting','Arazi':'Terrain','Tepe · görüş ve isabet artar':'Hill · better vision and accuracy',
 'Vadi · gizli, görüş kısa':'Valley · concealed, short vision','Düz':'Flat','ayakta':'alive','seçili':'selected','manga olarak yönetilir':'managed as a squad','panik':'panicking','Siperde':'In cover','manga':'squads',
 'Dron stoku':'Drone stock','Kontrol menzili':'Control range','Dron yönetimi':'Drone control','Oyuncu':'Player','Operatör (otomatik)':'Operator (auto)',
 // düğmeler
 'EMİR':'ORDERS','PİYADE':'INFANTRY','TOPÇU':'ARTY','UÇAK':'AIR','DRON':'DRONE','HELİ':'HELI','NAKLİYE':'CARGO','RADAR':'RADAR','ARAÇ':'VEHICLE',
 'Saldırı':'Attack','Hızlı':'Fast','Dur':'Stop','Cepheden çek':'Withdraw','Atış modu:':'Fire mode:','Dizilim:':'Formation:','İnisiyatif:':'Initiative:','Doğrudan':'Direct',
 'Çömel':'Crouch','Yat':'Prone','Oto':'Auto','Siper kaz':'Dig in','Binadan çık':'Exit building','Mevzilen':'Deploy','Toparlan':'Pack up','Ateş görevi':'Fire mission','Mermi: Tahrip':'Shell: HE','Mermi: Sis':'Shell: Smoke',
 'Atım ×':'Rounds ×','Serbest atış: açık':'Free fire: on','Serbest atış: kapalı':'Free fire: off','Saldırı koşusu':'Attack run','Silah: 30 mm':'Weapon: 30 mm','Silah: roket':'Weapon: rockets','Hassas vuruş':'Precision strike',
 'İrtifa: yüksek':'Altitude: high','İrtifa: alçak':'Altitude: low','Art yakıcı':'Afterburner','Üsse dön':'Return to base','Kalkış':'Take off','İniş':'Land','İndir (':'Unload (','Radarı kapat':'Radar off','Radarı aç':'Radar on',
 'Sis perdesi (':'Smoke screen (','Dron kaldır (':'Launch drone (','Yönetim: oyuncu':'Control: player','Yönetim: operatör':'Control: operator',
 // hava üssü ve deste
 'HAVA ÜSSÜ':'AIRBASE','Hazırlanıyor':'Preparing','Kalkışa hazır':'Ready for takeoff','Havada':'Airborne','İkmalde':'Rearming','Kayıp':'Lost','Saldırı koşusu':'Attack run','Takipte':'Chasing','yakıt':'fuel',
 'Yolda:':'En route:','KARA':'GROUND','HAVA SAVUNMA':'AIR DEFENSE','HAVA':'AIR','DENİZ':'NAVY','hava üssüne gelir.':'arrives at the airbase.','(içinde)':'(inside)','Taban':'Base','Rezerv tavanı':'Reserve cap','Düşman imhası değerinin %20\'si ayrıca':'plus 20% of destroyed enemy value',
 // ipuçları
 'DOĞRUDAN KONTROL —':'DIRECT CONTROL —','WASD sür, fareyle nişan al, sol tık ana silah':'WASD to drive, aim with mouse, left click main weapon',', sağ tık ikincil':', right click secondary','V veya Esc ile çık':'exit with V or Esc',
 'ATEŞ GÖREVİ — hedef noktaya tıkla · sağ tık iptal':'FIRE MISSION — click the target point · right click cancels',
 'SALDIRI KOŞUSU — başlangıçtan bitişe sürükle (tıklarsan uçağın geliş yönünde koşu) · sağ tık iptal':'ATTACK RUN — drag from start to end (click for a run along the approach) · right click cancels',
 'HASSAS VURUŞ — hedefe tıkla, Shift ile birden fazla hedef · sağ tık bitir':'PRECISION STRIKE — click a target, Shift for multiple · right click finishes',
 'SALDIRI HAREKETİ — hedef noktaya tıkla':'ATTACK MOVE — click the target point','HIZLI HAREKET — hedefe tıkla; birlikler ateş etmeden koşar':'FAST MOVE — click the destination; units run without firing',
 // olay akışı
 'hava üssüne ulaştı, hazırlanıyor':'reached the airbase, preparing','cepheye ulaştı':'reached the front','kalkışa hazır':'ready for takeoff','paniğe kapıldı, geri çekiliyor':'is panicking, falling back',
 'paletler koptu':'tracks destroyed','taret sıkıştı':'turret jammed','optik hasar gördü':'optics damaged','motor hasar gördü':'engine damaged','yangın çıktı':'caught fire','mürettebat sersemledi':'crew stunned',
 'mürettebat aracı terk etti':'crew bailed out','terfi etti:':'promoted:','Düşman':'Enemy','düşürüldü':'shot down','kaybedildi':'lost','imha edildi':'destroyed','yok edildi':'wiped out',
 'anti-radyasyon füzesi geliyor, radarı kapat (Y)':'anti-radiation missile incoming, turn radar off (Y)','tespit edildi':'spotted','Otomatik dizilim:':'Auto formation:','cepheden çekildi:':'withdrawn:',
 'Seçili uçakta koşu mühimmatı yok':'Selected aircraft have no run ordnance','Seçili manga araca sığmıyor':'Selected squad does not fit in the vehicle','Operatörlerin dron stoku boş':'Operators are out of drones',
 'Kamikaze dronları sen yönetiyorsun':'You control the kamikaze drones','Kamikaze dronları operatörler yönetiyor':'Operators control the kamikaze drones','ele geçirildi':'captured','düşmanın eline geçti':'fell into enemy hands',
 'yeniden mürettebat aldı':'re-crewed','batarya bitti, düştü':'battery depleted, crashed','batarya azaldı, üsse dönüyor':'battery low, returning to base','yakıt bitti, pilot atladı':'out of fuel, pilot ejected',
 'yakıt azaldı, üsse dön (U)':'fuel low, return to base (U)','mühimmat bitti, üsse dönüyor':'out of ammo, returning to base','kalkış yaptı':'took off','tahrip mermisi bitti':'out of HE shells','sis mermisi bitti':'out of smoke shells',
 'operatör kayıp, dron bağlantısı koptu':'operator lost, drone link severed','dron kontrol menzilini aştı, bağlantı koptu':'drone left control range, link severed','dron geri alındı':'drone recovered','savaş başladı':'battle started','birim cephede':'units at the front',
 'kaçış manevrası yaptı':'evaded','sis perdesi attı':'popped smoke','karşı batarya ateşinden kaçıyor':'evading counter-battery fire','karşı batarya ateşi açtı':'opened counter-battery fire','ateşten uzaklaştı':'moved away from fire',
 'ikmal için yaklaştı':'moved up to resupply','geri çekilip gizlendi':'pulled back into cover','yıkılmak üzere olan binayı terk etti':'left a collapsing building','siper aldı':'took cover','binaya girdi':'entered a building',
 'baskı altında geri çekildi':'fell back under fire','atış pozisyonu değiştirdi':'changed firing position',
 // oyun sonu ve menüler
 'ZAFER':'VICTORY','YENİLGİ':'DEFEAT','YENİDEN SAVAŞ':'FIGHT AGAIN','DEVAM ET':'CONTINUE','ORDU KUR':'BUILD ARMY','HIZLI BAŞLAT':'QUICK START','KONUŞLANMAYA DÖN':'BACK TO DEPLOYMENT','SAVAŞA BAŞLA':'START BATTLE','SAVAŞI BAŞLAT':'START BATTLE',
 'Kızıl kuvvetin direnci kırıldı.':'The Red Force\'s resistance is broken.','Cephe çöktü.':'The front has collapsed.','Siperleri kullan, kanatları koru ve topçunu bir gözcüyle besle.':'Use cover, guard your flanks and give your artillery a spotter.',
 'DÜŞMAN KOMUTANI':'ENEMY COMMANDER','HARİTA':'MAP','Nehir Hattı':'River Line','Kıyı Cephesi':'Coastal Front','Gemi yalnızca suya konabilir':'Ships can only be placed on water','Denize konamaz':'Cannot be placed in the sea','KAMİKAZE DRONLAR':'KAMIKAZE DRONES','Operatör yönetir':'Operators control','Ben yönetirim':'I control','DURAKLATILDI':'PAUSED',
 // ordu ekranı
 '‹ Geri':'‹ Back','Savaş öncesi kuvvet seçimi':'Pre-battle force selection','Taraflar':'Sides','Sen · komutan':'You · commander','Yapay zekâ':'AI','Rakip yapay zekâdır ve ordusunu aynı bütçeyle kendisi kurar':'The opponent is AI and builds its own army with the same budget',
 'BİRLİK ADI':'UNIT NAME','BÜTÇE':'BUDGET','ORDU PUANI':'ARMY POINTS','Birlik kategorileri':'Unit categories','SEÇİLİ ORDU':'SELECTED ARMY','Harcanan':'Spent','Kalan':'Remaining','Otomatik doldur':'Auto fill','Temizle':'Clear',
 'Kızıl Kuvvet aynı bütçeyle yapay zekâ tarafından kurulur. OP yalnızca başlangıç kuvvetini belirler; savaşta takviyeler KP ile çağrılır.':'The Red Force is built by the AI with the same budget. AP only sets your starting force; in battle, reinforcements are called with CP.',
 'birlik türü · çift tıkla veya + ile ekle':'unit types · double-click or + to add','birlik':'units','Orduda':'In army','· en fazla':'· max','Çıkar':'Remove','Orduya ekle':'Add to army','Silahsız birlik':'Unarmed unit',
 'Henüz birlik seçilmedi.':'No units selected yet.','Kategorilerden birlik ekle veya otomatik doldur.':'Add units from the categories or auto fill.','Silah':'Weapon','Menzil':'Range','Delme':'Penetration','Cephane':'Ammo',
 'Asker':'Soldiers','Toplam sağlamlık':'Total health','Hız':'Speed','Görüş':'Vision','Yeri görmez':'Cannot see ground','Zırh Ö / Y / A':'Armor F / S / R','Aktif koruma':'Active protection','atım':'rounds','Reaktif zırh':'Reactive armor',
 'Ön':'Front','Yan':'Side','Taşıma':'Transport','Gizlenme':'Stealth','Mevzilenme':'Setup','Var · iz bırakır':'Yes · emits','içinde':'carrying','dron':'drone',
 'Ordu boş: en az bir birlik seç':'Army is empty: select at least one unit','En az bir muharebe birliği gerekli: piyade, tanksavar, ZMA, mekanize piyade veya tank':'At least one combat unit required: infantry, anti-tank, IFV, mechanized infantry or tank','Bilinmeyen birlik':'Unknown unit',
 // konuşlanma
 'KONUŞLANMA SAFHASI':'DEPLOYMENT PHASE','KONUŞLANMA BÖLGESİ':'DEPLOYMENT ZONE','DÜŞMAN KONUŞLANMA BÖLGESİ':'ENEMY DEPLOYMENT ZONE','‹ Ordu ekranı':'‹ Army screen','BİRLİKLER':'UNITS','birim sahada':'units deployed','birim':'units',
 'Hava üssünde · savaş başlayınca kalkabilir':'At the airbase · can take off once the battle starts','geçersiz konum':'invalid position','geçersiz konumda:':'in invalid positions:','Yerleştirilemedi:':'Cannot place:','Döndürülemedi:':'Cannot rotate:',
 'Birliği sürükle: yer değiştir · Sağ tık + sürükle: yön · Q / E: döndür · Shift: çoklu seçim · Esc: iptal':'Drag a unit: move · Right-drag: facing · Q / E: rotate · Shift: multi-select · Esc: cancel',
 'Birliğe dokun ve sürükle: yer değiştir · boş alanı sürükle: haritayı kaydır':'Touch and drag a unit: move · drag empty ground: pan the map',
 'Konuşlanma bölgesi dışında':'Outside the deployment zone','Nehir veya sığ geçit üzerine konamaz':'Cannot be placed on the river or a ford','Bina üzerine konamaz':'Cannot be placed on a building','Başka bir birlikle çakışıyor':'Overlaps another unit',
 'Dümen':'Rudder','dümen hasar gördü':'rudder damaged','Nehir devriyesi · makineli tüfek, köprü altından geçer':'River patrol · machine gun, passes under bridges',
 'Dronlar: Oyuncu':'Drones: Player','Dronlar: Operatör':'Drones: Operator','Kamikaze dron yönetimi (⇧.)':'Kamikaze drone control (⇧.)',
 'Kuzey köprüsü':'North bridge','Köprü 1':'Bridge 1','Köprü 2':'Bridge 2','Köprü 3':'Bridge 3','Köprü 4':'Bridge 4','Köprü 5':'Bridge 5','Köprü 6':'Bridge 6','Köprü 7':'Bridge 7','Köprü 8':'Bridge 8','Orta köprü':'Center bridge','Güney köprüsü':'South bridge','yıkıldı':'destroyed','onarıldı':'repaired','Köprü onarımı':'Bridge repair','Tamam':'Done','YIKIK':'DESTROYED','ONARILIYOR':'REPAIRING','Yıkık köprüye sağ tık':'Right-click destroyed bridge',
 'Seçili ikmal kamyonları köprü başına gidip köprüyü onarır (tek kamyonla 45 sn, en fazla 3 kamyon hızlandırır). Köprüler topçu, havan, bomba ve ağır silahlarla yıkılabilir; yıkılırken üstündekiler düşer':'Selected supply trucks drive to the bridgehead and repair it (45 s with one truck, up to 3 trucks speed it up). Bridges can be destroyed by artillery, mortars, bombs and heavy weapons; units on them fall in',
 'Gemi yalnızca nehre konabilir':'Ships can only be placed on the river','Nehrin düşman yarısında':'In the enemy half of the river',
 // harita
 'TERK':'ABND','OBÜS?':'HOW?','HAVAN?':'MORT?','MENZİL DIŞI':'OUT OF RANGE','GÖZLEMLİ':'OBSERVED','GÖZLEMSİZ — dağılım yüksek':'UNOBSERVED — high spread','sn':'s','dk':'min',
 // yardım ekranı
 'Sol tık / sürükle':'Left click / drag','Asker veya araç seç. Shift ekler, çift tık tüm mangayı seçer':'Select soldiers or vehicles. Shift adds, double-click selects the whole squad',
 'Alt+tık':'Alt+click','Tek asker seç. Piyade normalde manga olarak seçilir, birlikte yürür, siper alır ve binaya girer':'Select a single soldier. Infantry is normally selected as a squad and moves, takes cover and enters buildings together',
 'Sağ tık':'Right click','Git. Siper, duvar, çit yakınına tıklarsan arkasına dizilirler; binaya tıklarsan içine girerler':'Move. Click near a trench, wall or hedge to line up behind it; click a building to enter it',
 'Ctrl+sağ tık · ⇧A':'Ctrl+right click · ⇧A','Saldırı hareketi: düşman görünce durup çatışır':'Attack move: stops and fights when enemies are seen','Düşmana sağ tık':'Right-click enemy',
 'Hedefi zorla (topçuda o noktaya 3 atım)':'Force target (artillery fires 3 rounds at that point)','Ayakta · çömel · yat · otomatik duruş':'Stand · crouch · prone · auto stance','Tüfekçi çukuru kaz · binadan çık':'Dig a foxhole · exit building',
 'Mevzilen / toparlan · ateş görevi (sonra hedefe tıkla)':'Deploy / pack up · fire mission (then click the target)','Mermi: tahrip / sis · atım sayısı · serbest atış':'Shell: HE / smoke · rounds per mission · free fire',
 'Sis perdesi (tank ve ZMA)':'Smoke screen (tank and IFV)','Doğrudan kontrol: WASD sür, fareyle nişan al, sol tık ana silah, sağ tık ikincil':'Direct control: WASD to drive, aim with mouse, left click main weapon, right click secondary',
 'Cepheden çek: birlik kendi kenarına gider, değerinin bir kısmı geri ödenir, kart geri gelir':'Withdraw: the unit goes to its own edge, part of its value is refunded and the card returns',
 'Dur · atış modu (serbest / sadece karşılık / ateş kes) · hepsini seç':'Stop · fire mode (free / return fire / hold fire) · select all','Hızlı hareket: birlikler ateş etmeden koşar':'Fast move: units run without firing',
 'Dizilim: Otomatik · Hat · Kama · Kol · Dağınık · Çevre savunması. Otomatikte birlik duruma göre kendisi seçer':'Formation: Auto · Line · Wedge · Column · Spread · Perimeter. In Auto the units choose based on the situation',
 'Virgül (,)':'Comma (,)','İnisiyatif: Temkinli · Aktif · Kapalı. Boştaki birlik emir verdiğin noktanın yakınında siper alır, ateş hattı arar, hasar alınca geri çekilir; asla düşmana doğru ilerlemez':'Initiative: Cautious · Active · Off. Idle units take cover near their ordered position, seek a line of fire and fall back when hit; they never advance toward the enemy',
 'Shift+sağ tık':'Shift+right click','Rota noktası ekle':'Add waypoint','Terk edilmiş araca sağ tık':'Right-click abandoned vehicle','Seçili piyadeden biri aracı ele geçirir (düşmanınkini de)':'One of the selected infantry takes over the vehicle (even an enemy one)',
 'ZMA\'ya sağ tık · U':'Right-click IFV · U','Piyade araca biner · araçtan indir':'Infantry boards · unload','Grup ata · grubu seç (iki kez basınca kamera gider)':'Assign group · select group (press twice to jump the camera)','Takviye çağır':'Call reinforcement',
 'WASD · oklar · teker':'WASD · arrows · wheel','Kamera kaydır · yakınlaştır, orta tuşla sürükle':'Pan camera · zoom, drag with middle button','Hava üssü paneli':'Airbase panel','Hazır uçağı kalkışa gönder, havadaki uçağa tıklayınca seçilir':'Send a ready aircraft up; click an airborne aircraft to select it',
 'Saldırı koşusu: haritada başlangıçtan bitişe sürükle (top, roket veya halı bombardımanı)':'Attack run: drag from start to end on the map (cannon, rockets or carpet bombing)','Hassas vuruş: lazer güdümlü bomba hedefleri, Shift ile birden fazla':'Precision strike: laser-guided bomb targets, Shift for multiple',
 'İrtifa (uçak, helikopter) veya radar aç/kapat · art yakıcı · üsse dön / askerleri indir':'Altitude (aircraft, helicopter) or radar on/off · afterburner · return to base / unload troops','Dronlar':'Drones',
 'Keşif dronu ağaçların üstünden geniş alan görür ve topçuya gözcülük yapar. Kamikaze dronlar 460 m içindeki hedefe kendiliğinden dalar; düşmana sağ tıklayarak hedef verebilirsin. Bataryaları biter, U ile üsse dönüp şarj olurlar':'Recon drones see a wide area over the trees and spot for artillery. Kamikaze drones dive on targets within 460 m by themselves; right-click an enemy to assign one. Their batteries run out; press U to return and recharge',
 'Dron operatörü · .':'Drone operator · .','Kamikaze dronları 1400 m içinde yönetir. "Operatör yönetir" modunda hedefi kendisi seçer (zor durumdaki dostlar ve ele geçirilen noktalar önce). "Ben yönetirim" modunda nokta (.) ile dron kaldırıp düşmana sağ tıklarsın. Operatör ölür veya menzil aşılırsa bağlantı kopar':'Controls kamikaze drones within 1400 m. In "Operators control" mode they pick targets themselves (friendlies in trouble and contested points first). In "I control" mode press period (.) to launch a drone and right-click an enemy. The link breaks if the operator dies or the range is exceeded',
 'Tepeler görüşü ve isabeti artırır, sırtlar görüşü keser, vadiler gizler ve görüşü kısaltır, yokuş yukarı yavaşlatır':'Hills improve vision and accuracy, ridges block line of sight, valleys conceal and shorten vision, uphill slows movement',
 'Keşif uçağı · SİHA':'Recon aircraft · UCAV','Diğer uçaklar yerdeki hedefleri göremez; bu ikisi görür. Silahlı İHA gördüğü hedefe akıllı mühimmat atar. Görülüp kaybolan düşmanların son konumu 30 sn soluk işaretle kalır':'Other aircraft cannot see ground targets; these two can. The armed UAV fires smart munitions at what it sees. Enemies that drop out of sight leave a faded marker for 30 s',
 'Helikopter iniş / kalkış. Üste veya ikmal kamyonu yanına inen helikopter ikmal alır':'Helicopter land / take off. Helicopters landing at base or next to a supply truck resupply','Helikoptere sağ tık':'Right-click helicopter','Seçili piyade nakliye helikopterine biner':'Selected infantry boards the transport helicopter',
 'Boşluk':'Space','Duraklat':'Pause','Dokunmatik':'Touch','Dokun: seç / git · iki kez dokun: manga · sürükle: kaydır · iki parmak: yakınlaştır':'Tap: select / move · double tap: squad · drag: pan · two fingers: zoom',
 'Her asker ve araç ayrı bir birliktir. Siperler yönlüdür: kum torbası veya duvar sadece karşı taraftan gelen ateşe karşı korur, kanattan vurulan asker açıktadır. Yoğun ateş altındaki birlik baskılanır; dayanamazsa paniğe kapılıp geri kaçar. Tecrübe kazanan birlik terfi eder. Tank mermileri yakından daha çok deler, roket ve füzeleri ise reaktif zırh ve aktif koruma sistemi durdurabilir. Ağır hasar alan aracın mürettebatı aracı terk edebilir; terk edilmiş araç herkes tarafından ele geçirilebilir. Obüs ve havan mevzilenmeden ateş edemez; hedefi bir gözcü görüyorsa ve atışlar aynı noktaya devam ettikçe isabet artar. Düşman topçusu ateş ettiğinde konumu kırmızı işaretle belirir. Uçaklar haritanın dışındaki hava üssünden kalkar, yakıtları sınırlıdır ve mühimmat ile fişek almak için üsse dönmeleri gerekir. Kendi başlarına yerdeki hedefleri göremezler. Radarlı hava savunması uçağı uzaktan görür ama radarı açıkken anti-radyasyon füzelerine hedef olur. Helikopterler alçakta ağaç ve bina arkasına saklanabilir. Harita bir nehirle ikiye bölünür; kara birlikleri yalnızca köprülerden ve sığ geçitlerden karşıya geçer. Tepeler görüşü ve isabeti artırır, bataklık araçları yavaşlatır. Fabrika, havaalanı, ikmal deposu, radar tepesi ve şehir merkezi gibi stratejik bölgeler ele geçirene gelir ve özel avantaj sağlar; noktaların üzerine gelince ne verdiği görünür. Takviyeler cepheye birkaç saniyede ulaşır, her karttan sınırlı sayıda vardır, cephedeki birlik sayısı arttıkça bakım gideri geliri düşürür. Daha fazla puanı tutan taraf rakibin direncini eritir.':
  'Every soldier and vehicle is a separate unit. Cover is directional: sandbags and walls only protect against fire from the far side, and a soldier hit from the flank is exposed. Units under heavy fire become suppressed; if they cannot hold, they panic and run. Units gain experience and get promoted. Tank rounds penetrate more at close range, while rockets and missiles can be stopped by reactive armor and active protection. The crew of a badly damaged vehicle may bail out; an abandoned vehicle can be captured by anyone. Howitzers and mortars must deploy before firing; accuracy improves when a spotter sees the target and as fire continues on the same point. Enemy artillery positions are marked in red when they fire. Aircraft take off from an off-map airbase, have limited fuel and must return to rearm and reload flares. They cannot see ground targets on their own. Radar air defense spots aircraft from far away but becomes a target for anti-radiation missiles while the radar is on. Helicopters can hide low behind trees and buildings. A river splits the map; ground units can only cross at bridges and fords. Hills improve vision and accuracy; swamps slow vehicles. Strategic sites such as the factory, airfield, supply depot, radar hill and city center give income and special bonuses to whoever holds them; hover a point to see what it gives. Reinforcements reach the front in a few seconds, each card is limited, and upkeep reduces income as your frontline force grows. The side holding more points wears down the enemy\'s resistance.',
};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const MAP=new Map();
for(const [k,v] of Object.entries(PH))MAP.set(k,v);
for(const [k,v] of Object.entries(PH)){const u=k.toLocaleUpperCase('tr'),l=k.toLocaleLowerCase('tr');if(!MAP.has(u))MAP.set(u,v.toUpperCase());if(!MAP.has(l))MAP.set(l,v.toLowerCase())}
const RX=new RegExp('(?<![\\p{L}])('+[...MAP.keys()].sort((a,b)=>b.length-a.length).map(esc).join('|')+')(?![\\p{L}])','gu');
const memo=new Map();
/* ekrana çıkan metni seçili dile çevirir (Türkçede aynen döner) */
function tr(s){if(lang!=='en'||s==null||s==='')return s;s=String(s);let r=memo.get(s);if(r!==undefined)return r;
  r=s;for(const [re,rep] of PAT)r=r.replace(re,rep);r=r.replace(RX,m=>MAP.get(m));
  if(memo.size>4000)memo.clear();memo.set(s,r);return r}
/* sayfadaki sabit metinleri ve title/aria-label özniteliklerini bir kez çevirir */
function trDom(root){if(lang!=='en')return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);for(let n=w.nextNode();n;n=w.nextNode()){const t=n.nodeValue,s=t.trim();if(s)n.nodeValue=t.replace(s,tr(s))}
  for(const el of root.querySelectorAll('[title],[aria-label]'))for(const a of ['title','aria-label'])if(el.hasAttribute(a))el.setAttribute(a,tr(el.getAttribute(a)))}

export {lang,setLang,tr,trDom};
