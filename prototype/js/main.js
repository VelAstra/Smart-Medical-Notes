/**
 * Application Entry Point (Bootstrap)
 */

import { UIManager } from './ui.js';
import { store } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIManager();
  ui.init();

  // Muat kasus default awal (Slide Disertasi Kasus 1)
  ui.handlePresetChange('slide_case');
});
