# Cephe Hattı — modüler sürüm

Tek dosyalı `cephe-hatti.html` oyununun ES modüllerine bölünmüş hâli. Oynanış, denge, arayüz ve kontroller tek dosyalı sürümle aynıdır.

## Çalıştırma

ES modülleri `file://` üzerinden açılamaz (tarayıcı CORS nedeniyle `import`'u engeller). Klasörü yerel bir HTTP sunucusuyla açın:

```bash
cd cephe-hatti
python -m http.server 8000
```

Ardından tarayıcıda **http://localhost:8000** adresini açın. Sunucuyu durdurmak için terminalde `Ctrl+C`'ye basın.
Windows'ta komut genellikle `python`, macOS/Linux'ta `python3` olabilir; ikisi de aynı işi yapar.

Alternatifler: `npx serve .`, `npx http-server .` ya da VS Code "Live Server" eklentisi.
Derleme adımı ve bağımlılık yoktur. Yazı tipleri Google Fonts'tan yüklenir; internet yoksa sistem yazı tipine düşer.

## Dosya yapısı

```
index.html              Yalnızca işaretleme + CSS bağlantıları + <script type="module" src="js/main.js">
css/
  base.css              Renk/yazı tokenları, sayfa sıfırlama, ana tuval, panel kabuğu
  hud.css               Üst şerit, yardım düğmesi, olay akışı, mod ipucu, hava üssü paneli
  panels.css            Alt şerit: mini harita, takviye destesi, seçim/emir paneli, düğmeler
  menus.css             Başlangıç/yardım ekranı, zorluk seçimi, duraklatma yazısı
  responsive.css        Dar ekran ve hareket azaltma uyarlamaları (en son yüklenir)
js/
  main.js               Giriş noktası: olay dinleyicilerini sırayla kurar, oyunu başlatır
  config.js             Sabitler ve veri: harita, arazi, birlik/silah tanımları, deste, bölgeler, YZ zorlukları
  state.js              Paylaşılan değişebilir durum (state nesnesi) + cam, md, recentImp
  canvas.js             Tuval öğeleri ve 2D bağlamlar
  camera.js             Kamera dönüşümü, sınırlama, yakınlaştırma
  game.js               Yeni oyun kurulumu
  game-loop.js          Simülasyon adımı (simStep), çizim döngüsü (frame), yeniden boyutlandırma
  input.js              Fare, dokunmatik, klavye
  renderer.js           Sahne, birlik, savaş sisi, arayüz katmanı ve mini harita çizimi
  utils/helpers.js      DOM seçici, rastgele, açı/geometri yardımcıları
  world/terrain.js      Harita üretimi, arazi tamponu, bina/siper sorguları
  world/buildings.js    Binaya giriş/çıkış, bina içi yerleşim
  world/cover.js        Siper bulma, yönlü siper koruması, duruşlar, tüfekçi çukuru
  systems/units.js      Birlik/manga oluşturma, takviye, nakliyeden indirme
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
  ui/menus.js           Başlangıç/yardım ekranı, zorluk seçimi
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

Olay dinleyicileri `initDeck`, `initHud`, `initInput` ve `initMenus` içindedir. `main.js` bunları tek dosyalı sürümdeki kayıt sırasıyla çağırır.

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
