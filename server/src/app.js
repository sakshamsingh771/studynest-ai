const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const path = require("path");
const env = require("./config/env");
const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const notesRoutes = require("./modules/notes/notes.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const { commentsRouter, commentActionsRouter, ratingRouter, followRouter, reviewsRouter, bookmarkRouter, myBookmarksRouter } = require("./modules/community/community.routes");
const { purchaseRouter, marketplaceRouter } = require("./modules/marketplace/marketplace.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const subscriptionRoutes = require("./modules/subscription/subscription.routes");
const walletRoutes = require("./modules/wallet/wallet.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const gamificationRoutes = require("./modules/gamification/gamification.routes");
const studyPlannerRoutes = require("./modules/studyplanner/studyplanner.routes");
const academicRoutes = require("./modules/academic/academic.routes");
const publicRoutes = require("./modules/public/public.routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // required so the browser sends/receives the httpOnly refresh cookie
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok", env: env.nodeEnv } });
});

// Local file storage is served statically in dev. In the Cloudinary/S3 version
// of storageService, this line simply won't be needed — files load from the CDN URL instead.
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/notes/:noteId/ai", aiRoutes);
app.use("/api/notes/:noteId/comments", commentsRouter);
app.use("/api/notes/:noteId/rating", ratingRouter);
app.use("/api/notes/:noteId/reviews", reviewsRouter);
app.use("/api/notes/:noteId/bookmark", bookmarkRouter);
app.use("/api/bookmarks", myBookmarksRouter);
app.use("/api/comments", commentActionsRouter);
app.use("/api/users/:userId", followRouter);
app.use("/api/notes/:noteId/purchase", purchaseRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/study-planner", studyPlannerRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/public", publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler); // must be registered LAST — Express identifies it as an error handler by its 4 args

module.exports = app;
