/**
 * Postman koleksiyonunu Newman ile otomatik çalıştırır.
 * Kullanım: npm test
 *
 * - Gerçek veriye dokunmamak için geçici bir veri dosyası oluşturulur ve örnek veriyle doldurulur.
 * - Uygulama boş bir portta başlatılır, koleksiyon bu adrese karşı koşulur.
 * - Newman npx ile çağrılır; projeye bağımlılık olarak eklenmez.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskflow-test-'));
process.env.DATA_FILE = path.join(tempDir, 'tasks.json');
process.env.LOG_FILE = path.join(tempDir, 'requests.log');
process.env.LOG_CONSOLE = 'false';

const seed = require('./seed');
const app = require('../src/app');

const rootDir = path.resolve(__dirname, '..');
const collection = 'postman/TaskFlow.postman_collection.json';

function runNewman(baseUrl) {
  return new Promise((resolve) => {
    // Windows'ta npx bir .cmd dosyası olduğu için shell gerekir; shell ile
    // argüman dizisi vermek Node'da uyarı ürettiğinden komut tek metin olarak verilir.
    const command = `npx --yes newman@6 run ${collection} --env-var baseUrl=${baseUrl} --color on`;
    const child = spawn(command, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
      // Newman'ın kendi bağımlılıklarından gelen Node uyarılarını gizler
      env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main() {
  await seed();

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://localhost:${server.address().port}`;
  console.log(`Test sunucusu: ${baseUrl}\n`);

  const exitCode = await runNewman(baseUrl);

  server.close();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Windows'ta log dosyası hâlâ açıksa silinemeyebilir; geçici klasör olduğu için sorun değil.
  }
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
