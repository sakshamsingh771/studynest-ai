import api from "../lib/axiosInstance";

export const aiApi = {
  status: (noteId) => api.get(`/notes/${noteId}/ai/status`).then((r) => r.data.data.aiStatus),
  statusDetail: (noteId) => api.get(`/notes/${noteId}/ai/status`).then((r) => r.data.data),
  reprocess: (noteId) => api.post(`/notes/${noteId}/ai/reprocess`).then((r) => r.data.data),
  summary: (noteId, mode) => api.post(`/notes/${noteId}/ai/summary`, { mode }).then((r) => r.data.data.summary),
  flashcards: (noteId) => api.post(`/notes/${noteId}/ai/flashcards`, {}).then((r) => r.data.data.flashcards),
  quiz: (noteId, difficulty) => api.post(`/notes/${noteId}/ai/quiz`, { difficulty }).then((r) => r.data.data.questions),
  chat: (noteId, question) => api.post(`/notes/${noteId}/ai/chat`, { question }).then((r) => r.data.data.answer),
  // Document Review — saved, validated, revisitable
  createReview: (noteId) => api.post(`/notes/${noteId}/ai/reviews`).then((r) => r.data.data.review),
  listReviews: (noteId) => api.get(`/notes/${noteId}/ai/reviews`).then((r) => r.data.data.reviews),
  deleteReview: (noteId, reviewId) => api.delete(`/notes/${noteId}/ai/reviews/${reviewId}`).then((r) => r.data),
};
