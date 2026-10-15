// Used anywhere a real, measured percentage is shown (exam readiness, topic
// mastery, syllabus completion). Never render this with an invented number —
// callers must pass an actual computed percent, or show an EmptyState instead.
export default function ProgressBar({ percent, tone = "auto", className = "", height = "h-2" }) {
  const clamped = Math.max(0, Math.min(100, percent ?? 0));
  const resolvedTone =
    tone !== "auto" ? tone :
    clamped >= 81 ? "bg-success" : clamped >= 61 ? "bg-teal" : clamped >= 31 ? "bg-warn" : "bg-danger";

  return (
    <div className={`w-full ${height} rounded-full bg-ink/8 overflow-hidden ${className}`}>
      <div
        className={`h-full ${resolvedTone} transition-all duration-500`}
        style={{ width: `${clamped}%` }}
        role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}
      />
    </div>
  );
}
