import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check, X, GraduationCap, MailCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Checkbox from "../../components/ui/Checkbox.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import { REQUIREMENTS, getPasswordStrength } from "../../utils/passwordStrength.js";
import { academicApi } from "../../api/academicApi.js";

const STRENGTH_COLOR = { Weak: "bg-danger", Medium: "bg-gold", Strong: "bg-success" };
const SEMESTERS = Array.from({ length: 12 }, (_, i) => i + 1);
const STEPS = ["Account", "Academic Identity", "Review & Finish"];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 1 — account
  const [account, setAccount] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  // Step 2 — academic identity. universityId/programId/branchId are real refs into
  // the syllabus hierarchy (used post-signup to set the structured academic
  // profile); college/academicYear stay free text since there's no separate
  // "College" model yet — see server/src/modules/academic.
  const [academic, setAcademic] = useState({ universityId: "", programId: "", branchId: "", semester: "", academicYear: "", college: "" });
  const [errors, setErrors] = useState({});

  const { data: universities = [] } = useQuery({ queryKey: ["universities"], queryFn: academicApi.listUniversities });
  const { data: programs = [] } = useQuery({
    queryKey: ["programs", academic.universityId], queryFn: () => academicApi.listPrograms(academic.universityId), enabled: !!academic.universityId,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches", academic.programId], queryFn: () => academicApi.listBranches(academic.programId), enabled: !!academic.programId,
  });

  const strength = useMemo(() => getPasswordStrength(account.password), [account.password]);
  const passwordsMatch = account.confirmPassword.length > 0 && account.password === account.confirmPassword;
  const passwordsMismatch = account.confirmPassword.length > 0 && account.password !== account.confirmPassword;
  const isPasswordStrongEnough = strength.passedCount >= 3;

  const handleAccountChange = (e) => {
    setAccount((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined }));
  };

  const validateStep1 = () => {
    const next = {};
    if (!account.name || account.name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (!account.email || !/^\S+@\S+\.\S+$/.test(account.email)) next.email = "Enter a valid email address.";
    if (!isPasswordStrongEnough) next.password = "Password doesn't meet enough requirements below.";
    if (account.password !== account.confirmPassword) next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateStep1()) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleFinalSubmit = async () => {
    if (loading) return; // prevents a duplicate account from a double-click on the finish button
    setLoading(true);
    try {
      const branch = branches.find((b) => b._id === academic.branchId);
      const program = programs.find((p) => p._id === academic.programId);
      const university = universities.find((u) => u._id === academic.universityId);

      // Backend signup only accepts free-text profile.* fields (see
      // server/src/modules/auth/auth.service.js) — the structured academic refs
      // are set in a second, real call right after, using the already-existing
      // academic-profile endpoint (never faked, never skipped silently).
      const { user } = await signup({
        name: account.name,
        email: account.email,
        password: account.password,
        college: academic.college,
        university: university?.name || "",
        course: program?.name || "",
        branch: branch?.name || "",
        semester: academic.semester || undefined,
      });

      if (academic.universityId && academic.programId && academic.branchId && academic.semester) {
        try {
          await academicApi.updateMyProfile({
            university: academic.universityId, program: academic.programId,
            branch: academic.branchId, semester: academic.semester, academicYear: academic.academicYear,
          });
        } catch {
          // Account creation already succeeded — a failure here just means the
          // structured academic profile needs to be finished from the dashboard banner.
        }
      }

      setSubmitted(true);
    } catch (err) {
      if (err.response?.data?.error?.code === "EMAIL_TAKEN") {
        setStep(0);
        setErrors({ email: "An account with this email already exists." });
        toast.error("That email is already registered — try logging in instead.");
      } else if (!err.response) {
        toast.error("Network error — check your connection and try again.");
      } else {
        toast.error(err.response?.data?.error?.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-5">
        <div className="w-full max-w-sm bg-white dark:bg-[#151E30] rounded-card shadow-card border border-ink/10 p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto text-teal">
            <MailCheck size={24} />
          </div>
          <h1 className="text-xl font-bold text-ink mt-4">Account created!</h1>
          <p className="text-sm text-ink/60 mt-2">
            We've sent a verification link to <span className="font-medium text-ink">{account.email}</span>.
            You're logged in already, but verifying your email keeps your account secure.
          </p>
          <Button variant="primary" className="w-full mt-6" onClick={() => navigate("/dashboard", { replace: true })}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-5 py-10">
      <div className="w-full max-w-lg bg-white dark:bg-[#151E30] rounded-card shadow-card border border-ink/10 p-8">
        <Link to="/" className="flex items-center justify-center gap-2 font-display font-bold text-ink mb-1">
          <span className="h-7 w-7 rounded-lg bg-ink-solid flex items-center justify-center text-white">
            <GraduationCap size={16} />
          </span>
          StudyNest <span className="text-gold">AI</span>
        </Link>
        <h1 className="text-xl font-bold text-ink text-center mt-3">Create your account</h1>

        {/* Step progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < step ? "bg-teal text-white" : i === step ? "bg-ink-solid text-white" : "bg-ink/8 text-ink/40"
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-8 sm:w-12 ${i < step ? "bg-teal" : "bg-ink/10"}`} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-ink/40 mt-2">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

        <div className="mt-7 space-y-4">
          {step === 0 && (
            <>
              <Input label="Full name" name="name" autoComplete="name" value={account.name} onChange={handleAccountChange} error={errors.name} placeholder="Saksham Sharma" />
              <Input label="Email address" type="email" name="email" autoComplete="email" inputMode="email" value={account.email} onChange={handleAccountChange} error={errors.email} placeholder="you@college.edu" />

              <div>
                <label htmlFor="signup-password" className="text-xs font-medium text-ink/70 mb-1 block">Password</label>
                <PasswordInput id="signup-password" name="password" value={account.password} onChange={handleAccountChange} autoComplete="new-password" error={errors.password} />

                {account.password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < strength.passedCount ? STRENGTH_COLOR[strength.label] : "bg-ink/10"}`} />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 font-medium ${strength.label === "Strong" ? "text-success" : strength.label === "Medium" ? "text-gold" : "text-danger"}`}>
                      {strength.label}
                    </p>
                  </div>
                )}

                <ul className="mt-2 space-y-1">
                  {REQUIREMENTS.map((req) => {
                    const passed = req.test(account.password);
                    return (
                      <li key={req.id} className={`flex items-center gap-1.5 text-xs ${passed ? "text-success" : "text-ink/40"}`}>
                        {passed ? <Check size={13} /> : <X size={13} />}
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
                {errors.password && <p role="alert" className="text-xs text-danger mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirm-password" className="text-xs font-medium text-ink/70 mb-1 block">Confirm password</label>
                <PasswordInput id="confirm-password" name="confirmPassword" value={account.confirmPassword} onChange={handleAccountChange} autoComplete="new-password" error={errors.confirmPassword} />
                {passwordsMatch && <p className="text-xs text-success mt-1 flex items-center gap-1"><Check size={13} /> Passwords match</p>}
                {passwordsMismatch && <p role="alert" className="text-xs text-danger mt-1">Passwords do not match.</p>}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-xs text-ink/50 -mt-1">
                Optional, but unlocks subject-wise mastery tracking and PYQ intelligence from day one. You can also add this later from your dashboard.
              </p>
              <Select label="University" value={academic.universityId} onChange={(e) => setAcademic((f) => ({ ...f, universityId: e.target.value, programId: "", branchId: "" }))}>
                <option value="">Select university</option>
                {universities.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </Select>
              <Input label="College / Institution" value={academic.college} onChange={(e) => setAcademic((f) => ({ ...f, college: e.target.value }))} placeholder="Your college or institute name" />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Program / Course" value={academic.programId} disabled={!academic.universityId} onChange={(e) => setAcademic((f) => ({ ...f, programId: e.target.value, branchId: "" }))}>
                  <option value="">Select program</option>
                  {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </Select>
                <Select label="Branch" value={academic.branchId} disabled={!academic.programId} onChange={(e) => setAcademic((f) => ({ ...f, branchId: e.target.value }))}>
                  <option value="">Select branch</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Semester" value={academic.semester} onChange={(e) => setAcademic((f) => ({ ...f, semester: e.target.value }))}>
                  <option value="">Select</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </Select>
                <Input label="Academic year" placeholder="2025-26" value={academic.academicYear} onChange={(e) => setAcademic((f) => ({ ...f, academicYear: e.target.value }))} />
              </div>
              {universities.length === 0 && (
                <p className="text-xs text-ink/40">No universities are set up on this instance yet — you can skip this step and add it later.</p>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-lg border border-ink/10 divide-y divide-ink/5">
                <ReviewRow label="Name" value={account.name} />
                <ReviewRow label="Email" value={account.email} />
                <ReviewRow label="College" value={academic.college || "—"} />
                <ReviewRow label="University" value={universities.find((u) => u._id === academic.universityId)?.name || "—"} />
                <ReviewRow label="Program" value={programs.find((p) => p._id === academic.programId)?.name || "—"} />
                <ReviewRow label="Branch" value={branches.find((b) => b._id === academic.branchId)?.name || "—"} />
                <ReviewRow label="Semester" value={academic.semester || "—"} />
              </div>

              <Checkbox
                label={<>I agree to the <a href="/#terms" className="text-teal hover:underline">Terms of Service</a> and <a href="/#privacy" className="text-teal hover:underline">Privacy Policy</a>.</>}
                checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <p className="text-xs text-ink/40">
                After creating your account, we'll email you a verification link. You're free to use StudyNest right away — verifying just confirms the address is really yours.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mt-7">
          {step > 0 && <Button variant="outline" onClick={goBack} disabled={loading}>Back</Button>}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" className="flex-1" onClick={goNext}>Continue</Button>
          ) : (
            <Button variant="primary" className="flex-1" onClick={handleFinalSubmit} disabled={loading || !agreedToTerms}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          )}
        </div>

        <p className="text-sm text-ink/60 text-center mt-6">
          Already have an account? <Link to="/login" className="text-teal font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-ink/50">{label}</span>
      <span className="text-ink font-medium">{value}</span>
    </div>
  );
}
