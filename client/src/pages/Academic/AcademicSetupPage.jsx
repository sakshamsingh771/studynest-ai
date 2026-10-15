import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/ui/Button.jsx";
import { academicApi } from "../../api/academicApi.js";

const SEMESTERS = Array.from({ length: 12 }, (_, i) => i + 1);

// Cascading University -> Program -> Branch -> Semester picker. Nothing here is
// hardcoded to one university — every option comes from the syllabus hierarchy
// collections, so a new university added by an admin/teacher shows up automatically.
export default function AcademicSetupPage() {
  const navigate = useNavigate();
  const [universityId, setUniversityId] = useState("");
  const [programId, setProgramId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const { data: universities = [] } = useQuery({ queryKey: ["universities"], queryFn: academicApi.listUniversities });
  const { data: programs = [] } = useQuery({
    queryKey: ["programs", universityId], queryFn: () => academicApi.listPrograms(universityId), enabled: !!universityId,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches", programId], queryFn: () => academicApi.listBranches(programId), enabled: !!programId,
  });

  const mutation = useMutation({
    mutationFn: () => academicApi.updateMyProfile({ university: universityId, program: programId, branch: branchId, semester, academicYear }),
    onSuccess: () => {
      toast.success("Academic profile saved!");
      navigate("/academic");
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Couldn't save your academic profile"),
  });

  const canSubmit = universityId && programId && branchId && semester;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 py-12">
        <h1 className="font-display text-2xl font-bold text-ink">Set up your Academic Space</h1>
        <p className="text-sm text-ink/60 mt-2">
          Tell us your university, program, branch and semester. This powers your personalized subject
          dashboard, topic-wise mastery tracking, and PYQ intelligence — nothing here is guessed or hardcoded.
        </p>

        <div className="mt-8 bg-white dark:bg-[#151E30] border border-ink/10 rounded-xl p-6 space-y-4">
          <Field label="University">
            <select className="input" value={universityId} onChange={(e) => { setUniversityId(e.target.value); setProgramId(""); setBranchId(""); }}>
              <option value="">Select university</option>
              {universities.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </Field>

          <Field label="Program / Degree">
            <select className="input" value={programId} disabled={!universityId} onChange={(e) => { setProgramId(e.target.value); setBranchId(""); }}>
              <option value="">Select program</option>
              {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Branch">
            <select className="input" value={branchId} disabled={!programId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Select branch</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Semester">
              <select className="input" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="">Select</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </Field>
            <Field label="Academic Year (optional)">
              <input className="input" placeholder="2025-26" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
            </Field>
          </div>

          {universities.length === 0 && (
            <p className="text-xs text-ink/40">
              No universities are set up yet on this instance. Ask an admin/teacher to add your university under Academic Admin.
            </p>
          )}

          <Button variant="primary" className="w-full mt-2" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Saving..." : "Save & Go to My Academic Space"}
          </Button>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink/60 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
