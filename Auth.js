// auth.js — tiny token helpers
window.auth = {
  getToken() { return localStorage.getItem('token'); },
  setToken(t){ localStorage.setItem('token', t); },
  clear() { localStorage.removeItem('token'); },
  logout() { this.clear(); location.href = './login.html'; }
};
