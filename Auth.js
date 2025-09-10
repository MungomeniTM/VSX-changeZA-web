// frontend/src/js/auth.js
// Handles Register + Login forms, validation, UX states, and API calls.
// Update API_BASE if your backend runs on a different host/port.
const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:8000/api' : '/api';

// Utilities
function showError(elId, msg){
  const el = document.getElementById(elId);
  if(el) el.textContent = msg || '';
}
function clearErrors(){
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
}
function setLoading(button, isLoading){
  if(!button) return;
  if(isLoading){
    button.classList.add('loading');
    button.setAttribute('disabled', 'true');
    button.setAttribute('aria-busy', 'true');
  } else {
    button.classList.remove('loading');
    button.removeAttribute('disabled');
    button.setAttribute('aria-busy', 'false');
  }
}

// Password toggle
function wirePwToggle(toggleId, inputId){
  const btn = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  if(!btn || !input) return;
  btn.addEventListener('click', () => {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    btn.setAttribute('aria-pressed', type === 'text');
  });
}

// Simple email validation
function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== REGISTER =====
const registerForm = document.getElementById('register-form');
if(registerForm){
  wirePwToggle('pwToggle', 'password');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const firstName = (document.getElementById('firstName') || {}).value?.trim() || '';
    const lastName  = (document.getElementById('lastName') || {}).value?.trim() || '';
    const email     = (document.getElementById('email') || {}).value?.trim() || '';
    const password  = (document.getElementById('password') || {}).value || '';
    const role      = (document.getElementById('role') || {}).value || '';

    let hasError = false;
    if(!firstName){ showError('err-firstName', 'First name required'); hasError = true; }
    if(!lastName){ showError('err-lastName', 'Last name required'); hasError = true; }
    if(!email){ showError('err-email', 'Email required'); hasError = true; }
    else if(!isValidEmail(email)){ showError('err-email', 'Invalid email'); hasError = true; }
    if(!password || password.length < 8){ showError('err-password','Password must be at least 8 characters'); hasError = true; }
    if(!role){ showError('err-role', 'Please select a role'); hasError = true; }

    if(hasError) return;

    const submitBtn = document.getElementById('registerBtn');
    setLoading(submitBtn, true);

    try{
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ firstName, lastName, email, password, role })
      });

      const data = await res.json();
      if(res.ok){
        // If backend returns token, store it; otherwise redirect
        if(data.token) localStorage.setItem('token', data.token);
        // redirect to profile or dashboard for onboarding
        window.location.href = data.redirect || '/dashboard.html';
      } else {
        // show backend validation message(s)
        showError('err-email', data.message || data.error || 'Registration failed');
      }
    } catch(err){
      console.error(err);
      showError('err-email', 'Network error — please try again');
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ===== LOGIN =====
const loginForm = document.getElementById('login-form');
if(loginForm){
  wirePwToggle('pwToggleLogin', 'loginPassword');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = (document.getElementById('loginEmail') || {}).value?.trim() || '';
    const password = (document.getElementById('loginPassword') || {}).value || '';

    if(!email){ showError('err-loginEmail', 'Email required'); return; }
    if(!isValidEmail(email)){ showError('err-loginEmail', 'Invalid email'); return; }
    if(!password){ showError('err-loginPassword', 'Password required'); return; }

    const submitBtn = document.getElementById('loginBtn');
    setLoading(submitBtn, true);

    try{
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if(res.ok){
        if(data.token) localStorage.setItem('token', data.token);
        // redirect to dashboard
        window.location.href = data.redirect || '/dashboard.html';
      } else {
        showError('err-loginEmail', data.message || 'Login failed');
      }
    } catch(err){
      console.error(err);
      showError('err-loginEmail', 'Network error — please try again');
    } finally {
      setLoading(submitBtn, false);
    }
  });
}
