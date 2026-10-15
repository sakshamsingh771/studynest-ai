import api from "../lib/axiosInstance";

export const dashboardApi = {
  overview: () => api.get("/dashboard/overview").then((r) => r.data.data),
};
