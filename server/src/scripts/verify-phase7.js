/**
 * StudyNest: Phase 7 Verification Script
 * 
 * Runs the comprehensive Phase 7 evaluation suite:
 * - Extraction & Page Preservation
 * - Chunking & 120-char Overlap Continuity
 * - Top-4 Retrieval Hit Rate & Mean Reciprocal Rank (MRR)
 * - Multi-Tenant Cross-User Data Isolation
 * - Honest Refusal on Out-of-Scope Questions (Grounding Check)
 * - Cloudflare Error & Rate Limit Handling
 * - MCP Authorization & Cross-Tenant Scope Enforcement
 */

import { runRAGEvaluationSuite } from '../tests/evaluation/retrieval.eval.js';

runRAGEvaluationSuite()
  .then((report) => {
    if (report.testsPassed !== report.totalTests) {
      console.error(`\n❌ Phase 7 Verification failed: ${report.testsPassed}/${report.totalTests} tests passed.`);
      process.exit(1);
    }
    console.log('\n🎉 All Phase 7 RAG & System Evaluation checks PASSED!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Unhandled error during Phase 7 verification:', err);
    process.exit(1);
  });

