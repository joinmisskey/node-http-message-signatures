// Opt-in, bounded native benchmark. Each invocation owns one fresh slacc pool.
import { createRequire } from 'node:module';
import { generateKeyPairSync, createPrivateKey } from 'node:crypto';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { createSlaccSigningKey, createLegacySlaccRsaSigningKey } from '../../dist/node/slacc.mjs';
import { importPrivateKey, webCryptoSigner } from '../../dist/index.mjs';
import { rsa4096 } from '../keys.js';
const mode = process.argv[2] ?? 'modern';
if (!['modern', 'legacy'].includes(mode)) throw new Error('Use modern or legacy');
const binding = createRequire(import.meta.url)(mode === 'modern' ? 'slacc-modern' : 'slacc-legacy');
const threads = Number(process.argv[3] ?? 1);
if (![1, 4].includes(threads)) throw new Error('Use 1 or 4 slacc threads');
binding.init(threads);
const make = mode === 'modern' ? createSlaccSigningKey : createLegacySlaccRsaSigningKey;
const keys = [
  ['RSA2048', 'rsa-v1_5-sha256', generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey],
  ['RSA4096', 'rsa-v1_5-sha256', createPrivateKey(rsa4096.privateKey)],
  ...(mode === 'modern' ? [['Ed25519', 'ed25519', generateKeyPairSync('ed25519').privateKey]] : []),
];
const rows = [];
for (const [name, algorithm, key] of keys) {
  const pem = key.export({ type: 'pkcs8', format: 'pem' }).toString();
  const options = { keyId: 'benchmark', version: 'rfc9421', algorithm, privateKey: pem };
  const native = make(binding, options);
  const context = { version: 'rfc9421', keyId: 'benchmark', signatureAlgorithm: native.signatureAlgorithm, algorithm: native.algorithm, signingString: '"@method": POST\n"@target-uri": https://example.com/inbox?x=1\n"host": example.com\n' + 'x'.repeat(1024) };
  const webKey = await importPrivateKey(pem);
  for (const [backend, create, warm] of [
    ['slacc', async () => make(binding, options).signer, native.signer],
    ['WebCrypto', async () => { const key = await importPrivateKey(pem); return c => webCryptoSigner({ ...c, key }); }, c => webCryptoSigner({ ...c, key: webKey })],
  ]) {
    for (const phase of ['cold', 'warm']) {
      for (const concurrency of phase === 'cold' ? [1] : [1, 16]) {
        const count = phase === 'cold' ? 8 : 128;
        const samples = [];
        const lag = monitorEventLoopDelay({ resolution: 10 });
        lag.enable();
        const rssBefore = process.memoryUsage().rss;
        const start = performance.now();
        for (let offset = 0; offset < count; offset += concurrency) {
          await Promise.all(Array.from({ length: Math.min(concurrency, count - offset) }, async () => {
            const begin = performance.now();
            const signer = phase === 'cold' ? await create() : warm;
            const signature = await signer(context);
            if (!signature.length) throw new Error('Empty signature');
            samples.push(performance.now() - begin);
          }));
        }
        const elapsed = performance.now() - start;
        lag.disable();
        samples.sort((a, b) => a - b);
        const round = x => Math.round(x * 100) / 100;
        rows.push({ key: name, backend, phase, concurrency, operations: count, opsPerSecond: round(count * 1000 / elapsed), p50Ms: round(samples[Math.floor(samples.length * .5)]), p95Ms: round(samples[Math.min(samples.length - 1, Math.floor(samples.length * .95))]), eventLoopP95Ms: lag.count ? round(lag.percentile(95) / 1e6) : null, rssDeltaMiB: round((process.memoryUsage().rss - rssBefore) / 1048576) });
      }
    }
  }
}
console.log(JSON.stringify({ mode, node: process.version, platform: process.platform, arch: process.arch, slaccThreads: threads, uvThreadpoolSize: process.env.UV_THREADPOOL_SIZE ?? 'default (4)', payload: 'UTF-8 signature base with 1024 extra ASCII bytes', rows }, null, 2));
