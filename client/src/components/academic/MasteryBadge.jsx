const STYLES = {
  "Strong": "bg-green-50 text-green-600 border-green-200",
  "Good": "bg-teal/10 text-teal border-teal/20",
  "Developing": "bg-gold/15 text-ink border-gold/30",
  "Needs Attention": "bg-red-50 text-red-500 border-red-200",
  "Not Started": "bg-ink/5 text-ink/40 border-ink/10",
};

// Shown everywhere a per-topic Estimated Mastery score appears. Deliberately
// always labeled "Estimated Mastery" (never just "Mastery") so it's never read
// as a certified or exact measurement.
export default function MasteryBadge({ score, state }) {
  const style = STYLES[state] || STYLES["Not Started"];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${style}`}>
      {score === null || score === undefined ? "Not started" : `${score}% · ${state}`}
    </span>
  );
}
