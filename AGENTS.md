# AGENTS.md — Claude, Codex ve Antigravity ortak çalışma kuralları

Bu projede **Claude** (Claude Code), **Codex** ve **Antigravity** birlikte çalışır. Kurallar üçü için de geçerlidir.
İlgili dosyalar: [PROJECT_NOTEBOOK.md](PROJECT_NOTEBOOK.md) (kayıt), [ROADMAP.md](ROADMAP.md) (görev durumu).

## Görevlendirme

- Her görevin **sorumlusu ve kapsamı** (hangi dosyalar, ne bitince "tamam") başlamadan ROADMAP'teki görev tablosuna yazılır.
- ROADMAP görevleri şu akışla izlenir: `Proposed` → `Planned` → `Developing` → `Developed` → `To verify` → `Verified` → `Done`. Tanımlar ve geçiş ölçütleri ROADMAP.md'de tutulur; durum değişince tablo güncellenir.
- Varsayılan iş bölümü:
  - **Claude:** kod geliştirme, statik kontroller (sözdizimi, import/export, döngü denetimi), dokümantasyon.
  - **Codex:** özellik planlama ve tasarım kararlarını netleştirme, bağımsız kod incelemesi, istenen dokümantasyon ve proje kayıtlarını güncelleme. Kullanıcı açıkça istemedikçe ana kod geliştirme veya tarayıcı testi sorumluluğunu üstlenmez.
  - **Antigravity:** tarayıcı testleri, manuel oynanış testleri ve tarayıcı otomasyonu; ayrıca ROADMAP'te sorumlusu olduğu veya kullanıcı tarafından açıkça verilen sınırlı kod geliştirme ve hata düzeltme işleri.
- Kullanıcı farklı bir iş bölümü belirtirse o geçerlidir.

## Codex için çalışma kapsamı

- Yeni özelliklerde önce gereksinimleri ve tasarım kararlarını kullanıcıyla netleştirir; onaylanan kapsamı ROADMAP'e, kalıcı kararları PROJECT_NOTEBOOK.md'ye kaydeder.
- Kod incelemesinde mevcut çalışma alanını ve Git farklarını esas alır; bulguları dosya ve konum belirterek, önem sırasına göre raporlar.
- Dokümantasyon görevlerinde yalnızca istenen kapsamı değiştirir ve ilgili kayıtları günceller.
- Claude veya Antigravity'nin değişikliklerini sahiplenmez, geri almaz ya da eşzamanlı olarak aynı dosyalara müdahale etmez. Dosya çakışması görürse ilgili ajanın çalışmasının bitmesini veya görevin devredilmesini bekler.
- Bir tarayıcı ya da manuel test yapmadıysa test sonucu bildirmez; doğrulanmamış davranışları açıkça belirtir.

## Antigravity için geliştirme kapsamı

- Test sırasında bulduğu bir hata için, görev kendisine atanmışsa veya kullanıcı açıkça isterse, ilgili dosyalarda sınırlı düzeltme yapabilir.
- Kod değişikliğine başlamadan önce görevin kapsamı ve etkilenecek dosyalar ROADMAP'te belirtilir; aynı dosyada başka ajan çalışıyorsa görev devredilmeden düzenleme yapılmaz.
- Değişikliği ve gerçekten yaptığı kontrolleri PROJECT_NOTEBOOK.md'ye kaydeder. Tarayıcı testi ile kod düzeltmesinin sonuçlarını ayrı ayrı raporlar.

## Testler

- Tarayıcı testlerini Antigravity yapar.
- **Test sonuçları uydurulmaz.** Yapılmayan test "yapıldı" diye yazılmaz; doğrulanmamış özellikler notebook'ta ayrıca işaretlenir.
- Test sonucu, testi kimin, hangi senaryoyla, ne zaman yaptığıyla birlikte notebook §5'e yazılır.
- Kodun davranışından emin olunmayan noktalar açıkça belirtilir.

## GitHub Issues

- Büyük, tekrarlanabilir ve ayrı iş olarak düzeltilecek hatalar GitHub Issues'ta açılır. Küçük pürüzler ve henüz kararlaştırılmamış fikirler ROADMAP'te kalır.
- Issue; yeniden üretme adımlarını, beklenen ve gerçekleşen davranışı, etkiyi ve tamamlanma/doğrulama ölçütünü içerir. Test kanıtı PROJECT_NOTEBOOK.md'de tutulur.
- ROADMAP'teki ilgili göreve Issue bağlantısı eklenir; Issue kapatılmadan önce düzeltme doğrulanır ve kayıtlar güncellenir.
- Depoya GitHub erişimi yoksa Issue açılmış gibi davranılmaz; bulgu ROADMAP/notebook'ta korunur ve erişim gerektiği belirtilir.

## Dosya ve Git disiplini

- Göreve başlamadan önce `git status` ve `git log` kontrol edilir; diğer ajanın değişiklikleri görülür.
- **Aynı dosyalarda eşzamanlı düzenleme yapılmaz.** Bir ajan bir dosya üzerinde çalışırken diğeri o dosyaya dokunmaz; gerekiyorsa önce ROADMAP'te görev el değiştirir.
- Düzenlemeden önce dosya yeniden okunur; eski okumaya güvenip başkasının değişikliğinin üzerine yazılmaz.
- Başkasına ait değişiklikler geri alınmaz, silinmez, kendi commit'ine katılmaz; görülürse rapor edilir.
- `reset --hard`, `clean -fd`, zorla checkout ve zorla push kullanılmaz.
- Commit'ler küçük ve açıklamalıdır; yalnızca kendi değişikliklerini içerir. Push, kullanıcı onayı olmadan yapılmaz.
- `SQUADS` dizisine yeni kart daima sona eklenir (dizinler deste ve kısayollarda kullanılır).

## Kayıt

- Kod değişiklikleri, test sonuçları ve önemli kararlar PROJECT_NOTEBOOK.md'ye (ilgili bölüm + tarihli günlük satırı) kaydedilir.
- Görev durumu değişince ROADMAP.md güncellenir.

## Verimlilik

- Gereksiz dosya okuması yapılmaz: önce hedefli arama (`grep`), sonra yalnızca gereken bölüm okunur.
- Gereksiz refactor yapılmaz; yalnızca görevin gerektirdiği dosyalar değiştirilir.
- Yeni bağımlılık eklenmez (proje bağımlılıksızdır).
- Çıktılar kısa tutulur; dosyaların tamamı gereksiz yere dökülmez.

## Görev bitiş raporu

Her görev sonunda şunlar raporlanır:
1. Değiştirilen dosyalar ve yapılan değişiklikler
2. Çalıştırılan testler/kontroller ve **gerçek** sonuçları
3. Doğrulanmamış noktalar
4. Kalan işler ve diğer ajana devredilenler (ör. tarayıcı test senaryoları)
