const express = require("express");
const controller = require("./community.controller");
const { protect } = require("../../middleware/auth");

// Mounted at /api/notes/:noteId/comments — browsing comments is public,
// posting requires login (matches the homepage spec: browse without an account).
const commentsRouter = express.Router({ mergeParams: true });
commentsRouter.get("/", controller.listComments);
commentsRouter.post("/", protect, controller.addComment);

// Mounted at /api/comments/:commentId — separate top-level path since a
// comment's identity doesn't depend on which note it's under once you have its ID.
const commentActionsRouter = express.Router();
commentActionsRouter.delete("/:commentId", protect, controller.deleteComment);

// Mounted at /api/notes/:noteId/rating
const ratingRouter = express.Router({ mergeParams: true });
ratingRouter.post("/", protect, controller.rateNote);

// Mounted at /api/notes/:noteId/reviews — reads the written portion of ratings
const reviewsRouter = express.Router({ mergeParams: true });
reviewsRouter.get("/", controller.listReviews);

// Mounted at /api/notes/:noteId/bookmark
const bookmarkRouter = express.Router({ mergeParams: true });
bookmarkRouter.post("/", protect, controller.toggleBookmark);

// Mounted at /api/bookmarks — a user's own saved notes, independent of any one note
const myBookmarksRouter = express.Router();
myBookmarksRouter.get("/", protect, controller.listMyBookmarks);

// Mounted at /api/users/:userId
const followRouter = express.Router({ mergeParams: true });
followRouter.post("/follow", protect, controller.followUser);
followRouter.post("/unfollow", protect, controller.unfollowUser);

module.exports = {
  commentsRouter, commentActionsRouter, ratingRouter, followRouter,
  reviewsRouter, bookmarkRouter, myBookmarksRouter,
};
