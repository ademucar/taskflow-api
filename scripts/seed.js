/**
 * data/tasks.json dosyasını örnek görevlerle yeniden oluşturur.
 * Kullanım: npm run seed
 * Test betiği (scripts/run-tests.js) de aynı fonksiyonu geçici bir dosya için kullanır.
 */
const fs = require('fs/promises');
const path = require('path');
const config = require('../src/config');

const sampleTasks = [
  ['Proje klasör yapısını oluştur', 'Katmanlı mimariye uygun src klasörü hazırlanacak.', 'completed', 'high', 'musa'],
  ['Express sunucusunu kur', 'Express 5 kurulumu ve temel middleware zinciri.', 'completed', 'high', 'musa'],
  ['Görev CRUD endpoint\'lerini yaz', 'Backend tarafında ekleme, listeleme, detay, güncelleme ve silme işlemleri.', 'in-progress', 'high', 'musa'],
  ['Logger middleware geliştir', 'Tüm isteklerin method, endpoint ve zaman bilgisi loglanacak.', 'completed', 'medium', 'ayse'],
  ['Validation middleware yaz', 'title, description, priority ve assignee alanları doğrulanacak.', 'in-progress', 'medium', 'ayse'],
  ['Veri modeli dokümanını hazırla', 'Görev alanları ve kuralları dokümante edilecek.', 'completed', 'low', 'zeynep'],
  ['Postman koleksiyonunu oluştur', 'Tüm endpoint\'ler için örnek istekler ve testler.', 'pending', 'medium', 'mehmet'],
  ['Raporlama servislerini ekle', 'Tamamlanan, bekleyen görev sayıları ve genel özet.', 'pending', 'medium', 'mehmet'],
  ['Arama özelliğini geliştir', 'Başlık ve açıklamada anahtar kelimeyle backend araması.', 'pending', 'low', 'zeynep'],
  ['README kurulum notunu yaz', 'Projenin nasıl kurulup çalıştırılacağı adım adım anlatılacak.', 'pending', 'low', 'ayse'],
  ['Sayfalama yapısını test et', 'page ve limit parametreleri farklı değerlerle denenecek.', 'pending', 'high', 'can'],
  ['Hata mesajlarını Türkçeleştir', 'Tüm hata yanıtları anlaşılır Türkçe mesajlar içerecek.', 'in-progress', 'low', 'can'],
];

async function seed() {
  const start = Date.parse('2026-10-10T09:00:00.000Z');
  const hour = 60 * 60 * 1000;

  const tasks = sampleTasks.map(([title, description, status, priority, assignee], index) => {
    const createdAt = new Date(start + index * 7 * hour).toISOString();
    const updatedAt = status === 'pending' ? createdAt : new Date(start + (index * 7 + 5) * hour).toISOString();
    return { id: index + 1, title, description, status, priority, assignee, createdAt, updatedAt };
  });

  await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
  await fs.writeFile(
    config.dataFile,
    JSON.stringify({ lastId: tasks.length, tasks }, null, 2) + '\n',
    'utf8',
  );
  return tasks.length;
}

module.exports = seed;

// Doğrudan çalıştırıldığında (npm run seed)
if (require.main === module) {
  seed()
    .then((count) => {
      console.log(`${count} örnek görev yüklendi → ${path.relative(process.cwd(), config.dataFile)}`);
    })
    .catch((err) => {
      console.error('Seed işlemi başarısız:', err);
      process.exit(1);
    });
}
