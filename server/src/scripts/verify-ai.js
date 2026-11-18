/**
 * Isolated Cloudflare Workers AI Verification Script
 * 
 * Verifies:
 * 1. Cloudflare Workers AI credentials.
 * 2. Short text generation using @cf/meta/llama-3.2-3b-instruct.
 * 3. Query embedding using @cf/baai/bge-base-en-v1.5.
 * 4. Document batch embeddings.
 * 5. Embedding vector dimension matches 768.
 * 
 * Usage:
 *   node src/scripts/verify-ai.js
 *   npm run test:ai
 */

import config from '../config/env.js';
import {
  createChatModel,
  createEmbeddingModel,
  formatCloudflareError,
  validateCloudflareCredentials
} from '../services/ai/cloudflare.service.js';

async function verifyAI() {
  console.log('='.repeat(60));
  console.log('  StudyNest: Cloudflare Workers AI Verification');
  console.log('='.repeat(60));

  console.log('\n[1/5] Checking Environment Configuration...');
  try {
    const { accountId, apiToken, baseUrl } = validateCloudflareCredentials();
    const maskedToken = apiToken.slice(0, 4) + '...' + apiToken.slice(-4);
    console.log(`  ✓ Account ID:      ${accountId}`);
    console.log(`  ✓ API Token:       ${maskedToken}`);
    console.log(`  ✓ Base URL:        ${baseUrl}`);
    console.log(`  ✓ Chat Model:      ${config.cloudflare.chatModel}`);
    console.log(`  ✓ Embedding Model: ${config.cloudflare.embeddingModel}`);
    console.log(`  ✓ Expected Dim:    ${config.cloudflare.embeddingDimension}`);
  } catch (error) {
    console.error(`\n❌ Configuration check failed: ${error.message}`);
    console.log('\nPlease edit server/.env and fill in:');
    console.log('  CLOUDFLARE_ACCOUNT_ID=your_actual_account_id');
    console.log('  CLOUDFLARE_API_TOKEN=your_actual_api_token\n');
    process.exit(1);
  }

  // Step 2: Test Chat Generation
  console.log('\n[2/5] Testing Text Generation (Llama 3.2 3B)...');
  try {
    const chat = createChatModel({ maxTokens: 60, temperature: 0.2 });
    const prompt = 'What is an operating system kernel in one sentence?';
    console.log(`  Prompt: "${prompt}"`);
    
    const startTime = Date.now();
    const response = await chat.invoke(prompt);
    const duration = Date.now() - startTime;
    
    console.log(`  ✓ Response (${duration}ms):`);
    console.log(`    "${response.content.trim()}"`);
  } catch (error) {
    const formatted = formatCloudflareError(error);
    console.error(`\n❌ Chat generation failed: ${formatted.message}`);
    console.error(`  Details: ${error.message}`);
    process.exit(1);
  }

  // Step 3: Test Single Query Embedding
  console.log('\n[3/5] Testing Single Query Embedding (BGE Base En v1.5)...');
  try {
    const embeddings = createEmbeddingModel();
    const query = 'Process vs Thread execution';
    
    const startTime = Date.now();
    const vector = await embeddings.embedQuery(query);
    const duration = Date.now() - startTime;

    console.log(`  ✓ Query: "${query}"`);
    console.log(`  ✓ Embedding returned in ${duration}ms`);
    console.log(`  ✓ Embedding length: ${vector.length}`);

    // Step 4: Verify Embedding Dimension
    console.log('\n[4/5] Verifying Vector Dimension...');
    if (vector.length === config.cloudflare.embeddingDimension) {
      console.log(`  ✓ Verified: Vector dimension is exactly ${config.cloudflare.embeddingDimension}.`);
    } else {
      console.warn(
        `  ⚠️ Dimension Mismatch! Expected ${config.cloudflare.embeddingDimension}, got ${vector.length}. Please update EMBEDDING_DIMENSION in .env.`
      );
    }
  } catch (error) {
    const formatted = formatCloudflareError(error);
    console.error(`\n❌ Query embedding failed: ${formatted.message}`);
    console.error(`  Details: ${error.message}`);
    process.exit(1);
  }

  // Step 5: Test Batch Document Embeddings
  console.log('\n[5/5] Testing Batch Document Embeddings...');
  try {
    const embeddings = createEmbeddingModel();
    const sampleDocs = [
      'CPU scheduling allocates processor time among running processes.',
      'Virtual memory isolates application address spaces to prevent conflicts.'
    ];

    const startTime = Date.now();
    const docVectors = await embeddings.embedDocuments(sampleDocs);
    const duration = Date.now() - startTime;

    console.log(`  ✓ Embedded ${docVectors.length} documents in ${duration}ms`);
    console.log(`  ✓ Doc 1 vector length: ${docVectors[0].length}`);
    console.log(`  ✓ Doc 2 vector length: ${docVectors[1].length}`);
  } catch (error) {
    const formatted = formatCloudflareError(error);
    console.error(`\n❌ Batch embedding failed: ${formatted.message}`);
    console.error(`  Details: ${error.message}`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  🎉 All Cloudflare Workers AI checks PASSED successfully!');
  console.log('='.repeat(60) + '\n');
}

verifyAI().catch((err) => {
  console.error('Unexpected error during verification:', err);
  process.exit(1);
});

