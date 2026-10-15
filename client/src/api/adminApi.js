import api from "../lib/axiosInstance";

export const adminApi = {
  overview: () => api.get("/admin/overview").then((r) => r.data.data),
  listUsers: (params) => api.get("/admin/users", { params }).then((r) => r.data.data.users),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data.data.user),
  listNotes: (params) => api.get("/admin/notes", { params }).then((r) => r.data.data.notes),
  moderateNote: (id, status) => api.patch(`/admin/notes/${id}`, { status }).then((r) => r.data.data.note),
  listWithdrawals: (params) => api.get("/admin/withdrawals", { params }).then((r) => r.data.data.withdrawals),
  resolveWithdrawal: (id, approve) => api.patch(`/admin/withdrawals/${id}`, { approve }).then((r) => r.data.data.request),
};
