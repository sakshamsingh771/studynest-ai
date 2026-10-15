import api from "../lib/axiosInstance";

export const notificationsApi = {
  list: () => api.get("/notifications").then((r) => r.data.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch("/notifications/read-all").then((r) => r.data),
};
