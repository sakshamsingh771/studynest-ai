import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineArrowLeft, HiOutlineDocumentText } from "react-icons/hi";
import Navbar from "../../components/layout/Navbar.jsx";
import { academicApi } from "../../api/academicApi.js";
import AskMyCourse from "../../components/academic/AskMyCourse.jsx";
import MasteryBadge from "../../components/academic/MasteryBadge.jsx";

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const [activeTopicId, setActiveTopicId] = useState(null);

  const { data: mastery, isLoading } = useQuery({
    queryKey: ["subject-mastery", subjectId], queryFn: () => academicApi.getSubjectMastery(subjectId),
  });
  const { data: pyqIntel } = useQuery({
    queryKey: ["pyq-intel", subjectId], queryFn: () => academicApi.getPYQIntelligence(subjectId),
  });
  const { data: notes = [] } = useQuery({
    queryKey: ["notes-by-topic", subjectId, activeTopicId],
    queryFn: () => academicApi.listNotesByTopic(activeTopicId ? { topicId: activeTopicId } : { subjectId }),
  });

  const activeTopic = mastery?.topics?.find((t) => t.topicId === activeTopicId);
  const activeTopicPYQ = pyqIntel?.distribution?.find((d) => d.topicId === activeTopicId);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 py-10">
        <Link to="/academic" className="text-sm text-ink/50 hover:text-ink flex items-center gap-1 mb-4">
          <HiOutlineArrowLeft size={14} /> Back to My Academic Space
        </Link>

        {isLoading && <p className="text-sm text-ink/40">Loading subject...</p>}

        {mastery && (
          <>
            <h1 className="font-display text-2xl font-bold text-ink">Topics</h1>
            <p className="text-sm text-ink/60 mt-1">
              Overall preparation: <span className="font-semibold text-ink">{mastery.overallPrepPercent}%</span> across {mastery.totalTopics} topics
            </p>

            <div className="grid md:grid-cols-[320px_1fr] gap-6 mt-6">
              <div className="space-y-2">
                {mastery.topics.map((t) => (
                  <button
                    key={t.topicId}
                    onClick={() => setActiveTopicId(t.topicId)}
                    className={`w-full text-left bg-white dark:bg-[#151E30] border rounded-xl p-4 transition-colors ${
                      activeTopicId === t.topicId ? "border-teal" : "border-ink/10 hover:border-ink/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{t.topicName}</span>
                      <MasteryBadge score={t.score} state={t.state} />
                    </div>
                  </button>
                ))}
              </div>

              <div>
                {!activeTopic && (
                  <div className="bg-white dark:bg-[#151E30] border border-dashed border-ink/15 rounded-xl p-8 text-center text-sm text-ink/50">
                    Select a topic on the left to see its mastery breakdown, linked resources, PYQ history, and ask questions about it.
                  </div>
                )}

                {activeTopic && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-[#151E30] border border-ink/10 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-ink">{activeTopic.topicName}</h2>
                        <MasteryBadge score={activeTopic.score} state={activeTopic.state} />
                      </div>
                      <p className="text-xs text-ink/50 mt-1.5">{activeTopic.label}</p>
                      <p className="text-[11px] text-ink/35 mt-1">
                        Estimated Mastery is derived from your own quiz accuracy, practice frequency, and recency — it's an estimate to guide your study, not a scientific measurement.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#151E30] border border-ink/10 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-ink mb-2">PYQ Intelligence</h3>
                      {activeTopicPYQ ? (
                        <>
                          <p className="text-sm text-ink">{activeTopicPYQ.frequencyLabel} — {activeTopicPYQ.totalQuestions} question(s) across {activeTopicPYQ.distinctYears} year(s)</p>
                          <ul className="mt-3 space-y-2">
                            {activeTopicPYQ.sampleQuestions.map((q, i) => (
                              <li key={i} className="text-xs text-ink/60 border-l-2 border-ink/10 pl-3">
                                <span className="font-medium text-ink/80">{q.year}{q.examName ? ` · ${q.examName}` : ""} ({q.marks} marks):</span> {q.questionText}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="text-sm text-ink/40">No recorded PYQs yet for this topic.</p>
                      )}
                      {pyqIntel?.disclaimer && <p className="text-[11px] text-ink/35 mt-3">{pyqIntel.disclaimer}</p>}
                    </div>

                    <div className="bg-white dark:bg-[#151E30] border border-ink/10 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
                        <HiOutlineDocumentText size={16} /> Resources for this topic
                      </h3>
                      {notes.length === 0 ? (
                        <p className="text-sm text-ink/40">No notes have been mapped to this topic yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {notes.map((n) => (
                            <Link key={n._id} to={`/notes/${n._id}`} className="block text-sm text-ink hover:text-teal border border-ink/10 rounded-lg px-3 py-2">
                              {n.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <AskMyCourse topicId={activeTopicId} topicName={activeTopic.topicName} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
