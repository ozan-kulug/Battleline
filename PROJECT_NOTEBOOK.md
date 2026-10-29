# Battleline (Cephe Hattı) — Project Notebook

Kalıcı proje defteri. Kod değişiklikleri, test sonuçları ve önemli kararlar buraya kaydedilir (kurallar: [AGENTS.md](AGENTS.md), plan: [ROADMAP.md](ROADMAP.md)).
Son güncelleme: 2026-10-29 · Güncelleyen: Claude

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

## 4. Son geliştirmeler ve kararlar

- **Oynanabilir Devriye Botu — commit edilmedi, çalışma alanında.** Dosyalar: `js/config.js`, `js/systems/units.js`, `js/systems/orders.js`, `js/systems/unit-update.js`, `js/systems/movement.js`, `js/systems/combat.js`, `js/ui/panels.js`, `js/systems/ai.js`, `js/i18n.js`, `README.md` (10 dosya, +18/−14). İçerik:
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

**Doğrulanmamış (Antigravity tarayıcı testleri sürüyor — sonuç henüz yok):**
- Oynanabilir Devriye Botunun tarayıcıdaki davranışı. Bekleyen senaryolar:
  1. Ordu ekranında Deniz kategorisinden bot ekleme; konuşlanmada nehrin kendi yarısına sürükleme, karaya ve düşman yarısına bırakmanın reddi.
  2. Savaşta Deniz sekmesinden bot alma; nehrin güney ucundan gelişi.
  3. Botu üç köprünün altından geçen uzak bir noktaya gönderme; karaya çıkmaması.
  4. Köprüde kara birlikleri varken altından geçiş; itişme/ezme olmaması.
  5. Saldırı hareketiyle düşman piyadesine ateş; roketatar veya tankla batırılma; enkaz bırakmaması ve kartın geri gelmesi.
  6. Hasarlı botun nehrin kendi ucunda ikmal/onarım alması; "Cepheden çek" (M) ile çıkış.
  7. Uzun maçta YZ'nin bot alıp nehirde devriye gezdirmesi.
  8. İngilizce ve Türkçe modda bot metinleri.
- Dokunmatik ekranda konuşlanma sürüklemesi (hiç test edilmedi).
- Telefon genişliğinde İngilizce metin taşması (kontrol edilmedi).
- Eş yükselti çizgilerinin son görünümü (belirginleştirildikten sonra ekranda bakılmadı).
- Yeni birimlerin oyun dengesi (dron operatörü fiyat/stok, bot) uzun maçlarda denenmedi.

## 6. Bilinen sorunlar ve riskler

- Bot kendi başına geri çekilmez (inisiyatifin güvenli nokta kontrolü suyu reddeder).
- Birden çok bota emir verilince dizilim noktaları dar nehirde üst üste düşebilir.
- YZ botu odak noktasının hizasına, nehrin düşman yarısına da gönderebilir.
- Zırhı 2 olduğundan piyade tüfeği ve makineli tüfek bota zarar veremez (mevcut zırh mantığı).
- 375 px genişlikte seçim paneli sağdan biraz taşıyor (konuşlanmadan önce de vardı).
- Panik ve moral asker başınadır; manga mantığı askerleri yalnızca birlikte tutar.
- Bu bilgisayarda Python kurulu değil; README'deki `python -m http.server 8000` burada çalışmaz (Node sunucusu veya `npx serve .` kullanıldı).
- Doğrulanmadı: depodaki uzak dalda (`origin`) başka değişiklik olup olmadığı yalnızca `master` = `origin/master` olarak görüldü.

## 7. Sonraki adımlar

1. Antigravity bot testlerini tamamlasın; sonuçları §5'e işlesin.
2. Test sonucuna göre bot değişikliklerini commit etmek (veya hataları düzeltmek).
3. Botun ateş altında geri çekilme davranışı ve çoklu bot dizilimi.
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
