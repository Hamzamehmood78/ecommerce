
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 70000,
});

// Admin Panel ke pages admin ke token se, baaqi sab dukan ke customer ke token se baat karte hain
const sessionKey = () => (/^\/admin(\/|$)/.test(window.location.pathname) ? "adminInfo" : "userInfo");

// Har request ke saath sahi hisse ka login token laga do
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(sessionKey());
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // localStorage kharab ho to bhi request chalti rahe
  }
  return config;
});

// Error se user-friendly message nikalne ke liye
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) {
    return "Cannot reach the server. Please check that the backend is running.";
  }
  return error.message || "Something went wrong";
};

export default api;