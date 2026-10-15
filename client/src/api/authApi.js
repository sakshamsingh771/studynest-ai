import api from "../lib/axiosInstance";

export const authApi = {
  signup: (payload) => api.post("/auth/signup", payload).then((r) => r.data.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data.data),
  refresh: () => api.post("/auth/refresh").then((r) => r.data.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  me: () => api.get("/users/me").then((r) => r.data.data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (token, newPassword) => api.post("/auth/reset-password", { token, newPassword }).then((r) => r.data),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }).then((r) => r.data),
  resendVerification: () => api.post("/auth/resend-verification").then((r) => r.data),
};
