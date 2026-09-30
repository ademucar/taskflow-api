# TaskFlow API — API Dokümantasyonu

**Temel adres:** `http://localhost:3000`
**Veri formatı:** İstek ve yanıt gövdeleri JSON'dur. Gövde gönderen isteklerde `Content-Type: application/json` başlığı kullanılmalıdır.

## İçindekiler

- [Genel Kurallar](#genel-kurallar)
- [Sistem](#sistem)
  - [GET / — API bilgisi](#get---api-bilgisi)
- [Görev Modeli](#görev-modeli)
- [Görev Endpoint'leri](#görev-endpointleri)
  - [POST /tasks — Görev oluştur](#post-tasks--görev-oluştur)
  - [GET /tasks — Görevleri listele](#get-tasks--görevleri-listele)
  - [GET /tasks/:id — Görev detayı](#get-tasksid--görev-detayı)
  - [PUT /tasks/:id — Görev güncelle](#put-tasksid--görev-güncelle)
  - [PATCH /tasks/:id/status — Durum değiştir](#patch-tasksidstatus--durum-değiştir)
  - [PATCH /tasks/:id/assign — Çalışana ata](#patch-tasksidassign--çalışana-ata)
  - [DELETE /tasks/:id — Görev sil](#delete-tasksid--görev-sil)
  - [GET /tasks/search — Görev ara](#get-taskssearch--görev-ara)
  - [GET /tasks/assignee/:assignee — Kişinin görevleri](#get-tasksassigneeassignee--kişinin-görevleri)
- [Rapor Endpoint'leri](#rapor-endpointleri)
  - [GET /reports/completed — Tamamlanan görev sayısı](#get-reportscompleted--tamamlanan-görev-sayısı)
  - [GET /reports/pending — Bekleyen görev sayısı](#get-reportspending--bekleyen-görev-sayısı)
  - [GET /reports/summary — Genel sistem özeti](#get-reportssummary--genel-sistem-özeti)
- [Hata Yanıtları](#hata-yanıtları)

---

## Genel Kurallar

### Başarılı yanıt

```json
{ "success": true, "message": "İşlem mesajı (varsa)", "data": { } }
```

### Liste yanıtı

```json
{
  "success": true,
  "count": 2,
  "pagination": { "page": 1, "limit": 2, "total": 12, "totalPages": 6 },
  "data": [ ]
}
```

`pagination` alanı yalnızca `page` veya `limit` parametresi gönderildiğinde yer alır.

### Hata yanıtı

```json
{
  "success": false,
  "message": "Hatanın açıklaması",
  "errors": [ { "field": "alan", "message": "Alan bazlı hata" } ]
}
```

`errors` alanı yalnızca doğrulama hatalarında yer alır.

### HTTP durum kodları

| Kod | Anlamı |
|---|---|
| `200 OK` | İşlem başarılı |
| `201 Created` | Görev oluşturuldu |
| `400 Bad Request` | Eksik / geçersiz veri, bozuk JSON, geçersiz parametre |
| `404 Not Found` | Görev veya endpoint bulunamadı |
| `413 Payload Too Large` | İstek gövdesi 100 KB'tan büyük |
| `500 Internal Server Error` | Beklenmeyen sunucu hatası |

---

## Sistem

### `GET /` — API bilgisi

API'nin adını, sürümünü ve tüm endpoint'lerin listesini döndürür. Sunucunun çalıştığını kontrol etmek için de kullanılabilir.

```http
GET /
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "name": "TaskFlow API",
    "description": "Görev ve Proje Yönetim Sistemi REST API",
    "version": "1.0.0",
    "endpoints": {
      "tasks": {
        "list": "GET /tasks",
        "detail": "GET /tasks/:id",
        "create": "POST /tasks",
        "update": "PUT /tasks/:id",
        "updateStatus": "PATCH /tasks/:id/status",
        "assign": "PATCH /tasks/:id/assign",
        "delete": "DELETE /tasks/:id",
        "search": "GET /tasks/search?keyword=",
        "byAssignee": "GET /tasks/assignee/:assignee",
        "queryParams": "status, priority, project, keyword, sort, page, limit"
      },
      "reports": {
        "completed": "GET /reports/completed",
        "pending": "GET /reports/pending",
        "summary": "GET /reports/summary"
      }
    }
  }
}
```

---

## Görev Modeli

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | number | Otomatik artan benzersiz kimlik. Silinen id'ler tekrar kullanılmaz. |
| `title` | string | Görev başlığı |
| `description` | string | Görev açıklaması |
| `status` | string | `pending` · `in-progress` · `completed` |
| `priority` | string | `low` · `medium` · `high` |
| `assignee` | string | Görevin atandığı çalışanın kullanıcı adı |
| `project` | string | null | Görevin ait olduğu proje; projesiz görevlerde `null` |
| `createdAt` | string | Oluşturulma zamanı (ISO 8601, UTC) |
| `updatedAt` | string | Son güncellenme zamanı (ISO 8601, UTC) |

### Doğrulama kuralları (POST ve PUT gövdesi)

| Alan | Zorunlu | Kural | Varsayılan |
|---|---|---|---|
| `title` | ✔ | Metin, 3–100 karakter | — |
| `description` | | Metin, en fazla 500 karakter | `""` |
| `status` | | `pending`, `in-progress`, `completed` | `pending` |
| `priority` | | `low`, `medium`, `high` | `medium` |
| `assignee` | ✔ | Metin, 2–50 karakter; harf, rakam, `.` `_` `-` (boşluk yok) | — |
| `project` | | Metin, 2–50 karakter | `null` |

- Metin alanlarının başındaki ve sonundaki boşluklar temizlenir.
- İsteğe bağlı bir alana `null` veya boş metin gönderilirse alan varsayılan değerini alır. Böylece `GET` ile alınan bir görev `PUT` ile olduğu gibi geri gönderilebilir.
- Bu altı alan dışında bir alan gönderilirse (ör. `id`, `createdAt`) istek `400` ile reddedilir.

---

## Görev Endpoint'leri

### `POST /tasks` — Görev oluştur

**İstek:**

```http
POST /tasks
Content-Type: application/json

{
  "title": "Login sayfasını tasarla",
  "description": "Kullanıcı adı ve şifre alanları olan giriş ekranı.",
  "priority": "high",
  "assignee": "musa",
  "project": "TaskFlow API"
}
```

**Yanıt — `201 Created`:**

```json
{
  "success": true,
  "message": "Görev oluşturuldu.",
  "data": {
    "id": 13,
    "title": "Login sayfasını tasarla",
    "description": "Kullanıcı adı ve şifre alanları olan giriş ekranı.",
    "status": "pending",
    "priority": "high",
    "assignee": "musa",
    "project": "TaskFlow API",
    "createdAt": "2026-10-12T09:41:07.312Z",
    "updatedAt": "2026-10-12T09:41:07.312Z"
  }
}
```

**Olası hatalar:** `400` (doğrulama hatası, bozuk JSON)

---

### `GET /tasks` — Görevleri listele

Parametre gönderilmezse **tüm görevler** döner.

**Sorgu parametreleri (hepsi isteğe bağlı, birlikte kullanılabilir):**

| Parametre | Örnek | Açıklama |
|---|---|---|
| `status` | `status=completed` | Duruma göre filtreler |
| `priority` | `priority=high` | Önceliğe göre filtreler |
| `project` | `project=TaskFlow API` | Projeye göre filtreler (büyük / küçük harf ve Türkçe karakter duyarsız) |
| `keyword` | `keyword=login` | Başlık ve açıklamada arar |
| `sort` | `sort=-createdAt` | Sıralama. Alanlar: `createdAt`, `updatedAt`, `title`, `priority`, `status`. Başına `-` konursa azalan sıralar. Virgülle birden fazla alan: `sort=-priority,createdAt` |
| `page` | `page=2` | Sayfa numarası (≥ 1, varsayılan 1) |
| `limit` | `limit=5` | Sayfa başına kayıt (1–100, varsayılan 10) |

> `priority` sıralaması alfabetik değil mantıksaldır: `low < medium < high`. `status` için: `pending < in-progress < completed`.

**Örnek istek:**

```http
GET /tasks?status=pending&priority=high&sort=-createdAt&page=1&limit=2
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "count": 1,
  "pagination": { "page": 1, "limit": 2, "total": 1, "totalPages": 1 },
  "data": [
    {
      "id": 11,
      "title": "Sayfalama yapısını test et",
      "description": "page ve limit parametreleri farklı değerlerle denenecek.",
      "status": "pending",
      "priority": "high",
      "assignee": "can",
      "project": "TaskFlow API",
      "createdAt": "2026-09-28T22:00:00.000Z",
      "updatedAt": "2026-09-28T22:00:00.000Z"
    }
  ]
}
```

**Diğer örnekler:**

| İstek | Sonuç |
|---|---|
| `GET /tasks?status=completed` | Tamamlanan görevler |
| `GET /tasks?priority=high` | Yüksek öncelikli görevler |
| `GET /tasks?page=1&limit=10` | İlk 10 görev + sayfalama bilgisi |
| `GET /tasks?sort=createdAt` | Eskiden yeniye |
| `GET /tasks?sort=-priority,title` | Önce yüksek öncelik, eşitse başlığa göre alfabetik |

**Olası hatalar:** `400` (geçersiz `status` / `priority` değeri, geçersiz `page` / `limit`, bilinmeyen sıralama alanı veya parametre)

---

### `GET /tasks/:id` — Görev detayı

```http
GET /tasks/3
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "Görev CRUD endpoint'lerini yaz",
    "description": "Backend tarafında ekleme, listeleme, detay, güncelleme ve silme işlemleri.",
    "status": "in-progress",
    "priority": "high",
    "assignee": "musa",
    "project": "TaskFlow API",
    "createdAt": "2026-09-26T14:00:00.000Z",
    "updatedAt": "2026-09-26T19:00:00.000Z"
  }
}
```

**Olası hatalar:**

| Durum | Yanıt |
|---|---|
| `GET /tasks/abc` | `400` — `id parametresi tam sayı olmalıdır.` |
| `GET /tasks/999` | `404` — `999 id'li görev bulunamadı.` |

---

### `PUT /tasks/:id` — Görev güncelle

Görevi tamamen günceller. `title` ve `assignee` zorunludur; gönderilmeyen `description`, `status` ve `priority` alanları varsayılan değerlerine döner. `id` ve `createdAt` değişmez, `updatedAt` yenilenir.

**İstek:**

```http
PUT /tasks/3
Content-Type: application/json

{
  "title": "Görev CRUD endpoint'lerini yaz",
  "description": "Tüm CRUD uçları tamamlandı.",
  "status": "completed",
  "priority": "high",
  "assignee": "musa",
  "project": "TaskFlow API"
}
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "message": "Görev güncellendi.",
  "data": {
    "id": 3,
    "title": "Görev CRUD endpoint'lerini yaz",
    "description": "Tüm CRUD uçları tamamlandı.",
    "status": "completed",
    "priority": "high",
    "assignee": "musa",
    "project": "TaskFlow API",
    "createdAt": "2026-09-26T14:00:00.000Z",
    "updatedAt": "2026-10-12T10:05:44.120Z"
  }
}
```

**Olası hatalar:** `400` (doğrulama hatası, geçersiz id), `404` (görev yok)

---

### `PATCH /tasks/:id/status` — Durum değiştir

Görevin yalnızca durumunu değiştirir; diğer alanlar olduğu gibi kalır. Görev takibi için `PUT` ile tüm görevi göndermeye gerek bırakmaz.

| Alan | Zorunlu | Kural |
|---|---|---|
| `status` | ✔ | `pending`, `in-progress`, `completed` |

```http
PATCH /tasks/7/status
Content-Type: application/json

{ "status": "in-progress" }
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "message": "Görev durumu \"in-progress\" olarak güncellendi.",
  "data": {
    "id": 7,
    "title": "Postman koleksiyonunu oluştur",
    "description": "Tüm endpoint'ler için örnek istekler ve testler.",
    "status": "in-progress",
    "priority": "medium",
    "assignee": "mehmet",
    "project": "Test ve Dokümantasyon",
    "createdAt": "2026-09-27T18:00:00.000Z",
    "updatedAt": "2026-10-12T10:20:15.402Z"
  }
}
```

**Olası hatalar:** `400` (`status` eksik / geçersiz, gövdede başka alan var, geçersiz id), `404` (görev yok)

---

### `PATCH /tasks/:id/assign` — Çalışana ata

Görevi başka bir çalışana atar; diğer alanlar olduğu gibi kalır.

| Alan | Zorunlu | Kural |
|---|---|---|
| `assignee` | ✔ | 2–50 karakter; harf, rakam, `.` `_` `-` |

```http
PATCH /tasks/7/assign
Content-Type: application/json

{ "assignee": "zeynep" }
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "message": "Görev \"zeynep\" kullanıcısına atandı.",
  "data": {
    "id": 7,
    "title": "Postman koleksiyonunu oluştur",
    "description": "Tüm endpoint'ler için örnek istekler ve testler.",
    "status": "in-progress",
    "priority": "medium",
    "assignee": "zeynep",
    "project": "Test ve Dokümantasyon",
    "createdAt": "2026-09-27T18:00:00.000Z",
    "updatedAt": "2026-10-12T10:21:02.118Z"
  }
}
```

**Olası hatalar:** `400` (`assignee` eksik / geçersiz, geçersiz id), `404` (görev yok)

---

### `DELETE /tasks/:id` — Görev sil

```http
DELETE /tasks/12
```

**Yanıt — `200 OK`** (silinen görev döner):

```json
{
  "success": true,
  "message": "Görev silindi.",
  "data": {
    "id": 12,
    "title": "Hata mesajlarını Türkçeleştir",
    "description": "Tüm hata yanıtları anlaşılır Türkçe mesajlar içerecek.",
    "status": "in-progress",
    "priority": "low",
    "assignee": "can",
    "project": "TaskFlow API",
    "createdAt": "2026-09-29T05:00:00.000Z",
    "updatedAt": "2026-09-29T10:00:00.000Z"
  }
}
```

**Olası hatalar:** `400` (geçersiz id), `404` (görev yok)

---

### `GET /tasks/search` — Görev ara

`title` ve `description` alanlarında arama yapar. Arama büyük / küçük harf ve Türkçe karakter duyarsızdır: `ISLEM`, `işlem` ve `İşlem` aynı sonucu verir.

| Parametre | Zorunlu | Kural |
|---|---|---|
| `keyword` | ✔ | 2–100 karakter |

`status`, `priority`, `sort`, `page`, `limit` parametreleri burada da kullanılabilir.

```http
GET /tasks/search?keyword=backend
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 3,
      "title": "Görev CRUD endpoint'lerini yaz",
      "description": "Backend tarafında ekleme, listeleme, detay, güncelleme ve silme işlemleri.",
      "status": "in-progress",
      "priority": "high",
      "assignee": "musa",
      "project": "TaskFlow API",
      "createdAt": "2026-09-26T14:00:00.000Z",
      "updatedAt": "2026-09-26T19:00:00.000Z"
    },
    {
      "id": 9,
      "title": "Arama özelliğini geliştir",
      "description": "Başlık ve açıklamada anahtar kelimeyle backend araması.",
      "status": "pending",
      "priority": "low",
      "assignee": "zeynep",
      "project": "TaskFlow API",
      "createdAt": "2026-09-28T08:00:00.000Z",
      "updatedAt": "2026-09-28T08:00:00.000Z"
    }
  ]
}
```

**Olası hatalar:** `400` — `keyword parametresi zorunludur.`

---

### `GET /tasks/assignee/:assignee` — Kişinin görevleri

Belirtilen çalışana atanmış görevleri listeler. Eşleşme büyük / küçük harf duyarsızdır (`/tasks/assignee/MUSA` = `/tasks/assignee/musa`). Filtre, sıralama ve sayfalama parametreleri kullanılabilir.

```http
GET /tasks/assignee/musa?status=completed
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "title": "Proje klasör yapısını oluştur",
      "description": "Katmanlı mimariye uygun src klasörü hazırlanacak.",
      "status": "completed",
      "priority": "high",
      "assignee": "musa",
      "project": "TaskFlow API",
      "createdAt": "2026-09-26T01:00:00.000Z",
      "updatedAt": "2026-09-26T06:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Express sunucusunu kur",
      "description": "Express 5 kurulumu ve temel middleware zinciri.",
      "status": "completed",
      "priority": "high",
      "assignee": "musa",
      "project": "TaskFlow API",
      "createdAt": "2026-09-26T08:00:00.000Z",
      "updatedAt": "2026-09-26T13:00:00.000Z"
    }
  ]
}
```

Kişiye ait görev yoksa hata değil, `count: 0` ve boş `data` döner.

**Olası hatalar:** `400` (kullanıcı adı 2 karakterden kısa, geçersiz sorgu parametresi)

---

## Rapor Endpoint'leri

Raporlar, o anki tüm görevler üzerinden hesaplanır; parametre almaz. **Bekleyen görev:** durumu `completed` **olmayan** (`pending` veya `in-progress`) görev.

### `GET /reports/completed` — Tamamlanan görev sayısı

Durumu `completed` olan görevlerin sayısını ve toplam içindeki yüzdesini döndürür.

```http
GET /reports/completed
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "count": 4,
    "total": 12,
    "percentage": 33.3
  }
}
```

### `GET /reports/pending` — Bekleyen görev sayısı

Henüz tamamlanmamış görevlerin sayısını, `pending` / `in-progress` kırılımını ve bunlardan yüksek öncelikli olanların sayısını döndürür.

```http
GET /reports/pending
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "count": 8,
    "total": 12,
    "percentage": 66.7,
    "breakdown": { "pending": 5, "in-progress": 3 },
    "highPriority": 2
  }
}
```

`highPriority`: bekleyen görevlerden önceliği `high` olanların sayısı.

### `GET /reports/summary` — Genel sistem özeti

Sistemin genel durumunu tek yanıtta verir: toplam / tamamlanan / bekleyen görev sayıları, tamamlanma oranı, duruma ve önceliğe göre dağılım, kişi ve proje bazında ilerleme.

```http
GET /reports/summary
```

**Yanıt — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "totalTasks": 12,
    "completedTasks": 4,
    "pendingTasks": 8,
    "completionRate": 33.3,
    "byStatus": { "pending": 5, "in-progress": 3, "completed": 4 },
    "byPriority": { "low": 4, "medium": 4, "high": 4 },
    "byAssignee": [
      { "assignee": "ayse", "total": 3, "completed": 1, "pending": 2, "completionRate": 33.3 },
      { "assignee": "musa", "total": 3, "completed": 2, "pending": 1, "completionRate": 66.7 },
      { "assignee": "can", "total": 2, "completed": 0, "pending": 2, "completionRate": 0 },
      { "assignee": "mehmet", "total": 2, "completed": 0, "pending": 2, "completionRate": 0 },
      { "assignee": "zeynep", "total": 2, "completed": 1, "pending": 1, "completionRate": 50 }
    ],
    "byProject": [
      { "project": "TaskFlow API", "total": 9, "completed": 3, "pending": 6, "completionRate": 33.3 },
      { "project": "Test ve Dokümantasyon", "total": 3, "completed": 1, "pending": 2, "completionRate": 33.3 }
    ],
    "generatedAt": "2026-10-12T10:12:30.004Z"
  }
}
```

`byAssignee` ve `byProject` en çok görevi olandan başlayarak sıralanır. Projesi olmayan görevler `byProject` içinde `"project": null` grubunda, listenin sonunda yer alır.

---

## Hata Yanıtları

### Doğrulama hatası — `400`

Tüm hatalar tek yanıtta, alan bazında listelenir:

```http
POST /tasks
Content-Type: application/json

{ "title": "ab", "priority": "urgent", "assignee": "musa kolcuk", "id": 5 }
```

```json
{
  "success": false,
  "message": "Geçersiz veri gönderildi.",
  "errors": [
    { "field": "id", "message": "id alanı tanınmıyor. Kullanılabilir: title, description, status, priority, assignee." },
    { "field": "title", "message": "title alanı en az 3 karakter olmalıdır." },
    { "field": "priority", "message": "priority alanı şunlardan biri olmalıdır: low, medium, high." },
    { "field": "assignee", "message": "assignee alanı yalnızca harf, rakam ve . _ - karakterlerinden oluşabilir (boşluk içeremez)." }
  ]
}
```

### Bozuk JSON — `400`

```json
{ "success": false, "message": "İstek gövdesi geçerli bir JSON değil." }
```

### Gövde yok / JSON nesnesi değil — `400`

```json
{ "success": false, "message": "İstek gövdesi bir JSON nesnesi olmalıdır (Content-Type: application/json)." }
```

### Geçersiz sorgu parametresi — `400`

```http
GET /tasks?status=done&limit=500
```

```json
{
  "success": false,
  "message": "Geçersiz veri gönderildi.",
  "errors": [
    { "field": "status", "message": "status parametresi şunlardan biri olmalıdır: pending, in-progress, completed." },
    { "field": "limit", "message": "limit parametresi en fazla 100 olabilir." }
  ]
}
```

### Gövde çok büyük — `413`

```json
{ "success": false, "message": "İstek gövdesi çok büyük (en fazla 100 KB)." }
```

### Kayıt bulunamadı — `404`

```json
{ "success": false, "message": "999 id'li görev bulunamadı." }
```

### Endpoint bulunamadı — `404`

```json
{ "success": false, "message": "Endpoint bulunamadı: GET /olmayan-endpoint" }
```

### Sunucu hatası — `500`

```json
{ "success": false, "message": "Beklenmeyen bir sunucu hatası oluştu." }
```

Hatanın ayrıntısı güvenlik nedeniyle istemciye gönderilmez, sunucu konsoluna yazılır.
