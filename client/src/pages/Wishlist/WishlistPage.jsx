import { useState } from "react";
import Navbar from "../../components/layout/Navbar.jsx";
import { useAuth } from "../../hooks/useAuth.js";

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wishlist") || "[]"); } catch { return []; }
  });

  const remove = (id) => {
    const next = items.filter(i => i.id !== id);
    setItems(next);
    localStorage.setItem("wishlist", JSON.stringify(next));
  };

  if (!isAuthenticated) return <div><Navbar /><p className="p-10 text-center">Please log in to view your wishlist.</p></div>;

  return (
    <div className="dark:bg-zinc-950 min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold text-ink dark:text-zinc-100">Wishlist</h1>
        <p className="text-ink/50 dark:text-zinc-400 mt-1">Learning goals and resources you plan to explore. (Currently stored locally; can be extended to server.)</p>

        {items.length === 0 ? (
          <div className="mt-12 text-center text-ink/40 dark:text-zinc-500">
            <p>Your wishlist is empty.</p>
            <p className="text-sm mt-2">Add topics or notes from Explore or Academic Space.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900 border border-ink/10 dark:border-zinc-800 rounded-xl">
                <div>
                  <p className="font-medium text-ink dark:text-zinc-100">{item.title}</p>
                  <p className="text-xs text-ink/50 dark:text-zinc-400">{item.type || "Resource"}</p>
                </div>
                <button onClick={() => remove(item.id)} className="text-sm text-danger hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
