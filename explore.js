// explore.js — Cosmic Explore Edition

const $ = id => document.getElementById(id);
const root = document.documentElement;

// ========== Theme Toggle ==========
(function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  root.dataset.theme = saved;
  const toggle = $('toggleTheme');
  toggle.textContent = saved === 'dark' ? '🌗' : '☀️';
  toggle.onclick = () => {
    const current = root.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    toggle.textContent = next === 'dark' ? '🌗' : '☀️';
    localStorage.setItem('theme', next);
  };
})();

// ========== Explore Search ==========
$('exploreSearch').addEventListener('click', async () => {
  const skill = $('exploreSkill').value.trim();
  const loc = $('exploreLocation').value.trim();
  if (!skill && !loc) return alert('Please enter skill or location');

  $('resultsInfo').textContent = `Searching ${skill || ''} ${loc ? 'in ' + loc : ''}...`;

  // Simulated data for now
  const results = [
    { name: "John M.", skill: "Electrician", location: "Pretoria" },
    { name: "Lerato K.", skill: "Plumber", location: "Johannesburg" },
    { name: "Tshidzula M.", skill: "Full Stack Dev", location: "Limpopo" }
  ];

  const grid = $('results');
  grid.innerHTML = '';
  for (const r of results) {
    const card = document.importNode($('userCardTpl').content, true);
    card.querySelector('.name').textContent = r.name;
    card.querySelector('.loc').textContent = r.location;
    card.querySelector('.skills').textContent = r.skill;
    grid.appendChild(card);
  }

  $('resultsInfo').textContent = `${results.length} results found`;
});