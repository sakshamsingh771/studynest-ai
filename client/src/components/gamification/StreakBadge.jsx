export default function StreakBadge({ streak, size = "sm" }) {
  const current = streak?.current ?? 0;
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (current === 0) return null; // no streak yet — nothing to show, not a sad "0 day streak"

  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-orange-500 ${textSize}`}>
      🔥 {current} Day{current !== 1 ? "s" : ""}
    </span>
  );
}
