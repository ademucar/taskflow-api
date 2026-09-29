/**
 * Beklenen (kontrollü) hatalar için kullanılır.
 * errorHandler middleware'i bu hataları statusCode ile birlikte istemciye döndürür.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message, errors) {
    return new AppError(message, 400, errors);
  }

  static notFound(message) {
    return new AppError(message, 404);
  }
}

module.exports = AppError;
