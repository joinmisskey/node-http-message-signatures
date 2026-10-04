import * as api from '../../src/index.ts';
import { createVerificationCases } from '../verification-cases.js';

async function run() {
  const result = { passed: 0, skipped: [], failures: [] };
  if (await api.getWebcrypto() !== globalThis.crypto) throw new Error('Expected native browser Web Crypto');
  const cases = await createVerificationCases(api, crypto);
  for (const [name, check] of Object.entries(cases)) {
    try { await check(); result.passed++; } catch (error) { result.failures.push(`${name}: ${error.message}`); }
  }
  // Retain the original Chrome GET/POST query regression matrix.
  for (const name of ['RSASSA-PKCS1-v1_5', 'Ed25519']) {
    let pair;
    try {
      pair = await crypto.subtle.generateKey(name === 'Ed25519' ? { name } : { name, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
    } catch (error) {
      if (error.name !== 'NotSupportedError') throw error;
      result.skipped.push(`${name}: ${error.message}`);
      continue;
    }
    for (const method of ['GET', 'POST']) {
      for (const [suffix, target] of [['/inbox', '/inbox'], ['/inbox?q=%2f%23&a=1+2', '/inbox?q=%2f%23&a=1+2'], ['/inbox?', '/inbox?'], ['/inbox?#fragment', '/inbox?'], ['/inbox#fragment?ignored', '/inbox']]) {
        const request = { method, url: `https://example.com:8443${suffix}`, headers: { Host: 'example.com:8443', Date: new Date().toUTCString() } };
        try {
          if (api.genDraftSigningString(request, ['(request-target)']) !== `(request-target): ${method.toLowerCase()} ${target}`) throw new Error('Unexpected draft target');
          await api.signAsDraftToRequest(request, { privateKey: pair.privateKey, keyId: 'browser-key' }, ['(request-target)', 'host', 'date']);
          const parsed = api.parseDraftRequest({ ...request, url: target });
          if (!await api.verifyDraftSignature(parsed.value, pair.publicKey)) throw new Error('Draft verification failed');
          result.passed++;
        } catch (error) { result.failures.push(`${name} ${method} ${suffix}: ${error.message}`); }
      }
    }
  }
  return result;
}

if (typeof document === 'undefined') {
  run().then(result => postMessage(result)).catch(error => postMessage({ passed: 0, skipped: [], failures: [error.message] }));
} else {
  (async () => {
    const main = await run();
    const worker = new Worker('/worker.js');
    const workerResult = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Worker timed out')), 30000);
      worker.onmessage = event => { clearTimeout(timer); resolve(event.data); };
      worker.onerror = event => { clearTimeout(timer); reject(new Error(event.message)); };
    });
    worker.terminate();
    globalThis.browserTestResult = { main, worker: workerResult };
  })().catch(error => { globalThis.browserTestResult = { error: error.message }; });
}
