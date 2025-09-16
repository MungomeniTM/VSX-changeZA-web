// dashboard.js (module) — main dashboard app logic
// relies on window.API, window.auth, window.helpers, and global Chart (Chart.js)

const $ = id => document.getElementById(id);
const create = (tag, cls) => { const el = document.createElement(tag); if (cls) el.className = cls; return el; };

const API = window.API;
const auth = window.auth;
const H = window.helpers;

// state
let page = 1, size = 12, loading = false, hasMore = true;
let skillsChart = null, farmChart = null;

// safe API + redirect if unauthorized
async function safeJson(path, opts = {}) {
  try {
    const res = await API.request(path, opts);
    if (res.status === 401) {
      auth.logout();
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

async function loadProfile() {
  try {
    const user = await safeJson('/me', { method: 'GET' });
    $('userName').textContent = `${H.safeText(user.firstName)} ${H.safeText(user.lastName)}`.trim() || 'User';
    $('userRole').textContent = `${H.safeText(user.role, '—')} • ${H.safeText(user.location, '—')}`;
    $('avatar').textContent = (user.firstName || 'U').charAt(0).toUpperCase();
    // show profile link with id
    if (user.id) $('profileLink').href = `./profile.html?id=${encodeURIComponent(user.id)}`;
  } catch (err) {
    // backend not ready? keep defaults; UI remains usable
    console.info('Profile not loaded (backend may be down).');
  }
}

function renderPostCard(p) {
  const article = create('article', 'post-card card');
  article.dataset.id = p.id || '';
  const initials = H.safeText(p.user?.firstName || p.user?.name || 'U').charAt(0).toUpperCase();
  const createdAt = p.createdAt ? new Date(p.createdAt).toLocaleString() : '';
  article.innerHTML = `
    <div class="post-meta">
      <div class="avatar small">${H.escape(initials)}</div>
      <div>
        <div class="author">${H.escape(p.user?.name || p.user?.username || 'Unknown')}</div>
        <div class="muted small">${H.escape(createdAt)}</div>
      </div>
    </div>
    <div class="post-body">${H.escape(p.text || '')}</div>
    ${p.media ? (p.mediaType === 'video'
      ? `<video controls src="${H.escape(p.media)}" style="max-width:100%;margin-top:8px;border-radius:8px"></video>`
      : `<img src="${H.escape(p.media)}" alt="post media" style="max-width:100%;margin-top:8px;border-radius:8px">`) : ''}
    <div class="post-actions" style="margin-top:10px;display:flex;gap:8px;align-items:center">
      <button class="btn ghost approve-btn" data-id="${p.id}">❤️ ${p.approvals||0}</button>
      <button class="btn ghost comment-btn" data-id="${p.id}">💬 ${ (p.comments||[]).length }</button>
      <button class="btn ghost share-btn" data-id="${p.id}">🔁 ${p.shares||0}</button>
    </div>
    <div class="comments-section" id="comments-${p.id}" hidden></div>
  `;
  return article;
}

async function loadFeed() {
  if (loading || !hasMore) return;
  loading = true;
  $('loader').classList.remove('hidden');
  try {
    const payload = await safeJson(`/posts?page=${page}&limit=${size}`, { method: 'GET' });
    const posts = Array.isArray(payload.posts) ? payload.posts : (Array.isArray(payload) ? payload : []);
    posts.forEach(p => $('feed').appendChild(renderPostCard(p)));
    page++;
    hasMore = (payload.hasMore !== undefined) ? payload.hasMore : (posts.length === size);
  } catch (err) {
    console.warn('loadFeed error', err);
    if (page === 1) {
      const msg = create('div','card'); msg.textContent = 'Unable to load feed right now. Check your backend or network.';
      $('feed').appendChild(msg);
    }
    hasMore = false;
  } finally {
    loading = false;
    $('loader').classList.add('hidden');
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
    // use API.post to set body correctly
    const res = await API.request('/posts', { method: 'POST', body: form, skipJson: true });
    if (!res.ok) throw new Error('post failed');
    const created = await res.json();
    $('feed').prepend(renderPostCard(created));
    resetComposer();
  } catch (err) {
    console.error('post error', err);
    alert('Could not create post. If backend is not running, try running the FastAPI stubs.');
  } finally {
    $('postBtn').disabled = false;
  }
});

// feed actions (delegated)
$('feed').addEventListener('click', async (ev) => {
  const likeBtn = ev.target.closest('.approve-btn');
  if (likeBtn) {
    const id = likeBtn.dataset.id;
    try {
      const res = await API.request(`/posts/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        likeBtn.textContent = `❤️ ${updated.approvals || 0}`;
      }
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
      // load comments and composer
      try {
        const r = await API.request(`/posts/${id}/comments`, { method: 'GET' });
        if (r.ok) {
          const comments = await r.json();
          comments.forEach(c => {
            const p = create('p'); p.className = 'muted'; p.textContent = `${c.user?.name || 'User'}: ${c.text}`;
            box.appendChild(p);
          });
          const ta = create('textarea'); ta.rows=2; ta.placeholder='Write a comment...';
          const b = create('button','btn primary'); b.textContent='Comment';
          b.addEventListener('click', async () => {
            const content = ta.value.trim(); if (!content) return;
            try {
              const rr = await API.request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text: content }), headers: {'Content-Type':'application/json'} });
              if (rr.ok) {
                const created = await rr.json();
                const p = create('p'); p.className='muted'; p.textContent = `${created.user?.name || 'User'}: ${created.text}`;
                box.insertBefore(p, ta);
                ta.value = '';
              }
            } catch (err) { console.warn('comment fail', err); alert('Could not post comment'); }
          });
          const wrap = create('div'); wrap.style.marginTop = '8px'; wrap.appendChild(ta); wrap.appendChild(b);
          box.appendChild(wrap);
        }
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

// infinite scroll guard
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 300)) {
    loadFeed();
  }
});

// search with debounce
const doSearch = H.debounce(async () => {
  const q = $('globalSearch').value.trim();
  const resultsEl = $('searchResults');
  if (!q) { resultsEl.style.display = 'none'; resultsEl.innerHTML = ''; return; }
  resultsEl.style.display = 'block';
  resultsEl.innerHTML = '<li class="muted">Searching…</li>';
  try {
    const r = await API.request(`/search?q=${encodeURIComponent(q)}`, { method: 'GET' });
    if (!r.ok) throw new Error('search failed');
    const hits = await r.json();
    if (!Array.isArray(hits) || hits.length === 0) { resultsEl.innerHTML = '<li class="muted">No results</li>'; return; }
    resultsEl.innerHTML = '';
    hits.forEach(h => {
      const li = create('li'); li.tabIndex = 0;
      li.textContent = `${h.name || h.title} • ${h.type || h.skill || ''}`;
      li.addEventListener('click', () => { location.href = `./profile.html?id=${encodeURIComponent(h.id)}`; });
      resultsEl.appendChild(li);
    });
  } catch (err) {
    console.warn('search error', err);
    resultsEl.innerHTML = '<li class="muted">Search failed</li>';
  }
}, 300);

$('globalSearch').addEventListener('input', doSearch);
$('searchBtn').addEventListener('click', doSearch);

// geolocation
$('enableGeo').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported');
  $('nearbyList').innerHTML = '<li class="muted">Finding projects near you…</li>';
  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      const r = await API.request(`/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`, { method: 'GET' });
      if (!r.ok) throw new Error('nearby failed');
      const list = await r.json();
      $('nearbyList').innerHTML = '';
      list.forEach(p => { const li = create('li'); li.textContent = `${p.title} • ${p.distance || '—'}`; $('nearbyList').appendChild(li); });
    } catch (err) {
      console.warn('nearby error', err);
      $('nearbyList').innerHTML = '<li class="muted">Could not find nearby projects.</li>';
    }
  }, () => { $('nearbyList').innerHTML = '<li class="muted">Location permission denied.</li>'; }, { timeout: 15000 });
});

// analytics
async function loadStats() {
  try {
    const data = await API.json('/stats', { method: 'GET' });
    if (!data) return;
    // KPI tiles
    $('statUsers').textContent = data.users || '—';
    $('statPosts').textContent = data.posts || '—';
    $('statFarms').textContent = data.farms || '—';
    $('kpi1').textContent = data.kpi1 || '—';
    $('kpi2').textContent = data.kpi2 || '—';
    $('kpi3').textContent = data.kpi3 || '—';

    renderCharts(data);
  } catch (err) {
    console.warn('loadStats fail', err);
  }
}

function renderCharts(payload = {}) {
  const skillsLabels = payload.skillsLabels || [];
  const skillsData = payload.skillsData || [];
  const farmLabels = payload.farmLabels || [];
  const farmData = payload.farmData || [];

  if (skillsChart) skillsChart.destroy();
  if (farmChart) farmChart.destroy();

  if (skillsLabels.length) {
    skillsChart = new Chart($('skillsChart').getContext('2d'), {
      type: 'bar',
      data: { labels: skillsLabels, datasets: [{ label: 'Demand', data: skillsData, backgroundColor: skillsLabels.map((_,i)=> i%2? 'rgba(30,144,255,0.22)':'rgba(0,240,168,0.22)'), borderRadius: 8 }]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: '#9aa3ad' } }, x: { ticks: { color: '#9aa3ad' } } } }
    });
  }

  if (farmLabels.length) {
    farmChart = new Chart($('farmChart').getContext('2d'), {
      type: 'line',
      data: { labels: farmLabels, datasets: [{ label: 'Yield', data: farmData, borderColor: '#00f0a8', backgroundColor: 'rgba(0,240,168,0.12)', fill: true, tension: 0.35 }]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9aa3ad' } }, x: { ticks: { color: '#9aa3ad' } } } }
    });
  }

  // sparkline
  const spark = payload.spark || [];
  const svg = $('sparkline');
  if (spark.length && svg) {
    const w = 200, h = 40;
    const max = Math.max(...spark), min = Math.min(...spark);
    if (max !== min) {
      const pts = spark.map((v,i) => `${(i/(spark.length-1))*w},${h - ((v-min)/(max-min))*h}`).join(' ');
      svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="#1e90ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }
}

// trending
async function loadTrending() {
  try {
    const arr = await API.json('/stats/trending', { method: 'GET' });
    if (!Array.isArray(arr)) throw new Error('bad trending');
    $('trendingList').innerHTML = '';
    arr.forEach(s => { const li = create('li'); li.textContent = s; $('trendingList').appendChild(li); });
  } catch (err) {
    $('trendingList').innerHTML = '<li class="muted">Unable to load trending skills.</li>';
  }
}

// wire controls
$('logout').addEventListener('click', async () => {
  try { await API.request('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  auth.logout();
});
$('createPostSidebar').addEventListener('click', () => { window.scrollTo({ top: 200, behavior: 'smooth' }); $('composeText').focus(); });
$('fab').addEventListener('click', () => { $('composeText').focus(); });
$('fileBtn').addEventListener('click', () => $('composeFile').click());

// theme toggle
(function themeInit(){
  const root = document.documentElement;
  const stored = localStorage.getItem('vsx-theme') || 'dark';
  root.setAttribute('data-theme', stored);
  $('toggleTheme').addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', cur);
    localStorage.setItem('vsx-theme', cur);
    $('toggleTheme').setAttribute('aria-pressed', cur === 'dark' ? 'false' : 'true');
  });
})();

// init
(async function init() {
  // guard: if no token, redirect to login
  if (!auth.getToken()) { location.href = './login.html'; return; }

  await Promise.allSettled([loadProfile(), loadTrending(), loadStats()]);
  await loadFeed();
})();
