/**
 * data/tasks.json dosyasını örnek görevlerle yeniden oluşturur.
 * Kullanım: npm run seed
 * Test betiği (scripts/run-tests.js) de aynı fonksiyonu geçici bir dosya için kullanır.
 */
const fs = require('fs/promises');
const path = require('path');
const config = require('../src/config');

const sampleTasks = [
  ['Proje klasör yapısını oluştur', 'Katmanlı mimariye uygun src klasörü hazırlanacak.', 'completed', 'high', 'musa', 'TaskFlow API'],
  ['Express sunucusunu kur', 'Express 5 kurulumu ve temel middleware zinciri.', 'completed', 'high', 'musa', 'TaskFlow API'],
  ['Görev CRUD endpoint\'lerini yaz', 'Backend tarafında ekleme, listeleme, detay, güncelleme ve silme işlemleri.', 'in-progress', 'high', 'musa', 'TaskFlow API'],
  ['Logger middleware geliştir', 'Tüm isteklerin method, endpoint ve zaman bilgisi loglanacak.', 'completed', 'medium', 'ayse', 'TaskFlow API'],
  ['Validation middleware yaz', 'title, description, priority ve assignee alanları doğrulanacak.', 'in-progress', 'medium', 'ayse', 'TaskFlow API'],
  ['Veri modeli dokümanını hazırla', 'Görev alanları ve kuralları dokümante edilecek.', 'completed', 'low', 'zeynep', 'Test ve Dokümantasyon'],
  ['Postman koleksiyonunu oluştur', 'Tüm endpoint\'ler için örnek istekler ve testler.', 'pending', 'medium', 'mehmet', 'Test ve Dokümantasyon'],
  ['Raporlama servislerini ekle', 'Tamamlanan, bekleyen görev sayıları ve genel özet.', 'pending', 'medium', 'mehmet', 'TaskFlow API'],
  ['Arama özelliğini geliştir', 'Başlık ve açıklamada anahtar kelimeyle backend araması.', 'pending', 'low', 'zeynep', 'TaskFlow API'],
  ['README kurulum notunu yaz', 'Projenin nasıl kurulup çalıştırılacağı adım adım anlatılacak.', 'pending', 'low', 'ayse', 'Test ve Dokümantasyon'],
  ['Sayfalama yapısını test et', 'page ve limit parametreleri farklı değerlerle denenecek.', 'pending', 'high', 'can', 'TaskFlow API'],
  ['Hata mesajlarını Türkçeleştir', 'Tüm hata yanıtları anlaşılır Türkçe mesajlar içerecek.', 'in-progress', 'low', 'can', 'TaskFlow API'],
];

async function seed() {
  // Görevler, seed çalıştırıldığı andan geriye doğru 7'şer saat arayla oluşturulmuş gibi
  // tarihlenir; böylece sonradan eklenen görevler her zaman en yeni olur.
  const hour = 60 * 60 * 1000;
  const lastHour = Math.floor(Date.now() / hour) * hour;
  const start = lastHour - (sampleTasks.length * 7 + 5) * hour;

  const tasks = sampleTasks.map(([title, description, status, priority, assignee, project], index) => {
    const createdAt = new Date(start + index * 7 * hour).toISOString();
    const updatedAt = status === 'pending' ? createdAt : new Date(start + (index * 7 + 5) * hour).toISOString();
    return { id: index + 1, title, description, status, priority, assignee, project, createdAt, updatedAt };
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
