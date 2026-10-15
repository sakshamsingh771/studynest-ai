import api from "../lib/axiosInstance";

export const studyPlannerApi = {
  addSubject: (payload) => api.post("/study-planner/subjects", payload).then((r) => r.data.data.subject),
  listSubjects: () => api.get("/study-planner/subjects").then((r) => r.data.data.subjects),
  deleteSubject: (id) => api.delete(`/study-planner/subjects/${id}`).then((r) => r.data),
  generatePlan: (subjectId) => api.post(`/study-planner/subjects/${subjectId}/generate-plan`).then((r) => r.data.data.sessions),
  scheduleSession: (payload) => api.post("/study-planner/sessions", payload).then((r) => r.data.data.session),
  listSessions: (upcoming) => api.get("/study-planner/sessions", { params: { upcoming } }).then((r) => r.data.data.sessions),
  completeSession: (id) => api.patch(`/study-planner/sessions/${id}/complete`).then((r) => r.data.data.session),
  deleteSession: (id) => api.delete(`/study-planner/sessions/${id}`).then((r) => r.data),
};
