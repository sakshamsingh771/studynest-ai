import api from "../lib/axiosInstance";

export const publicApi = {
  // Real, server-computed counts (see server/src/modules/public) — never
  // fabricated numbers. Used by the landing page's stats section.
  getStats: () => api.get("/public/stats").then((r) => r.data.data),
};
