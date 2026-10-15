const AppError = require("../../utils/AppError");

// Decides whether a user may run AI on a note. Before this existed, any
// logged-in user could run AI on ANY note id, including paid premium notes
// they had not bought. `hasPurchased` is injected so this stays unit-testable.
async function assertNoteAccess({ note, user, hasPurchased }) {
  if (!note || note.status === "archived") throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");
  const userId = user?._id?.toString();
  const isOwner = userId && note.author?.toString() === userId;
  const isAdmin = user?.role === "admin";
  if (isOwner || isAdmin) return;
  if (note.status !== "published") throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");
  if (note.access?.isPremium && note.access.price > 0) {
    const bought = userId ? await hasPurchased(userId, note._id) : false;
    if (!bought) throw new AppError("Purchase this note to use AI tools on it.", 403, "NOTE_LOCKED");
  }
}

module.exports = { assertNoteAccess };
