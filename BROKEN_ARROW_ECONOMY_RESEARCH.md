# Broken Arrow ekonomi ve savaş döngüsü — Claude için araştırma notu

**Araştırma tarihi:** 2026-10-30  
**Kapsam:** Özellikle standart çok oyunculu / çatışma maçlarındaki ekonomi; senaryo ve harekât görevleri özel kurallar içerebilir.  
**Sürüm notu:** Resmî duyurulara göre 29 Ekim 2026'da 1.2.2 yayımlandı. 1.2.1 ve 1.2.2 duyurularında ekonomi sistemi için yeni bir kural değişikliği belirtilmiyor. Bu nedenle aşağıdaki temel sistem, 30 Temmuz 2026 tarihli 1.1.1 güncellemesi ve resmî kılavuzlarla birlikte okunmalıdır. [1.2.2 duyurusu](https://steamcommunity.com/app/1604270?l=english), [1.1.1 notları](https://brokenarrow_backend.slitherine.com/news/broken-arrow-major-update), [1.2.1 notları](https://steamcommunity.com/app/1604270/announcements/)

## 1. Kısa çerçeve

Broken Arrow'da “ekonomi” tek bir para sayacından oluşmaz. Birbirine bağlı ama farklı görevleri olan sistemler vardır:

1. **Battlegroup/deck bütçesi:** Maçtan önce hangi birlik kartlarının ve donanım seçeneklerinin orduya alınacağını sınırlar.
2. **Requisition puanı ve dinamik gelir:** Maç içinde takviye çağırma ve lojistik yük taşıma temposunu belirler.
3. **Upkeep:** Sahadaki ordunun büyüklüğüne göre yeni puan gelirini azaltır.
4. **Fiziksel ikmal:** Mühimmat, onarım ve piyade sağlığı için harcanan, taşıma kapasitesi sınırlı malzemedir.
5. **Maç skoru:** Conquest hedef puanları ve imha puanları kazanmayı belirler; bunlar takviye puanıyla aynı sayaç değildir.

Bu ayrım, Battleline tasarımına aktarılabilecek en önemli noktadır: ordu kurma kapasitesi, sahaya sürme bütçesi, ikmal stoku ve zafer skoru tek bir kaynağa indirgenmemelidir.

## 2. Maç öncesi ordu kurma: deck bütçesi

- Oyuncu bir ulus ve iki uzmanlık seçerek battlegroup oluşturur. Uzmanlıklar erişilebilen birlikleri ve kategori bütçelerinin dağılımını etkiler; örneğin piyadeye ağırlık veren seçim, piyade kategorisi için daha fazla alan bırakır. [Resmî Survival Guide](https://brokenarrow_backend.slitherine.com/news/broken-arrows-survival-guide), [Resmî Oyun Kılavuzu](https://ftp.matrixgames.com/pub/BrokenArrow/BrokenArrowManualEBOOK.pdf)
- Birlik kartı maliyetleri, kategori sınırları ve kart/konfigürasyon erişimi maç içi puan gelirinden ayrıdır. Deck'te bir birliğe yer vermek, onu sahada ücretsiz üretmek anlamına gelmez; maç içinde çağrıldığında ayrıca requisition puanı harcanır.
- Birlik fiyatları ve yükseltme/teçhizat ek maliyetleri, farklı uzmanlıkların güçlü yanlarını dengelemek için düzenli olarak değiştiriliyor. 1.2.0 ve 1.2.1 resmî güncelleme notlarında piyade, araç, topçu, hava savunma, helikopter ve uçak fiyatlarında ayrı ayarlamalar bulunuyor. [1.2.0 ekonomi ayarları](https://brokenarrow_backend.slitherine.com/news/russian-guard-dlc-release), [1.2.1 duyurusu](https://steamcommunity.com/app/1604270/announcements/)

**Tasarım sonucu:** Deck/ordu kurma aşaması “bu maçta neyi kullanabilirim?” sorusunu; maç içi ekonomi ise “şimdi hangi kuvveti sahaya çağırabilirim?” sorusunu cevaplar.

## 3. Maç içi puan: requisition, gelir ve upkeep

### Requisition ve rezerv

- Takviye menüsündeki rezerv, çağrılabilecek birliklerin o anki puan bütçesidir. Birlik çağırma maliyeti bu rezervden düşer. Resmî 1.1.1 güncellemesi rezervin en fazla **1500 puan** birikmesine izin veren bir üst sınır ekledi. [1.1.1 resmî notları](https://brokenarrow_backend.slitherine.com/news/broken-arrow-major-update)
- Bu tavan, geliri sürekli biriktirip maçın ilerleyen bölümünde büyük bir orduyu tek seferde sahaya indirme stratejisini sınırlar. Oyuncuyu puan geldikçe karar vermeye iter.

### Gelir ve sahadaki ordu maliyeti

- Resmî geliştirici yazısı temel geliri **+300 puan/dakika** olarak tanımlıyor. Upkeep, sahada yaşayan birliklerin maliyetine bağlı olarak bu geliri düşürüyor. 1.1.1 güncellemesi eski doğrusal sistemin yerine kademeli/segmentli dinamik gelir sistemini getirdi. [Geliştirici Devblog 1.0](https://steamcommunity.com/ogg/1604270/announcements/detail/676246847634801321), [1.1.1 resmî notları](https://brokenarrow_backend.slitherine.com/news/broken-arrow-major-update)
- Geliştiricinin PTE devblog'unda örneklenen gelir eğrisi şöyledir: 0 upkeep → +300/dk; 750 → +288; 1500 → +210; 2500 → +195; 3500 → +90; 5000 → 0. Bu tablo, sistemin kademeli gelir düşürme fikrini gösterir.
- **Önemli sürüm uyarısı:** Bu sayısal eşikler 18 Mayıs 2026 tarihli PTE/devblog içeriğinden geliyor. Temmuzdaki canlı sürüm güncellemesi dinamik geliri ve 1500 rezerv tavanını doğruluyor; ancak kamuya açık canlı yama notları aynı eşik tablosunun son hâlini vermiyor. Bu yüzden tabloyu 1.2.2'nin kesin güncel formülü gibi koda taşımayın. Güncel tam eğri oyun içinde ölçülmeden varsayım olarak kalmalı.
- Tasarım hedefi, sahaya çok az kuvvet koyup geliri korumak için uzun süre beklemeyi ve avantajlı takas yapan oyuncuyu cezalandırmayı azaltmak. Geliştirici, yeni sistemin kayıp sonrası tekrar kuvvet çağırmayı kolaylaştırdığını ve iyi takaslarla kademeli kuvvet kurmayı ödüllendirdiğini söylüyor. [Geliştirici Devblog 1.0](https://steamcommunity.com/ogg/1604270/announcements/detail/676246847634801321)

### Birlik kaybı, geri çekilme ve yeniden çağırma

- Resmî başlangıç kılavuzunda imha olan birliklerin bir süre sonra kart havuzuna döndüğü, geri çekilen birliğin ise hasar ve harcadığı mühimmata göre kısmi puan iadesiyle geri gönderildiği yazıyor; asgari iade başlangıç maliyetinin %20'si olarak belirtilmiş. [Resmî Basics PDF](https://www.matrixgames.com/amazon/BrokenArrow/BrokenArrow_Basics.pdf)
- Bu kılavuz lansman dönemi kurallarını içerebilir. Güncel 1.1.1 notları ölüm sonrası bekleme sürelerinin artırıldığını doğruluyor, ancak tüm kart geri dönüş/iade formülünü yeniden yayımlamıyor. Claude, kesin süre ve oranları kopyalamadan önce güncel oyun içi davranışı doğrulamalı.
- Stratejik etki: Ölüm yalnızca birim bedelini kaybetmek değildir; kartın yeniden kullanılabilir olmasına kadar takviye seçeneği de kapanabilir. Hasarlı birliği geri çekmek, onu tamamen kaybetmekten daha iyi ekonomik sonuç verebilir.

## 4. İkmal, onarım ve taşıma

- İkmal, requisition'dan ayrı fiziksel bir stoktur. İkmal yükü kamyon/helikopter gibi taşıyıcı birim çağrılırken seçilir; kapasite ağırlıkla sınırlıdır. Resmî temel kılavuz 1000 kg'lık seçimleri ve taşıyıcı kapasitesini gösterir. [Resmî Basics PDF](https://www.matrixgames.com/amazon/BrokenArrow/BrokenArrow_Basics.pdf)
- Taşıyıcı ikmali boşaltınca yerde bir ikmal noktası oluşur. Yakındaki birlikler mühimmat doldurabilir, araçlar tamir olabilir, piyade sağlık kazanabilir. İkmal noktasının işlevleri kapatılıp açılabilir; müttefiklerle paylaşım da ayarlanabilir. Kılavuz, ikmal yığınlarının ateş alınca patlayabildiği için saklanması gerektiğini belirtiyor. [Resmî Basics PDF](https://www.matrixgames.com/amazon/BrokenArrow/BrokenArrow_Basics.pdf)
- 1.1.1 güncellemesi ikmal noktasının ikmal yarıçapını **50 m'den 75 m'ye** yükseltti ve bazı piyade taşıyıcılarına sınırlı “Resupply” yeteneği ekledi. Taşıyıcının kendi stoğundan ikmal, yerdeki ikmal noktasından ikmalin yarı hızında. Aynı güncelleme sınırsız “Supply” yeteneğini sınırlı mühimmat yeteneğiyle değiştirdi. [1.1.1 resmî notları](https://brokenarrow_backend.slitherine.com/news/broken-arrow-major-update)
- Tamir yalnızca can puanını artırmakla kalmaz; resmî kılavuza göre tamir tamamlandığında kritik araç arızaları da giderilir. İkmal ve tamir, pahalı bir birimi yenisiyle değiştirmekten daha ucuz olabilir; resmî Matrix Games taktik yazısı, düşük maliyetli tamir ekiplerinin yüksek maliyetli tankları kurtarmadaki değerini örnekliyor. [Resmî lojistik taktik yazısı](https://www.matrixgames.com/news/mission-accomplished-how-to-win-in-broken-arrow)

**Tasarım sonucu:** İkmal “yakında dur ve ücretsiz iyileş” değildir; taşıma kapasitesi, konum, güvenlik ve tüketim kararıdır. Bir ikmal aracının kaybı hem aracı hem taşıdığı stoğu tehlikeye atar.

## 5. Hedef kontrolü ve ekonomi ayrımı

- 1.1.1 ile Conquest modu eklendi: ele geçirilen hedef bölgeleri zaman içinde Conquest puanı üretir; zafer eşiği iki takımın kontrol ettiği hedef sayısı farkına göre ölçeklenir. İmha puanı kuralları ayrı kalır; fazlar arası telafi kaldırıldı. [1.1.1 resmî notları](https://brokenarrow_backend.slitherine.com/news/broken-arrow-major-update)
- Dolayısıyla hedef kontrolü **zafer puanı ve harita baskısı** üretir; bu, doğrudan takviye rezervine eklenen requisition ile aynı şey değildir. Gelir ve skorun ayrı sayaçlar olması stratejik seçimi okunur kılar.
- 1.2.1'de çok oyunculu hedef bölgeleri için yeni contest sistemi geldi: iki taraf da bölgede birlik bulundurunca bölge taraflardan birine puan yazmaya devam etmek yerine tarafsızlığa doğru kaymaya başlıyor. [1.2.1 resmî notları](https://steamcommunity.com/app/1604270/announcements/)

## 6. Battleline için aktarılabilir fikirler

Broken Arrow temposu hızlıdır; Battleline'da haritayı büyütüp araçları yavaşlatma isteği bulunduğu için sistemi birebir kopyalamak uygun olmaz. Uyarlanabilecek tasarım ilkeleri:

1. **Kaynak türlerini ayır:** Ordu/deste kapasitesi, maç içi takviye puanı, fiziksel ikmal ve zafer puanı farklı sorulara cevap versin.
2. **Gelirle sahadaki kuvvet arasında bağ kur:** Çok büyük kuvveti aynı anda sürdürmek yeni takviye gelirini azaltabilir; ama ilk birimleri çıkarmak geliri sıfırlamamalı. Azalan getirili birkaç kademe, keskin doğrusal cezadan daha anlaşılır ayarlanabilir.
3. **Rezerv tavanı ekle:** Oyuncu çok uzun süre bekleyip sınırsız kaynak biriktiremesin. Tavan, taktik kararları zaman içinde dağıtır.
4. **Kayıp ve geri çekilmeyi farklılaştır:** Tam kayıp kartı/gecikmeyi etkilesin; güvenli tahliye küçük bir iade ve daha kısa yeniden kullanım süresi verebilir.
5. **İkmali mekânsal ve sınırlı tut:** Taşıma kapasitesi, boşaltma, kapsama alanı, tüketim ve düşman ateşine açıklık önem taşısın. Köprü tamiri gibi görevlerde kamyonun tehlikeli bölgeye otomatik gönderilmesi yerine güzergâh riski ve alternatif geçitler değerlendirilsin.
6. **Hedefi hem stratejik hem taktik değerle ödüllendir:** Bölgeler zafer puanı ya da ölçülü ek gelir sağlayabilir; kontrol avantajı kaybedilince geri alınabilir olmalı, böylece snowball oluşmamalı.
7. **Karmaşıklığı görünür kıl:** Oyuncuya “eldeki puan”, “dakikadaki gelir”, “sahadaki bakım yükü”, “ikmal stoğu” ve “hedef skoru” ayrı ve kısa açıklamalarla gösterilmeli.
8. **AI kayıplardan sonra plan değiştirsin:** Aynı ikmal kamyonunu tekrar tekrar aynı ateş hattına sürmemeli. Son kayıpları, bilinen düşman tehdidini, alternatif köprü/sığ geçitleri, tamirin değerini ve mevcut stok durumunu birlikte puanlamalı; risk eşiği aşılırsa tamir girişimini ertelemeli veya başka rota seçmeli.

## 7. Claude için uygulama öncesi araştırma/devam promptu

> `BROKEN_ARROW_ECONOMY_RESEARCH.md` dosyasını ve Battleline kodunu incele. Bu nottaki Broken Arrow sistemini referans olarak kullan; kuralları, isimleri ve sayısal değerleri birebir kopyalama. Özellikle Battlegroup bütçesi, maç içi takviye rezervi/geliri, sahadaki birliklerin gelir üzerindeki upkeep etkisi, sınırlı fiziksel ikmal, tamir/geri çekilme ve hedef skoru kavramlarını ayrı ayrı değerlendir.
>
> Önce Battleline'ın mevcut ekonomi akışını ilgili kod dosyaları üzerinden çıkar: hangi kaynaklar var, birlik çağrısı/ölümü/geri çekilmesi bunları nasıl değiştiriyor, hedef kontrolü ve AI satın almasıyla ilişkisi ne? Kullanıcının istediği daha büyük harita ve yavaş araç temposunu da hesaba kat; Broken Arrow hızlı temposunun aynısını önermeden sistem ilkelerini uyarla.
>
> Kod yazmadan önce kısa bir tasarım önerisi hazırla: oyuncu kaynakları ve UI, gelir/upkeep formülü, rezerv tavanı, kayıp ve iade kuralları, ikmal tüketimi, hedef kontrolü ile bağlantı, AI satın alma ve riskten vazgeçme davranışı. Her kararın avantaj/dezavantajını ve hangi mevcut Battleline dosyalarını etkileyeceğini yaz. Özellikle AI, bir köprüye gönderdiği ikmal kamyonlarını art arda kaybederse aynı davranışı sonsuza kadar tekrarlamamalı; deneme sayısı/kayıp eşiği, alternatif sığ geçit veya başka köprü, güvenli bekleme ve hedef değerini değerlendiren bir davranış tasarla. Belirsiz kararları kullanıcıya sor; onaylanmayan sayısal değerleri varsayıp kodlama.
>
> Araştırma notundaki gelir basamakları 2026 Mayıs PTE devblog örneğidir; güncel 1.2.2 formülü olarak doğrulanmış sayma. Battleline için önerilen yeni değerleri açıkça “öneri” diye etiketle. Tasarım onaylanınca ROADMAP'e sorumlu, dosya kapsamı ve tamamlanma ölçütünü yaz; sonra yalnızca ilgili kodu değiştir. Tarayıcı ve manuel oyun testlerini Antigravity doğrulayacak. Gerçekten çalıştırmadığın testleri başarılı diye raporlama; değişiklik ve doğrulama kanıtlarını PROJECT_NOTEBOOK.md'ye kaydet.

## Kaynaklar ve güven düzeyi

- **[Yüksek — resmî oyun kılavuzu]:** [Broken Arrow Game Manual](https://ftp.matrixgames.com/pub/BrokenArrow/BrokenArrowManualEBOOK.pdf) — deck oluşturma, takviye, lansman dönemi gelir/upkeep, iade, ikmal ve tamir.
- **[Yüksek — resmî geliştirici/yayıncı]:** [Broken Arrow Survival Guide](https://brokenarrow_backend.slitherine.com/news/broken-arrows-survival-guide) — requisition ve uzmanlıkların kategori bütçelerine etkisi.
- **[Yüksek — canlı güncelleme]:** [1.1.1 Major Update](https://brokenarrow_backend.slitherine.com/news/broken-arrow-major-update) — dinamik gelir, 1500 rezerv sınırı, Conquest, ikmal yarıçapı ve taşıyıcı ikmali.
- **[Yüksek — resmî geliştirici devblog'u, PTE örneği]:** [Devblog 1.0 — May 18](https://steamcommunity.com/ogg/1604270/announcements/detail/676246847634801321) — sistemin amacı, 300/dk taban ve örnek gelir basamakları; exact live değerleri için sürüm uyarısı yukarıda.
- **[Yüksek — resmî lojistik açıklaması]:** [Mission Accomplished: How to Win in Broken Arrow](https://www.matrixgames.com/news/mission-accomplished-how-to-win-in-broken-arrow) — ikmalin onarım ve yeniden silahlandırmayla ilişkisi, kayıpları önlemenin ekonomik değeri.
- **[Yüksek — resmî güncel sürüm duyuruları]:** [Russian Guard / 1.2.0](https://brokenarrow_backend.slitherine.com/news/russian-guard-dlc-release), [Steam duyuruları (1.2.1 ve 1.2.2)](https://steamcommunity.com/app/1604270/announcements/) — kart fiyat ayarları ve güncel sürüm kapsamı.

