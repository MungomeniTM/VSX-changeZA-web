// services/auth.js
// Put at frontend/src/services/auth.js

window.auth = (function(){
  return {
    getToken() { return localStorage.getItem('token'); },
    setToken(t){ localStorage.setItem('token', t); },
    clear(){ localStorage.removeItem('token'); },
    logout(){ localStorage.removeItem('token'); window.location.href = '/public/login.html'; }
  };
})();
