/* frontend/src/js/auth.js
   Final robust client-side auth logic:
   - Register + Login
   - Password confirmation
   - Inline field errors
   - PW visibility toggles
   - Loading spinner + network timeout
   - Token storage (if backend supplies token)
*/

const API_BASE = (window.location.hostname === 'localhost') ? 'http://localhost:8000/api' : '/api';
const TIMEOUT_MS = 12000; // 12s

// safe fetch with timeout
async function fetchTimeout(url, opts = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {...opts, signal: controller.signal});
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// UI helpers
function setBtnLoading(btn, isLoading) {
  if(!btn) return;
  if(isLoading) {
    btn.classList.add('loading');
    btn.setAttribute('disabled', 'true');
    btn.setAttribute('aria-busy', 'true');
  } else {
    btn.classList.remove('loading');
    btn.removeAttribute('disabled');
    btn.setAttribute('aria-busy', 'false');
  }
}
function showErr(id, msg) {
  const el = document.getElementById(id);
  if(el) el.textContent = msg || '';
}
function clearErrs() {
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
}
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isStrongPwd(p){ return typeof p === 'string' && p.length >= 8; }

// wire PW toggles (exists in both pages)
function wirePwToggle(buttonId, inputId) {
  const btn = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if(!btn || !input) return;
  btn.addEventListener('click', () => {
    const current = input.getAttribute('type');
    const next = current === 'password' ? 'text' : 'password';
    input.setAttribute('type', next);
    btn.setAttribute('aria-pressed', next === 'text' ? 'true' : 'false');
  });
}

// When DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // show card
  document.querySelectorAll('.auth-card').forEach(c => setTimeout(()=>c.classList.add('is-visible'), 60));

  // wire password toggles (register + confirm + login)
  wirePwToggle('pwToggle', 'password');
  wirePwToggle('pwToggleConfirm', 'confirmPassword');
  wirePwToggle('pwToggleLogin', 'loginPassword');

  // REGISTER form
  const regForm = document.getElementById('register-form');
  if(regForm) {
    const regBtn = document.getElementById('registerBtn');
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrs();

      const firstName = (document.getElementById('firstName')||{}).value?.trim() || '';
      const lastName  = (document.getElementById('lastName')||{}).value?.trim() || '';
      const email     = (document.getElementById('email')||{}).value?.trim() || '';
      const role      = (document.getElementById('role')||{}).value || '';
      const password  = (document.getElementById('password')||{}).value || '';
      const confirm   = (document.getElementById('confirmPassword')||{}).value || '';

      let invalid = false;
      if(!firstName){ showErr('err-firstName','First name required'); invalid = true; }
      if(!lastName){ showErr('err-lastName','Last name required'); invalid = true; }
      if(!email){ showErr('err-email','Email required'); invalid = true; }
      else if(!isEmail(email)){ showErr('err-email','Invalid email'); invalid = true; }
      if(!role){ showErr('err-role','Please select a role'); invalid = true; }
      if(!isStrongPwd(password)){ showErr('err-password','Password must be at least 8 characters'); invalid = true; }
      if(password !== confirm){ showErr('err-confirmPassword','Passwords do not match'); invalid = true; }

      if(invalid) {
        const firstErr = document.querySelector('.field-error:not(:empty)');
        if(firstErr){
          const fld = firstErr.previousElementSibling;
          if(fld && fld.focus) fld.focus();
        }
        return;
      }

      setBtnLoading(regBtn, true);
      try {
        const payload = { firstName, lastName, email, password, role };
        const res = await fetchTimeout(`${API_BASE}/register`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });

        let json = {};
        try { json = await res.json(); } catch(e){ /* ignore */ }

        if(res.ok) {
          if(json.token || json.access_token) {
            try { localStorage.setItem('token', json.token || json.access_token); } catch(e){ console.warn('Storage failed', e); }
          }
          const redirect = json.redirect || '/dashboard.html';
          window.location.href = redirect;
        } else {
          // show server-provided field errors if present
          if(json.errors && typeof json.errors === 'object') {
            Object.keys(json.errors).forEach(k => {
              showErr(`err-${k}`, Array.isArray(json.errors[k]) ? json.errors[k].join(', ') : String(json.errors[k]));
            });
          } else {
            showErr('err-email', json.message || json.detail || 'Registration failed');
          }
        }
      } catch(err) {
        console.error('Register error', err);
        showErr('err-email', (err.name === 'AbortError') ? 'Request timed out' : 'Network error — try again');
      } finally {
        setBtnLoading(regBtn, false);
      }
    });
  }

  // LOGIN form
  const loginForm = document.getElementById('login-form');
  if(loginForm) {
    const loginBtn = document.getElementById('loginBtn');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrs();

      const email = (document.getElementById('loginEmail')||{}).value?.trim() || '';
      const password = (document.getElementById('loginPassword')||{}).value || '';

      if(!email){ showErr('err-loginEmail','Email required'); return; }
      if(!isEmail(email)){ showErr('err-loginEmail','Invalid email'); return; }
      if(!password){ showErr('err-loginPassword','Password required'); return; }

      setBtnLoading(loginBtn, true);
      try {
        const payload = { email, password };
        const res = await fetchTimeout(`${API_BASE}/login`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });

        let json = {};
        try { json = await res.json(); } catch(e){ /* ignore */ }

        if(res.ok) {
          if(json.token || json.access_token) {
            try { localStorage.setItem('token', json.token || json.access_token); } catch(e){ console.warn('Storage failed', e); }
          }
          window.location.href = json.redirect || '/dashboard.html';
        } else {
          showErr('err-loginEmail', json.message || json.detail || 'Login failed');
        }
      } catch(err) {
        console.error('Login error', err);
        showErr('err-loginEmail', (err.name === 'AbortError') ? 'Request timed out' : 'Network error — try again');
      } finally {
        setBtnLoading(loginBtn, false);
      }
    });
  }
});
