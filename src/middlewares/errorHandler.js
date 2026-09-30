const AppError = require('../utils/AppError');

// Tüm hataları tek bir JSON formatında yanıtlar. Express, 4 parametreli
// middleware'i hata yakalayıcı olarak tanır.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // İstemci gövdeyi göndermeden bağlantıyı kopardı: yanıtı alacak kimse yok.
  // Logger bu isteği "aborted" olarak kaydeder.
  if (err.type === 'request.aborted') return;

  // express.json() bozuk bir gövdeyle karşılaştığında
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'İstek gövdesi geçerli bir JSON değil.',
    });
  }

  // express.json() varsayılan olarak en fazla 100 KB gövde kabul eder
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'İstek gövdesi çok büyük (en fazla 100 KB).',
    });
  }

  // express.json()'dan gelen diğer istemci hataları (desteklenmeyen karakter seti vb.)
  if (err.expose && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ success: false, message: 'İstek işlenemedi.' });
  }

  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Beklenmeyen bir sunucu hatası oluştu.',
  });
}

module.exports = errorHandler;
