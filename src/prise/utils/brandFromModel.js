/**
 * Detect brand name from a model label string.
 * Returns empty string if brand is not recognised.
 * @param {string} label
 * @returns {string}
 */
export function brandFromModel(label) {
  if (!label) return '';
  const l = label.toLowerCase();
  if (/iphone|ipad|macbook|ipod|apple/.test(l)) return 'Apple';
  if (/samsung|galaxy/.test(l)) return 'Samsung';
  if (/xiaomi|redmi|poco/.test(l)) return 'Xiaomi';
  if (/huawei/.test(l)) return 'Huawei';
  if (/honor/.test(l)) return 'Honor';
  if (/oppo/.test(l)) return 'OPPO';
  if (/realme/.test(l)) return 'Realme';
  if (/vivo/.test(l)) return 'Vivo';
  if (/oneplus/.test(l)) return 'OnePlus';
  if (/nokia/.test(l)) return 'Nokia';
  if (/motorola|moto /.test(l)) return 'Motorola';
  if (/google|pixel/.test(l)) return 'Google';
  return '';
}

/**
 * Detect device type from a model label string.
 * @param {string} label
 * @returns {'smartphone' | 'tablet' | 'laptop'}
 */
export function deviceTypeFromModel(label) {
  if (!label) return 'smartphone';
  const l = label.toLowerCase();
  if (/ipad|galaxy\s*tab|lenovo\s*tab|xiaomi\s*pad|redmi\s*pad/.test(l)) return 'tablet';
  if (/macbook|thinkpad|ноутбук/.test(l)) return 'laptop';
  return 'smartphone';
}
