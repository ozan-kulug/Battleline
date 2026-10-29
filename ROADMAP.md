# Battleline — Roadmap

Son güncelleme: 2026-10-29 · Durumlar ve açıklamaları için [Görev durumu akışı](#görev-durumu-akışı)
Ayrıntı ve test sonuçları: [PROJECT_NOTEBOOK.md](PROJECT_NOTEBOOK.md) · Kurallar: [AGENTS.md](AGENTS.md)

## Mevcut aşama

**Aşama 3 — Deniz savaşı, ilk sürüm.** Oynanabilir Devriye Botu kodlandı ve commit edilmeden çalışma alanında bekliyor; tarayıcı testleri Antigravity'de sürüyor.

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

1. Devriye Botu tarayıcı testleri (Antigravity) → sonuçlar notebook'a.
2. Test sonucuna göre düzeltme ve bot commit'i (Claude).
3. Botun ateş altında geri çekilmesi ve çoklu bot dizilimi.

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
| Oynanabilir Devriye Botu | To verify | Kod: Claude · Test: Antigravity | Çalışma alanında, commit edilmedi; 8 test senaryosu notebook §5'te |
| Devriye Botu tarayıcı testleri | Developing | Antigravity | Sonuç bekleniyor |
| Codex çalışma rolünü AGENTS.md'ye ekleme | Done | Codex | Planlama, bağımsız inceleme ve dokümantasyon kapsamı ile ajanlar arası çakışma kuralları eklendi |
| Antigravity görev kapsamını genişletme | Done | Codex | Test bulgularına yönelik atanmış/kullanıcıca istenmiş sınırlı kod düzeltmeleri ve kayıt koşulları AGENTS.md'ye eklendi |
| Görev durumu akışını standartlaştırma | Done | Codex | Proposed'dan Done'a yedi aşamalı akış tanımlandı; mevcut işler yeni aşamalara taşındı |
| Dokunmatik konuşlanma testi | Planned | Antigravity | Hiç test edilmedi |
| Telefon genişliğinde İngilizce taşma kontrolü | Planned | Antigravity | |
| Botun ateş altında geri çekilmesi | Planned | — | Sorumlu atanmadı |
| Çoklu bot dizilimi (dar nehir) | Planned | — | Sorumlu atanmadı |
| Yeni birimlerin denge testi (dron operatörü, bot) | Planned | Antigravity | Uzun maçlar |
| 375 px seçim paneli taşması | Planned | — | Eski sorun |

## Yakın vadeli hedefler

- Devriye Botunu doğrulayıp commit etmek.
- Gemi davranışlarını tamamlamak: kendini koruma, çoklu gemi düzeni.
- Yeni özelliklerin dengesini uzun maçlarla ayarlamak.

## Öneri aşamasındaki fikirler

- `Proposed` — Ek gemi sınıfları: füze botu, çıkarma gemisi, büyük savaş gemileri (ortak gemi altyapısı hazır; henüz başlanmadı).
- `Proposed` — Ek haritalar veya harita varyasyonları (şu an tek, sabit tohumlu harita).
- `Proposed` — Otomatik test altyapısı (şu an yok; ihtiyaç ve kapsam henüz belirlenmedi).

*Not: Bu fikirler kullanıcı tarafından onaylanmış görevler değildir; kapsam ve öncelik kararlaştırılınca `Planned` aşamasına alınır.*
