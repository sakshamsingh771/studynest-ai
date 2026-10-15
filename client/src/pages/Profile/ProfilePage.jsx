import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/ui/Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { usersApi } from "../../api/usersApi.js";
import { dashboardApi } from "../../api/dashboardApi.js";

const BADGE_COLORS = ["bg-teal/10 text-teal", "bg-gold/10 text-gold", "bg-purple-50 text-purple-500", "bg-blue-50 text-blue-500"];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const queryClient = useQueryClient();

  const { data: overview } = useQuery({ queryKey: ["dashboard-overview"], queryFn: dashboardApi.overview });
  const { data: freshProfile } = useQuery({ queryKey: ["me-profile"], queryFn: usersApi.me });
  const badges = freshProfile?.badges || [];

  useEffect(() => {
    if (user && !form) {
      setForm({
        name: user.name || "",
        bio: user.profile?.bio || "",
        college: user.profile?.college || "",
        university: user.profile?.university || "",
        course: user.profile?.course || "",
        branch: user.profile?.branch || "",
        semester: user.profile?.semester || "",
        skills: (user.profile?.skills || []).join(", "),
      });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: () => usersApi.updateProfile(form),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success("Profile updated!");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Couldn't update profile"),
  });

  if (!user || !form) return null;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xl font-bold">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">{user.name}</h1>
              <p className="text-sm text-ink/50">{user.profile?.college || "No college set"}</p>
            </div>
          </div>
          {!editing && <Button variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: "Notes Uploaded", value: user.stats?.uploadsCount ?? 0 },
            { label: "Notes Purchased", value: overview?.notesPurchasedCount ?? 0 },
            { label: "Followers", value: user.stats?.followersCount ?? 0 },
            { label: "Following", value: user.stats?.followingCount ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-ink/10 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-ink">{s.value}</p>
              <p className="text-xs text-ink/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* XP / Level */}
        <div className="bg-white border border-ink/10 rounded-xl p-5 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Level {user.stats?.level ?? 1}</p>
            <p className="text-xs text-ink/40">{user.stats?.xp ?? 0} XP</p>
          </div>
          <div className="h-2 bg-ink/5 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-teal rounded-full" style={{ width: `${(user.stats?.xp ?? 0) % 100}%` }} />
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-ink mb-2">Achievements</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <span key={b.id} className={`text-xs font-medium px-3 py-1.5 rounded-full ${BADGE_COLORS[i % BADGE_COLORS.length]}`}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {editing ? (
          <div className="mt-8 bg-white border border-ink/10 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink/70">Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/70">Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} maxLength={300} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink/70">College</label>
                <input name="college" value={form.college} onChange={handleChange} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/70">Course</label>
                <input name="course" value={form.course} onChange={handleChange} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/70">Branch</label>
                <input name="branch" value={form.branch} onChange={handleChange} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/70">Semester</label>
                <input type="number" min={1} max={12} name="semester" value={form.semester} onChange={handleChange} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink/70">Skills (comma separated)</label>
              <input name="skills" value={form.skills} onChange={handleChange} placeholder="Python, React, DSA" className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-white border border-ink/10 rounded-xl p-6">
            {user.profile?.bio && <p className="text-sm text-ink/70">{user.profile.bio}</p>}
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <p><span className="text-ink/40">University:</span> {user.profile?.university || "—"}</p>
              <p><span className="text-ink/40">Course:</span> {user.profile?.course || "—"}</p>
              <p><span className="text-ink/40">Branch:</span> {user.profile?.branch || "—"}</p>
              <p><span className="text-ink/40">Semester:</span> {user.profile?.semester || "—"}</p>
            </div>
            {user.profile?.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {user.profile.skills.map((s) => (
                  <span key={s} className="text-xs bg-ink/5 text-ink/60 px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
