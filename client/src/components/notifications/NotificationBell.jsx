import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Package, TrendingDown, AlertTriangle, Star, Mail } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const POLL_MS = 60000; // har 60 second mein naye notifications dekhta hai

const typeIcons = {
  order: Package,
  new_order: Package,
  price_drop: TrendingDown,
  low_stock: AlertTriangle,
  review: Star,
  message: Mail,
};

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(() => {
    api
      .get("/notifications")
      .then(({ data }) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {
        // chup chaap fail: bell bas purana data dikhaye
      });
  }, []);

  // Page kholte hi aur phir har 60 second baad
  useEffect(() => {
    if (!user?._id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [user?._id, load]);

  // Bahar click aur Escape par band
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const handleToggle = () => {
    if (!open) load(); // kholte waqt taaza list
    setOpen((o) => !o);
  };

  const handleClickNotification = (n) => {
    if (!n.isRead) {
      setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(c - 1, 0));
      api.put(`/notifications/${n._id}/read`).catch(() => load());
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = () => {
    setNotifications((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
    api.put("/notifications/read-all").catch(() => load());
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative rounded-full p-2 text-muted transition hover:bg-surface hover:text-primary"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs font-medium text-primary hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <Bell size={32} className="text-muted" />
                <p className="mt-2 text-sm text-muted">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <button
                    key={n._id}
                    onClick={() => handleClickNotification(n)}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-surface ${
                      n.isRead ? "" : "bg-primary/5"
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize-first text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}