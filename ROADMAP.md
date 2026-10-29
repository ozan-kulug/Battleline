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
| 375 px seçim paneli taşması | Planned | — | Kök neden doğrulandı: `#selp` `width:100%` + `22 px` padding/border (`box-sizing:border-box` eksik, sağdan `+12 px` taşıyor) |
| Oyun adını Battleline yapma (iki dilde) | Developed | Claude | Başlık, menü başlığı, i18n ve README; görsel kontrol Antigravity'de |

## Yakın vadeli hedefler

- Devriye Botu test bulgularını (`aiBuy` ve konuşlanma yarısı kontrolü) düzeltmek.
- Gemi davranışlarını tamamlamak: kendini koruma, çoklu gemi düzeni.
- Yeni özelliklerin dengesini uzun maçlarla ayarlamak.

## Öneri aşamasındaki fikirler

- `Proposed` — Ek gemi sınıfları: füze botu, çıkarma gemisi, büyük savaş gemileri (ortak gemi altyapısı hazır; henüz başlanmadı).
- `Proposed` — Ek haritalar veya harita varyasyonları (şu an tek, sabit tohumlu harita).
- `Proposed` — Otomatik test altyapısı (şu an yok; ihtiyaç ve kapsam henüz belirlenmedi).

*Not: Bu fikirler kullanıcı tarafından onaylanmış görevler değildir; kapsam ve öncelik kararlaştırılınca `Planned` aşamasına alınır.*
