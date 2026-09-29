const AppError = require('../utils/AppError');

// Hiçbir route ile eşleşmeyen istekler buraya düşer.
function notFound(req, res, next) {
  next(AppError.notFound(`Endpoint bulunamadı: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
