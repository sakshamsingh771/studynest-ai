import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineSparkles, HiOutlineAcademicCap, HiOutlineArrowRight } from "react-icons/hi";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/ui/Button.jsx";
import { academicApi } from "../../api/academicApi.js";

function PrepBar({ percent }) {
  const color = percent >= 81 ? "bg-green-500" : percent >= 61 ? "bg-teal" : percent >= 31 ? "bg-gold" : "bg-red-400";
  return (
    <div className="w-full h-2 rounded-full bg-ink/8 overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function SubjectCard({ subject }) {
  return (
    <div className="bg-white dark:bg-[#151E30] border border-ink/10 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-ink">{subject.name}</h3>
          {subject.code && <p className="text-xs text-ink/40">{subject.code}</p>}
        </div>
        <span className="text-sm font-semibold text-ink">{subject.preparationPercent}%</span>
      </div>

      <div className="mt-3"><PrepBar percent={subject.preparationPercent} /></div>
      <p className="text-xs text-ink/40 mt-1.5">
        {subject.topicsStarted} / {subject.totalTopics} topics attempted — Estimated Mastery, based on your quiz activity
      </p>

      {subject.recommendedNext && (
        <div className="mt-4 rounded-lg bg-teal/5 border border-teal/15 p-3">
          <p className="text-xs font-semibold text-teal flex items-center gap-1.5">
            <HiOutlineSparkles size={14} /> Recommended Next
          </p>
          <p className="text-sm text-ink mt-1">{subject.recommendedNext.action}: <span className="font-medium">{subject.recommendedNext.topicName}</span></p>
          <p className="text-xs text-ink/50 mt-1">Because {subject.recommendedNext.reasons.join("; ")}.</p>
        </div>
      )}

      {subject.weakTopics?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-ink/50 mb-1.5">Needs attention</p>
          <div className="flex flex-wrap gap-1.5">
            {subject.weakTopics.slice(0, 3).map((t) => (
              <span key={t.topicId} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">{t.topicName}</span>
            ))}
          </div>
        </div>
      )}

      <Link to={`/academic/subjects/${subject.subjectId}`}>
        <Button variant="outline" className="w-full mt-4 text-sm flex items-center justify-center gap-1.5">
          Open Subject <HiOutlineArrowRight size={14} />
        </Button>
      </Link>
    </div>
  );
}

export default function AcademicSpacePage() {
  const { data, isLoading } = useQuery({ queryKey: ["academic-space"], queryFn: academicApi.getMySpace });

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2">
          <HiOutlineAcademicCap className="text-teal" size={22} />
          <h1 className="font-display text-2xl font-bold text-ink">My Academic Space</h1>
        </div>
        <p className="text-sm text-ink/60 mt-1">Your subjects, Estimated Mastery per topic, and what to study next — driven by your own quiz activity, not guesses.</p>

        {isLoading && <p className="text-sm text-ink/40 mt-8">Loading your academic space...</p>}

        {!isLoading && data && !data.academicProfileComplete && (
          <div className="mt-10 bg-white dark:bg-[#151E30] border border-dashed border-ink/15 rounded-xl p-8 text-center">
            <p className="text-ink font-medium">You haven't set up your academic profile yet.</p>
            <p className="text-sm text-ink/50 mt-1">Add your university, program, branch and semester to unlock your personalized subject dashboard.</p>
            <Link to="/academic-setup">
              <Button variant="primary" className="mt-4">Set up Academic Profile</Button>
            </Link>
          </div>
        )}

        {!isLoading && data?.academicProfileComplete && data.subjects.length === 0 && (
          <div className="mt-10 bg-white dark:bg-[#151E30] border border-dashed border-ink/15 rounded-xl p-8 text-center">
            <p className="text-ink font-medium">No subjects found yet for your branch & semester.</p>
            <p className="text-sm text-ink/50 mt-1">Ask your teacher/admin to add the syllabus for your branch, or try a different semester in your profile.</p>
          </div>
        )}

        {!isLoading && data?.subjects?.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {data.subjects.map((s) => <SubjectCard key={s.subjectId} subject={s} />)}
          </div>
        )}
      </main>
    </div>
  );
}
