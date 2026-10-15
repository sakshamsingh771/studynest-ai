import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiOutlineCash, HiOutlineArrowDown, HiOutlineArrowUp } from "react-icons/hi";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/ui/Button.jsx";
import { marketplaceApi } from "../../api/marketplaceApi.js";
import AddMoneyPanel from "../../components/wallet/AddMoneyPanel.jsx";

const TABS = ["Wallet", "My Purchases", "My Sales"];

export default function WalletPage() {
  const [tab, setTab] = useState("Wallet");
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();

  const { data: wallet } = useQuery({ queryKey: ["wallet"], queryFn: marketplaceApi.getWallet });
  const { data: purchases = [] } = useQuery({ queryKey: ["my-purchases"], queryFn: marketplaceApi.myPurchases, enabled: tab === "My Purchases" });
  const { data: sales = [] } = useQuery({ queryKey: ["my-sales"], queryFn: marketplaceApi.mySales, enabled: tab === "My Sales" });

  const withdrawMutation = useMutation({
    mutationFn: () => marketplaceApi.requestWithdrawal(Number(amount)),
    onSuccess: () => {
      toast.success("Withdrawal requested — an admin will process it shortly.");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Withdrawal failed"),
  });

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-2xl font-bold text-ink">Wallet &amp; Earnings</h1>

        <div className="flex gap-1 border-b border-ink/10 mt-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Wallet" && (
          <div className="mt-6">
            <div className="bg-ink-solid text-white rounded-xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide">Available balance</p>
                <p className="text-3xl font-bold text-gold mt-1">₹{wallet?.balance ?? 0}</p>
              </div>
              <HiOutlineCash size={40} className="text-white/20" />
            </div>

            <AddMoneyPanel />

            <p className="text-sm font-medium text-ink mt-6 mb-2">Withdraw Funds</p>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount to withdraw"
                className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
              />
              <Button
                variant="primary"
                disabled={!amount || withdrawMutation.isPending}
                onClick={() => withdrawMutation.mutate()}
              >
                Request Withdrawal
              </Button>
            </div>

            <h2 className="text-sm font-semibold text-ink mt-8 mb-3">Recent Transactions</h2>
            <div className="space-y-2">
              {(wallet?.transactions || []).length === 0 && (
                <p className="text-sm text-ink/40">No transactions yet.</p>
              )}
              {(wallet?.transactions || []).map((t) => (
                <div key={t._id} className="flex items-center justify-between border border-ink/10 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    {t.type === "credit" ? (
                      <HiOutlineArrowDown className="text-green-500" size={18} />
                    ) : (
                      <HiOutlineArrowUp className="text-red-400" size={18} />
                    )}
                    <div>
                      <p className="text-sm text-ink">{t.description || t.reason}</p>
                      <p className="text-xs text-ink/40">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "credit" ? "+" : "-"}₹{t.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "My Purchases" && (
          <div className="mt-6 space-y-2">
            {purchases.length === 0 && <p className="text-sm text-ink/40">You haven't purchased any notes yet.</p>}
            {purchases.map((p) => (
              <div key={p._id} className="flex items-center justify-between border border-ink/10 rounded-lg px-4 py-3">
                <p className="text-sm text-ink">{p.note?.title}</p>
                <p className="text-sm text-ink/50">₹{p.amount}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "My Sales" && (
          <div className="mt-6 space-y-2">
            {sales.length === 0 && <p className="text-sm text-ink/40">No sales yet.</p>}
            {sales.map((s) => (
              <div key={s._id} className="flex items-center justify-between border border-ink/10 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{s.note?.title}</p>
                  <p className="text-xs text-ink/40">bought by {s.buyer?.name}</p>
                </div>
                <p className="text-sm text-ink/50">₹{s.amount}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
