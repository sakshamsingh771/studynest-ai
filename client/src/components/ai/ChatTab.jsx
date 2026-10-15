import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { HiOutlinePaperAirplane } from "react-icons/hi";
import { aiApi } from "../../api/aiApi.js";

export default function ChatTab({ noteId }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me anything about this note — I'll only answer from what's actually in it." },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const mutation = useMutation({
    mutationFn: (question) => aiApi.chat(noteId, question),
    onSuccess: (answer) => setMessages((m) => [...m, { role: "assistant", text: answer }]),
    onError: (err) =>
      setMessages((m) => [
        ...m,
        { role: "assistant", text: err.response?.data?.error?.message || "Something went wrong answering that." },
      ]),
  });

  const handleSend = (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    mutation.mutate(question);
  };

  return (
    <div className="flex flex-col h-[420px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] text-sm px-3.5 py-2.5 rounded-2xl ${
                m.role === "user" ? "bg-ink-solid text-white rounded-br-sm" : "bg-ink/5 text-ink rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-ink/5 text-ink/40 text-sm px-3.5 py-2.5 rounded-2xl rounded-bl-sm">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 mt-3 border-t border-ink/10 pt-3">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Explain page 3 in simple words"
          className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
        />
        <button
          type="submit" disabled={mutation.isPending}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-ink-solid text-white disabled:opacity-40"
        >
          <HiOutlinePaperAirplane size={16} className="rotate-90" />
        </button>
      </form>
    </div>
  );
}
