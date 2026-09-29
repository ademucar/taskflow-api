# TaskFlow API — Test Dokümantasyonu

## 1. Test Yaklaşımı

API, **Postman** ile test edilmiştir. Tüm test senaryoları `postman/TaskFlow.postman_collection.json` koleksiyonunda, her istek için otomatik test scriptleriyle (`pm.test`) birlikte yer alır.

| | |
|---|---|
| **Araç** | Postman (manuel) · Newman (komut satırı) |
| **Kapsam** | 30 istek · 130 doğrulama |
| **Test verisi** | `npm run seed` ile yüklenen 12 örnek görev |
| **Ortak kontroller** | Her yanıtta: `Content-Type` JSON olmalı, yanıt süresi < 1 sn |

### Testleri çalıştırma

**Postman:** `npm start` → Postman'de koleksiyonu içe aktar → **Run collection**

**Komut satırı:**

```bash
npm test
```

`npm test`, gerçek veriye dokunmadan geçici bir veri dosyası oluşturur, örnek veriyi yükler, sunucuyu boş bir portta başlatır ve koleksiyonu Newman ile çalıştırır.

> CRUD klasörü sırayla çalışmalıdır: **Görev Ekle** isteği oluşturulan görevin id'sini `taskId` koleksiyon değişkenine kaydeder, sonraki istekler bu id'yi kullanır.

---

## 2. Test Senaryoları

### 2.0 Sistem

| # | Senaryo | İstek | Beklenen | Doğrulananlar | Sonuç |
|---|---|---|---|---|---|
| S-01 | API bilgisi | `GET /` | `200` | API adı, `tasks` ve `reports` endpoint listesi | ✅ |

### 2.1 Görev CRUD (Zorunlu)

| # | Senaryo | İstek | Beklenen | Doğrulananlar | Sonuç |
|---|---|---|---|---|---|
| C-01 | Görev ekleme | `POST /tasks` | `201` | `id` sayı olarak atandı; gönderilen `title`, `priority`, `assignee`, `project` kaydedildi; `status` varsayılan `pending`; `createdAt` = `updatedAt` | ✅ |
| C-02 | Görev listeleme | `GET /tasks` | `200` | `data` dizi; `count` = dizi uzunluğu; C-01'de eklenen görev listede | ✅ |
| C-03 | Görev detayı | `GET /tasks/{{taskId}}` | `200` | Dönen görevin `id` ve `title` değeri doğru | ✅ |
| C-04 | Görev güncelleme | `PUT /tasks/{{taskId}}` | `200` | `title`, `status` (`completed`), `priority` güncellendi; `updatedAt` ≥ `createdAt` | ✅ |
| C-05 | Durum değiştirme *(ek)* | `PATCH /tasks/{{taskId}}/status` | `200` | Durum `in-progress` oldu; `title` ve `assignee` korundu | ✅ |
| C-06 | Başka çalışana atama *(ek)* | `PATCH /tasks/{{taskId}}/assign` | `200` | `assignee` = `zeynep`; durum değişmedi | ✅ |
| C-07 | Görev silme | `DELETE /tasks/{{taskId}}` | `200` | Silinen görev yanıtta döndü | ✅ |
| C-08 | Silinen görevi getirme | `GET /tasks/{{taskId}}` | `404` | `success: false`, mesajda "bulunamadı" | ✅ |

### 2.2 Filtreleme, Arama, Sayfalama, Sıralama (Pratik 1)

| # | Senaryo | İstek | Beklenen | Doğrulananlar | Sonuç |
|---|---|---|---|---|---|
| F-01 | Duruma göre filtreleme | `GET /tasks?status=completed` | `200` | Sonuç boş değil; tüm görevlerin durumu `completed` | ✅ |
| F-02 | Önceliğe göre filtreleme | `GET /tasks?priority=high` | `200` | Sonuç boş değil; tüm görevlerin önceliği `high` | ✅ |
| F-03 | Projeye göre filtreleme *(ek)* | `GET /tasks?project=TaskFlow%20API` | `200` | Sonuç boş değil; tüm görevlerin projesi `TaskFlow API` | ✅ |
| F-04 | Birleşik filtre | `GET /tasks?status=pending&priority=high` | `200` | Her görev iki koşulu birden sağlıyor | ✅ |
| F-05 | Görev arama | `GET /tasks/search?keyword=backend` | `200` | Sonuç boş değil; her görevin başlık veya açıklaması "backend" içeriyor | ✅ |
| F-06 | Kullanıcı bazlı listeleme | `GET /tasks/assignee/musa` | `200` | Sonuç boş değil; tüm görevler `musa`'ya atanmış | ✅ |
| F-07 | Sayfalama | `GET /tasks?page=1&limit=5` | `200` | En fazla 5 görev; `page`=1, `limit`=5, `totalPages` = ⌈total / 5⌉ | ✅ |
| F-08 | Tarihe göre artan sıralama | `GET /tasks?sort=createdAt` | `200` | `createdAt` değerleri eskiden yeniye sıralı | ✅ |
| F-09 | Önceliğe göre azalan sıralama | `GET /tasks?sort=-priority` | `200` | Sıra high → medium → low | ✅ |

### 2.3 Doğrulama ve Hata Yönetimi (Pratik 2)

| # | Senaryo | İstek | Beklenen | Doğrulananlar | Sonuç |
|---|---|---|---|---|---|
| V-01 | Zorunlu alanlar eksik | `POST /tasks` — yalnızca `description` | `400` | `errors` içinde `title` ve `assignee` | ✅ |
| V-02 | Geçersiz değerler | `POST /tasks` — `title: "ab"`, `priority: "urgent"`, `status: "done"` | `400` | `errors` içinde `title`, `priority`, `status` | ✅ |
| V-03 | Geçersiz durumla PATCH | `PATCH /tasks/1/status` — `status: "done"` | `400` | `errors[0].field` = `status` | ✅ |
| V-04 | Bozuk JSON | `POST /tasks` — kapanmayan JSON | `400` | Mesajda "JSON" | ✅ |
| V-05 | Geçersiz id | `GET /tasks/abc` | `400` | `errors[0].field` = `id` | ✅ |
| V-06 | Olmayan görev | `GET /tasks/99999` | `404` | Mesaj id'yi içeriyor | ✅ |
| V-07 | Geçersiz filtre değeri | `GET /tasks?status=done` | `400` | `errors[0].field` = `status` | ✅ |
| V-08 | Aramada keyword eksik | `GET /tasks/search` | `400` | `errors[0].field` = `keyword` | ✅ |
| V-09 | Olmayan endpoint | `GET /olmayan-endpoint` | `404` | Mesajda "Endpoint bulunamadı" | ✅ |

### 2.4 Raporlar (Pratik 3)

| # | Senaryo | İstek | Beklenen | Doğrulananlar | Sonuç |
|---|---|---|---|---|---|
| R-01 | Tamamlanan görev sayısı | `GET /reports/completed` | `200` | `count` sayı ve ≤ `total`; `percentage` 0–100 arası | ✅ |
| R-02 | Bekleyen görev sayısı | `GET /reports/pending` | `200` | `breakdown.pending` + `breakdown.in-progress` = `count` | ✅ |
| R-03 | Genel sistem özeti | `GET /reports/summary` | `200` | `completedTasks` + `pendingTasks` = `totalTasks`; `byStatus` toplamı = `totalTasks`; `byAssignee` ve `byProject` dizi | ✅ |

---

## 3. Ek Doğrulamalar

Postman koleksiyonuna ek olarak geliştirme sırasında şu durumlar da test edilmiştir:

| Senaryo | Sonuç |
|---|---|
| 20 eşzamanlı `POST /tasks` isteği | Tüm görevler kaydedildi, id'ler benzersiz, veri kaybı yok ✅ |
| Türkçe karakterli başlık (`ığüşöç İĞÜŞÖÇ`) | Doğru kaydedildi ve döndürüldü ✅ |
| Türkçe karakter duyarsız arama (`keyword=ISLEM` → "işlemleri") | Eşleşti ✅ |
| Büyük / küçük harf duyarsız kişi eşleşmesi (`/tasks/assignee/MUSA`) | Eşleşti ✅ |
| Tanınmayan alan gönderme (`id`, `createdAt`) | `400` ✅ |
| Tekrarlanan sorgu parametresi (`?status=a&status=b`) | `400` ✅ |
| `limit=500` | `400` — en fazla 100 ✅ |
| Boş veride raporlar | Tüm sayılar 0, hata yok ✅ |
| Logger çıktısı | Her istek konsola ve `logs/requests.log` dosyasına yazıldı ✅ |
| Yanıt gönderilmeden kopan istek | Logger'da `aborted` olarak kaydedildi, sunucu etkilenmedi ✅ |

---

## 4. Sonuç

```
┌─────────────────────────┬──────────┬──────────┐
│                         │ executed │   failed │
├─────────────────────────┼──────────┼──────────┤
│              iterations │        1 │        0 │
│                requests │       30 │        0 │
│            test-scripts │       60 │        0 │
│              assertions │      130 │        0 │
└─────────────────────────┴──────────┴──────────┘
```

Tüm test senaryoları başarıyla geçmiştir. Postman ekran görüntüleri [`docs/screenshots`](screenshots) klasöründedir.
