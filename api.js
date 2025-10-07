// frontend/public/api.js
(function(){
  const API_BASE = window.API_BASE || ""; // when frontend served from file server, leave blank
  const PREFIX = "/api";

  async function request(path, opts = {}) {
    const urlPath = path.startsWith("/") ? path : "/" + path;
    const full = `${API_BASE}${PREFIX}${urlPath}`;
    const headers = new Headers(opts.headers || {});
    if (!(opts.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(full, { method: opts.method || "GET", headers, body: opts.body });
    return res;
  }

  async function json(path, opts = {}) {
    const res = await request(path, opts);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  window.API = { request, json, API_BASE, PREFIX };
})();