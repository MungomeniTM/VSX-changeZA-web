/* frontend/src/js/auth.js
   Robust frontend auth logic for register + login.
   - Inline validation + friendly messages
   - Loading state, spinner, disabled button
   - Timeout for network requests
   - Stores token (if provided) and redirects
   - Role includes: farmer, skilled, both, client
*/

const API_BASE = (window.location.hostname === 'localhost') ? 'http://localhost:8000/api' : '/api';
const REQUEST_TIMEOUT = 12000; // 12s

// helper: safe fetch with timeout
async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// helpers for UI
function setButtonLoading(btn, isLoading){
  if(!btn) return;
  if(isLoading){
    btn.classList.add('loading');
    btn.setAttribute('disabled','true');
    btn.setAttribute('aria-busy','true');
  } else {
    btn.classList.remove('loading');
    btn.removeAttribute('disabled');
    btn.setAttribute('aria-busy','false');
  }
}
function showFieldError(id, message){
  const el = document.getElementById(id);
  if(el) el.textContent = message || '';
}
function clearAllErrors(){
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
}

// small validators
function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isStrongPassword(p){ return typeof p === 'string' && p.length >= 8; }

// password toggle wiring (if pw-toggle exists)
function wirePwToggles(){
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    const wrap = btn.closest('.pw-wrap');
    if(!wrap) return;
    const input = wrap.querySelector('input[type="password"], input[type="text"]');
    if(!input) return;
    btn.addEventListener('click', () => {
      const current = input.getAttribute('type');
      const next = current === 'password' ? 'text' : 'password';
      input.setAttribute('type', next);
      btn.setAttribute('aria-pressed', next === 'text' ? 'true' : 'false');
    });
  });
}

// attach events
document.addEventListener('DOMContentLoaded', () => {
  // nice card entrance
  document.querySelectorAll('.auth-card').forEach(c => setTimeout(()=>c.classList.add('is-visible'), 80));

  wirePwToggles();

  // REGISTER
  const registerForm = document.getElementById('register-form');
  if(registerForm){
    registerForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      clearAllErrors();

      const btn = document.getElementById('registerBtn') || registerForm.querySelector('.btn-primary');
      const firstName = (document.getElementById('firstName') || {}).value?.trim() || '';
      const lastName  = (document.getElementById('lastName') || {}).value?.trim() || '';
      const email     = (document.getElementById('email') || {}).value?.trim() || '';
      const password  = (document.getElementById('password') || {}).value || '';
      const role      = (document.getElementById('role') || {}).value || '';

      let hasError = false;
      if(!firstName){ showFieldError('err-firstName', 'First name is required'); hasError = true; }
      if(!lastName){ showFieldError('err-lastName', 'Last name is required'); hasError = true; }
      if(!email){ showFieldError('err-email', 'Email is required'); hasError = true; }
      else if(!isValidEmail(email)){ showFieldError('err-email', 'Invalid email'); hasError = true; }
      if(!isStrongPassword(password)){ showFieldError('err-password', 'Password must be 8+ characters'); hasError = true; }
      if(!role){ showFieldError('err-role', 'Please select a role'); hasError = true; }

      if(hasError) {
        // focus first error field
        const firstErr = document.querySelector('.field-error:not(:empty)');
        if(firstErr){
          const fld = firstErr.previousElementSibling;
          if(fld && fld.focus) fld.focus();
        }
        return;
      }

      setButtonLoading(btn, true);

      try {
        const payload = { firstName, lastName, email, password, role };
        const res = await fetchWithTimeout(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // try parse JSON safely
        const json = await (async () => {
          try { return await res.json(); } catch { return {}; }
        })();

        if(res.ok){
          // store token if supplied
          if(json.token || json.access_token) {
            const t = json.token || json.access_token;
            try { localStorage.setItem('token', t); } catch(e){ console.warn('token storage failed', e); }
          }
          // redirect to dashboard or onboarding
          const redirect = json.redirect || '/dashboard.html';
          window.location.href = redirect;
        } else {
          // show server-side validation messages smartly
          const msg = json.message || json.detail || json.error || 'Registration failed';
          // if server returns field specific errors object, display them
          if(json.errors && typeof json.errors === 'object'){
            Object.keys(json.errors).forEach(k => {
              showFieldError(`err-${k}`, (json.errors[k] && json.errors[k].join) ? json.errors[k].join(', ') : String(json.errors[k]));
            });
          } else {
            // generic error -> show under email or top-level
            showFieldError('err-email', msg);
          }
        }
      } catch (err) {
        console.error('register error', err);
        showFieldError('err-email', 'Network error — please try again');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // LOGIN
  const loginForm = document.getElementById('login-form');
  if(loginForm){
    loginForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      clearAllErrors();

      const btn = document.getElementById('loginBtn') || loginForm.querySelector('.btn-primary');
      const email = (document.getElementById('loginEmail') || document.getElementById('login-email') || {}).value?.trim() || '';
      const password = (document.getElementById('loginPassword') || document.getElementById('login-password') || {}).value || '';

      if(!email){ showFieldError('err-loginEmail', 'Email is required'); return; }
      if(!isValidEmail(email)){ showFieldError('err-loginEmail', 'Invalid email'); return; }
      if(!password){ showFieldError('err-loginPassword', 'Password is required'); return; }

      setButtonLoading(btn, true);

      try {
        const payload = { email, password };
        const res = await fetchWithTimeout(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const json = await (async () => {
          try { return await res.json(); } catch { return {}; }
        })();

        if(res.ok){
          if(json.token || json.access_token){ try { localStorage.setItem('token', json.token || json.access_token); } catch(e){ console.warn('token storage failed', e); } }
          window.location.href = json.redirect || '/dashboard.html';
        } else {
          const msg = json.message || json.detail || json.error || 'Login failed';
          showFieldError('err-loginEmail', msg);
        }
      } catch (err) {
        console.error('login error', err);
        showFieldError('err-loginEmail', 'Network error — please try again.');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

}); // DOMContentLoaded end
