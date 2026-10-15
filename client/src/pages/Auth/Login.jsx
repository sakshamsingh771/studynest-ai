import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { GraduationCap, Sparkles, BookOpenCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Checkbox from "../../components/ui/Checkbox.jsx";

const REMEMBERED_EMAIL_KEY = "studynest_remembered_email";

const BENEFITS = [
  { icon: Sparkles, text: "AI summaries, flashcards and quizzes generated from your own notes" },
  { icon: BookOpenCheck, text: "Topic-wise mastery tracking tied to your actual syllabus" },
  { icon: ShieldCheck, text: "Your academic data stays yours — nothing shared without consent" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Prefill the email if the user checked "Remember me" on a previous visit —
  // we never persist the password itself, only the address, purely for convenience.
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (remembered) {
      setForm((f) => ({ ...f, email: remembered }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.email) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // guards against a double Enter-key submit firing two requests
    if (!validate()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);

      if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, form.email);
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY);

      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === "INVALID_CREDENTIALS") {
        setErrors({ password: "Incorrect email or password." });
      } else if (!err.response) {
        toast.error("Network error — check your connection and try again.");
      } else {
        toast.error(err.response?.data?.error?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-cream">
      {/* Left brand panel — hidden on mobile, where the form alone is the whole page */}
      <div className="hidden lg:flex flex-col justify-between bg-ink-solid text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/20 via-transparent to-transparent pointer-events-none" />

        <Link to="/" className="relative flex items-center gap-2 font-display font-bold text-lg">
          <span className="h-8 w-8 rounded-lg bg-teal flex items-center justify-center">
            <GraduationCap size={18} />
          </span>
          StudyNest <span className="text-gold">AI</span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="font-display text-3xl font-bold leading-tight">
            Your syllabus. Your study plan. <span className="text-gold">One AI workspace.</span>
          </h1>
          <p className="text-white/60 mt-4 text-sm leading-relaxed">
            Organise your academic resources, understand difficult concepts, practise smarter, and track
            your learning progress — all mapped to your actual university, course and syllabus.
          </p>

          {/* Faithful, simplified preview of the real dashboard layout — not a stock photo or invented metric */}
          <div className="mt-8 bg-white/5 border border-white/10 rounded-card p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-white/50 mb-3">
              <span>My Academic Space</span>
              <span>Data Structures</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Binary Trees & Traversals</span>
                <span className="text-gold">72% · Good</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[72%] bg-gold rounded-full" />
              </div>
              <div className="flex items-center justify-between text-xs mt-3">
                <span className="text-white/70">Graph Traversals (BFS/DFS)</span>
                <span className="text-white/40">Not started</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[0%] bg-teal rounded-full" />
              </div>
            </div>
          </div>

          <ul className="mt-8 space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/70">
                <Icon size={16} className="text-teal mt-0.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/30">© {new Date().getFullYear()} StudyNest AI</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 font-display font-bold text-ink justify-center mb-8">
            <span className="h-8 w-8 rounded-lg bg-ink-solid flex items-center justify-center text-white">
              <GraduationCap size={18} />
            </span>
            StudyNest <span className="text-gold">AI</span>
          </Link>

          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-ink/50 mt-1.5">Log in to continue studying smarter.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
            <Input
              label="Email" type="email" name="email" autoComplete="email" inputMode="email"
              value={form.email} onChange={handleChange} error={errors.email}
              placeholder="you@college.edu"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="text-xs font-medium text-ink/70">Password</label>
                <Link to="/forgot-password" className="text-xs text-teal hover:underline">Forgot password?</Link>
              </div>
              <PasswordInput
                id="password" name="password" value={form.password} onChange={handleChange}
                autoComplete="current-password"
              />
              {errors.password && <p role="alert" className="text-xs text-danger mt-1.5">{errors.password}</p>}
            </div>

            <Checkbox label="Remember me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </Button>
          </form>

          <p className="text-sm text-ink/60 text-center mt-6">
            Don't have an account? <Link to="/signup" className="text-teal font-medium hover:underline">Sign up</Link>
          </p>

          <p className="text-xs text-ink/35 text-center mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} /> Your password is never stored in plain text or visible to anyone, including us.
          </p>
        </div>
      </div>
    </div>
  );
}
