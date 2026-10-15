import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiOutlineSparkles, HiOutlineTrash, HiCheckCircle, HiOutlineCheckCircle } from "react-icons/hi";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/ui/Button.jsx";
import { studyPlannerApi } from "../../api/studyPlannerApi.js";

const DIFFICULTIES = ["easy", "medium", "hard"];

function AddSubjectForm({ onAdded }) {
  const [form, setForm] = useState({ name: "", examDate: "", difficulty: "medium", targetHours: "" });
  const mutation = useMutation({
    mutationFn: () => studyPlannerApi.addSubject(form),
    onSuccess: () => {
      toast.success("Subject added!");
      setForm({ name: "", examDate: "", difficulty: "medium", targetHours: "" });
      onAdded();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Couldn't add subject"),
  });

  return (
    <div className="bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D] rounded-xl p-5">
      <p className="text-sm font-semibold text-[#172033] dark:text-[#F1F5F9] mb-3">Add a Subject</p>
      <div className="grid sm:grid-cols-4 gap-3">
        <input
          placeholder="Subject name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-ink/15 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          type="date" value={form.examDate} onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
          className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
        <input
          type="number" min={1} placeholder="Target hours" value={form.targetHours}
          onChange={(e) => setForm((f) => ({ ...f, targetHours: e.target.value }))}
          className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        {DIFFICULTIES.map((d) => (
          <button
            key={d} onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize ${form.difficulty === d ? "bg-ink-solid text-white border-ink-solid" : "border-ink/15 text-ink/60"}`}
          >
            {d}
          </button>
        ))}
        <Button
          variant="primary" className="ml-auto text-sm"
          disabled={!form.name || !form.examDate || !form.targetHours || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Adding..." : "Add Subject"}
        </Button>
      </div>
    </div>
  );
}

function SubjectCard({ subject, sessions, onChange }) {
  const queryClient = useQueryClient();
  const subjectSessions = sessions.filter((s) => s.subject?._id === subject._id);

  const generateMutation = useMutation({
    mutationFn: () => studyPlannerApi.generatePlan(subject._id),
    onSuccess: () => {
      toast.success("Study plan generated!");
      onChange();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Couldn't generate plan"),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => studyPlannerApi.completeSession(id),
    onSuccess: () => { toast.success("Nice work! +5 XP"); onChange(); },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: () => studyPlannerApi.deleteSubject(subject._id),
    onSuccess: onChange,
  });

  const daysLeft = Math.max(0, Math.ceil((new Date(subject.examDate) - new Date()) / 86400000));

  return (
    <div className="bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-ink">{subject.name}</p>
          <p className="text-xs text-ink/40 mt-0.5 capitalize">
            {subject.difficulty} · {daysLeft} day{daysLeft !== 1 ? "s" : ""} until exam
          </p>
        </div>
        <button onClick={() => deleteSubjectMutation.mutate()} className="text-ink/20 hover:text-red-500">
          <HiOutlineTrash size={16} />
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-ink/50 mb-1">
          <span>{subject.completedHours}h / {subject.targetHours}h</span>
          <span>{subject.progressPercent}%</span>
        </div>
        <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
          <div className="h-full bg-teal rounded-full" style={{ width: `${subject.progressPercent}%` }} />
        </div>
      </div>

      {subjectSessions.length === 0 ? (
        <Button
          variant="outline" className="w-full mt-4 text-sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
        >
          <span className="flex items-center justify-center gap-2">
            <HiOutlineSparkles size={16} />
            {generateMutation.isPending ? "Generating..." : "Generate AI Study Plan"}
          </span>
        </Button>
      ) : (
        <div className="mt-4 space-y-1.5">
          {subjectSessions.map((s) => (
            <button
              key={s._id}
              onClick={() => !s.completed && completeMutation.mutate(s._id)}
              className="w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg hover:bg-ink/5"
            >
              {s.completed ? <HiCheckCircle className="text-green-500 shrink-0" size={18} /> : <HiOutlineCheckCircle className="text-ink/30 shrink-0" size={18} />}
              <span className={s.completed ? "text-ink/40 line-through" : "text-ink"}>{s.focus}</span>
              <span className="text-xs text-ink/30 ml-auto whitespace-nowrap">
                {new Date(s.scheduledDate).toLocaleDateString()} · {s.durationMinutes}m
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudyPlannerPage() {
  const queryClient = useQueryClient();
  const { data: subjects = [], refetch: refetchSubjects } = useQuery({ queryKey: ["subjects"], queryFn: studyPlannerApi.listSubjects });
  const { data: sessions = [], refetch: refetchSessions } = useQuery({ queryKey: ["sessions"], queryFn: () => studyPlannerApi.listSessions() });

  const handleChange = () => {
    refetchSubjects();
    refetchSessions();
    queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-2xl font-bold text-ink">Study Planner</h1>
        <p className="text-ink/50 mt-1">Add subjects, set exam dates, and let AI break your prep into sessions.</p>

        <div className="mt-6">
          <AddSubjectForm onAdded={handleChange} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {subjects.length === 0 && (
            <p className="text-sm text-ink/40 col-span-2 text-center py-8">No subjects yet — add one above to get started.</p>
          )}
          {subjects.map((subject) => (
            <SubjectCard key={subject._id} subject={subject} sessions={sessions} onChange={handleChange} />
          ))}
        </div>
      </main>
    </div>
  );
}
