# Destroyer Ücretli Füze Saldırıları — Araştırma ve Oyun Tasarımı

**Hazırlayan:** Codex  
**Tarih:** 2026-10-31  
**Amaç:** Destroyer seçildiğinde KP ödeyerek Tomahawk, Maritime Strike Tomahawk, SM-6 veya RGM-84 Harpoon satın alıp oyuncunun belirlediği hedefe ateşleme özelliği için Claude'a aktarılabilir araştırma ve tasarım özeti.

## 1. Projedeki mevcut durum

- Kıyı haritası, açık deniz ve liman var. Fırkateyn ve Destroyer yalnız Kıyı Cephesi'nde, maç öncesi ordu ekranından seçiliyor; maç içinde desteden çağrılamıyor.
- Destroyer sabit, 2.300 HP, 1.150 görüş menzili, iki CIWS yuvası ve 96 hücreli mevcut hava savunma füzesi yüküne sahip. Fırkateynde 24 hücre var. Bu mevcut füzeler otomatik hava savunmasıdır.
- Kart çağrılarında KP kullanılıyor; başlangıç rezervi 400, tavanı 1.500 KP. Birlik fiyatları yaklaşık 55–340 KP. Büyük gemilerin 620 OP'lik ordu kurma fiyatı ayrı bir bütçedir.
- `js/systems/projectiles.js` mevcut güdümlü füzeyi hareketli hedefe güdüyor; bu akış çoğunlukla hava hedeflerine göre kurulmuş. Koordinata giden füzenin patlayıp kara hedeflerine/stratejik binalara alan hasarı vermesi için yeni bir vuruş/etki yolu gerekir.
- Mermi ve bomba etkileri `combat.js` içindeki `damage`, `splashDmg`, `bldSplash`, `hurtB` ve `zones.js` sağlamlık hesabına bağlanabilir. CIWS, `k:'msl'` dâhil gelen mühimmatları yakalamayı zaten deneyebiliyor.
- Bu özellik başlangıçta yalnız oyuncunun Destroyer'ına açılmalı. Fırkateyn, YZ gemileri ve diğer platformlar kapsam dışı tutulup ortak sistem genişletilebilir bırakılmalı.

## 2. Dört mühimmatın gerçek görev farkları

| Mühimmat | Gerçek görev / güdüm | Kamuya açık harp başlığı ve fiyat verisi | Oyundaki önerilen rol |
|---|---|---|---|
| **Tomahawk Block V (kara taarruzu)** | Uzun menzilli, düşük irtifalı seyir füzesi; koordinatlı kara hedeflerine hassas taarruz. Block IV/V için kamuya açık menzil yaklaşık 900 deniz mili; seyir ve görev planı oyun haritasından çok daha büyük ölçekli. | NAVAIR FY26 için yaklaşık **3,64 milyon ABD doları** Block V birim maliyeti verir. Eski konvansiyonel TLAM-E kaynağında 1.000 lb sınıfı üniter harp başlığı belirtilir. Block Va'nın kendi harp başlığına dair açık ve ayrı bir güncel değer bulamadım; 1.000 lb bilgisini Va'ya kesin veri olarak atfetmemek gerekir. | Yalnız kara koordinatına ateşlenen en güçlü yapı/alan taarruzu. Harita üzerindeki herhangi bir geçerli kara koordinatına gider; hareketli gemi aramaz. |
| **Maritime Strike Tomahawk (Block Va)** | Block V Tomahawk'a denizde hareketli hedefleri bulup vurmak için seeker kiti ekler; uzun menzilli deniz hedefi taarruzu. | FY25 Navy bütçe tablosunda 18 Block Va için birim maliyet **4,788611 milyon ABD doları** görünür. FY26 Army bütçesinde Va için Tomahawk sistem birim maliyeti yaklaşık 6,125 milyon dolar; bütçe satırları hizmet, canister ve kapsam bakımından birebir karşılaştırılmamalı. Va'nın seeker performansı ve harp başlığı ayrıntıları kamuya açık değil. | Yalnız düşman gemilerine karşı. Oyuncu su üzerinde hedef bölgesi belirler; seeker o bölgede geçerli düşman gemisine yönelir. Tomahawk'ın kara saldırısı rolünü tekrar etmez. |
| **SM-6 Block IA** | Öncelikle uzun menzilli hava savunması; ayrıca balistik füze terminal safha savunması ve ikincil anti-surface saldırı rolü. Aktif/yarı aktif radar güdüm ailesi. | FY26 Navy bütçesindeki anlaşmalı birim maliyeti **5,3 milyon ABD doları**. CBO, anti-gemi rolünün ikincil olduğunu ve yaklaşık **140 lb** harp başlığının ağır gemisavar başlıklarından küçük kaldığını belirtir. Başlık parçacıklı/blast-fragmentation sınıfında; büyük gemiyi tek vuruşta batıracak şekilde tasarlanmamış. | En pahalıya yakın, en hızlı tepki veren fakat gemiye karşı en düşük hasarlı seçenek. Anti-ship hedefe yönelir; kısa uçuş süresi ve sınırlı hasar/baskılama etkisiyle farklılaşır. Destroyer'ın otomatik hava savunma stoğundan ayrı bir satın alma aksiyonu olarak gösterilmeli. |
| **RGM-84 Harpoon (yüzeyden atılan Block II ailesi)** | Her hava koşulunda gemisavar; alçak deniz seyri ve terminal aktif radar güdümü. Block II ailesi GPS destekli seyrüseferle kıyı/karmaşık deniz ortamında hedef seçimini geliştirir. Harpoon Block II için açık kaynaklarda yaklaşık 124 km, ailede varyanta göre daha geniş aralıklar verilir. | Aile için kamuya açık değer yaklaşık **224 kg / 488 lb** delici-yüksek patlayıcılı harp başlığıdır; varyantlar arasında fark vardır. Güncel bağımsız missile-only fiyat bulamadım. 2020 DoD sözleşmesi 467 Block II füze ve destek ekipmanı için 656,98 milyon dolar bildirir; toplamı adede bölmek yaklaşık 1,41 milyon dolar verir ama bu **füzenin saf birim fiyatı değildir**. | Orta menzilli, gemisavar ve Tomahawk/MST'den ucuz seçenek. Hedef gemiye delici doğrudan hasar; kara birimi/bina hedeflemez. |

### Etki gücü hakkında önemli ayrım

Harp başlığının toplam ağırlığı, patlayıcı dolgu ağırlığı ya da TNT eşdeğeriyle aynı şey değildir. Harpoon'un delici başlığı gemi gövdesini geçip içeride etkili olacak şekilde tasarlanmıştır; SM-6'nın parçacıklı başlığı ise öncelikle hava hedefleri içindir. SM-6'nın gemiye çarpması hasar verebilir ama gerçek dünyadaki etkiyi “140 lb = şu kadar bina/alan hasarı” diye doğrusal çevirmek doğru olmaz. Maritime Strike Tomahawk'ın açıkça doğrulanabilen farkı seeker/deniz hedefi görevidir; ayrı harp başlığı gücü için güvenilir açık veri bulamadım.

## 3. Oyun içi fiyat önerisi

Gerçek dolar fiyatları yalnızca göreli dayanak olsun; KP'ye doğrudan kur çevrimi değildir. Battleline'da 400 KP başlangıç rezervi, 1.500 KP tavanı ve yaklaşık 55–340 KP birim fiyatları olduğundan özel gemi mühimmatı pahalı ama ulaşılabilir olmalı.

| Mühimmat | İlk deneme fiyatı | Maliyet gerekçesi |
|---|---:|---|
| Harpoon | **140 KP** | En ucuz seçenek; yalnız gemi hedeflerine yarar ve açık güncel fiyatı belirsiz. |
| Tomahawk | **280 KP** | Uzun menzilli kara taarruzu ve yapı hasarı; tek atış olarak pahalı. |
| Maritime Strike Tomahawk | **340 KP** | Uzun menzilli hareketli gemi hedefi ve seeker avantajı; Harpoon'dan pahalı. |
| SM-6 | **380 KP** | Kamuya açık birim fiyatı en yüksek; yüksek hız/çok rollü kabiliyet. Anti-ship hasarı Harpoon/MST'den düşük kalmalı, bu yüzden fiyatı sadece ham hasara göre yorumlanmamalı. |

Bu değerler başlangıç denge değeridir; kalıcı fiyat diye kodlanmadan önce maç testinde ölçülmeli. Her atış ayrı satın alınır; Destroyer'ın mevcut 96 hava savunma hücresini azaltmaz. Ücret hedef geçerli olup füze gerçekten fırlatılacağı anda kesilsin. Hedef modu iptalinde veya geçersiz hedef/menzil durumunda KP düşmesin.

## 4. Önerilen oyuncu akışı ve hedef kuralları

1. Savaşta oyuncu Destroyer'ı seçer; panelde dört füze, kısa görev açıklaması ve KP bedeli görünür.
2. Mühimmat düğmesine basınca nişan modu açılır. İstenen hedefe tıklanınca oyun hedef tipini, menzili ve KP'yi doğrular; ancak başarılı fırlatma anında KP kesilir.
3. **Tomahawk:** kara koordinatı; düşman birlikleri, binalar, köprüler ve stratejik nokta binaları vurulabilir. Dost birliklere hasar varsayılan olarak mevcut alan hasarı kuralları gibi uygulanmalı.
4. **MST ve Harpoon:** su üzerindeki hedef bölgesi. Yalnız denizde bulunan düşman gemisine yönelir; boş suya veya kara hedefine ateş emri verilmez. Seeker hedef gemiyi uçuş boyunca izleyebilir. YZ'de gemi olmadığından gemiye karşı davranış testi için geçici düşman gemi hedefi/senaryosu gerekir.
5. **SM-6 (bu özelliğin saldırı modu):** düşman gemisine veya uygun hava hedefine ayrı hedef olarak yönelir. Harp başlığı daha küçük olduğundan gemide Harpoon/MST hasarına yaklaşmamalı; destroyerin kendi otomatik AA hedefleme/96 hücre stoğu bu yeni satın alınabilir saldırı aksiyonuyla karıştırılmamalı.
6. Füze uçuşu, hedefin sınıfına uygun hız/iz ve patlama efekti gösterir. Gelen füzeler mevcut CIWS nokta savunması tarafından engellenebilir; denge testinde Fırkateyn/Destroyer CIWS olasılıkları dikkate alınmalı.
7. Harita 4.800×3.000 dünya birimi olduğu için gerçek km menzilleri doğrudan harita koordinatına çevrilmesin. İlk prototipte kıyı haritasında taktik hedeflere erişecek menzil; silahlar arasında ise Harpoon kısa/orta, SM-6 hızlı/orta, Tomahawk ve MST uzun menzilli olacak şekilde göreli menzil kullanılsın.

## 5. İlk denge/hasar önerisi (gerçek harp başlığı verisinden ayrıdır)

Mevcut ölçekte piyade 16–22 HP, IFV 240 HP, tank 400 HP; Fırkateyn 1.400 HP ve Destroyer 2.300 HP. Aşağıdakiler **oyun başlangıç değerleridir**, gerçek patlayıcı eşdeğeri değildir:

| Mühimmat | Oyun hedefi | Önerilen etki taslağı |
|---|---|---|
| Tomahawk | Kara noktası | Yaklaşık 90–110 dünya birimi alan; merkezde piyade/ince araçlar için ölümcül, ağır tankta ağır hasar ama garanti tek atış imhası değil; bina ve nokta sağlamlığına yüksek hasar. |
| MST | Düşman gemisi | Gemiye doğrudan isabet odaklı, yaklaşık 650–800 HP; küçük alan etkisi. Destroyer'ı tek atışta batırmamalı. |
| Harpoon | Düşman gemisi | Yaklaşık 450–600 doğrudan HP, MST'den düşük; daha ucuz ve daha kısa menzilli. |
| SM-6 | Düşman gemisi/hava hedefi | Gemiye yaklaşık 220–320 HP veya kısa süreli baskılama; hava hedefine karşı yüksek isabet/önleme rolü. |

Gerçek hasar, `damage` fonksiyonunun zırh/üstten vuruş kurallarıyla uyumlu bir silah tanımı olarak uygulanmalı. Alan patlaması `splashDmg` ve yapı etkisi `bldSplash`/`hurtB` üzerinden çalışmalı. Yeni füze doğrudan `state.objs` ele geçirmesin: noktaya hasar, o noktaya bağlı binalar/köprü üzerinden `zones.js` sağlamlık oranına yansısın. Nokta yıkık olsa da mevcut kurala göre ele geçirilmesi ve zafer sayımında kalması sürmeli.

## 6. Claude için muhtemel dosya kapsamı

- `js/config.js`: füze adları, görev sınıfları, menzil, hız, hasar, alan ve KP maliyet tablosu.
- `js/state.js`, `js/input.js`, `js/systems/orders.js`: seçili Destroyer için nişan modu, tıklama/iptal ve hedef doğrulama.
- `js/ui/panels.js`, `js/ui/hud.js`, `css/panels.css`, `js/i18n.js`: satın al/ateşle düğmeleri, KP bedeli, durum ve TR/EN metinler.
- `js/systems/combat.js`, `js/systems/projectiles.js`, `js/systems/effects.js`: koordinata giden füze, hareketli gemi takibi, impact, patlama, bina/asker hasarı ve CIWS etkileşimi.
- `js/renderer.js`: Destroyer'dan çıkan füze/iz ve hedefte farklı patlama görünümü.
- `js/systems/zones.js`: doğrudan değil, yapı hasarı üzerinden doğru stratejik nokta sağlamlığı teyidi.
- `js/systems/economy.js`: gerekirse KP düşümü/iptal geri ödemesi; mevcut `addKP` yalnızca gelir/yükleme yardımcısı, negatif para desteği ayrıca kontrol edilmeli.

### Tamamlanma ve doğrulama ölçütü

- Yalnızca oyuncunun Destroyer'ı maç içinde ücretli füze modunu açar; Fırkateynin mevcut davranışı ve Destroyer'ın otomatik AA stoğu bozulmaz.
- Yeterli KP'de geçerli hedefe ateşlerken tam bir kez doğru KP düşer; geçersiz hedef, yetersiz KP ve iptal para harcamaz.
- Dört füze doğru hedef türüne/menzile gider; Tomahawk kara yapısı ve birlikleri etkiler; MST/Harpoon su hedefindeki düşman gemisine yönelir; SM-6 sınırlı anti-ship ve hava rolünü uygular.
- Hareketli gemi hedefi uçuşta izlenir; hedef yok olursa füze kayıp/ıskalama kuralına göre sonlanır; CIWS müdahalesi çalışır.
- Hasar binaları, yıkılabilir stratejik nokta sağlamlığını ve gerektiğinde köprüleri doğru etkiler; stratejik nokta sahipliği/zafer kuralını doğrudan atlamaz.
- Kıyı haritası, normal güdümlü füzeler, CIWS ve TR/EN metinleri gerilemez.
- Tarayıcı testleri Antigravity tarafından ayrıca yapılır; test yapılmadan Verified/Done işaretlenmez.

## 7. Kaynaklar

1. NAVAIR, [Tomahawk](https://www.navair.navy.mil/product/Tomahawk) — Block IV/V görev, Block Va/Vb farkı, düşük irtifa ve FY26 Block V yaklaşık birim maliyeti.
2. U.S. Navy, [Tomahawk Cruise Missile fact file](https://www.navy.mil/Resources/Fact-Files/DisplayFactFiles/Article/2169229/tomohawk-cruise-missile/tomahawk-cruise-missile/) — Block Va seeker kiti, Block IV/V menzil ve geleneksel TLAM-E harp başlığı bilgisi.
3. Department of the Navy, [FY2026 Marine Corps Procurement Programs Justification Book, Tomahawk P-5a](https://www.secnav.navy.mil/fmc/fmb/Documents/26pres/PMC_Book.pdf) — FY25 Block Va 18 adet ve 4,788611 milyon dolar birim maliyet satırı.
4. Department of the Army, [FY2026 Missile Procurement Army Justification Book](https://www.asafm.army.mil/Portals/72/Documents/BudgetMaterial/2026/Discretionary%20Budget/Procurement/Missile%20Procurement%20Army.pdf) — FY26 Tomahawk bütçe satırları ve Va birim maliyet notu; hizmet/bütçe kapsamı farklı olabilir.
5. RTX/Raytheon, [SM-6](https://www.rtx.com/raytheon/what-we-do/sea/sm-6-missile) — hava savunması, balistik füze savunması, anti-surface gösterimi ve çoklu kullanım.
6. Department of the Navy, [FY2026 Weapons Procurement Navy Justification Book, Standard Missile](https://www.secnav.navy.mil/fmc/fmb/Documents/26pres/WPN_Book.pdf) — FY26 SM-6 Block IA anlaşmalı birim fiyatı 5,3 milyon dolar.
7. Congressional Budget Office, [Options for Fielding Ground-Launched Long-Range Missiles](https://www.cbo.gov/publication/56143) — SM-6'nın öncelikli hava savunma rolü, ikincil anti-ship rolü ve 140 lb başlık karşılaştırması.
8. U.S. Navy/NAVAIR, [Harpoon](https://www.navair.navy.mil/product/Harpoon) — gemisavar görev, orta safha ve aktif radar seeker, deniz yüzeyine yakın uçuş; Block II/II+ özellikleri.
9. Center for Strategic and International Studies, [Harpoon](https://missilethreat.csis.org/missile/harpoon/) — varyanta göre menzil, 224 kg harp başlığı ve Block II farkları. Varyant verilerini tek bir kesin değer gibi kullanmamak gerekir.
10. U.S. Department of Defense, [May 13, 2020 Harpoon Lot 91 contract notice](https://www.defense.gov/News/Contracts/Contract/Article/2185990/) — 467 Block II ve destek ekipmanı için 656,98 milyon dolar; yalnızca paketlenmiş toplamdır, saf birim fiyat değildir.
11. Air & Space Forces Magazine, [November 1988 missile fact pages (PDF)](https://www.airandspaceforces.com/app/uploads/2024/09/AFmag_1988_11.pdf) — eski AGM-84A için 488 lb delici HE ve deniz seyri; güncel Block II'ye birebir özellik sayılmamalıdır.

**Kaynak kullanım notu:** Açık kaynaklar varyant ve maliyet kapsamlarını farklı verir. Tasarımda kesin olan görev ayrımı esas alınmalı; yayımlanmayan MST başlık/menzil ayrıntıları ve Harpoon saf birim fiyatı uydurulmamalıdır.

## 8. Claude'a aktarılacak görev metni

```text
ROADMAP.md'deki “Destroyer'a ücretli hassas füze saldırıları” görevini uygula. Önce AGENTS.md, ROADMAP.md, PROJECT_NOTEBOOK.md ve DESTROYER_MISSILE_STRIKE_RESEARCH.md dosyalarını oku; git durumunu ve son commitleri kontrol et. Görev durumunu başlamadan Developing yap.

İlk sürüm yalnız Kıyı Cephesi'nde maç sırasında seçilmiş oyuncu Destroyer'ında çalışsın. Destroyer panelinden Tomahawk, Maritime Strike Tomahawk, SM-6 ve RGM-84 Harpoon seçilip KP karşılığı ateşlenebilsin. Araştırma dosyasındaki hedef görevlerini uygula: Tomahawk kara koordinatı; MST/Harpoon denizdeki düşman gemisi; SM-6 gemi veya uygun hava hedefi. Gerçek menzilleri dünya koordinatına birebir çevirmeden göreli oyun menzili kullan. Başlangıç KP önerileri Harpoon 140, Tomahawk 280, MST 340, SM-6 380; bunları sabit gerçek değil, araştırmaya dayalı ilk denge değerleri olarak uygula.

Geçerli hedef, menzil ve yeterli KP kontrolünden sonra, füze gerçekten fırlatıldığı anda KP'yi bir kez düş. Hedef modu iptal edilirse ya da hedef geçersizse KP harcama. Koordinat Tomahawk'ı mevcut projectile akışından farklı olarak kara birliklerine, binalara, köprülere ve stratejik nokta sağlamlığına etki edecek şekilde tamamla. Anti-gemi füzeleri hedef gemiyi uçuş sırasında izlesin; uygun düşman gemisi yoksa hedef türünü reddet veya tasarlanmış ıskalama kuralını uygula. SM-6'nın gemiye hasarı diğer gemisavar füzelerinden düşük olsun. Gelen füzelerin mevcut CIWS ile etkileşimini koru.

Destroyer'ın mevcut otomatik hava savunma/96 VLS mühimmatını yeni ücretli atışlarla karıştırma veya azaltma. Fırkateyn, YZ gemileri ve Nehir Hattı bu ilk görev kapsamında değil. Mevcut yıkılabilir stratejik nokta davranışını doğrudan atlamadan, yapı/köprü hasarı üzerinden kullan. TR/EN metinleri, iptal ve yetersiz KP durumlarını tamamla.

ROADMAP'teki muhtemel dosya kapsamını başlangıç noktası al; git durumunda bulunan scratch/ veya başkasına ait değişikliklere dokunma. Kapsam dışı yeni dosya gerekirse ROADMAP'i güncelle. AGENTS.md'ye göre kendi statik kontrollerini yap ve gerçek sonuçları PROJECT_NOTEBOOK.md'ye kaydet; tarayıcı/oynanış doğrulamasını Antigravity'ye bırak. Sonunda görev durumunu sonuca göre güncelle ve değişen dosyalar, kontroller, doğrulanmamış noktalar ve devirleri raporla.
```
