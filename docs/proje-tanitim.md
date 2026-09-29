# TaskFlow — Proje Tanıtım Dokümanı

**Görev ve Proje Yönetim Sistemi API Geliştirme Projesi**
Node.js ile Backend Programlama — Bitirme Projesi · 2026

---

## 1. Projenin Amacı

Bu proje, Node.js Backend Programlama eğitiminde edinilen bilgilerin gerçek hayatta kullanılabilecek bir uygulama üzerinde gösterilmesi amacıyla geliştirilmiştir. Proje kapsamında Node.js ve Express.js kullanılarak, tamamen REST API mantığında çalışan bir **Görev ve Proje Yönetim Sistemi API'si** tasarlanmış ve geliştirilmiştir.

## 2. Senaryo

Bir yazılım şirketi, ekip içerisindeki görevleri, projeleri ve çalışanların sorumluluklarını takip etmek istemektedir. Şirketin ihtiyacı; görevlerin tek bir sistem üzerinden oluşturulması, çalışanlara atanması, hangi aşamada olduklarının ve önceliklerinin izlenmesi ve ekibin genel durumunun raporlanabilmesidir.

**TaskFlow API** bu ihtiyaca yönelik olarak; herhangi bir web veya mobil arayüzün bağlanabileceği, görev yönetimi işlemlerini HTTP üzerinden JSON formatında sunan bir backend servisidir.

## 3. Sistem Özeti

### Görev Modeli

Her görev; başlık (`title`), açıklama (`description`), durum (`status`: *pending*, *in-progress*, *completed*), öncelik (`priority`: *low*, *medium*, *high*), atanan çalışan (`assignee`) ile oluşturulma ve güncellenme zamanlarından oluşur. Veriler `fs` modülü ile `data/tasks.json` dosyasında kalıcı olarak saklanır.

### Temel Özellikler

| Özellik | Endpoint |
|---|---|
| Görev ekleme | `POST /tasks` |
| Görev listeleme | `GET /tasks` |
| Görev detayı | `GET /tasks/:id` |
| Görev güncelleme | `PUT /tasks/:id` |
| Görev silme | `DELETE /tasks/:id` |
| İstek loglama (Logger middleware) | Tüm istekler |

### İleri Seviye ve Ek Özellikler

| Özellik | Endpoint / Açıklama |
|---|---|
| Durum değiştirme ve çalışana atama | `PATCH /tasks/:id/status`, `PATCH /tasks/:id/assign` |
| Duruma ve önceliğe göre filtreleme | `GET /tasks?status=completed&priority=high` |
| Görev arama | `GET /tasks/search?keyword=backend` |
| Kullanıcı bazlı listeleme | `GET /tasks/assignee/musa` |
| Sayfalama ve sıralama | `GET /tasks?page=1&limit=10&sort=-createdAt` |
| Validation middleware | Geçersiz veride alan bazlı açıklayıcı `400` yanıtı |
| Raporlama servisleri | `GET /reports/completed`, `/reports/pending`, `/reports/summary` |
| Kapsamlı dokümantasyon | API, test ve kullanım kılavuzu dokümanları |

## 4. Mimari

Proje, her katmanın tek bir sorumluluğu olacak şekilde katmanlı mimaride geliştirilmiştir:

```
İstek → Middleware'ler → Route → Controller → Service → Repository → JSON dosya
```

- **Middleware'ler:** Logger (method, endpoint, zaman damgası, status kodu, süre → konsol + `logs/requests.log`), JSON ayrıştırma, doğrulama, 404 ve merkezi hata yönetimi
- **Route:** URL ve HTTP method eşlemeleri (`/tasks`, `/reports`)
- **Controller:** İstekten veriyi alıp uygun HTTP yanıtını döndürür
- **Service:** Filtreleme, arama, sıralama, sayfalama ve rapor hesaplamaları
- **Repository:** `fs` ile JSON dosyasına okuma / yazma. Yazmalar atomik yapılır ve sıraya alınır; eşzamanlı isteklerde veri kaybı veya dosya bozulması yaşanmaz.

Tüm yanıtlar tutarlı bir formatta döner (`success`, `data`, `message`, `errors`) ve doğru HTTP durum kodları (`200`, `201`, `400`, `404`, `500`) kullanılır.

## 5. Test

Tüm endpoint'ler Postman ile test edilmiştir. Proje ile birlikte teslim edilen Postman koleksiyonu 29 istek ve 126 otomatik doğrulama içerir; CRUD işlemlerini, filtreleme ve raporları, hatalı istekleri (eksik alan, geçersiz değer, bozuk JSON, olmayan kayıt) kapsar. Koleksiyon `npm test` komutuyla Newman üzerinden komut satırından da çalıştırılabilir. Ekran görüntüleri `docs/screenshots` klasöründedir.

## 6. Yönerge Karşılama Tablosu

| Değerlendirme Kriteri | Projedeki Karşılığı |
|---|---|
| CRUD İşlemleri (30) | `src/routes/taskRoutes.js`, `src/controllers/taskController.js`, `src/services/taskService.js` |
| Routing Yapısı (15) | `src/routes/` — ana router, `/tasks` ve `/reports` modülleri |
| Temel Middleware – Logger (15) | `src/middlewares/logger.js` |
| Kod Kalitesi (15) | Katmanlı mimari, merkezi hata yönetimi, sabitler, tutarlı yanıt formatı |
| Dokümantasyon (15) | Bu doküman, `README.md`, `docs/` klasörü |
| Test Süreçleri – Postman (10) | `postman/TaskFlow.postman_collection.json`, `docs/screenshots/`, `docs/test-senaryolari.md` |

## 7. Kullanılan Teknolojiler

Node.js · Express.js 5 · fs (JSON dosya) · Postman · Newman · Git / GitHub
