/**
 * Fungsi Pembantu (Utilities)
 */

/**
 * Debounce eksekusi fungsi untuk menghindari pemanggilan API beruntun saat mengetik
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Menghindari injeksi karakter HTML pada rendering teks
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Memicu animasi sorotan (highlight) hijau pada elemen saat teks diperbarui
 * @param {HTMLElement} element 
 */
export function triggerHighlight(element) {
  if (!element) return;
  element.classList.remove('highlight-accept');
  void element.offsetWidth; // trigger reflow
  element.classList.add('highlight-accept');
}
