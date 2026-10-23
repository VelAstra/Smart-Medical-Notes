/**
 * Manajemen State Terpusat (Reactive Store)
 * Mengelola data rekam medis, status loading, error, dan antrean saran perbaikan
 */

import { fetchSoapSuggestions, parseSoapNarrative } from './api.js';
import { debounce } from './utils.js';
import { CONFIG } from './config.js';

class StateStore {
  constructor() {
    this.state = {
      soap: { S: '', O: '', A: '', P: '' },
      rawNarrative: '',
      suggestions: [],
      ignoredSuggestionIds: new Set(),
      insuranceScore: 100,
      isLoadingSuggestions: false,
      isExtractingNarrative: false,
      backendStatus: 'checking', // 'online' | 'offline_fallback' | 'error'
      statusMessage: '',
      lastError: null
    };

    this.subscribers = [];

    // Pasang debounce pada pemanggilan API validasi
    this.debouncedValidate = debounce(() => {
      this.executeValidation();
    }, CONFIG.DEBOUNCE_DELAY_MS);
  }

  // Mendaftarkan fungsi listener saat state berubah
  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.state); // Panggil segera saat registrasi
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notifikasi seluruh subscriber
  notify() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Pembaruan teks salah satu kolom SOAP
  setField(field, value) {
    this.state.soap[field] = value;
    this.notify();
    this.debouncedValidate();
  }

  // Pengisian seluruh 4 kolom SOAP sekaligus
  setSoap(soapData) {
    this.state.soap = {
      S: soapData.S || '',
      O: soapData.O || '',
      A: soapData.A || '',
      P: soapData.P || ''
    };
    this.state.ignoredSuggestionIds.clear();
    this.notify();
    this.debouncedValidate();
  }

  // Eksekusi pemanggilan API untuk rekomendasi
  async executeValidation() {
    this.state.isLoadingSuggestions = true;
    this.notify();

    try {
      const response = await fetchSoapSuggestions(this.state.soap);
      
      // Saring saran yang sudah ditolak oleh pengguna
      const filteredSuggestions = (response.suggestions || []).filter(
        item => !this.state.ignoredSuggestionIds.has(item.id)
      );

      this.state.suggestions = filteredSuggestions;
      this.state.insuranceScore = response.insuranceScore;
      this.state.backendStatus = response.isFallback ? 'offline_fallback' : 'online';
      this.state.statusMessage = response.fallbackNotice || 'Terkoneksi ke Backend REST API';
      this.state.lastError = null;
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.state.backendStatus = 'error';
      this.state.lastError = err.message;
      this.state.statusMessage = 'Gagal memuat rekomendasi: ' + err.message;
    } finally {
      this.state.isLoadingSuggestions = false;
      this.notify();
    }
  }

  // Eksekusi ekstraksi narasi paragraf dokter
  async executeNarrativeExtraction(text) {
    if (!text || !text.trim()) return;

    this.state.isExtractingNarrative = true;
    this.notify();

    try {
      const response = await parseSoapNarrative(text);
      this.setSoap(response.data);
      this.state.backendStatus = response.isFallback ? 'offline_fallback' : 'online';
      this.state.statusMessage = response.fallbackNotice || 'Ekstraksi Berhasil';
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.state.lastError = err.message;
      alert('Gagal mengekstrak narasi: ' + err.message);
    } finally {
      this.state.isExtractingNarrative = false;
      this.notify();
    }
  }

  // Aksi Menerima Saran (Accept)
  applySuggestion(id) {
    const item = this.state.suggestions.find(s => s.id === id);
    if (!item) return;

    const field = item.field;
    let currentVal = this.state.soap[field] || '';

    if (item.action_type === 'replace') {
      const searchTarget = item.search_target || item.title.match(/Change (\w+)/i)?.[1] || '';
      if (searchTarget) {
        const regex = new RegExp(`\\b${searchTarget}\\b`, 'gi');
        currentVal = currentVal.replace(regex, item.payload);
      } else {
        currentVal = item.payload;
      }
    } else if (item.action_type === 'append') {
      if (currentVal.trim().length > 0) {
        currentVal = `${currentVal.trim()}, ${item.payload}`;
      } else {
        currentVal = item.payload;
      }
    }

    this.state.soap[field] = currentVal;
    // Hapus saran dari antrean
    this.state.suggestions = this.state.suggestions.filter(s => s.id !== id);
    this.notify();

    // Trigger highlight ke field terkait
    const el = document.getElementById(`soap${field === 'S' ? 'Subjective' : field === 'O' ? 'Objective' : field === 'A' ? 'Assessment' : 'Plan'}`);
    if (el) {
      el.classList.remove('highlight-accept');
      void el.offsetWidth;
      el.classList.add('highlight-accept');
    }

    // Refresh validasi
    this.debouncedValidate();
  }

  // Aksi Menolak Saran (Reject)
  rejectSuggestion(id) {
    this.state.ignoredSuggestionIds.add(id);
    this.state.suggestions = this.state.suggestions.filter(s => s.id !== id);
    this.notify();
    this.debouncedValidate();
  }

  // Menerima Seluruh Saran Sekaligus
  applyAllSuggestions() {
    const pending = [...this.state.suggestions];
    pending.forEach(item => {
      this.applySuggestion(item.id);
    });
  }

  // Menolak Seluruh Saran Sekaligus
  rejectAllSuggestions() {
    this.state.suggestions.forEach(item => {
      this.state.ignoredSuggestionIds.add(item.id);
    });
    this.state.suggestions = [];
    this.notify();
    this.debouncedValidate();
  }

  // Mengosongkan Saran
  clearAllSuggestions() {
    this.state.suggestions.forEach(item => {
      this.state.ignoredSuggestionIds.add(item.id);
    });
    this.state.suggestions = [];
    this.notify();
  }
}

export const store = new StateStore();
