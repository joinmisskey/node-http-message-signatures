import { execFileSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { jest } from '@jest/globals';
import { createSlaccSigningKey, createSlaccVerifier, type SlaccBinding } from '../../src/node/slacc.js';
import { importPrivateKey } from '../../src/index.js';

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKey = pair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
const publicKey = pair.publicKey.export({ format: 'der', type: 'spki' });
const publicRaw = pair.publicKey.export({ format: 'der', type: 'pkcs1' });
const options = { keyId: 'actor', version: 'draft' as const, algorithm: 'rsa-v1_5-sha256' as const, privateKey };
const context = { version: 'draft' as const, keyId: 'actor', signatureAlgorithm: 'rsa-sha256', algorithm: { name: 'RSASSA-PKCS1-v1_5' as const, hash: 'SHA-256' as const }, signingString: 'é😀\u0000\r\n', signature: new Uint8Array(256) };
function binding(signRaw = jest.fn((_payload: Buffer, callback: (e: Error | null, b: Buffer) => unknown) => callback(null, Buffer.alloc(256)))): SlaccBinding {
	return { SignatureAlgorithmIdentifier: { Rsa2048_8192: 'Rsa2048_8192', Eddsa: 'Eddsa' }, Signer: { fromPkcs8Der: () => ({ publicKey: publicRaw, signRaw }) }, Verifier: { fromSpkiDer: () => ({ verifyRaw: (_s, _p, cb) => { cb(null, true); } }) } };
}

test('real slacc 0.2.0 interoperability runs in a separate process', () => {
	const result = execFileSync(process.execPath, ['test/native/slacc-child.mjs'], { encoding: 'utf8', timeout: 30000 });
	expect(JSON.parse(result).checks).toBeGreaterThan(10);
}, 35000);

test('callbacks preserve exact UTF-8 bytes, copy results and settle once', async () => {
	const result = Buffer.alloc(256, 7);
	const seen: Buffer[] = [];
	const native = binding(jest.fn((payload, callback) => { seen.push(payload); callback(null, result); callback(new Error('late'), result); throw new Error('after callback'); }));
	const key = createSlaccSigningKey(native, options);
	const signed = await key.signer(context);
	expect(seen[0]).toEqual(Buffer.from('c3a9f09f9880000d0a', 'hex'));
	result.fill(0);
	expect(signed[0]).toBe(7);
});

test('native callback errors, synchronous exceptions and invalid results reject', async () => {
	for (const run of [(_p: Buffer, cb: (e: Error | null, b: Buffer) => unknown) => cb(new Error('native failure'), Buffer.alloc(256)), () => { throw new Error('native failure'); }]) {
		await expect(createSlaccSigningKey(binding(jest.fn(run)), options).signer(context)).rejects.toThrow('native failure');
	}
	await expect(createSlaccSigningKey(binding(jest.fn((_p, cb) => cb(null, Buffer.alloc(1)))), options).signer(context)).rejects.toThrow('callback result');
	const native = binding();
	native.Verifier.fromSpkiDer = () => ({ verifyRaw: (_s, _p, cb) => { cb(null, 1 as unknown as boolean); } });
	await expect(createSlaccVerifier(native, { algorithm: options.algorithm, publicKey })(context)).rejects.toThrow('callback result');
});

test('unsupported inputs and malformed DER are rejected before native construction', async () => {
	const native = binding();
	const construct = jest.spyOn(native.Signer, 'fromPkcs8Der');
	for (const input of [Buffer.from([0x30, 0x80]), Buffer.concat([pair.privateKey.export({ type: 'pkcs8', format: 'der' }), Buffer.from([0])]), { kty: 'RSA' }, await importPrivateKey(privateKey), '-----BEGIN ENCRYPTED PRIVATE KEY-----\nAA==\n-----END ENCRYPTED PRIVATE KEY-----', new Uint8Array(1024 * 1024 + 1)]) {
		expect(() => createSlaccSigningKey(native, { ...options, privateKey: input as string })).toThrow();
	}
	expect(construct).not.toHaveBeenCalled();
});

test('caller option mutation cannot change a captured key or operation', async () => {
	const mutable = { ...options };
	const key = createSlaccSigningKey(binding(), mutable);
	mutable.keyId = 'other';
	mutable.version = 'rfc9421' as 'draft';
	mutable.algorithm = 'ed25519' as 'rsa-v1_5-sha256';
	await expect(key.signer(context)).resolves.toHaveLength(256);
	await expect(key.signer({ ...context, keyId: 'other' })).rejects.toThrow('key ID');
});

test('DER subarray boundaries and public constructor validation are retained', () => {
	const native = binding();
	const der = pair.privateKey.export({ format: 'der', type: 'pkcs8' });
	const padded = Buffer.concat([Buffer.from([1, 2, 3]), der, Buffer.from([4, 5])]);
	expect(() => createSlaccSigningKey(native, { ...options, privateKey: padded.subarray(3, 3 + der.length) })).not.toThrow();
	const construct = jest.spyOn(native.Verifier, 'fromSpkiDer');
	const other = generateKeyPairSync('ed25519').publicKey.export({ format: 'der', type: 'spki' });
	for (const input of [other, Buffer.concat([publicKey, Buffer.from([0])]), new Uint8Array([0x30, 0x80])]) {
		expect(() => createSlaccVerifier(native, { algorithm: options.algorithm, publicKey: input })).toThrow();
	}
	expect(construct).not.toHaveBeenCalled();
});

test('verification copies exact signature bytes and propagates native errors without fallback', async () => {
	const native = binding();
	const signature = new Uint8Array(256).fill(8);
	let copied: Buffer | undefined;
	let bytes: Buffer | undefined;
	native.Verifier.fromSpkiDer = () => ({ verifyRaw: (s, p, cb) => { copied = s; bytes = p; setImmediate(() => cb(new Error('verify failure'), false)); } });
	const verifier = createSlaccVerifier(native, { algorithm: options.algorithm, publicKey });
	const pending = verifier({ ...context, signature });
	signature.fill(0);
	await expect(pending).rejects.toThrow('verify failure');
	expect(copied?.[0]).toBe(8);
	expect(bytes).toEqual(Buffer.from(context.signingString, 'utf8'));
});

test('keyless verifier rejects unknown versions and configured-operation substitution', async () => {
	const verifier = createSlaccVerifier(binding(), { algorithm: options.algorithm, publicKey });
	await expect(verifier({ ...context, version: 'unknown' as 'draft' })).rejects.toThrow('version');
	await expect(verifier({ ...context, algorithm: { name: 'Ed25519' }, signatureAlgorithm: 'ed25519-sha512' })).rejects.toThrow('operation conflicts');
});
