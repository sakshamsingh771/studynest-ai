export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal/50";
  const variants = {
    // Deliberately a FIXED dark navy (#172033), not the theme-reactive `ink`
    // token — this button pairs with a hardcoded `text-white`, so it must stay
    // dark in both light AND dark mode. `ink` now resolves to a CSS variable
    // that flips to near-white in dark mode (the fix for dark-mode text
    // contrast elsewhere), which would otherwise turn this into white text on
    // a near-white button — invisible. Everywhere else in this file, `text-ink`
    // SHOULD keep flipping with the theme, since those are plain text colors.
    primary: "bg-ink-solid text-white hover:bg-ink-solid/90 shadow-sm hover:shadow-md",
    teal: "bg-teal text-white hover:bg-teal/90 shadow-sm hover:shadow-md",
    gold: "bg-gold text-ink dark:text-zinc-100 hover:brightness-95 shadow-sm hover:shadow-md",
    outline: "border border-ink/20 text-ink dark:text-zinc-100 hover:bg-ink/5",
    ghost: "text-ink dark:text-zinc-100 hover:bg-ink/5",
    danger: "bg-danger text-white hover:bg-danger/90 shadow-sm hover:shadow-md",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
