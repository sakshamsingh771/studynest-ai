import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiStar, HiOutlineStar } from "react-icons/hi";
import { communityApi } from "../../api/communityApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";

function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function ReviewsSection({ noteId }) {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({ queryKey: ["reviews", noteId], queryFn: () => communityApi.listReviews(noteId) });

  const mutation = useMutation({
    mutationFn: () => communityApi.rateNote(noteId, rating, text),
    onSuccess: () => {
      toast.success("Review posted!");
      setShowForm(false);
      setRating(0);
      setText("");
      queryClient.invalidateQueries({ queryKey: ["reviews", noteId] });
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Couldn't post review"),
  });

  const handleSubmit = () => {
    if (!isAuthenticated) return toast.error("Log in to write a review.");
    if (rating === 0) return toast.error("Select a star rating first.");
    mutation.mutate();
  };

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Reviews ({reviews.length})</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="text-sm text-teal font-medium hover:underline">
            Write a review
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-4 border border-ink/10 rounded-lg p-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)} className="text-gold">
                {star <= rating ? <HiStar size={22} /> : <HiOutlineStar size={22} />}
              </button>
            ))}
          </div>
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500}
            placeholder="Share your thoughts on this note (optional)..."
            className="w-full mt-3 rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
          <div className="flex items-center gap-2 mt-3">
            <Button variant="primary" className="text-sm" onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? "Posting..." : "Post Review"}
            </Button>
            <Button variant="ghost" className="text-sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {reviews.length === 0 && !showForm && <p className="text-sm text-ink/40">No written reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r._id} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-semibold shrink-0">
              {r.user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink">{r.user?.name}</p>
                <div className="flex text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <HiStar key={i} size={12} className={i < r.value ? "" : "opacity-20"} />
                  ))}
                </div>
                <p className="text-xs text-ink/40">{timeAgo(r.createdAt)}</p>
              </div>
              <p className="text-sm text-ink/70 mt-1">{r.reviewText}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
