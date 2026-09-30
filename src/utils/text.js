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
    .normalize('NFD') // ş → s + birleşik çengel işareti
    .replace(/[\u0300-\u036f]/g, ''); // birleşik işaretleri (aksanları) kaldırır
}

module.exports = { normalizeText };
