/**
 * Konfigurasi Global Frontend Smart Medical Notes
 */
export const CONFIG = {
  // URL dasar backend FastAPI Pratama Aji
  API_BASE_URL: 'http://localhost:8000',
  
  // Endpoint contracts
  ENDPOINTS: {
    PARSE_SOAP: '/api/parse-soap',
    SUGGEST: '/api/suggest',
    HEALTH: '/health'
  },

  // Waktu tunggu debounce saat dokter mengetik (ms)
  DEBOUNCE_DELAY_MS: 400,

  // Batas waktu timeout permintaan HTTP (ms)
  REQUEST_TIMEOUT_MS: 6000,

  // Aktifkan fallback simulasi lokal jika server backend belum dinyalakan
  ENABLE_MOCK_FALLBACK: true
};
