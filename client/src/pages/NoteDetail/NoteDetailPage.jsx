import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiOutlineDownload, HiOutlineEye, HiOutlineUser } from "react-icons/hi";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Button from "../../components/ui/Button.jsx";
import AIPanel from "../../components/ai/AIPanel.jsx";
import StarRating from "../../components/community/StarRating.jsx";
import FollowButton from "../../components/community/FollowButton.jsx";
import CommentsSection from "../../components/community/CommentsSection.jsx";
import ReviewsSection from "../../components/community/ReviewsSection.jsx";
import BuyButton from "../../components/marketplace/BuyButton.jsx";
import BookmarkButton from "../../components/notes/BookmarkButton.jsx";
import ShareButton from "../../components/notes/ShareButton.jsx";
import RelatedNotes from "../../components/notes/RelatedNotes.jsx";
import { notesApi } from "../../api/notesApi.js";

export default function NoteDetailPage() {
  const { id } = useParams();
  const { data: note, isLoading, isError } = useQuery({
    queryKey: ["note", id],
    queryFn: () => notesApi.getById(id),
  });

  const downloadMutation = useMutation({
    mutationFn: () => notesApi.trackDownload(id),
    onError: () => toast.error("Couldn't register download, opening file anyway."),
  });

  const handleDownload = (e) => {
    e.preventDefault();
    downloadMutation.mutate(); // credits the author's stats/XP — doesn't block opening the file
    window.open(note.file.url, "_blank", "noreferrer");
  };

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-5xl mx-auto px-5 py-16 text-center text-ink/40">Loading note...</div>
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div>
        <Navbar />
        <div className="max-w-5xl mx-auto px-5 py-16 text-center">
          <p className="text-ink/60">This note doesn't exist or was removed.</p>
          <Link to="/explore" className="text-teal text-sm mt-2 inline-block">Back to Explore</Link>
        </div>
      </div>
    );
  }

  const isPdf = note.file.type === "pdf";
  const isImage = note.file.type === "image";

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">{note.title}</h1>
            <p className="text-ink/60 mt-2 max-w-2xl">{note.description || "No description provided."}</p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-ink/50">
              <span className="flex items-center gap-1">
                <HiOutlineUser size={16} /> {note.author?.name}
              </span>
              <FollowButton userId={note.author?._id} />
              <span className="flex items-center gap-1"><HiOutlineEye size={16} /> {note.engagement?.views ?? 0} views</span>
              <span className="flex items-center gap-1"><HiOutlineDownload size={16} /> {note.engagement?.downloads ?? 0} downloads</span>
            </div>

            <div className="mt-3">
              <StarRating noteId={note._id} avgRating={note.engagement?.avgRating ?? 0} ratingCount={note.engagement?.ratingCount ?? 0} />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {note.meta?.subject && (
                <span className="text-xs bg-teal/10 text-teal px-2.5 py-1 rounded-full">{note.meta.subject}</span>
              )}
              {note.meta?.semester && (
                <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full">Sem {note.meta.semester}</span>
              )}
              {note.meta?.tags?.map((tag) => (
                <span key={tag} className="text-xs bg-ink/5 text-ink/60 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          </div>

          
          {isPdf && !note.locked && (
            <div className="mt-6 border border-ink/10 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900">
              <div className="px-4 py-2 bg-ink/5 dark:bg-zinc-800 text-sm font-medium flex justify-between items-center">
                <span>PDF Preview</span>
                <span className="text-xs text-ink/50 dark:text-zinc-400">Use browser controls or download for full features</span>
              </div>
              <iframe
                src={note.file.url}
                className="w-full h-[600px] border-0"
                title="PDF Preview"
              />
            </div>
          )}

          {!note.locked && (
            <Button variant="gold" className="whitespace-nowrap" onClick={handleDownload}>
              <span className="flex items-center gap-2"><HiOutlineDownload size={18} /> Download</span>
            </Button>
          )}
          <div className="flex items-center gap-3">
            <ShareButton noteId={note._id} title={note.title} />
            <BookmarkButton noteId={note._id} />
          </div>
        </div>

        {note.access?.isPremium && note.locked && (
          <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-ink/70">This is a premium note — purchase it to unlock the file and download.</p>
            <BuyButton noteId={note._id} price={note.access.price} />
          </div>
        )}

        {/* Built-in file viewer — inline for PDFs/images, fallback link for other types.
            A richer viewer (page nav, zoom, highlight) is planned as its own phase;
            this covers "view the file without leaving the page" for the common cases. */}
        <div className="mt-8 rounded-xl border border-ink/10 overflow-hidden bg-ink/5" style={{ minHeight: 500 }}>
          {note.locked ? (
            <div className="flex flex-col items-center justify-center h-64 text-ink/50 text-sm gap-2">
              <span>🔒 Purchase this note to view the file.</span>
            </div>
          ) : (
            <>
              {isPdf && (
                <iframe src={note.file.url} title={note.title} className="w-full" style={{ height: "75vh" }} />
              )}
              {isImage && (
                <img src={note.file.url} alt={note.title} className="w-full object-contain" />
              )}
              {!isPdf && !isImage && (
                <div className="flex flex-col items-center justify-center h-64 text-ink/50 text-sm">
                  Preview isn't available for this file type yet — use Download to view it.
                </div>
              )}
            </>
          )}
        </div>

        <AIPanel noteId={note._id} />
        <CommentsSection noteId={note._id} />
        <ReviewsSection noteId={note._id} />
        <RelatedNotes noteId={note._id} />
      </main>
      <Footer />
    </div>
  );
}
