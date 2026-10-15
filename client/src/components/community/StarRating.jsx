import { useState } from "react";
import { HiStar, HiOutlineStar } from "react-icons/hi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { communityApi } from "../../api/communityApi.js";
import { useAuth } from "../../hooks/useAuth.js";

export default function StarRating({ noteId, avgRating = 0, ratingCount = 0 }) {
  const { isAuthenticated } = useAuth();
  const [hovered, setHovered] = useState(0);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (value) => communityApi.rateNote(noteId, value),
    onSuccess: () => {
      toast.success("Thanks for rating!");
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Couldn't submit rating"),
  });

  const handleClick = (value) => {
    if (!isAuthenticated) return toast.error("Log in to rate this note.");
    mutation.mutate(value);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hovered || Math.round(avgRating));
          return (
            <button key={star} onMouseEnter={() => setHovered(star)} onClick={() => handleClick(star)} className="text-gold">
              {filled ? <HiStar size={18} /> : <HiOutlineStar size={18} />}
            </button>
          );
        })}
      </div>
      <span className="text-xs text-ink/50">{avgRating.toFixed(1)} ({ratingCount})</span>
    </div>
  );
}
