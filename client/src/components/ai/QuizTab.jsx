import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { aiApi } from "../../api/aiApi.js";
import { showAIErrorToast } from "../../utils/aiErrorToast.jsx";
import api from "../../lib/axiosInstance.js";
import Button from "../ui/Button.jsx";

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function QuizTab({ noteId, topicId = null, topicName = null }) {
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({}); // { [questionIndex]: selectedOptionIndex }
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => aiApi.quiz(noteId, difficulty),
    onSuccess: (data) => { setQuestions(data); setAnswers({}); setSubmitted(false); },
    onError: (err) => showAIErrorToast(err, "Couldn't generate quiz"),
  });

  const score = questions
    ? questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  const handleSubmitAnswers = () => {
    setSubmitted(true);
    // Fire-and-forget — persisting the score for "Quiz Performance" on the
    // dashboard shouldn't block or fail the student seeing their result.
    api.post(`/notes/${noteId}/ai/quiz/attempt`, { score, total: questions.length, difficulty, topicId }).catch(() => {});
  };

  return (
    <div>
      {topicName && (
        <p className="text-xs text-teal font-medium mb-3">
          This quiz counts toward your Estimated Mastery for "{topicName}".
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
              difficulty === d ? "bg-ink-solid text-white border-ink-solid" : "border-ink/15 text-ink/60 hover:border-ink/30"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <Button variant="primary" className="mt-4" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Generating..." : "Generate Quiz"}
      </Button>

      {questions && (
        <div className="mt-6 space-y-5">
          {questions.map((q, qi) => (
            <div key={qi} className="border border-ink/10 rounded-lg p-4">
              <p className="text-sm font-medium text-ink">{qi + 1}. {q.question}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  const isCorrect = submitted && oi === q.correctIndex;
                  const isWrongSelected = submitted && isSelected && oi !== q.correctIndex;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                        isCorrect ? "border-green-400 bg-green-50" :
                        isWrongSelected ? "border-red-300 bg-red-50" :
                        isSelected ? "border-teal bg-teal/5" : "border-ink/10 hover:border-ink/25"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="text-xs text-ink/50 mt-2">{q.explanation}</p>
              )}
            </div>
          ))}

          {!submitted ? (
            <Button variant="gold" onClick={handleSubmitAnswers}>Submit Answers</Button>
          ) : (
            <p className="text-sm font-medium text-ink">You scored {score} / {questions.length}</p>
          )}
        </div>
      )}
    </div>
  );
}
