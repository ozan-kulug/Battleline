# AGENTS.md — Claude ve Antigravity ortak çalışma kuralları

Bu projede iki yapay zekâ ajanı birlikte çalışır: **Claude** (Claude Code) ve **Antigravity**. Kurallar ikisi için de geçerlidir.
İlgili dosyalar: [PROJECT_NOTEBOOK.md](PROJECT_NOTEBOOK.md) (kayıt), [ROADMAP.md](ROADMAP.md) (görev durumu).

## Görevlendirme

- Her görevin **sorumlusu ve kapsamı** (hangi dosyalar, ne bitince "tamam") başlamadan ROADMAP'teki görev tablosuna yazılır.
- Varsayılan iş bölümü:
  - **Claude:** kod geliştirme, statik kontroller (sözdizimi, import/export, döngü denetimi), dokümantasyon.
  - **Antigravity:** tarayıcı testleri, manuel oynanış testleri, tarayıcı otomasyonu.
- Kullanıcı farklı bir iş bölümü belirtirse o geçerlidir.

## Testler

- Tarayıcı testlerini Antigravity yapar.
- **Test sonuçları uydurulmaz.** Yapılmayan test "yapıldı" diye yazılmaz; doğrulanmamış özellikler notebook'ta ayrıca işaretlenir.
- Test sonucu, testi kimin, hangi senaryoyla, ne zaman yaptığıyla birlikte notebook §5'e yazılır.
- Kodun davranışından emin olunmayan noktalar açıkça belirtilir.

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
