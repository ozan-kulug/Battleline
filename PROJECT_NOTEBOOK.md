# Battleline (Cephe Hattı) — Project Notebook

Kalıcı proje defteri. Kod değişiklikleri, test sonuçları ve önemli kararlar buraya kaydedilir (kurallar: [AGENTS.md](AGENTS.md), plan: [ROADMAP.md](ROADMAP.md)).
Son güncelleme: 2026-10-29 · Güncelleyen: Antigravity

## 1. Amaç

Tarayıcıda çalışan, gerçek zamanlı taktik savaş oyunu. Oyuncu (Mavi Kuvvet, taraf 0) yapay zekâya (Kızıl Kuvvet, taraf 1) karşı oynar. Her asker ve araç ayrı birimdir; siper, moral/baskı, zırh delme, topçu, hava, dron, ekonomi ve stratejik noktalar simüle edilir. Hedef: Broken Arrow benzeri savaş öncesi ordu kurma ve konuşlanma akışıyla oynanabilir bir oyun.

Depo: `https://github.com/ozan-kulug/Battleline` (origin). Ana dal: `master`.

## 2. Mimari (özet)

- **Teknoloji:** Saf HTML/CSS/ES modülleri; derleme adımı ve bağımlılık yok. Yerel HTTP sunucusu gerekir (`file://` çalışmaz). Ayrıntılı dosya yapısı: [README.md](README.md).
- **Giriş ve döngü:** `js/main.js` → `game.js` (`newGame`, `startMatch`, `beginBattle`) → `game-loop.js` (`simStep` yalnızca `state.running` iken ilerler, `frame` çizer).
- **Durum:** `js/state.js` içindeki tek `state` nesnesi (çok modülün yazdığı değerler). Sabitler ve veri `js/config.js` (`DEF`, `SQUADS`, `ARMYCAT`, `ROLE`, …).
- **Katmanlar:** `world/*` (arazi, siper, bina) → `systems/*` (savaş, hareket, görüş, hava, topçu, ekonomi, emirler, inisiyatif, YZ, ordu, konuşlanma, dron) → `renderer.js` → `ui/*` → `input.js` → `main.js`. Döngüsel import yok (betikle denetleniyor).
- **Akış:** Başlangıç ekranı → Ordu kurma (`ui/army-builder.js`) → Konuşlanma (`state.phase='deploy'`, `ui/deploy.js`) → Savaş → Zafer/Yenilgi → tekrar ordu ekranı. Geliştirici kısayolu: `?hizli` (doğrudan varsayılan kuvvetle savaş).
- **Dil:** `js/i18n.js`. Kaynak metinler Türkçe; ekrana çıkan metin `tr()` ile çevrilir. İngilizce varsayılan, menüden veya `?lang=tr|en` ile değişir.
- **Kartlar:** `SQUADS` dizisinin dizinleri deste, kısayollar ve varsayılan başlangıç tarafından kullanılır; yeni kart **daima sona** eklenir.

## 3. Tamamlanan önemli özellikler

| Özellik | Commit | Doğrulama |
|---|---|---|
| Baseline (mevcut oyunun Git'e alınması) | `40c0000` | — |
| Savaş öncesi ordu kurma ekranı (OP bütçesi, kategoriler, YZ ordusu `autoArmy`) | `4826425` | Claude: tarayıcı + simülasyon (bkz. §5) |
| Konuşlanma safhası (bölgeler, sürükleme, yön, doğrulama) | `9b09af2` | Claude: tarayıcı + simülasyon |
| W A S D kamera (eski komutlar Shift'e taşındı) | `ace3086` | Claude: tarayıcı |
| Sırtlar, vadiler, araziye bağlı görüş hattı, yokuş yavaşlaması | `aa46d01` | Claude: tarayıcı + LOS ölçümleri |
| Radar Tepesi gözetleme düzeltmesi | `7e8ad0e` | Claude: LOS ölçümü |
| Piyadenin manga olarak seçilmesi, dizilmesi, inisiyatifi | `eb701f6` | Claude: simülasyon |
| Dron Operatör Timi (otomatik/oyuncu modu, YZ) | `0e33ce5` | Claude: simülasyon |
| Takılma sayacı düzeltmesi | `9961633` | Claude: simülasyon |
| Gemi altyapısı (nehirde hareket, köprü altı, konuşlanma, çizim) | `a3520a3` | Claude: simülasyon (test botuyla) |
| İngilizce dil desteği | `aa972d1` | Claude: tarayıcı metin taraması |
| Oynanabilir Devriye Botu (`bot`) | `79c8556` | Antigravity: 8 senaryo ES modül + DOM/Canvas simülasyonu (7/8 geçti, Senaryo 7'de `aiBuy` ağırlık sorunu bulundu; bkz. §5 ve §6) |

## 4. Son geliştirmeler ve kararlar

- **Oynanabilir Devriye Botu (`79c8556`).** Dosyalar: `js/config.js`, `js/systems/units.js`, `js/systems/orders.js`, `js/systems/unit-update.js`, `js/systems/movement.js`, `js/systems/combat.js`, `js/ui/panels.js`, `js/systems/ai.js`, `js/i18n.js`, `README.md` (10 dosya, +18/−14). İçerik:
  - `SQUADS` sonuna `bot` kartı (120 KP/OP, `cat:'deniz'`), `AVE` ve `ROLE` satırı; Deniz sekmesi ve Deniz Kuvvetleri kategorisi otomatik görünür.
  - Gemi üssü = nehrin kendi ucu (`inBase`): ikmal, onarım, "Cepheden çek" çıkışı.
  - `separate`: gemi ile kara birlikleri itişmez/ezmez (köprü altından geçiş).
  - Kritik hasar metni botta "dümen hasar gördü".
  - YZ en fazla iki bot alır (düşük öncelik); hareket/saldırı mevcut nehir devriyesi (`aiSupport`).
- **Kararlar:**
  - Oyuncu her zaman taraf 0'dır; ordu ekranında Kızıl Kuvvet seçilemez (kod buna göre yazılmış).
  - OP (ordu puanı) yalnızca başlangıç kuvvetini belirler; KP ekonomisi ve deste ayrıdır.
  - Konuşlanma bölgesi haritadan çıkarılır: kendi kenarından en yakın stratejik noktaya 40 m kalana kadar.
  - Tüm harf tuşları dolu olduğu için W/A/S/D'nin eski komutları Shift ile çalışır.
  - Tepe ve sırt yamaçları koni biçimindedir (tepeden etek görülsün diye); vadiler içbükeydir.
  - Tarayıcı testlerini Antigravity yapar (bkz. [AGENTS.md](AGENTS.md)).

## 5. Test sonuçları

Projede otomatik test altyapısı yok. Statik kontroller elle çalıştırılan betiklerle yapılır: ES modülü olarak sözdizimi denetimi (`node --input-type=module --check`), döngüsel import ve isimli import/export eşleşmesi.

**Doğrulananlar (Claude, 2026-10-29):**
- Ordu kurma, konuşlanma, savaş, oyun sonu ve yeniden başlatma akışları tarayıcıda; konuşlanmada simülasyonun durduğu ölçüldü.
- Manga hareket bütünlüğü, siper yerleşimi, manga inisiyatifi, dron operatörü (otomatik ve oyuncu modu, geri alma, bağlantı kopması): oyun içi `simStep` ile.
- Test botu nehrin bir ucundan diğerine üç köprünün altından geçip döndü, karaya çıkmadı (simülasyon).
- İngilizce: 964 farklı ekran metni tarandı, çeviri dışı kalan yalnızca dil seçme satırı; 1366×768'de buton taşması yok.
- Devriye Botu değişiklikleri: 39 modül sözdizimi temiz, döngü yok, 650 isimli import eksiksiz; `config.js` tarayıcısız yüklenip bot kartı doğrulandı.

**Doğrulananlar (Antigravity, 2026-10-29 — Node v24 ES modül simülasyonu + DOM/Canvas mock ile 8 senaryo):**
- **Senaryo 1 (Ordu kurma ve konuşlanma — GEÇTİ):** `ARMYCAT` içinde `naval` (`Deniz Kuvvetleri` → `['bot']`) tanımlı. Tek başına `checkArmy(['bot'], 1000)` muharebe birliği kuralıyla reddedildi; `checkArmy(['inf','bot','bot'], 1000)` geçti (`cost: 310`). `spawnArmy` oyuncu botlarını `(2177, 2880)` ve `(2173, 2770)`, YZ botunu `(2623, 120)` noktasına hatasız (`placeErr === null`) yerleştirdi. `ui/deploy.js` (`depDown`/`depMove`/`depUp`) sürükleme testinde karaya `(400, 1500)` bırakma `'Gemi yalnızca nehre konabilir'` (`Cannot place: Ships can only be placed on the river`), nehrin düşman yarısına (`x > W/2`, ör. `y = 1900` veya `y = 600`) bırakma `'Nehrin düşman yarısında'` (`Cannot place: In the enemy half of the river`) ile reddedilip eski konuma döndü; nehrin kendi yarısına `(2234, 2600)` bırakma kabul edildi.
- **Senaryo 2 (Savaşta Deniz sekmesinden bot alma — GEÇTİ):** `buildDeck()` `[data-tab="deniz"]` sekmesini görünür yaptı (`hidden === false`) ve `#card-bot` kartını oluşturdu (`120 KP`, `av: 3`, `eta: 8`). `deploy(0, 24)` çağrısı `8 sn` sonra `arrive(0, 24)` ile botu nehrin güney ucundan `(2210, 2980)` sokup `(2172, 2760)` hedefine yönlendirdi.
- **Senaryo 3 (Üç köprünün altından geçiş ve karaya çıkmama — GEÇTİ):** `y = 2760` konumundaki bota `rightOrder(riverX(200), 200, false, false)` emri verildi; bot `49.6 sn` (`991` adım) içinde `y = 2380`, `1500` ve `620` köprülerinin üçünün de altından geçerek `(2628, 202)` noktasına ulaştı, `0` kare nehir dışına çıktı (`riverAt(x,y,0)` her adımda `true`).
- **Senaryo 4 (Köprü üstünde kara birlikleri varken altından geçiş — GEÇTİ):** Orta köprü `(riverX(1500), 1500)` üzerinde 0 ve 1. taraftan toplam 12 piyade dururken bot `y = 1650 → 1352` hattından geçti; `separate()` gemi-kara çiftlerini atladığı için (`if(!a.d.naval!==!b.d.naval)continue`) ezme veya itişme olmadı (`12/12` asker sağlam).
- **Senaryo 5 (Saldırı hareketi, batırılma, enkaz bırakmama ve kart iadesi — GEÇTİ):** Bot `12,7 mm makineli` ile menzildeki düşman piyadesine ateş açıp öldürdü (`HP 20 → 0`). Tank topu hasarıyla (`dmg: 200, ap: 13`) batırıldığında `kill()` `state.marks` ve `state.covers` (`wreck`) sayısını artırmadı (`0` enkaz), `state.retQ` dizisine `{side: 0, idx: 24, t: state.time + 90}` iade kaydı eklendi.
- **Senaryo 6 (Nehir üssünde ikmal/onarım ve Cepheden çek — GEÇTİ):** `y = H - 120` (`inBase(bot) === true`) konumunda hasarlı bot (`hp: 80/160`, dümen hasarı `trk: 10`) `5 sn` içinde onarım (`hp: 102.5`, `trk: 0`) ve ikmal aldı. `exfilSel()` (`M`) ile `exfil = true` ve `dest = (2210, 2980)` atandı; `y > H - 40` olunca `exfilOut` botu çıkardı (`gone = true`), kart stoğunu `2 → 3` yaptı ve `+48 KP` iade etti.
- **Senaryo 7 (Uzun maçta YZ'nin bot alması ve nehir devriyesi — KISMEN GEÇTİ / HATA BULUNDU):** YZ'ye başlangıçta bot verildiğinde `aiSupport` (`js/systems/ai.js:144`) botu odak noktasının nehir hizasında (`(2623, 120) → (2196, 1219)`) devriye gezdirdi. **Ancak 10 ayrı 300 saniyelik maç simülasyonunda YZ `aiBuy` ile hiç bot satın almadı (`0/10`) ve `autoArmy` (`AI_TEMPLATE`) içinde de `'bot'` yok** (ayrıntı §6'da).
- **Senaryo 8 (Türkçe ve İngilizce bot metinleri — KISMEN GEÇTİ / KRİTİK İNGİLİZCE HATA BULUNDU):** `Devriye Botu` ↔ `Patrol Boat`, `BOT` ↔ `PB`, `12,7 mm makineli` ↔ `12.7 mm MG`, `Deniz Kuvvetleri` ↔ `Navy`, `DENİZ` ↔ `NAVY`, `Dümen 12 sn` ↔ `Rudder 12 s`, `Devriye Botu: dümen hasar gördü` ↔ `Patrol Boat: rudder damaged`, `Nehir devriyesi · makineli tüfek, köprü altından geçer` ↔ `River patrol · machine gun, passes under bridges` metinleri doğrulandı. **Ancak gerçek Chrome tarayıcı testinde İngilizce modda (`?lang=en`) `i18n.js` içindeki `'BOT':'PB'` sözlük kaydının küçük harf türevi (`'bot' → 'pb'`) nedeniyle `ui/army-builder.js` içindeki `data-add="bot"`, `data-rem="bot"` ve `data-k="bot"` özniteliklerinin `tr()` tarafından `"pb"` olarak değiştirildiği ve İngilizce modda `+`/`−`/`Add to army` düğmelerine tıklanınca `Uncaught TypeError: Cannot read properties of undefined (reading 'plane')` hatasıyla ordu ekranının çöktüğü tespit edildi** (ayrıntı §6'da).

**Doğrulananlar (Antigravity, 2026-10-29 — Gerçek Chrome Headless `375×667` & Uzun Maç Denge Simülasyonları):**
- **Dokunmatik konuşlanma testi (`375×667`, `PointerEvent` `pointerType:'touch'`):**
  - `#depList` üzerinden birlik seçimi ve tek parmakla kara birliğini geçerli alana sürükleme (`(360, 516) → (427, 460)`) **GEÇTİ**.
  - Tek parmakla Devriye Botunu nehir içinde geçerli noktaya sürükleme (`(2177, 2880) → (2208, 2650)`) ve karaya bırakmanın reddedilmesi (`Cannot place: Ships can only be placed on the river`) **GEÇTİ**.
  - Boş zeminde tek parmakla harita kaydırma (`cam.x: -63 → -120`) ve boş zeminde iki parmakla yakınlaştırma (`pinch zoom`, `cam.z: 0.45 → 0.81`) **GEÇTİ**.
  - **Bulgu 1 (İki parmak yakınlaştırma çakışması — `js/input.js:56-59`):** Konuşlanmada ilk parmak bir birliğin üzerine değdiğinde `depDown(e)` `true` döndüğü için ilk parmak `touches` haritasına kaydedilmiyor; ikinci parmak ekrana konduğunda `dep.drag` sıfırlanıyor fakat `touches.size` `2` yerine `1` kaldığı için yakınlaştırma (`pinch`) çalışmıyor, bunun yerine kamera tek parmak kaydırmasına geçiyor.
  - **Bulgu 2 (Dokunmatikte yön verme / döndürme eksikliği — `js/ui/deploy.js:49,89`):** Birlik yönü değiştirme (`e.button === 2` sağ tık sürükleme) ve grup döndürme (`KeyQ` / `KeyE`) yalnızca fare/klavye ile tetiklenebiliyor; dokunmatik arayüzde döndürme düğmesi veya hareketi yok.
- **Telefon genişliğinde (`375×667`) İngilizce taşma kontrolü (`?lang=en`):**
  - **Başlangıç / Yardım ekranı (`#ov`):** `0` taşma.
  - **Ordu kurma ekranı (`#army`):** Tüm kategoriler ve 25 birlik kartı tek tek seçilerek tarandı → `0` taşma.
  - **Konuşlanma ekranı (`#dep`):** Yatay taşma yok (`#depBar` `left: 3, right: 372`, `#depR` `left: 181, right: 363`); ancak `375×667` dikey yüksekliğinde `#top` (`8..203 px`) ve `#depBar` (`211..314 px`) üst yarıyı, `#depR` (`322..430 px`) ve `#selp` alt yarıyı kapladığı için harita üzerinde birlik sürüklemeye yalnızca sol orta şeritte dar bir boşluk kalıyor.
  - **Savaş HUD'u (`#top`, `#bottom`, `#deckw`, `#tabs`, `#selp`):** İngilizce sekme (`GROUND`, `AIR DEFENSE`, `AIR`, `NAVY`) ve metin taşması yok. Yalnızca bilinen `#selp` kutu modeli sorunu nedeniyle (`css/responsive.css` içinde `#selp { width: 100% }` + `css/panels.css` içindeki `padding: 8px 10px` ve `1px` kenarlık, `box-sizing: border-box` olmadığından) `#selp` genişliği `355 px` yerine `377 px` (`left: 10, right: 387`) olup ekranın sağından `12 px` taşıyor.
- **Yeni birimlerin denge testi (`dronop` ve `bot` — 6× 420 sn uzun maç simülasyonu):**
  - **Dron Operatör Timi (`dronop`, 130 KP/OP, stok 5):** 6 maçta sahaya sürülen 12 `dronop` timi (toplam maliyet `1560 KP`) toplam **96 kamikaze dron** fırlattı; bunların **86'sı (%89,6)** hedefine tam isabet etti, yalnızca **1 tanesi (%1,0)** vurularak/bağlantı koparak düştü. Toplam **78 düşman birimi** imha edildi (**`5591 KP`** değerinde hasar = tim başına ortalama **`466 KP`**, yani kendi maliyetinin **`3,58 katı`** getiri) ve operatörlerin **%83,3'ü (20/24)** maç sonuna kadar hayatta kaldı. **Denge bulgusu:** Dron operatörü mevcut haliyle aşırı güçlü (OP); hem yer birliklerinin hedef seçiminde uçan dronlara `d * 1.6` cezası vermesi (`js/systems/combat.js:55`) hem de dron isabet çarpanının çok düşük olması (`0.45 * 0.4 * 0.85 = 0.153`, `combat.js:68`) nedeniyle dronlar neredeyse hiç vurulamıyor, ayrıca ikmal kamyonu/deposu yanında sınırsız dron üretiyor (`economy.js:23`).
  - **Devriye Botu (`bot`, 120 KP/OP, stok 3):** 6 maçta sahaya sürülen 24 botun **21'i (%87,5)** battı; ortalama hayatta kalma süresi **89 sn** (çoğu `61–76 sn` aralığında merkez köprü çatışmasına girer girmez tank/ZMA/roketatar/FPV dron ateşiyle battı). Ayrıca aynı noktaya (`orderGroup`) gönderilen 2 dost botun birbirine **`0.8 m`** kadar yaklaşıp üst üste bindiği doğrulandı.

**Doğrulanmamış:**
- Eş yükselti çizgilerinin son görünümü (belirginleştirildikten sonra insan gözüyle incelenmedi).

## 6. Bilinen sorunlar ve riskler

- **İngilizce modda (`?lang=en`) Ordu Kurma ekranında Devriye Botu ekleme/seçme çökmesi (`js/i18n.js:57,181`, `js/ui/army-builder.js:44,53,58-59`):**
  - `i18n.js` içindeki `PH` sözlüğünde `'BOT':'PB'` tanımlı; 181. satırdaki otomatik küçük harf üretimi `MAP` içine `'bot' → 'pb'` ekliyor.
  - `ui/army-builder.js` içinde `el.innerHTML = tr(...)` tüm HTML metni üzerinde çalıştığı için `data-add="bot"`, `data-rem="bot"` ve `#armyRows` içindeki `data-k="bot"` özniteliklerini İngilizce modda `data-add="pb"`, `data-rem="pb"`, `data-k="pb"` olarak değiştiriyor.
  - Kullanıcı İngilizce modda Devriye Botu kartındaki `+`, `−`, `Add to army` düğmelerine veya seçili ordu listesindeki satırına tıkladığında `ab.pick = 'pb'` atanıyor, `sqOf('pb')` `undefined` döndüğü için `members(S)` (`army-builder.js:20`) `Uncaught TypeError: Cannot read properties of undefined (reading 'plane')` hatası fırlatarak ordu kurma ekranını bozuyor.
- **YZ savaşta hiç bot satın almıyor (`js/systems/ai.js:175-185`, `js/systems/army.js:10`):**
  - `aiBuy` içinde `CAT.bot = 'arm'` olarak tanımlı ve `kw.bot` en fazla `.45` (`state.time > 40 && cnt('bot') < 1`). Aynı `'arm'` kategorisindeki `ifv` (`kw >= 1.1`, maliyet `160`) ve `tank` (`kw >= 1.0`, maliyet `280`) aynı `adj('arm')` çarpanını alır.
  - Skor formülünde `(kw[S.k]||0) * adj(S.k) / Math.pow(S.cost, .35) * (.85 + R()*.3)`: botun alabileceği **maksimum** skor (`0.45 / 120^0.35 * 1.15 = 0.097 * adj('arm')`), tankın **minimum** skorundan (`1.0 / 280^0.35 * 0.85 = 0.118 * adj('arm')`) ve ZMA'nın **minimum** skorundan (`1.1 / 160^0.35 * 0.85 = 0.158 * adj('arm')`) matematiksel olarak her zaman düşüktür; ayrıca ilk 6 yedek tercihe (`sc.slice(0,6)`) de giremez.
  - Ek olarak `js/systems/army.js:10` içindeki `AI_TEMPLATE` dizisinde `'bot'` bulunmadığından `autoArmy` başlangıç ordusuna da bot eklemez.
- **Kıvrımlı nehirde konuşlanma yarısı kuralı (`js/systems/deployment.js:18`):** `placeErr` gemiler için `u.side ? x < W/2 : x > W/2` kontrolü yapıyor. Nehir `W/2` (`x = 2400`) etrafında sinüs eğrisi çizdiği için, Mavi Kuvvet (`side = 0`) adına nehrin doğuya kıvrıldığı `y ∈ [1500, 2375]` kesimi (`riverX(y) > 2400`) kendi güney yakasına yakın olsa bile `'Nehrin düşman yarısında'` hatası veriyor; buna karşılık kuzeydeki `y ∈ [625, 1500]` kesimi batıya kıvrıldığı için (`riverX(y) < 2400`) geçerli sayılıyor. Gemi konuşlanma kontrolünün `x > W/2` yerine `y < H/2` (veya `inDeployZone`) esaslı olması gerekebilir.
- **Dokunmatik konuşlanmada iki parmak yakınlaştırma (`pinch`) ve döndürme eksikliği (`js/input.js:56-59`, `js/ui/deploy.js:49,89`):** İlk parmak bir birliğin üzerine değdiğinde `depDown` olayı tükettiği için parmak `touches` haritasına yazılmıyor; ikinci parmak konduğunda yakınlaştırma yerine tek parmak kamera kaydırması başlıyor. Ayrıca dokunmatik ekranda birlik yönü/döndürme (`Q`/`E` veya sağ tık sürükleme) için arayüz düğmesi yok.
- **Dron Operatör Timi (`dronop`) uzun maçlarda aşırı güçlü (`js/systems/drones.js`, `js/systems/combat.js:55,68`, `js/systems/economy.js:23`):** 130 KP maliyetli tim ortalama 466 KP düşman birliği imha ediyor (%89,6 dron isabeti, %1 düşürülme oranı). Yer birliklerinin dronları hedeflemede `d * 1.6` öncelik cezası alması ve hareketli drona karşı `0.153×` isabet çarpanı nedeniyle dronlar vurulamıyor.
- **375 px genişlikte seçim paneli (`#selp`) sağdan 12 px taşıyor (`css/responsive.css:5`, `css/panels.css:24`):** `box-sizing: border-box` olmadığı için `width: 100%` + `20 px` iç boşluk + `2 px` kenarlık = `377 px` (`right: 387 px > 375 px`).
- Bot kendi başına geri çekilmez (inisiyatifin güvenli nokta kontrolü suyu reddeder; uzun maçlarda botların %87,5'i ortalama 89 sn içinde batıyor).
- Birden çok bota emir verilince dizilim noktaları dar nehirde üst üste düşüyor (simülasyonda iki dost bot `0.8 m` mesafeye kadar üst üste bindi).
- Panik ve moral asker başınadır; manga mantığı askerleri yalnızca birlikte tutar.
- Bu bilgisayarda Python kurulu değil; README'deki `python -m http.server 8000` burada çalışmaz (Node sunucusu veya `npx serve .` kullanıldı).
- Doğrulanmadı: depodaki uzak dalda (`origin`) başka değişiklik olup olmadığı yalnızca `master` = `origin/master` olarak görüldü.

## 7. Sonraki adımlar

1. Devriye Botu testlerinde bulunan `aiBuy` ağırlığı / `AI_TEMPLATE` ve kıvrımlı nehir konuşlanma yarısı (`placeErr`) sorunlarını düzeltmek.
2. Botun ateş altında geri çekilme davranışı ve çoklu bot dizilimi.
3. Yeni birimlerin (dron operatörü, bot) uzun maç denge testleri ve mobil/dokunmatik kontrolleri.
4. Sonraki gemi sınıfları (füze botu, çıkarma gemisi) — ROADMAP'e bakın; henüz başlanmadı.

## 8. İlerleme günlüğü

| Tarih | Kim | Ne |
|---|---|---|
| 2026-10-29 | Claude | Proje incelendi; Git deposu kuruldu, baseline `40c0000`. |
| 2026-10-29 | Claude | Ordu kurma ekranı `4826425`; ardından konuşlanma safhası `9b09af2`. |
| 2026-10-29 | Claude | WASD kamera, arazi (sırt/vadi/LOS), manga kontrolü, dron operatörü, gemi altyapısı ve iki hata düzeltmesi; 7 ayrı commit (`ace3086`…`a3520a3`). |
| 2026-10-29 | Claude | İngilizce dil desteği `aa972d1`. |
| 2026-10-29 | Kullanıcı | Antigravity projeye bağlandı; iki ajan birlikte çalışıyor. `origin` uzak deposu tanımlı (kimin eklediği ve ne zaman push edildiği doğrulanmadı; görülen: `master` = `origin/master` = `aa972d1`). |
| 2026-10-29 | Claude | Oynanabilir Devriye Botu kodlandı; statik kontroller geçti; commit edilmedi, tarayıcı testi Antigravity'de. |
| 2026-10-29 | Claude | PROJECT_NOTEBOOK.md, ROADMAP.md, AGENTS.md oluşturuldu. |
| 2026-10-29 | Codex | AGENTS.md'ye Codex'in planlama, bağımsız inceleme ve dokümantasyon sorumlulukları eklendi; ROADMAP görevi tamamlandı. Test çalıştırılmadı (yalnızca dokümantasyon düzenlemesi). |
| 2026-10-29 | Codex | Kullanıcı isteğiyle Antigravity'nin görev tanımına test bulgularına yönelik atanmış veya açıkça istenmiş sınırlı kod geliştirme/hata düzeltme işleri eklendi. ROADMAP güncellendi; test çalıştırılmadı. |
| 2026-10-29 | Codex | Kullanıcı isteğiyle görev durumları `Proposed → Planned → Developing → Developed → To verify → Verified → Done` akışında standartlaştırıldı. Eski görev durumları eşdeğer aşamalara taşındı; henüz onaylanmamış uzun vadeli fikirler Proposed olarak ayrıldı. |
| 2026-10-29 | Antigravity | Devriye Botu (`79c8556`) için 8 doğrulama senaryosu Node ES modül simülasyonu + DOM/Canvas mock ile koşturuldu: Senaryo 1–6 ve 8 geçti; Senaryo 7'de `aiSupport` devriyesi doğrulandı ancak `aiBuy` skorlamasında (`CAT.bot:'arm'`, `kw.bot:.45`) botun `ifv`/`tank` karşısında hiçbir zaman seçilemediği ve `AI_TEMPLATE` içinde yer almadığı tespit edildi. Ayrıca kıvrımlı nehirde `x > W/2` konuşlanma kuralının `y ∈ [1500, 2375]` kesimini reddettiği raporlandı (§5, §6). |
| 2026-10-29 | Codex | Büyük ve tekrarlanabilir hatalar için GitHub Issues kullanımı AGENTS.md'ye eklendi. İki bot bulgusu ayrı Issue olarak açılmak üzere ROADMAP'e alındı; bağlı GitHub hesabı `ozan-kulug/Battleline` deposuna erişemediği için Issue'lar henüz açılmadı. |
| 2026-10-29 | Codex | Kullanıcının depoyu public yapmasının ardından `ozan-kulug/Battleline` erişimi doğrulandı ve iki Issue taslağı hazırlandı. GitHub entegrasyonu Issue oluşturma çağrılarını 403 (`Resource not accessible by integration`) ile reddetti; Issue'lar açılmadı. ROADMAP notu Issues yazma yetkisi gerektiği şeklinde güncellendi. |
| 2026-10-29 | Antigravity | ROADMAP'teki 3 Antigravity test görevi tamamlandı (`Dokunmatik konuşlanma testi`, `Telefon genişliğinde İngilizce taşma kontrolü`, `Yeni birimlerin denge testi`): (1) Gerçek Chrome headless `375×667` üzerinde dokunmatik konuşlanma test edildi; tek parmak sürükleme/kaydırma ve boş alanda pinch-zoom geçti, ilk parmak birliğe değdiğinde pinch-zoom'un çalışmaması (`input.js:56`) ve dokunmatik döndürme eksikliği raporlandı. (2) `375×667` İngilizce taşma kontrolünde `#selp` kutu modeli taşması (`+12 px`) dışında taşma görülmedi; ancak İngilizce modda `tr()` fonksiyonunun `data-add="bot"` özniteliğini `data-add="pb"` yaparak Devriye Botu eklemeyi çökerttiği (`army-builder.js:20`) tespit edildi. (3) 6× 420 sn uzun maç simülasyonuyla `dronop` (%89,6 isabet, 3,58× KP getirisi — aşırı güçlü) ve `bot` (%87,5 batma, ort. 89 sn ömür, çoklu botta `0.8 m` üst üste binme) denge verileri §5 ve §6'ya işlendi. |
