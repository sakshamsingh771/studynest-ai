import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineSparkles } from "react-icons/hi";
import { aiApi } from "../../api/aiApi.js";
import SummaryTab from "./SummaryTab.jsx";
import FlashcardsTab from "./FlashcardsTab.jsx";
import QuizTab from "./QuizTab.jsx";
import ChatTab from "./ChatTab.jsx";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "flashcards", label: "Flashcards" },
  { id: "quiz", label: "Quiz" },
  { id: "chat", label: "Chat" },
];

const STATUS_COPY = {
  pending: "Preparing this note for AI features...",
  processing: "Reading through the note and building its AI index — this usually takes under a minute.",
  failed: "AI features aren't available for this note (unsupported file type, or the OpenAI key isn't configured on the server).",
};

export default function AIPanel({ noteId, topicId = null, topicName = null, defaultTab = "summary" }) {
  const [tab, setTab] = useState(defaultTab);

  const { data: aiStatus } = useQuery({
    queryKey: ["ai-status", noteId],
    queryFn: () => aiApi.status(noteId),
    refetchInterval: (query) => (["pending", "processing"].includes(query.state.data) ? 3000 : false),
  });

  if (aiStatus !== "ready") {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-ink/15 p-6 text-center">
        <HiOutlineSparkles className="mx-auto text-ink/30" size={22} />
        <p className="text-sm text-ink/50 mt-2">{STATUS_COPY[aiStatus] || "Loading AI status..."}</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-xl border border-ink/10 p-5">
      <div className="flex items-center gap-2 mb-4">
        <HiOutlineSparkles className="text-teal" size={18} />
        <h2 className="font-semibold text-ink">AI Study Tools</h2>
      </div>

      <div className="flex gap-1 border-b border-ink/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-5">
        {tab === "summary" && <SummaryTab noteId={noteId} />}
        {tab === "flashcards" && <FlashcardsTab noteId={noteId} />}
        {tab === "quiz" && <QuizTab noteId={noteId} topicId={topicId} topicName={topicName} />}
        {tab === "chat" && <ChatTab noteId={noteId} />}
      </div>
    </div>
  );
}
