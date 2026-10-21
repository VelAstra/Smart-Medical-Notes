/**
 * Smart Medical Notes - Interactive Prototype Logic
 * Dirancang untuk pembuktian konsep (MVP) mata kuliah KS RPLD
 * Berdasarkan rancangan slide disertasi Dr. Lukman
 */

// Kamus Singkatan Medis Ambigu
const MEDICAL_ABBREVIATIONS = [
  { regex: /\bdf\b/gi, code: 'df', expansion: 'dengue fever', field: 'A', title: 'Ubah singkatan "df" menjadi "dengue fever"' },
  { regex: /\bispa\b/gi, code: 'ispa', expansion: 'Infeksi Saluran Pernapasan Akut (ISPA)', field: 'A', title: 'Perjelas "ispa" menjadi istilah resmi rekam medis' },
  { regex: /\bht\b/gi, code: 'ht', expansion: 'hipertensi', field: 'A', title: 'Ubah singkatan "ht" menjadi "hipertensi"' },
  { regex: /\bdm\b/gi, code: 'dm', expansion: 'diabetes mellitus', field: 'A', title: 'Ubah "dm" menjadi "diabetes mellitus"' },
  { regex: /\btb\b|\btbc\b/gi, code: 'tb', expansion: 'tuberculosis', field: 'A', title: 'Ubah singkatan "tb/tbc" menjadi "tuberculosis"' },
  { regex: /\bge\b|\bgea\b/gi, code: 'gea', expansion: 'gastroenteritis akut', field: 'A', title: 'Perjelas singkatan "ge/gea" menjadi "gastroenteritis akut"' }
];

// Data Uji / Preset Demo
const TEST_PRESETS = {
  slide_case: {
    name: 'Kasus 1: Demam Berdarah Anak (Slide Disertasi)',
    narrative: 'Patient 3 years old has fever, red spots on the skin. Examination shows petechia on skin, strong pulse 120. Diagnosis df. Plan intravenous fluid ringer lactate.',
    soap: {
      S: 'patient 3 years old has fever, red spots on the skin',
      O: 'petechia on skin, strong pulse 120',
      A: 'df',
      P: 'intravenous fluid ringer lactate'
    }
  },
  ispa_case: {
    name: 'Kasus 2: ISPA & Demam Tanpa Suhu Terukur',
    narrative: 'Pasien dewasa mengeluh batuk berdahak, pilek, dan demam selama 2 hari. Pada pemeriksaan fisik faring hiperemis (+), ronki (-), wheezing (-). Diagnosis ispa. Diberikan paracetamol 3x500mg, ambroxol sirup 3x1.',
    soap: {
      S: 'pasien dewasa mengeluh batuk berdahak, pilek, dan demam 2 hari',
      O: 'faring hiperemis (+), ronki (-), wheezing (-)',
      A: 'ispa',
      P: 'paracetamol 3x500mg, ambroxol sirup 3x1'
    }
  },
  ht_case: {
    name: 'Kasus 3: Hipertensi Tidak Terkontrol',
    narrative: 'Pasien datang dengan nyeri kepala bagian belakang dan tengkuk terasa berat. Pemeriksaan nadi 88 x/menit teratur, konjungtiva tidak anemis. Diagnosis kerja ht. Terapi amlodipine 10mg 1x1 tablet per oral.',
    soap: {
      S: 'pasien datang dengan nyeri kepala bagian belakang dan tengkuk berat',
      O: 'nadi 88 x/menit teratur, konjungtiva anemis (-)',
      A: 'ht',
      P: 'amlodipine 10mg 1x1 tablet oral'
    }
  },
  empty: {
    name: 'Kosongkan',
    narrative: '',
    soap: { S: '', O: '', A: '', P: '' }
  }
};

// State Aplikasi
const appState = {
  currentSoap: { S: '', O: '', A: '', P: '' },
  activeSuggestions: [],
  ignoredSuggestionKeys: new Set(),
  debounceTimer: null
};

// Elemen DOM
const dom = {
  casePresetSelect: document.getElementById('casePresetSelect'),
  btnResetAll: document.getElementById('btnResetAll'),
  toggleExtractorBtn: document.getElementById('toggleExtractorBtn'),
  extractorToggleText: document.getElementById('extractorToggleText'),
  narrativeBox: document.getElementById('narrativeBox'),
  rawNarrativeInput: document.getElementById('rawNarrativeInput'),
  btnRunExtraction: document.getElementById('btnRunExtraction'),
  soapSubjective: document.getElementById('soapSubjective'),
  soapObjective: document.getElementById('soapObjective'),
  soapAssessment: document.getElementById('soapAssessment'),
  soapPlan: document.getElementById('soapPlan'),
  badgeS: document.getElementById('badgeS'),
  badgeO: document.getElementById('badgeO'),
  badgeA: document.getElementById('badgeA'),
  badgeP: document.getElementById('badgeP'),
  btnAnalyzeSoap: document.getElementById('btnAnalyzeSoap'),
  btnSubmitFinal: document.getElementById('btnSubmitFinal'),
  suggestionCountBadge: document.getElementById('suggestionCountBadge'),
  btnAcceptAll: document.getElementById('btnAcceptAll'),
  btnRejectAll: document.getElementById('btnRejectAll'),
  btnClearAll: document.getElementById('btnClearAll'),
  suggestionsContainer: document.getElementById('suggestionsContainer'),
  emptyStateNotice: document.getElementById('emptyStateNotice'),
  scoreText: document.getElementById('scoreText'),
  scoreBar: document.getElementById('scoreBar'),
  scoreHint: document.getElementById('scoreHint'),
  finalSubmitModal: document.getElementById('finalSubmitModal'),
  finalSummaryContent: document.getElementById('finalSummaryContent'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnConfirmSend: document.getElementById('btnConfirmSend')
};

// Inisialisasi Aplikasi
function initApp() {
  attachEventListeners();
  loadPreset('slide_case');
}

// Pasang Event Listeners
function attachEventListeners() {
  // Preset selector
  dom.casePresetSelect.addEventListener('change', (e) => {
    loadPreset(e.target.value);
  });

  // Reset
  dom.btnResetAll.addEventListener('click', () => {
    loadPreset('slide_case');
  });

  // Toggle Box Narasi Bebas
  dom.toggleExtractorBtn.addEventListener('click', () => {
    const isHidden = dom.narrativeBox.classList.contains('hidden');
    if (isHidden) {
      dom.narrativeBox.classList.remove('hidden');
      dom.extractorToggleText.textContent = 'Tutup Input Narasi Bebas';
    } else {
      dom.narrativeBox.classList.add('hidden');
      dom.extractorToggleText.textContent = 'Buka Input Narasi Bebas';
    }
  });

  // Ekstraksi Paragraf Bebas ke SOAP
  dom.btnRunExtraction.addEventListener('click', () => {
    const rawText = dom.rawNarrativeInput.value.trim();
    if (!rawText) return;
    extractNarrativeToSoap(rawText);
  });

  // Input listener pada textarea SOAP untuk analisis real-time
  const textareas = [
    { el: dom.soapSubjective, key: 'S', badge: dom.badgeS },
    { el: dom.soapObjective, key: 'O', badge: dom.badgeO },
    { el: dom.soapAssessment, key: 'A', badge: dom.badgeA },
    { el: dom.soapPlan, key: 'P', badge: dom.badgeP }
  ];

  textareas.forEach(item => {
    item.el.addEventListener('input', () => {
      appState.currentSoap[item.key] = item.el.value;
      updateCharCount(item.el, item.badge);
      scheduleAnalysis();
    });
  });

  // Tombol aksi manual
  dom.btnAnalyzeSoap.addEventListener('click', runQualityAnalysis);

  // Tombol aksi massal
  dom.btnAcceptAll.addEventListener('click', acceptAllSuggestions);
  dom.btnRejectAll.addEventListener('click', rejectAllSuggestions);
  dom.btnClearAll.addEventListener('click', clearAllSuggestions);

  // Modal Submit Final
  dom.btnSubmitFinal.addEventListener('click', showSubmitModal);
  dom.btnCloseModal.addEventListener('click', () => dom.finalSubmitModal.classList.add('hidden'));
  dom.btnConfirmSend.addEventListener('click', () => {
    alert('Rekam medis terstruktur (SOAP) berhasil diverifikasi dan disimpan.');
    dom.finalSubmitModal.classList.add('hidden');
  });
}

// Muat Data Preset Kasus
function loadPreset(presetKey) {
  const preset = TEST_PRESETS[presetKey] || TEST_PRESETS.slide_case;
  
  appState.ignoredSuggestionKeys.clear();
  appState.currentSoap = { ...preset.soap };

  dom.soapSubjective.value = preset.soap.S;
  dom.soapObjective.value = preset.soap.O;
  dom.soapAssessment.value = preset.soap.A;
  dom.soapPlan.value = preset.soap.P;
  dom.rawNarrativeInput.value = preset.narrative;

  updateCharCount(dom.soapSubjective, dom.badgeS);
  updateCharCount(dom.soapObjective, dom.badgeO);
  updateCharCount(dom.soapAssessment, dom.badgeA);
  updateCharCount(dom.soapPlan, dom.badgeP);

  runQualityAnalysis();
}

// Pembaruan Penghitung Karakter
function updateCharCount(el, badge) {
  const len = el.value.length;
  badge.textContent = `${len} karakter`;
}

// Jadwalkan Analisis Otomatis (Debounce 350ms)
function scheduleAnalysis() {
  clearTimeout(appState.debounceTimer);
  appState.debounceTimer = setTimeout(() => {
    runQualityAnalysis();
  }, 350);
}

// Engine Ekstraksi Narasi Paragraf Bebas ke SOAP
function extractNarrativeToSoap(text) {
  let s = '';
  let o = '';
  let a = '';
  let p = '';

  // Logika heuristik ekstraksi kalimat
  const sentences = text.split(/(?<=[.?!])\s+/);

  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();

    if (/keluhan|mengeluh|riwayat|rasa|merasa|sejak|anak|usia|pasien datang/i.test(lower) && !/pemeriksaan|nadi|tampak/i.test(lower)) {
      s += (s ? ' ' : '') + sentence;
    } else if (/pemeriksaan|tanda vital|tampak|nadi|suhu|td|tekanan darah|ekstremitas|hiperemis|ronki|wheezing|pupil/i.test(lower)) {
      o += (o ? ' ' : '') + sentence;
    } else if (/diagnosis|dx|suspek|kesimpulan|df|ispa|hipertensi|ge|tbc/i.test(lower)) {
      a += (a ? ' ' : '') + sentence;
    } else if (/terapi|diberikan|infus|obat|mg|tablet|sirup|laktat|edukasi|rawat|observasi|plan/i.test(lower)) {
      p += (p ? ' ' : '') + sentence;
    } else {
      // Default jika belum terpetakan, masukkan ke Subjective
      if (!s) s += sentence;
      else o += (o ? ' ' : '') + sentence;
    }
  });

  dom.soapSubjective.value = s.trim();
  dom.soapObjective.value = o.trim();
  dom.soapAssessment.value = a.trim();
  dom.soapPlan.value = p.trim();

  appState.currentSoap = {
    S: dom.soapSubjective.value,
    O: dom.soapObjective.value,
    A: dom.soapAssessment.value,
    P: dom.soapPlan.value
  };

  updateCharCount(dom.soapSubjective, dom.badgeS);
  updateCharCount(dom.soapObjective, dom.badgeO);
  updateCharCount(dom.soapAssessment, dom.badgeA);
  updateCharCount(dom.soapPlan, dom.badgeP);

  runQualityAnalysis();
}

// Engine Analisis Kualitas Rekam Medis (Coder's Perspective)
function runQualityAnalysis() {
  const suggestions = [];
  const sText = dom.soapSubjective.value;
  const oText = dom.soapObjective.value;
  const aText = dom.soapAssessment.value;
  const pText = dom.soapPlan.value;

  // 1. Cek Kelengkapan Data Suhu Tubuh (Suhu Demam / Temperature)
  const mentionsFever = /demam|panas|fever|meriang|suhu tinggi/i.test(sText) || /fever/i.test(oText);
  const hasTemperatureNumber = /(suhu|temp|temperature|t:|s:)?\s*(3[5-9]|4[0-2])([.,]\d+)?\s*(°?c|celcius)?/i.test(oText);

  if (mentionsFever && !hasTemperatureNumber) {
    const key = 'missing_temperature';
    if (!appState.ignoredSuggestionKeys.has(key)) {
      suggestions.push({
        id: key,
        category: 'Kelengkapan Tanda Vital',
        categoryClass: 'bg-amber-100 text-amber-800 border-amber-200',
        title: 'Add temperature data',
        description: 'Catatan Subjective menyebutkan gejala demam/fever, namun hasil pengukuran suhu tubuh belum tercantum pada Objective.',
        field: 'O',
        actionType: 'append',
        payload: 'temperature: 38.8 C',
        badgeText: 'Klaim Asuransi Butuh Nilai Suhu'
      });
    }
  }

  // 2. Cek Kelengkapan Tekanan Darah untuk Gejala Kardiovaskular/Hipertensi/Pusing Berat
  const mentionsBpRisk = /hipertensi|ht|tekanan darah tinggi|tengkuk berat|pusing kepala/i.test(sText) || /ht/i.test(aText);
  const hasBpMeasurement = /(td|bp|tensi|tekanan darah)?\s*\d{2,3}\s*\/\s*\d{2,3}/i.test(oText);

  if (mentionsBpRisk && !hasBpMeasurement) {
    const key = 'missing_blood_pressure';
    if (!appState.ignoredSuggestionKeys.has(key)) {
      suggestions.push({
        id: key,
        category: 'Kelengkapan Tanda Vital',
        categoryClass: 'bg-rose-100 text-rose-800 border-rose-200',
        title: 'Tambahkan nilai Tekanan Darah (TD)',
        description: 'Ada keluhan atau riwayat terkait tekanan darah/hipertensi, tetapi angka tekanan darah (mmHg) belum didokumentasikan di Objective.',
        field: 'O',
        actionType: 'append',
        payload: 'TD: 150/95 mmHg',
        badgeText: 'Wajib Verifikasi Coder'
      });
    }
  }

  // 3. Deteksi Singkatan Medis Ambigu (Persis seperti kasus slide: "Change df to dengue fever")
  MEDICAL_ABBREVIATIONS.forEach((item, idx) => {
    const targetText = item.field === 'A' ? aText : (item.field === 'P' ? pText : sText);
    if (item.regex.test(targetText)) {
      const key = `abbreviation_${item.code}_${idx}`;
      if (!appState.ignoredSuggestionKeys.has(key)) {
        suggestions.push({
          id: key,
          category: 'Singkatan Medis Ambigu',
          categoryClass: 'bg-blue-100 text-blue-800 border-blue-200',
          title: `Change ${item.code} to ${item.expansion}`,
          description: `Singkatan "${item.code}" berpotensi menimbulkan kerancuan saat koding berkas klaim ICD-10. Disarankan menggunakan terminologi standar.`,
          field: item.field,
          actionType: 'replace',
          targetWord: item.regex,
          payload: item.expansion,
          badgeText: 'Standardisasi ICD-10'
        });
      }
    }
  });

  // 4. Deteksi Kolom Plan yang Terlalu Ringkas
  if (pText.trim().length > 0 && pText.trim().length < 15) {
    const key = 'sparse_plan';
    if (!appState.ignoredSuggestionKeys.has(key)) {
      suggestions.push({
        id: key,
        category: 'Spesifikasi Terapi',
        categoryClass: 'bg-purple-100 text-purple-800 border-purple-200',
        title: 'Lengkapi dosis atau rute pemberian obat',
        description: 'Detail terapi pada Plan sangat singkat. Tambahkan informasi rute pemberian (oral/IV) atau frekuensi konsumsi.',
        field: 'P',
        actionType: 'append',
        payload: ' (oral, sesudah makan)',
        badgeText: 'Keamanan Pasien'
      });
    }
  }

  appState.activeSuggestions = suggestions;
  renderSuggestionsList();
  updateInsuranceScore();
}

// Render Daftar Saran Rekomendasi
function renderSuggestionsList() {
  const container = dom.suggestionsContainer;
  const count = appState.activeSuggestions.length;
  dom.suggestionCountBadge.textContent = `${count} Saran`;

  if (count === 0) {
    container.innerHTML = `
      <div class="text-center py-10 px-4 border-2 border-dashed border-emerald-200 bg-emerald-50/40 rounded-lg">
        <svg class="w-8 h-8 mx-auto text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-xs font-bold text-emerald-800 mt-2">Semua Saran Telah Diselesaikan!</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Catatan rekam medis terstruktur telah memenuhi kriteria validasi koder.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  appState.activeSuggestions.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'suggestion-card bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-2.5';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${item.categoryClass}">
            ${item.category}
          </span>
          <span class="text-[10px] font-semibold text-slate-400">Target Field: ${item.field}</span>
        </div>
        <h4 class="text-xs font-bold text-slate-900 mt-1.5">${index + 1}. ${item.title}</h4>
        <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">${item.description}</p>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
        <span class="text-[10px] text-slate-500 font-medium">${item.badgeText}</span>
        <div class="flex space-x-1.5">
          <button data-action="reject" data-id="${item.id}" class="text-xs font-semibold px-2.5 py-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-300 transition-colors">
            Reject
          </button>
          <button data-action="accept" data-id="${item.id}" class="text-xs font-bold px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded shadow-xs transition-colors flex items-center space-x-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Accept</span>
          </button>
        </div>
      </div>
    `;

    // Event listener tombol per item
    card.querySelector('[data-action="accept"]').addEventListener('click', () => acceptSuggestion(item.id));
    card.querySelector('[data-action="reject"]').addEventListener('click', () => rejectSuggestion(item.id));

    container.appendChild(card);
  });
}

// Aksi Menerima 1 Saran
function acceptSuggestion(id) {
  const item = appState.activeSuggestions.find(s => s.id === id);
  if (!item) return;

  const targetEl = getFieldElement(item.field);
  if (!targetEl) return;

  if (item.actionType === 'replace') {
    targetEl.value = targetEl.value.replace(item.targetWord, item.payload);
  } else if (item.actionType === 'append') {
    if (targetEl.value.trim().length > 0) {
      targetEl.value = `${targetEl.value.trim()}, ${item.payload}`;
    } else {
      targetEl.value = item.payload;
    }
  }

  // Efek visual highlight pada kolom yang diperbarui
  targetEl.classList.remove('highlight-accept');
  void targetEl.offsetWidth; // trigger reflow
  targetEl.classList.add('highlight-accept');

  // Sinkronkan state
  appState.currentSoap[item.field] = targetEl.value;
  updateCharCount(targetEl, getBadgeElement(item.field));

  // Jalankan ulang analisis untuk memperbarui daftar saran
  runQualityAnalysis();
}

// Aksi Menolak 1 Saran
function rejectSuggestion(id) {
  appState.ignoredSuggestionKeys.add(id);
  runQualityAnalysis();
}

// Aksi Menerima Seluruh Saran Sekaligus
function acceptAllSuggestions() {
  const currentList = [...appState.activeSuggestions];
  currentList.forEach(item => {
    const targetEl = getFieldElement(item.field);
    if (!targetEl) return;

    if (item.actionType === 'replace') {
      targetEl.value = targetEl.value.replace(item.targetWord, item.payload);
    } else if (item.actionType === 'append') {
      if (targetEl.value.trim().length > 0) {
        targetEl.value = `${targetEl.value.trim()}, ${item.payload}`;
      } else {
        targetEl.value = item.payload;
      }
    }
    appState.currentSoap[item.field] = targetEl.value;
    updateCharCount(targetEl, getBadgeElement(item.field));
  });

  // Berikan highlight pada semua elemen
  ['S', 'O', 'A', 'P'].forEach(f => {
    const el = getFieldElement(f);
    el.classList.add('highlight-accept');
  });

  runQualityAnalysis();
}

// Aksi Menolak Seluruh Saran Sekaligus
function rejectAllSuggestions() {
  appState.activeSuggestions.forEach(item => {
    appState.ignoredSuggestionKeys.add(item.id);
  });
  runQualityAnalysis();
}

// Mengosongkan Seluruh Saran
function clearAllSuggestions() {
  appState.activeSuggestions.forEach(item => {
    appState.ignoredSuggestionKeys.add(item.id);
  });
  appState.activeSuggestions = [];
  renderSuggestionsList();
  updateInsuranceScore();
}

// Skor Kesiapan Dokumen Klaim Asuransi
function updateInsuranceScore() {
  const pendingCount = appState.activeSuggestions.length;
  let score = 100;

  if (pendingCount === 1) score = 75;
  else if (pendingCount === 2) score = 50;
  else if (pendingCount >= 3) score = 30;

  // Cek jika form masih kosong
  const totalLength = dom.soapSubjective.value.length + dom.soapObjective.value.length + dom.soapAssessment.value.length + dom.soapPlan.value.length;
  if (totalLength === 0) {
    score = 0;
  }

  dom.scoreText.textContent = `${score}%`;
  dom.scoreBar.style.width = `${score}%`;

  if (score === 100) {
    dom.scoreBar.className = 'bg-teal-600 h-2 rounded-full transition-all duration-300';
    dom.scoreHint.textContent = 'Lengkap & Memenuhi Standar: Dokumen siap dijadikan lampiran klaim asuransi.';
  } else if (score >= 60) {
    dom.scoreBar.className = 'bg-amber-500 h-2 rounded-full transition-all duration-300';
    dom.scoreHint.textContent = 'Perhatian: Terdapat singkatan atau tanda vital yang perlu diklarifikasi.';
  } else {
    dom.scoreBar.className = 'bg-rose-500 h-2 rounded-full transition-all duration-300';
    dom.scoreHint.textContent = 'Beresiko Ditolak Coder: Banyak informasi kunci yang belum lengkap.';
  }
}

// Helper DOM
function getFieldElement(fieldKey) {
  switch (fieldKey) {
    case 'S': return dom.soapSubjective;
    case 'O': return dom.soapObjective;
    case 'A': return dom.soapAssessment;
    case 'P': return dom.soapPlan;
    default: return null;
  }
}

function getBadgeElement(fieldKey) {
  switch (fieldKey) {
    case 'S': return dom.badgeS;
    case 'O': return dom.badgeO;
    case 'A': return dom.badgeA;
    case 'P': return dom.badgeP;
    default: return null;
  }
}

// Menampilkan Ringkasan Modal Submit Final
function showSubmitModal() {
  dom.finalSummaryContent.innerHTML = `
    <div><strong>S:</strong> ${escapeHtml(dom.soapSubjective.value || '-')}</div>
    <div><strong>O:</strong> ${escapeHtml(dom.soapObjective.value || '-')}</div>
    <div><strong>A:</strong> ${escapeHtml(dom.soapAssessment.value || '-')}</div>
    <div><strong>P:</strong> ${escapeHtml(dom.soapPlan.value || '-')}</div>
    <div class="pt-2 text-slate-500 text-[10px]">Indeks Kesiapan Klaim: ${dom.scoreText.textContent}</div>
  `;
  dom.finalSubmitModal.classList.remove('hidden');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

// Mulai Aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', initApp);
