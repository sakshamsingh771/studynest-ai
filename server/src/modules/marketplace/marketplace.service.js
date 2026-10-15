const Note = require("../notes/note.model");
const Purchase = require("./purchase.model");
const Wallet = require("./wallet.model");
const Transaction = require("./transaction.model");
const Coupon = require("./coupon.model");
const WithdrawalRequest = require("./withdrawalRequest.model");
const paymentProvider = require("./paymentProvider");
const AppError = require("../../utils/AppError");
const { notify } = require("../notifications/notifications.service");

// Platform keeps a cut, seller gets the rest. Kept as a named constant so
// changing the split is a one-line edit, not a hunt through the codebase.
const PLATFORM_FEE_PERCENT = 20;

async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });
  return wallet;
}

async function hasPurchased(userId, noteId) {
  if (!userId) return false;
  const purchase = await Purchase.findOne({ buyer: userId, note: noteId, status: "paid" });
  return !!purchase;
}

async function validateCoupon(code) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new AppError("Invalid or expired coupon.", 400, "INVALID_COUPON");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError("This coupon has expired.", 400, "COUPON_EXPIRED");
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("This coupon has reached its usage limit.", 400, "COUPON_EXHAUSTED");
  }
  return coupon;
}

// Step 1: buyer clicks "Buy" — we create a Razorpay order and a "created"
// Purchase row. Nothing is charged yet; that happens client-side via Razorpay
// Checkout, and we only mark the sale complete after verifying the signature
// in verifyPurchase() below — never trust a client-reported "payment succeeded".
async function initiatePurchase({ userId, noteId, couponCode }) {
  const note = await Note.findById(noteId);
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");
  if (!note.access.isPremium || note.access.price <= 0) {
    throw new AppError("This note is free — no purchase needed.", 400, "NOTE_NOT_PREMIUM");
  }
  if (note.author.toString() === userId.toString()) {
    throw new AppError("You can't purchase your own note.", 400, "CANNOT_BUY_OWN_NOTE");
  }
  if (await hasPurchased(userId, noteId)) {
    throw new AppError("You already own this note.", 409, "ALREADY_PURCHASED");
  }

  const coupon = await validateCoupon(couponCode);
  const discountApplied = coupon ? Math.round(note.access.price * (coupon.discountPercent / 100)) : 0;
  const finalAmount = Math.max(1, note.access.price - discountApplied); // never let a coupon make it free by rounding

  const razorpayOrder = await paymentProvider.createOrder({
    amountInRupees: finalAmount,
    receipt: `note_${noteId}_user_${userId}`,
  });

  const purchase = await Purchase.create({
    buyer: userId,
    seller: note.author,
    note: noteId,
    originalAmount: note.access.price,
    discountApplied,
    amount: finalAmount,
    couponCode: coupon ? coupon.code : null,
    razorpayOrderId: razorpayOrder.id,
    status: "created",
  });

  return {
    purchaseId: purchase._id,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount, // in paise, exactly what Razorpay Checkout expects
    currency: razorpayOrder.currency,
    keyId: paymentProvider.getPublicKeyId(),
    noteTitle: note.title,
  };
}

// Step 2: after Razorpay Checkout completes client-side, the frontend sends us
// back the order/payment/signature triple. We verify it ourselves before
// trusting the payment — this is the step that actually prevents fraud.
async function verifyPurchase({ userId, orderId, paymentId, signature }) {
  const isValid = paymentProvider.verifySignature({ orderId, paymentId, signature });
  if (!isValid) {
    throw new AppError("Payment verification failed.", 400, "SIGNATURE_INVALID");
  }

  // Atomic claim on the status transition — only the call that actually flips
  // "created" -> "paid" goes on to credit the seller. A duplicate/retried verify
  // call with the same valid signature finds no "created" doc to claim and
  // safely falls through to the idempotent "already paid" branch below.
  const purchase = await Purchase.findOneAndUpdate(
    { razorpayOrderId: orderId, buyer: userId, status: "created" },
    { $set: { status: "paid", razorpayPaymentId: paymentId, razorpaySignature: signature } },
    { new: true }
  );

  if (!purchase) {
    const existing = await Purchase.findOne({ razorpayOrderId: orderId, buyer: userId });
    if (!existing) throw new AppError("Purchase record not found.", 404, "PURCHASE_NOT_FOUND");
    return existing; // idempotent — already paid and already credited by the first call
  }

  if (purchase.couponCode) {
    await Coupon.updateOne({ code: purchase.couponCode }, { $inc: { usedCount: 1 } });
  }

  const sellerCut = Math.round(purchase.amount * (1 - PLATFORM_FEE_PERCENT / 100));
  await getOrCreateWallet(purchase.seller);
  await Wallet.findOneAndUpdate({ user: purchase.seller }, { $inc: { balance: sellerCut } }); // atomic — no lost-update race

  await Transaction.create({
    user: purchase.seller,
    type: "credit",
    amount: sellerCut,
    reason: "note_sale",
    relatedNote: purchase.note,
    relatedPurchase: purchase._id,
    description: `Sale of note (after ${PLATFORM_FEE_PERCENT}% platform fee)`,
  });

  const note = await Note.findById(purchase.note).select("title");
  await notify({
    recipient: purchase.seller,
    type: "note_purchased",
    message: `Your note "${note.title}" was purchased for ₹${purchase.amount} (you earned ₹${sellerCut})`,
    payload: { noteId: purchase.note },
  });

  return purchase;
}

// Instant purchase using the buyer's own wallet balance instead of a fresh
// Razorpay checkout — same seller payout math as verifyPurchase() above, but
// no external payment gateway round-trip needed since the money already sits
// in our own ledger. Still fully server-authoritative: balance is read and
// debited here, never trusted from the client.
async function purchaseWithWallet({ userId, noteId, couponCode }) {
  const note = await Note.findById(noteId);
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");
  if (!note.access.isPremium || note.access.price <= 0) {
    throw new AppError("This note is free — no purchase needed.", 400, "NOTE_NOT_PREMIUM");
  }
  if (note.author.toString() === userId.toString()) {
    throw new AppError("You can't purchase your own note.", 400, "CANNOT_BUY_OWN_NOTE");
  }
  if (await hasPurchased(userId, noteId)) {
    throw new AppError("You already own this note.", 409, "ALREADY_PURCHASED");
  }

  const coupon = await validateCoupon(couponCode);
  const discountApplied = coupon ? Math.round(note.access.price * (coupon.discountPercent / 100)) : 0;
  const finalAmount = Math.max(1, note.access.price - discountApplied);

  await getOrCreateWallet(userId);
  // Atomic conditional debit: the balance>=finalAmount check and the decrement
  // happen in one database operation, so two concurrent purchase requests can't
  // both pass a balance check that was only true for one of them (the classic
  // read-then-write race a `if (balance < x) ...; balance -= x; save()` has).
  const buyerWallet = await Wallet.findOneAndUpdate(
    { user: userId, balance: { $gte: finalAmount } },
    { $inc: { balance: -finalAmount } },
    { new: true }
  );
  if (!buyerWallet) {
    throw new AppError("Insufficient wallet balance. Add money to your wallet or pay via Razorpay instead.", 400, "INSUFFICIENT_BALANCE");
  }

  const purchase = await Purchase.create({
    buyer: userId,
    seller: note.author,
    note: noteId,
    originalAmount: note.access.price,
    discountApplied,
    amount: finalAmount,
    couponCode: coupon ? coupon.code : null,
    paymentMethod: "wallet",
    status: "paid", // no external gateway step to wait for — payment is instant and already verified (it's our own ledger)
  });

  if (coupon) await Coupon.updateOne({ code: coupon.code }, { $inc: { usedCount: 1 } });

  await Transaction.create({
    user: userId,
    type: "debit",
    amount: finalAmount,
    reason: "note_purchase_wallet",
    relatedNote: noteId,
    relatedPurchase: purchase._id,
    description: `Purchased "${note.title}"`,
  });

  const sellerCut = Math.round(finalAmount * (1 - PLATFORM_FEE_PERCENT / 100));
  await getOrCreateWallet(note.author);
  await Wallet.findOneAndUpdate({ user: note.author }, { $inc: { balance: sellerCut } }); // atomic

  await Transaction.create({
    user: note.author,
    type: "credit",
    amount: sellerCut,
    reason: "note_sale",
    relatedNote: noteId,
    relatedPurchase: purchase._id,
    description: `Sale of note (after ${PLATFORM_FEE_PERCENT}% platform fee)`,
  });

  await notify({
    recipient: note.author,
    type: "note_purchased",
    message: `Your note "${note.title}" was purchased for ₹${finalAmount} (you earned ₹${sellerCut})`,
    payload: { noteId },
  });

  return purchase;
}

async function getWallet(userId) {
  const wallet = await getOrCreateWallet(userId);
  const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
  return { balance: wallet.balance, transactions };
}

async function requestWithdrawal({ userId, amount }) {
  await getOrCreateWallet(userId);
  // Atomic conditional debit — see purchaseWithWallet above for why this can't
  // be a read-then-write; reserved immediately so it can't be double-withdrawn
  // by two concurrent requests while the first is still pending admin approval.
  const wallet = await Wallet.findOneAndUpdate(
    { user: userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!wallet) {
    throw new AppError("Withdrawal amount exceeds your wallet balance.", 400, "INSUFFICIENT_BALANCE");
  }

  const request = await WithdrawalRequest.create({ user: userId, amount });
  await Transaction.create({ user: userId, type: "debit", amount, reason: "withdrawal", description: "Withdrawal requested" });

  return request;
}

async function listMyPurchases(userId) {
  return Purchase.find({ buyer: userId, status: "paid" })
    .sort({ createdAt: -1 })
    .populate("note", "title thumbnailUrl file.type");
}

async function listMySales(userId) {
  return Purchase.find({ seller: userId, status: "paid" })
    .sort({ createdAt: -1 })
    .populate("note", "title")
    .populate("buyer", "name");
}

module.exports = {
  hasPurchased,
  initiatePurchase,
  verifyPurchase,
  purchaseWithWallet,
  getWallet,
  requestWithdrawal,
  listMyPurchases,
  listMySales,
};
