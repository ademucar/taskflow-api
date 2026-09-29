# TaskFlow API

**Görev ve Proje Yönetim Sistemi REST API** — Node.js ile Backend Programlama Bitirme Projesi

Bir yazılım ekibinin görevlerini oluşturmasını, çalışanlara atamasını, durum ve önceliklerini takip etmesini, filtrelemesini ve raporlamasını sağlayan REST API.

**Teknolojiler:** Node.js · Express 5 · REST API · Middleware · CRUD · JSON (fs) · Postman

---

## Özellikler

| Kapsam | Özellik |
|---|---|
| **Zorunlu** | Görev ekleme, listeleme, detay, güncelleme, silme (CRUD) |
| **Zorunlu** | Logger middleware — her isteğin method, endpoint ve zaman damgası konsola ve dosyaya yazılır |
| **Zorunlu** | Postman test koleksiyonu |
| Ek | Görev takibi — durum değiştirme ve çalışana atama için ayrı `PATCH` uçları |
| Ek | Görevlerin ait olduğu proje (`project`) — projeye göre filtreleme ve proje bazlı rapor |
| Pratik 1 | Duruma / önceliğe göre filtreleme, arama, kullanıcı bazlı listeleme, sayfalama, sıralama |
| Pratik 2 | Validation middleware — geçersiz veride açıklayıcı mesajla `400 Bad Request` |
| Pratik 3 | Raporlama servisleri — tamamlanan, bekleyen görev sayıları ve genel özet |
| Pratik 4 | API dokümantasyonu, test dokümantasyonu, kullanım kılavuzu |

---

## Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org/) **18 veya üzeri** (`node -v` ile kontrol edebilirsiniz)
- npm (Node.js ile birlikte gelir)

### Adımlar

**1. Projeyi indirin**

```bash
git clone https://github.com/<kullanici-adi>/taskflow-api.git
cd taskflow-api
```

**2. Bağımlılıkları kurun**

```bash
npm install
```

**3. (İsteğe bağlı) Örnek veriyi yükleyin**

Repo 12 örnek görevle birlikte gelir. Veriyi istediğiniz zaman bu başlangıç durumuna döndürmek için:

```bash
npm run seed
```

**4. Sunucuyu başlatın**

```bash
npm start
```

Geliştirme sırasında dosya değiştikçe otomatik yeniden başlatmak için:

```bash
npm run dev
```

Sunucu varsayılan olarak **http://localhost:3000** adresinde çalışır. Tarayıcıda bu adresi açtığınızda API bilgisi ve endpoint listesi görüntülenir.

### Ortam Değişkenleri (isteğe bağlı)

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `PORT` | `3000` | Sunucu portu |
| `DATA_FILE` | `data/tasks.json` | Görev verilerinin saklandığı JSON dosyası |
| `LOG_FILE` | `logs/requests.log` | İstek loglarının yazıldığı dosya |
| `LOG_CONSOLE` | `true` | `false` verilirse loglar yalnızca dosyaya yazılır |

Örnek (PowerShell): `$env:PORT=4000; npm start` · (Bash): `PORT=4000 npm start`

---

## Endpoint'ler

| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/` | API bilgisi |
| `POST` | `/tasks` | Görev oluştur |
| `GET` | `/tasks` | Görevleri listele (filtre / sıralama / sayfalama) |
| `GET` | `/tasks/:id` | Görev detayı |
| `PUT` | `/tasks/:id` | Görev güncelle |
| `PATCH` | `/tasks/:id/status` | Görev durumunu değiştir |
| `PATCH` | `/tasks/:id/assign` | Görevi çalışana ata |
| `DELETE` | `/tasks/:id` | Görev sil |
| `GET` | `/tasks/search?keyword=` | Görev ara |
| `GET` | `/tasks/assignee/:assignee` | Kişiye atanan görevler |
| `GET` | `/reports/completed` | Tamamlanan görev sayısı |
| `GET` | `/reports/pending` | Bekleyen görev sayısı |
| `GET` | `/reports/summary` | Genel sistem özeti |

**Sorgu parametreleri** (`/tasks`, `/tasks/search`, `/tasks/assignee/:assignee`):

```
?status=completed          pending | in-progress | completed
?priority=high             low | medium | high
?project=TaskFlow API      proje adına göre (büyük/küçük harf duyarsız)
?sort=-createdAt           createdAt, updatedAt, title, priority, status (- ile azalan)
?page=1&limit=10           sayfalama (limit en fazla 100)
```

Tüm detaylar, istek / yanıt örnekleri ve hata kodları için: **[API Dokümantasyonu](docs/api-dokumantasyonu.md)**

### Hızlı Örnek

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Login sayfasını tasarla", "priority": "high", "assignee": "musa", "project": "TaskFlow API"}'
```

```json
{
  "success": true,
  "message": "Görev oluşturuldu.",
  "data": {
    "id": 13,
    "title": "Login sayfasını tasarla",
    "description": "",
    "status": "pending",
    "priority": "high",
    "assignee": "musa",
    "project": "TaskFlow API",
    "createdAt": "2026-10-12T09:41:07.312Z",
    "updatedAt": "2026-10-12T09:41:07.312Z"
  }
}
```

---

## Logger

Tüm API istekleri [`src/middlewares/logger.js`](src/middlewares/logger.js) tarafından kayıt altına alınır. Her satırda **zaman damgası, method ve endpoint**; ayrıca yanıtın status kodu ve süresi bulunur.

- **Konsol:** Status koduna göre renklendirilmiş çıktı (2xx yeşil, 4xx sarı, 5xx kırmızı)
- **Dosya:** `logs/requests.log` (klasör ilk istekte otomatik oluşur)
- Yanıt gönderilmeden bağlantısı kopan istekler de `aborted` olarak kaydedilir.

Örnek çıktı:

```
[2026-10-12T09:41:07.312Z] GET /tasks 200 - 3.18 ms
[2026-10-12T09:41:09.027Z] GET /tasks?status=pending&priority=high 200 - 1.42 ms
[2026-10-12T09:41:12.845Z] POST /tasks 201 - 9.57 ms
[2026-10-12T09:41:15.110Z] PUT /tasks/13 200 - 6.21 ms
[2026-10-12T09:41:18.664Z] GET /tasks/999 404 - 1.05 ms
[2026-10-12T09:41:21.392Z] POST /tasks 400 - 2.33 ms
[2026-10-12T09:41:24.901Z] DELETE /tasks/13 200 - 5.74 ms
```

---

## Test

### Postman ile

1. Örnek veriyi yükleyin: `npm run seed` (filtreleme ve rapor testleri örnek veriye göre yazılmıştır)
2. Sunucuyu başlatın: `npm start`
3. Postman'de **Import** → `postman/TaskFlow.postman_collection.json` dosyasını seçin.
4. Koleksiyon üzerinde **Run collection** ile tüm istekleri sırayla çalıştırın.

Koleksiyon çalıştırıldıktan sonra görev listesi değişmez: CRUD klasörü oluşturduğu test görevini kendisi siler.

Koleksiyon 5 klasörden oluşur: Sistem, Görev CRUD, Filtreleme / Arama / Sayfalama / Sıralama, Doğrulama ve Hata Yönetimi, Raporlar. Her istekte otomatik test scriptleri bulunur.

### Otomatik (Newman)

```bash
npm test
```

Bu komut, gerçek veriye dokunmadan geçici bir veri dosyasıyla sunucuyu başlatır ve Postman koleksiyonunu [Newman](https://github.com/postmanlabs/newman) ile komut satırından çalıştırır (30 istek, 131 doğrulama).

Test senaryolarının yazılı açıklaması: **[Test Dokümantasyonu](docs/test-senaryolari.md)**

### Test Ekran Görüntüleri

Postman test ekran görüntüleri [`docs/screenshots`](docs/screenshots) klasöründedir.

| Test | Ekran Görüntüsü |
|---|---|
| Görev ekleme | [01-gorev-ekle.png](docs/screenshots/01-gorev-ekle.png) |
| Görev listeleme | [02-gorevleri-listele.png](docs/screenshots/02-gorevleri-listele.png) |
| Görev detayı | [03-gorev-detayi.png](docs/screenshots/03-gorev-detayi.png) |
| Görev güncelleme | [04-gorev-guncelle.png](docs/screenshots/04-gorev-guncelle.png) |
| Görev silme | [05-gorev-sil.png](docs/screenshots/05-gorev-sil.png) |
| Koleksiyon çalıştırma sonucu | [06-collection-runner.png](docs/screenshots/06-collection-runner.png) |

---

## Proje Yapısı

```
├── src/
│   ├── app.js                  # Express uygulaması ve middleware zinciri
│   ├── server.js               # Sunucuyu başlatır
│   ├── config/                 # Port, dosya yolları
│   ├── constants/              # Durum, öncelik, sıralama sabitleri
│   ├── routes/                 # URL → controller eşlemeleri
│   ├── controllers/            # HTTP istek / yanıt katmanı
│   ├── services/               # İş mantığı (sorgu motoru, raporlar)
│   ├── repositories/           # fs ile JSON veri erişimi
│   ├── middlewares/            # logger, validate, notFound, errorHandler
│   ├── validators/             # Doğrulama şemaları
│   └── utils/                  # AppError, metin yardımcıları
├── data/tasks.json             # Kalıcı veri
├── logs/                       # İstek logları (otomatik oluşur)
├── scripts/
│   ├── seed.js                 # Örnek veriyi yükler
│   └── run-tests.js            # Postman koleksiyonunu Newman ile çalıştırır
├── postman/                    # Postman koleksiyonu
└── docs/                       # Proje dokümanları ve ekran görüntüleri
```

**İstek akışı:**

```
İstek → logger → express.json → validate → route → controller → service → repository → data/tasks.json
                                                                   ↓ hata
                                                             errorHandler → { success: false, message, errors }
```

---

## Geliştirme Süreci

Proje, yönergedeki yol haritasına göre aşama aşama geliştirilmiş ve her aşama ayrı commit olarak kaydedilmiştir (`git log` ile görülebilir).

| Aşama | Yapılanlar |
|---|---|
| **Aşama 01** — İhtiyaç Analizi ve Sistem Tasarımı | Senaryo, veri modeli, API tasarımı, endpoint listesi |
| **Aşama 02** — Backend Altyapısı | Node.js projesi, Express kurulumu, klasör yapısı, routing, 404 ve hata yönetimi |
| **Aşama 03** — CRUD + Temel Middleware | Görev CRUD işlemleri, fs tabanlı veri katmanı, logger middleware |
| **Aşama 04** — Test ve Teslim | Postman koleksiyonu, Newman ile otomatik test, dokümantasyon |
| Pratik 1 — Gelişmiş API Özellikleri | Filtreleme, arama, kullanıcı bazlı listeleme, sayfalama, sıralama |
| Pratik 2 — Validation Middleware | Şema tabanlı doğrulama, alan bazlı 400 hataları |
| Pratik 3 — Raporlama Servisleri | Tamamlanan / bekleyen görev sayıları, genel özet |
| Pratik 4 — Kapsamlı Dokümantasyon | API, test ve kullanım kılavuzu dokümanları |
| Ek — Görev Takibi ve Projeler | Durum / atama için `PATCH` uçları, görevlerin projelere bağlanması |

---

## Dokümanlar

| Doküman | Açıklama |
|---|---|
| [Proje Tanıtım Dokümanı](docs/proje-tanitim.md) | Amaç, senaryo ve sistem özeti |
| [İhtiyaç Analizi ve Sistem Tasarımı](docs/01-analiz-ve-tasarim.md) | Senaryo, gereksinimler ve endpoint listesi |
| ↳ [Veri Modeli Tasarımı](docs/01-analiz-ve-tasarim.md#3-veri-modeli-tasarımı) | Görev alanları, tipleri ve kuralları |
| ↳ [API Tasarım Dokümanı](docs/01-analiz-ve-tasarim.md#4-api-tasarımı) | Katmanlı mimari, middleware zinciri, yanıt formatı, status kodları |
| [API Dokümantasyonu](docs/api-dokumantasyonu.md) | Her endpoint için açıklama, istek ve yanıt örnekleri |
| [Test Dokümantasyonu](docs/test-senaryolari.md) | Yazılı test senaryoları ve sonuçları |
| [Kullanım Kılavuzu](docs/kullanim-kilavuzu.md) | API'nin bir uygulamaya adım adım entegrasyonu |
