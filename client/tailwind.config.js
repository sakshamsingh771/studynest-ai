/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // `ink` and `cream` are the two color tokens used almost everywhere in the
        // app (text-ink, border-ink/*, bg-ink, bg-cream). They used to be fixed
        // hex values, so anything using them stayed dark-navy-on-white even after
        // the page switched to dark mode — this was the root cause of the
        // sitewide "text overlaps / blends into background" dark-mode bug
        // (confirmed on the Footer, which uses text-ink/40–60 with no dark:
        // variant at all and was nearly unreadable on the dark background).
        //
        // Pointing them at the CSS custom properties defined in index.css (which
        // already flip correctly between :root and .dark) makes every existing
        // `text-ink`, `border-ink/10`, `bg-cream`, etc. across the whole app
        // automatically theme-correct with no per-component edits — a single
        // centralized fix rather than hand-patching each of the ~50 files that
        // use these tokens. Tailwind 3.4's color-mix()-based alpha support means
        // opacity modifiers (`text-ink/50`) keep working against the CSS var.
        ink: "var(--text)",
        cream: "var(--bg)",
        // Fixed (non-theme-reactive) dark navy — for "selected pill" / "solid dark
        // card" / brand-panel backgrounds that are always paired with hardcoded
        // white text (bg-ink-solid text-white). These must NOT flip to a light
        // color in dark mode the way `ink` now correctly does for plain text,
        // or the white text pairs would become invisible (white-on-near-white).
        "ink-solid": "#172033",
        gold: "#FBBF24",
        teal: "#0f6b6b",
        success: "#34D399",
        danger: "#FB7185",
        warn: "#FBBF24",
        // Premium dark surfaces
        surface: {
          DEFAULT: "var(--surface)",
          dark: "#151E30",
        },
        bg: {
          light: "#F7F8FC",
          dark: "#0B1020",
        },
        accent: {
          light: "#4F46E5",
          dark: "#818CF8",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,32,51,0.04), 0 1px 1px rgba(23,32,51,0.03)",
        "card-hover": "0 8px 24px -8px rgba(23,32,51,0.12)",
        popover: "0 12px 32px -8px rgba(23,32,51,0.18)",
      },
    },
  },
  plugins: [],
};
