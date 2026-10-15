import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <p className="text-6xl font-display font-bold text-teal">404</p>
      <h1 className="text-xl font-bold text-ink mt-3">Page not found</h1>
      <p className="text-ink/50 mt-1 max-w-sm">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/" className="mt-6">
        <Button variant="primary">Back to Home</Button>
      </Link>
    </div>
  );
}
