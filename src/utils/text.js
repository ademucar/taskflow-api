/**
 * Arama ve karşılaştırma için metni sadeleştirir:
 * küçük harfe çevirir ve Türkçe karakterleri İngilizce karşılıklarına indirger.
 *
 *   normalizeText('İşlem API') === normalizeText('islem api')  // true
 */
function normalizeText(value) {
  return String(value)
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

module.exports = { normalizeText };
