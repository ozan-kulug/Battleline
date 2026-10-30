# Battleline — Roadmap

Son güncelleme: 2026-10-29 · Durumlar ve açıklamaları için [Görev durumu akışı](#görev-durumu-akışı)
Ayrıntı ve test sonuçları: [PROJECT_NOTEBOOK.md](PROJECT_NOTEBOOK.md) · Kurallar: [AGENTS.md](AGENTS.md)

## Mevcut aşama

**Aşama 3 — Deniz savaşı, ilk sürüm.** Oynanabilir Devriye Botu (`79c8556`) kodlandı ve Antigravity tarafından 8 senaryoyla doğrulandı; Senaryo 1–6 ve 8 geçti, Senaryo 7'de YZ'nin `aiBuy` skorlaması nedeniyle bot satın almadığı (ve kıvrımlı nehirde `x > W/2` konuşlanma kuralının yan etkisi) tespit edildi.

## Görev durumu akışı

`Proposed` → `Planned` → `Developing` → `Developed` → `To verify` → `Verified` → `Done`

- **Proposed:** Fikir veya ihtiyaç olarak kaydedildi; kapsamı ya da önceliği henüz kararlaştırılmadı.
- **Planned:** Kapsamı ve tamamlanma ölçütü netleşti; başlamaya hazır.
- **Developing:** Sorumlu kişi görevi yürütüyor.
- **Developed:** Uygulama tamamlandı; doğrulama için teslim edilecek.
- **To verify:** Doğrulama senaryosu ve sorumlusu belli; kontrol bekliyor.
- **Verified:** Belirlenen kontroller başarıyla tamamlandı.
- **Done:** Doğrulama ve gerekli kayıt/teslim adımları tamamlandı; görev kapatıldı.

## Sıradaki öncelikler

1. İngilizce modda (`?lang=en`) Devriye Botu orduya ekleme/seçme çökmesini (`data-add="bot" → "pb"`) düzeltmek.
2. YZ'nin Devriye Botu satın almaması (`aiBuy`) ve kıvrımlı nehirde yanlış konuşlanma yarısı (`placeErr`) bulgularını düzeltmek.
3. Botun ateş altında geri çekilmesi, çoklu bot dizilimi ve Dron Operatörü (`dronop`) denge ayarları.
4. 375 px seçim paneli (`#selp`) `box-sizing` taşmasını ve dokunmatik konuşlanma pinch-zoom/döndürme eksiklerini gidermek.

## Görev durumu

| Görev | Durum | Sorumlu | Not |
|---|---|---|---|
| Git altyapısı ve baseline | Done | Claude | `40c0000` |
| Ordu kurma ekranı | Done | Claude | `4826425` |
| Konuşlanma safhası | Done | Claude | `9b09af2` |
| WASD kamera | Done | Claude | `ace3086` |
| Arazi: sırt, vadi, görüş hattı | Done | Claude | `aa46d01`, `7e8ad0e` |
| Manga kontrolü ve manga inisiyatifi | Done | Claude | `eb701f6` |
| Dron Operatör Timi | Done | Claude | `0e33ce5` |
| Gemi altyapısı | Done | Claude | `a3520a3` |
| İngilizce dil desteği | Done | Claude | `aa972d1` |
| Oynanabilir Devriye Botu | Verified | Kod: Claude · Test: Antigravity | `79c8556`; 8 senaryonun 7'si geçti, YZ bot satın alma (`aiBuy`) bulgusu notebook §5–§6'da |
| Devriye Botu tarayıcı/simülasyon testleri | Done | Antigravity | 8 senaryo ES modül + DOM/Canvas simülasyonuyla doğrulandı ve `PROJECT_NOTEBOOK.md` §5–§6'ya işlendi |
| Codex çalışma rolünü AGENTS.md'ye ekleme | Done | Codex | Planlama, bağımsız inceleme ve dokümantasyon kapsamı ile ajanlar arası çakışma kuralları eklendi |
| Antigravity görev kapsamını genişletme | Done | Codex | Test bulgularına yönelik atanmış/kullanıcıca istenmiş sınırlı kod düzeltmeleri ve kayıt koşulları AGENTS.md'ye eklendi |
| Görev durumu akışını standartlaştırma | Done | Codex | Proposed'dan Done'a yedi aşamalı akış tanımlandı; mevcut işler yeni aşamalara taşındı |
| Büyük buglar için GitHub Issue iş akışını tanımlama | Done | Codex | AGENTS.md'ye Issue açma ve kayıt/bağlantı kuralları eklendi |
| Devriye Botu YZ satın alma hatasını GitHub Issue'a aktarma | Planned | Codex | Issue metni hazır; GitHub entegrasyonu oluşturma isteğini 403 ile reddetti (Issues yazma yetkisi gerekli) |
| Kıvrımlı nehir konuşlanma hatasını GitHub Issue'a aktarma | Planned | Codex | Issue metni hazır; GitHub entegrasyonu oluşturma isteğini 403 ile reddetti (Issues yazma yetkisi gerekli) |
| Dokunmatik konuşlanma testi | Done | Antigravity | Chrome `375×667` üzerinde doğrulandı: tek parmak sürükleme/kaydırma ve boş alanda pinch geçti; birlik üstünde başlayan pinch çakışması (`input.js:56`) ve dokunmatik döndürme eksikliği notebook §5–§6'da |
| Telefon genişliğinde İngilizce taşma kontrolü | Done | Antigravity | Chrome `375×667` (`?lang=en`) tüm ekranlar tarandı: `#selp` kutu modeli (`+12 px`) dışında taşma yok; ancak `tr()` yüzünden `data-add="bot" → "pb"` çökmesi bulundu (notebook §5–§6) |
| İngilizce modda Devriye Botu orduya ekleme çökmesi | Planned | — | `i18n.js` `'bot'→'pb'` çevirisi `army-builder.js` içinde `data-add`/`data-rem`/`data-k` özniteliklerini bozuyor (notebook §6) |
| Botun ateş altında geri çekilmesi | Planned | — | Sorumlu atanmadı |
| Çoklu bot dizilimi (dar nehir) | Planned | — | Simülasyonda 2 dost botun `0.8 m` mesafeye kadar üst üste bindiği doğrulandı |
| Yeni birimlerin denge testi (dron operatörü, bot) | Done | Antigravity | 6× 420 sn maç simülasyonu tamamlandı: `dronop` 3,58× KP getirisi ve %89,6 isabet ile aşırı güçlü; `bot` %87,5 batma (ort. 89 sn ömür) ile kırılgan (notebook §5–§6) |
| Kamikaze dron kontrolünü maç sırasında değiştirebilme | Done | Kod: Claude · Test: Antigravity | `c0428e5`; `#dmBtn`, `⇧.` kısayolu, `#selb [data-a="dmode"]`, TR/EN metinler ve havadaki dronların anlık mod geçişi Chrome'da doğrulandı (`u.home` dönüşünde yer emri uç durumu notebook §5–§6'da) |
| Köprülerin yıkılması ve geçişin yeniden sağlanması | Done | Kod: Claude · Test: Antigravity | 6 ilk senaryo + Claude düzeltmeleri sonrası 4 yeniden doğrulama senaryosu Chrome'da %100 geçti: topçu/LGB yıkımı, yıkık köprü sonrası araçların (`tank` 21,5 sn, `ifv` 16,3 sn, `supply` 17,4 sn) sığ geçitten takılmadan geçişi, 1–3 kamyonla kesintisiz onarım (`!u.repB`), YZ kamyon pususunda `90 sn` bekleme + `450 m` tehdit iptali (`brT`), bot/normal geçişler ve TR/EN metinler (notebook §5) |
| Oyun temposunu yavaşlatma ve kontrolleri kolaylaştırma | Planned | — | Harita ölçeği büyütülecek, kara/deniz/hava araçlarının hareket hızları düşürülecek ve oyuncu emirleri daha kolay uygulanır hale getirilecek. Tam ölçek ve hız değerleri oyun içi denge/doğrulama sırasında belirlenecek; hedef, çatışmaya tepki ve emir vermek için daha fazla zaman sağlamak. Maç süresi ayarı (bilet havuzu `500`, kayıp bilet `val/6`) da bu görevde yapılacak (kullanıcı kararı, 2026-10-30; ekonomi 1. aşama maçı uzatmadı). |
| Broken Arrow ekonomi sistemi araştırması | Done | Codex | Kaynaklı inceleme ve Claude için Battleline'a uyarlama promptu `BROKEN_ARROW_ECONOMY_RESEARCH.md` içinde; 1.2.2 sürüm bilgisi ve eski PTE gelir tablosu için uyarı eklendi. |
| 375 px seçim paneli taşması | Planned | — | Kök neden doğrulandı: `#selp` `width:100%` + `22 px` padding/border (`box-sizing:border-box` eksik, sağdan `+12 px` taşıyor) |
| Oyun adını Battleline yapma (iki dilde) | Done | Kod: Claude · Test: Antigravity | `a97ec15`; `<title>` (`Battleline`) ve `#ovt` (`BATTLELINE`) açılış ile `?` yardım ekranında TR/EN Chrome testinde doğrulandı |
| Ekonomi 1. aşama (Broken Arrow'dan uyarlama) | Done | Kod: Claude · Test: Antigravity | 7 senaryo + 24 maçlık süre karşılaştırması ve 4 düzeltmenin (`economy.js:32` uçak bakımı tek sayım, `hud.js:13` `#objs` `KP/dk` ipucu, `units.js:33` `mech`/`heliT` `noCard`, `ai.js:137-138` + `bridges.js:30` pusudan hasarlı dönen 2. kamyonda `240 sn` kaçınma ve `Math.max` koruması) yeniden doğrulaması Chrome'da %100 geçti (notebook §5). Maç süresi ayarı tempo görevine devredildi |
| Ekonomi 2. aşama: fiziksel ikmal stoğu ve ikmal noktası | Planned | — | Kamyon sınırlı stok taşır, harcanan mühimmat/onarım stoktan düşer, yere ikmal noktası bırakılır (vurulursa patlar); üs ve İkmal Deposu sınırsız kalır. Sayılar tasarımda belirlenecek. |
| Deniz harekâtı 1. aşama: kıyı haritası tasarımı | Done | Codex | Tasarım kararı (2026-10-30): mevcut nehir haritası aynen korunup ikinci, asimetrik bir kıyı haritası eklenecek. Yalnız oyuncu tarafında deniz/kıyı olacak; oyuncu deniz kenarından başlayıp karaya ilerleyecek, YZ karşı taraftaki kara içinden savunacak. Harita başlangıçta mevcut `4800×3000` boyutunu kullanacak. Bu aşamada harita seçimi, arazi/deniz üretimi ve çizimi, açık deniz hareket/yol bulması, oyuncu deniz üssü-konuşlanması ve YZ kara konuşlanması yapılacak; çıkarma gemisiyle kara birimi taşıma sonraki aşamadır. |
| Kıyı haritası 1. aşama: harita seçimi ve deniz altyapısı | Done | Kod: Claude · Test: Antigravity | Harita tanımı/aktif harita seçimi kurulacak; mevcut nehir haritası ve varsayılan oyunu korunacak. Kıyı haritasında deniz yalnız oyuncu tarafında olacak; YZ kara tarafında başlayacak. Gemi açık denizde hareket edip yol bulabilecek ve oyuncu tarafındaki deniz bölgesinde konuşlanabilecek; mevcut nehir haritasındaki bot, köprü ve kara geçişleri gerilemeyecek. Bu aşamada birlik çıkarma yok. Kapsam dosyaları: `index.html`, `css/menus.css`, `js/config.js`, `js/state.js`, `js/game.js`, `js/main.js`, `js/ui/menus.js`, `js/i18n.js`, `js/world/terrain.js`, `js/renderer.js`, `js/systems/pathfinding.js`, `js/systems/movement.js`, `js/systems/deployment.js`, `js/systems/units.js`, `js/systems/army.js`, `js/systems/ai.js`; nehir varsayımlarının ortaklaşa kullanıldığı `orders.js`, `combat.js`, `bridges.js` de harita-bağımlı davranış incelenip gerekirse kapsama alınacak. Bitiş: iki harita da seçilip başlatılabilmeli; kıyı haritasında YZ'ye deniz/deniz üssü üretilmemeli; gemiler açık suda geçerli hareket/emir almalı; nehir haritası köprü, sığ geçit ve nehir botu davranışı korunmalı; değişen metinler TR/EN olmalı. · **2026-10-30 Antigravity:** 9 senaryo ve Nehir Hattı gerileme kontrolü gerçek Chrome'da doğrulandı ve tamamı geçti (notebook §5; `?hizli` başlangıç dizilişi ve `arrive` `inBase` sınırı gözlemleri §6'da). |
| Kıyı haritası: çapraz nehir ve liman | Done | Kod: Claude · Test: Antigravity | Kullanıcı isteği (2026-10-30, ekran görüntüsü üzerine çizim): nehir koydan çıkıp kuzeye, sonra haritayı çaprazlama keserek (şehir merkezinden geçip) doğu kenara uzanır; sahildeki işaretli yere liman. Nehir çoklu çizgi (`MAP.path`), köprüler yolların nehri kestiği 6 yerde otomatik ve eğik, 5 sığ geçit; liman (iskele, vinç, rıhtım, beton alan, yol) oyuncu gemilerinin üssü: takviye gemisi limana gelir, liman çevresinde ikmal, başlangıç gemileri liman önünde. Kıyıda gemi rotası nehir merkez çizgisini izler. Nehir düşman fabrikasının (H) yanından geçer; suya düşen fabrika binaları kurulmaz. Doğrulanacak: (1) nehrin çizimdeki rotayı izlemesi ve kıyı çizimi; (2) 6 köprüden araç/piyade geçişi; (3) köprü yıkımı/onarımı eğik köprülerde (çizim, üstündekilerin düşmesi, kamyon onarımı); (4) sığ geçitler; (5) gemi limandan nehrin doğu ucuna gidip dönebiliyor; (6) liman çizimi, liman çevresinde gemi ikmali, takviye gemisinin limana gelmesi; (7) Nehir Hattı haritasında gerileme yok; (8) TR/EN köprü adları (`Köprü 1` → `Bridge 1`). · **2026-10-30 Antigravity:** 8 senaryonun tamamı gerçek Chrome headless üzerinde test edildi ve %100 geçti (6 köprüden geçiş, eğik köprü yıkım/onarımı, 5 sığ geçit, gemi liman-doğu ucu gidiş-dönüş `0` kare su dışı, liman ikmali/çizimi, Nehir Hattı gerilemesizliği ve TR/EN; notebook §5). |
| Büyük gemiler için ortak deniz aracı altyapısı | Done | Tasarım: Codex · Kod: Claude · Test: Antigravity | Kıyı haritası 1. aşaması tamamlandı. Büyük gemiler ve çıkarma gemileri eklenmeden önce gemi verilerini sınıf/rol, boyut ve seyir alanına göre tanımlayacak ortak altyapı hazırlandı (`SHIPC`, `bodyR`, `shipAt`, `navSnap`, `deep` modu). · **2026-10-30 Antigravity:** 7 senaryo gerçek Chrome headless üzerinde test edildi ve %100 geçti (bot iki haritada gerilemesiz, büyük gemi profilinde açık denizde kalma, nehre/karaya konamama, gövde boyutuna göre çizim/seçim/çarpışma, Nehir Hattı kısıtı, kara/deniz çatışması ve TR/EN; notebook §5). |
| Fırkateyn ve destroyer (sabit büyük gemiler) | Done | Kod: Claude · Test: Antigravity | Kullanıcı isteği (2026-10-30): büyük gemiler hareket etmez, yalnızca ordu kurma ekranında seçilir (maç içi destede yok), sayı sınırlı: en fazla 2 fırkateyn, 1 destroyer; yalnızca Kıyı Cephesi'nde. İkisinde de 1 baş topu, VLS füzeleri, CIWS hava savunması. · **2026-10-30 Antigravity:** Gerçek Chrome headless üzerinde 2 fırkateyn + 1 destroyer seçimiyle 8 senaryo test edildi ve %100 geçti (ordu ekranı kotaları ve Nehir kısıtı, açık denizde konuşlanma ve sürükleme/döndürme, sabitlik ve destede görünmeme, 76/127 mm baş toplarıyla kara bombardımanı, VLS füzeleri ve radar bağımlılığı, CIWS hava savunması ile roket/bomba imhası [fırkateyn %54, destroyer %91], gövde/taret/silah çizimi ve TR/EN; notebook §5). |
| Büyük gemiler: 3 kat boyut ve ayrıntılı çizim | To verify | Kod: Claude · Test: Antigravity | Kullanıcı isteği (2026-10-30, ekran görüntüsü üzerine işaret): fırkateyn 222×48, destroyer 294×60 (3 kat). Çizim: en önde dönen baş topu, arkasında kırmızımsı panelde dikey füze hücreleri (hücre sayısı füze sayısına eşit: fırkateyn 24, destroyer 32 ön + 64 arka), ortada köprü üstü/direk/baca (destroyerde radar panelleri), siyah CIWS kuleleri (fırkateyn 1, destroyer 2 + önde 1 süs kulesi), kıçta hangar ve helikopter pisti (H). Gövde yarıçapı boyun %30'u (fırkateyn 67, destroyer 88). Gemiler kıyıya paralel (baş kuzeye), liman iskelelerinin dışında, gövde boyuna göre aralıklı dizilir; konuşlanmada ve döndürmede gövdenin tamamı denizde olmalı ('Gövde karaya taşıyor'). Doğrulanacak: (1) boyut ve çizim ayrıntıları ekran görüntüsündeki düzene uyuyor; (2) başlangıç dizilişi geçerli, gemiler üst üste ve iskelelerin üstünde değil; (3) kıyıya dik döndürme ve karaya yakın sürükleme engelleniyor; (4) seçim halkası, can çubuğu, top ağzı ve CIWS konumları; (5) kart önizlemeleri okunur. |
| Deniz harekâtı 2. aşama: otomatik kıyıdan çıkarma | Planned | Tasarım: Codex · Kod: Claude · Test: Antigravity | Ortak gemi altyapısı tamamlandıktan sonra kıyı haritasında maç içi satın alınan kara takviyeleri çıkarma gemisiyle getirilecek. Çıkarma yeri otomatik seçilecek; yalnız açık denize bakan geçerli kara kıyısı kullanılacak, nehir yatağı, nehir kıyısı ve nehir ağzı çıkarma noktası olmayacak. Nehir Hattı haritası ve maç başı ordu konuşlanması değişmeyecek. Başlamadan önce taşıma kapasitesi, uygun kıyı seçimi/işgal durumunda yedek seçim, gemi vurulursa yükün sonucu, boşaltma ve geminin dönüş/yeniden kullanım kuralı netleştirilecek. Dosya kapsamı: `js/config.js`, `js/state.js`, `js/systems/units.js`, `js/world/terrain.js`, `js/systems/pathfinding.js`, `js/systems/movement.js`, `js/systems/combat.js`, `js/renderer.js`, `js/ui/hud.js`, `js/i18n.js`; gerekirse `js/game.js`, `js/systems/economy.js`, `js/ui/panels.js`. Bitiş: kara takviyesi yalnızca harita tarafından belirlenmiş açık deniz kıyı bölgelerinden otomatik çıkar; nehre veya suya bırakılmaz; gemi/yük yaşam döngüsü, kart ve KP sonuçları belirlenmiş kurala uyar; mevcut bot/harita takviyeleri gerilemez; TR/EN metinleri tamamlanır. |
| Bilet sistemini kapatma, bölge kaybıyla yenilgi | Done | Kod: Claude · Test: Antigravity | Kullanıcı isteği (2026-10-30): `ECON.tickets:false` ile bilet düşüşü (kayıp `val/6`, nokta farkı) kapalı; düşman tüm noktaları tutunca taraf yenilir (tarafsız nokta varken maç sürer). Üst şerit sayaçları tutulan nokta sayısını (`3/7`) gösterir. Doğrulanacak: tüm noktaları alınca ZAFER, kaybedince YENİLGİ; kayıplar sayacı düşürmüyor; sayaç/çubuk TR/EN; YZ duruşu (`ai.js:94`) bilet eşitken nokta farkına göre çalışıyor. · **2026-10-30 Antigravity:** Gerçek Chrome'da doğrulandı ve tamamı geçti (`x/11` Nehir, `x/10` Kıyı, `ZAFER`/`VICTORY`, `YENİLGİ`/`DEFEAT`, `4200 KP` kayıpta ve `50 sn` puan farkında bilet/sayaç düşmüyor, tarafsız nokta varken maç sürüyor; `ai.js:94` `'def'` koşulunun sabit `[500, 500]` bilette tetiklenmemesi notu notebook §5–§6'da). |

## Yakın vadeli hedefler

- Devriye Botu test bulgularını (`aiBuy` ve konuşlanma yarısı kontrolü) düzeltmek.
- Gemi davranışlarını tamamlamak: kendini koruma, çoklu gemi düzeni.
- Yeni özelliklerin dengesini uzun maçlarla ayarlamak.

## Öneri aşamasındaki fikirler

- `Proposed` — Kıyı/çıkarma akışı sonrasında füze botu ve büyük ateş destek gemileri gibi ek deniz sınıfları.
- `Proposed` — Kıyı haritasından bağımsız diğer haritalar veya harita varyasyonları.
- `Proposed` — Otomatik test altyapısı (şu an yok; ihtiyaç ve kapsam henüz belirlenmedi).

*Not: `Proposed` aşamasındaki fikirlerin kapsamı veya önceliği henüz net değildir. Kullanıcının yön verdiği aşamalar görev tablosunda ayrıca izlenir.*
