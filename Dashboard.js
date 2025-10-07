// frontend/public/dashboard.js
// Cleaned / aligned with backend endpoints and window.API
const $ = id => document.getElementById(id);
const create = (tag, cls) => { const el = document.createElement(tag); if (cls) el.className = cls; return el; };

const API = window.API;
const auth = window.auth;   // keep your existing auth.js
const H = window.helpers;   // keep your existing helpers.js

let page = 1, size = 12, loading = false, hasMore = true;

async function safeJson(path, opts = {}) {
  try {
    const res = await API.request(path, opts);
    if (res.status === 401) {
      try { auth.logout(); } catch {}
      location.href = './login.html';
      throw new Error('unauthorized');
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => `${res.status}`);
      throw new Error(`API ${res.status}: ${txt}`);
    }
    return res.json();
  } catch (err) {
    console.warn('safeJson fail', path, err);
    throw err;
  }
}

// Profile loader (keeps current behaviour)
async function loadProfile() {
  try {
    const user = await safeJson('/me', { method: 'GET' });
    $('userName').textContent = `${H.safeText(user.first_name || user.firstName || '')} ${H.safeText(user.last_name || user.lastName || '')}`.trim() || 'User';
    $('userRole').textContent = `${H.safeText(user.role, '—')} • ${H.safeText(user.location, '—')}`;
    if (user.first_name || user.firstName) {
      const initial = (user.first_name || user.firstName || 'U')[0].toUpperCase();
      $('avatar').textContent = initial;
    }
    if (user.id) $('profileLink').href = `./profile.html?id=${encodeURIComponent(user.id)}`;
  } catch (err) {
    // already handled in safeJson
    console.info('Profile not loaded', err);
  }
}

function renderPostCard(p) {
  const article = create('article', 'post-card card');
  article.dataset.id = p.id || '';
  const initials = H.safeText((p.user && (p.user.first_name || p.user.firstName) ) || 'U').charAt(0).toUpperCase();
  const createdAt = p.createdAt || p.created_at || p.createdAtIso || '';
  article.innerHTML = `
    <div class="post-meta">
      <div class="avatar small">${H.escape(initials)}</div>
      <div>
        <div class="author">${H.escape((p.user && (p.user.first_name || p.user.firstName || p.user.name)) || 'Unknown')}</div>
        <div class="muted small">${H.escape(createdAt ? new Date(createdAt).toLocaleString() : '')}</div>
      </div>
    </div>
    <div class="post-body">${H.escape(p.text || '')}</div>
    ${p.media ? (p.mediaType === 'video' || p.media_type === 'video'
      ? `<video controls src="${H.escape(p.media || p.media_url)}" style="max-width:100%;margin-top:8px;border-radius:8px"></video>`
      : `<img src="${H.escape(p.media || p.media_url)}" alt="post media" style="max-width:100%;margin-top:8px;border-radius:8px">`) : ''}
    <div class="post-actions" style="margin-top:10px;display:flex;gap:8px;align-items:center">
      <button class="btn ghost approve-btn" data-id="${p.id}">❤️ ${p.approvals||0}</button>
      <button class="btn ghost comment-btn" data-id="${p.id}">💬 ${ (p.comments || []).length }</button>
      <button class="btn ghost share-btn" data-id="${p.id}">🔁 ${p.shares||0}</button>
    </div>
    <div class="comments-section" id="comments-${p.id}" hidden></div>
  `;
  return article;
}

async function loadFeed() {
  if (loading || !hasMore) return;
  loading = true;
  const loader = $('loader');
  if (loader) loader.classList.remove('hidden');
  try {
    const payload = await safeJson(`/posts?page=${page}&limit=${size}`, { method: 'GET' });
    const posts = Array.isArray(payload.posts) ? payload.posts : [];
    if (!posts.length && page === 1) {
      const msg = create('div','card'); msg.textContent = 'No posts yet.';
      $('feed').appendChild(msg);
    }
    posts.forEach(p => $('feed').appendChild(renderPostCard(p)));
    page++;
    hasMore = (payload.hasMore !== undefined) ? payload.hasMore : (posts.length === size);
  } catch (err) {
    console.warn('loadFeed error', err);
    if (page === 1) {
      const msg = create('div','card'); msg.textContent = 'Unable to load feed right now.';
      $('feed').appendChild(msg);
    }
    hasMore = false;
  } finally {
    loading = false;
    if (loader) loader.classList.add('hidden');
  }
}

function resetComposer() {
  $('composeText').value = '';
  $('composeFile').value = '';
  $('fileName').textContent = 'No file chosen';
  $('preview').hidden = true;
  $('previewMedia').innerHTML = '';
}

$('composeFile').addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  $('fileName').textContent = f ? f.name : 'No file chosen';
});

$('previewBtn').addEventListener('click', () => {
  const f = $('composeFile').files[0];
  if (!f) return alert('No file selected');
  const url = URL.createObjectURL(f);
  const fig = $('previewMedia'); fig.innerHTML = '';
  if (f.type.startsWith('image/')) {
    const img = create('img'); img.src = url; img.alt = f.name; img.style.maxWidth = '100%'; fig.appendChild(img);
  } else if (f.type.startsWith('video/')) {
    const v = create('video'); v.controls = true; v.src = url; v.style.maxWidth = '100%'; fig.appendChild(v);
  } else {
    fig.textContent = 'Unsupported file type';
  }
  $('preview').hidden = false;
});

$('postBtn').addEventListener('click', async () => {
  const text = $('composeText').value.trim();
  const file = $('composeFile').files[0];
  if (!text && !file) { alert('Please write something or attach a file.'); return; }
  $('postBtn').disabled = true;
  try {
    const form = new FormData();
    form.append('text', text);
    if (file) form.append('media', file);
    const res = await API.request('/posts', { method: 'POST', body: form });
    if (!res.ok) {
      const txt = await res.text().catch(()=>res.status);
      throw new Error(`post failed: ${txt}`);
    }
    const created = await res.json();
    // optimistic prepend
    $('feed').insertBefore(renderPostCard(created), $('feed').firstChild);
    resetComposer();
    // reset pagination so user sees fresh feed next time
    page = 1; hasMore = true;
    // optionally reload feed page 1
    // clear current feed then reload:
    // $('feed').innerHTML = ''; await loadFeed();
  } catch (err) {
    console.error('post error', err);
    alert('Could not create post. Check backend. ' + (err.message || ''));
  } finally {
    $('postBtn').disabled = false;
  }
});

// delegated feed actions
$('feed').addEventListener('click', async (ev) => {
  const likeBtn = ev.target.closest('.approve-btn');
  if (likeBtn) {
    const id = likeBtn.dataset.id;
    try {
      const res = await API.request(`/posts/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('approve failed');
      const updated = await res.json();
      likeBtn.textContent = `❤️ ${updated.approvals || 0}`;
    } catch (err) { console.warn('approve failed', err); }
    return;
  }

  const commentBtn = ev.target.closest('.comment-btn');
  if (commentBtn) {
    const id = commentBtn.dataset.id;
    const box = $(`comments-${id}`);
    if (!box) return;
    box.hidden = !box.hidden;
    if (!box.hidden && box.childElementCount === 0) {
      try {
        const r = await API.request(`/posts/${id}/comments`, { method: 'GET' });
        if (!r.ok) throw new Error('comments fetch failed');
        const comments = await r.json();
        comments.forEach(c => {
          const p = create('p'); p.className = 'muted'; p.textContent = `${(c.user && (c.user.first_name || c.user.firstName || c.user.name)) || 'User'}: ${c.text}`;
          box.appendChild(p);
        });
        const ta = create('textarea'); ta.rows=2; ta.placeholder='Write a comment...';
        const b = create('button','btn primary'); b.textContent='Comment';
        b.addEventListener('click', async () => {
          const content = ta.value.trim(); if (!content) return;
          try {
            const rr = await API.request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text: content }), headers: {'Content-Type':'application/json'} });
            if (!rr.ok) throw new Error('comment failed');
            const created = await rr.json();
            const p = create('p'); p.className='muted'; p.textContent = `${(created.user && (created.user.first_name || created.user.firstName || created.user.name)) || 'User'}: ${created.text}`;
            box.insertBefore(p, ta);
            ta.value = '';
          } catch (err) { alert('Could not post comment'); console.warn(err); }
        });
        const wrap = create('div'); wrap.style.marginTop = '8px'; wrap.appendChild(ta); wrap.appendChild(b);
        box.appendChild(wrap);
      } catch (err) { console.warn('comments load failed', err); }
    }
    return;
  }

  const shareBtn = ev.target.closest('.share-btn');
  if (shareBtn) {
    const id = shareBtn.dataset.id;
    try {
      await navigator.clipboard.writeText(`${location.origin}/posts/${id}`);
      alert('Post link copied.');
    } catch {
      alert(`Shareable link: ${location.origin}/posts/${id}`);
    }
    return;
  }
});

// infinite scroll
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 300)) {
    loadFeed();
  }
});

// init
(async function init() {
  if (!auth || !auth.getToken || !auth.getUser) {
    console.warn('auth wrapper not found; ensure auth.js present');
  }

  if (auth && !auth.getToken()) { location.href = './login.html'; return; }

  try {
    await Promise.allSettled([loadProfile(), loadFeed()]);
  } catch (err) {
    console.warn('init error', err);
  }
})();