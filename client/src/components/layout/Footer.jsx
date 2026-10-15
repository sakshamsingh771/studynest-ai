export default function Footer() {
  return (
    <footer className="border-t border-ink/5 mt-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display font-bold text-ink">StudyNest <span className="text-gold">AI</span></p>
          <p className="text-sm text-ink/50 mt-2">Notes, reimagined with AI.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Product</p>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><a href="/explore">Explore Notes</a></li>
            <li><a href="/#ai-features">AI Features</a></li>
            <li><a href="/#premium">Premium</a></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Company</p>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><a href="/#about">About</a></li>
            <li><a href="/#contact">Contact</a></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Legal</p>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/terms">Terms</a></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-ink/40 pb-8">© {new Date().getFullYear()} StudyNest AI. All rights reserved.</p>
    </footer>
  );
}
