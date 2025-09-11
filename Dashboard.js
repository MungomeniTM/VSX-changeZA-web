// dashboard.js — production-ready dashboard logic
// Place at: frontend/src/js/dashboard.js

(() => {
  const $ = id => document.getElementById(id);

  // Config (api.js sets window.API_BASE)
  const API_BASE = window.API_BASE || '/api';
  const TOKEN = window.localStorage.getItem('token');

  // Utilities
  const qs = (sel, parent = document) => parent.querySelector(sel);
  const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  function show(el){ el && el.classList.remove('hidden'); }
  function hide(el){ el && el.classList.add('hidden'); }

  // Fetch wrapper with timeout
  async function callAPI(path, opts = {}) {
    const controller = new AbortController();
    const timeout = opts.timeout || 12000;
    const headers = Object.assign({}, opts.headers || {});
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
    if (!opts.skipJson && !opts.body) headers['Content-Type'] = headers['Content-Type'] || 'application/json';

    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        signal: controller.signal,
        ...opts,
        headers
      });
      clearTimeout(id);
      if (res.status === 401) {
        // unauthorized -> redirect to login
        localStorage.removeItem('token');
        window.location.href = '/public/login.html';
        throw new Error('unauthorized');
      }
      return res;
    } catch (err) {
      clearTimeout(id);
      console.error('API call failed', path, err);
      throw err;
    }
  }

  // DOM elements
  const userName = $('userName'), userRole = $('userRole'), avatar = $('avatar');
  const feed = $('feed'), loader = $('loader');
  const trendingList = $('trendingList'), nearbyList = $('nearbyList');
  const composeText = $('composeText'), composeFile = $('composeFile'), fileName = $('fileName');
  const postBtn = $('postBtn'), previewBtn = $('previewBtn'), preview = $('preview'), previewMedia = $('previewMedia');
  const enableGeoBtn = $('enableGeo'), statsUsers = $('statUsers'), statsPosts = $('statPosts'), statsFarms = $('statFarms');
  const skillsChartEl = $('skillsChart'), farmChartEl = $('farmChart'), sparklineEl = $('sparkline');
  const searchInput = $('globalSearch'), searchResults = $('searchResults'), searchBtn = $('searchBtn');

  // Pagination/state
  let page = 1, pageSize = 10, fetching = false, more = true;
  let skillsChart, farmChart;

  // ---------- Auth guard & initial load ----------
  async function init() {
    try {
      // require token
      if (!TOKEN) {
        window.location.href = '/public/login.html';
        return;
      }

      // load user profile
      await loadProfile();

      // wire UI
      wireUi();

      // initial data
      await Promise.all([loadStats(), loadTrending(), loadFeed()]);
      wireRealtime();
    } catch (err) {
      console.error('Init error', err);
      // show minimal message to user
      // if API down, remain on page, show messages
    }
  }

  // ---------- Profile ----------
  async function loadProfile() {
    try {
      const res = await callAPI('/me', { method: 'GET' });
      const user = await res.json();
      userName.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
      userRole.textContent = `${user.role || '—'} • ${user.location || '—'}`;
      avatar.textContent = (user.firstName && user.firstName[0].toUpperCase()) || 'U';
    } catch (err) {
      console.warn('Profile load failed', err);
      // If user cannot be loaded, redirect to login already done in callAPI (401).
    }
  }

  // ---------- Feed ----------
  function renderPost(post) {
    const article = document.createElement('article');
    article.className = 'post-card card';
    article.dataset.id = post.id;

    const authorInitial = (post.user && post.user.firstName) ? post.user.firstName[0] : (post.user && post.user.name ? post.user.name[0] : 'U');
    article.innerHTML = `
      <div class="post-meta">
        <div class="avatar small">${authorInitial}</div>
        <div>
          <div class="author">${escapeHtml(post.user?.name || 'Unknown')}</div>
          <div class="muted small">${new Date(post.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div class="post-body">${escapeHtml(post.text || '')}</div>
      ${post.media ? `<div class="post-media">${post.mediaType === 'video' ? `<video controls src="${escapeHtml(post.media)}"></video>` : `<img src="${escapeHtml(post.media)}" alt="media">`}</div>` : ''}
      <div class="post-actions">
        <button class="btn ghost approve-btn" data-id="${post.id}">❤️🤝 <span class="count">${post.approvals||0}</span></button>
        <button class="btn ghost comment-btn" data-id="${post.id}">💬 <span class="count">${(post.comments||[]).length}</span></button>
        <button class="btn ghost share-btn" data-id="${post.id}">🔁 <span class="count">${post.shares||0}</span></button>
      </div>
      <div class="comments-section" id="comments-${post.id}" hidden></div>
    `;
    return article;
  }

  async function loadFeed() {
    if (fetching || !more) return;
    fetching = true;
    show(loader);
    try {
      const res = await callAPI(`/posts?page=${page}&limit=${pageSize}`, { method: 'GET' });
      if (!res.ok) throw new Error(`Feed ${res.status}`);
      const json = await res.json();
      // expected { posts: [...], hasMore: true/false }
      const posts = Array.isArray(json.posts) ? json.posts : (Array.isArray(json) ? json : []);
      posts.forEach(p => feed.appendChild(renderPost(p)));
      page++;
      more = json.hasMore !== undefined ? json.hasMore : (posts.length === pageSize);
    } catch (err) {
      console.error('Load feed error', err);
      // show message, but do not crash
      const msg = document.createElement('div'); msg.className = 'card'; msg.textContent = 'Unable to load feed. Try again later.';
      feed.appendChild(msg);
      more = false;
    } finally {
      hide(loader);
      fetching = false;
    }
  }

  // ---------- Create Post ----------
  function resetComposer() {
    composeText.value = '';
    composeFile.value = '';
    fileName.textContent = 'No file chosen';
    preview.hidden = true;
    previewMedia.innerHTML = '';
  }

  composeFile.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    fileName.textContent = f ? f.name : 'No file chosen';
  });

  previewBtn.addEventListener('click', () => {
    const f = composeFile.files[0];
    if (!f) return alert('No file selected');
    preview.hidden = false;
    previewMedia.innerHTML = '';
    const url = URL.createObjectURL(f);
    if (f.type.startsWith('image/')) {
      const img = document.createElement('img'); img.src = url; img.alt = f.name; previewMedia.appendChild(img);
    } else if (f.type.startsWith('video/')) {
      const v = document.createElement('video'); v.controls = true; v.src = url; previewMedia.appendChild(v);
    } else {
      previewMedia.textContent = 'Unsupported file type';
    }
  });

  postBtn.addEventListener('click', async () => {
    const text = composeText.value.trim();
    const file = composeFile.files[0];
    if (!text && !file) return alert('Please write something or attach a file.');

    postBtn.disabled = true;
    try {
      const form = new FormData();
      form.append('text', text);
      if (file) form.append('media', file);

      const res = await callAPI('/posts', { method: 'POST', body: form, skipJson: true });
      if (!res.ok) throw new Error('Post failed');
      const created = await res.json();
      // prepend and show
      feed.prepend(renderPost(created));
      resetComposer();
      // notify via socket if available
      if (window.socket && window.socket.connected) window.socket.emit('new-post', created);
    } catch (err) {
      console.error('Create post error', err);
      alert('Could not create post. Check your connection and try again.');
    } finally {
      postBtn.disabled = false;
    }
  });

  // ---------- Actions delegation (approve / comment / share) ----------
  feed.addEventListener('click', async (ev) => {
    const approve = ev.target.closest('.approve-btn');
    if (approve) {
      const id = approve.dataset.id;
      try {
        const res = await callAPI(`/posts/${id}/approve`, { method: 'POST' });
        if (!res.ok) throw new Error('Approve failed');
        const updated = await res.json();
        approve.querySelector('.count').textContent = updated.approvals || 0;
      } catch (err) {
        console.error('Approve error', err);
      }
      return;
    }

    const commentBtn = ev.target.closest('.comment-btn');
    if (commentBtn) {
      const id = commentBtn.dataset.id;
      toggleComments(id);
      return;
    }

    const shareBtn = ev.target.closest('.share-btn');
    if (shareBtn) {
      const id = shareBtn.dataset.id;
      try {
        await navigator.clipboard.writeText(`${location.origin}/posts/${id}`);
        alert('Post link copied to clipboard.');
      } catch (err) {
        console.warn('Clipboard failed', err);
        alert('Copy link failed. Share URL: ' + `${location.origin}/posts/${id}`);
      }
      return;
    }
  });

  // ---------- Comments ----------
  async function toggleComments(postId) {
    const container = $(`comments-${postId}`);
    if (!container) return;
    container.hidden = !container.hidden;
    if (!container.hidden && container.childElementCount === 0) {
      // load comments
      try {
        const res = await callAPI(`/posts/${postId}/comments`, { method: 'GET' });
        if (!res.ok) throw new Error('Comments load failed');
        const comments = await res.json();
        comments.forEach(c => {
          const p = document.createElement('p'); p.className = 'muted'; p.textContent = `${c.user.name}: ${c.text}`;
          container.appendChild(p);
        });
        // add simple comment composer
        const ta = document.createElement('textarea'); ta.rows = 2; ta.placeholder = 'Write a comment...';
        const btn = document.createElement('button'); btn.className = 'btn primary'; btn.textContent = 'Comment';
        btn.addEventListener('click', async () => {
          const txt = ta.value.trim(); if (!txt) return;
          try {
            const r = await callAPI(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ text: txt }), headers: { 'Content-Type': 'application/json' } });
            if (!r.ok) throw new Error('Comment failed');
            const created = await r.json();
            const p = document.createElement('p'); p.className = 'muted'; p.textContent = `${created.user.name}: ${created.text}`;
            container.insertBefore(p, ta);
            ta.value = '';
            if (window.socket && window.socket.connected) window.socket.emit('new-comment', created);
          } catch (err) {
            console.error('Post comment error', err);
            alert('Could not post comment.');
          }
        });
        const wrap = document.createElement('div'); wrap.style.marginTop = '8px'; wrap.appendChild(ta); wrap.appendChild(btn);
        container.appendChild(wrap);
      } catch (err) {
        console.error('Comments load error', err);
        container.appendChild(Object.assign(document.createElement('div'), { textContent: 'Failed to load comments.' }));
      }
    }
  }

  // ---------- Trending / Stats / Analytics ----------
  async function loadTrending() {
    try {
      const res = await callAPI('/stats/trending', { method: 'GET' });
      if (!res.ok) throw new Error('trending failed');
      const data = await res.json(); // expected array
      trendingList.innerHTML = '';
      data.forEach(t => {
        const li = document.createElement('li'); li.textContent = t; trendingList.appendChild(li);
      });
    } catch (err) {
      console.warn('Trending failed', err);
      trendingList.innerHTML = '<li class="muted">Unable to load trending skills.</li>';
    }
  }

  async function loadStats() {
    try {
      const res = await callAPI('/stats', { method: 'GET' });
      if (!res.ok) throw new Error('stats failed');
      const s = await res.json();
      statsUsers.textContent = s.users || '—';
      statsPosts.textContent = s.posts || '—';
      statsFarms.textContent = s.farms || '—';
      renderCharts(s);
    } catch (err) {
      console.warn('Stats failed', err);
      statsUsers.textContent = '—';
      statsPosts.textContent = '—';
      statsFarms.textContent = '—';
    }
  }

  function renderCharts(payload = {}) {
    try {
      const skillLabels = payload.skillsLabels || [];
      const skillData = payload.skillsData || [];
      const farmLabels = payload.farmLabels || [];
      const farmData = payload.farmData || [];

      // destroy if exists
      if (skillsChart) skillsChart.destroy();
      if (farmChart) farmChart.destroy();

      if (skillLabels.length) {
        skillsChart = new Chart(skillsChartEl.getContext('2d'), {
          type: 'bar',
          data: { labels: skillLabels, datasets: [{ data: skillData, backgroundColor: skillLabels.map((_,i)=> i%2 ? '#0077ff66' : '#00f0a866') }] },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
        });
      }
      if (farmLabels.length) {
        farmChart = new Chart(farmChartEl.getContext('2d'), {
          type: 'line',
          data: { labels: farmLabels, datasets: [{ data: farmData, borderColor:'#00f0a8', backgroundColor:'rgba(0,240,168,0.12)', fill:true, tension:0.35 }] },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
        });
      }

      // sparkline
      if (Array.isArray(payload.spark)) drawSpark(payload.spark);
      $('kpi1').textContent = payload.kpi1 || '—';
      $('kpi2').textContent = payload.kpi2 || '—';
      $('kpi3').textContent = payload.kpi3 || '—';
    } catch (err) {
      console.error('renderCharts error', err);
    }
  }

  function drawSpark(values = []) {
    if (!sparklineEl) return;
    const w = 200, h = 40;
    const max = Math.max(...values), min = Math.min(...values);
    if (max === min) { sparklineEl.innerHTML = ''; return; }
    const pts = values.map((v,i) => {
      const x = (i/(values.length-1))*w;
      const y = h - ((v - min)/(max-min))*h;
      return `${x},${y}`;
    }).join(' ');
    sparklineEl.innerHTML = `<polyline points="${pts}" fill="none" stroke="#1e90ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  // ---------- Geolocation ----------
  enableGeoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    nearbyList.innerHTML = '<li class="muted">Finding projects near you…</li>';
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res = await callAPI(`/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`, { method: 'GET' });
        if (!res.ok) throw new Error('nearby failed');
        const list = await res.json();
        nearbyList.innerHTML = '';
        list.forEach(p => {
          const li = document.createElement('li'); li.textContent = `${p.title} • ${p.distance || '—'}`;
          nearbyList.appendChild(li);
        });
      } catch (err) {
        console.error('Nearby error', err);
        nearbyList.innerHTML = '<li class="muted">Could not find nearby projects.</li>';
      }
    }, (err) => {
      console.warn('geo err', err); nearbyList.innerHTML = '<li class="muted">Location permission denied.</li>';
    }, { timeout: 15000 });
  });

  // ---------- Search (live) ----------
  let searchTimer = 0;
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    clearTimeout(searchTimer);
    if (!q) { searchResults.style.display = 'none'; return; }
    searchTimer = setTimeout(() => liveSearch(q), 350);
  });
  searchBtn.addEventListener('click', () => liveSearch(searchInput.value.trim()));

  async function liveSearch(q) {
    if (!q) return;
    searchResults.innerHTML = '<li class="muted">Searching…</li>'; searchResults.style.display = 'block'; searchResults.setAttribute('aria-hidden', 'false');
    try {
      const res = await callAPI(`/search?q=${encodeURIComponent(q)}`, { method: 'GET' });
      if (!res.ok) throw new Error('search failed');
      const items = await res.json();
      if (!items.length) { searchResults.innerHTML = '<li class="muted">No results</li>'; return; }
      searchResults.innerHTML = ''; items.forEach(it => {
        const li = document.createElement('li');
        li.textContent = `${it.name || it.title} • ${it.type || it.skill || ''}`;
        li.addEventListener('click', () => {
          window.location.href = `/public/profile.html?id=${encodeURIComponent(it.id)}`;
        });
        searchResults.appendChild(li);
      });
    } catch (err) {
      console.error('Search error', err);
      searchResults.innerHTML = '<li class="muted">Search failed</li>';
    }
  }

  // ---------- UI wiring ----------
  function wireUi() {
    // infinite scroll
    window.addEventListener('scroll', () => {
      if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 220)) loadFeed();
    });

    // logout button
    $('logout').addEventListener('click', async () => {
      try { await callAPI('/auth/logout', { method: 'POST' }); } catch(e){} finally { localStorage.removeItem('token'); window.location.href = '/public/login.html'; }
    });

    // sidebar create post
    $('createPostSidebar').addEventListener('click', () => { window.scrollTo({ top: 200, behavior: 'smooth' }); $('composeText').focus(); });

    // FAB focus composer
    $('fab').addEventListener('click', () => { $('composeText').focus(); });

    // close search when clicking outside
    document.addEventListener('click', (ev) => {
      if (!qs('.search').contains(ev.target)) { searchResults.style.display = 'none'; searchResults.setAttribute('aria-hidden','true'); }
    });
  }

  // ---------- Websocket (optional) ----------
  function wireRealtime() {
    // If socket.io client is loaded and server supports it
    try {
      if (window.io) {
        window.socket = io(window.location.origin, { auth: { token: TOKEN } });
        window.socket.on('connect', () => console.info('socket connected'));
        window.socket.on('new-post', (post) => feed.prepend(renderPost(post)));
        window.socket.on('update-post', (post) => {
          const el = feed.querySelector(`[data-id="${post.id}"]`);
          if (el) {
            const cnt = el.querySelector('.approve-btn .count'); if (cnt) cnt.textContent = post.approvals || 0;
          }
        });
      }
    } catch (err) { console.warn('socket not available', err); }
  }

  // escape helper
  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // convenience selector for IDs
  function $(id) { return document.getElementById(id); }

  // start
  init();

})();
