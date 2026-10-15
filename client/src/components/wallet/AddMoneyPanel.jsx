import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { walletApi } from "../../api/walletApi.js";
import { loadRazorpayScript } from "../../lib/loadRazorpay.js";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";

export default function AddMoneyPanel() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const queryClient = useQueryClient();

  const { data: presets = [100, 250, 500, 1000, 2000] } = useQuery({ queryKey: ["topup-presets"], queryFn: walletApi.presets });

  const amount = selected === "custom" ? Number(customAmount) : selected;

  const topupMutation = useMutation({
    mutationFn: async () => {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Couldn't load the payment gateway. Check your connection.");

      const order = await walletApi.initiateTopup(amount);

      return new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "StudyNest AI",
          description: `Wallet top-up — ₹${amount}`,
          order_id: order.orderId,
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#0f6b6b" },
          handler: async (response) => {
            try {
              await walletApi.verifyTopup({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
        });
        razorpay.open();
      });
    },
    onSuccess: () => {
      toast.success(`₹${amount} added to your wallet!`);
      setSelected(null);
      setCustomAmount("");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || err.message || "Top-up failed"),
  });

  const handleAddMoney = () => {
    if (!amount || amount < 10) return toast.error("Enter a valid amount (minimum ₹10).");
    topupMutation.mutate();
  };

  return (
    <div className="border border-ink/10 rounded-xl p-4 mt-4">
      <p className="text-sm font-medium text-ink mb-3">Add Money</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => { setSelected(p); setCustomAmount(""); }}
            className={`text-sm px-3.5 py-1.5 rounded-lg border transition-colors ${
              selected === p ? "bg-ink-solid text-white border-ink-solid" : "border-ink/15 text-ink/70 hover:border-ink/30"
            }`}
          >
            ₹{p}
          </button>
        ))}
        <button
          onClick={() => setSelected("custom")}
          className={`text-sm px-3.5 py-1.5 rounded-lg border transition-colors ${
            selected === "custom" ? "bg-ink-solid text-white border-ink-solid" : "border-ink/15 text-ink/70 hover:border-ink/30"
          }`}
        >
          Custom
        </button>
      </div>

      {selected === "custom" && (
        <input
          type="number" min={10} value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Enter amount"
          className="mt-3 w-full sm:w-48 rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
        />
      )}

      <Button
        variant="gold" className="mt-4"
        disabled={!amount || topupMutation.isPending}
        onClick={handleAddMoney}
      >
        {topupMutation.isPending ? "Processing..." : amount ? `Add Money — ₹${amount}` : "Add Money"}
      </Button>
    </div>
  );
}
