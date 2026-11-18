/**
 * Phase 5 Integration Verification Script
 * 
 * Verifies:
 * 1. Document summary generation and MongoDB caching.
 * 2. Active-recall flashcard generation, strict JSON validation, and DB persistence.
 * 3. 4-Option MCQ Quiz generation, option validation, and DB persistence.
 * 4. JSON parser resilience with markdown fences and prose wrappers.
 * 5. Clean teardown and cascade cleanup.
 */

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import config from '../config/env.js';
import User from '../models/User.js';
import Notebook from '../models/Notebook.js';
import Document from '../models/Document.js';
import Summary from '../models/Summary.js';
import FlashcardSet from '../models/FlashcardSet.js';
import Quiz from '../models/Quiz.js';
import { extractJSONFromLLMResponse } from '../utils/jsonParser.js';
import { getOrGenerateSummary } from '../services/study-tools/summary.service.js';
import { generateFlashcardSet } from '../services/study-tools/flashcard.service.js';
import { generateQuiz } from '../services/study-tools/quiz.service.js';

async function verifyPhase5() {
  console.log('='.repeat(60));
  console.log('  StudyNest: Phase 5 Verification (AI Study Tools)');
  console.log('='.repeat(60));

  console.log('\n[1/6] Connecting to MongoDB & Setting Up Test Fixture...');
  await mongoose.connect(config.mongoUri);
  console.log('  ✓ Connected to MongoDB:', mongoose.connection.host);

  const testDir = path.resolve('uploads/test-temp-phase5');
  await fs.mkdir(testDir, { recursive: true });
  const sampleFilePath = path.join(testDir, 'concurrency-notes.txt');

  const sampleContent = `
Operating Systems - Concurrency and Synchronization

Mutual Exclusion:
Mutual exclusion is a property of concurrency control in multiprogramming where no two processes can exist in their critical section at the same time. The critical section is a part of code that accesses shared resources, such as shared memory or hardware devices.

Semaphores:
A semaphore is a synchronization tool introduced by Edsger Dijkstra. A semaphore S is an integer variable that, apart from initialization, is accessed only through two standard atomic operations: wait() and signal().
- wait() (historically known as P) decrements the semaphore value. If the value becomes negative, the process calling wait() is blocked.
- signal() (historically known as V) increments the semaphore value. If there are blocked processes, one is awakened.

Binary Semaphores vs Counting Semaphores:
A binary semaphore can take only the values 0 and 1. It behaves identically to a mutex lock. A counting semaphore can take an unrestricted integer domain and is typically used to control access to a given resource consisting of a finite number of instances.

Deadlocks:
A deadlock is a situation in which two or more competing actions are each waiting for the other to finish, and thus neither ever does. The four Coffman conditions required for a deadlock to occur are:
1. Mutual Exclusion
2. Hold and Wait
3. No Preemption
4. Circular Wait
  `.trim();

  await fs.writeFile(sampleFilePath, sampleContent, 'utf-8');

  const testUser = await User.create({
    name: 'Study Tools Dev',
    email: 'study.dev.' + Date.now() + '@studynest.dev',
    passwordHash: 'dummy_hash',
  });

  const testNotebook = await Notebook.create({
    userId: testUser._id,
    title: 'Operating Systems CS301',
  });

  const testDoc = await Document.create({
    userId: testUser._id,
    notebookId: testNotebook._id,
    originalFilename: 'concurrency-notes.txt',
    storedFilename: 'test-concurrency.txt',
    storagePath: sampleFilePath,
    mimeType: 'text/plain',
    fileSize: Buffer.byteLength(sampleContent),
    fileHash: 'dummy_hash_tools',
    status: 'ready',
    pageCount: 1,
    chunkCount: 3,
  });
  console.log('  ✓ Fixtures ready: User, Notebook, and Document created.');

  // Step 2: Test JSON Parser Resilience
  console.log('\n[2/6] Testing JSON Parser Robustness...');
  const mockMarkdownResponse = `Here are the cards you requested:\n\`\`\`json\n[\n  {"question": "What is mutual exclusion?", "answer": "Only one process can enter the critical section at a time."}\n]\n\`\`\`\nHope this helps!`;
  const extracted = extractJSONFromLLMResponse(mockMarkdownResponse);
  if (!Array.isArray(extracted) || extracted[0].question !== 'What is mutual exclusion?') {
    throw new Error('JSON parser failed to strip markdown fences and conversational wrappers!');
  }
  console.log('  ✓ Verified: JSON parser extracts structured arrays through fences and conversational prose.');

  // Step 3: Test Document Summary Generation & Quota Caching
  console.log('\n[3/6] Testing Document Summary Generation & Cache Rule...');
  const summary1 = await getOrGenerateSummary({
    documentId: testDoc._id,
    userId: testUser._id,
  });
  console.log(`  ✓ Generated summary for: "${summary1.title}"`);
  console.log(`  ✓ Key points identified: ${summary1.keyPoints.length}`);

  // Second call must return cached summary without calling LLM
  const startTime = Date.now();
  const summary2 = await getOrGenerateSummary({
    documentId: testDoc._id,
    userId: testUser._id,
  });
  const cacheLookupTime = Date.now() - startTime;
  if (summary1._id.toString() !== summary2._id.toString() || cacheLookupTime > 200) {
    throw new Error('Summary caching rule failed! Did not return cached summary.');
  }
  console.log(`  ✓ Verified: Quota saved! Cached summary returned from MongoDB in ${cacheLookupTime}ms.`);

  // Step 4: Test Flashcard Deck Generation
  console.log('\n[4/6] Generating Active Recall Flashcard Deck (Llama 3.2 3B)...');
  const flashcardSet = await generateFlashcardSet({
    notebookId: testNotebook._id,
    userId: testUser._id,
    documentId: testDoc._id,
    count: 4,
  });
  console.log(`  ✓ Created flashcard set: "${flashcardSet.title}"`);
  console.log(`  ✓ Generated ${flashcardSet.cards.length} cards:`);
  flashcardSet.cards.forEach((card, idx) => {
    console.log(`    Card ${idx + 1}: Q: "${card.question}"`);
    console.log(`             A: "${card.answer}"`);
  });

  if (flashcardSet.cards.length < 3) {
    throw new Error('Flashcard generation returned too few cards!');
  }
  console.log('  ✓ Verified: Flashcards validated and persisted in MongoDB.');

  // Step 5: Test Multiple Choice Quiz Generation
  console.log('\n[5/6] Generating 4-Option MCQ Quiz (Llama 3.2 3B)...');
  const quiz = await generateQuiz({
    notebookId: testNotebook._id,
    userId: testUser._id,
    documentId: testDoc._id,
    count: 3,
  });
  console.log(`  ✓ Created quiz: "${quiz.title}" with ${quiz.questions.length} questions:`);
  quiz.questions.forEach((q, idx) => {
    console.log(`    Q${idx + 1}: ${q.question}`);
    console.log(`       Options: ${q.options.join(' | ')}`);
    console.log(`       Correct: ${q.correctAnswer}`);
    console.log(`       Explanation: ${q.explanation}`);
    // Assert 4 options
    if (q.options.length !== 4) {
      throw new Error(`Question ${idx + 1} does not have exactly 4 options!`);
    }
    // Assert correct answer is one of the 4 options
    if (!q.options.includes(q.correctAnswer)) {
      throw new Error(`Question ${idx + 1} correctAnswer is not in options array!`);
    }
  });
  console.log('  ✓ Verified: All quiz questions adhere to 4-option schema with verified correct answers.');

  // Step 6: Verify Database Persistence & Teardown
  console.log('\n[6/6] Verifying MongoDB Querying and Cleanup...');
  const userSets = await FlashcardSet.find({ userId: testUser._id });
  const userQuizzes = await Quiz.find({ userId: testUser._id });
  const userSummaries = await Summary.find({ userId: testUser._id });

  if (userSets.length !== 1 || userQuizzes.length !== 1 || userSummaries.length !== 1) {
    throw new Error('Database persistence count mismatch!');
  }
  console.log('  ✓ Verified: All 3 study artifact types queryable by authenticated user.');

  // Clean up
  await FlashcardSet.deleteMany({ userId: testUser._id });
  await Quiz.deleteMany({ userId: testUser._id });
  await Summary.deleteMany({ userId: testUser._id });
  await Document.findByIdAndDelete(testDoc._id);
  await Notebook.findByIdAndDelete(testNotebook._id);
  await User.findByIdAndDelete(testUser._id);
  await fs.rm(testDir, { recursive: true, force: true });
  await mongoose.disconnect();

  console.log('\n' + '='.repeat(60));
  console.log('  🎉 All Phase 5 AI Study Tools checks PASSED!');
  console.log('='.repeat(60) + '\n');
}

verifyPhase5().catch((err) => {
  console.error('❌ Phase 5 verification error:', err);
  process.exit(1);
});

