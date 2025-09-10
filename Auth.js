// 🔹 Shared Register + Login logic
const API_URL = "http://localhost:8000/api";

// REGISTER
document.getElementById("register-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  if (!firstName || !lastName || !email || !password || !role) {
    return alert("⚠️ Please fill in all fields.");
  }

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password, role })
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Registration successful! Redirecting...");
      window.location.href = "dashboard.html";
    } else {
      alert(`❌ ${data.detail || "Registration failed."}`);
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Server error. Please try again.");
  }
});

// LOGIN
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    return alert("⚠️ Email and password are required.");
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.access_token);
      alert("✅ Login successful! Redirecting...");
      window.location.href = "dashboard.html";
    } else {
      alert(`❌ ${data.detail || "Login failed."}`);
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Server error. Please try again.");
  }
});
