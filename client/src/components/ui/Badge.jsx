const TONES = {
  neutral: "bg-ink/5 text-ink/60 border-ink/10",
  teal: "bg-teal/10 text-teal border-teal/20",
  gold: "bg-gold/15 text-ink border-gold/30",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  warn: "bg-warn/10 text-warn border-warn/20",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${TONES[tone] || TONES.neutral} ${className}`}>
      {children}
    </span>
  );
}
