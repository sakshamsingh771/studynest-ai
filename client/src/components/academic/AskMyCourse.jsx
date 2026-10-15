import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { HiOutlinePaperAirplane, HiOutlineSparkles } from "react-icons/hi";
import { academicApi } from "../../api/academicApi.js";
import { showAIErrorToast } from "../../utils/aiErrorToast.jsx";

// "Ask My Course" — contextual AI scoped to this topic (syllabus + mapped notes +
// PYQs), not a generic chatbot. Structured answer format + "Based on" sources are
// handled server-side (see academic.service.js askMyCourse); this component just
// renders the conversation.
export default function AskMyCourse({ topicId, topicName }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Ask me anything about "${topicName}" — I'll ground my answer in your course material and PYQs where available, and tell you clearly when something is general knowledge instead.` },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const mutation = useMutation({
    mutationFn: (question) => academicApi.askMyCourse(topicId, question),
    onSuccess: (data) => {
      const sourcesLine = data.sources?.length
        ? `\n\nBased on: ${data.sources.map((s) => s.title).join(", ")}`
        : "\n\nBased on: general subject knowledge (no mapped notes/PYQs yet for this topic).";
      setMessages((m) => [...m, { role: "assistant", text: data.answer + sourcesLine }]);
    },
    onError: (err) => {
      showAIErrorToast(err, "Couldn't get an answer right now");
      setMessages((m) => [...m, { role: "assistant", text: err.response?.data?.error?.message || "Something went wrong." }]);
    },
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
    <div className="bg-white border border-ink/10 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
        <HiOutlineSparkles size={16} className="text-teal" /> Ask My Course
      </h3>

      <div className="flex flex-col h-[360px]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] text-sm px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap ${
                m.role === "user" ? "bg-ink-solid text-white rounded-br-sm" : "bg-ink/5 text-ink rounded-bl-sm"
              }`}>
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
            placeholder={`Ask something about ${topicName}...`}
            className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
          <button type="submit" disabled={mutation.isPending} className="h-9 w-9 flex items-center justify-center rounded-lg bg-ink-solid text-white disabled:opacity-40">
            <HiOutlinePaperAirplane size={16} className="rotate-90" />
          </button>
        </form>
      </div>
    </div>
  );
}
