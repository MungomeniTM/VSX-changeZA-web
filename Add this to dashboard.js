// =======================
// Sidelinks Interactive Panel
// =======================
const sidePanel = document.getElementById("sidePanel");
const linkBtns = document.querySelectorAll(".link-btn");

// Mock data (to be replaced with Python backend)
const userData = {
  skills: ["Welding", "Plumbing", "App Development"],
  listings: ["Service: Plumbing (R500)", "Farm: 20 bags of maize"],
  requests: ["Need an electrician in Pretoria", "Looking for UI designer"]
};

function renderPanel(section) {
  let html = "";

  if (section === "skills") {
    html = `<h5>My Skills</h5><ul>${userData.skills
      .map(skill => `<li>🔹 ${skill}</li>`)
      .join("")}</ul>`;
  }

  if (section === "listings") {
    html = `<h5>My Listings</h5><ul>${userData.listings
      .map(item => `<li>📦 ${item}</li>`)
      .join("")}</ul>`;
  }

  if (section === "requests") {
    html = `<h5>Exchange Requests</h5><ul>${userData.requests
      .map(req => `<li>🔄 ${req}</li>`)
      .join("")}</ul>`;
  }

  sidePanel.innerHTML = html;
  sidePanel.classList.remove("hidden");
}

linkBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    renderPanel(btn.dataset.section);
  });
});

// =======================
// Analytics Tracker Integration
// =======================
function updateAnalytics() {
  document.getElementById("statUsers").textContent = "128";
  document.getElementById("statPosts").textContent = "542";
  document.getElementById("statFarms").textContent = "76";

  document.getElementById("kpi1").textContent = "↑ 42%";
  document.getElementById("kpi2").textContent = "↑ 18%";
  document.getElementById("kpi3").textContent = "120+";
}
updateAnalytics();

// Hook post creation into analytics
document.getElementById("postBtn").addEventListener("click", () => {
  // Example: user adds a new post
  userData.listings.push("🆕 New post from dashboard");
  renderPanel("listings");
  updateAnalytics();
});
