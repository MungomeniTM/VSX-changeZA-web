// ===============================
// VSXchangeZA Dashboard JS — Cosmic Real-Time & Infinite Feed
// ===============================

document.addEventListener('DOMContentLoaded', async () => {
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const avatar = document.getElementById('avatar');
  const feedContainer = document.getElementById('feed');
  const trendingList = document.getElementById('trendingList');
  const nearbyList = document.getElementById('nearbyList');
  const composeText = document.getElementById('composeText');
  const composeFile = document.getElementById('composeFile');
  const fileName = document.getElementById('fileName');
  const postBtn = document.getElementById('postBtn');
  const previewBtn = document.getElementById('previewBtn');
  const previewContainer = document.getElementById('preview');
  const previewMedia = document.getElementById('previewMedia');
  const logoutBtn = document.getElementById('logout');
  const fabBtn = document.getElementById('fab');
  const chipCollaborate = document.getElementById('chipCollaborate');
  const chipVerify = document.getElementById('chipVerify');
  const skillsChartEl = document.getElementById('skillsChart');
  const farmChartEl = document.getElementById('farmChart');
  const sparkline = document.getElementById('sparkline');
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const topnav = document.querySelector('.topnav');
  const loader = document.getElementById('loader');

  // ===== State =====
  let currentUser = {};
  let feed = [];
  let trendingSkills = [];
  let nearbyProjects = [];
  let chartsData = {};
  let feedPage = 0;
  let loadingFeed = false;
  const FEED_PAGE_SIZE = 10;

  // ===== Helper Functions =====
  const createElement = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    });
    children.forEach(c => typeof c === 'string' ? el.appendChild(document.createTextNode(c)) : el.appendChild(c));
    return el;
  };

  const formatFileName = file => file ? file.name : 'No file chosen';

  const fetchJSON = async (url, options = {}) => {
    try {
      const res = await fetch(url, { ...options, credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error('API Error:', err);
      return null;
    }
  };

  // ===== User =====
  const loadUser = async () => {
    const data = await fetchJSON('/api/user/me');
    if (data) {
      currentUser = data;
      userName.textContent = data.name;
      userRole.textContent = `${data.role} • ${data.location || 'Unknown'}`;
      avatar.textContent = data.avatar || '👤';
    }
  };

  // ===== Feed =====
  const renderPost = (post) => {
    const card = createElement('article', { class: 'card post', 'data-id': post.id },
      createElement('div', { class: 'post-header' },
        createElement('div', { class: 'avatar' }, post.avatar),
        createElement('strong', {}, post.user),
        createElement('span', { class: 'timestamp' }, new Date(post.timestamp).toLocaleString())
      ),
      createElement('p', { class: 'post-content' }, post.content),
      post.file ? createElement('div', { class: 'post-media' },
        post.file.endsWith('.mp4') ? createElement('video', { src: post.file, controls: true }) : createElement('img', { src: post.file, alt: 'Post media' })
      ) : null,
      createElement('div', { class: 'post-actions' },
        createElement('button', { class: 'btn ghost approve-btn', onClick: () => approvePost(post.id) }, `❤️🤝 ${post.approvals || 0}`),
        createElement('button', { class: 'btn ghost comment-btn', onClick: () => toggleCommentBox(post.id) }, `💬 ${post.comments?.length || 0}`),
        createElement('button', { class: 'btn ghost share-btn', onClick: () => sharePost(post.id) }, `🔁 ${post.shares || 0}`),
        createElement('button', { class: 'btn ghost collaborate-btn', onClick: () => alert('Collaborate triggered') }, `🤝`)
      ),
      createElement('div', { class: 'comment-box', id: `comments-${post.id}`, hidden: true },
        createElement('textarea', { placeholder: 'Write a comment…', rows: 2, id: `comment-input-${post.id}` }),
        createElement('button', { class: 'btn primary', onClick: () => postComment(post.id) }, 'Comment')
      )
    );
    feedContainer.appendChild(card);
  };

  const renderFeed = (append = false) => {
    if (!append) feedContainer.innerHTML = '';
    feed.forEach(post => renderPost(post));
  };

  const loadFeed = async () => {
    if (loadingFeed) return;
    loadingFeed = true;
    loader.style.display = 'block';
    const posts = await fetchJSON(`/api/posts?page=${feedPage}&size=${FEED_PAGE_SIZE}`);
    if (posts) {
      feedPage++;
      feed = feed.concat(posts);
      renderFeed(true);
    }
    loadingFeed = false;
    loader.style.display = 'none';
  };

  // ===== Infinite Scroll =====
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      loadFeed();
    }
  });

  // ===== Post Actions =====
  const createPost = async () => {
    const content = composeText.value.trim();
    if (!content && !composeFile.files[0]) return alert('Cannot post empty content.');
    const formData = new FormData();
    formData.append('content', content);
    if (composeFile.files[0]) formData.append('file', composeFile.files[0]);
    const post = await fetchJSON('/api/posts', { method: 'POST', body: formData });
    if (post) {
      feed.unshift(post);
      renderFeed();
      composeText.value = '';
      composeFile.value = '';
      fileName.textContent = 'No file chosen';
      previewContainer.hidden = true;
      socket.emit('new-post', post);
    }
  };

  const approvePost = async (id) => {
    const post = await fetchJSON(`/api/posts/${id}/approve`, { method: 'POST' });
    if (post) updatePost(post);
  };

  const toggleCommentBox = (id) => {
    const box = document.getElementById(`comments-${id}`);
    box.hidden = !box.hidden;
  };

  const postComment = async (id) => {
    const input = document.getElementById(`comment-input-${id}`);
    const content = input.value.trim();
    if (!content) return;
    const comment = await fetchJSON(`/api/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }), headers: { 'Content-Type': 'application/json' } });
    if (comment) {
      input.value = '';
      socket.emit('new-comment', comment);
    }
  };

  const sharePost = (id) => alert('Share menu triggered');

  const updatePost = (post) => {
    const card = feedContainer.querySelector(`.post[data-id="${post.id}"]`);
    if (!card) return;
    card.querySelector('.approve-btn').textContent = `❤️🤝 ${post.approvals || 0}`;
    card.querySelector('.comment-btn').textContent = `💬 ${post.comments?.length || 0}`;
    card.querySelector('.share-btn').textContent = `🔁 ${post.shares || 0}`;
  };

  // ===== Trending Skills =====
  const loadTrendingSkills = async () => {
    const skills = await fetchJSON('/api/skills/trending');
    if (skills) trendingSkills = skills;
    trendingList.innerHTML = '';
    trendingSkills.forEach(skill => trendingList.appendChild(createElement('li', {}, skill)));
  };

  // ===== Nearby Projects =====
  const loadNearbyProjects = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const projects = await fetchJSON(`/api/projects/nearby?lat=${lat}&lng=${lng}`);
      if (projects) nearbyProjects = projects;
      nearbyList.innerHTML = '';
      nearbyProjects.forEach(p => nearbyList.appendChild(createElement('li', {}, p.name)));
    }, () => alert('Location permission denied.'));
  };

  // ===== Analytics =====
  const loadAnalytics = async () => {
    const data = await fetchJSON('/api/analytics');
    if (!data) return;
    chartsData = data;

    new Chart(skillsChartEl, {
      type: 'bar',
      data: {
        labels: Object.keys(data.skillDemand),
        datasets: [{ label: 'Skill Demand', data: Object.values(data.skillDemand), backgroundColor: 'var(--blue)' }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    new Chart(farmChartEl, {
      type: 'line',
      data: {
        labels: Object.keys(data.farmGrowth),
        datasets: [{ label: 'Farm Growth', data: Object.values(data.farmGrowth), borderColor: 'var(--light-green)', backgroundColor: 'transparent', tension:0.3 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const svgNS = "http://www.w3.org/2000/svg";
    sparkline.innerHTML = '';
    const poly = document.createElementNS(svgNS, 'polyline');
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', 'var(--blue)');
    poly.setAttribute('stroke-width', 2);
    const points = Object.values(data.avgApprovals);
    poly.setAttribute('points', points.map((v,i)=>`${i*30},${40-v*2}`).join(' '));
    sparkline.appendChild(poly);
  };

  // ===== Event Listeners =====
  composeFile.addEventListener('change', () => fileName.textContent = formatFileName(composeFile.files[0]));
  previewBtn.addEventListener('click', () => {
    const file = composeFile.files[0];
    if (!file) return alert('No file selected');
    const url = URL.createObjectURL(file);
    previewMedia.innerHTML = '';
    if (file.type.startsWith('image/')) previewMedia.appendChild(createElement('img', { src: url, alt: 'Preview' }));
    else if (file.type.startsWith('video/')) previewMedia.appendChild(createElement('video', { src: url, controls: true }));
    previewContainer.hidden = false;
  });
  postBtn.addEventListener('click', createPost);
  fabBtn.addEventListener('click', () => composeText.focus());
  logoutBtn.addEventListener('click', async () => await fetchJSON('/api/auth/logout', { method: 'POST' }));
  chipCollaborate.addEventListener('click', () => alert('Collaborate action triggered'));
  chipVerify.addEventListener('click', () => alert('Verification action triggered'));
  document.getElementById('enableGeo').addEventListener('click', loadNearbyProjects);
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    topnav.classList.toggle('active');
    hamburger.classList.toggle('open');
  });

  // ===== WebSocket Setup =====
  const socket = io(); // assumes socket.io included on your page/server
  socket.on('new-post', post => { feed.unshift(post); renderFeed(); });
  socket.on('update-post', post => updatePost(post));
  socket.on('new-comment', comment => {
    const card = feedContainer.querySelector(`.post[data-id="${comment.postId}"]`);
    if (card) {
      const btn = card.querySelector('.comment-btn');
      const count = parseInt(btn.textContent.replace(/\D/g,'')) + 1;
      btn.textContent = `💬 ${count}`;
    }
  });

  // ===== Init =====
  await loadUser();
  await loadFeed();
  await loadTrendingSkills();
  await loadAnalytics();
});
