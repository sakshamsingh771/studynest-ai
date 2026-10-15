import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineSearch } from "react-icons/hi";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import NoteCard from "../../components/notes/NoteCard.jsx";
import { notesApi } from "../../api/notesApi.js";

export default function ExplorePage() {
  const [filters, setFilters] = useState({ q: "", subject: "", college: "", semester: "", priceFilter: "", sort: "newest", page: 1 });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notes", filters],
    queryFn: () => notesApi.list(filters),
  });

  const notes = data?.data?.notes || [];
  const meta = data?.meta;

  const handleChange = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value, page: 1 }));

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-2xl font-bold text-ink">Explore Notes</h1>
        <p className="text-ink/50 mt-1">Find notes shared by students across colleges.</p>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" size={18} />
            <input
              name="q" value={filters.q} onChange={handleChange}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink/15 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
            />
          </div>
          <input
            name="subject" value={filters.subject} onChange={handleChange}
            placeholder="Subject"
            className="w-full sm:w-40 px-4 py-2.5 rounded-lg border border-ink/15 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
          <input
            name="college" value={filters.college} onChange={handleChange}
            placeholder="College"
            className="w-full sm:w-40 px-4 py-2.5 rounded-lg border border-ink/15 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
          <input
            name="semester" value={filters.semester} onChange={handleChange}
            placeholder="Semester" type="number" min={1} max={12}
            className="w-full sm:w-28 px-4 py-2.5 rounded-lg border border-ink/15 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="flex gap-1.5">
            {[{ v: "", label: "All" }, { v: "free", label: "Free" }, { v: "premium", label: "Premium" }].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setFilters((f) => ({ ...f, priceFilter: opt.v, page: 1 }))}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filters.priceFilter === opt.v ? "bg-ink-solid text-white border-ink-solid" : "border-ink/15 text-ink/60 hover:border-ink/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span className="text-ink/20">|</span>

          <div className="flex gap-1.5">
            {[
              { v: "newest", label: "Newest" },
              { v: "rating", label: "Top Rated" },
              { v: "downloads", label: "Most Downloaded" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setFilters((f) => ({ ...f, sort: opt.v, page: 1 }))}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filters.sort === opt.v ? "bg-ink-solid text-white border-ink-solid" : "border-ink/15 text-ink/60 hover:border-ink/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-ink/5 animate-pulse" />
            ))}
          </div>
        )}

        {isError && <p className="text-sm text-red-500 mt-8">Couldn't load notes. Is the backend running?</p>}

        {!isLoading && !isError && notes.length === 0 && (
          <p className="text-sm text-ink/40 mt-10 text-center">No notes found. Try a different search.</p>
        )}

        {!isLoading && notes.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {notes.map((note) => <NoteCard key={note._id} note={note} />)}
            </div>

            {meta?.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: meta.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                    className={`h-8 w-8 rounded-lg text-sm ${meta.page === i + 1 ? "bg-ink-solid text-white" : "text-ink/60 hover:bg-ink/5"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
