import api from "../lib/axiosInstance";

export const walletApi = {
  presets: () => api.get("/wallet/topup/presets").then((r) => r.data.data.presets),
  initiateTopup: (amount) => api.post("/wallet/topup/initiate", { amount }).then((r) => r.data.data),
  verifyTopup: (payload) => api.post("/wallet/topup/verify", payload).then((r) => r.data.data),
};
