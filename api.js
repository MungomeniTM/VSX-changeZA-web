// frontend/public/api.js
// Cosmic reliable API wrapper — used by dashboard.js, profile.js, auth.js
(function () {
  const API_BASE = window.API_BASE || ""; // e.g. "" when frontend served same origin; else set to "http://localhost:8000"
  const PREFIX = "/api";

  async function request(path, opts = {}) {
    const url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;

    const headers = new Headers(opts.headers || {});
    // JSON default except when sending FormData (no content-type)
    if (!(opts.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // auth
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const fetchOpts = {
      method: opts.method || "GET",
      headers,
      body: opts.body,
      credentials: opts.credentials || "same-origin",
    };

    try {
      const res = await fetch(`${API_BASE}${PREFIX}${url}`, fetchOpts);
      // keep raw response for caller to inspect
      return res;
    } catch (err) {
      console.error("API.request network error", err, path, opts);
      throw err;
    }
  }

  // helper to return parsed json (throws if non-ok)
  async function json(path, opts = {}) {
    const res = await request(path, opts);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  window.API = { request, json, API_BASE, PREFIX };
})();