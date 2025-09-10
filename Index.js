// Mobile menu toggle
const mobileToggle = document.getElementById("mobile-toggle");
const navMenu = document.querySelector(".nav");

mobileToggle.addEventListener("click", () => {
    navMenu.classList.toggle("hidden");
});
