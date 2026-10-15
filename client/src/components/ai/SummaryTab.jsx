import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { aiApi } from "../../api/aiApi.js";
import { showAIErrorToast } from "../../utils/aiErrorToast.jsx";
import Button from "../ui/Button.jsx";

const MODES = [
  { value: "short", label: "Short" },
  { value: "detailed", label: "Detailed" },
  { value: "exam-prep", label: "Exam Prep" },
  { value: "beginner", label: "Beginner" },
];

export default function SummaryTab({ noteId }) {
  const [mode, setMode] = useState("short");
  const [summary, setSummary] = useState(null);

  const mutation = useMutation({
    mutationFn: () => aiApi.summary(noteId, mode),
    onSuccess: setSummary,
    onError: (err) => showAIErrorToast(err, "Couldn't generate summary"),
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              mode === m.value ? "bg-ink-solid text-white border-ink-solid" : "border-ink/15 text-ink/60 hover:border-ink/30"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Button variant="primary" className="mt-4" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Generating..." : "Generate Summary"}
      </Button>

      {summary && (
        <div className="mt-5 bg-teal/5 border border-teal/15 rounded-lg p-4 text-sm text-ink/80 whitespace-pre-line leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
}
