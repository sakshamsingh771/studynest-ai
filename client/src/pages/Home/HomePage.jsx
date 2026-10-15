import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  Sparkles, MessageSquareText, Zap, BookOpenCheck, UploadCloud, ChevronDown,
  ArrowRight, FileText, Target, BrainCircuit, Calendar,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Button from "../../components/ui/Button.jsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "summary", label: "AI Summary" },
  { id: "practice", label: "Practice" },
];

const WORKFLOW = [
  { id: "collect", title: "Collect", desc: "Upload and organize your notes", to: "/upload" },
  { id: "understand", title: "Understand", desc: "AI summaries and chat", to: "/document-review" },
  { id: "practise", title: "Practise", desc: "Quizzes and flashcards", to: "/explore" },
  { id: "review", title: "Review", desc: "Feedback and weak topics", to: "/academic" },
  { id: "improve", title: "Improve", desc: "Plan your next session", to: "/study-planner" },
];

const FAQS = [
  { q: "Is StudyNest AI free to use?", a: "Yes. Core features including notes, basic AI summaries, flashcards, quizzes (with daily limits), and academic tracking are free. Premium removes limits and unlocks the full marketplace." },
  { q: "Does the AI invent answers?", a: "No. Chat with Notes and Ask My Course are grounded in your uploaded material. The assistant clearly says when something is not covered." },
  { q: "How is Estimated Mastery calculated?", a: "From your own quiz accuracy, practice frequency, and recency on a topic. It is an estimate to guide study, not a certified score." },
  { q: "Can I sell my notes?", a: "Yes, through the marketplace. Payments are verified on the server via Razorpay before wallet credit." },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E2E8F0] dark:border-[#2A374D] py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 rounded"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-[#172033] dark:text-[#F1F5F9]">{q}</span>
        <ChevronDown size={16} className={`text-[#58657A] dark:text-[#B0BDD0] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-[#58657A] dark:text-[#B0BDD0] mt-2 leading-relaxed">{a}</p>}
    </div>
  );
}

function ProductPreview({ tab }) {
  if (tab === "summary") {
    return (
      <div className="space-y-3 text-sm">
        <p className="font-medium text-[#172033] dark:text-[#F1F5F9]">AI Summary · Linked Lists</p>
        <p className="text-[#58657A] dark:text-[#B0BDD0] leading-relaxed">
          A linked list is a linear data structure where elements are stored in nodes. Each node contains data and a reference to the next node. Singly linked lists allow forward traversal; doubly linked lists allow both directions.
        </p>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-[#EEF2FF] dark:bg-[#1B263A] text-[#4F46E5] dark:text-[#818CF8]">Key concept</span>
          <span className="px-2 py-1 rounded bg-[#EEF2FF] dark:bg-[#1B263A] text-[#4F46E5] dark:text-[#818CF8]">Exam ready</span>
        </div>
      </div>
    );
  }
  if (tab === "practice") {
    return (
      <div className="space-y-3 text-sm">
        <p className="font-medium text-[#172033] dark:text-[#F1F5F9]">Practice Quiz · 1 of 5</p>
        <p className="text-[#172033] dark:text-[#F1F5F9]">What is the time complexity of searching in a singly linked list?</p>
        <div className="space-y-2">
          {["O(1)", "O(log n)", "O(n)", "O(n²)"].map((opt, i) => (
            <div key={opt} className={`px-3 py-2 rounded-lg border text-xs ${i === 2 ? "border-[#4F46E5] bg-[#EEF2FF] dark:bg-[#1B263A] text-[#172033] dark:text-[#F1F5F9]" : "border-[#E2E8F0] dark:border-[#2A374D] text-[#58657A] dark:text-[#B0BDD0]"}`}>
              {opt}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#172033] dark:text-[#F1F5F9]">Data Structures · Sem 3</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">Sample</span>
      </div>
      <PreviewRow title="Binary Trees & Traversals" progress={72} status="Good" />
      <PreviewRow title="Singly & Doubly Linked Lists" progress={38} status="Developing" />
      <PreviewRow title="Graph Traversals (BFS/DFS)" progress={0} status="Not started" />
      <div className="mt-3 p-3 rounded-lg bg-[#EEF2FF] dark:bg-[#1B263A] border border-[#C7D2FE] dark:border-[#2A374D]">
        <p className="text-xs font-medium text-[#4F46E5] dark:text-[#818CF8] flex items-center gap-1"><Target size={12} /> Recommended Next</p>
        <p className="text-sm text-[#172033] dark:text-[#F1F5F9] mt-1">Review and re-quiz: Linked Lists</p>
      </div>
    </div>
  );
}

function PreviewRow({ title, progress, status }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#172033] dark:text-[#F1F5F9]">{title}</span>
        <span className="text-[#58657A] dark:text-[#B0BDD0]">{progress}% · {status}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#E2E8F0] dark:bg-[#2A374D] overflow-hidden">
        <div className="h-full bg-[#4F46E5] dark:bg-[#818CF8]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const firstName = user?.name?.split(" ")[0];
  const [tab, setTab] = useState("overview");
  const [activeStage, setActiveStage] = useState("understand");

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0B1020]">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 md:pt-14 md:pb-18">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-[#4F46E5] dark:text-[#818CF8] mb-3">
              Your personal AI academic workspace
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-[#172033] dark:text-[#F1F5F9] leading-[1.15]">
              Your notes have potential.<br className="hidden sm:block" /> Turn them into progress.
            </h1>
            <p className="mt-4 text-base md:text-lg text-[#58657A] dark:text-[#B0BDD0] max-w-md">
              Understand difficult concepts, practise what you learn, and organize your entire study journey in one intelligent workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-[#58657A] dark:text-[#B0BDD0]">
              <span className="flex items-center gap-1"><Sparkles size={14} /> AI Summaries</span>
              <span className="flex items-center gap-1"><Zap size={14} /> Instant Quizzes</span>
              <span className="flex items-center gap-1"><BookOpenCheck size={14} /> Academic Tracking</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard"><Button variant="primary" className="px-6 py-3">Continue Learning</Button></Link>
                  <Link to="/explore"><Button variant="outline" className="px-6 py-3">Explore Notes</Button></Link>
                </>
              ) : (
                <>
                  <Link to="/signup"><Button variant="primary" className="px-6 py-3">Get Started Free</Button></Link>
                  <Link to="/explore"><Button variant="outline" className="px-6 py-3">Explore Study Tools</Button></Link>
                </>
              )}
            </div>
            {isAuthenticated && firstName && (
              <p className="mt-3 text-sm text-[#58657A] dark:text-[#B0BDD0]">Welcome back, {firstName}.</p>
            )}
          </motion.div>

          {/* Interactive product preview */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D] rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex border-b border-[#E2E8F0] dark:border-[#2A374D]">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-3 text-sm font-medium transition ${tab === t.id ? "text-[#4F46E5] dark:text-[#818CF8] border-b-2 border-[#4F46E5] dark:border-[#818CF8]" : "text-[#58657A] dark:text-[#B0BDD0] hover:text-[#172033] dark:hover:text-[#F1F5F9]"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-5 min-h-[220px]">
              <ProductPreview tab={tab} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 border-t border-[#E2E8F0] dark:border-[#2A374D]">
        <h2 className="text-lg font-bold text-[#172033] dark:text-[#F1F5F9] mb-5">Start with your study material</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: UploadCloud, title: "Upload Notes", desc: "Add PDFs and start", to: isAuthenticated ? "/upload" : "/login" },
            { icon: FileText, title: "Generate Summary", desc: "AI feedback on notes", to: isAuthenticated ? "/document-review" : "/login" },
            { icon: Zap, title: "Practise with Quiz", desc: "Test yourself now", to: "/explore" },
            { icon: BookOpenCheck, title: "Explore Resources", desc: "Discover shared notes", to: "/explore" },
          ].map((a) => (
            <Link key={a.title} to={a.to} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D] hover:border-[#4F46E5]/40 dark:hover:border-[#818CF8]/40 transition group">
              <a.icon size={20} className="text-[#4F46E5] dark:text-[#818CF8] shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#172033] dark:text-[#F1F5F9] group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]">{a.title}</p>
                <p className="text-xs text-[#58657A] dark:text-[#B0BDD0]">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Interactive workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-lg font-bold text-[#172033] dark:text-[#F1F5F9] mb-1">Connected learning journey</h2>
        <p className="text-sm text-[#58657A] dark:text-[#B0BDD0] mb-6">Your tools work together — not as separate utilities.</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {WORKFLOW.map((w) => (
            <button
              key={w.id}
              onClick={() => setActiveStage(w.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeStage === w.id ? "bg-[#4F46E5] dark:bg-[#818CF8] text-white" : "bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D] text-[#172033] dark:text-[#F1F5F9] hover:border-[#4F46E5]/50"}`}
            >
              {w.title}
            </button>
          ))}
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D]">
          {WORKFLOW.filter((w) => w.id === activeStage).map((w) => (
            <div key={w.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-[#172033] dark:text-[#F1F5F9]">{w.title}</p>
                <p className="text-sm text-[#58657A] dark:text-[#B0BDD0] mt-1">{w.desc}</p>
              </div>
              <Link to={isAuthenticated || w.to === "/explore" ? w.to : "/login"} className="inline-flex items-center gap-1 text-sm font-medium text-[#4F46E5] dark:text-[#818CF8] hover:underline">
                Open <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Feature showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-lg font-bold text-[#172033] dark:text-[#F1F5F9] mb-6">What you can do</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-white dark:from-[#1B263A] dark:to-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D]">
            <Sparkles className="text-[#4F46E5] dark:text-[#818CF8] mb-3" size={24} />
            <h3 className="text-lg font-semibold text-[#172033] dark:text-[#F1F5F9]">AI-powered learning from your notes</h3>
            <p className="text-sm text-[#58657A] dark:text-[#B0BDD0] mt-2 mb-4">Generate summaries, chat with your material, and get answers grounded in what you uploaded.</p>
            <Link to={isAuthenticated ? "/document-review" : "/login"} className="text-sm font-medium text-[#4F46E5] dark:text-[#818CF8] hover:underline">Try Document Review →</Link>
          </div>
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D]">
              <Zap className="text-[#4F46E5] dark:text-[#818CF8] mb-2" size={20} />
              <p className="font-medium text-[#172033] dark:text-[#F1F5F9]">Quizzes & Flashcards</p>
              <p className="text-xs text-[#58657A] dark:text-[#B0BDD0] mt-1">Practise from your own notes.</p>
              <Link to="/explore" className="text-xs text-[#4F46E5] dark:text-[#818CF8] hover:underline mt-2 inline-block">Explore →</Link>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D]">
              <Calendar className="text-[#4F46E5] dark:text-[#818CF8] mb-2" size={20} />
              <p className="font-medium text-[#172033] dark:text-[#F1F5F9]">Study Planner</p>
              <p className="text-xs text-[#58657A] dark:text-[#B0BDD0] mt-1">Schedule and track sessions.</p>
              <Link to={isAuthenticated ? "/study-planner" : "/login"} className="text-xs text-[#4F46E5] dark:text-[#818CF8] hover:underline mt-2 inline-block">Open Planner →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-lg font-bold text-[#172033] dark:text-[#F1F5F9] mb-6">Frequently asked questions</h2>
        {FAQS.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center">
        <h2 className="text-2xl font-bold text-[#172033] dark:text-[#F1F5F9]">Ready to turn notes into progress?</h2>
        <p className="mt-2 text-[#58657A] dark:text-[#B0BDD0]">Join students studying smarter with connected AI tools.</p>
        <div className="mt-6">
          {isAuthenticated ? (
            <Link to="/dashboard"><Button variant="primary" className="px-6 py-3">Open Dashboard</Button></Link>
          ) : (
            <Link to="/signup"><Button variant="primary" className="px-6 py-3">Create Your Account</Button></Link>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
