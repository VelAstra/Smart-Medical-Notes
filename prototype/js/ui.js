/**
 * Komponen Tampilan (UI Renderer & Event Binding)
 */

import { store } from './state.js';
import { escapeHtml } from './utils.js';

export class UIManager {
  constructor() {
    this.dom = {
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
      liveEditBadge: document.getElementById('liveEditBadge'),
      btnAnalyzeSoap: document.getElementById('btnAnalyzeSoap'),
      btnSubmitFinal: document.getElementById('btnSubmitFinal'),
      suggestionCountBadge: document.getElementById('suggestionCountBadge'),
      btnAcceptAll: document.getElementById('btnAcceptAll'),
      btnRejectAll: document.getElementById('btnRejectAll'),
      btnClearAll: document.getElementById('btnClearAll'),
      suggestionsContainer: document.getElementById('suggestionsContainer'),
      scoreText: document.getElementById('scoreText'),
      scoreBar: document.getElementById('scoreBar'),
      scoreHint: document.getElementById('scoreHint'),
      finalSubmitModal: document.getElementById('finalSubmitModal'),
      finalSummaryContent: document.getElementById('finalSummaryContent'),
      btnCloseModal: document.getElementById('btnCloseModal'),
      btnConfirmSend: document.getElementById('btnConfirmSend')
    };

    // Melacak apakah pengguna sedang aktif mengetik di salah satu textarea agar tidak tertimpa re-render
    this.activeFocusedElement = null;
  }

  init() {
    this.bindEvents();
    // Berlangganan ke State Store
    store.subscribe((state) => this.render(state));
  }

  bindEvents() {
    // 1. Textarea input listeners (S, O, A, P)
    const fields = [
      { el: this.dom.soapSubjective, key: 'S' },
      { el: this.dom.soapObjective, key: 'O' },
      { el: this.dom.soapAssessment, key: 'A' },
      { el: this.dom.soapPlan, key: 'P' }
    ];

    fields.forEach(({ el, key }) => {
      el.addEventListener('focus', () => { this.activeFocusedElement = el; });
      el.addEventListener('blur', () => { this.activeFocusedElement = null; });
      el.addEventListener('input', (e) => {
        store.setField(key, e.target.value);
      });
    });

    // 2. Tombol Ekstraksi Narasi Paragraf Dokter
    this.dom.btnRunExtraction.addEventListener('click', () => {
      const text = this.dom.rawNarrativeInput.value;
      store.executeNarrativeExtraction(text);
    });

    // 3. Tombol Toggle Box Narasi Bebas
    this.dom.toggleExtractorBtn.addEventListener('click', () => {
      const isHidden = this.dom.narrativeBox.classList.contains('hidden');
      if (isHidden) {
        this.dom.narrativeBox.classList.remove('hidden');
        this.dom.extractorToggleText.textContent = 'Tutup Input Narasi Bebas';
      } else {
        this.dom.narrativeBox.classList.add('hidden');
        this.dom.extractorToggleText.textContent = 'Buka Input Narasi Bebas';
      }
    });

    // 4. Tombol Aksi Massal Saran
    this.dom.btnAcceptAll.addEventListener('click', () => store.applyAllSuggestions());
    this.dom.btnRejectAll.addEventListener('click', () => store.rejectAllSuggestions());
    this.dom.btnClearAll.addEventListener('click', () => store.clearAllSuggestions());

    // 5. Tombol Periksa Kualitas Manual
    this.dom.btnAnalyzeSoap.addEventListener('click', () => store.executeValidation());

    // 6. Modal Submit Final
    this.dom.btnSubmitFinal.addEventListener('click', () => this.showFinalModal());
    this.dom.btnCloseModal.addEventListener('click', () => this.dom.finalSubmitModal.classList.add('hidden'));
    this.dom.btnConfirmSend.addEventListener('click', () => {
      alert('Dokumen SOAP tervalidasi berhasil dikirim ke sistem Electronic Health Record (EHR).');
      this.dom.finalSubmitModal.classList.add('hidden');
    });

    // 7. Preset Selector
    this.dom.casePresetSelect.addEventListener('change', (e) => this.handlePresetChange(e.target.value));
    this.dom.btnResetAll.addEventListener('click', () => this.handlePresetChange('slide_case'));
  }

  handlePresetChange(presetKey) {
    const presets = {
      slide_case: {
        narrative: 'Patient 3 years old has fever, red spots on the skin. Examination shows petechia on skin, strong pulse 120. Diagnosis df. Plan intravenous fluid ringer lactate.',
        soap: {
          S: 'patient 3 years old has fever, red spots on the skin',
          O: 'petechia on skin, strong pulse 120',
          A: 'df',
          P: 'intravenous fluid ringer lactate'
        }
      },
      ispa_case: {
        narrative: 'Pasien dewasa mengeluh batuk berdahak, pilek, dan demam 2 hari. Pada pemeriksaan fisik faring hiperemis (+), ronki (-). Diagnosis ispa. Diberikan paracetamol 3x500mg, ambroxol sirup 3x1.',
        soap: {
          S: 'pasien dewasa mengeluh batuk berdahak, pilek, dan demam 2 hari',
          O: 'faring hiperemis (+), ronki (-)',
          A: 'ispa',
          P: 'paracetamol 3x500mg, ambroxol sirup 3x1'
        }
      },
      ht_case: {
        narrative: 'Pasien datang dengan keluhan nyeri kepala bagian belakang dan tengkuk berat. Pemeriksaan nadi 88 x/menit teratur. Diagnosis kerja ht. Diberikan amlodipine 10mg 1x1 tablet oral.',
        soap: {
          S: 'pasien datang dengan keluhan nyeri kepala bagian belakang dan tengkuk berat',
          O: 'nadi 88 x/menit teratur',
          A: 'ht',
          P: 'amlodipine 10mg 1x1 tablet oral'
        }
      },
      empty: {
        narrative: '',
        soap: { S: '', O: '', A: '', P: '' }
      }
    };

    const target = presets[presetKey] || presets.slide_case;
    this.dom.rawNarrativeInput.value = target.narrative;
    store.setSoap(target.soap);
  }

  render(state) {
    // 1. Sinkronkan nilai textarea (hanya jika elemen tidak sedang aktif diketik)
    if (this.activeFocusedElement !== this.dom.soapSubjective) {
      this.dom.soapSubjective.value = state.soap.S || '';
    }
    if (this.activeFocusedElement !== this.dom.soapObjective) {
      this.dom.soapObjective.value = state.soap.O || '';
    }
    if (this.activeFocusedElement !== this.dom.soapAssessment) {
      this.dom.soapAssessment.value = state.soap.A || '';
    }
    if (this.activeFocusedElement !== this.dom.soapPlan) {
      this.dom.soapPlan.value = state.soap.P || '';
    }

    // 2. Pembaruan hitungan karakter
    this.dom.badgeS.textContent = `${(state.soap.S || '').length} karakter`;
    this.dom.badgeO.textContent = `${(state.soap.O || '').length} karakter`;
    this.dom.badgeA.textContent = `${(state.soap.A || '').length} karakter`;
    this.dom.badgeP.textContent = `${(state.soap.P || '').length} karakter`;

    // 3. Render Status Koneksi Backend
    this.renderBackendBadge(state);

    // 4. Render Panel Rekomendasi (Suggestions)
    this.renderSuggestions(state);

    // 5. Render Skor Asuransi
    this.renderScore(state.insuranceScore);
  }

  renderBackendBadge(state) {
    const badge = this.dom.liveEditBadge;
    if (state.backendStatus === 'online') {
      badge.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200';
      badge.textContent = 'REST API Terhubung';
    } else if (state.backendStatus === 'offline_fallback') {
      badge.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200';
      badge.textContent = 'Mode Aturan Mandiri (Offline)';
    } else {
      badge.className = 'text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200';
      badge.textContent = 'Siap Diedit';
    }
  }

  renderSuggestions(state) {
    const container = this.dom.suggestionsContainer;
    const badge = this.dom.suggestionCountBadge;

    if (state.isLoadingSuggestions) {
      badge.textContent = 'Memeriksa...';
      container.innerHTML = `
        <div class="space-y-3 py-4">
          <div class="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
          <div class="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
        </div>
      `;
      return;
    }

    const list = state.suggestions || [];
    badge.textContent = `${list.length} Saran`;

    if (list.length === 0) {
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
    list.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'suggestion-card bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-2.5';
      
      const badgeStyle = item.category?.includes('Vital') 
        ? 'bg-amber-50 text-amber-800 border-amber-200' 
        : 'bg-blue-50 text-blue-800 border-blue-200';

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}">
              ${escapeHtml(item.category || 'Rekomendasi Coder')}
            </span>
            <span class="text-[10px] font-semibold text-slate-400">Target: ${item.field}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-900 mt-1.5">${index + 1}. ${escapeHtml(item.title)}</h4>
          <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">${escapeHtml(item.description)}</p>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <span class="text-[10px] text-slate-500 font-medium">${escapeHtml(item.badge_text || 'Verifikasi Coder')}</span>
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

      card.querySelector('[data-action="accept"]').addEventListener('click', () => {
        store.applySuggestion(item.id);
      });
      card.querySelector('[data-action="reject"]').addEventListener('click', () => {
        store.rejectSuggestion(item.id);
      });

      container.appendChild(card);
    });
  }

  renderScore(score) {
    this.dom.scoreText.textContent = `${score}%`;
    this.dom.scoreBar.style.width = `${score}%`;

    if (score === 100) {
      this.dom.scoreBar.className = 'bg-teal-600 h-2 rounded-full transition-all duration-300';
      this.dom.scoreHint.textContent = 'Lengkap & Memenuhi Standar: Dokumen siap dijadikan lampiran klaim asuransi.';
    } else if (score >= 60) {
      this.dom.scoreBar.className = 'bg-amber-500 h-2 rounded-full transition-all duration-300';
      this.dom.scoreHint.textContent = 'Perhatian: Terdapat singkatan atau tanda vital yang perlu diklarifikasi.';
    } else {
      this.dom.scoreBar.className = 'bg-rose-500 h-2 rounded-full transition-all duration-300';
      this.dom.scoreHint.textContent = 'Beresiko Ditolak Coder: Banyak informasi kunci yang belum lengkap.';
    }
  }

  showFinalModal() {
    const s = store.state.soap;
    this.dom.finalSummaryContent.innerHTML = `
      <div><strong>S:</strong> ${escapeHtml(s.S || '-')}</div>
      <div><strong>O:</strong> ${escapeHtml(s.O || '-')}</div>
      <div><strong>A:</strong> ${escapeHtml(s.A || '-')}</div>
      <div><strong>P:</strong> ${escapeHtml(s.P || '-')}</div>
      <div class="pt-2 text-slate-500 text-[10px]">Indeks Kesiapan: ${this.dom.scoreText.textContent}</div>
    `;
    this.dom.finalSubmitModal.classList.remove('hidden');
  }
}
