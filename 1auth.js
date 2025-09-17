const API_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------
  // REGISTER
  // ---------------------------
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const role = document.getElementById("role").value;

      if (!role) {
        alert("Please select a role");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      console.log("Submitting registration:", { name, email, role });

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await res.json();
        console.log("Register response:", res.status, data);

        if (res.ok) {
          alert("Registration successful! Redirecting to login...");
          window.location.href = "login.html";
        } else {
          alert(`Registration failed: ${data.detail || "Unknown error"}`);
        }

      } catch (err) {
        console.error("Register error:", err);
        alert("Server error: Unable to reach API");
      }
    });
  }

  // ---------------------------
  // LOGIN
  // ---------------------------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      console.log("Attempting login:", { email });

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("Login response:", res.status, data);

        if (res.ok) {
          console.log("Login successful, storing token and user");
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.location.href = "dashboard.html";
        } else if (res.status === 401) {
          alert("Invalid email or password");
        } else {
          alert(`Login failed: ${data.detail || "Unknown error"}`);
        }

      } catch (err) {
        console.error("Login error:", err);
        alert("Server error: Unable to reach API");
      }
    });
  }
});