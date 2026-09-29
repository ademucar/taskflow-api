const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

module.exports = {
  port: Number(process.env.PORT) || 3000,
  dataFile: process.env.DATA_FILE || path.join(rootDir, 'data', 'tasks.json'),
  logFile: process.env.LOG_FILE || path.join(rootDir, 'logs', 'requests.log'),
  // LOG_CONSOLE=false → istekler sadece dosyaya yazılır (otomatik testlerde çıktıyı sade tutar)
  logToConsole: process.env.LOG_CONSOLE !== 'false',
};
