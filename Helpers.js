// utils/helpers.js
window.helpers = (function(){
  function formatTimeISO(iso) {
    try { return new Date(iso).toLocaleString(); } catch(e) { return iso; }
  }
  return { formatTimeISO };
})();
