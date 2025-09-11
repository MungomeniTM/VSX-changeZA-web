/**
 * VSXchangeZA — Dashboard JS
 * Top 0.1% Full-Stack Level
 * Handles: Auth, Feed, Posts, Comments, Reactions, Search, Geo, Analytics
 */

import { api } from "./services/api.js";
import { auth } from "./services/auth.js";
import { formatTime } from "./utils/helpers.js";

/* ------------------------------
   GLOBAL STATE
--------------------------------*/
const state = {
  user: null,
  posts: [],
  page: 1,
  hasMore: true,
  isFetching: false,
};

/* ------------------------------
   AUTH & INIT
--------------------------------*/
async function initDashboard() {
  try {
    const token = auth.getToken();
    if (!token) return (window.location.href = "login.html");

    state.user = await api.get("/users/me", token);

    // Render user info
    document.getElementById("userName").textContent = state.user.name;
    document.getElementById("userRole").textContent = `${state.user.role} • ${state.user.location}`;

    // Load feed
    await loadFeed();

    // Wire events
    setupEventListeners();
  } catch (err) {
    console.error("Init failed:", err);
    auth.logout();
  }
}

/* ------------------------------
   FEED HANDLING
--------------------------------*/
async function loadFeed() {
  if (state.isFetching || !state.hasMore) return;
  state.isFetching = true;

  try {
    const { posts, hasMore } = await api.get(
      `/posts?page=${state.page}&limit=10`,
      auth.getToken()
    );

    state.posts.push(...posts);
    state.hasMore = hasMore;
    state.page++;

    posts.forEach(renderPost);
  } catch (err) {
    console.error("Feed error:", err);
  } finally {
    state.isFetching = false;
  }
}

function renderPost(post) {
  const feed = document.getElementById("feed");

  const card = document.createElement("article");
  card.className = "post";
  card.innerHTML = `
    <header>
      <div class="avatar small">${post.user.avatar || "👤"}</div>
      <div>
        <strong>${post.user.name}</strong>
        <p class="muted">${formatTime(post.createdAt)}</p>
      </div>
    </header>

    <p>${post.text}</p>

    ${
      post.media
        ? `<figure><${
            post.mediaType === "video" ? "video controls" : "img"
          } src="${post.media}" alt="media"></figure>`
        : ""
    }

    <div class="actions">
      <button class="approve-btn" data-id="${post.id}">❤️🤝 ${post.approvals}</button>
      <button class="comment-btn" data-id="${post.id}">💬 ${post.comments.length}</button>
      <button class="share-btn" data-id="${post.id}">🔁 Share</button>
    </div>

    <div class="comments" id="comments-${post.id}" hidden></div>
  `;

  feed.appendChild(card);
}

/* ------------------------------
   POST CREATION
--------------------------------*/
async function createPost(text, file) {
  try {
    const form = new FormData();
    form.append("text", text);
    if (file) form.append("media", file);

    const post = await api.post("/posts", form, auth.getToken());
    state.posts.unshift(post);
    document.getElementById("feed").prepend(renderPost(post));
  } catch (err) {
    console.error("Post failed:", err);
  }
}

/* ------------------------------
   COMMENTS
--------------------------------*/
async function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  if (!section) return;

  if (!section.hasChildNodes()) {
    try {
      const comments = await api.get(`/posts/${postId}/comments`, auth.getToken());
      comments.forEach((c) => {
        const el = document.createElement("p");
        el.textContent = `${c.user.name}: ${c.text}`;
        section.appendChild(el);
      });
    } catch (err) {
      console.error("Comments load error:", err);
    }
  }
  section.hidden = !section.hidden;
}

async function addComment(postId, text) {
  try {
    const comment = await api.post(
      `/posts/${postId}/comments`,
      { text },
      auth.getToken()
    );
    const section = document.getElementById(`comments-${postId}`);
    if (section) {
      const el = document.createElement("p");
      el.textContent = `${comment.user.name}: ${comment.text}`;
      section.appendChild(el);
      section.hidden = false;
    }
  } catch (err) {
    console.error("Comment failed:", err);
  }
}

/* ------------------------------
   REACTIONS
--------------------------------*/
async function approvePost(postId, btn) {
  try {
    const result = await api.post(`/posts/${postId}/approve`, {}, auth.getToken());
    btn.textContent = `❤️🤝 ${result.approvals}`;
  } catch (err) {
    console.error("Approve failed:", err);
  }
}

/* ------------------------------
   SHARE
--------------------------------*/
async function sharePost(postId) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
    alert("Post link copied!");
  } catch (err) {
    console.error("Share failed:", err);
  }
}

/* ------------------------------
   SEARCH
--------------------------------*/
async function handleSearch(query) {
  try {
    const results = await api.get(`/search?q=${encodeURIComponent(query)}`, auth.getToken());
    renderSearchResults(results);
  } catch (err) {
    console.error("Search failed:", err);
  }
}

function renderSearchResults(results) {
  const ul = document.querySelector(".search-results");
  ul.innerHTML = "";
  if (!results.length) {
    ul.innerHTML = `<li>No results</li>`;
  } else {
    results.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = `${r.name} • ${r.skill}`;
      li.onclick = () => (window.location.href = `profile.html?id=${r.id}`);
      ul.appendChild(li);
    });
  }
  ul.style.display = "block";
}

/* ------------------------------
   GEOLOCATION
--------------------------------*/
async function enableGeo() {
  if (!navigator.geolocation) return alert("Geolocation not supported.");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude, longitude } = pos.coords;
      const projects = await api.get(
        `/projects/nearby?lat=${latitude}&lng=${longitude}`,
        auth.getToken()
      );
      const list = document.getElementById("nearbyList");
      list.innerHTML = "";
      projects.forEach((p) => {
        const li = document.createElement("li");
        li.textContent = `${p.title} • ${p.distance}km away`;
        list.appendChild(li);
      });
    } catch (err) {
      console.error("Geo error:", err);
    }
  });
}

/* ------------------------------
   EVENTS
--------------------------------*/
function setupEventListeners() {
  // Logout
  document.getElementById("logout").onclick = () => auth.logout();

  // Create post
  document.getElementById("postBtn").onclick = () => {
    const text = document.getElementById("composeText").value;
    const file = document.getElementById("composeFile").files[0];
    if (!text && !file) return alert("Write something or add media.");
    createPost(text, file);
  };

  // Search
  const searchInput = document.getElementById("globalSearch");
  searchInput.addEventListener("input", (e) => {
    if (e.target.value.length > 2) handleSearch(e.target.value);
  });

  // Infinite Scroll
  window.addEventListener("scroll", () => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
      !state.isFetching
    ) {
      loadFeed();
    }
  });

  // Delegate post actions
  document.getElementById("feed").addEventListener("click", (e) => {
    if (e.target.classList.contains("approve-btn")) {
      approvePost(e.target.dataset.id, e.target);
    }
    if (e.target.classList.contains("comment-btn")) {
      toggleComments(e.target.dataset.id);
    }
    if (e.target.classList.contains("share-btn")) {
      sharePost(e.target.dataset.id);
    }
  });

  // Geo
  document.getElementById("enableGeo").onclick = enableGeo;
}

/* ------------------------------
   BOOT
--------------------------------*/
initDashboard();
