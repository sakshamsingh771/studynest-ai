// One-time seed for the academic syllabus hierarchy, so "My Academic Space",
// PYQ Intelligence, and Ask My Course have real data to work with instead of
// being an empty shell on a fresh install. Safe to re-run — it skips anything
// that already exists (matched by name) instead of creating duplicates.
//
// Run with:  node src/seed/academicSeed.js
require("dotenv").config();
const mongoose = require("mongoose");
const env = require("../config/env");

const University = require("../modules/academic/university.model");
const Program = require("../modules/academic/program.model");
const Branch = require("../modules/academic/branch.model");
const Subject = require("../modules/academic/subject.model");
const Unit = require("../modules/academic/unit.model");
const Topic = require("../modules/academic/topic.model");
const PYQ = require("../modules/academic/pyq.model");

async function upsert(Model, filter, data) {
  let doc = await Model.findOne(filter);
  if (!doc) doc = await Model.create({ ...filter, ...data });
  return doc;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log("[seed] connected");

  const university = await upsert(University, { name: "Sample State University" }, { code: "SSU", city: "Pune" });
  const program = await upsert(Program, { university: university._id, name: "B.Tech" }, { durationYears: 4, totalSemesters: 8 });
  const branch = await upsert(Branch, { program: program._id, name: "Computer Science" }, { code: "CSE" });
  const subject = await upsert(Subject, { branch: branch._id, semester: 3, name: "Data Structures" }, { code: "CS301", credits: 4 });

  const unit1 = await upsert(Unit, { subject: subject._id, name: "Arrays & Linked Lists" }, { order: 1 });
  const unit2 = await upsert(Unit, { subject: subject._id, name: "Trees & Graphs" }, { order: 2 });
  const unit3 = await upsert(Unit, { subject: subject._id, name: "Sorting & Searching" }, { order: 3 });

  const topicDefs = [
    { unit: unit1, name: "Array Operations & Complexity", order: 1, weight: 3 },
    { unit: unit1, name: "Singly & Doubly Linked Lists", order: 2, weight: 4 },
    { unit: unit2, name: "Binary Trees & Traversals", order: 1, weight: 5 },
    { unit: unit2, name: "Graph Representations (BFS/DFS)", order: 2, weight: 4 },
    { unit: unit3, name: "Merge Sort & Quick Sort", order: 1, weight: 4 },
    { unit: unit3, name: "Binary Search & Variants", order: 2, weight: 3 },
  ];

  const topics = {};
  for (const t of topicDefs) {
    const doc = await upsert(
      Topic,
      { subject: subject._id, unit: t.unit._id, name: t.name },
      {
        order: t.order,
        weight: t.weight,
        learningObjectives: [
          { text: `Explain the core idea behind ${t.name.toLowerCase()}.` },
          { text: `Analyze time/space complexity for ${t.name.toLowerCase()}.` },
        ],
      }
    );
    topics[t.name] = doc;
  }

  const pyqDefs = [
    { topic: "Binary Trees & Traversals", year: 2023, examName: "End Semester", marks: 10, type: "long", questionText: "Explain in-order, pre-order and post-order traversal with an example." },
    { topic: "Binary Trees & Traversals", year: 2022, examName: "End Semester", marks: 10, type: "long", questionText: "Write an algorithm for level-order traversal of a binary tree." },
    { topic: "Binary Trees & Traversals", year: 2021, examName: "End Semester", marks: 5, type: "short", questionText: "Differentiate between a binary tree and a binary search tree." },
    { topic: "Singly & Doubly Linked Lists", year: 2023, examName: "Mid Sem 1", marks: 5, type: "short", questionText: "Write a function to reverse a singly linked list." },
    { topic: "Singly & Doubly Linked Lists", year: 2022, examName: "Mid Sem 1", marks: 5, type: "short", questionText: "Compare singly and doubly linked lists with their trade-offs." },
    { topic: "Merge Sort & Quick Sort", year: 2023, examName: "End Semester", marks: 10, type: "long", questionText: "Derive the time complexity of merge sort and illustrate with an example array." },
    { topic: "Graph Representations (BFS/DFS)", year: 2022, examName: "End Semester", marks: 10, type: "long", questionText: "Explain BFS and DFS with adjacency list representation." },
  ];

  for (const p of pyqDefs) {
    const topicDoc = topics[p.topic];
    const exists = await PYQ.findOne({ subject: subject._id, year: p.year, questionText: p.questionText });
    if (!exists) {
      await PYQ.create({
        university: university._id, subject: subject._id, unit: topicDoc.unit, topic: topicDoc._id,
        year: p.year, examName: p.examName, marks: p.marks, type: p.type, questionText: p.questionText,
      });
    }
  }

  console.log("[seed] done.");
  console.log(`[seed] University: ${university.name} (${university._id})`);
  console.log(`[seed] Program: ${program.name} (${program._id})`);
  console.log(`[seed] Branch: ${branch.name} (${branch._id})`);
  console.log(`[seed] Subject: ${subject.name} (${subject._id}) — Semester ${subject.semester}`);
  console.log("[seed] To try it as a student: set your academic profile to this university/program/branch, semester 3.");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
