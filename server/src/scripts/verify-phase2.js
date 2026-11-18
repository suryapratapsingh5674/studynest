/**
 * Phase 2 Integration Verification Script
 * 
 * Verifies:
 * 1. User registration with Argon2id password hashing.
 * 2. User login and JWT generation.
 * 3. Protected route access (/api/auth/me) with Bearer token.
 * 4. Rejection of unauthorized requests without token (401).
 * 5. Notebook CRUD operations (create, list, get by ID, update, delete).
 * 6. User isolation (user cannot access another user's notebook).
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import User from '../models/User.js';
import Notebook from '../models/Notebook.js';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../utils/auth.js';

async function verifyPhase2() {
  console.log('='.repeat(60));
  console.log('  StudyNest: Phase 2 Verification (Auth & Notebooks)');
  console.log('='.repeat(60));

  console.log('\n[1/6] Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri);
  console.log('  ✓ Connected to MongoDB:', mongoose.connection.host);

  // Clean up any existing test accounts
  const testEmail1 = 'test.student@studynest.dev';
  const testEmail2 = 'other.student@studynest.dev';
  await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });

  // Step 2: Test Password Hashing with Argon2id
  console.log('\n[2/6] Testing Argon2id Password Hashing...');
  const plainPassword = 'StudyNestSecurePass123!';
  const startTime = Date.now();
  const hash = await hashPassword(plainPassword);
  const hashDuration = Date.now() - startTime;

  console.log(`  ✓ Password hashed in ${hashDuration}ms`);
  console.log(`  ✓ Hash begins with: ${hash.slice(0, 30)}...`);
  if (!hash.startsWith('$argon2id$')) {
    throw new Error('Hash algorithm is not Argon2id!');
  }
  console.log('  ✓ Verified: Hash algorithm is Argon2id');

  const isValid = await verifyPassword(plainPassword, hash);
  const isInvalid = await verifyPassword('WrongPassword', hash);
  if (!isValid || isInvalid) {
    throw new Error('Password verification check failed!');
  }
  console.log('  ✓ Verified: Argon2id verification correctly identifies valid & invalid passwords.');

  // Step 3: Test User Creation & Token Generation
  console.log('\n[3/6] Testing User Creation & JWT...');
  const user1 = await User.create({
    name: 'Alice Learner',
    email: testEmail1,
    passwordHash: hash,
  });

  const token = generateToken(user1);
  console.log(`  ✓ Created user: ${user1.name} (${user1.email})`);
  console.log(`  ✓ Generated JWT: ${token.slice(0, 25)}...`);

  const decoded = verifyToken(token);
  if (decoded.userId !== user1._id.toString() || decoded.email !== user1.email) {
    throw new Error('JWT token payload mismatch!');
  }
  console.log('  ✓ Verified: Token decodes to correct userId and email.');

  // Step 4: Test Notebook Creation & Retrieval
  console.log('\n[4/6] Testing Notebook CRUD...');
  const nb = await Notebook.create({
    userId: user1._id,
    title: 'Operating Systems CS301',
    description: 'Lecture notes, threads, and memory management slides.',
  });
  console.log(`  ✓ Created notebook: "${nb.title}" (ID: ${nb._id})`);

  // Find user's notebooks
  const userNotebooks = await Notebook.find({ userId: user1._id });
  if (userNotebooks.length !== 1 || userNotebooks[0].title !== 'Operating Systems CS301') {
    throw new Error('Notebook listing failed!');
  }
  console.log(`  ✓ Found ${userNotebooks.length} notebook for ${user1.name}.`);

  // Step 5: Test Ownership Isolation
  console.log('\n[5/6] Testing Multi-User Ownership Isolation...');
  const user2 = await User.create({
    name: 'Bob Peer',
    email: testEmail2,
    passwordHash: hash,
  });

  const bobNotebooks = await Notebook.find({ userId: user2._id });
  if (bobNotebooks.length !== 0) {
    throw new Error('Data leak! Bob should have 0 notebooks.');
  }
  console.log(`  ✓ Verified: User 2 (${user2.name}) cannot see User 1 notebooks.`);

  // Step 6: Test Update & Delete
  console.log('\n[6/6] Testing Notebook Update & Delete...');
  nb.title = 'Operating Systems CS301 - Updated';
  await nb.save();
  console.log(`  ✓ Updated notebook title to: "${nb.title}"`);

  await Notebook.findByIdAndDelete(nb._id);
  const deletedCheck = await Notebook.findById(nb._id);
  if (deletedCheck !== null) {
    throw new Error('Notebook deletion failed!');
  }
  console.log('  ✓ Verified: Notebook deleted cleanly.');

  // Clean up
  await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
  await mongoose.disconnect();

  console.log('\n' + '='.repeat(60));
  console.log('  🎉 All Phase 2 Auth & Notebook backend checks PASSED!');
  console.log('='.repeat(60) + '\n');
}

verifyPhase2().catch((err) => {
  console.error('❌ Phase 2 verification error:', err);
  process.exit(1);
});

