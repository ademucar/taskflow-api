const AppError = require('../utils/AppError');

/**
 * Validation middleware
 *
 * Verilen şemaya göre req.body, req.query veya req.params'ı doğrular.
 * Tüm hatalar tek seferde toplanır ve 400 Bad Request olarak döner.
 *
 * Kullanım:
 *   router.post('/', validate(taskBodySchema), controller.create);
 *   router.get('/', validate(taskQuerySchema, 'query'), controller.list);
 *
 * Şema kuralları:
 *   type        'string' | 'integer'
 *   required    Alan zorunlu mu
 *   minLength   / maxLength   (string)
 *   min / max                 (integer)
 *   enum        İzin verilen değerler
 *   pattern     RegExp, patternMessage ile birlikte
 */

const SOURCE_LABELS = { body: 'alanı', query: 'parametresi', params: 'parametresi' };

// undefined, null ve boş metin "gönderilmemiş" sayılır; zorunlu değilse varsayılan kullanılır.
function isEmpty(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function checkString(field, value, rule, label) {
  if (typeof value !== 'string') return `${field} ${label} metin (string) olmalıdır.`;

  const text = value.trim();
  if (rule.minLength && text.length < rule.minLength) {
    return `${field} ${label} en az ${rule.minLength} karakter olmalıdır.`;
  }
  if (rule.maxLength && text.length > rule.maxLength) {
    return `${field} ${label} en fazla ${rule.maxLength} karakter olabilir.`;
  }
  if (rule.enum && !rule.enum.includes(text)) {
    return `${field} ${label} şunlardan biri olmalıdır: ${rule.enum.join(', ')}.`;
  }
  if (rule.pattern && !rule.pattern.test(text)) {
    return `${field} ${label} ${rule.patternMessage}`;
  }
  return null;
}

function checkInteger(field, value, rule, label) {
  // Query ve params değerleri her zaman metin olarak gelir: "2" → 2.
  // Number() "1e1", "0x10", "+5" gibi değerleri de sayıya çevirdiği için
  // metin yalnızca rakamlardan oluşmalıdır.
  if (typeof value === 'string' && !/^-?\d+$/.test(value.trim())) {
    return `${field} ${label} tam sayı olmalıdır.`;
  }
  const number = Number(value);

  if (!Number.isInteger(number)) return `${field} ${label} tam sayı olmalıdır.`;
  if (rule.min !== undefined && number < rule.min) {
    return `${field} ${label} en az ${rule.min} olmalıdır.`;
  }
  if (rule.max !== undefined && number > rule.max) {
    return `${field} ${label} en fazla ${rule.max} olabilir.`;
  }
  return null;
}

function checkField(field, value, rule, label) {
  if (isEmpty(value)) {
    return rule.required ? `${field} ${label} zorunludur.` : null;
  }
  // ?status=a&status=b gibi tekrarlanan sorgu parametreleri
  if (Array.isArray(value)) return `${field} ${label} yalnızca bir kez gönderilmelidir.`;

  if (rule.type === 'integer') return checkInteger(field, value, rule, label);
  return checkString(field, value, rule, label);
}

function validate(schema, source = 'body') {
  const label = SOURCE_LABELS[source];
  const allowedFields = Object.keys(schema);

  return (req, res, next) => {
    const input = req[source];

    if (source === 'body' && (input === null || typeof input !== 'object' || Array.isArray(input))) {
      return next(
        AppError.badRequest('İstek gövdesi bir JSON nesnesi olmalıdır (Content-Type: application/json).'),
      );
    }

    const errors = [];

    for (const key of Object.keys(input)) {
      if (!allowedFields.includes(key)) {
        errors.push({
          field: key,
          message: `${key} ${label} tanınmıyor. Kullanılabilir: ${allowedFields.join(', ')}.`,
        });
      }
    }

    for (const [field, rule] of Object.entries(schema)) {
      const message = checkField(field, input[field], rule, label);
      if (message) errors.push({ field, message });
    }

    if (errors.length > 0) {
      return next(AppError.badRequest('Geçersiz veri gönderildi.', errors));
    }
    next();
  };
}

module.exports = validate;
