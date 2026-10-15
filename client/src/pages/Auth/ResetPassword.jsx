import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { HiCheck, HiX } from "react-icons/hi";
import { authApi } from "../../api/authApi.js";
import Button from "../../components/ui/Button.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import { REQUIREMENTS, getPasswordStrength } from "../../utils/passwordStrength.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const isStrongEnough = strength.passedCount >= 3;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 text-center">
        <div>
          <p className="text-ink/60">This reset link is missing its token.</p>
          <Link to="/forgot-password" className="text-teal text-sm mt-2 inline-block">Request a new link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongEnough || !passwordsMatch) return;

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success("Password reset! Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "This link may have expired. Request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal/5 via-white to-gold/5 dark:from-teal/10 dark:via-cream dark:to-gold/10 px-5">
      <div className="w-full max-w-sm bg-white dark:bg-[#151E30] rounded-2xl shadow-xl border border-ink/5 p-8">
        <Link to="/" className="font-display font-bold text-ink block text-center mb-1">
          StudyNest <span className="text-gold">AI</span>
        </Link>
        <h1 className="text-xl font-bold text-ink text-center mt-2">Set a new password</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-ink/70">New password</label>
            <div className="mt-1">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <ul className="mt-2 space-y-1">
              {REQUIREMENTS.map((req) => {
                const passed = req.test(password);
                return (
                  <li key={req.id} className={`flex items-center gap-1.5 text-xs ${passed ? "text-green-600" : "text-ink/40"}`}>
                    {passed ? <HiCheck size={14} /> : <HiX size={14} />}
                    {req.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label className="text-xs font-medium text-ink/70">Confirm new password</label>
            <div className="mt-1">
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading || !isStrongEnough || !passwordsMatch}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
