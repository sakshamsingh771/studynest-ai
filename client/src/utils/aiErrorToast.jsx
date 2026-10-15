import toast from "react-hot-toast";

// Shared across Summary/Flashcards/Quiz/Chat tabs — when the free daily AI
// limit is hit, show a toast with a real link to the Premium page instead of
// just an error string the person has to act on manually.
export function showAIErrorToast(err, fallbackMessage) {
  const code = err.response?.data?.error?.code;
  const message = err.response?.data?.error?.message || fallbackMessage;

  if (code === "AI_LIMIT_REACHED") {
    toast.custom(
      (t) => (
        <div className={`bg-white border border-gold/30 shadow-lg rounded-lg px-4 py-3 max-w-sm ${t.visible ? "animate-in fade-in" : ""}`}>
          <p className="text-sm text-ink/80">{message}</p>
          <a href="/premium" className="text-xs font-semibold text-teal mt-1.5 inline-block hover:underline">
            View Premium plans →
          </a>
        </div>
      ),
      { duration: 6000 }
    );
    return;
  }

  toast.error(message);
}
