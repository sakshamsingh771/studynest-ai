import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { aiApi } from "../../api/aiApi.js";
import { showAIErrorToast } from "../../utils/aiErrorToast.jsx";
import Button from "../ui/Button.jsx";

function Flashcard({ card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="text-left h-36 rounded-xl border border-ink/10 p-4 hover:shadow-md transition-shadow bg-white dark:bg-[#151E30]"
    >
      <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">{flipped ? "Answer" : "Question"} · tap to flip</p>
      <p className="text-sm text-ink line-clamp-5">{flipped ? card.answer : card.question}</p>
    </button>
  );
}

export default function FlashcardsTab({ noteId }) {
  const [cards, setCards] = useState(null);

  const mutation = useMutation({
    mutationFn: () => aiApi.flashcards(noteId),
    onSuccess: setCards,
    onError: (err) => showAIErrorToast(err, "Couldn't generate flashcards"),
  });

  return (
    <div>
      <Button variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Generating..." : cards ? "Regenerate Flashcards" : "Generate Flashcards"}
      </Button>

      {cards && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {cards.map((card, i) => <Flashcard key={i} card={card} />)}
        </div>
      )}
    </div>
  );
}
