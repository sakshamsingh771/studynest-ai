import { Link } from "react-router-dom";
import Button from "./Button.jsx";

// Honest "nothing here yet" state — used instead of ever fabricating data
// (fake stats, invented mastery scores, placeholder testimonials). Always
// explain in plain words what the student needs to do before this section
// will show something real.
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionTo }) {
  const buttonClass = "inline-flex items-center justify-center mt-4 text-sm px-5 py-2.5 rounded-lg font-medium border border-ink/20 text-ink hover:bg-ink/5 transition-colors";

  return (
    <div className="text-center py-10 px-6 border border-dashed border-ink/15 rounded-card bg-ink/[0.015]">
      {Icon && (
        <div className="h-11 w-11 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-3 text-ink/40">
          <Icon size={20} />
        </div>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="text-sm text-ink/50 mt-1.5 max-w-sm mx-auto">{description}</p>}
      {actionLabel && actionTo && <Link to={actionTo} className={buttonClass}>{actionLabel}</Link>}
      {actionLabel && !actionTo && onAction && (
        <Button variant="outline" className="mt-4 text-sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
