// api.js — sets window.API_BASE and provides a small fetch wrapper
(function () {
  const DEFAULT = (location.hostname === 'localhost') ? 'http://localhost:8000/api' : '/api';
  window.API_BASE = window.API_BASE || DEFAULT;

  window.API = {
    async request(path, opts = {}) {
      const controller = new AbortController();
      const timeout = opts.timeout || 12000;
      const headers = Object.assign({}, opts.headers || {});
      if (!opts.skipJson && !opts.body) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(`${window.API_BASE}${path}`, { ...opts, headers, signal: controller.signal, credentials: 'include' });
        clearTimeout(id);
        return res;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    },
    get(path, opts){ return this.request(path, { method:'GET', ...opts }); },
    post(path, body, opts = {}) {
      return this.request(path, { method: 'POST', body: (body instanceof FormData) ? body : JSON.stringify(body), skipJson: body instanceof FormData, ...opts });
    }
  };
})();
