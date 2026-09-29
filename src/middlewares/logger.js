const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Logger middleware
 *
 * Her API isteği için method, endpoint ve zaman damgasını; yanıt tamamlandığında
 * status kodu ve yanıt süresini kayıt altına alır.
 *   - Konsola: renkli çıktı
 *   - Dosyaya: logs/requests.log (düz metin, her satır bir istek)
 *
 * Örnek satır:
 *   [2026-10-12T09:41:07.312Z] GET /tasks?status=pending 200 - 3.18 ms
 */

fs.mkdirSync(path.dirname(config.logFile), { recursive: true });
const logStream = fs.createWriteStream(config.logFile, { flags: 'a' });

const useColors = process.stdout.isTTY;
const COLORS = { red: 31, green: 32, yellow: 33, cyan: 36, gray: 90 };

function paint(text, color) {
  return useColors ? `\x1b[${COLORS[color]}m${text}\x1b[0m` : text;
}

function statusColor(status) {
  if (status === 'aborted' || status >= 500) return 'red';
  if (status >= 400) return 'yellow';
  if (status >= 300) return 'cyan';
  return 'green';
}

function logger(req, res, next) {
  const timestamp = new Date().toISOString();
  const start = process.hrtime.bigint();
  const { method, originalUrl } = req;

  // 'close' her istekte tetiklenir; yanıt gönderilmeden bağlantı koparsa
  // (istemci isteği iptal ederse) istek yine loglanır ve "aborted" olarak işaretlenir.
  res.once('close', () => {
    const durationMs = (Number(process.hrtime.bigint() - start) / 1e6).toFixed(2);
    const status = res.writableFinished ? res.statusCode : 'aborted';

    logStream.write(`[${timestamp}] ${method} ${originalUrl} ${status} - ${durationMs} ms\n`);

    if (!config.logToConsole) return;
    console.log(
      `${paint(`[${timestamp}]`, 'gray')} ${paint(method.padEnd(6), 'cyan')} ${originalUrl} ` +
        `${paint(String(status), statusColor(status))} ${paint(`- ${durationMs} ms`, 'gray')}`,
    );
  });

  next();
}

module.exports = logger;
