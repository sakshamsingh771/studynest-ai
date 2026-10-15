import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HiOutlineBell } from "react-icons/hi";
import { notificationsApi } from "../../api/notificationsApi.js";
import { getSocket } from "../../lib/socket.js";

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list });
  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Live push: when the server emits a "notification" event over the socket
  // this user already has open (see sockets/index.js emitToUser), we just
  // refetch the list rather than juggling manual cache surgery — the list is
  // small (max 50), so a refetch is cheap and always correct.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [queryClient]);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      await notificationsApi.markAllRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 rounded-full hover:bg-ink/5 text-ink/70" aria-label="Notifications">
        <HiOutlineBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-ink/10 max-h-96 overflow-y-auto z-50">
          <p className="text-xs font-semibold text-ink/50 px-4 py-3 border-b border-ink/5">Notifications</p>
          {notifications.length === 0 && (
            <p className="text-sm text-ink/40 text-center py-8">No notifications yet.</p>
          )}
          {notifications.map((n) => (
            <div key={n._id} className={`px-4 py-3 text-sm border-b border-ink/5 ${!n.isRead ? "bg-teal/5" : ""}`}>
              <p className="text-ink/80">{n.message}</p>
              <p className="text-xs text-ink/40 mt-1">{timeAgo(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
