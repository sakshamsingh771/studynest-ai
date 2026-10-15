import api from "../lib/axiosInstance";

export const subscriptionApi = {
  listPlans: () => api.get("/subscription/plans").then((r) => r.data.data.plans),
  initiate: (plan) => api.post("/subscription/initiate", { plan }).then((r) => r.data.data),
  verify: (payload) => api.post("/subscription/verify-payment", payload).then((r) => r.data.data),
  myStatus: () => api.get("/subscription/my-status").then((r) => r.data.data),
  billingHistory: () => api.get("/subscription/billing-history").then((r) => r.data.data.history),
};
