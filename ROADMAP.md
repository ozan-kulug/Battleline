# Battleline — Roadmap

Son güncelleme: 2026-10-29 · Durum anahtarı: **To do** · **In progress** · **Verify** (kod bitti, test bekliyor) · **Done**
Ayrıntı ve test sonuçları: [PROJECT_NOTEBOOK.md](PROJECT_NOTEBOOK.md) · Kurallar: [AGENTS.md](AGENTS.md)

## Mevcut aşama

**Aşama 3 — Deniz savaşı, ilk sürüm.** Oynanabilir Devriye Botu kodlandı ve commit edilmeden çalışma alanında bekliyor; tarayıcı testleri Antigravity'de sürüyor.

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
| Oynanabilir Devriye Botu | Verify | Kod: Claude · Test: Antigravity | Çalışma alanında, commit edilmedi; 8 test senaryosu notebook §5'te |
| Devriye Botu tarayıcı testleri | In progress | Antigravity | Sonuç bekleniyor |
| Dokunmatik konuşlanma testi | To do | Antigravity | Hiç test edilmedi |
| Telefon genişliğinde İngilizce taşma kontrolü | To do | Antigravity | |
| Botun ateş altında geri çekilmesi | To do | — | Sorumlu atanmadı |
| Çoklu bot dizilimi (dar nehir) | To do | — | Sorumlu atanmadı |
| Yeni birimlerin denge testi (dron operatörü, bot) | To do | Antigravity | Uzun maçlar |
| 375 px seçim paneli taşması | To do | — | Eski sorun |

## Yakın vadeli hedefler

- Devriye Botunu doğrulayıp commit etmek.
- Gemi davranışlarını tamamlamak: kendini koruma, çoklu gemi düzeni.
- Yeni özelliklerin dengesini uzun maçlarla ayarlamak.

## Uzun vadeli hedefler

- Ek gemi sınıfları: füze botu, çıkarma gemisi, büyük savaş gemileri (ortak gemi altyapısı hazır; henüz başlanmadı).
- Ek haritalar veya harita varyasyonları (şu an tek, sabit tohumlu harita).
- Otomatik test altyapısı (şu an yok; ihtiyaç ve kapsam henüz belirlenmedi).

*Not: Uzun vadeli hedefler, bu oturumdaki isteklerden ve README'deki hazırlık notlarından çıkarıldı; kullanıcı tarafından onaylanmış bir plan değildir.*
