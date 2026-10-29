# Battleline — modüler sürüm

Oyunun adı Battleline (eski adı: Cephe Hattı). Klasör ve tarayıcı kayıt anahtarları (`cephe-hatti.*`) teknik ad olarak korunur.

Tek dosyalı `cephe-hatti.html` oyununun ES modüllerine bölünmüş hâli. Oynanış, denge, arayüz ve kontroller tek dosyalı sürümle aynıdır.

## Çalıştırma

ES modülleri `file://` üzerinden açılamaz (tarayıcı CORS nedeniyle `import`'u engeller). Klasörü yerel bir HTTP sunucusuyla açın:

```bash
cd cephe-hatti
python -m http.server 8000
```

Ardından tarayıcıda **http://localhost:8000** adresini açın. Sunucuyu durdurmak için terminalde `Ctrl+C`'ye basın.
Windows'ta komut genellikle `python`, macOS/Linux'ta `python3` olabilir; ikisi de aynı işi yapar.

Alternatifler: `npx serve .`, `npx http-server .` ya da VS Code "Live Server" eklentisi. Python kurulu değilse bunlardan biri kullanılabilir.

**Geliştirici kısayolu:** `http://localhost:8000/?hizli` adresi ordu kurma ekranını atlar; iki taraf eski varsayılan kuvvetle (3 piyade, keşif, ZMA) hemen başlar. Normal oyuncu akışı bundan etkilenmez.

## Ordu kurma ekranı

Başlangıç ekranındaki **ORDU KUR** düğmesi savaştan önce ordu seçilen ekranı açar.

- **Ordu puanı (OP)** yalnızca başlangıç kuvvetini belirler. Bütçe Öncü 600, Tabur 1000 veya Tugay 1500 seçilir. Savaş içindeki KP ekonomisi, takviye destesi ve kart sayıları bundan etkilenmez.
- Birlikler mevcut `SQUADS` tanımlarından kategorilere ayrılır: Piyade, Keşif, Tanklar, Zırhlı Araçlar, Topçu, Hava Savunma, Hava Kuvvetleri, Destek. Bir türden en fazla 6 adet (ve kart sayısı kadar) alınabilir.
- Ordu en az bir muharebe birliği (piyade, tanksavar, ZMA, mekanize piyade veya tank) içermeli ve bütçeyi aşmamalıdır; aksi hâlde **SAVAŞA BAŞLA** kilitlenir.
- Kara birlikleri kendi kenarında dizilir (piyade önde, araçlar ortada, topçu ve ikmal üs içinde); uçaklar hava üssüne kalkışa hazır girer.
- Kızıl Kuvvet (yapay zekâ) aynı bütçeyle `autoArmy` ile kendi ordusunu kurar.
- Son kurulan ordu tarayıcıda hatırlanır (`localStorage`); okunamazsa önerilen orduyla açılır.

Akış: `ORDU KUR` → `ui/army-builder.js` doğrular → `game.js startMatch({armies:[oyuncu, YZ], deploy:true})` → `newGame` birlik listesini sıfırlar ve `systems/army.js spawnArmy` her mangayı takviyelerle aynı `spawnLoaded` fonksiyonuyla kurar. Oyun bitince **YENİDEN SAVAŞ** tekrar ordu ekranına götürür; savaş ortasında yardım ekranından **DEVAM ET** ise savaşa döner.

## Kontroller ve oynanış notları

- **Kamera:** W A S D, oklar, teker ve orta tuş. W/A/S/D'nin eski komutları Shift ile çalışır: ⇧W dizilim, ⇧A saldırı hareketi, ⇧S dur, ⇧D hızlı hareket. Doğrudan kontrolde (V) WASD aracı sürer.
- **Manga kontrolü:** Bir askere tıklamak veya kutu seçimi tüm mangayı seçer; Alt+tık tek asker seçer. Emirlerde mangalar blok olarak dizilir (`orders.js squadForm`), siperde ve binada her manga bitişik yer alır, araca bütün olarak biner. Yürürken öndeki asker geride kalanı bekler (`movement.js sqLag`). İnisiyatif kararlarını manga lideri tüm manga için verir: birlikte siper alma, binaya girme, geri çekilme, atış pozisyonu değiştirme (`initiative.js`). Panel manga görünümü gösterir.
- **Dron Operatör Timi** (`systems/drones.js`): 2 operatör, kişi başı 3 kamikaze dron, 1400 m kontrol menzili. Başlangıç ekranındaki **KAMİKAZE DRONLAR** seçeneği (savaşta panelden de değişir): *Operatör yönetir*: operatör hedefi kendisi seçer (zor durumdaki dostların yanındaki ve ele geçirilmekte olan noktalardaki düşmanlar önce, sonra topçu, tank, zırhlı ve toplu piyade; uçaksavar yakınındaki hedefler düşük öncelikli), aynı anda en fazla 2 dron. *Ben yönetirim*: nokta (.) ile dron kaldırılır, dron boşta kendiliğinden dalmaz, düşmana sağ tık veya saldırı hareketiyle dalar. Operatör ölürse veya dron menzili aşarsa bağlantı kopar. Kullanılmayan dron operatöre dönünce stoka eklenir, stok ikmalle dolar. Yapay zekâ da bu birimi satın alır, cephenin gerisine yerleştirir ve dronlarını otomatik yönetir.
- **Arazi:** Tepeler, uzun sırtlar, vadiler ve nehir vadisi (`terrain.js` `hills`, `ridges`). Görüş hattı yer şekillerini hesaba katar: iki göz yüksekliği arasındaki çizgiyi aşan sırt görüşü keser (`vision.js los`, yüksek irtifadaki helikopter hariç). Vadide görüş kısalır, tepede artar. Yokuş yukarı hareket yavaşlar. Harita eş yükselti çizgileri ve gölgelendirmeyle çizilir.

## Gemiler için hazırlık

**Devriye Botu** (`DEF.boat`, kart `bot`, 120 KP/OP) satın alınabilir: Deniz sekmesinde ve ordu ekranındaki Deniz Kuvvetleri kategorisinde. Üssü nehrin kendi ucudur (ikmal, onarım, cepheden çekilme). Köprüden geçen kara birlikleriyle itişmez. YZ en fazla iki bot alır ve nehirde devriye gezdirir.

- `naval:1` olan birlik yalnızca nehir yatağında hareket eder ve köprülerin altından geçer (`terrain.js riverAt`, `pathfinding.js` `sea` modu, `movement.js`).
- Panik, nokta ele geçirme, enkaz ve hedef gösterme gemiye göre ayarlıdır: geri çekilme nehir boyuncadır, gemi nokta ele geçirmez, batan gemi enkaz bırakmaz.
- Konuşlanmada gemi nehrin kendi yarısına konur. Başlangıçta nehrin kendi ucuna dizilir, takviye olarak nehrin kendi ucundan gelir.
- Çizim `renderer.js drawShip`, kart görseli `deck.js` içindedir. Deste ve ordu ekranındaki **Deniz** sekmesi yalnızca satın alınabilir gemi varsa görünür. YZ gemileri odak noktası hizasında nehirde devriye gezdirir.
- Yeni gemi sınıfı eklemek için: `DEF` içine `naval:1` birlik, `SQUADS` dizisinin **sonuna** `cat:'deniz'` kartı, `AVE` ve `ROLE` içine birer satır.

## Konuşlanma safhası

Ordu ekranındaki **SAVAŞA BAŞLA** savaşı hemen açmaz; önce konuşlanma safhası gelir: `Ordu kurma → Konuşlanma → Savaş`.

- **Durum:** `state.phase==='deploy'` ve `state.running=false`. Simülasyonun tamamı (`simStep`: birlikler, YZ, ekonomi, nokta ele geçirme, takviye sayaçları, mermiler) yalnızca `running` iken ilerlediği için bu safhada hiçbir şey ilerlemez; yalnızca birliklerin konumu ve yönü değişir. Savaş tuşları ve takviye kartları da çalışmaz.
- **Bölge:** `systems/deployment.js deployZone(side)` haritadan çıkarılır: her taraf kendi kenarından, kendi yarısındaki en yakın stratejik noktanın alanına 40 m kalana kadar. Hiçbir nokta savaştan önce ele geçirilemez. YZ bölgesi simetriktir ve YZ ordusu oraya kurulur.
- **Kurallar** (`placeErr`): bölge dışı, nehir ve sığ geçit, bina üstü ve başka birimle çakışma reddedilir. Geçersiz bırakılan birlik eski yerinde kalır.
- **Kontroller:** Birliği sol tıkla sürükle (manga birlikte taşınır). Sağ tık + sürükle yön verir. Q / E seçili grubu 15° döndürür. Shift çoklu seçim yapar, boş alanı sürüklemek kutuyla seçer, Esc sürüklemeyi iptal eder. Orta tuş, teker, oklar ve mini harita kamerayı her zamanki gibi oynatır. Dokunmatikte birliğe dokunup sürüklenir, boş alan haritayı kaydırır.
- Sağdaki **Birlikler** listesi mangaları, nakliyedeki askerleri ve hava üssündeki uçakları gösterir; tıklanınca seçer ve kamerayı oraya götürür.
- **SAVAŞI BAŞLAT** tüm birimleri yeniden doğrular, sonra `game.js beginBattle()` ile savaşı başlatır. **‹ Ordu ekranı** seçilen orduyu koruyarak geri döner.
- `?hizli` konuşlanmayı da atlar.
Derleme adımı ve bağımlılık yoktur. Yazı tipleri Google Fonts'tan yüklenir; internet yoksa sistem yazı tipine düşer.

## Dosya yapısı

```
index.html              Yalnızca işaretleme + CSS bağlantıları + <script type="module" src="js/main.js">
css/
  base.css              Renk/yazı tokenları, sayfa sıfırlama, ana tuval, panel kabuğu
  hud.css               Üst şerit, yardım düğmesi, olay akışı, mod ipucu, hava üssü paneli
  panels.css            Alt şerit: mini harita, takviye destesi, seçim/emir paneli, düğmeler
  menus.css             Başlangıç/yardım ekranı, zorluk seçimi, duraklatma yazısı
  army.css              Savaş öncesi ordu kurma ekranı (kendi dar ekran kuralları dahil)
  deploy.css            Konuşlanma safhası çubuğu ve birlik listesi
  responsive.css        Dar ekran ve hareket azaltma uyarlamaları (en son yüklenir)
js/
  main.js               Giriş noktası: olay dinleyicilerini sırayla kurar, oyunu başlatır
  config.js             Sabitler ve veri: harita, arazi, birlik/silah tanımları, deste, bölgeler, YZ zorlukları
  state.js              Paylaşılan değişebilir durum (state nesnesi) + cam, md, recentImp
  canvas.js             Tuval öğeleri ve 2D bağlamlar
  camera.js             Kamera dönüşümü, sınırlama, yakınlaştırma
  game.js               Yeni oyun kurulumu (newGame) ve savaşı başlatma (startMatch)
  game-loop.js          Simülasyon adımı (simStep), çizim döngüsü (frame), yeniden boyutlandırma
  input.js              Fare, dokunmatik, klavye
  renderer.js           Sahne, birlik, savaş sisi, arayüz katmanı ve mini harita çizimi
  utils/helpers.js      DOM seçici, rastgele, açı/geometri yardımcıları
  world/terrain.js      Harita üretimi, arazi tamponu, bina/siper sorguları
  world/buildings.js    Binaya giriş/çıkış, bina içi yerleşim
  world/cover.js        Siper bulma, yönlü siper koruması, duruşlar, tüfekçi çukuru
  systems/units.js      Birlik/manga oluşturma (spawnSquad, spawnLoaded), takviye, nakliyeden indirme
  systems/army.js       Savaş öncesi ordu: OP hesabı, doğrulama, YZ ordusu, başlangıç dizilişi
  systems/deployment.js Konuşlanma bölgeleri, yerleştirme kuralları, sürükleme önizlemesi
  systems/drones.js     Dron operatörü: dron kaldırma, kontrol bağlantısı, geri alma, operatör yapay zekâsı
  systems/spatial.js    Uzamsal ızgara
  systems/vision.js     Görüş hattı, gizlenme, tespit, son görülen konumlar
  systems/effects.js    Parçacıklar, patlama, krater, yangın, yıkım efektleri
  systems/combat.js     Hedefleme, atış, zırh/delme, hasar, baskı/moral, kritik hasar
  systems/projectiles.js Mermi/füze/bomba uçuşu ve çarpma
  systems/pathfinding.js A* yol bulma
  systems/movement.js   Hareket, nehir geçişi, engel kaçınma, sıkışma çözme, doğrudan kontrol
  systems/air.js        Helikopter, dron, uçak, saldırı koşusu, hava otomatikleri
  systems/artillery.js  Topçu/havan: mevzilenme, ateş görevleri
  systems/economy.js    Nokta ele geçirme, gelir, ikmal, kart iadesi
  systems/orders.js     Oyuncu ve YZ emirleri, dizilimler, siper yerleşimi, mod anahtarları
  systems/initiative.js Birlik inisiyatifi (küçük, güvenli kararlar)
  systems/unit-update.js Bir birliğin kare güncellemesi (diğer sistemleri sırayla çağırır)
  systems/ai.js         Düşman yapay zekâsı
  ui/feedback.js        Olay akışı, mod ipucu, oyun sonu ekranı
  ui/deck.js            Takviye destesi kartları ve sekmeler
  ui/panels.js          Seçim paneli: bilgi ve emir düğmeleri
  ui/hud.js             Üst şerit, hava üssü paneli, arayüz güncellemesi
  ui/menus.js           Başlangıç/yardım ekranı, zorluk seçimi, ?hizli kısayolu
  ui/army-builder.js    Ordu kurma ekranı: kategoriler, birlik kartları, ayrıntı, seçili ordu
  ui/deploy.js          Konuşlanma safhası: sürükleme, yön verme, birlik listesi, savaşı başlatma
```

## Paylaşılan durum nerede?

- **Sabitler** (`DEF`, `SQUADS`, harita boyutları…) `config.js`'te. Salt okunur.
- **Değişebilir oyun durumu** `state.js` içindeki tek `state` nesnesinde: `state.units`, `state.money`, `state.time`, `state.running`, `state.paused`… ES modüllerinde içe aktarılan bir `let` başka modülden yeniden atanamaz. Bu yüzden birden fazla modülün yazdığı her değişken buraya taşındı ve `state.x` olarak kullanılır.
- Yalnızca tek modülün kullandığı yerel değişkenler o modülde kalır.
- `window`'a hiçbir şey eklenmez.

## Bağımlılık yönü

Bağımlılıklar tek yönde akar. Döngüsel import yoktur; bu, betikle denetlendi.

```
config → utils → canvas/state → world/* → systems/(units, vision, effects)
       → combat → (movement, air, artillery, projectiles, economy) → orders
       → (initiative, ai) → unit-update/renderer → ui/* → game, game-loop, input → main
```

Olay dinleyicileri `initDeck`, `initHud`, `initInput`, `initMenus`, `initArmy` ve `initDeploy` içindedir. `main.js` bunları tek dosyalı sürümdeki kayıt sırasıyla çağırır.

## Yeni kod eklerken

- Yeni bir sabit veya birlik → `config.js` (`DEF` / `SQUADS`).
- Birden fazla modülün yazacağı yeni bir değişken → `state.js` içindeki `state` nesnesi.
- Bir sistemin, kendisinden "yukarıdaki" bir katmanı (ör. `systems/*` → `ui/hud.js`) içe aktarmaması döngüleri önler.

## Git ile çalışma

Proje kökü (`index.html`'in bulunduğu klasör) bir Git deposudur. İlk commit (`baseline: mevcut oyun sürümünü koru`) çalışan sürümü saklar. `.gitignore` yalnızca işletim sistemi, editör ve geçici dosyaları hariç tutar; `index.html`, `css/`, `js/` ve `README.md` her zaman takip edilir.

Durumu kontrol etmek:

```bash
git status          # değişen ve yeni dosyalar
git diff            # henüz commit edilmemiş değişikliklerin ayrıntısı
git log --oneline   # commit geçmişi
```

Commit almak (önce değişikliği tarayıcıda deneyin):

```bash
git add index.html css js README.md
git commit -m "kısa ve açıklayıcı mesaj"
```

Yeni bir özellik için ayrı dal açmak, çalışan sürümü korur:

```bash
git switch -c ozellik-adi    # yeni dal
git switch master            # ana dala dön
```

Eski bir sürümü incelemek (çalışma klasörünü değiştirmeden):

```bash
git log --oneline                 # commit kimliğini bul
git show <commit>                 # o commit'te ne değişti
git show <commit>:js/config.js    # bir dosyanın o anki hâli
git diff <commit> -- js/          # o sürümle bugünkü fark
```

Eski sürümü oynamak için önce değişikliklerinizi commit edin, sonra `git switch --detach <commit>` ile geçin; işiniz bitince `git switch master` ile dönün. `git reset --hard`, `git clean -fd` ve `git push --force` kaydedilmemiş işi silebilir; emin değilseniz kullanmayın.
