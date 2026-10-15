import { useQuery } from "@tanstack/react-query";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { gamificationApi } from "../../api/gamificationApi.js";
import { useAuth } from "../../hooks/useAuth.js";

const RANK_STYLE = {
  1: "bg-gold/15 text-gold",
  2: "bg-ink/10 text-ink/60",
  3: "bg-orange-100 text-orange-500",
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { data: users = [], isLoading } = useQuery({ queryKey: ["leaderboard"], queryFn: () => gamificationApi.leaderboard(50) });

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-2xl font-bold text-ink">Leaderboard</h1>
        <p className="text-ink/50 mt-1">Top contributors by XP, ranked platform-wide.</p>

        {isLoading && <p className="text-sm text-ink/40 mt-8">Loading...</p>}

        <div className="mt-6 space-y-1.5">
          {users.map((u, i) => {
            const rank = i + 1;
            const isMe = u._id === user?._id;
            return (
              <div
                key={u._id}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg ${isMe ? "bg-teal/5 border border-teal/20" : "border border-ink/5"}`}
              >
                <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${RANK_STYLE[rank] || "bg-ink/5 text-ink/40"}`}>
                  {rank}
                </span>
                <div className="h-8 w-8 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-semibold shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{u.name} {isMe && <span className="text-xs text-teal">(you)</span>}</p>
                  <p className="text-xs text-ink/40">{u.profile?.college || "—"} · Level {u.stats?.level}</p>
                </div>
                <p className="text-sm font-semibold text-ink">{u.stats?.xp} XP</p>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
