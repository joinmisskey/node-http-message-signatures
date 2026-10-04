import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import * as api from '../../dist/index.mjs';
import * as adapter from '../../dist/node/slacc.mjs';
import { rsa4096 } from '../keys.js';
const require = createRequire(import.meta.url);
const modern = process.argv[2] === 'modern';
const binding = require(modern ? 'slacc-modern' : 'slacc-legacy');
const make = (options, native = binding) => modern ? adapter.createSlaccSigningKey(native, options) : adapter.createLegacySlaccRsaSigningKey(native, options);
let checks = 0;
function check(value) { assert.equal(value, true); checks++; }
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const rsa4 = { privateKey: createPrivateKey(rsa4096.privateKey), publicKey: createPublicKey(rsa4096.publicKey) };
const ed = generateKeyPairSync('ed25519');
const input = rsa.privateKey.export({ format: 'pem', type: 'pkcs1' }).toString();
const uninitialized = make({ keyId: 'actor', version: 'draft', algorithm: 'rsa-v1_5-sha256', privateKey: input });
await assert.rejects(uninitialized.signer({ version: 'draft', keyId: 'actor', signatureAlgorithm: uninitialized.signatureAlgorithm, algorithm: uninitialized.algorithm, signingString: 'raw' }), /initialized/); checks++;
binding.init(1);
assert.throws(() => binding.init(1), /already initialized/); checks++;
check(verify('sha256', Buffer.from('raw'), rsa.publicKey, await uninitialized.signer({ version: 'draft', keyId: 'actor', signatureAlgorithm: uninitialized.signatureAlgorithm, algorithm: uninitialized.algorithm, signingString: 'raw' })));
if (modern) {
  const pkcs1 = rsa.publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();
  check(await adapter.createSlaccVerifier(binding, { algorithm: 'rsa-v1_5-sha256', publicKey: pkcs1 })({ version: 'draft', signatureAlgorithm: 'rsa-sha256', algorithm: uninitialized.algorithm, signingString: 'raw', signature: sign('sha256', Buffer.from('raw'), rsa.privateKey) }));
}
for (const [algorithm, pair] of [['rsa-v1_5-sha256', rsa], ['rsa-v1_5-sha256', rsa4], ...(modern ? [['ed25519', ed]] : [])]) {
  const privateDer = pair.privateKey.export({ format: 'der', type: 'pkcs8' });
  const publicDer = pair.publicKey.export({ format: 'der', type: 'spki' });
  for (const version of ['draft', 'rfc9421']) {
    const key = make({ keyId: 'actor', version, algorithm, privateKey: privateDer });
    const request = { method: 'POST', url: 'https://example.com/inbox?q=%E3%81%82&x=2', headers: { host: 'example.com' } };
    if (version === 'draft') await api.signAsDraftToRequest(request, key, ['(request-target)', 'host']);
    else await api.signAsRFC9421ToRequestOrResponse(request, { sig: { key, identifiers: ['@method', '@target-uri', 'host'] } });
    const parsed = api.parseRequestSignature(request);
    check(await api.verifyParsedSignature(parsed, pair.publicKey.export({ format: 'pem', type: 'spki' }).toString()));
    const base = version === 'draft' ? parsed.value.signingString : parsed.value[0][1].base;
    const signature = Buffer.from(version === 'draft' ? parsed.value.params.signature : parsed.value[0][1].signature, 'base64');
    check(verify(algorithm === 'ed25519' ? null : 'sha256', Buffer.from(base), pair.publicKey, signature));
    if (modern) {
      const verifier = adapter.createSlaccVerifier(binding, { algorithm, publicKey: publicDer });
      check(await api.verifyParsedSignature(parsed, { verifier }));
      const context = { version, keyId: 'actor', signatureAlgorithm: key.signatureAlgorithm, algorithm: key.algorithm, signingString: base, signature };
      check(!await verifier({ ...context, signingString: base + '\nchanged' }));
      check(!await verifier({ ...context, signature: new Uint8Array(signature.length) }));
      const wrong = algorithm === 'ed25519' ? generateKeyPairSync('ed25519') : generateKeyPairSync('rsa', { modulusLength: 2048 });
      const wrongVerifier = adapter.createSlaccVerifier(binding, { algorithm, publicKey: wrong.publicKey.export({ format: 'der', type: 'spki' }) });
      check(!await wrongVerifier(context));
      const nodeSigned = sign(algorithm === 'ed25519' ? null : 'sha256', Buffer.from(base), pair.privateKey);
      check(await verifier({ ...context, signature: nodeSigned }));
      await assert.rejects(verifier({ ...context, algorithm: { name: 'RSA-PSS', hash: 'SHA-512', saltLength: 64 }, signatureAlgorithm: 'rsa-pss-sha512' })); checks++;
      await assert.rejects(verifier({ ...context, key: await api.importPublicKey(pair.publicKey.export({ format: 'pem', type: 'spki' }).toString()) }), /keyless/); checks++;
      const fixed = adapter.createSlaccVerifier(binding, { algorithm, publicKey: publicDer, version });
      await assert.rejects(fixed({ ...context, version: version === 'draft' ? 'rfc9421' : 'draft' }), /version/); checks++;
    }
    const wrongRequest = { method: 'GET', url: 'https://example.com/', headers: { host: 'example.com' } };
    await assert.rejects(version === 'draft' ? api.signAsRFC9421ToRequestOrResponse(wrongRequest, { sig: { key, identifiers: ['@method'] } }) : api.signAsDraftToRequest(wrongRequest, key, ['host']), /version|algorithm/); checks++;
  }
}
if (modern) {
  // Validate algorithm/key binding before native construction, including suite substitution.
  assert.throws(() => make({ keyId: 'actor', version: 'draft', algorithm: 'ed25519', privateKey: input }), /RSA|conflicts/); checks++;
  assert.throws(() => make({ keyId: 'actor', version: 'draft', algorithm: 'rsa-pss-sha512', privateKey: input }), /Unsupported/); checks++;
  assert.throws(() => make({ keyId: 'actor', version: 'draft', algorithm: 'rsa-v1_5-sha256', privateKey: input }, { ...binding, SignatureAlgorithmIdentifier: { ...binding.SignatureAlgorithmIdentifier, Rsa2048_8192: 'Mldsa44' } }), /suite/); checks++;
  const wrongHandle = binding.Signer.fromPkcs8Der('Rsa2048_8192', rsa4.privateKey.export({ format: 'der', type: 'pkcs8' }));
  assert.throws(() => make({ keyId: 'actor', version: 'draft', algorithm: 'rsa-v1_5-sha256', privateKey: input }, { ...binding, Signer: { fromPkcs8Der: () => wrongHandle } }), /handle conflicts/); checks++;
  const small = generateKeyPairSync('rsa', { modulusLength: 1024 });
  assert.throws(() => make({ keyId: 'actor', version: 'draft', algorithm: 'rsa-v1_5-sha256', privateKey: small.privateKey.export({ format: 'der', type: 'pkcs8' }) }), /2048/); checks++;
}
// Both ESM and CommonJS package subpath exports must work without runtime slacc dependency.
const cjs = require('@misskey-dev/node-http-message-signatures/node/slacc');
const esm = await import('@misskey-dev/node-http-message-signatures/node/slacc');
check(typeof cjs.createSlaccVerifier === 'function' && typeof esm.createLegacySlaccRsaSigningKey === 'function');
const cjsKey = (modern ? cjs.createSlaccSigningKey : cjs.createLegacySlaccRsaSigningKey)(binding, { keyId: 'actor', version: 'draft', algorithm: 'rsa-v1_5-sha256', privateKey: input });
check(verify('sha256', Buffer.from('CommonJS raw'), rsa.publicKey, await cjsKey.signer({ version: 'draft', keyId: 'actor', signatureAlgorithm: cjsKey.signatureAlgorithm, algorithm: cjsKey.algorithm, signingString: 'CommonJS raw' })));
if (modern) check(await cjs.createSlaccVerifier(binding, { algorithm: 'rsa-v1_5-sha256', publicKey: rsa.publicKey.export({ type: 'spki', format: 'der' }) })({ version: 'draft', signatureAlgorithm: cjsKey.signatureAlgorithm, algorithm: cjsKey.algorithm, signingString: 'CommonJS raw', signature: sign('sha256', Buffer.from('CommonJS raw'), rsa.privateKey) }));
console.log(JSON.stringify({ version: modern ? '0.2.0' : '0.1.5', checks }));
