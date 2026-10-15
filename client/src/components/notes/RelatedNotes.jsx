import { useQuery } from "@tanstack/react-query";
import { notesApi } from "../../api/notesApi.js";
import NoteCard from "./NoteCard.jsx";

export default function RelatedNotes({ noteId }) {
  const { data: notes = [] } = useQuery({ queryKey: ["related-notes", noteId], queryFn: () => notesApi.getRelated(noteId) });

  if (notes.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="font-semibold text-ink mb-4">Related Notes</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {notes.map((note) => <NoteCard key={note._id} note={note} />)}
      </div>
    </div>
  );
}
