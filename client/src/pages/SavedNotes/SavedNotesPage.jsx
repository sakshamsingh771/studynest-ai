import { useQuery } from "@tanstack/react-query";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import NoteCard from "../../components/notes/NoteCard.jsx";
import { communityApi } from "../../api/communityApi.js";

export default function SavedNotesPage() {
  const { data: notes = [], isLoading } = useQuery({ queryKey: ["bookmarks"], queryFn: communityApi.myBookmarks });

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-10 dark:bg-zinc-950 min-h-screen">
        <h1 className="text-2xl font-bold text-ink dark:text-zinc-100">Saved Items</h1>
        <p className="text-ink/50 dark:text-zinc-400 mt-1">Notes and materials you've saved for later.</p>

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-ink/5 animate-pulse" />)}
          </div>
        )}

        {!isLoading && notes.length === 0 && (
          <p className="text-sm text-ink/40 mt-10 text-center">
            You haven't saved any notes yet. Tap the bookmark icon on any note to save it here.
          </p>
        )}

        {!isLoading && notes.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {notes.map((note) => (
              <NoteCard key={note._id} note={{ ...note, _bookmarked: true }} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
