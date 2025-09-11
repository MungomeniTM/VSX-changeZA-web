// === VSXchangeZA Dashboard JS ===
// Author: Top 0.1% Full Stack Style
// Purpose: Modular, responsive, futuristic dashboard logic
// Handles: user info, posts, feed, analytics, sidebar, FAB

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const avatar = document.getElementById('avatar');

  const composeText = document.getElementById('composeText');
  const composeFile = document.getElementById('composeFile');
  const fileName = document.getElementById('fileName');
  const postBtn = document.getElementById('postBtn');
  const previewBtn = document.getElementById('previewBtn');
  const previewContainer = document.getElementById('preview');
  const previewMedia = document.getElementById('previewMedia');

  const feedContainer = document.getElementById('feed');
  const trendingList = document.getElementById('trendingList');
  const nearbyList = document.getElementById('nearbyList');

  const skillsChartEl = document.getElementById('skillsChart');
  const farmChartEl = document.getElementById('farmChart');
  const sparkline = document.getElementById('sparkline');

  const logoutBtn = document.getElementById('logout');
  const fabBtn = document.getElementById('fab');

  // Sidebar & Chips
  const chipCollaborate = document.getElementById('chipCollaborate');
  const chipVerify = document.getElementById('chipVerify');

  // State
  let feed = [];
  let user = { name: 'User', role: 'Member', avatar: '👤' };
  let trendingSkills = [];
  let nearbyProjects = [];

  // ==============================
  // Helper Functions
  // ==============================
  const createElement = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key.startsWith('on') && typeof val === 'function') el.addEventListener(key.slice(2), val);
      else el.setAttribute(key, val);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child instanceof Node) el.appendChild(child);
    });
    return el;
  };

  const formatFileName = (file) => file ? file.name : 'No file chosen';

  // ==============================
  // User Info
  // ==============================
  const renderUser = () => {
    userName.textContent = user.name;
    userRole.textContent = `${user.role} • Location`;
    avatar.textContent = user.avatar;
  };

  // ==============================
  // Compose & Preview
  // ==============================
  composeFile.addEventListener('change', () => {
    fileName.textContent = formatFileName(composeFile.files[0]);
  });

  previewBtn.addEventListener('click', () => {
    const file = composeFile.files[0];
    if (!file) return alert('No file selected');
    const url = URL.createObjectURL(file);
    previewMedia.innerHTML = '';
    if (file.type.startsWith('image/')) previewMedia.appendChild(createElement('img', { src: url, alt: 'Preview' }));
    else if (file.type.startsWith('video/')) previewMedia.appendChild(createElement('video', { src: url, controls: true }));
    previewContainer.hidden = false;
  });

  postBtn.addEventListener('click', async () => {
    const content = composeText.value.trim();
    if (!content && !composeFile.files[0]) return alert('Cannot post empty content.');
    // Append to feed (simulation)
    const post = { user: user.name, avatar: user.avatar, content, file: composeFile.files[0] ? URL.createObjectURL(composeFile.files[0]) : null, timestamp: new Date() };
    feed.unshift(post);
    renderFeed();
    composeText.value = '';
    composeFile.value = '';
    fileName.textContent = 'No file chosen';
    previewContainer.hidden = true;
  });

  // ==============================
  // Feed Rendering
  // ==============================
  const renderFeed = () => {
    feedContainer.innerHTML = '';
    feed.forEach(post => {
      const card = createElement('article', { class: 'card post' },
        createElement('div', { class: 'post-header' },
          createElement('div', { class: 'avatar' }, post.avatar),
          createElement('strong', {}, post.user),
          createElement('span', { class: 'timestamp' }, post.timestamp.toLocaleString())
        ),
        createElement('p', { class: 'post-content' }, post.content),
        post.file ? createElement('div', { class: 'post-media' }, 
          post.file.endsWith('.mp4') ? createElement('video', { src: post.file, controls: true }) : createElement('img', { src: post.file, alt: 'Post media' })
        ) : null
      );
      feedContainer.appendChild(card);
    });
  };

  // ==============================
  // Trending Skills
  // ==============================
  const renderTrendingSkills = () => {
    trendingList.innerHTML = '';
    trendingSkills.forEach(skill => {
      trendingList.appendChild(createElement('li', {}, skill));
    });
  };

  // ==============================
  // Nearby Projects
  // ==============================
  const renderNearbyProjects = () => {
    nearbyList.innerHTML = '';
    if (!nearbyProjects.length) nearbyList.innerHTML = '<li class="muted">Enable location to see projects around you.</li>';
    nearbyProjects.forEach(p => nearbyList.appendChild(createElement('li', {}, p)));
  };

  // ==============================
  // Charts
  // ==============================
  const renderCharts = () => {
    new Chart(skillsChartEl, {
      type: 'bar',
      data: { labels: ['Plumbing','Electrical','Farming','Coding'], datasets: [{ label: 'Skill Demand', data: [12,19,7,15], backgroundColor: 'var(--color-blue)' }]},
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
    new Chart(farmChartEl, {
      type: 'line',
      data: { labels: ['Jan','Feb','Mar','Apr'], datasets: [{ label: 'Farm Yield', data: [10,15,8,12], borderColor: 'var(--color-light-green)', backgroundColor: 'transparent' }]},
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  };

  // ==============================
  // Sparkline
  // ==============================
  const renderSparkline = () => {
    const svgNS = "http://www.w3.org/2000/svg";
    const points = [5,10,8,12,7,15,10];
    sparkline.innerHTML = '';
    const poly = document.createElementNS(svgNS, 'polyline');
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', 'var(--color-blue)');
    poly.setAttribute('stroke-width', 2);
    const pts = points.map((v,i) => `${i * 30},${40 - v*2}`).join(' ');
    poly.setAttribute('points', pts);
    sparkline.appendChild(poly);
  };

  // ==============================
  // Floating Action Button
  // ==============================
  fabBtn.addEventListener('click', () => document.getElementById('composeText').focus());

  // ==============================
  // Logout
  // ==============================
  logoutBtn.addEventListener('click', () => alert('Logging out…'));

  // ==============================
  // Chips
  // ==============================
  chipCollaborate.addEventListener('click', () => alert('Collaborate action triggered'));
  chipVerify.addEventListener('click', () => alert('Verification action triggered'));

  // ==============================
  // Initial Render
  // ==============================
  renderUser();
  renderFeed();
  renderTrendingSkills();
  renderNearbyProjects();
  renderCharts();
  renderSparkline();
});
