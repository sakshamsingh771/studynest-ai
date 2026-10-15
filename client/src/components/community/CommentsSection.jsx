import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiOutlineTrash } from "react-icons/hi";
import { communityApi } from "../../api/communityApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CommentsSection({ noteId }) {
  const { isAuthenticated, user } = useAuth();
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", noteId],
    queryFn: () => communityApi.listComments(noteId),
  });

  const addMutation = useMutation({
    mutationFn: () => communityApi.addComment(noteId, text),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", noteId] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Couldn't post comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => communityApi.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", noteId] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error("Log in to comment.");
    if (!text.trim()) return;
    addMutation.mutate();
  };

  return (
    <div className="mt-10">
      <h2 className="font-semibold text-ink mb-4">Discussion ({comments.length})</h2>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder={isAuthenticated ? "Ask a question or leave a comment..." : "Log in to comment"}
          disabled={!isAuthenticated}
          className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:bg-ink/5"
        />
        <Button type="submit" variant="primary" disabled={addMutation.isPending || !isAuthenticated}>Post</Button>
      </form>

      {isLoading && <p className="text-sm text-ink/40">Loading comments...</p>}
      {!isLoading && comments.length === 0 && <p className="text-sm text-ink/40">No comments yet — be the first to ask something.</p>}

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c._id} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-semibold shrink-0">
              {c.user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink">{c.user?.name}</p>
                <p className="text-xs text-ink/40">{timeAgo(c.createdAt)}</p>
              </div>
              <p className="text-sm text-ink/70 mt-0.5">{c.text}</p>
            </div>
            {(user?._id === c.user?._id || user?.role === "admin") && (
              <button onClick={() => deleteMutation.mutate(c._id)} className="text-ink/20 hover:text-red-500">
                <HiOutlineTrash size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
