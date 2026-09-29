# TaskFlow API — Kullanım Kılavuzu

Bu kılavuz, TaskFlow API'nin bir web veya mobil uygulamaya nasıl entegre edileceğini adım adım anlatır. Örnekler JavaScript'in yerleşik `fetch` fonksiyonuyla yazılmıştır; tarayıcıda ve Node.js 18+ ortamında aynen çalışır.

---

## Adım 1 — API'yi çalıştırın

```bash
npm install
npm start
```

Tarayıcıda `http://localhost:3000` adresini açın. Aşağıdakine benzer bir yanıt görüyorsanız API hazırdır:

```json
{ "success": true, "data": { "name": "TaskFlow API", "version": "1.0.0", "endpoints": { } } }
```

---

## Adım 2 — Ortak bir istek fonksiyonu yazın

Tüm yanıtlar aynı formatta olduğu için (`success`, `data`, `message`, `errors`) tek bir yardımcı fonksiyon yeterlidir:

```js
const API_URL = 'http://localhost:3000';

async function api(method, path, body) {
  const response = await fetch(API_URL + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json();

  if (!result.success) {
    // Doğrulama hatalarında alan bazlı mesajlar errors dizisindedir
    const details = result.errors?.map((e) => `- ${e.message}`).join('\n');
    throw new Error(details ? `${result.message}\n${details}` : result.message);
  }
  return result;
}
```

---

## Adım 3 — Görev oluşturun

```js
const { data: task } = await api('POST', '/tasks', {
  title: 'Ana sayfa tasarımı',
  description: 'Hero alanı ve menü hazırlanacak.',
  priority: 'high',
  assignee: 'zeynep',
  project: 'Web Paneli',
});

console.log(task.id); // → 13
```

- `title` ve `assignee` zorunludur.
- `status` gönderilmezse `pending`, `priority` gönderilmezse `medium` olur.
- `project` isteğe bağlıdır; gönderilmezse görev projesiz (`null`) kaydedilir.

---

## Adım 4 — Görevin yaşam döngüsünü yönetin

Tipik bir görev akışı: **pending → in-progress → completed**

Durum değiştirmek ve görevi başka birine atamak için tek alanlı `PATCH` uçları kullanılır:

```js
// Çalışmaya başla
await api('PATCH', `/tasks/${task.id}/status`, { status: 'in-progress' });

// Görevi başka bir çalışana devret
await api('PATCH', `/tasks/${task.id}/assign`, { assignee: 'mehmet' });

// Tamamla
await api('PATCH', `/tasks/${task.id}/status`, { status: 'completed' });
```

Başlık, açıklama gibi birden fazla alanı değiştirmek için `PUT` kullanılır. `PUT` tam güncelleme olduğu için tüm düzenlenebilir alanlar gönderilmelidir:

```js
await api('PUT', `/tasks/${task.id}`, { ...editable(task), title: 'Ana sayfa tasarımı (v2)' });

function editable({ title, description, status, priority, assignee, project }) {
  return { title, description, status, priority, assignee, project };
}
```

> `PUT` isteğinde `id`, `createdAt`, `updatedAt` gibi sistem alanları gönderilirse istek `400` ile reddedilir. Bu yüzden yukarıdaki `editable` fonksiyonu kullanılır.

---

## Adım 5 — Görevleri listeleyin, filtreleyin

```js
// Tüm görevler
const all = await api('GET', '/tasks');

// Bekleyen yüksek öncelikli görevler, en yeni üstte
const urgent = await api('GET', '/tasks?status=pending&priority=high&sort=-createdAt');

// Bir çalışanın görevleri
const myTasks = await api('GET', '/tasks/assignee/zeynep');

// Bir projenin görevleri
const panelTasks = await api('GET', `/tasks?project=${encodeURIComponent('Web Paneli')}`);

// Arama kutusu
const results = await api('GET', `/tasks/search?keyword=${encodeURIComponent('tasarım')}`);
```

Kullanıcıdan gelen metinleri URL'ye eklerken her zaman `encodeURIComponent` kullanın.

---

## Adım 6 — Sayfalama ile büyük listeleri gösterin

```js
async function loadPage(page, limit = 10) {
  const { data, pagination } = await api('GET', `/tasks?page=${page}&limit=${limit}&sort=-createdAt`);
  // pagination → { page, limit, total, totalPages }
  return { tasks: data, hasNext: pagination.page < pagination.totalPages };
}
```

Tüm sayfaları sırayla gezmek için:

```js
let page = 1;
let hasNext = true;
while (hasNext) {
  const result = await loadPage(page);
  render(result.tasks);
  hasNext = result.hasNext;
  page += 1;
}
```

---

## Adım 7 — Bir gösterge paneli (dashboard) oluşturun

```js
const { data: summary } = await api('GET', '/reports/summary');

console.log(`Toplam: ${summary.totalTasks}`);
console.log(`Tamamlanma oranı: %${summary.completionRate}`);

for (const person of summary.byAssignee) {
  console.log(`${person.assignee}: ${person.pending} bekleyen, %${person.completionRate} tamamlandı`);
}

for (const item of summary.byProject) {
  console.log(`${item.project ?? 'Projesiz'}: %${item.completionRate} tamamlandı`);
}
```

Tek bir sayıya ihtiyacınız varsa daha hafif uçları kullanın:

```js
const { data: done } = await api('GET', '/reports/completed');    // { count, total, percentage }
const { data: waiting } = await api('GET', '/reports/pending');    // { count, breakdown, highPriority, ... }
```

---

## Adım 8 — Hataları kullanıcıya gösterin

```js
try {
  await api('POST', '/tasks', { title: 'ab' });
} catch (err) {
  alert(err.message);
  // Geçersiz veri gönderildi.
  // - title alanı en az 3 karakter olmalıdır.
  // - assignee alanı zorunludur.
}
```

| Durum Kodu | Uygulamada ne yapılmalı |
|---|---|
| `400` | `errors` dizisindeki mesajları ilgili form alanlarının altında gösterin |
| `404` | "Görev bulunamadı" mesajı gösterin, listeyi yenileyin (görev başka biri tarafından silinmiş olabilir) |
| `500` | "Bir sorun oluştu, lütfen tekrar deneyin" mesajı gösterin |

---

## Adım 9 — Görevi silin

```js
const { data: deleted } = await api('DELETE', `/tasks/${task.id}`);
console.log(`"${deleted.title}" silindi.`);
```

Silinen görevin id'si bir daha kullanılmaz; yeni görevler her zaman yeni bir id alır.

---

## Hızlı Başvuru

| İşlem | İstek |
|---|---|
| Oluştur | `POST /tasks` |
| Listele | `GET /tasks` |
| Detay | `GET /tasks/:id` |
| Güncelle | `PUT /tasks/:id` |
| Durum değiştir | `PATCH /tasks/:id/status` |
| Ata | `PATCH /tasks/:id/assign` |
| Sil | `DELETE /tasks/:id` |
| Filtrele | `GET /tasks?status=&priority=&project=` |
| Sırala | `GET /tasks?sort=-createdAt` |
| Sayfala | `GET /tasks?page=1&limit=10` |
| Ara | `GET /tasks/search?keyword=` |
| Kişiye göre | `GET /tasks/assignee/:assignee` |
| Raporlar | `GET /reports/completed` · `/reports/pending` · `/reports/summary` |

Tüm ayrıntılar için: [API Dokümantasyonu](api-dokumantasyonu.md)
