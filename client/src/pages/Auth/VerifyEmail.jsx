import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authApi } from "../../api/authApi.js";
import Button from "../../components/ui/Button.jsx";

// Handles the real link sent by server/src/modules/auth emailService — reads
// the token from the URL, calls the actual verify endpoint, and shows exactly
// what happened. No step here is simulated: a missing/expired token shows a
// real failure state with a way to request a new link.
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState("verifying"); // verifying | success | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage("This verification link is missing its token.");
      return;
    }
    authApi.verifyEmail(token)
      .then(() => setState("success"))
      .catch((err) => {
        setState("error");
        setErrorMessage(err.response?.data?.error?.message || "This link is invalid or has expired.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-5">
      <div className="w-full max-w-sm bg-white rounded-card shadow-card border border-ink/10 p-8 text-center">
        {state === "verifying" && (
          <>
            <Loader2 size={28} className="mx-auto text-teal animate-spin" />
            <p className="text-sm text-ink/60 mt-4">Verifying your email...</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 size={32} className="mx-auto text-success" />
            <h1 className="text-lg font-bold text-ink mt-3">Email verified</h1>
            <p className="text-sm text-ink/60 mt-1.5">Your account is now fully confirmed.</p>
            <Link to="/dashboard"><Button variant="primary" className="w-full mt-6">Go to Dashboard</Button></Link>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle size={32} className="mx-auto text-danger" />
            <h1 className="text-lg font-bold text-ink mt-3">Verification failed</h1>
            <p className="text-sm text-ink/60 mt-1.5">{errorMessage}</p>
            <Link to="/dashboard"><Button variant="outline" className="w-full mt-6">Go to Dashboard — request a new link there</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}
