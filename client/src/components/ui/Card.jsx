export default function Card({ children, className = "", padded = true, as: As = "div", ...props }) {
  return (
    <As className={`bg-white dark:bg-[#151E30] border border-ink/10 rounded-card shadow-card ${padded ? "p-5" : ""} ${className}`} {...props}>
      {children}
    </As>
  );
}
