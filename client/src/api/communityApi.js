import api from "../lib/axiosInstance";

export const communityApi = {
  listComments: (noteId) => api.get(`/notes/${noteId}/comments`).then((r) => r.data.data.comments),
  addComment: (noteId, text, parentComment) =>
    api.post(`/notes/${noteId}/comments`, { text, parentComment }).then((r) => r.data.data.comment),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`).then((r) => r.data),
  rateNote: (noteId, value, reviewText) => api.post(`/notes/${noteId}/rating`, { value, reviewText }).then((r) => r.data.data),
  listReviews: (noteId) => api.get(`/notes/${noteId}/reviews`).then((r) => r.data.data.reviews),
  follow: (userId) => api.post(`/users/${userId}/follow`).then((r) => r.data.data),
  unfollow: (userId) => api.post(`/users/${userId}/unfollow`).then((r) => r.data.data),
  toggleBookmark: (noteId) => api.post(`/notes/${noteId}/bookmark`).then((r) => r.data.data),
  myBookmarks: () => api.get("/bookmarks").then((r) => r.data.data.notes),
};
