// Demo seed for StudyNest AI — creates realistic users and notes for demonstration.
// Idempotent: safe to run multiple times (skips existing records by email/title).
// Run with: node src/seed/demoSeed.js
//
// Demo credentials (development only):
// Student: demo.student@studynest.demo / Demo@123
// Student 2: demo.student2@studynest.demo / Demo@123
// Admin: demo.admin@studynest.demo / Demo@123

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

const User = require("../modules/users/user.model");
const Note = require("../modules/notes/note.model");

async function upsertUser(email, data) {
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    user = await User.create({
      name: data.name,
      email,
      passwordHash,
      role: data.role || "student",
      isEmailVerified: true,
      profile: data.profile || {},
      stats: data.stats || { xp: 120, level: 2, uploadsCount: 3 },
    });
    console.log(`[demo] Created user: ${email}`);
  } else {
    console.log(`[demo] User already exists: ${email}`);
  }
  return user;
}

async function upsertNote(title, authorId, data) {
  let note = await Note.findOne({ title, author: authorId });
  if (!note) {
    note = await Note.create({
      title,
      description: data.description,
      author: authorId,
      file: {
        url: data.fileUrl || "/uploads/demo-placeholder.pdf",
        storageKey: data.storageKey || `demo/${Date.now()}-${title.slice(0,20)}.pdf`,
        type: data.type || "pdf",
        originalName: data.originalName || `${title}.pdf`,
        sizeBytes: data.sizeBytes || 245760,
      },
      meta: {
        subject: data.subject,
        semester: data.semester || 3,
        branch: data.branch || "CSE",
        tags: data.tags || [],
      },
      access: { isPremium: false, price: 0 },
    });
    console.log(`[demo] Created note: ${title}`);
  }
  return note;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log("[demo] Connected to database");

  const student = await upsertUser("demo.student@studynest.demo", {
    name: "Aarav Sharma",
    password: "Demo@123",
    role: "student",
    profile: { college: "Sample State University", course: "B.Tech", branch: "CSE", semester: 3, bio: "CSE student focusing on DSA and OS." },
  });

  const student2 = await upsertUser("demo.student2@studynest.demo", {
    name: "Priya Patel",
    password: "Demo@123",
    role: "student",
    profile: { college: "Sample State University", course: "B.Tech", branch: "CSE", semester: 4, bio: "Interested in AI and Web Development." },
  });

  const admin = await upsertUser("demo.admin@studynest.demo", {
    name: "Demo Admin",
    password: "Demo@123",
    role: "admin",
    profile: { bio: "Demo administrator account." },
  });

  const notes = [
    { title: "Binary Trees & Traversals", subject: "Data Structures", tags: ["trees", "dsa", "traversal"], description: "Complete notes on binary tree representations, inorder/preorder/postorder, and common problems." },
    { title: "Linked Lists - Singly & Doubly", subject: "Data Structures", tags: ["linked-list", "dsa"], description: "Detailed explanation of linked list operations, insertion, deletion, and reversal techniques." },
    { title: "SQL Joins and Normalization", subject: "DBMS", tags: ["sql", "joins", "normalization"], description: "Covers INNER, LEFT, RIGHT joins with examples and 1NF to 3NF normalization rules." },
    { title: "Process Scheduling Algorithms", subject: "Operating Systems", tags: ["os", "scheduling"], description: "FCFS, SJF, Round Robin, and Priority scheduling with numerical examples." },
    { title: "TCP/IP and OSI Model", subject: "Computer Networks", tags: ["networking", "tcp", "osi"], description: "Layer-wise explanation of OSI and TCP/IP models with protocol examples." },
    { title: "Introduction to Machine Learning", subject: "AI & ML", tags: ["ml", "supervised"], description: "Supervised vs unsupervised learning, linear regression, and classification basics." },
    { title: "Discrete Mathematics - Graph Theory", subject: "Mathematics", tags: ["graphs", "discrete-math"], description: "Graph representations, BFS, DFS, shortest path, and spanning trees." },
    { title: "React Hooks and State Management", subject: "Web Development", tags: ["react", "hooks"], description: "useState, useEffect, custom hooks, and practical examples." },
    { title: "Software Development Life Cycle", subject: "Software Engineering", tags: ["sdlc", "agile"], description: "Waterfall, Agile, Scrum roles, and sprint planning overview." },
    { title: "Cache Memory and Mapping", subject: "Computer Organization", tags: ["coa", "cache"], description: "Direct, associative, and set-associative cache mapping techniques." },
    { title: "Sorting Algorithms Comparison", subject: "Data Structures", tags: ["sorting", "complexity"], description: "Bubble, selection, insertion, merge, and quick sort with time/space analysis." },
    { title: "Deadlocks and Prevention", subject: "Operating Systems", tags: ["deadlock", "os"], description: "Conditions for deadlock, banker's algorithm, and prevention strategies." },
    { title: "REST API Design Principles", subject: "Web Development", tags: ["api", "rest"], description: "HTTP methods, status codes, versioning, and best practices for REST APIs." },
    { title: "Probability for Machine Learning", subject: "Mathematics", tags: ["probability", "ml"], description: "Bayes theorem, distributions, and their use in ML models." },
    { title: "Git and Version Control Basics", subject: "Software Engineering", tags: ["git", "version-control"], description: "Commit, branch, merge, pull request workflow explained simply." },
  ];

  for (const n of notes) {
    await upsertNote(n.title, student._id, n);
  }

  // A few notes by second student
  await upsertNote("Quick Sort Implementation Notes", student2._id, {
    subject: "Data Structures", tags: ["sorting", "quicksort"], description: "Step-by-step quick sort with partition logic and examples.",
  });
  await upsertNote("ER Diagrams and Relational Model", student2._id, {
    subject: "DBMS", tags: ["er-diagram", "dbms"], description: "Entity-relationship modeling and conversion to tables.",
  });

  console.log("\n[demo] Seed complete.");
  console.log("[demo] Login credentials (development only):");
  console.log("  Student : demo.student@studynest.demo / Demo@123");
  console.log("  Student2: demo.student2@studynest.demo / Demo@123");
  console.log("  Admin   : demo.admin@studynest.demo / Demo@123");
  console.log("[demo] Notes created under demo student account.");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[demo] Failed:", err.message);
  process.exit(1);
});
