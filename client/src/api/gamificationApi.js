import api from "../lib/axiosInstance";

export const gamificationApi = {
  leaderboard: (limit) => api.get("/gamification/leaderboard", { params: { limit } }).then((r) => r.data.data.users),
};
