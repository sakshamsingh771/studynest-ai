import api from "../lib/axiosInstance";

export const marketplaceApi = {
  initiatePurchase: (noteId, couponCode) =>
    api.post(`/notes/${noteId}/purchase`, { couponCode }).then((r) => r.data.data),
  verifyPurchase: (payload) => api.post("/marketplace/verify-payment", payload).then((r) => r.data.data),
  getWallet: () => api.get("/marketplace/wallet").then((r) => r.data.data),
  requestWithdrawal: (amount) => api.post("/marketplace/wallet/withdraw", { amount }).then((r) => r.data.data),
  myPurchases: () => api.get("/marketplace/my-purchases").then((r) => r.data.data.purchases),
  mySales: () => api.get("/marketplace/my-sales").then((r) => r.data.data.sales),
  purchaseWithWallet: (noteId, couponCode) =>
    api.post(`/notes/${noteId}/purchase/wallet`, { couponCode }).then((r) => r.data.data.purchase),
};
