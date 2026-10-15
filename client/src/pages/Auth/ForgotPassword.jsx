import { useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineMail } from "react-icons/hi";
import toast from "react-hot-toast";
import { authApi } from "../../api/authApi.js";
import Button from "../../components/ui/Button.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter a valid email address.");

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      // Backend deliberately gives the same response whether or not the email
      // exists — we mirror that here so the UI can't be used to guess accounts.
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
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

        {sent ? (
          <div className="text-center mt-4">
            <div className="h-12 w-12 rounded-full bg-teal/10 text-teal flex items-center justify-center mx-auto">
              <HiOutlineMail size={22} />
            </div>
            <h1 className="text-lg font-bold text-ink mt-4">Check your email</h1>
            <p className="text-sm text-ink/50 mt-2">
              If an account exists for <span className="text-ink/70">{email}</span>, we've sent a link to reset your password. It's valid for 1 hour.
            </p>
            <Link to="/login" className="text-sm text-teal font-medium mt-5 inline-block">Back to login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink text-center mt-2">Forgot password?</h1>
            <p className="text-sm text-ink/50 text-center mt-1">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
              />
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <p className="text-sm text-ink/60 text-center mt-6">
              Remembered it? <Link to="/login" className="text-teal font-medium">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
