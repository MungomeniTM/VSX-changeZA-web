// services/api.js
// Put at frontend/src/services/api.js and ensure it's served as /src/services/api.js

(function(){
  // If developing locally with backend on different port, change accordingly
  const API_BASE = (window.location.hostname === 'localhost') ? 'http://localhost:8000/api' : '/api';
  window.API_BASE = API_BASE;
})();
