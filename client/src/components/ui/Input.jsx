// Shared text input — label, error/helper text, and consistent focus ring in
// one place so every form across the app (login, signup, upload, planner...)
// looks and behaves the same instead of each page hand-rolling its own markup.
export default function Input({ label, error, helperText, id, className = "", wrapperClassName = "", ...props }) {
  const inputId = id || props.name;
  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink/70 mb-1 block">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-[#151E30] transition-colors placeholder:text-ink/30
          disabled:bg-ink/5 disabled:text-ink/40
          focus:outline-none focus:ring-2
          ${error ? "border-danger/50 focus:ring-danger/20" : "border-ink/15 focus:ring-teal/30 focus:border-teal/50"}
          ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-danger mt-1.5">{error}</p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-ink/40 mt-1.5">{helperText}</p>
      ) : null}
    </div>
  );
}
