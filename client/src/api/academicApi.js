import api from "../lib/axiosInstance";

export const academicApi = {
  // Cascading hierarchy pickers
  listUniversities: () => api.get("/academic/universities").then((r) => r.data.data.universities),
  listPrograms: (universityId) => api.get("/academic/programs", { params: { universityId } }).then((r) => r.data.data.programs),
  listBranches: (programId) => api.get("/academic/branches", { params: { programId } }).then((r) => r.data.data.branches),
  listSubjects: (branchId, semester) => api.get("/academic/subjects", { params: { branchId, semester } }).then((r) => r.data.data.subjects),
  listUnits: (subjectId) => api.get("/academic/units", { params: { subjectId } }).then((r) => r.data.data.units),
  listTopics: ({ subjectId, unitId }) => api.get("/academic/topics", { params: { subjectId, unitId } }).then((r) => r.data.data.topics),
  getTopic: (topicId) => api.get(`/academic/topics/${topicId}`).then((r) => r.data.data.topic),

  // Academic profile
  getMyProfile: () => api.get("/academic/me/profile").then((r) => r.data.data.academic),
  updateMyProfile: (payload) => api.patch("/academic/me/profile", payload).then((r) => r.data.data.academic),

  // My Academic Space
  getMySpace: () => api.get("/academic/me/space").then((r) => r.data.data),

  // Mastery
  getTopicMastery: (topicId) => api.get(`/academic/topics/${topicId}/mastery`).then((r) => r.data.data),
  getSubjectMastery: (subjectId) => api.get(`/academic/subjects/${subjectId}/mastery`).then((r) => r.data.data),

  // Recommended next
  getRecommendedNext: (subjectId) => api.get(`/academic/subjects/${subjectId}/recommended-next`).then((r) => r.data.data.recommendation),

  // PYQ intelligence
  getPYQIntelligence: (subjectId) => api.get(`/academic/subjects/${subjectId}/pyq-intelligence`).then((r) => r.data.data),

  // Ask My Course
  askMyCourse: (topicId, question) => api.post("/academic/ask", { topicId, question }).then((r) => r.data.data),

  // Resources mapped to a topic/subject (existing notes system, filtered)
  listNotesByTopic: ({ subjectId, topicId }) => api.get("/notes/by-topic", { params: { subjectId, topicId } }).then((r) => r.data.data.notes),
};
