// ===============================
// VSXchangeZA Dashboard JS — Real API Integration
// ===============================

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
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

  let currentUser = {};
  let feed = [];
  let trendingSkills = [];
  let nearbyProjects = [];
  let chartsData = {};

  // ===============================
  // Helpers
  // ===============================
  const createElement = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    });
    children.forEach(c => typeof c === 'string' ? el.appendChild(document.createTextNode(c)) : el.appendChild(c));
    return el;
  };

  const formatFileName = file => file ? file.name : 'No file chosen';

  const fetchJSON = async (url, options={}) => {
    try {
      const res = await fetch(url, {...options, credentials:'include'});
      if(!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    } catch(err) {
      console.error('API Error:', err);
      alert('Something went wrong. Please try again.');
      return null;
    }
  };

  // ===============================
  // User
  // ===============================
  const loadUser = async () => {
    const data = await fetchJSON('/api/user/me');
    if(data){
      currentUser = data;
      userName.textContent = data.name;
      userRole.textContent = `${data.role} • ${data.location || 'Unknown'}`;
      avatar.textContent = data.avatar || '👤';
    }
  };

  // ===============================
  // Feed
  // ===============================
  const loadFeed = async () => {
    const posts = await fetchJSON('/api/posts');
    if(posts) feed = posts;
    renderFeed();
  };

  const renderFeed = () => {
    feedContainer.innerHTML = '';
    feed.forEach(post => {
      const card = createElement('article', {class:'card post'},
        createElement('div', {class:'post-header'},
          createElement('div', {class:'avatar'}, post.avatar),
          createElement('strong', {}, post.user),
          createElement('span', {class:'timestamp'}, new Date(post.timestamp).toLocaleString())
        ),
        createElement('p', {class:'post-content'}, post.content),
        post.file ? createElement('div', {class:'post-media'},
          post.file.endsWith('.mp4') ? createElement('video',{src:post.file,controls:true}) : createElement('img',{src:post.file,alt:'Post media'})
        ) : null
      );
      feedContainer.appendChild(card);
    });
  };

  const createPost = async () => {
    const content = composeText.value.trim();
    if(!content && !composeFile.files[0]) return alert('Cannot post empty content.');

    const formData = new FormData();
    formData.append('content', content);
    if(composeFile.files[0]) formData.append('file', composeFile.files[0]);

    const post = await fetchJSON('/api/posts',{method:'POST', body: formData});
    if(post){
      feed.unshift(post);
      renderFeed();
      composeText.value = '';
      composeFile.value = '';
      fileName.textContent = 'No file chosen';
      previewContainer.hidden = true;
    }
  };

  // ===============================
  // Trending Skills
  // ===============================
  const loadTrendingSkills = async () => {
    const skills = await fetchJSON('/api/skills/trending');
    if(skills) trendingSkills = skills;
    trendingList.innerHTML = '';
    trendingSkills.forEach(skill => trendingList.appendChild(createElement('li', {}, skill)));
  };

  // ===============================
  // Nearby Projects
  // ===============================
  const loadNearbyProjects = () => {
    if(!navigator.geolocation) return alert('Geolocation not supported.');
    navigator.geolocation.getCurrentPosition(async pos => {
      const {latitude: lat, longitude: lng} = pos.coords;
      const projects = await fetchJSON(`/api/projects/nearby?lat=${lat}&lng=${lng}`);
      if(projects) nearbyProjects = projects;
      nearbyList.innerHTML = '';
      nearbyProjects.forEach(p => nearbyList.appendChild(createElement('li', {}, p.name)));
    }, err => alert('Location permission denied.'));
  };

  // ===============================
  // Analytics
  // ===============================
  const loadAnalytics = async () => {
    const data = await fetchJSON('/api/analytics');
    if(!data) return;
    chartsData = data;

    new Chart(skillsChartEl, {
      type:'bar',
      data:{
        labels: Object.keys(data.skillDemand),
        datasets:[{label:'Skill Demand', data:Object.values(data.skillDemand), backgroundColor:'var(--color-blue)'}]
      },
      options:{responsive:true, plugins:{legend:{display:false}}}
    });

    new Chart(farmChartEl,{
      type:'line',
      data:{
        labels:Object.keys(data.farmGrowth),
        datasets:[{label:'Farm Growth',data:Object.values(data.farmGrowth),borderColor:'var(--color-light-green)',backgroundColor:'transparent'}]
      },
      options:{responsive:true, plugins:{legend:{display:false}}}
    });

    // Sparkline
    const svgNS = "http://www.w3.org/2000/svg";
    sparkline.innerHTML = '';
    const poly = document.createElementNS(svgNS,'polyline');
    poly.setAttribute('fill','none');
    poly.setAttribute('stroke','var(--color-blue)');
    poly.setAttribute('stroke-width',2);
    const points = Object.values(data.avgApprovals);
    poly.setAttribute('points', points.map((v,i)=>`${i*30},${40-v*2}`).join(' '));
    sparkline.appendChild(poly);
  };

  // ===============================
  // Event Listeners
  // ===============================
  composeFile.addEventListener('change',()=>fileName.textContent=formatFileName(composeFile.files[0]));
  previewBtn.addEventListener('click',()=>{
    const file=composeFile.files[0];
    if(!file)return alert('No file selected');
    const url=URL.createObjectURL(file);
    previewMedia.innerHTML='';
    if(file.type.startsWith('image/')) previewMedia.appendChild(createElement('img',{src:url,alt:'Preview'}));
    else if(file.type.startsWith('video/')) previewMedia.appendChild(createElement('video',{src:url,controls:true}));
    previewContainer.hidden=false;
  });
  postBtn.addEventListener('click', createPost);
  fabBtn.addEventListener('click',()=>composeText.focus());
  logoutBtn.addEventListener('click',async ()=>await fetchJSON('/api/auth/logout',{method:'POST'}));
  chipCollaborate.addEventListener('click',()=>alert('Collaborate action triggered'));
  chipVerify.addEventListener('click',()=>alert('Verification action triggered'));
  document.getElementById('enableGeo').addEventListener('click', loadNearbyProjects);

  // ===============================
  // Initialize
  // ===============================
  await loadUser();
  await loadFeed();
  await loadTrendingSkills();
  await loadAnalytics();
});
