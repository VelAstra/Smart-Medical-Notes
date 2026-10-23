/**
 * Modul Klien API (Fetch API Wrapper)
 * Menangani komunikasi dengan backend FastAPI, timeout, dan fallback lokal jika server offline
 */

import { CONFIG } from './config.js';

// Controller untuk membatalkan request lama yang masih berjalan saat ada input baru
let activeSuggestAbortController = null;
let activeParseAbortController = null;

/**
 * Wrapper umum untuk fetch dengan batas waktu (timeout)
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = CONFIG.REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Jika caller menyediakan signal sendiri, hubungkan
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Endpoint 1: POST /api/parse-soap
 * Mengirim narasi bebas dokter dan menerima struktur SOAP terpisah
 * @param {string} rawNarrative 
 * @returns {Promise<{ S: string, O: string, A: string, P: string }>}
 */
export async function parseSoapNarrative(rawNarrative) {
  if (activeParseAbortController) {
    activeParseAbortController.abort();
  }
  activeParseAbortController = new AbortController();

  const endpoint = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.PARSE_SOAP}`;

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ narrative: rawNarrative }),
      signal: activeParseAbortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        S: data.S || data.subjective || '',
        O: data.O || data.objective || '',
        A: data.A || data.assessment || '',
        P: data.P || data.plan || ''
      },
      isFallback: false
    };
  } catch (err) {
    // Jika dibatalkan oleh request baru, lempar silent abort
    if (err.name === 'AbortError') {
      throw err;
    }

    console.warn('[API Client] Backend belum tersambung, beralih ke Fallback Heuristik Lokal:', err.message);

    if (CONFIG.ENABLE_MOCK_FALLBACK) {
      const fallbackResult = localHeuristicParse(rawNarrative);
      return {
        success: true,
        data: fallbackResult,
        isFallback: true,
        fallbackNotice: 'Menggunakan Parser Lokal (Backend Offline)'
      };
    }

    throw err;
  }
}

/**
 * Endpoint 2: POST /api/suggest
 * Mengirim catatan SOAP dan menerima daftar rekomendasi perbaikan coder
 * @param {{ S: string, O: string, A: string, P: string }} soapData 
 * @returns {Promise<{ suggestions: Array, insuranceScore: number, isFallback: boolean }>}
 */
export async function fetchSoapSuggestions(soapData) {
  if (activeSuggestAbortController) {
    activeSuggestAbortController.abort();
  }
  activeSuggestAbortController = new AbortController();

  const endpoint = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.SUGGEST}`;

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(soapData),
      signal: activeSuggestAbortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      suggestions: data.suggestions || [],
      insuranceScore: data.insurance_readiness_score ?? 100,
      isFallback: false
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }

    console.warn('[API Client] Backend belum aktif, mengeksekusi Mesin Aturan Medis Lokal:', err.message);

    if (CONFIG.ENABLE_MOCK_FALLBACK) {
      const fallbackData = localHeuristicSuggest(soapData);
      return {
        success: true,
        suggestions: fallbackData.suggestions,
        insuranceScore: fallbackData.score,
        isFallback: true,
        fallbackNotice: 'Mesin Aturan Lokal Aktif (Backend Offline)'
      };
    }

    throw err;
  }
}

// ---------------------------------------------------------------------
// MESIN ATURAN CADANGAN LOKAL (FALLBACK CLIENT-SIDE)
// Menjamin aplikasi tetap 100% berfungsi saat backend dalam proses pengembangan
// ---------------------------------------------------------------------

function localHeuristicParse(text) {
  let s = '', o = '', a = '', p = '';
  const sentences = text.split(/(?<=[.?!])\s+/);

  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    if (/keluhan|mengeluh|riwayat|rasa|sejak|pasien|usia|anak/i.test(lower) && !/pemeriksaan|nadi|tampak/i.test(lower)) {
      s += (s ? ' ' : '') + sentence;
    } else if (/pemeriksaan|tanda vital|tampak|nadi|suhu|td|ekstremitas|hiperemis|ronki/i.test(lower)) {
      o += (o ? ' ' : '') + sentence;
    } else if (/diagnosis|dx|suspek|df|ispa|hipertensi|ge|tbc/i.test(lower)) {
      a += (a ? ' ' : '') + sentence;
    } else if (/terapi|diberikan|infus|obat|mg|tablet|sirup|laktat|edukasi|rawat/i.test(lower)) {
      p += (p ? ' ' : '') + sentence;
    } else {
      if (!s) s += sentence;
      else o += (o ? ' ' : '') + sentence;
    }
  });

  return { S: s.trim(), O: o.trim(), A: a.trim(), P: p.trim() };
}

function localHeuristicSuggest(soap) {
  const suggestions = [];
  const sText = soap.S || '';
  const oText = soap.O || '';
  const aText = soap.A || '';
  const pText = soap.P || '';

  // 1. Suhu tubuh
  const mentionsFever = /demam|panas|fever|meriang/i.test(sText) || /fever/i.test(oText);
  const hasTemp = /(suhu|temp|temperature)?\s*(3[5-9]|4[0-2])([.,]\d+)?\s*(°?c|celcius)?/i.test(oText);
  if (mentionsFever && !hasTemp) {
    suggestions.push({
      id: 'rule_missing_temp',
      category: 'Kelengkapan Tanda Vital',
      title: 'Add temperature data',
      description: 'Keluhan demam terdeteksi di Subjective, namun nilai kuantitatif suhu belum tercatat pada Objective.',
      field: 'O',
      action_type: 'append',
      payload: 'temperature: 38.8 C',
      badge_text: 'Wajib Klaim Asuransi'
    });
  }

  // 2. Tekanan darah
  const mentionsBp = /hipertensi|ht|tekanan darah tinggi|tengkuk berat|pusing/i.test(sText) || /ht/i.test(aText);
  const hasBp = /(td|bp|tensi)?\s*\d{2,3}\s*\/\s*\d{2,3}/i.test(oText);
  if (mentionsBp && !hasBp) {
    suggestions.push({
      id: 'rule_missing_bp',
      category: 'Kelengkapan Tanda Vital',
      title: 'Tambahkan nilai Tekanan Darah (TD)',
      description: 'Ada indikasi hipertensi/nyeri kepala, wajib menyertakan bukti tensi darah pada Objective.',
      field: 'O',
      action_type: 'append',
      payload: 'TD: 150/95 mmHg',
      badge_text: 'Kriteria Verifikasi Coder'
    });
  }

  // 3. Singkatan medis ambigu
  const abbrList = [
    { regex: /\bdf\b/gi, code: 'df', expansion: 'dengue fever' },
    { regex: /\bispa\b/gi, code: 'ispa', expansion: 'Infeksi Saluran Pernapasan Akut (ISPA)' },
    { regex: /\bht\b/gi, code: 'ht', expansion: 'hipertensi' },
    { regex: /\bdm\b/gi, code: 'dm', expansion: 'diabetes mellitus' },
    { regex: /\btbc?\b/gi, code: 'tb', expansion: 'tuberculosis' }
  ];

  abbrList.forEach((abbr, i) => {
    if (abbr.regex.test(aText)) {
      suggestions.push({
        id: `rule_abbr_${abbr.code}_${i}`,
        category: 'Singkatan Medis Ambigu',
        title: `Change ${abbr.code} to ${abbr.expansion}`,
        description: `Singkatan "${abbr.code}" ambigu dan rentan penolakan klaim. Rekomendasi ekspansi ke terminologi standar.`,
        field: 'A',
        action_type: 'replace',
        search_target: abbr.code,
        payload: abbr.expansion,
        badge_text: 'Standar ICD-10'
      });
    }
  });

  // Skor
  let score = 100;
  if (suggestions.length === 1) score = 75;
  else if (suggestions.length === 2) score = 50;
  else if (suggestions.length >= 3) score = 30;
  if (!sText && !oText && !aText && !pText) score = 0;

  return { suggestions, score };
}
