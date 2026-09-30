# TaskFlow — İhtiyaç Analizi ve Sistem Tasarımı

> **Aşama 01 — İhtiyaç Analizi ve Sistem Tasarımı** çıktısıdır.

| Yönergedeki Aşama 1 adımı | Bu dokümandaki karşılığı |
|---|---|
| Sistem senaryosunun oluşturulması | [1. Senaryo](#1-senaryo), [2. Gereksinimler](#2-gereksinimler) |
| Veri yapılarının belirlenmesi | [3. Veri Modeli Tasarımı](#3-veri-modeli-tasarımı) |
| API mimarisinin planlanması | [4. API Tasarımı](#4-api-tasarımı) |
| Endpoint listesinin hazırlanması | [5. Endpoint Listesi](#5-endpoint-listesi) |

| Yönergedeki Aşama 1 çıktısı | Konum |
|---|---|
| Proje Tanıtım Dokümanı | [proje-tanitim.md](proje-tanitim.md) |
| Veri Modeli Tasarımı | Bu doküman, [bölüm 3](#3-veri-modeli-tasarımı) |
| API Tasarım Dokümanı | Bu doküman, [bölüm 4–5](#4-api-tasarımı) · ayrıntılı istek / yanıt örnekleri: [api-dokumantasyonu.md](api-dokumantasyonu.md) |

---

## 1. Senaryo

Bir yazılım şirketi, ekip içerisindeki görevleri, projeleri ve çalışanların sorumluluklarını takip etmek istemektedir.

Geliştirilecek **TaskFlow API**; görevlerin oluşturulmasını, çalışanlara atanmasını, durumlarının takip edilmesini, önceliklendirilmesini, filtrelenmesini ve temel raporlama süreçlerini destekleyen bir REST API'dir. Herhangi bir web veya mobil arayüz bu API'ye bağlanarak görev yönetimi yapabilir.

## 2. Gereksinimler

### 2.1 Zorunlu (Değerlendirmeye dahil)

| # | Gereksinim | Yönerge |
|---|---|---|
| Z1 | Görev ekleme | Aşama 03 |
| Z2 | Görev listeleme | Aşama 03 |
| Z3 | Görev detayı | Aşama 03 |
| Z4 | Görev güncelleme | Aşama 03 |
| Z5 | Görev silme | Aşama 03 |
| Z6 | Logger middleware — method, endpoint, zaman damgası | Aşama 03 |
| Z7 | Tüm CRUD uçlarının Postman ile test edilmesi | Aşama 04 |

### 2.2 İsteğe Bağlı (İleri seviye pratikler)

| # | Gereksinim | Yönerge |
|---|---|---|
| P1 | Duruma / önceliğe göre filtreleme, arama, kullanıcı bazlı listeleme, sayfalama, sıralama | Pratik 1 |
| P2 | `title`, `description`, `priority`, `assignee` alanları için validation middleware (400) | Pratik 2 |
| P3 | Tamamlanan / bekleyen görev sayısı ve genel sistem özeti raporları | Pratik 3 |
| P4 | API dokümantasyonu, test dokümantasyonu, kullanım kılavuzu | Pratik 4 |

Tüm isteğe bağlı pratikler projede uygulanacaktır.

### 2.3 Teknik Gereksinimler

- Node.js + Express.js ile REST API
- Veriler `fs` modülü ile JSON dosyada kalıcı olarak saklanır (`data/tasks.json`)
- Kaynak kod, dokümanlar ve Postman ekran görüntüleri tek bir public GitHub reposunda teslim edilir

---

## 3. Veri Modeli Tasarımı

Sistemin tek varlığı **Görev (Task)**'tir. Görevin atandığı çalışan, yönergedeki örneğe uygun olarak (`/tasks/assignee/musa`) kullanıcı adıyla tutulur. Senaryodaki "projeleri takip etme" ihtiyacı için her görev bir projeye (`project`) bağlanabilir.

| Alan | Tip | Zorunlu | Kurallar | Varsayılan |
|---|---|---|---|---|
| `id` | number | otomatik | Artan tam sayı | — |
| `title` | string | ✔ | 3–100 karakter | — |
| `description` | string | | En fazla 500 karakter | `""` |
| `status` | string | | `pending`, `in-progress`, `completed` | `pending` |
| `priority` | string | | `low`, `medium`, `high` | `medium` |
| `assignee` | string | ✔ | 2–50 karakter; harf, rakam, `.`, `_`, `-` | — |
| `project` | string | null | | 2–50 karakter. Görevin ait olduğu proje *(ek)* | `null` |
| `createdAt` | string (ISO 8601) | otomatik | Oluşturulma zamanı | — |
| `updatedAt` | string (ISO 8601) | otomatik | Son güncelleme zamanı | — |

**Örnek kayıt:**

```json
{
  "id": 1,
  "title": "Login endpoint'ini yaz",
  "description": "JWT tabanlı giriş servisi hazırlanacak.",
  "status": "in-progress",
  "priority": "high",
  "assignee": "musa",
  "project": "TaskFlow API",
  "createdAt": "2026-10-10T09:15:00.000Z",
  "updatedAt": "2026-10-11T14:02:00.000Z"
}
```

**Durumlar:**
- `pending` — Beklemede, henüz başlanmadı
- `in-progress` — Üzerinde çalışılıyor
- `completed` — Tamamlandı

> Raporlamada `pending` ve `in-progress` görevler **bekleyen** (henüz tamamlanmamış) görevler olarak sayılır.

---

## 4. API Tasarımı

### 4.1 Katmanlı Yapı (API Mimarisi)

```
İstek ─► Middleware'ler ─► Route ─► Controller ─► Service ─► Repository ─► data/tasks.json
         (logger, json,                                         (fs)
          validation)
                          Hata olursa ─► errorHandler ─► Tutarlı JSON hata yanıtı
```

| Katman | Sorumluluk |
|---|---|
| **Route** | Hangi URL + HTTP method'un hangi controller fonksiyonuna gideceğini tanımlar |
| **Controller** | İstekten veriyi alır, service'i çağırır, HTTP yanıtını döndürür |
| **Service** | İş mantığı: filtreleme, arama, sıralama, sayfalama, rapor hesapları |
| **Repository** | `fs` ile JSON dosyasını okur / yazar |

### 4.2 Middleware Zinciri

1. **`logger`** — Her isteğin method, endpoint ve zaman damgasını (ayrıca status kodu ve yanıt süresini) konsola ve `logs/requests.log` dosyasına yazar. En başta olduğu için hatalı istekler de loglanır.
2. `express.json()` — İstek gövdesini JSON olarak ayrıştırır
3. **`validate`** — Görev oluşturma / güncelleme isteklerinde alanları doğrular, hatalıysa **400** döner
4. Route'lar
5. `notFound` — Tanımsız endpoint için **404**
6. `errorHandler` — Tüm hataları tek formatta yanıtlar

### 4.3 Yanıt Formatı

**Başarılı:**
```json
{
  "success": true,
  "data": { }
}
```

**Listeleme (sayfalamalı):**
```json
{
  "success": true,
  "count": 10,
  "pagination": { "page": 1, "limit": 10, "total": 23, "totalPages": 3 },
  "data": [ ]
}
```

**Hatalı:**
```json
{
  "success": false,
  "message": "Geçersiz veri gönderildi.",
  "errors": [
    { "field": "title", "message": "title alanı zorunludur." },
    { "field": "priority", "message": "priority şunlardan biri olmalıdır: low, medium, high." }
  ]
}
```

### 4.4 HTTP Durum Kodları

| Kod | Ne zaman |
|---|---|
| **200** OK | Listeleme, detay, güncelleme, silme başarılı |
| **201** Created | Görev oluşturuldu |
| **400** Bad Request | Eksik / geçersiz veri, bozuk JSON, geçersiz id |
| **404** Not Found | Görev veya endpoint bulunamadı |
| **413** Payload Too Large | İstek gövdesi 100 KB'tan büyük |
| **500** Internal Server Error | Beklenmeyen sunucu hatası |

---

## 5. Endpoint Listesi

### 5.1 Görev CRUD — Zorunlu

| Method | Endpoint | Açıklama | Başarılı |
|---|---|---|---|
| `POST` | `/tasks` | Yeni görev oluşturur | 201 |
| `GET` | `/tasks` | Tüm görevleri listeler | 200 |
| `GET` | `/tasks/:id` | Belirli bir görevi getirir | 200 |
| `PUT` | `/tasks/:id` | Görevi günceller | 200 |
| `DELETE` | `/tasks/:id` | Görevi siler | 200 |

**Ek — Görev takibi:** Senaryodaki "çalışanlara atama" ve "durum takibi" ihtiyaçları için, tüm görevi göndermeden tek alan değiştiren iki uç:

| Method | Endpoint | Gövde | Açıklama |
|---|---|---|---|
| `PATCH` | `/tasks/:id/status` | `{ "status": "in-progress" }` | Görevin durumunu değiştirir |
| `PATCH` | `/tasks/:id/assign` | `{ "assignee": "zeynep" }` | Görevi başka bir çalışana atar |

### 5.2 Gelişmiş API Özellikleri — Pratik 1

| Özellik | Örnek İstek |
|---|---|
| Duruma göre filtreleme | `GET /tasks?status=completed` |
| Önceliğe göre filtreleme | `GET /tasks?priority=high` |
| Projeye göre filtreleme *(ek)* | `GET /tasks?project=TaskFlow API` |
| Görev arama | `GET /tasks/search?keyword=backend` |
| Kullanıcı bazlı listeleme | `GET /tasks/assignee/musa` |
| Sayfalama | `GET /tasks?page=1&limit=10` |
| Sıralama | `GET /tasks?sort=createdAt` (azalan için `-createdAt`) |

- Parametreler birlikte kullanılabilir: `GET /tasks?status=pending&priority=high&sort=-createdAt&page=1&limit=5`
- Sıralanabilir alanlar: `createdAt`, `updatedAt`, `title`, `priority`, `status`. `priority` ve `status` mantıksal sırayla sıralanır (`low < medium < high`, `pending < in-progress < completed`). Virgülle birden fazla alan verilebilir: `sort=-priority,createdAt`.
- Arama `title` ve `description` alanlarında, büyük/küçük harf ve Türkçe karakter duyarsız yapılır (`işlem` ≈ `ISLEM`). Kullanıcı eşleşmesi de aynı şekilde duyarsızdır (`/tasks/assignee/MUSA`).
- `page` veya `limit` gönderilmezse **tüm görevler** döner (zorunlu "tüm görevler görüntülenebilmelidir" maddesi). Gönderilirse varsayılanlar `page=1`, `limit=10`; `limit` en fazla 100.
- Filtre, sayfalama ve sıralama parametreleri `/tasks/search` ve `/tasks/assignee/:assignee` uçlarında da kullanılabilir.

### 5.3 Validation Middleware — Pratik 2

| Alan | Kural | Hata |
|---|---|---|
| `title` | Zorunlu, metin, 3–100 karakter | 400 |
| `description` | Metin, en fazla 500 karakter | 400 |
| `priority` | `low`, `medium`, `high` | 400 |
| `assignee` | Zorunlu, metin, 2–50 karakter | 400 |
| `project` *(ek)* | Metin, 2–50 karakter | 400 |

Ayrıca `status` değerinin geçerliliği, tanımsız alan gönderilmesi ve sorgu parametreleri (`status`, `priority`, `page`, `limit`, `sort`) de doğrulanır.

### 5.4 Raporlama Servisleri — Pratik 3

| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/reports/completed` | Tamamlanan görev sayısı, toplam içindeki yüzdesi |
| `GET` | `/reports/pending` | Bekleyen (tamamlanmamış) görev sayısı, `pending` / `in-progress` kırılımı, yüksek öncelikli bekleyen sayısı |
| `GET` | `/reports/summary` | Genel sistem özeti: toplam / tamamlanan / bekleyen görev, tamamlanma oranı, duruma ve önceliğe göre dağılım, kişi ve proje bazında görev ve tamamlanma oranı |

---

## 6. Klasör Yapısı

```
backend-proje/
├── src/
│   ├── app.js              # Express uygulaması ve middleware zinciri
│   ├── server.js           # Sunucuyu başlatır
│   ├── config/             # Port, dosya yolları
│   ├── constants/          # Durum, öncelik, sıralama sabitleri
│   ├── routes/             # tasks ve reports route'ları
│   ├── controllers/        # HTTP katmanı
│   ├── services/           # İş mantığı
│   ├── repositories/       # fs ile JSON veri erişimi
│   ├── middlewares/        # logger, validate, notFound, errorHandler
│   ├── validators/         # Doğrulama şemaları
│   └── utils/              # Yardımcılar (AppError, metin normalizasyonu)
├── data/tasks.json         # Kalıcı veri
├── logs/                   # Logger çıktıları (otomatik oluşur)
├── scripts/
│   ├── seed.js             # Örnek veriyi yükler
│   └── run-tests.js        # Postman koleksiyonunu Newman ile çalıştırır
├── postman/                # Postman test koleksiyonu
├── docs/                   # Tanıtım, tasarım, API, test dokümanları ve ekran görüntüleri
├── package.json
└── README.md
```

## 7. Teslim Edilecek Çıktılar

| Çıktı | Konum |
|---|---|
| Proje Tanıtım Dokümanı | `docs/proje-tanitim.md` |
| Kurulum Notu | `README.md` |
| Postman Test Ekran Görüntüleri | `docs/screenshots/` |
| Kaynak kod + package.json | Repo kökü |
| API Dokümantasyonu *(isteğe bağlı)* | `docs/api-dokumantasyonu.md` |
| Test Dokümantasyonu *(isteğe bağlı)* | `docs/test-senaryolari.md` |
| Kullanım Kılavuzu *(isteğe bağlı)* | `docs/kullanim-kilavuzu.md` |
