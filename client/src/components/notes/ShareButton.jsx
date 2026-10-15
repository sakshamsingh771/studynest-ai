import toast from "react-hot-toast";
import { HiOutlineShare } from "react-icons/hi";

export default function ShareButton({ noteId, title, size = 18, className = "" }) {
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/notes/${noteId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <button onClick={handleShare} className={`text-ink/40 hover:text-teal transition-colors ${className}`} aria-label="Share note">
      <HiOutlineShare size={size} />
    </button>
  );
}
