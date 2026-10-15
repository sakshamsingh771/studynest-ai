// Accessible tab list — arrow-key navigation + roving tabindex, used by any
// page with switchable panels (AI tools, subject topics, etc.) instead of
// each one re-implementing its own button-row tab bar.
export default function Tabs({ tabs, active, onChange, className = "" }) {
  const handleKeyDown = (e, idx) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(idx + dir + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div role="tablist" className={`flex gap-1 border-b border-ink/10 ${className}`}>
      {tabs.map((t, idx) => (
        <button
          key={t.id} id={`tab-${t.id}`} role="tab"
          aria-selected={active === t.id} tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 rounded-t ${
            active === t.id ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
