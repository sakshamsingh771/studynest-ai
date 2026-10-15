import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiOutlineLockClosed, HiOutlineCash } from "react-icons/hi";
import { marketplaceApi } from "../../api/marketplaceApi.js";
import { loadRazorpayScript } from "../../lib/loadRazorpay.js";
import { useAuth } from "../../hooks/useAuth.js";
import Button from "../ui/Button.jsx";

export default function BuyButton({ noteId, price }) {
  const { user, isAuthenticated } = useAuth();
  const [coupon, setCoupon] = useState("");
  const queryClient = useQueryClient();

  // Only fetched when logged in — used purely to decide whether "Pay with
  // Wallet" is even worth showing as an option next to the Razorpay button.
  const { data: wallet } = useQuery({
    queryKey: ["wallet"], queryFn: marketplaceApi.getWallet, enabled: isAuthenticated,
  });
  const hasEnoughBalance = (wallet?.balance ?? 0) >= price;

  const razorpayMutation = useMutation({
    mutationFn: async () => {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Couldn't load the payment gateway. Check your connection.");

      const order = await marketplaceApi.initiatePurchase(noteId, coupon || undefined);

      return new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "StudyNest AI",
          description: order.noteTitle,
          order_id: order.orderId,
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#0f6b6b" },
          handler: async (response) => {
            try {
              await marketplaceApi.verifyPurchase({
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
      toast.success("Purchase successful! Note unlocked.");
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || err.message || "Purchase failed"),
  });

  const walletMutation = useMutation({
    mutationFn: () => marketplaceApi.purchaseWithWallet(noteId, coupon || undefined),
    onSuccess: () => {
      toast.success("Purchased with wallet! Note unlocked.");
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || "Purchase failed"),
  });

  const handleBuy = (method) => {
    if (!isAuthenticated) return toast.error("Log in to purchase this note.");
    if (method === "wallet") walletMutation.mutate();
    else razorpayMutation.mutate();
  };

  const isProcessing = razorpayMutation.isPending || walletMutation.isPending;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <input
          value={coupon} onChange={(e) => setCoupon(e.target.value)}
          placeholder="Coupon (optional)"
          className="w-32 rounded-lg border border-ink/15 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal/40"
        />
        <Button variant="gold" onClick={() => handleBuy("razorpay")} disabled={isProcessing}>
          <span className="flex items-center gap-2">
            <HiOutlineLockClosed size={16} />
            {razorpayMutation.isPending ? "Processing..." : `Buy for ₹${price}`}
          </span>
        </Button>
      </div>

      {isAuthenticated && hasEnoughBalance && (
        <button
          onClick={() => handleBuy("wallet")}
          disabled={isProcessing}
          className="text-xs text-teal flex items-center gap-1 hover:underline disabled:opacity-50"
        >
          <HiOutlineCash size={13} />
          {walletMutation.isPending ? "Processing..." : `Or pay with wallet (₹${wallet.balance} available)`}
        </button>
      )}
    </div>
  );
}
