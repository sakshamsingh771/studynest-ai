import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { adminApi } from "../../api/adminApi.js";
import Button from "../../components/ui/Button.jsx";

const TABS = ["Overview", "Users", "Notes", "Withdrawals"];

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-ink/10 rounded-xl p-5">
      <p className="text-xs text-ink/50 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-ink mt-1">{value}</p>
    </div>
  );
}

function OverviewTab() {
  const { data } = useQuery({ queryKey: ["admin-overview"], queryFn: adminApi.overview });
  if (!data) return <p className="text-sm text-ink/40 mt-6">Loading...</p>;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <StatCard label="Total Users" value={data.totalUsers} />
      <StatCard label="Total Notes" value={data.totalNotes} />
      <StatCard label="Flagged Notes" value={data.flaggedNotes} />
      <StatCard label="Total Revenue" value={`₹${data.totalRevenue}`} />
      <StatCard label="Total Sales" value={data.totalSales} />
      <StatCard label="Total Downloads" value={data.totalDownloads} />
      <StatCard label="AI Requests" value={data.totalAIInteractions} />
      <StatCard label="Pending Withdrawals" value={data.pendingWithdrawals} />
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const { data: users = [], refetch } = useQuery({ queryKey: ["admin-users", search], queryFn: () => adminApi.listUsers({ search }) });

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateUser(id, payload),
    onSuccess: () => { toast.success("User updated"); refetch(); },
  });

  return (
    <div className="mt-6">
      <input
        value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
        className="w-full max-w-sm rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
      />
      <div className="mt-4 space-y-2">
        {users.map((u) => (
          <div key={u._id} className="flex items-center justify-between border border-ink/10 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm text-ink font-medium">{u.name} <span className="text-xs text-ink/40">({u.email})</span></p>
              <p className="text-xs text-ink/40 capitalize">{u.role} {u.isBanned && <span className="text-red-500">· Banned</span>}</p>
            </div>
            <div className="flex gap-2">
              <select
                value={u.role}
                onChange={(e) => mutation.mutate({ id: u._id, payload: { role: e.target.value } })}
                className="text-xs border border-ink/15 rounded-lg px-2 py-1"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                variant={u.isBanned ? "outline" : "ghost"}
                className="text-xs px-3 py-1.5"
                onClick={() => mutation.mutate({ id: u._id, payload: { isBanned: !u.isBanned } })}
              >
                {u.isBanned ? "Unban" : "Ban"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesTab() {
  const [status, setStatus] = useState("flagged");
  const { data: notes = [], refetch } = useQuery({ queryKey: ["admin-notes", status], queryFn: () => adminApi.listNotes({ status }) });

  const mutation = useMutation({
    mutationFn: ({ id, newStatus }) => adminApi.moderateNote(id, newStatus),
    onSuccess: () => { toast.success("Note updated"); refetch(); },
  });

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        {["flagged", "published", "archived", "all"].map((s) => (
          <button
            key={s} onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full border capitalize ${status === s ? "bg-ink-solid text-white border-ink-solid" : "border-ink/15 text-ink/60"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {notes.length === 0 && <p className="text-sm text-ink/40">No notes in this category.</p>}
        {notes.map((n) => (
          <div key={n._id} className="flex items-center justify-between border border-ink/10 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm text-ink font-medium">{n.title}</p>
              <p className="text-xs text-ink/40">by {n.author?.name} ({n.author?.email})</p>
            </div>
            <div className="flex gap-2">
              {n.status !== "published" && (
                <Button variant="outline" className="text-xs px-3 py-1.5" onClick={() => mutation.mutate({ id: n._id, newStatus: "published" })}>Approve</Button>
              )}
              {n.status !== "archived" && (
                <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => mutation.mutate({ id: n._id, newStatus: "archived" })}>Archive</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WithdrawalsTab() {
  const { data: withdrawals = [], refetch } = useQuery({ queryKey: ["admin-withdrawals"], queryFn: () => adminApi.listWithdrawals({ status: "pending" }) });

  const mutation = useMutation({
    mutationFn: ({ id, approve }) => adminApi.resolveWithdrawal(id, approve),
    onSuccess: () => { toast.success("Withdrawal resolved"); refetch(); },
  });

  return (
    <div className="mt-6 space-y-2">
      {withdrawals.length === 0 && <p className="text-sm text-ink/40">No pending withdrawal requests.</p>}
      {withdrawals.map((w) => (
        <div key={w._id} className="flex items-center justify-between border border-ink/10 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm text-ink font-medium">₹{w.amount}</p>
            <p className="text-xs text-ink/40">{w.user?.name} ({w.user?.email})</p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" className="text-xs px-3 py-1.5" onClick={() => mutation.mutate({ id: w._id, approve: true })}>Approve</Button>
            <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => mutation.mutate({ id: w._id, approve: false })}>Reject</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Overview");

  if (user?.role !== "admin") {
    return (
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 py-16 text-center text-ink/50">
          You don't have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>

        <div className="flex gap-1 border-b border-ink/10 mt-6">
          {TABS.map((t) => (
            <button
              key={t} onClick={() => setTab(t)}
              className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && <OverviewTab />}
        {tab === "Users" && <UsersTab />}
        {tab === "Notes" && <NotesTab />}
        {tab === "Withdrawals" && <WithdrawalsTab />}
      </main>
    </div>
  );
}
