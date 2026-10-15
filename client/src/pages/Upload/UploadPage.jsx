import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiOutlineCloudUpload, HiOutlineDocumentText, HiOutlineX } from "react-icons/hi";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/ui/Button.jsx";
import { notesApi } from "../../api/notesApi.js";
import { academicApi } from "../../api/academicApi.js";

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", semester: "", branch: "", tags: "", isPremium: false, price: "" });
  // Optional syllabus mapping — lets this note surface in "My Academic Space" /
  // topic-level resources for other students on the same course. Entirely
  // optional: leaving these blank uploads exactly like before.
  const [academicSubjectId, setAcademicSubjectId] = useState("");
  const [academicUnitId, setAcademicUnitId] = useState("");
  const [academicTopicId, setAcademicTopicId] = useState("");

  const { data: myAcademic } = useQuery({ queryKey: ["academic-profile"], queryFn: academicApi.getMyProfile });
  const { data: academicSubjects = [] } = useQuery({
    queryKey: ["my-academic-subjects", myAcademic?.branch?._id, myAcademic?.semester],
    queryFn: () => academicApi.listSubjects(myAcademic.branch._id, myAcademic.semester),
    enabled: !!myAcademic?.branch?._id && !!myAcademic?.semester,
  });
  const { data: academicUnits = [] } = useQuery({
    queryKey: ["academic-units", academicSubjectId], queryFn: () => academicApi.listUnits(academicSubjectId), enabled: !!academicSubjectId,
  });
  const { data: academicTopics = [] } = useQuery({
    queryKey: ["academic-topics", academicUnitId], queryFn: () => academicApi.listTopics({ unitId: academicUnitId }), enabled: !!academicUnitId,
  });

  const mutation = useMutation({
    mutationFn: (formData) => notesApi.create(formData),
    onSuccess: (note) => {
      toast.success("Note uploaded successfully!");
      navigate(`/notes/${note._id}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || "Upload failed. Check file size (max 25 MB) and format.";
      toast.error(msg);
    },
  });

  const MAX_SIZE = 25 * 1024 * 1024;
  const ALLOWED_EXT = ["pdf", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg", "webp", "zip"];

  const handleFileSelect = (selected) => {
    if (!selected) return;
    setFile(selected);
    if (!form.title) setForm((f) => ({ ...f, title: selected.name.replace(/\.[^/.]+$/, "") }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = (e) => {
    if (file && file.size > MAX_SIZE) {
      e.preventDefault();
      toast.error("File is larger than 25 MB. Please choose a smaller file.");
      return;
    }
    const ext = file?.name?.split(".").pop()?.toLowerCase();
    if (file && !ALLOWED_EXT.includes(ext)) {
      e.preventDefault();
      toast.error("Unsupported file type. Use PDF, DOC, DOCX, PPT, images, or ZIP.");
      return;
    }
    e.preventDefault();
    if (!file) return toast.error("Please choose a file to upload.");

    const formData = new FormData();
    formData.append("file", file);
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (myAcademic?.university?._id) formData.append("academicUniversity", myAcademic.university._id);
    if (academicSubjectId) formData.append("academicSubject", academicSubjectId);
    if (academicUnitId) formData.append("academicUnit", academicUnitId);
    if (academicTopicId) formData.append("academicTopic", academicTopicId);

    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0B1020]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-2xl font-bold text-ink">Upload a Note</h1>
        <p className="text-ink/50 mt-1">Share your notes and help other students.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-teal bg-teal/5" : "border-ink/15 hover:border-ink/30"
            }`}
          >
            <input
              ref={fileInputRef} type="file" className="hidden"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <HiOutlineDocumentText size={28} className="text-teal" />
                <div className="text-left">
                  <p className="text-sm font-medium text-ink">{file.name}</p>
                  <p className="text-xs text-ink/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-ink/30 hover:text-ink/60">
                  <HiOutlineX size={18} />
                </button>
              </div>
            ) : (
              <>
                <HiOutlineCloudUpload size={32} className="mx-auto text-ink/30" />
                <p className="text-sm text-ink/60 mt-2">Drag &amp; drop a file here, or click to browse</p>
                <p className="text-xs text-[#526078] dark:text-[#B8C4D6] mt-1">Supported: PDF, DOC, DOCX, PPT, images, ZIP. Maximum size: 25 MB per file.</p>
              </>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-ink/70">Title</label>
            <input
              required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink/70">Description</label>
            <textarea
              rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink/70">Subject</label>
              <input
                value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/70">Semester</label>
              <input
                type="number" min={1} max={12} value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink/70">Tags (comma separated)</label>
            <input
              value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="dsa, algorithms, sem5"
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-ink/15 px-3 py-2.5">
            <input
              type="checkbox" id="isPremium" checked={form.isPremium}
              onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))}
              className="h-4 w-4 accent-teal"
            />
            <label htmlFor="isPremium" className="text-sm text-ink/80 flex-1">Sell this note (premium)</label>
            {form.isPremium && (
              <input
                type="number" min={1} required value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="Price (₹) — required for premium"
                className="w-28 rounded-lg border border-ink/15 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
              />
            )}
          </div>

          {academicSubjects.length > 0 && (
            <div className="rounded-lg border border-ink/15 px-3 py-3">
              <p className="text-xs font-medium text-ink/70 mb-2">Link to a syllabus topic (optional)</p>
              <p className="text-[11px] text-ink/40 mb-3">Helps other students on your course find this note from "My Academic Space".</p>
              <div className="grid grid-cols-3 gap-2">
                <select className="input text-xs" value={academicSubjectId} onChange={(e) => { setAcademicSubjectId(e.target.value); setAcademicUnitId(""); setAcademicTopicId(""); }}>
                  <option value="">Subject</option>
                  {academicSubjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select className="input text-xs" value={academicUnitId} disabled={!academicSubjectId} onChange={(e) => { setAcademicUnitId(e.target.value); setAcademicTopicId(""); }}>
                  <option value="">Unit</option>
                  {academicUnits.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
                <select className="input text-xs" value={academicTopicId} disabled={!academicUnitId} onChange={(e) => setAcademicTopicId(e.target.value)}>
                  <option value="">Topic</option>
                  {academicTopics.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Uploading..." : "Upload Note"}
          </Button>
        </form>
      </main>
    </div>
  );
}
