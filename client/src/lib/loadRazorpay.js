// Loads the Razorpay Checkout script once, lazily — only when someone actually
// tries to buy a note, not on every page load. Resolves false if it fails
// (e.g. no internet), so callers can show a friendly error instead of a
// silent crash on window.Razorpay being undefined.
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
