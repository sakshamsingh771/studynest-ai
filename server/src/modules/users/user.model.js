const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email"],
    },
    // select: false -> never comes back on a normal .find()/.findById();
    // must explicitly .select("+passwordHash") when we need to compare it.
    passwordHash: { type: String, select: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },

    profile: {
      avatarUrl: { type: String, default: "" },
      bio: { type: String, default: "", maxlength: 300 },
      college: { type: String, default: "" },
      university: { type: String, default: "" },
      course: { type: String, default: "" },
      branch: { type: String, default: "" },
      semester: { type: Number, min: 1, max: 12 },
      skills: [{ type: String, trim: true }],
    },

    // Structured academic identity — distinct from the free-text `profile.*` fields
    // above (which stay for backward compatibility / display). These are real
    // references into the syllabus hierarchy (see modules/academic) and are what
    // every Academic-OS feature (My Academic Space, mastery, recommendations,
    // PYQ intelligence) actually keys off. All optional: a user with none of this
    // set simply doesn't see academic features yet — nothing else breaks.
    academic: {
      university: { type: Schema.Types.ObjectId, ref: "University", default: null },
      program: { type: Schema.Types.ObjectId, ref: "Program", default: null },
      branch: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
      semester: { type: Number, min: 1, max: 12, default: null },
      academicYear: { type: String, trim: true, default: "" }, // e.g. "2025-26"
    },

    stats: {
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      uploadsCount: { type: Number, default: 0 },
    },

    // Daily activity streak — bumped by login, quiz completion, and note
    // views (see gamification.service.recordActivity, the single place this
    // is ever mutated).
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },

    isEmailVerified: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },

    // Denormalized snapshot for fast reads (frontend badges, AI limit checks)
    // without joining to SubscriptionOrder on every request. SubscriptionOrder
    // is the source of truth for the payment history; this is just "what's
    // currently active", recomputed whenever a payment is verified.
    subscription: {
      plan: { type: String, enum: ["free", "premium", "creator"], default: "free" },
      expiresAt: { type: Date, default: null },
    },

    // Set only during an active "forgot password" flow. Hashed the same way as
    // refreshTokenHash — even a DB leak can't be used to reset someone's password.
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // Email verification — same hashed-token pattern as password reset.
    // isEmailVerified starts false for every new account; nothing in the UI
    // claims an account is verified until this flow actually completes.
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    // Hash of the CURRENT valid refresh token. Rotated on every refresh + login.
    // Lets us invalidate a stolen refresh token by simply overwriting this on logout.
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.index({ "profile.college": 1, "profile.branch": 1 });

// Never leak sensitive fields even if a raw user doc accidentally gets serialized.
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
