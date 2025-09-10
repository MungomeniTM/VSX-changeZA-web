// Mobile menu toggle
const mobileToggle = document.getElementById("mobile-toggle");
const navMenu = document.getElementById("nav-menu");

mobileToggle.addEventListener("click", () => {
  const expanded = mobileToggle.getAttribute("aria-expanded") === "true" || false;
  mobileToggle.setAttribute("aria-expanded", !expanded);
  navMenu.classList.toggle("open");
});

// Scroll reveal for cards and sections
const revealElements = document.querySelectorAll(".reveal");

function reveal() {
  const windowHeight = window.innerHeight;
  revealElements.forEach(el => {
    const elementTop = el.getBoundingClientRect().top;
    if (elementTop < windowHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", reveal);
window.addEventListener("load", reveal);
