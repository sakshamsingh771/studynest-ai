const test = require("node:test");
const assert = require("node:assert/strict");
const { assertNoteAccess } = require("../src/modules/ai/aiAccess");

const id = (s) => ({ toString: () => s });
const free = { _id: id("u-free"), role: "student" };
const premiumNote = { _id: id("n1"), author: id("u-author"), status: "published", access: { isPremium: true, price: 99 } };
const freeNote = { ...premiumNote, access: { isPremium: false, price: 0 } };
const never = async () => false;
const always = async () => true;

test("anyone logged in may use AI on a free published note", async () => {
  await assertNoteAccess({ note: freeNote, user: free, hasPurchased: never });
});

test("premium note is blocked for non-buyers (403 NOTE_LOCKED)", async () => {
  await assert.rejects(() => assertNoteAccess({ note: premiumNote, user: free, hasPurchased: never }), (e) => e.code === "NOTE_LOCKED" && e.statusCode === 403);
});

test("premium note is allowed for buyer, author and admin", async () => {
  await assertNoteAccess({ note: premiumNote, user: free, hasPurchased: always });
  await assertNoteAccess({ note: premiumNote, user: { _id: id("u-author"), role: "student" }, hasPurchased: never });
  await assertNoteAccess({ note: premiumNote, user: { _id: id("admin"), role: "admin" }, hasPurchased: never });
});

test("archived/flagged notes look like 404 to other users but remain visible to the author", async () => {
  await assert.rejects(() => assertNoteAccess({ note: { ...freeNote, status: "flagged" }, user: free, hasPurchased: never }), (e) => e.code === "NOTE_NOT_FOUND");
  await assert.rejects(() => assertNoteAccess({ note: null, user: free, hasPurchased: never }), (e) => e.code === "NOTE_NOT_FOUND");
  await assertNoteAccess({ note: { ...freeNote, status: "flagged" }, user: { _id: id("u-author"), role: "student" }, hasPurchased: never });
});
