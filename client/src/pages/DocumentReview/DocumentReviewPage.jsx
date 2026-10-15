import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { notesApi } from "../../api/notesApi.js";
import { aiApi } from "../../api/aiApi.js";

const errMsg = (e) => e.response?.data?.error?.message || e.message || "Something went wrong";

// Section config: label + whether the items carry quoted evidence from the note.
const SECTIONS = [
  { key: "keyConcepts", title: "Key concepts" },
  { key: "strengths", title: "Strengths" },
  { key: "weakSections", title: "Weak sections" },
  { key: "missingOrUnclear", title: "Missing or unclear explanations" },
  { key: "terminologyIssues", title: "Terminology and definitions" },
  { key: "revisionTips", title: "Revision suggestions" },
  { key: "practiceQuestions", title: "Practice questions (for practice only, not predicted exam questions)" },
];

function ReviewResult({ saved }) {
  const r = saved.review;
  return (
    <article className="mt-8 p-5 bg-white dark:bg-zinc-900 border border-ink/15 dark:border-zinc-700 rounded-xl" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-ink dark:text-zinc-100">Review result</h2>
        {r.clarityScore != null && (
          <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal-100 border border-teal/30">
            Clarity: {r.clarityScore}/10
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-ink/90 dark:text-zinc-200">{r.overview}</p>

      {SECTIONS.map(({ key, title }) =>
        r[key]?.length ? (
          <section key={key} className="mt-5">
            <h3 className="text-sm font-semibold text-ink dark:text-zinc-100">{title}</h3>
            <ul className="mt-2 space-y-2 list-disc pl-5 text-sm text-ink/90 dark:text-zinc-200">
              {r[key].map((it, i) => (
                <li key={i}>
                  {it.text}
                  {it.evidence && (
                    <blockquote className="mt-1 border-l-2 border-ink/30 dark:border-zinc-500 pl-3 text-xs italic text-ink/70 dark:text-zinc-400">
                      From your note: “{it.evidence}”
                    </blockquote>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null
      )}

      {r.limitations && (
        <p className="mt-5 text-xs rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 p-3">
          <strong>Limitations:</strong> {r.limitations}
        </p>
      )}
      <p className="text-xs text-ink/70 dark:text-zinc-400 mt-4">
        AI-generated from {saved.chunksUsed} of {saved.totalChunks} sections of your note
        {saved.model ? ` (${saved.model})` : ""} on {new Date(saved.createdAt).toLocaleString()}. Verify important facts yourself.
      </p>
    </article>
  );
}

export default function DocumentReviewPage() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const notesQ = useQuery({ queryKey: ["my-notes"], queryFn: () => notesApi.mine(), enabled: isAuthenticated });
  const notes = notesQ.data || [];

  const statusQ = useQuery({
    queryKey: ["ai-status", selectedNoteId],
    queryFn: () => aiApi.statusDetail(selectedNoteId),
    enabled: !!selectedNoteId,
    // Poll only while the server is still extracting text.
    refetchInterval: (q) => (["pending", "processing"].includes(q.state.data?.aiStatus) ? 4000 : false),
  });
  const aiStatus = statusQ.data?.aiStatus;
  const ready = aiStatus === "ready";

  const reviewsQ = useQuery({
    queryKey: ["reviews", selectedNoteId],
    queryFn: () => aiApi.listReviews(selectedNoteId),
    enabled: !!selectedNoteId,
  });
  const reviews = reviewsQ.data || [];

  // Revisit: show the newest saved review for the note automatically.
  useEffect(() => {
    setActiveReviewId(reviews[0]?._id || null);
  }, [selectedNoteId, reviewsQ.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = reviews.find((r) => r._id === activeReviewId);

  const generate = useMutation({
    mutationFn: () => aiApi.createReview(selectedNoteId),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["reviews", selectedNoteId] });
      setActiveReviewId(saved._id);
      toast.success("Review generated and saved");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const reprocess = useMutation({
    mutationFn: () => aiApi.reprocess(selectedNoteId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-status", selectedNoteId] }); toast.success("Reprocessing started"); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => aiApi.deleteReview(selectedNoteId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reviews", selectedNoteId] }); setConfirmDelete(null); toast.success("Review deleted"); },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (!isAuthenticated) {
    return (
      <div className="dark:bg-zinc-950 min-h-screen">
        <Navbar />
        <p className="p-10 text-center text-ink dark:text-zinc-200">Please log in to use Document Review.</p>
      </div>
    );
  }

  return (
    <div className="dark:bg-zinc-950 min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold text-ink dark:text-zinc-100">Document Review</h1>
        <p className="text-ink/70 dark:text-zinc-400 mt-1">
          Get structured, evidence-backed feedback on one of your uploaded notes. Reviews are saved so you can revisit them.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="review-note" className="block text-sm font-medium text-ink dark:text-zinc-200 mb-1">Select a note</label>
            <select
              id="review-note"
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="w-full rounded-lg border border-ink/30 dark:border-zinc-600 px-3 py-2 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal"
              disabled={notesQ.isLoading || notesQ.isError}
            >
              <option value="">Choose one of your notes</option>
              {notes.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.title} ({n.file?.type || "file"}{n.meta?.subject ? `, ${n.meta.subject}` : ""})
                </option>
              ))}
            </select>
            {notesQ.isLoading && <p className="text-xs text-ink/70 dark:text-zinc-400 mt-1">Loading your notes…</p>}
            {notesQ.isError && (
              <p role="alert" className="text-xs text-red-700 dark:text-red-300 mt-1">
                Could not load your notes. <button className="underline" onClick={() => notesQ.refetch()}>Retry</button>
              </p>
            )}
            {!notesQ.isLoading && !notesQ.isError && notes.length === 0 && (
              <p className="text-sm text-ink/80 dark:text-zinc-300 mt-2">
                You have no notes yet. <Link to="/upload" className="underline text-teal dark:text-teal-200">Upload one first</Link>.
              </p>
            )}
          </div>

          {selectedNoteId && statusQ.isLoading && <p className="text-sm text-ink/70 dark:text-zinc-400">Checking document status…</p>}
          {selectedNoteId && statusQ.isError && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">{errMsg(statusQ.error)}</p>
          )}
          {selectedNoteId && ["pending", "processing"].includes(aiStatus) && (
            <p role="status" className="text-sm rounded-lg border border-ink/20 dark:border-zinc-600 p-3 text-ink dark:text-zinc-200">
              This note is still being processed (text extraction). This page will update automatically.
            </p>
          )}
          {selectedNoteId && aiStatus === "failed" && (
            <div role="alert" className="text-sm rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 p-3 text-red-900 dark:text-red-200">
              <p><strong>This note can’t be reviewed:</strong> {statusQ.data?.reason || "text could not be extracted."}</p>
              <button
                onClick={() => reprocess.mutate()}
                disabled={reprocess.isPending}
                className="mt-2 px-3 py-1.5 rounded-lg border border-red-400 dark:border-red-600 font-medium disabled:opacity-60"
              >
                {reprocess.isPending ? "Starting…" : "Retry processing"}
              </button>
            </div>
          )}

          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending || !selectedNoteId || !ready}
            className="px-4 py-2 bg-teal text-white rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal"
          >
            {generate.isPending ? "Reviewing your note… this can take up to a minute" : reviews.length ? "Generate a new review" : "Generate review"}
          </button>
        </div>

        {selectedNoteId && reviews.length > 1 && (
          <div className="mt-6">
            <label htmlFor="review-history" className="block text-sm font-medium text-ink dark:text-zinc-200 mb-1">Previous reviews</label>
            <select
              id="review-history"
              value={activeReviewId || ""}
              onChange={(e) => setActiveReviewId(e.target.value)}
              className="w-full rounded-lg border border-ink/30 dark:border-zinc-600 px-3 py-2 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100"
            >
              {reviews.map((r) => (
                <option key={r._id} value={r._id}>{new Date(r.createdAt).toLocaleString()}</option>
              ))}
            </select>
          </div>
        )}

        {selectedNoteId && reviewsQ.isLoading && <p className="mt-6 text-sm text-ink/70 dark:text-zinc-400">Loading saved reviews…</p>}
        {active && (
          <>
            <ReviewResult saved={active} />
            <button
              onClick={() => setConfirmDelete(active._id)}
              className="mt-3 text-sm underline text-red-700 dark:text-red-300"
            >
              Delete this review
            </button>
          </>
        )}
        {selectedNoteId && !reviewsQ.isLoading && reviews.length === 0 && ready && !generate.isPending && (
          <p className="mt-6 text-sm text-ink/70 dark:text-zinc-400">No saved review for this note yet.</p>
        )}
      </main>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove.mutate(confirmDelete)}
        title="Delete this review?"
        description="This permanently removes the saved review. Your note is not affected."
        confirmLabel="Delete"
        danger
        loading={remove.isPending}
      />
    </div>
  );
}
