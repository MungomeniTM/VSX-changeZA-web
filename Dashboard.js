// dashboard.js (module)
import { default as ChartLib } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';

// small DOM helpers
const $ = id => document.getElementById(id);
const create = (tag, cls) => { const e = document.createElement(tag); if(cls) e.className = cls; return e; };

const API = window.API;
const auth = window.auth;
const helpers = window.helpers;

let page = 1, pageSize = 10, loading = false, hasMore = true;
let skillsChart = null, farmChart = null;

async function callApiSafe(path, opts = {}) {
  try {
    const res = await API.request(path, opts);
    if (res.status === 401) { auth.logout(); throw new Error('unauthorized'); }
    return res;
  } catch (err) {
    console.warn('Network/API error', err);
    throw err;
  }
}

async function loadProfile() {
  try {
    const res = await callApiSafe('/me', { method:'GET' });
    const user = await res.json();
    $('userName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
    $('userRole').textContent = `${user.role || '—'} • ${user.location || '—'}`;
    $('avatar').textContent = (user.firstName || 'U')[0] || 'U';
  } catch (err) {
    // if backend not ready, show minimal demo, do NOT use dummy data long-term
    console.info('Profile load failed — showing minimal UI');
    // keep default text
  }
}

function renderPostCard(p) {
  const article = create('article', 'post-card card');
  article.dataset.id = p.id || '';
  const initials = (p.user && p.user.firstName) ? p.user.firstName.charAt(0) : 'U';
  article.innerHTML = `
    <div class="post-meta">
      <div class="avatar small">${helpers.escape(initials)}</div>
      <div>
        <div class="author">${helpers.escape(p.user?.name || 'Unknown')}</div>
        <div class="muted small">${new Date(p.createdAt || Date.now()).toLocaleString()}</div>
      </div>
    </div>
    <div class="post-body">${helpers.escape(p.text || '')}</div>
    ${p.media ? (p.mediaType === 'video' ? `<video controls src="${helpers.escape(p.media)}"></video>` : `<img src="${helpers.escape(p.media)}" alt="media" />`) : ''}
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
    const res = await callApiSafe(`/posts?page=${page}&limit=${pageSize}`, { method: 'GET' });
    const json = await res.json();
    const posts = Array.isArray(json.posts) ? json.posts : (Array.isArray(json) ? json : []);
    posts.forEach(p => $('feed').appendChild(renderPostCard(p)));
    page++;
    hasMore = json.hasMore !== undefined ? json.hasMore : (posts.length === pageSize);
  } catch (err) {
    const msg = create('div','card'); msg.textContent = 'Unable to load feed right now.';
    $('feed').appendChild(msg);
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
  const fig = $('previewMedia');
  fig.innerHTML = '';
  if (f.type.startsWith('image/')) {
    const img = create('img'); img.src = url; img.alt = f.name; fig.appendChild(img);
  } else if (f.type.startsWith('video/')) {
    const v = create('video'); v.controls = true; v.src = url; fig.appendChild(v);
  } else {
    fig.textContent = 'Unsupported file';
  }
  $('preview').hidden = false;
});

$('postBtn').addEventListener('click', async () => {
  const text = $('composeText').value.trim();
  const file = $('composeFile').files[0];
  if (!text && !file) return alert('Please write something or attach a file.');
  $('postBtn').disabled = true;
  try {
    const form = new FormData();
    form.append('text', text);
    if (file) form.append('media', file);
    const res = await API.request('/posts', { method:'POST', body: form, skipJson: true });
    if (!res.ok) throw new Error('post-failed');
    const created = await res.json();
    $('feed').prepend(renderPostCard(created));
    resetComposer();
    // optional: emit socket if connected
    if (window.socket && window.socket.connected) window.socket.emit('new-post', created);
  } catch (err) {
    console.error('Post error', err);
    alert('Could not create post. Please try again later.');
  } finally {
    $('postBtn').disabled = false;
  }
});

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
    } catch (err) {
      console.warn('Approve failed', err);
    }
    return;
  }
  const shareBtn = ev.target.closest('.share-btn');
  if (shareBtn) {
    const id = shareBtn.dataset.id;
    try {
      await navigator.clipboard.writeText(`${location.origin}/posts/${id}`);
      alert('Post link copied.');
    } catch (_) {
      alert(`Shareable link: ${location.origin}/posts/${id}`);
    }
    return;
  }
  const commentBtn = ev.target.closest('.comment-btn');
  if (commentBtn) {
    const id = commentBtn.dataset.id;
    const box = $(`comments-${id}`);
    if (!box) return;
    box.hidden = !box.hidden;
    if (!box.hidden && box.childElementCount === 0) {
      // load comments
      try {
        const r = await API.request(`/posts/${id}/comments`, { method:'GET' });
        if (r.ok) {
          const comments = await r.json();
          comments.forEach(c => {
            const p = create('p'); p.className='muted'; p.textContent = `${c.user.name}: ${c.text}`;
            box.appendChild(p);
          });
          // add composer
          const ta = create('textarea'); ta.rows=2; ta.placeholder='Write a comment...';
          const b = create('button','btn primary'); b.textContent='Comment';
          b.addEventListener('click', async () => {
            const text = ta.value.trim(); if (!text) return;
            try {
              const rr = await API.request(`/posts/${id}/comments`, { method:'POST', body: JSON.stringify({ text }), headers: {'Content-Type':'application/json'} });
              if (rr.ok) {
                const created = await rr.json();
                const p = create('p'); p.className='muted'; p.textContent = `${created.user.name}: ${created.text}`;
                box.insertBefore(p, ta);
                ta.value = '';
                if (window.socket && window.socket.connected) window.socket.emit('new-comment', created);
              }
            } catch (err) { console.warn('comment fail', err); alert('Could not post comment'); }
          });
          const wrap = create('div'); wrap.style.marginTop='8px'; wrap.appendChild(ta); wrap.appendChild(b);
          box.appendChild(wrap);
        }
      } catch (err) { console.warn('comments load failed', err); }
    }
    return;
  }
});

// Infinite scroll
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 220)) loadFeed();
});

// Search
$('searchBtn').addEventListener('click', async () => {
  const q = $('globalSearch').value.trim();
  const resultsEl = $('searchResults');
  if (!q) { resultsEl.style.display='none'; return; }
  resultsEl.style.display='block';
  resultsEl.innerHTML = '<li class="muted">Searching…</li>';
  try {
    const r = await API.request(`/search?q=${encodeURIComponent(q)}`, { method:'GET' });
    if (!r.ok) throw new Error('search-failed');
    const hits = await r.json();
    if (!Array.isArray(hits) || hits.length === 0) { resultsEl.innerHTML = '<li class="muted">No results</li>'; return; }
    resultsEl.innerHTML = '';
    hits.forEach(h => {
      const li = create('li');
      li.textContent = `${h.name || h.title} • ${h.type || h.skill || ''}`;
      li.addEventListener('click', () => {
        location.href = `./profile.html?id=${encodeURIComponent(h.id)}`;
      });
      resultsEl.appendChild(li);
    });
  } catch (err) {
    console.warn('Search error', err);
    resultsEl.innerHTML = '<li class="muted">Search failed</li>';
  }
});

// Geolocation for nearby
$('enableGeo').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported');
  $('nearbyList').innerHTML = '<li class="muted">Finding projects near you…</li>';
  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      const r = await API.request(`/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`, { method:'GET' });
      if (!r.ok) throw new Error('nearby fail');
      const list = await r.json();
      $('nearbyList').innerHTML = '';
      list.forEach(p => {
        const li = create('li'); li.textContent = `${p.title} • ${p.distance || '—'}`; $('nearbyList').appendChild(li);
      });
    } catch (err) { console.warn('nearby error', err); $('nearbyList').innerHTML = '<li class="muted">Could not find nearby projects.</li>'; }
  }, () => { $('nearbyList').innerHTML = '<li class="muted">Location permission denied.</li>'; }, { timeout:15000 });
});

// Analytics (Chart.js)
async function loadStats() {
  try {
    const r = await API.request('/stats', { method:'GET' });
    if (!r.ok) throw new Error('stats failed');
    const data = await r.json();
    renderAnalytics(data);
    // fill KPI boxes
    $('statUsers').textContent = data.users || '—';
    $('statPosts').textContent = data.posts || '—';
    $('statFarms').textContent = data.farms || '—';
    $('kpi1').textContent = data.kpi1 || '—';
    $('kpi2').textContent = data.kpi2 || '—';
    $('kpi3').textContent = data.kpi3 || '—';
  } catch (err) {
    console.warn('Stats load failed', err);
  }
}

function renderAnalytics(payload = {}) {
  const labelsSkills = payload.skillsLabels || [];
  const dataSkills = payload.skillsData || [];
  const labelsFarms = payload.farmLabels || [];
  const dataFarms = payload.farmData || [];

  if (skillsChart) skillsChart.destroy();
  if (farmChart) farmChart.destroy();

  if (labelsSkills.length) {
    skillsChart = new Chart(document.getElementById('skillsChart').getContext('2d'), {
      type: 'bar',
      data: { labels: labelsSkills, datasets: [{ data: dataSkills, backgroundColor: labelsSkills.map((_,i) => i%2? '#0077ff55' : '#00f0a855') }]},
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}}
    });
  }
  if (labelsFarms.length) {
    farmChart = new Chart(document.getElementById('farmChart').getContext('2d'), {
      type:'line',
      data:{ labels: labelsFarms, datasets:[{ data: dataFarms, borderColor:'#00f0a8', backgroundColor:'rgba(0,240,168,0.12)', fill:true, tension:0.35 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}}
    });
  }

  // sparkline
  const spark = payload.spark || [];
  if (spark.length) {
    const svg = $('sparkline'); svg.innerHTML = '';
    const w = 200, h = 40;
    const max = Math.max(...spark), min = Math.min(...spark);
    if (max !== min) {
      const pts = spark.map((v,i) => `${(i/(spark.length-1))*w},${h - ((v-min)/(max-min))*h}`).join(' ');
      svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="#1e90ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }
}

// Trending
async function loadTrending() {
  try {
    const r = await API.request('/stats/trending', { method:'GET' });
    if (!r.ok) throw new Error('trending fail');
    const arr = await r.json();
    $('trendingList').innerHTML = '';
    arr.forEach(s => { const li = create('li'); li.textContent = s; $('trendingList').appendChild(li); });
  } catch (err) {
    $('trendingList').innerHTML = '<li class="muted">Unable to load trending skills.</li>';
  }
}

// Wire UI controls
$('logout').addEventListener('click', async () => {
  try { await API.request('/auth/logout', { method:'POST' }); } catch(e) {}
  auth.logout();
});

$('createPostSidebar').addEventListener('click', () => { window.scrollTo({ top: 180, behavior:'smooth' }); $('composeText').focus(); });
$('fab').addEventListener('click', () => { $('composeText').focus(); });

// theme toggle (persistent)
(function themeInit(){
  const root = document.documentElement;
  const stored = localStorage.getItem('vsx-theme');
  const theme = stored || 'dark';
  root.setAttribute('data-theme', theme);
  $('toggleTheme').addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', cur);
    localStorage.setItem('vsx-theme', cur);
  });
})();

// Optional socket.io hook (safe)
function wireRealtime() {
  if (window.io) {
    try {
      window.socket = io(window.location.origin, { auth: { token: auth.getToken() } });
      window.socket.on('connect', ()=> console.info('socket connected'));
      window.socket.on('new-post', post => $('feed').prepend(renderPostCard(post)));
      window.socket.on('update-post', p => {
        const el = document.querySelector(`[data-id="${p.id}"]`);
        if (el) el.querySelector('.approve-btn').textContent = `❤️ ${p.approvals||0}`;
      });
    } catch (err) { console.warn('socket hook failed', err); }
  }
}

// Init
(async function init(){
  // Auth guard: redirect to login if no token
  if (!auth.getToken()) { location.href='./login.html'; return; }

  await loadProfile();
  await loadTrending();
  await loadStats();
  await loadFeed();
  wireRealtime();
})();
