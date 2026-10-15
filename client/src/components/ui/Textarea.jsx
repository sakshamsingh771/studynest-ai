export default function Textarea({ label, error, helperText, id, className = "", wrapperClassName = "", ...props }) {
  const taId = id || props.name;
  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={taId} className="text-xs font-medium text-ink/70 mb-1 block">
          {label}
        </label>
      )}
      <textarea
        id={taId}
        aria-invalid={!!error}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-[#151E30] transition-colors placeholder:text-ink/30
          disabled:bg-ink/5 disabled:text-ink/40
          focus:outline-none focus:ring-2
          ${error ? "border-danger/50 focus:ring-danger/20" : "border-ink/15 focus:ring-teal/30 focus:border-teal/50"}
          ${className}`}
        {...props}
      />
      {error ? (
        <p role="alert" className="text-xs text-danger mt-1.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink/40 mt-1.5">{helperText}</p>
      ) : null}
    </div>
  );
}
