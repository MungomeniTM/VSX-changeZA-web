import { apiRequest } from "../services/api.js";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  // Handle registration
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const res = await apiRequest("/auth/register", "POST", {
        name,
        email,
        password
      });

      if (res?.token) {
        localStorage.setItem("token", res.token);
        window.location.href = "dashboard.html";
      } else {
        alert(res?.detail || "Registration failed");
      }
    });
  }

  // Handle login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const res = await apiRequest("/auth/login", "POST", {
        email,
        password
      });

      if (res?.token) {
        localStorage.setItem("token", res.token);
        window.location.href = "dashboard.html";
      } else {
        alert(res?.detail || "Login failed");
      }
    });
  }
});