// frontend/src/services/api.js
// Centralized API client for VSXchangeZA
// Fixed for reliability, mobile compatibility, and no 404s

const API_BASE_URL = window.location.hostname.includes("localhost")
  ? "http://127.0.0.1:8000/api" // Local FastAPI backend
  : "https://api.vsxchangeza.com/api"; // Production backend (replace with your domain)

/**
 * Helper: get auth token
 */
function getAuthToken() {
  return localStorage.getItem("vsx_token");
}

/**
 * Helper: build request headers
 */
function buildHeaders(authRequired = true) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (authRequired) {
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Core request wrapper
 */
async function apiRequest(endpoint, method = "GET", data = null, authRequired = true) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: buildHeaders(authRequired),
    };
    if (data) options.body = JSON.stringify(data);

    const res = await fetch(url, options);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error ${res.status}: ${errText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API Request Failed:", error.message);
    throw error;
  }
}

/**
 * AUTH endpoints
 */
export const AuthAPI = {
  register: (payload) => apiRequest("/auth/register", "POST", payload, false),
  login: (payload) => apiRequest("/auth/login", "POST", payload, false),
  me: () => apiRequest("/auth/me", "GET"),
};

/**
 * USER endpoints
 */
export const UserAPI = {
  getProfile: (userId) => apiRequest(`/users/${userId}`, "GET"),
  updateProfile: (userId, payload) => apiRequest(`/users/${userId}`, "PUT", payload),
};

/**
 * POSTS endpoints
 */
export const PostAPI = {
  create: (payload) => apiRequest("/posts", "POST", payload),
  feed: (page = 1) => apiRequest(`/posts?page=${page}`, "GET"),
  approve: (postId) => apiRequest(`/posts/${postId}/approve`, "POST"),
  comment: (postId, payload) => apiRequest(`/posts/${postId}/comment`, "POST", payload),
};

/**
 * FARMS endpoints
 */
export const FarmAPI = {
  list: () => apiRequest("/farms", "GET"),
  create: (payload) => apiRequest("/farms", "POST", payload),
};

/**
 * ANALYTICS endpoints
 */
export const AnalyticsAPI = {
  skills: () => apiRequest("/analytics/skills", "GET"),
  farms: () => apiRequest("/analytics/farms", "GET"),
};
