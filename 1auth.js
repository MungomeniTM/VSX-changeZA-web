const API_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
  // REGISTER
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const role = document.getElementById("role").value;

      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await res.json();
        if (res.ok) {
          alert("Registration successful! Please login.");
          window.location.href = "login.html";
        } else {
          alert(data.detail || "Registration failed");
        }
      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    });
  }

  // LOGIN
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.location.href = "dashboard.html";
        } else {
          alert(data.detail || "Login failed");
        }
      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    });
  }
});