export default function Checkbox({ label, id, className = "", ...props }) {
  const cbId = id || props.name;
  return (
    <label htmlFor={cbId} className={`flex items-center gap-2 text-sm text-ink/70 cursor-pointer select-none ${className}`}>
      <input
        id={cbId} type="checkbox"
        className="h-4 w-4 rounded border-ink/25 accent-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        {...props}
      />
      {label}
    </label>
  );
}
