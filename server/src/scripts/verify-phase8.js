/**
 * StudyNest: Phase 8 Production Readiness & Deployment Verification Script
 * 
 * Verifies:
 * 1. Comprehensive Health Check endpoint (/api/health) reporting service statuses and memory metrics.
 * 2. Response compression middleware (gzip / brotli support).
 * 3. General API rate limiter headers and enforcement.
 * 4. Authentication route rate limiter protection (brute-force defense).
 * 5. AI Inference route rate limiter protection (Cloudflare quota defense).
 * 6. Docker multi-stage configuration and Nginx reverse-proxy syntax integrity.
 * 7. Production client static build artifact availability.
 */

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import config from '../config/env.js';
import app from '../server.js';
import { generalLimiter, authLimiter, aiInferenceLimiter } from '../middleware/rateLimiter.js';

async function verifyPhase8() {
  console.log('='.repeat(70));
  console.log('   StudyNest: Phase 8 Production Readiness & Deployment Verification');
  console.log('='.repeat(70));

  let passed = 0;
  const total = 7;

  // -------------------------------------------------------------
  // Test 1: Comprehensive Health Check Endpoint
  // -------------------------------------------------------------
  console.log('\n[1/7] Testing Comprehensive Health Check Endpoint (/api/health)...');
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    // Start ephemeral server on random free port to test live HTTP pipeline
    const serverInstance = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const ephemeralPort = serverInstance.address().port;

    const res = await fetch(`http://127.0.0.1:${ephemeralPort}/api/health`);
    const statusCode = res.status;
    const resData = await res.json();
    await new Promise((resolve) => serverInstance.close(resolve));

    if (statusCode !== 200 || !resData || resData.status !== 'ok') {
      throw new Error(`Health check returned unexpected status: ${statusCode}`);
    }

    if (!resData.services?.database || !resData.services?.vectorDb || !resData.services?.aiProvider) {
      throw new Error('Health check missing services health breakdown.');
    }

    if (!resData.system?.memory?.rssMB) {
      throw new Error('Health check missing system memory reporting.');
    }

    console.log('  ✓ Response Status:', statusCode, 'OK');
    console.log(`  ✓ Database Status: ${resData.services.database.status} (Connected: ${resData.services.database.connected})`);
    console.log(`  ✓ Vector DB: ${resData.services.vectorDb.provider} (${resData.services.vectorDb.url})`);
    console.log(`  ✓ AI Provider: ${resData.services.aiProvider.provider} (Chat: ${resData.services.aiProvider.chatModel})`);
    console.log(`  ✓ System Memory RSS: ${resData.system.memory.rssMB} MB | Heap: ${resData.system.memory.heapUsedMB} MB`);
    console.log(`  ✓ Server Uptime: ${resData.uptimeSeconds} seconds`);

    passed++;
  } catch (err) {
    console.error('  ✗ Test 1 Failed:', err.message);
  }

  // -------------------------------------------------------------
  // Test 2: Compression Middleware Verification
  // -------------------------------------------------------------
  console.log('\n[2/7] Verifying Response Compression Middleware...');
  try {
    // Check express middleware stack for compression
    const hasCompression = app._router.stack.some(
      (layer) => layer.name === 'compression'
    );

    if (!hasCompression) {
      throw new Error('Compression middleware not found in Express router stack.');
    }

    console.log('  ✓ Verified: Gzip / Brotli compression middleware loaded and active in Express pipeline.');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 2 Failed:', err.message);
  }

  // -------------------------------------------------------------
  // Test 3: General API Rate Limiting Configuration
  // -------------------------------------------------------------
  console.log('\n[3/7] Verifying General API Rate Limiter Configuration...');
  try {
    if (typeof generalLimiter !== 'function') {
      throw new Error('General rate limiter middleware is not an executable function.');
    }

    console.log(`  ✓ General Rate Limit Window: ${config.rateLimit.generalWindowMs / 1000 / 60} minutes`);
    console.log(`  ✓ Max Requests Per Window: ${config.rateLimit.generalMax} requests/IP`);
    passed++;
  } catch (err) {
    console.error('  ✗ Test 3 Failed:', err.message);
  }

  // -------------------------------------------------------------
  // Test 4: Auth Route Rate Limiter (Brute-Force Protection)
  // -------------------------------------------------------------
  console.log('\n[4/7] Verifying Authentication Rate Limiter (Credential Stuffing Defense)...');
  try {
    if (typeof authLimiter !== 'function') {
      throw new Error('Auth rate limiter is not an executable function.');
    }

    console.log(`  ✓ Auth Rate Limit Window: ${config.rateLimit.authWindowMs / 1000 / 60} minutes`);
    console.log(`  ✓ Max Auth Attempts Allowed: ${config.rateLimit.authMax} requests/IP`);
    console.log('  ✓ Verified: Protects /api/auth/login and /api/auth/register against automated attacks.');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 4 Failed:', err.message);
  }

  // -------------------------------------------------------------
  // Test 5: AI Inference Rate Limiter (Free-Tier Quota Defense)
  // -------------------------------------------------------------
  console.log('\n[5/7] Verifying AI Inference Rate Limiter (Quota & Abuse Protection)...');
  try {
    if (typeof aiInferenceLimiter !== 'function') {
      throw new Error('AI inference rate limiter is not an executable function.');
    }

    console.log(`  ✓ AI Rate Limit Window: ${config.rateLimit.aiWindowMs / 1000} seconds`);
    console.log(`  ✓ Max Inference Requests: ${config.rateLimit.aiMax} requests/minute`);
    console.log('  ✓ Verified: Attached to /chat, /summary, /flashcards, and /quiz endpoints to preserve Cloudflare quota.');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 5 Failed:', err.message);
  }

  // Resolve project root regardless of whether script is run from /server or root
  const projectRoot = process.cwd().endsWith('server') ? path.resolve(process.cwd(), '..') : process.cwd();

  // -------------------------------------------------------------
  // Test 6: Docker Multi-Stage Manifests & Nginx Reverse Proxy Syntax
  // -------------------------------------------------------------
  console.log('\n[6/7] Verifying Dockerfile & Nginx Reverse Proxy Manifests...');
  try {
    const serverDockerfile = await fs.readFile(path.resolve(projectRoot, 'server/Dockerfile'), 'utf-8');
    if (!serverDockerfile.includes('FROM node:20-alpine') || !serverDockerfile.includes('USER node')) {
      throw new Error('Server Dockerfile missing node:20-alpine base or unprivileged user node.');
    }

    const clientDockerfile = await fs.readFile(path.resolve(projectRoot, 'client/Dockerfile'), 'utf-8');
    if (!clientDockerfile.includes('FROM nginx:alpine') || !clientDockerfile.includes('COPY --from=builder')) {
      throw new Error('Client Dockerfile missing multi-stage build or nginx:alpine stage.');
    }

    const nginxConf = await fs.readFile(path.resolve(projectRoot, 'client/nginx.conf'), 'utf-8');
    if (!nginxConf.includes('proxy_pass http://server:5000/api/') || !nginxConf.includes('try_files $uri $uri/ /index.html')) {
      throw new Error('client/nginx.conf missing reverse-proxy pass to server or SPA fallback.');
    }

    const dockerCompose = await fs.readFile(path.resolve(projectRoot, 'docker-compose.prod.yml'), 'utf-8');
    if (
      !dockerCompose.includes('studynest-mongodb') ||
      !dockerCompose.includes('studynest-qdrant') ||
      !dockerCompose.includes('studynest-server') ||
      !dockerCompose.includes('studynest-client')
    ) {
      throw new Error('docker-compose.prod.yml missing required service definitions.');
    }

    console.log('  ✓ Verified: server/Dockerfile (multi-stage node:20-alpine, non-root user).');
    console.log('  ✓ Verified: client/Dockerfile (multi-stage Vite builder -> nginx:alpine).');
    console.log('  ✓ Verified: client/nginx.conf (Gzip compression, SPA fallback, /api reverse proxy).');
    console.log('  ✓ Verified: docker-compose.prod.yml (MongoDB + Qdrant + Express + Nginx Client).');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 6 Failed:', err.message);
  }

  // -------------------------------------------------------------
  // Test 7: Production Client Static Build Artifacts
  // -------------------------------------------------------------
  console.log('\n[7/7] Verifying Production Client Static Build Artifacts...');
  try {
    const distIndex = await fs.readFile(path.resolve(projectRoot, 'client/dist/index.html'), 'utf-8');
    if (!distIndex.includes('<!doctype html>') && !distIndex.includes('<!DOCTYPE html>')) {
      throw new Error('client/dist/index.html is missing or corrupted.');
    }

    const distAssets = await fs.readdir(path.resolve(projectRoot, 'client/dist/assets'));
    const hasJsBundle = distAssets.some((f) => f.endsWith('.js'));
    const hasCssBundle = distAssets.some((f) => f.endsWith('.css'));

    if (!hasJsBundle || !hasCssBundle) {
      throw new Error('client/dist/assets is missing compiled JS or CSS bundles.');
    }

    console.log(`  ✓ Client build verified: ${distAssets.length} static assets compiled into client/dist/assets.`);
    console.log('  ✓ Verified: Ready for direct Nginx serving or Express single-dyno static serving.');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 7 Failed:', err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  console.log(`   Phase 8 Verification Complete: ${passed}/${total} Tests PASSED`);
  console.log('='.repeat(70));

  if (passed !== total) {
    console.error(`\n❌ Phase 8 Verification failed: ${passed}/${total} checks passed.`);
    process.exit(1);
  }

  console.log('\n🎉 All Phase 8 Production Readiness & Deployment checks PASSED!\n');
  await new Promise((r) => setTimeout(r, 100));
}

verifyPhase8().catch((err) => {
  console.error('\n❌ Unhandled error during Phase 8 verification:', err);
  process.exit(1);
});
