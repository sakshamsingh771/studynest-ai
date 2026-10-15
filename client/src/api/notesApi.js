import api from "../lib/axiosInstance";

export const notesApi = {
  list: (params) => api.get("/notes", { params }).then((r) => r.data),
  mine: () => api.get("/notes/mine").then((r) => r.data.data.notes),
  getById: (id) => api.get(`/notes/${id}`).then((r) => r.data.data.note),
  create: (formData) =>
    api
      .post("/notes", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data.data.note),
  update: (id, payload) => api.patch(`/notes/${id}`, payload).then((r) => r.data.data.note),
  remove: (id) => api.delete(`/notes/${id}`).then((r) => r.data),
  trackDownload: (id) => api.post(`/notes/${id}/download`).then((r) => r.data.data),
  getRelated: (id) => api.get(`/notes/${id}/related`).then((r) => r.data.data.notes),
};
