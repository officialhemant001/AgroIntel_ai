/**
 * AgroIntel API Service Layer
 */

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get tokens from storage
const getTokens = () => {
  try {
    const val = localStorage.getItem("tokens");
    return val && val !== "undefined" ? JSON.parse(val) : null;
  } catch (e) {
    return null;
  }
};

// Request interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const tokens = getTokens();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignore 401 on login/register endpoints
    const isAuthEndpoint = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/register");

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const tokens = getTokens();

      if (tokens?.refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, {
            refresh: tokens.refresh,
          });

          const newTokens = { ...tokens, access: data.access };
          localStorage.setItem("tokens", JSON.stringify(newTokens));

          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          localStorage.removeItem("tokens");
          localStorage.removeItem("user");
          window.location.href = "/";
        }
      } else {
        localStorage.removeItem("tokens");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject({ message, status: error.response?.status });
  }
);

// ============================================
// Auth
// ============================================

export async function loginUser(email, password) {
  const { data } = await api.post("/auth/login/", { email, password });
  if (data.success) {
    localStorage.setItem("user", JSON.stringify(data.data.user));
    localStorage.setItem("tokens", JSON.stringify(data.data.tokens));
  }
  return data;
}

export async function registerUser(name, email, password) {
  const { data } = await api.post("/auth/register/", { name, email, password });
  if (data.success) {
    localStorage.setItem("user", JSON.stringify(data.data.user));
    localStorage.setItem("tokens", JSON.stringify(data.data.tokens));
  }
  return data;
}

export const logoutUser = () => {
  localStorage.removeItem("tokens");
  localStorage.removeItem("user");
  window.location.href = "/";
};

// ============================================
// Crop Scan
// ============================================

export async function scanCrop(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const { data } = await api.post("/scan/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return data;
}

export async function getScanHistory(limit = 20) {
  const { data } = await api.get(`/scan/history/?limit=${limit}`);
  return data;
}

export async function getScanDetail(scanId) {
  const { data } = await api.get(`/scan/${scanId}/`);
  return data;
}

export async function getScanStats() {
  const { data } = await api.get("/scan/stats/");
  return data;
}

// ============================================
// AI Chat
// ============================================

export async function sendChatMessage(message, language = "en", sessionId = "") {
  const { data } = await api.post("/chat/", {
    message,
    language,
    session_id: sessionId,
  });
  return data;
}

export async function getChatHistory(sessionId = "", limit = 50) {
  const { data } = await api.get(`/chat/history/`, {
    params: { session_id: sessionId, limit }
  });
  return data;
}

// ============================================
// Weather
// ============================================

export async function getWeather(city = "Lucknow") {
  const { data } = await api.get(`/weather/`, { params: { city } });
  return data;
}

// ============================================
// Agriculture Database — Search & Query
// ============================================

export async function getDiseases(plant = "", severity = "") {
  const { data } = await api.get("/db/diseases/", { params: { plant, severity } });
  return data;
}

export async function getPests(crop = "", damage = "") {
  const { data } = await api.get("/db/pests/", { params: { crop, damage } });
  return data;
}

export async function getFertilizers(type = "", crop = "") {
  const { data } = await api.get("/db/fertilizers/", { params: { type, crop } });
  return data;
}

export async function getMedicines(type = "", target = "") {
  const { data } = await api.get("/db/medicines/", { params: { type, target } });
  return data;
}

export async function searchDatabase(query) {
  const { data } = await api.get("/db/search/", { params: { q: query } });
  return data;
}

export default api;
