// profile.js (module)
// Designed to integrate with your window.API, window.auth, and window.helpers

const $ = id => document.getElementById(id);
const API = window.API;
const auth = window.auth;
const H = window.helpers;

async function safeJson(path, opts = {}) {
  try {
    const res = await API.request(path, opts);
    if (res.status === 401) { auth.logout(); throw new Error('unauthorized'); }
    return res.json();
  } catch (err) {
    console.warn('API error', err);
    throw err;
  }
}

async function loadMyProfile() {
  try {
    // /api/profile/me returns extended profile
    const profile = await safeJson('/profile/me', { method: 'GET' });
    // populate summary
    $('displayName').textContent = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';
    $('displayRole').textContent = profile.role || '—';
    $('displayLocation').textContent = profile.location || '—';
    if (profile.avatar_url) {
      $('avatarPreview').textContent = '';
      const img = document.createElement('img'); img.src = profile.avatar_url; img.alt = 'avatar'; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; img.style.borderRadius='12px';
      $('avatarPreview').appendChild(img);
    } else {
      $('avatarPreview').textContent = (profile.firstName || 'U').charAt(0).toUpperCase();
    }
    // form fields
    $('firstName').value = profile.firstName || '';
    $('lastName').value = profile.lastName || '';
    $('location').value = profile.location || '';
    $('bio').value = profile.bio || '';
    $('role').value = profile.role || 'client';
    $('skills').value = Array.isArray(profile.skills) ? profile.skills.join(', ') : '';

    // portfolio
    renderPortfolio(profile.portfolio || []);
    // KPIs and counts (basic)
    $('kpiPosts').textContent = (profile.posts || '—');
    $('kpiApprovals').textContent = (profile.approvals || '—');
    $('kpiReach').textContent = (profile.reach || '—');
    $('countPosts').textContent = profile.posts || '—';
    $('countApprovals').textContent = profile.approvals || '—';
    $('countConnections').textContent = profile.connections || '—';
  } catch (err) {
    console.warn('Could not load profile', err);
  }
}

function renderPortfolio(items) {
  const list = $('portfolioList');
  list.innerHTML = '';
  if (!items || items.length === 0) {
    list.innerHTML = '<div class="muted">No portfolio items yet.</div>';
    return;
  }
  items.forEach(it => {
    const wrap = document.createElement('div'); wrap.className = 'portfolio-item';
    const media = document.createElement('div');
    if (it.media && it.media.endsWith('.mp4')) {
      const v = document.createElement('video'); v.src = it.media; v.controls=true; v.width=160; media.appendChild(v);
    } else if (it.media) {
      const img = document.createElement('img'); img.src = it.media; img.alt = it.title || 'media'; media.appendChild(img);
    } else {
      const box = document.createElement('div'); box.style.width='100px'; box.style.height='72px'; box.style.background='linear-gradient(90deg,#111,#222)'; box.style.borderRadius='8px'; media.appendChild(box);
    }
    const meta = document.createElement('div'); meta.className='meta';
    const h4 = document.createElement('h4'); h4.textContent = it.title || 'Untitled';
    const p = document.createElement('p'); p.textContent = it.description || ''; p.className='muted';
    meta.appendChild(h4); meta.appendChild(p);
    wrap.appendChild(media); wrap.appendChild(meta);
    list.appendChild(wrap);
  });
}

// Save profile edits
$('saveProfile').addEventListener('click', async () => {
  const payload = {
    firstName: $('firstName').value.trim(),
    lastName: $('lastName').value.trim(),
    location: $('location').value.trim(),
    bio: $('bio').value.trim(),
    skills: $('skills').value.split(',').map(s=>s.trim()).filter(Boolean)
  };
  try {
    const res = await API.request('/profile', { method: 'PUT', body: JSON.stringify(payload), headers: {'Content-Type':'application/json'} });
    if (!res.ok) {
      const t = await res.text().catch(()=>null);
      alert('Could not save profile: ' + (t || res.status));
      return;
    }
    const updated = await res.json();
    // refresh UI
    loadMyProfile();
    alert('Profile saved');
  } catch (err) {
    console.error('save profile', err);
    alert('Network error saving profile');
  }
});

$('cancelEdit').addEventListener('click', () => { loadMyProfile(); });

// Avatar upload
$('uploadAvatarBtn').addEventListener('click', () => $('avatarFile').click());
$('avatarFile').addEventListener('change', async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  const fd = new FormData(); fd.append('file', f);
  try {
    const res = await API.request('/profile/avatar', { method: 'POST', body: fd, skipJson: true });
    if (!res.ok) throw new Error('avatar fail');
    const json = await res.json();
    // refresh
    loadMyProfile();
    alert('Avatar uploaded');
  } catch (err) {
    console.error('avatar upload', err);
    alert('Could not upload avatar');
  }
});

// Portfolio add
$('addPortfolio').addEventListener('click', async () => {
  const title = $('pfTitle').value.trim();
  const desc = $('pfDesc').value.trim();
  const file = $('pfFile').files[0];
  if (!title) { alert('Please add a title'); return; }
  const fd = new FormData();
  fd.append('title', title);
  fd.append('description', desc);
  if (file) fd.append('file', file);
  try {
    const res = await API.request('/profile/portfolio', { method: 'POST', body: fd, skipJson: true });
    if (!res.ok) {
      const t = await res.text().catch(()=>null);
      alert('Portfolio add failed: ' + (t || res.status));
      return;
    }
    const json = await res.json();
    // append item to list
    // re-fetch profile to get canonical portfolio
    await loadMyProfile();
    $('pfTitle').value = ''; $('pfDesc').value = ''; $('pfFile').value = '';
    alert('Portfolio item added');
  } catch (err) {
    console.error('portfolio add', err);
    alert('Could not add portfolio item');
  }
});

// logout
$('logout').addEventListener('click', ()=> auth.logout());

// guard + init
(async function init(){
  if (!auth.getToken()) { location.href = './login.html'; return; }
  try {
    await loadMyProfile();
  } catch(e){ console.warn('init profile', e); }
})();