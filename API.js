// frontend/src/services/api.js
(function(){
  // Change this depending on your backend dev host
  const API_BASE = (window.location.hostname === 'localhost') ? 'http://localhost:8000/api' : '/api';
  window.API_BASE = API_BASE;

  // Minimal fetch helper (returns response)
  window.API = {
    async request(path, opts = {}) {
      const url = `${API_BASE}${path}`;
      const headers = opts.headers || {};
      if (!opts.skipJson) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const controller = new AbortController();
      const timeout = opts.timeout || 12000;
      const id = setTimeout(()=>controller.abort(), timeout);
      try {
        const res = await fetch(url, { signal: controller.signal, ...opts, headers });
        clearTimeout(id);
        return res;
      } catch(err) {
        clearTimeout(id);
        throw err;
      }
    },
    get(path, opts={}){ return this.request(path, { method:'GET', ...opts }); },
    post(path, body, opts={}){ return this.request(path, { method:'POST', body: JSON.stringify(body), ...opts }); },
    postForm(path, form, opts={}){ return this.request(path, { method:'POST', body: form, headers: opts.headers || {}, skipJson: true, ...opts }); },
  };
})();
