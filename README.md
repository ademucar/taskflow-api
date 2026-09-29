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
?sort=-createdAt           createdAt, updatedAt, title, priority, status (- ile azalan)
?page=1&limit=10           sayfalama (limit en fazla 100)
```

Tüm detaylar, istek / yanıt örnekleri ve hata kodları için: **[API Dokümantasyonu](docs/api-dokumantasyonu.md)**

### Hızlı Örnek

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Login sayfasını tasarla", "priority": "high", "assignee": "musa"}'
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
    "createdAt": "2026-10-12T09:41:07.312Z",
    "updatedAt": "2026-10-12T09:41:07.312Z"
  }
}
```

---

## Test

### Postman ile

1. Sunucuyu başlatın: `npm start`
2. Postman'de **Import** → `postman/TaskFlow.postman_collection.json` dosyasını seçin.
3. Koleksiyon üzerinde **Run collection** ile tüm istekleri sırayla çalıştırın.

Koleksiyon 5 klasörden oluşur: Sistem, Görev CRUD, Filtreleme / Arama / Sayfalama / Sıralama, Doğrulama ve Hata Yönetimi, Raporlar. Her istekte otomatik test scriptleri bulunur.

### Otomatik (Newman)

```bash
npm test
```

Bu komut, gerçek veriye dokunmadan geçici bir veri dosyasıyla sunucuyu başlatır ve Postman koleksiyonunu [Newman](https://github.com/postmanlabs/newman) ile komut satırından çalıştırır (26 istek, 112 doğrulama).

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

## Dokümanlar

| Doküman | Açıklama |
|---|---|
| [Proje Tanıtım Dokümanı](docs/proje-tanitim.md) | Amaç, senaryo ve sistem özeti |
| [İhtiyaç Analizi ve Sistem Tasarımı](docs/01-analiz-ve-tasarim.md) | Veri modeli, API mimarisi, endpoint listesi |
| [API Dokümantasyonu](docs/api-dokumantasyonu.md) | Her endpoint için açıklama, istek ve yanıt örnekleri |
| [Test Dokümantasyonu](docs/test-senaryolari.md) | Yazılı test senaryoları ve sonuçları |
| [Kullanım Kılavuzu](docs/kullanim-kilavuzu.md) | API'nin bir uygulamaya adım adım entegrasyonu |
