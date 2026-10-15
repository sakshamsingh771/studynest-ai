import { ChevronDown } from "lucide-react";

export default function Select({ label, error, helperText, id, className = "", wrapperClassName = "", children, ...props }) {
  const selectId = id || props.name;
  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-ink/70 mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          className={`w-full appearance-none rounded-lg border px-3 py-2.5 pr-9 text-sm bg-white dark:bg-[#151E30] transition-colors
            disabled:bg-ink/5 disabled:text-ink/40
            focus:outline-none focus:ring-2
            ${error ? "border-danger/50 focus:ring-danger/20" : "border-ink/15 focus:ring-teal/30 focus:border-teal/50"}
            ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/30" />
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger mt-1.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink/40 mt-1.5">{helperText}</p>
      ) : null}
    </div>
  );
}
