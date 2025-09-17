import { apiRequest } from "../services/api.js";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const passwordMatch = document.getElementById("passwordMatch");
  const strengthBars = document.querySelectorAll(".strength-bar");

  // ----- Password strength scoring -----
  function checkPasswordStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[\W_]/.test(pwd)) score++;
    return score; // 0-4
  }

  // ----- Update strength bars -----
  function updateStrengthMeter(score) {
    strengthBars.forEach((bar, index) => {
      bar.className = "strength-bar"; // reset
      if (index < score) {
        switch (score) {
          case 1: bar.classList.add("strength-weak"); break;
          case 2: bar.classList.add("strength-medium"); break;
          case 3: bar.classList.add("strength-strong"); break;
          case 4: bar.classList.add("strength-unbreakable"); break;
        }
      }
    });
  }

  // ----- Real-time password strength -----
  if (password) {
    password.addEventListener("input", () => {
      const score = checkPasswordStrength(password.value);
      updateStrengthMeter(score);
    });
  }

  // ----- Real-time password match -----
  if (confirmPassword) {
    confirmPassword.addEventListener("input", () => {
      if (confirmPassword.value.length === 0) {
        passwordMatch.textContent = "";
        passwordMatch.className = "password-match";
        return;
      }

      if (password.value === confirmPassword.value) {
        passwordMatch.textContent = "✅";
        passwordMatch.className = "password-match success";
      } else {
        passwordMatch.textContent = "❌";
        passwordMatch.className = "password-match error";
      }
    });
  }

  // ----- Handle registration -----
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const passwordValue = password.value;
      const confirmPasswordValue = confirmPassword.value;

      // Confirm passwords match
      if (passwordValue !== confirmPasswordValue) {
        alert("Passwords do not match!");
        return;
      }

      // Optional: enforce minimum strength (score >= 2)
      if (checkPasswordStrength(passwordValue) < 2) {
        alert("Password too weak! Make it stronger.");
        return;
      }

      const res = await apiRequest("/auth/register", "POST", {
        name,
        email,
        password: passwordValue
      });

      if (res?.token) {
        localStorage.setItem("token", res.token);
        window.location.href = "dashboard.html";
      } else {
        alert(res?.detail || "Registration failed");
      }
    });
  }

  // ----- Handle login -----
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const res = await apiRequest("/auth/login", "POST", { email, password });

      if (res?.token) {
        localStorage.setItem("token", res.token);
        window.location.href = "dashboard.html";
      } else {
        alert(res?.detail || "Login failed");
      }
    });
  }
});