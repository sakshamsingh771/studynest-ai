import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { dashboardApi } from "../../api/dashboardApi.js";
import { academicApi } from "../../api/academicApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import NoteCard from "../../components/notes/NoteCard.jsx";
import StreakBadge from "../../components/gamification/StreakBadge.jsx";
import { Upload, BookOpen, Calendar, FileText, Sparkles, Target } from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Upload Notes", to: "/upload", icon: Upload, desc: "Add study material" },
  { label: "Study Planner", to: "/study-planner", icon: Calendar, desc: "Plan your sessions" },
  { label: "Document Review", to: "/document-review", icon: FileText, desc: "AI feedback on notes" },
  { label: "Academic Space", to: "/academic", icon: BookOpen, desc: "Track mastery" },
  { label: "Explore Notes", to: "/explore", icon: Sparkles, desc: "Discover resources" },
  { label: "Saved Items", to: "/saved-notes", icon: Target, desc: "Your bookmarks" },
];

export default function Dashboard() {
  const { user, status } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: dashboardApi.overview,
    enabled: status === "authenticated",
    retry: 1,
  });

  const { data: academicProfile } = useQuery({
    queryKey: ["academic-profile"],
    queryFn: academicApi.getMyProfile,
    enabled: status === "authenticated",
    retry: 1,
  });

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0B1020]">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "there";
  const academicIncomplete = academicProfile && !academicProfile.branch;

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0B1020]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#172033] dark:text-[#F1F5F9]">
              Welcome back, {firstName}
            </h1>
            <p className="text-[#58657A] dark:text-[#B0BDD0] mt-1">
              Ready to continue learning? Here's your overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StreakBadge streak={data?.streak} />
            <Link to="/upload" className="px-4 py-2 bg-[#4F46E5] dark:bg-[#818CF8] text-white rounded-lg text-sm font-medium hover:opacity-90">
              Upload Notes
            </Link>
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
            <span>Could not load dashboard data.</span>
            <button onClick={() => refetch()} className="font-medium underline">Retry</button>
          </div>
        )}

        {/* Academic setup banner */}
        {academicIncomplete && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <p className="text-sm text-[#172033] dark:text-[#F1F5F9]">
              Complete your <span className="font-semibold">Academic Profile</span> to unlock personalized tracking.
            </p>
            <Link to="/academic-setup" className="text-sm font-medium text-[#4F46E5] dark:text-[#818CF8] hover:underline">Set up →</Link>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="p-4 rounded-xl bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D] hover:shadow-md transition group"
            >
              <action.icon size={20} className="text-[#4F46E5] dark:text-[#818CF8] mb-2" />
              <p className="text-sm font-medium text-[#172033] dark:text-[#F1F5F9] group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]">{action.label}</p>
              <p className="text-xs text-[#58657A] dark:text-[#B0BDD0] mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Stats row */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-white/50 dark:bg-[#151E30]/50 animate-pulse" />)}
          </div>
        ) : data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Uploads" value={data.stats.uploadsCount ?? 0} />
            <StatCard label="Downloads" value={data.stats.downloadsCount ?? 0} />
            <StatCard label="XP" value={data.stats.xp ?? 0} />
            <StatCard label="Level" value={data.stats.level ?? 1} />
          </div>
        )}

        {/* Recent / Continue */}
        <div className="space-y-8">
          <NoteRow title="Continue Learning" notes={data?.recentNotes} emptyText="Upload a note to get started." />
          <NoteRow title="Recommended for you" notes={data?.recommended} emptyText="Explore notes to see recommendations." />
        </div>

        {/* Empty onboarding */}
        {!isLoading && !isError && (!data?.recentNotes?.length && !data?.stats?.uploadsCount) && (
          <div className="mt-10 p-8 rounded-2xl bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D] text-center">
            <h2 className="text-lg font-semibold text-[#172033] dark:text-[#F1F5F9] mb-2">Get started with StudyNest AI</h2>
            <p className="text-sm text-[#58657A] dark:text-[#B0BDD0] mb-6">Upload notes, set up your academic profile, and start using AI tools.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/upload" className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-sm">Upload Notes</Link>
              <Link to="/academic-setup" className="px-4 py-2 border border-[#E2E8F0] dark:border-[#2A374D] rounded-lg text-sm text-[#172033] dark:text-[#F1F5F9]">Set Academic Profile</Link>
              <Link to="/explore" className="px-4 py-2 border border-[#E2E8F0] dark:border-[#2A374D] rounded-lg text-sm text-[#172033] dark:text-[#F1F5F9]">Explore Notes</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D]">
      <p className="text-xs uppercase tracking-wide text-[#58657A] dark:text-[#B0BDD0]">{label}</p>
      <p className="text-2xl font-bold text-[#172033] dark:text-[#F1F5F9] mt-1">{value}</p>
    </div>
  );
}

function NoteRow({ title, notes, emptyText }) {
  if (!notes || notes.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-[#172033] dark:text-[#F1F5F9] mb-3">{title}</h2>
        <p className="text-sm text-[#58657A] dark:text-[#B0BDD0]">{emptyText}</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-sm font-semibold text-[#172033] dark:text-[#F1F5F9] mb-3">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {notes.map((note) => <NoteCard key={note._id} note={note} />)}
      </div>
    </div>
  );
}
