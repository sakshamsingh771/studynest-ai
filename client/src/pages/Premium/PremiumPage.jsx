import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HiCheck } from "react-icons/hi";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Button from "../../components/ui/Button.jsx";
import { subscriptionApi } from "../../api/subscriptionApi.js";
import { loadRazorpayScript } from "../../lib/loadRazorpay.js";
import { useAuth } from "../../hooks/useAuth.js";

const PLAN_ORDER = ["free", "premium", "creator"];

export default function PremiumPage() {
  const { user, isAuthenticated } = useAuth();
  const [processingPlan, setProcessingPlan] = useState(null);
  const queryClient = useQueryClient();

  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: subscriptionApi.listPlans });
  const { data: status } = useQuery({
    queryKey: ["subscription-status"], queryFn: subscriptionApi.myStatus, enabled: isAuthenticated,
  });
  const { data: history = [] } = useQuery({
    queryKey: ["billing-history"], queryFn: subscriptionApi.billingHistory, enabled: isAuthenticated,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan) => {
      setProcessingPlan(plan);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Couldn't load the payment gateway. Check your connection.");

      const order = await subscriptionApi.initiate(plan);

      return new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "StudyNest AI",
          description: `${order.planLabel} plan — 30 days`,
          order_id: order.orderId,
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#0f6b6b" },
          handler: async (response) => {
            try {
              await subscriptionApi.verify({
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
      toast.success("You're upgraded! Enjoy unlimited AI features.");
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      queryClient.invalidateQueries({ queryKey: ["billing-history"] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || err.message || "Payment failed"),
    onSettled: () => setProcessingPlan(null),
  });

  const handleSelect = (plan) => {
    if (plan === "free") return;
    if (!isAuthenticated) return toast.error("Log in to subscribe.");
    subscribeMutation.mutate(plan);
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-ink">Simple, honest pricing</h1>
          <p className="text-ink/50 mt-2">Upgrade any time. Cancel any time — no auto-renewal traps.</p>
        </div>

        {status?.plan && status.plan !== "free" && (
          <div className="max-w-md mx-auto mt-6 bg-teal/5 border border-teal/20 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-ink/70">
              You're on <span className="font-semibold text-teal capitalize">{status.plan}</span>
              {status.expiresAt && <> · renews/expires {new Date(status.expiresAt).toLocaleDateString()}</>}
            </p>
          </div>
        )}
        {status?.isExpired && (
          <div className="max-w-md mx-auto mt-6 bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-ink/70">Your {status.rawPlan} plan expired. Renew below to restore unlimited access.</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {plans && PLAN_ORDER.map((key) => {
            const plan = plans[key];
            const isCurrent = status?.plan === key;
            const isFeatured = key === "premium";
            return (
              <div
                key={key}
                className={`rounded-2xl border p-6 flex flex-col ${
                  isFeatured ? "border-teal shadow-lg relative" : "border-ink/10"
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-semibold text-ink text-lg">{plan.label}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-ink">₹{plan.priceMonthly}</span>
                  {plan.priceMonthly > 0 && <span className="text-sm text-ink/40">/month</span>}
                </p>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink/70">
                      <HiCheck className="text-teal shrink-0 mt-0.5" size={16} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isFeatured ? "primary" : "outline"}
                  className="w-full mt-6"
                  disabled={isCurrent || processingPlan === key || key === "free"}
                  onClick={() => handleSelect(key)}
                >
                  {key === "free" ? "Free forever" : isCurrent ? "Current plan" : processingPlan === key ? "Processing..." : `Get ${plan.label}`}
                </Button>
              </div>
            );
          })}
        </div>

        {isAuthenticated && (
          <div className="mt-14 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-ink mb-4">Billing history</h2>
            {history.length === 0 && <p className="text-sm text-ink/40">No payments yet.</p>}
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h._id} className="flex items-center justify-between border border-ink/10 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm text-ink capitalize">{h.plan} plan</p>
                    <p className="text-xs text-ink/40">{new Date(h.createdAt).toLocaleDateString()} · {h.razorpayPaymentId}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">₹{h.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
