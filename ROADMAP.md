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
| Bilet sistemini kapatma, bölge kaybıyla yenilgi | To verify | Kod: Claude · Test: Antigravity | Kullanıcı isteği (2026-10-30): `ECON.tickets:false` ile bilet düşüşü (kayıp `val/6`, nokta farkı) kapalı; düşman tüm noktaları tutunca taraf yenilir (tarafsız nokta varken maç sürer). Üst şerit sayaçları tutulan nokta sayısını (`3/7`) gösterir. Doğrulanacak: tüm noktaları alınca ZAFER, kaybedince YENİLGİ; kayıplar sayacı düşürmüyor; sayaç/çubuk TR/EN; YZ duruşu (`ai.js:94`) bilet eşitken nokta farkına göre çalışıyor. |

## Yakın vadeli hedefler

- Devriye Botu test bulgularını (`aiBuy` ve konuşlanma yarısı kontrolü) düzeltmek.
- Gemi davranışlarını tamamlamak: kendini koruma, çoklu gemi düzeni.
- Yeni özelliklerin dengesini uzun maçlarla ayarlamak.

## Öneri aşamasındaki fikirler

- `Proposed` — Ek gemi sınıfları: füze botu, çıkarma gemisi, büyük savaş gemileri (ortak gemi altyapısı hazır; henüz başlanmadı).
- `Proposed` — Ek haritalar veya harita varyasyonları (şu an tek, sabit tohumlu harita).
- `Proposed` — Otomatik test altyapısı (şu an yok; ihtiyaç ve kapsam henüz belirlenmedi).

*Not: Bu fikirler kullanıcı tarafından onaylanmış görevler değildir; kapsam ve öncelik kararlaştırılınca `Planned` aşamasına alınır.*
