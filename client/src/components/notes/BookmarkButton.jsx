import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiBookmark, HiOutlineBookmark } from "react-icons/hi";
import { communityApi } from "../../api/communityApi.js";
import { useAuth } from "../../hooks/useAuth.js";

// Controlled from outside via `initialBookmarked` where the parent already
// knows the state (e.g. the Saved Notes list, where every item IS a bookmark);
// otherwise defaults to false and just toggles optimistically on click.
export default function BookmarkButton({ noteId, initialBookmarked = false, size = 18, className = "" }) {
  const { isAuthenticated } = useAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => communityApi.toggleBookmark(noteId),
    onSuccess: (data) => {
      setBookmarked(data.bookmarked);
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: () => toast.error("Couldn't update bookmark"),
  });

  const handleClick = (e) => {
    e.preventDefault(); // guard against being nested inside a <Link> (NoteCard)
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Log in to save notes.");
    mutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      className={`text-ink/40 hover:text-gold transition-colors ${bookmarked ? "text-gold" : ""} ${className}`}
      aria-label={bookmarked ? "Remove bookmark" : "Save note"}
    >
      {bookmarked ? <HiBookmark size={size} /> : <HiOutlineBookmark size={size} />}
    </button>
  );
}
