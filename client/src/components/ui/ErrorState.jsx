import { AlertTriangle } from "lucide-react";
import Button from "./Button.jsx";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="text-center py-10 px-6 border border-danger/20 bg-danger/5 rounded-card">
      <AlertTriangle size={22} className="mx-auto text-danger" />
      <p className="text-sm text-ink mt-2">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4 text-sm" onClick={onRetry}>Try again</Button>
      )}
    </div>
  );
}
