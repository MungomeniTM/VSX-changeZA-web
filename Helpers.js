// helpers.js — small utilities
window.helpers = {
  escape(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  formatPct(n){ return (typeof n === 'number') ? `${Math.round(n)}%` : '—'; }
};
