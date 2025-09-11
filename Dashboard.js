/**
 * dashboard.js
 * - Auth guard
 * - Profile load (/api/me)
 * - Feed load (/api/posts) with mock fallback
 * - Composer to POST to /api/posts/create or fallback
 * - Geolocation / nearby call to /api/nearby or fallback
 * - Data analytics: Chart.js charts (skills + farms) + sparkline + KPIs
 *
 * Place at: frontend/src/js/dashboard.js
 * Ensure Chart.js UMD script is included in dashboard.html before this file.
 */

(async () => {
  const API_BASE = window.API_BASE || '/api';
  const token = localStorage.getItem('token');

  const $ = id => document.getElementById(id);

  // Simple helper to call API with token & timeout
  async function callAPI(path, opts = {}) {
    const headers = opts.headers || {};
    if (!opts.passwordless) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const controller = new AbortController();
    const timeout = opts.timeout || 12000;
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal, ...opts, headers });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  // Auth guard: redirect to login unless preview flag present
  if (!token && !location.search.includes('preview=true')) {
    window.location.href = '/login.html';
    return;
  }

  // Render utilities
  function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function createEl(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }

  // Load profile
  async function loadProfile() {
    try {
      const res = await callAPI('/me', { method: 'GET' });
      if (!res.ok) throw new Error('not-auth');
      const user = await res.json();
      $('userName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
      $('userRole').textContent = `${user.role || '—'} • ${user.location || '—'}`;
      $('avatar').textContent = (user.firstName || 'U')[0] || 'U';
      return user;
    } catch (err) {
      console.warn('Profile load failed', err);
      if (location.search.includes('preview=true')) {
        const mock = { firstName: 'Amina', lastName: 'Nkosi', role: 'farmer', email: '', location: 'Limpopo' };
        $('userName').textContent = `${mock.firstName} ${mock.lastName}`;
        $('userRole').textContent = `${mock.role} • ${mock.location}`;
        $('avatar').textContent = 'A';
        return mock;
      }
      // if token invalid redirect
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return null;
    }
  }

  // Feed
  const mockFeed = [
    { id: 1, author: 'Thabo', role: 'skilled', body: 'Installed solar panels for a community center — photos inside', likes: 12, comments: 4, time: '2h' },
    { id: 2, author: 'Zoleka', role: 'farmer', body: 'Millet harvest up 20% this season — good news for local markets.', likes: 27, comments: 6, time: '1d' },
  ];

  function renderPost(post) {
    const el = createEl('article', 'post-card card');
    el.innerHTML = `
      <div class="post-meta">
        <div class="avatar small">${escapeHtml((post.author||'U')[0])}</div>
        <div>
          <div class="author">${escapeHtml(post.author)} <span class="muted">• ${escapeHtml(post.role || '')}</span></div>
          <div class="muted small">${escapeHtml(post.time || '')}</div>
        </div>
      </div>
      <div class="post-body">${escapeHtml(post.body)}</div>
      <div class="post-actions" style="margin-top:10px;display:flex;gap:8px;align-items:center">
        <button class="btn ghost" data-like="${post.id}">❤️ ${post.likes || 0}</button>
        <button class="btn ghost" data-comment="${post.id}">💬 ${post.comments || 0}</button>
        <button class="btn ghost" data-share="${post.id}">🔁 Share</button>
      </div>
    `;
    return el;
  }

  async function loadFeed() {
    const feedEl = $('feed'); feedEl.innerHTML = '';
    try {
      const res = await callAPI('/posts', { method: 'GET' });
      if (res.ok) {
        const posts = await res.json();
        (posts.length ? posts : mockFeed).forEach(p => feedEl.appendChild(renderPost(p)));
      } else {
        mockFeed.forEach(p => feedEl.appendChild(renderPost(p)));
      }
    } catch (err) {
      console.warn('Feed load error:', err);
      mockFeed.forEach(p => feedEl.appendChild(renderPost(p)));
    }
  }

  // Composer
  function wireComposer() {
    $('composeFile').addEventListener('change', (ev) => {
      const f = ev.target.files[0];
      $('fileName').textContent = f ? f.name : 'No file chosen';
      if (f) {
        const url = URL.createObjectURL(f);
        const fig = $('previewMedia'); fig.innerHTML = '';
        if (f.type.startsWith('image/')) {
          const img = createEl('img'); img.src = url; img.alt = f.name; img.style.maxWidth = '100%'; fig.appendChild(img);
        } else if (f.type.startsWith('video/')) {
          const v = createEl('video'); v.controls = true; v.src = url; v.style.maxWidth = '100%'; fig.appendChild(v);
        }
      }
    });

    $('previewBtn').addEventListener('click', () => {
      const preview = $('preview'); preview.hidden = !preview.hidden;
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
        const res = await fetch(`${API_BASE}/posts/create`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          body: form
        });
        if (res.ok) {
          const post = await res.json();
          $('feed').prepend(renderPost(post));
        } else {
          // optimistic fallback
          $('feed').prepend(renderPost({ author: 'You', role: 'you', body: text, likes: 0, comments: 0, time: 'now' }));
        }
        $('composeText').value = '';
        $('composeFile').value = '';
        $('fileName').textContent = 'No file chosen';
        $('preview').hidden = true;
      } catch (err) {
        console.error('post error', err);
        $('feed').prepend(renderPost({ author: 'You', role: 'you', body: text, likes: 0, comments: 0, time: 'now' }));
      } finally { $('postBtn').disabled = false; }
    });
  }

  // Geolocation Nearby
  function wireGeo() {
    $('enableGeo').addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
      }
      $('nearbyList').innerHTML = '<li class="muted">Finding projects near you…</li>';
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        try {
          const res = await callAPI(`/nearby?lat=${lat}&lng=${lng}`, { method: 'GET' });
          if (res.ok) renderNearby(await res.json());
          else renderNearby([]);
        } catch (err) { console.warn('Nearby error', err); renderNearby([]); }
      }, (err) => { console.warn('Geo error', err); $('nearbyList').innerHTML = '<li class="muted">Location permission denied.</li>'; }, { timeout: 15000 });
    });
  }
  function renderNearby(list = []) {
    const el = $('nearbyList'); el.innerHTML = '';
    if (!list.length) { el.innerHTML = '<li class="muted">No nearby projects found.</li>'; return; }
    list.forEach(i => {
      const li = createEl('li'); li.innerHTML = `<strong>${escapeHtml(i.title)}</strong><div class="muted">${escapeHtml(i.distance || '—')} • ${escapeHtml(i.location || '—')}</div>`;
      el.appendChild(li);
    });
  }

  // Trending & stats
  function renderTrending(trends = ['Solar Installations','Bricklaying','Full-stack (Node/React)','Plumbing','UX/UI']) {
    const el = $('trendingList'); el.innerHTML = '';
    trends.forEach(t => { const li = createEl('li'); li.textContent = t; el.appendChild(li); });
  }

  async function loadStats() {
    try {
      const res = await callAPI('/stats', { method: 'GET' });
      if (res.ok) {
        const s = await res.json();
        $('statUsers').textContent = s.users || '—';
        $('statPosts').textContent = s.posts || '—';
        $('statFarms').textContent = s.farms || '—';
        renderCharts(s);
      } else {
        throw new Error('no-stats');
      }
    } catch (err) {
      // fallback mocks
      $('statUsers').textContent = '12.4k';
      $('statPosts').textContent = '8.9k';
      $('statFarms').textContent = '1.2k';
      renderCharts({
        skillsLabels: ['Solar','Bricklaying','Plumbing','Dev','Farming'],
        skillsData: [90,65,70,85,80],
        farmLabels: ['Jan','Feb','Mar','Apr','May','Jun'],
        farmData: [12,15,14,18,22,25],
        spark: [3,4,6,10,8,12,14,16],
      });
    }
  }

  // Charts using global Chart (Chart.js UMD included in HTML)
  let skillsChart, farmChart;
  function renderCharts(payload = {}) {
    const skillsLabels = payload.skillsLabels || ['Solar Installers','Bricklayers','Plumbers','Full-stack','Farmers'];
    const skillsData = payload.skillsData || [90,65,70,85,80];
    const farmLabels = payload.farmLabels || ['Jan','Feb','Mar','Apr','May','Jun'];
    const farmData = payload.farmData || [12,15,14,18,22,25];

    // destroy existing if any
    if (skillsChart) skillsChart.destroy();
    if (farmChart) farmChart.destroy();

    const ctx1 = $('skillsChart').getContext('2d');
    skillsChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: skillsLabels,
        datasets: [{
          label: 'Demand (%)',
          data: skillsData,
          backgroundColor: skillsLabels.map((_,i) => i % 2 ? '#0077ff55' : '#00f0a855'),
          borderRadius: 8,
          barThickness: 22
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw}% demand` } } },
        scales: { y: { beginAtZero:true, ticks: { color: '#aaa' } }, x: { ticks: { color:'#aaa' } } }
      }
    });

    const ctx2 = $('farmChart').getContext('2d');
    farmChart = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: farmLabels,
        datasets: [{
          label: 'Maize Yield',
          data: farmData,
          borderColor: '#00f0a8',
          backgroundColor: 'rgba(0,240,168,0.14)',
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#1e90ff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display:false } },
        scales: { y: { ticks:{ color:'#aaa' } }, x: { ticks:{ color:'#aaa' } } }
      }
    });

    // draw sparkline and KPIs
    const spark = payload.spark || [2,4,6,8,6,9,12,10];
    drawSparkline(spark);
    $('kpi1').textContent = `${Math.round(skillsData.reduce((a,b)=>a+b,0)/skillsData.length)}`;
    $('kpi2').textContent = `${Math.round(((farmData[farmData.length-1] - farmData[0]) / (farmData[0]||1)) * 100) || '—'}%`;
    $('kpi3').textContent = `${Math.round((skillsData.reduce((a,b)=>a+b,0) / skillsData.length) / 2)}`;
  }

  function drawSparkline(values = [2,4,6,8,6,9,12,10]) {
    const svg = $('sparkline');
    const w = 200, h = 40;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const max = Math.max(...values), min = Math.min(...values);
    if (max === min) { svg.innerHTML = ''; return; }
    const pts = values.map((v,i) => {
      const x = (i/(values.length-1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${x},${y}`;
    }).join(' ');
    svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="url(#g)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stop-color="${getComputedStyle(document.documentElement).getPropertyValue('--blue') || '#1e90ff'}"></stop>
          <stop offset="1" stop-color="${getComputedStyle(document.documentElement).getPropertyValue('--mint') || '#00f0a8'}"></stop>
        </linearGradient>
      </defs>`;
  }

  // Wire UI: logout, create post shortcut, feed delegation
  function wireUi() {
    $('logout').addEventListener('click', () => { localStorage.removeItem('token'); window.location.href = '/login.html'; });
    $('createPostSidebar').addEventListener('click', () => { window.scrollTo({ top: 200, behavior: 'smooth' }); $('composeText').focus(); });

    $('feed').addEventListener('click', (ev) => {
      const like = ev.target.closest('[data-like]');
      const comment = ev.target.closest('[data-comment]');
      if (like) { like.disabled = true; setTimeout(()=>like.disabled=false,800); return; }
      if (comment) { alert('Comments panel not implemented yet'); return; }
    });
  }

  // Init
  const user = await loadProfile();
  await loadFeed();
  wireComposer();
  wireGeo();
  await loadStats();
  renderTrending();
  wireUi();
})();
