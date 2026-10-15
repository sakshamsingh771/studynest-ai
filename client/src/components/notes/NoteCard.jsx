import { Link } from "react-router-dom";
import { HiOutlineDocumentText, HiOutlineDownload, HiOutlineEye, HiOutlineLockClosed, HiStar } from "react-icons/hi";
import BookmarkButton from "./BookmarkButton.jsx";
import ShareButton from "./ShareButton.jsx";

const FILE_ICON_COLOR = {
  pdf: "bg-red-50 text-red-500",
  ppt: "bg-orange-50 text-orange-500",
  pptx: "bg-orange-50 text-orange-500",
  doc: "bg-blue-50 text-blue-500",
  docx: "bg-blue-50 text-blue-500",
  image: "bg-purple-50 text-purple-500",
  zip: "bg-gray-100 text-gray-500",
};

export default function NoteCard({ note }) {
  const colorClass = FILE_ICON_COLOR[note.file?.type] || "bg-teal/10 text-teal";

  return (
    <Link
      to={`/notes/${note._id}`}
      className="block bg-white border border-ink/10 rounded-xl p-5 hover:shadow-md hover:border-teal/30 transition-all relative"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ShareButton noteId={note._id} title={note.title} size={16} />
        <BookmarkButton noteId={note._id} size={16} initialBookmarked={!!note._bookmarked} />
      </div>

      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <HiOutlineDocumentText size={20} />
      </div>
      {note.access?.isPremium && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full mt-2">
          <HiOutlineLockClosed size={10} /> ₹{note.access.price}
        </span>
      )}
      <h3 className="font-semibold text-ink mt-3 line-clamp-2 pr-8">{note.title}</h3>
      <p className="text-xs text-ink/50 mt-1">
        {note.meta?.subject || "General"} {note.meta?.semester ? `· Sem ${note.meta.semester}` : ""}
      </p>
      <p className="text-xs text-ink/40 mt-1">by {note.author?.name || "Unknown"}</p>

      <div className="flex items-center gap-4 mt-4 text-xs text-ink/40">
        {note.engagement?.avgRating > 0 && (
          <span className="flex items-center gap-1 text-gold"><HiStar size={14} /> {note.engagement.avgRating}</span>
        )}
        <span className="flex items-center gap-1"><HiOutlineEye size={14} /> {note.engagement?.views ?? 0}</span>
        <span className="flex items-center gap-1"><HiOutlineDownload size={14} /> {note.engagement?.downloads ?? 0}</span>
      </div>
    </Link>
  );
}
