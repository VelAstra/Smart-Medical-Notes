/**
 * Smart Medical Notes - Interactive Prototype Engine
 * Implementasi Antarmuka Reaktif 2-Panel Merujuk Slide 53 Disertasi Kyoto University & Proyek KS RPLD UGM.
 * Bebas Emoji Mentah (Zero Raw Emojis Mandate).
 */

// Konstanta Konfigurasi API
const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  EXTRACT_ENDPOINT: '/api/v1/extract-soap',
  VALIDATE_ENDPOINT: '/api/v1/validate-coder',
  TIMEOUT_MS: 1500
};

// Catatan Sampel Standar (Merujuk Slide 53 Disertasi Kyoto University / Gambar 5 Paten)
const SAMPLE_CLINICAL_NOTE = {
  narrative: 'Patient 3 years old has fever, red spots on the skin. Examination shows petechia on skin, strong pulse 120. Diagnosis df. Plan intravenous fluid ringer lactate.',
  soap: {
    S: 'patient 3 years old has fever, red spots on the skin',
    O: 'petechia on skin, strong pulse 120',
    A: 'df',
    P: 'intravenous fluid ringer lactate'
  }
};

// Kamus Singkatan Medis Lengkap (ICD-10 Aligned - 22 Penyakit/Singkatan)
const LOCAL_ABBREVIATIONS = [
  { pattern: /\bdf\b/i, code: 'df', expansion: 'dengue fever', title: 'Change df to dengue fever' },
  { pattern: /\bdhf\b/i, code: 'dhf', expansion: 'Dengue Haemorrhagic Fever (Demam Berdarah Dengue)', title: 'Change dhf to Dengue Haemorrhagic Fever (Demam Berdarah Dengue)' },
  { pattern: /\bdss\b/i, code: 'dss', expansion: 'Dengue Shock Syndrome', title: 'Change dss to Dengue Shock Syndrome' },
  { pattern: /\bgea\b/i, code: 'gea', expansion: 'gastroenteritis akut', title: 'Change gea to gastroenteritis akut' },
  { pattern: /\bispa\b/i, code: 'ispa', expansion: 'Infeksi Saluran Pernapasan Akut (ISPA)', title: 'Perjelas singkatan ispa menjadi Infeksi Saluran Pernapasan Akut (ISPA)' },
  { pattern: /\bht\b/i, code: 'ht', expansion: 'hipertensi', title: 'Change ht to hipertensi' },
  { pattern: /\bdm\b/i, code: 'dm', expansion: 'diabetes mellitus', title: 'Change dm to diabetes mellitus' },
  { pattern: /\btbc?\b/i, code: 'tbc', expansion: 'tuberculosis', title: 'Change tbc to tuberculosis' },
  { pattern: /\bcva\b/i, code: 'cva', expansion: 'Cerebrovascular Accident (Stroke)', title: 'Change cva to Cerebrovascular Accident (Stroke)' },
  { pattern: /\boa\b/i, code: 'oa', expansion: 'Osteoartritis', title: 'Change oa to Osteoartritis' },
  { pattern: /\bapp\b/i, code: 'app', expansion: 'Apendisitis Akut', title: 'Change app to Apendisitis Akut' },
  { pattern: /\bchf\b/i, code: 'chf', expansion: 'Congestive Heart Failure (Gagal Jantung Kongestif)', title: 'Change chf to Congestive Heart Failure (Gagal Jantung Kongestif)' },
  { pattern: /\bpjk\b/i, code: 'pjk', expansion: 'Penyakit Jantung Koroner (Ischaemic Heart Disease)', title: 'Change pjk to Penyakit Jantung Koroner (Ischaemic Heart Disease)' },
  { pattern: /\bppok\b/i, code: 'ppok', expansion: 'Penyakit Paru Obstruktif Kronis', title: 'Change ppok to Penyakit Paru Obstruktif Kronis' },
  { pattern: /\bisk\b/i, code: 'isk', expansion: 'Infeksi Saluran Kemih', title: 'Change isk to Infeksi Saluran Kemih' },
  { pattern: /\bckd\b/i, code: 'ckd', expansion: 'Chronic Kidney Disease (Penyakit Ginjal Kronis)', title: 'Change ckd to Chronic Kidney Disease (Penyakit Ginjal Kronis)' },
  { pattern: /\bgerd\b/i, code: 'gerd', expansion: 'Gastro-Esophageal Reflux Disease', title: 'Change gerd to Gastro-Esophageal Reflux Disease' },
  { pattern: /\bbph\b/i, code: 'bph', expansion: 'Benign Prostatic Hyperplasia', title: 'Change bph to Benign Prostatic Hyperplasia' },
  { pattern: /\bhnp\b/i, code: 'hnp', expansion: 'Hernia Nukleus Pulposus', title: 'Change hnp to Hernia Nukleus Pulposus' },
  { pattern: /\bsle\b/i, code: 'sle', expansion: 'Systemic Lupus Erythematosus', title: 'Change sle to Systemic Lupus Erythematosus' },
  { pattern: /\bfa\b/i, code: 'fa', expansion: 'Fibrilasi Atrium (Atrial Fibrillation)', title: 'Change fa to Fibrilasi Atrium (Atrial Fibrillation)' },
  { pattern: /\bcf\b/i, code: 'cf', expansion: 'Common Cold (Acute Nasopharyngitis)', title: 'Change cf to Common Cold (Acute Nasopharyngitis)' }
];

// State Aplikasi
const state = {
  currentSoap: { S: '', O: '', A: '', P: '' },
  activeSuggestions: [],
  ignoredIds: new Set(),
  debounceTimer: null,
  isBackendAvailable: false
};

// Elemen DOM
const dom = {
  btnLoadSample: document.getElementById('btnLoadSample'),
  btnClearForm: document.getElementById('btnClearForm'),
  toggleExtractorBtn: document.getElementById('toggleExtractorBtn'),
  extractorToggleText: document.getElementById('extractorToggleText'),
  narrativeSection: document.getElementById('narrativeSection'),
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
  btnSubmitFinal: document.getElementById('btnSubmitFinal'),
  suggestionsContainer: document.getElementById('suggestionsContainer'),
  btnClearAll: document.getElementById('btnClearAll'),
  btnRejectAll: document.getElementById('btnRejectAll'),
  btnAcceptAll: document.getElementById('btnAcceptAll'),
  scoreText: document.getElementById('scoreText'),
  scoreBar: document.getElementById('scoreBar'),
  scoreHint: document.getElementById('scoreHint'),
  finalSubmitModal: document.getElementById('finalSubmitModal'),
  finalSummaryContent: document.getElementById('finalSummaryContent'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnConfirmSend: document.getElementById('btnConfirmSend')
};

// Inisialisasi
function initApp() {
  bindEvents();
  loadSampleCase();
  checkBackendHealth();
}

// Cek Ketersediaan Backend API
async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${API_CONFIG.BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    state.isBackendAvailable = res.ok;
  } catch (err) {
    state.isBackendAvailable = false;
  }
}

// Event Listeners
function bindEvents() {
  if (dom.btnLoadSample) {
    dom.btnLoadSample.addEventListener('click', loadSampleCase);
  }
  if (dom.btnClearForm) {
    dom.btnClearForm.addEventListener('click', clearForm);
  }

  // Toggle Narasi Bebas
  dom.toggleExtractorBtn.addEventListener('click', () => {
    const isHidden = dom.narrativeSection.classList.contains('hidden');
    if (isHidden) {
      dom.narrativeSection.classList.remove('hidden');
      dom.extractorToggleText.textContent = 'Tutup Input Narasi Bebas';
    } else {
      dom.narrativeSection.classList.add('hidden');
      dom.extractorToggleText.textContent = 'Buka Input Narasi Bebas';
    }
  });

  // Ekstraksi Narasi Bebas
  dom.btnRunExtraction.addEventListener('click', () => {
    const text = dom.rawNarrativeInput.value.trim();
    if (!text) return;
    handleNarrativeExtraction(text);
  });

  // Pemantauan Input Real-Time pada Textarea
  const inputs = [
    { el: dom.soapSubjective, key: 'S', badge: dom.badgeS },
    { el: dom.soapObjective, key: 'O', badge: dom.badgeO },
    { el: dom.soapAssessment, key: 'A', badge: dom.badgeA },
    { el: dom.soapPlan, key: 'P', badge: dom.badgeP }
  ];

  inputs.forEach(item => {
    item.el.addEventListener('input', () => {
      state.currentSoap[item.key] = item.el.value;
      updateCharCount(item.el, item.badge);
      scheduleValidation();
    });
  });

  // Kontrol Aksi Massal Sesuai Slide 53
  dom.btnClearAll.addEventListener('click', handleClearAll);
  dom.btnRejectAll.addEventListener('click', handleRejectAll);
  dom.btnAcceptAll.addEventListener('click', handleAcceptAll);

  // Submit Modal
  dom.btnSubmitFinal.addEventListener('click', showSubmitModal);
  dom.btnCloseModal.addEventListener('click', () => dom.finalSubmitModal.classList.add('hidden'));
  dom.btnConfirmSend.addEventListener('click', () => {
    alert('Catatan SOAP berstandar koder asuransi berhasil disimpan ke basis data RME.');
    dom.finalSubmitModal.classList.add('hidden');
  });
}

// Muat Contoh Kasus Standar (Gambar 5 Paten / Slide 53)
function loadSampleCase() {
  state.ignoredIds.clear();
  state.currentSoap = { ...SAMPLE_CLINICAL_NOTE.soap };

  dom.soapSubjective.value = SAMPLE_CLINICAL_NOTE.soap.S;
  dom.soapObjective.value = SAMPLE_CLINICAL_NOTE.soap.O;
  dom.soapAssessment.value = SAMPLE_CLINICAL_NOTE.soap.A;
  dom.soapPlan.value = SAMPLE_CLINICAL_NOTE.soap.P;
  dom.rawNarrativeInput.value = SAMPLE_CLINICAL_NOTE.narrative;

  updateCharCount(dom.soapSubjective, dom.badgeS);
  updateCharCount(dom.soapObjective, dom.badgeO);
  updateCharCount(dom.soapAssessment, dom.badgeA);
  updateCharCount(dom.soapPlan, dom.badgeP);

  evaluateSoapRules();
}

// Kosongkan Form Editor untuk Kasus Bebas / Kasus Klinis Baru
function clearForm() {
  state.ignoredIds.clear();
  state.currentSoap = { S: '', O: '', A: '', P: '' };

  dom.soapSubjective.value = '';
  dom.soapObjective.value = '';
  dom.soapAssessment.value = '';
  dom.soapPlan.value = '';
  dom.rawNarrativeInput.value = '';

  updateCharCount(dom.soapSubjective, dom.badgeS);
  updateCharCount(dom.soapObjective, dom.badgeO);
  updateCharCount(dom.soapAssessment, dom.badgeA);
  updateCharCount(dom.soapPlan, dom.badgeP);

  evaluateSoapRules();
}

function updateCharCount(el, badge) {
  badge.textContent = `${el.value.length} karakter`;
}

function scheduleValidation() {
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    evaluateSoapRules();
  }, 250);
}

// Ekstraksi Narasi Bebas (API atau Fallback Heuristik)
async function handleNarrativeExtraction(narrative) {
  if (state.isBackendAvailable) {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.EXTRACT_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative })
      });
      if (res.ok) {
        const payload = await res.json();
        const data = payload.data || payload;
        applyExtractedSoap(data.S || data.subjective || '', data.O || data.objective || '', data.A || data.assessment || '', data.P || data.plan || '');
        return;
      }
    } catch (e) {
      // fallback
    }
  }

  // Fallback Heuristik Lokal
  let s = '', o = '', a = '', p = '';
  const sentences = narrative.split(/(?<=[.?!])\s+/);
  sentences.forEach(sent => {
    const lower = sent.toLowerCase();
    if (/terapi|infus|obat|paracetamol|amlodipine|dosis|plan|tatalaksana/i.test(lower)) {
      p += (p ? ' ' : '') + sent;
    } else if (/diagnosis|dx|suspek|df|ht|ispa|dm|kesimpulan/i.test(lower)) {
      a += (a ? ' ' : '') + sent;
    } else if (/pemeriksaan|pemfis|nadi|suhu|td|tensi|petekia|faring/i.test(lower)) {
      o += (o ? ' ' : '') + sent;
    } else {
      s += (s ? ' ' : '') + sent;
    }
  });

  applyExtractedSoap(s.trim(), o.trim(), a.trim(), p.trim());
}

function applyExtractedSoap(s, o, a, p) {
  dom.soapSubjective.value = s;
  dom.soapObjective.value = o;
  dom.soapAssessment.value = a;
  dom.soapPlan.value = p;

  state.currentSoap = { S: s, O: o, A: a, P: p };
  updateCharCount(dom.soapSubjective, dom.badgeS);
  updateCharCount(dom.soapObjective, dom.badgeO);
  updateCharCount(dom.soapAssessment, dom.badgeA);
  updateCharCount(dom.soapPlan, dom.badgeP);

  evaluateSoapRules();
}

// Evaluasi Aturan Koder (Backend API atau Engine Deterministik Lokal)
async function evaluateSoapRules() {
  const currentSoap = {
    S: dom.soapSubjective.value.trim(),
    O: dom.soapObjective.value.trim(),
    A: dom.soapAssessment.value.trim(),
    P: dom.soapPlan.value.trim()
  };

  if (state.isBackendAvailable) {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.VALIDATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSoap)
      });
      if (res.ok) {
        const payload = await res.json();
        processValidationResults(payload.suggestions || [], payload.claim_readiness_score ?? payload.insurance_readiness_score);
        return;
      }
    } catch (e) {
      // fallback to local evaluation
    }
  }

  // Engine Lokal Deterministik
  const suggestions = runLocalRuleEngine(currentSoap);
  processValidationResults(suggestions, calculateLocalScore(currentSoap, suggestions));
}

// Engine Aturan Lokal Deterministik (With Defensive Negation Guard)
function runLocalRuleEngine(soap) {
  const sText = soap.S;
  const oText = soap.O;
  const aText = soap.A;
  const pText = soap.P;

  if (!sText && !oText && !aText && !pText) {
    return [];
  }

  const list = [];

  // Aturan 1: Suhu Tubuh saat Demam (dengan penjaga negasi)
  const feverRegex = /\b(demam|panas|fever|meriang)\b/i;
  const isNegatedFever = /\b(tidak|menyangkal|bebas|tanpa|no|denies)\s+(ada\s+)?(riwayat\s+)?(demam|panas|fever)\b/i.test(sText) ||
                         /\bdemam\s*(\(-\)|negatif|disangkal)\b/i.test(sText) ||
                         /\bafebris\b/i.test(oText);

  const hasFever = (feverRegex.test(sText) || /fever/i.test(oText)) && !isNegatedFever;
  const hasTemp = /(?:suhu|temp|temperature|t:)?\s*(?:3[5-9]|4[0-2])(?:[.,]\d+)?\s*(?:°?c|celcius)?\b/i.test(oText);

  if (hasFever && !hasTemp) {
    list.push({
      id: 'rule_temp_fever',
      title: 'Add temperature data',
      field: 'O',
      action_type: 'append',
      replacement_payload: 'temperature: 38.8 C',
      description: 'Keluhan demam tertera pada Subjective, tetapi nilai kuantitatif suhu tubuh belum tercantum di Objective.'
    });
  }

  // Aturan 2: Tekanan Darah saat Hipertensi (dengan penjaga negasi)
  const bpRisk = /\b(hipertensi|ht|tengkuk\s+berat|tengkuk\s+kaku)\b/i;
  const isNegatedBp = /\b(tidak|menyangkal)\s+(ada\s+)?(riwayat\s+)?(hipertensi|ht)\b/i.test(sText);
  const hasBpCondition = (bpRisk.test(sText) || /\bht\b/i.test(aText)) && !isNegatedBp;
  const hasBpNumeric = /(?:td|bp|tensi)?\s*\d{2,3}\s*\/\s*\d{2,3}/i.test(oText);

  if (hasBpCondition && !hasBpNumeric) {
    list.push({
      id: 'rule_bp_hypertension',
      title: 'Tambahkan nilai Tekanan Darah (TD)',
      field: 'O',
      action_type: 'append',
      replacement_payload: 'TD: 150/95 mmHg',
      description: 'Koder memerlukan bukti angka tensi darah (mmHg) pada Objective.'
    });
  }

  // Aturan 3: Disambiguasi Singkatan Medis Ambigu
  LOCAL_ABBREVIATIONS.forEach(abbr => {
    if (abbr.pattern.test(aText)) {
      list.push({
        id: `rule_abbr_${abbr.code}`,
        title: abbr.title,
        field: 'A',
        action_type: 'replace',
        search_target: abbr.code,
        replacement_payload: abbr.expansion,
        description: `Standarisasi singkatan ${abbr.code} ke ${abbr.expansion}.`
      });
    }
  });

  return list;
}

function calculateLocalScore(soap, suggestions) {
  if (!soap.S && !soap.O && !soap.A && !soap.P) return 0;
  const count = suggestions.filter(s => !state.ignoredIds.has(s.id)).length;
  if (count === 0) return 100;
  if (count === 1) return 75;
  if (count === 2) return 50;
  if (count === 3) return 30;
  return Math.max(10, 100 - count * 25);
}

// Memproses dan Merender Hasil Validasi
function processValidationResults(rawSuggestions, score) {
  // Filter yang diabaikan
  state.activeSuggestions = rawSuggestions.filter(s => !state.ignoredIds.has(s.id));

  // Render baris daftar saran persis dengan visual Slide 53
  renderSuggestionsTable(state.activeSuggestions);

  // Perbarui Skor Kesiapan Klaim
  updateClaimScore(score);
}

// Render Tabel Saran dengan Radio Button Sesuai Bentuk UI.png
function renderSuggestionsTable(suggestions) {
  const container = dom.suggestionsContainer;

  if (suggestions.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-500">
        <p class="font-bold text-xs text-slate-800">[O] Seluruh Rekomendasi Selesai</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Catatan rekam medis telah memenuhi kriteria kelengkapan koder.</p>
      </div>
    `;
    return;
  }

  let html = '<div class="space-y-2.5 font-sans">';

  suggestions.forEach((item, idx) => {
    const num = idx + 1;
    html += `
      <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-b-0 gap-2">
        <div class="flex-1 pr-2">
          <span class="font-bold text-slate-900">${num}. ${escapeHtml(item.title)}</span>
        </div>
        <div class="flex items-center space-x-6 pr-2">
          <!-- Radio Reject -->
          <label class="w-12 flex justify-center cursor-pointer">
            <input type="radio" name="action_radio_${item.id}" value="reject" data-id="${item.id}" class="w-4 h-4 text-slate-600 focus:ring-0 cursor-pointer">
          </label>
          <!-- Radio Accept -->
          <label class="w-12 flex justify-center cursor-pointer">
            <input type="radio" name="action_radio_${item.id}" value="accept" data-id="${item.id}" class="w-4 h-4 text-blue-700 focus:ring-0 cursor-pointer">
          </label>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;

  // Pasang event listener pada radio button
  container.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      const action = e.target.value;
      if (action === 'accept') {
        applySingleSuggestion(id);
      } else if (action === 'reject') {
        rejectSingleSuggestion(id);
      }
    });
  });
}

// Aksi Menerima 1 Saran
function applySingleSuggestion(id) {
  const item = state.activeSuggestions.find(s => s.id === id);
  if (!item) return;

  const targetEl = getFieldElement(item.field || item.target_field);
  if (!targetEl) return;

  if (item.action_type === 'replace') {
    const wordPattern = new RegExp(`\\b${item.search_target || 'df'}\\b`, 'i');
    targetEl.value = targetEl.value.replace(wordPattern, item.replacement_payload);
  } else if (item.action_type === 'append') {
    if (targetEl.value.trim().length > 0) {
      targetEl.value = `${targetEl.value.trim()}, ${item.replacement_payload}`;
    } else {
      targetEl.value = item.replacement_payload;
    }
  }

  // Animasi Highlight
  targetEl.classList.remove('highlight-accept');
  void targetEl.offsetWidth;
  targetEl.classList.add('highlight-accept');

  // Sinkronkan state
  state.currentSoap[item.field || item.target_field] = targetEl.value;
  updateCharCount(targetEl, getBadgeElement(item.field || item.target_field));

  evaluateSoapRules();
}

// Aksi Menolak 1 Saran
function rejectSingleSuggestion(id) {
  state.ignoredIds.add(id);
  evaluateSoapRules();
}

// Aksi Massal: Accept all
function handleAcceptAll() {
  const pending = [...state.activeSuggestions];
  pending.forEach(item => {
    const targetEl = getFieldElement(item.field || item.target_field);
    if (!targetEl) return;

    if (item.action_type === 'replace') {
      const wordPattern = new RegExp(`\\b${item.search_target || 'df'}\\b`, 'i');
      targetEl.value = targetEl.value.replace(wordPattern, item.replacement_payload);
    } else if (item.action_type === 'append') {
      if (targetEl.value.trim().length > 0) {
        targetEl.value = `${targetEl.value.trim()}, ${item.replacement_payload}`;
      } else {
        targetEl.value = item.replacement_payload;
      }
    }

    targetEl.classList.add('highlight-accept');
    state.currentSoap[item.field || item.target_field] = targetEl.value;
    updateCharCount(targetEl, getBadgeElement(item.field || item.target_field));
  });

  evaluateSoapRules();
}

// Aksi Massal: Reject all
function handleRejectAll() {
  state.activeSuggestions.forEach(item => {
    state.ignoredIds.add(item.id);
  });
  evaluateSoapRules();
}

// Aksi Massal: Clear all
function handleClearAll() {
  state.activeSuggestions.forEach(item => {
    state.ignoredIds.add(item.id);
  });
  state.activeSuggestions = [];
  renderSuggestionsTable([]);
  updateClaimScore(100);
}

// Perbarui Tampilan Skor
function updateClaimScore(score) {
  const finalScore = Math.round(score);
  dom.scoreText.textContent = `${finalScore}%`;
  dom.scoreBar.style.width = `${finalScore}%`;

  if (finalScore === 100) {
    dom.scoreBar.className = 'bg-emerald-600 h-2.5 rounded-full transition-all duration-300';
    dom.scoreHint.textContent = 'Lengkap & Memenuhi Standar: Dokumen siap diklaim ke asuransi kesehatan.';
  } else if (finalScore >= 60) {
    dom.scoreBar.className = 'bg-amber-500 h-2.5 rounded-full transition-all duration-300';
    dom.scoreHint.textContent = 'Perhatian: Terdapat singkatan klinis atau tanda vital yang perlu disesuaikan.';
  } else {
    dom.scoreBar.className = 'bg-rose-600 h-2.5 rounded-full transition-all duration-300';
    dom.scoreHint.textContent = 'Beresiko Ditolak Coder: Data klinis belum memenuhi justifikasi penjaminan.';
  }
}

// Helper DOM
function getFieldElement(f) {
  switch (f) {
    case 'S': return dom.soapSubjective;
    case 'O': return dom.soapObjective;
    case 'A': return dom.soapAssessment;
    case 'P': return dom.soapPlan;
    default: return null;
  }
}

function getBadgeElement(f) {
  switch (f) {
    case 'S': return dom.badgeS;
    case 'O': return dom.badgeO;
    case 'A': return dom.badgeA;
    case 'P': return dom.badgeP;
    default: return null;
  }
}

function showSubmitModal() {
  dom.finalSummaryContent.innerHTML = `
    <div><strong>S:</strong> ${escapeHtml(dom.soapSubjective.value || '-')}</div>
    <div><strong>O:</strong> ${escapeHtml(dom.soapObjective.value || '-')}</div>
    <div><strong>A:</strong> ${escapeHtml(dom.soapAssessment.value || '-')}</div>
    <div><strong>P:</strong> ${escapeHtml(dom.soapPlan.value || '-')}</div>
    <div class="pt-2 text-slate-500 text-[10px] border-t border-slate-200 mt-2">
      Indeks Kesiapan Klaim: <strong>${dom.scoreText.textContent}</strong>
    </div>
  `;
  dom.finalSubmitModal.classList.remove('hidden');
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', initApp);
