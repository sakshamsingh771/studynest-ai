import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { useAuth } from "../../hooks/useAuth.js";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import Button from "../ui/Button.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLearnOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const closeMobile = () => setOpen(false);

  // Escape closes the mobile drawer, matching standard menu/dialog keyboard behavior.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    // Lock page scroll behind the full-screen drawer while it's open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0B1020]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#2A374D]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link to="/" className="font-display font-bold text-lg flex items-center gap-2 shrink-0 text-[#172033] dark:text-[#F1F5F9]">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#818CF8]" />
          StudyNest <span className="text-[#4F46E5] dark:text-[#818CF8]">AI</span>
        </Link>

        {/* Desktop center nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          <Link to="/" className="text-[#58657A] dark:text-[#B0BDD0] hover:text-[#4F46E5] dark:hover:text-[#818CF8]">Home</Link>
          <Link to="/explore" className="text-[#58657A] dark:text-[#B0BDD0] hover:text-[#4F46E5] dark:hover:text-[#818CF8]">Explore</Link>
          {isAuthenticated && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLearnOpen((v) => !v)}
                className="flex items-center gap-1 text-[#58657A] dark:text-[#B0BDD0] hover:text-[#4F46E5] dark:hover:text-[#818CF8]"
              >
                My Learning <ChevronDown size={14} />
              </button>
              {learnOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#151E30] border border-[#E2E8F0] dark:border-[#2A374D] rounded-xl shadow-lg py-2 z-50">
                  <Link to="/dashboard" className="block px-4 py-2 text-sm text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F7F8FC] dark:hover:bg-[#1B263A]" onClick={() => setLearnOpen(false)}>Dashboard</Link>
                  <Link to="/academic" className="block px-4 py-2 text-sm text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F7F8FC] dark:hover:bg-[#1B263A]" onClick={() => setLearnOpen(false)}>Academic Space</Link>
                  <Link to="/study-planner" className="block px-4 py-2 text-sm text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F7F8FC] dark:hover:bg-[#1B263A]" onClick={() => setLearnOpen(false)}>Study Planner</Link>
                  <Link to="/upload" className="block px-4 py-2 text-sm text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F7F8FC] dark:hover:bg-[#1B263A]" onClick={() => setLearnOpen(false)}>Upload Notes</Link>
                  <Link to="/document-review" className="block px-4 py-2 text-sm text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F7F8FC] dark:hover:bg-[#1B263A]" onClick={() => setLearnOpen(false)}>Document Review</Link>
                  <Link to="/saved-notes" className="block px-4 py-2 text-sm text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F7F8FC] dark:hover:bg-[#1B263A]" onClick={() => setLearnOpen(false)}>Saved Items</Link>
                  <Link to="/wishlist" className="block px-4 py-2 text-sm text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F7F8FC] dark:hover:bg-[#1B263A]" onClick={() => setLearnOpen(false)}>Wishlist</Link>
                </div>
              )}
            </div>
          )}
          <Link to="/premium" className="text-[#58657A] dark:text-[#B0BDD0] hover:text-[#4F46E5] dark:hover:text-[#818CF8]">Premium</Link>
        </div>

        {/* Right utilities */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-[#EEF2FF] dark:hover:bg-[#1B263A] text-[#4F46E5] dark:text-[#818CF8] transition"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={`Theme: ${theme}`}
          >
            {theme === "dark" ? <Moon size={18} /> : theme === "light" ? <Sun size={18} /> : <Monitor size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Link to="/profile" className="hidden sm:flex items-center gap-1.5 text-sm text-[#172033] dark:text-[#F1F5F9] px-2 py-1 rounded-lg hover:bg-[#F7F8FC] dark:hover:bg-[#1B263A]">
                <span className="h-6 w-6 rounded-full bg-[#4F46E5] text-white text-xs flex items-center justify-center font-medium">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="hidden md:inline">{user?.name?.split(" ")[0]}</span>
              </Link>
              <Button variant="outline" onClick={logout} className="text-xs px-3">Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm">Login</Button>
              <Button variant="primary" onClick={() => navigate("/signup")} className="text-sm">Sign Up</Button>
            </>
          )}

          <button
            className="lg:hidden p-2 text-[#172033] dark:text-[#F1F5F9]"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
          >
            {open ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer — rendered through a portal to document.body rather than as a
          child of <header>. <header> has `backdrop-blur-md` (backdrop-filter), which
          per the CSS spec creates a new containing block for any `position: fixed`
          descendant. With the drawer nested inside header, its "fixed inset-0 top-16"
          was being resolved against header's own ~64px-tall box instead of the
          viewport, collapsing it to ~1px tall — invisible, even though the hamburger
          icon correctly flipped to a close (X) icon. This is the root cause of
          "hamburger turns into X but no menu appears." Portaling to document.body
          removes the drawer from that containing block entirely. */}
      {open && createPortal(
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="lg:hidden fixed inset-0 top-16 bg-white dark:bg-[#0B1020] z-[100] overflow-y-auto shadow-2xl border-t border-[#E2E8F0] dark:border-[#334155]"
        >
          <div className="px-5 py-6 flex flex-col gap-1 text-sm">
            <Link to="/" className="py-3 text-[#172033] dark:text-[#F1F5F9] border-b border-[#E2E8F0] dark:border-[#2A374D]" onClick={closeMobile}>Home</Link>
            <Link to="/explore" className="py-3 text-[#172033] dark:text-[#F1F5F9] border-b border-[#E2E8F0] dark:border-[#2A374D]" onClick={closeMobile}>Explore</Link>
            {isAuthenticated && (
              <>
                <p className="pt-4 pb-1 text-xs uppercase tracking-wide text-[#8291A8]">My Learning</p>
                <Link to="/dashboard" className="py-2.5 pl-2 text-[#172033] dark:text-[#F1F5F9]" onClick={closeMobile}>Dashboard</Link>
                <Link to="/academic" className="py-2.5 pl-2 text-[#172033] dark:text-[#F1F5F9]" onClick={closeMobile}>Academic Space</Link>
                <Link to="/study-planner" className="py-2.5 pl-2 text-[#172033] dark:text-[#F1F5F9]" onClick={closeMobile}>Study Planner</Link>
                <Link to="/upload" className="py-2.5 pl-2 text-[#4F46E5] dark:text-[#818CF8] font-medium" onClick={closeMobile}>Upload Notes</Link>
                <Link to="/document-review" className="py-2.5 pl-2 text-[#172033] dark:text-[#F1F5F9]" onClick={closeMobile}>Document Review</Link>
                <Link to="/saved-notes" className="py-2.5 pl-2 text-[#172033] dark:text-[#F1F5F9]" onClick={closeMobile}>Saved Items</Link>
                <Link to="/wishlist" className="py-2.5 pl-2 text-[#172033] dark:text-[#F1F5F9]" onClick={closeMobile}>Wishlist</Link>
              </>
            )}
            <Link to="/premium" className="py-3 mt-2 text-[#172033] dark:text-[#F1F5F9] border-t border-[#E2E8F0] dark:border-[#2A374D]" onClick={closeMobile}>Premium</Link>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
