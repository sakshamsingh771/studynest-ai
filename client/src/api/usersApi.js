import api from "../lib/axiosInstance";

export const usersApi = {
  me: () => api.get("/users/me").then((r) => r.data.data.user),
  updateProfile: (payload) => api.patch("/users/me", payload).then((r) => r.data.data.user),
};
