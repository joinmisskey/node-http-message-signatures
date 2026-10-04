import { generateKeyPairSync, sign, verify } from 'node:crypto';
import { jest } from '@jest/globals';
import { signAsDraftToRequest, signAsRFC9421ToRequestOrResponse, parseRequestSignature, verifyParsedSignature, verifyRFC9421Signature, getWebcrypto, webCryptoSigner, webCryptoVerifier, CustomSigningKey, SignatureSignerContext } from '../../src/index.js';
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const request = () => ({ method: 'POST', url: 'https://example.com/inbox?x=1', headers: { Host: 'example.com', Date: new Date().toUTCString() } });
const contexts: SignatureSignerContext[] = [];
const custom: CustomSigningKey = {
	keyId: 'rsa', signatureAlgorithm: 'rsa-v1_5-sha256', algorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
	signer: async context => { contexts.push(context); return new Uint8Array(sign('sha256', Buffer.from(context.signingString), rsa.privateKey)); },
};

async function parsedRsa() {
	const req = request();
	await signAsRFC9421ToRequestOrResponse(req, { rsa: { key: custom, identifiers: ['@method', '@target-uri', 'date'] } });
	return parseRequestSignature(req);
}

test('keyless signing never imports a key and propagates wire/operation/label', async () => {
	const spy = jest.spyOn((await getWebcrypto()).subtle, 'importKey');
	contexts.length = 0;
	const parsed = await parsedRsa();
	expect(spy).not.toHaveBeenCalled();
	expect(contexts[0]).toMatchObject({ version: 'rfc9421', label: 'rsa', keyId: 'rsa', signatureAlgorithm: 'rsa-v1_5-sha256', algorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } });
	expect(contexts[0].key).toBeUndefined();
	spy.mockRestore();
	expect(await verifyParsedSignature(parsed, pem)).toBe(true);
});

test('draft custom signing/verifying and builtin routing interoperate', async () => {
	const req = request();
	await signAsDraftToRequest(req, { ...custom, signatureAlgorithm: 'rsa-sha256' }, ['(request-target)', 'host', 'date']);
	const parsed = parseRequestSignature(req);
	expect(await verifyParsedSignature(parsed, { keys: pem, verifier: webCryptoVerifier })).toBe(true);
	expect(await verifyParsedSignature(parsed, { verifier: async context => verify('sha256', Buffer.from(context.signingString), rsa.publicKey, context.signature) })).toBe(true);
	const privateKey = await (await getWebcrypto()).subtle.importKey('jwk', rsa.privateKey.export({ format: 'jwk' }), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
	await signAsDraftToRequest(request(), { keyId: 'builtin', privateKey }, ['host'], { hash: 'SHA-256', ec: 'DSA', signer: webCryptoSigner });
});

test('resolver is authoritative; undefined fails and exceptions propagate', async () => {
	const parsed = await parsedRsa();
	let seen;
	expect(await verifyParsedSignature(parsed, { keys: pem, resolveKey: async context => { seen = context; return undefined; }, verifier: async () => true })).toBe(false);
	expect(seen).toMatchObject({ version: 'rfc9421', label: 'rsa', keyId: 'rsa', algorithm: 'rsa-v1_5-sha256' });
	await expect(verifyParsedSignature(parsed, { resolveKey: async () => { throw new Error('resolver backend failed'); } })).rejects.toThrow('resolver backend failed');
	expect(await verifyParsedSignature(parsed, { resolveKey: async () => ['malformed', pem] })).toBe(true);
});

test('custom verifier false/error never falls back for the same signature', async () => {
	const parsed = await parsedRsa();
	const verifier = jest.fn(async () => false);
	expect(await verifyParsedSignature(parsed, { resolveKey: async () => [pem, pem], verifier })).toBe(false);
	expect(verifier).toHaveBeenCalledTimes(1);
	await expect(verifyParsedSignature(parsed, { keys: pem, verifier: async () => { throw new Error('verification backend failed'); } })).rejects.toThrow('verification backend failed');
	const draftRequest = request();
	await signAsDraftToRequest(draftRequest, { ...custom, signatureAlgorithm: 'rsa-sha256' }, ['host']);
	await expect(verifyParsedSignature(parseRequestSignature(draftRequest), { keys: pem, verifier: async () => { throw new Error('draft backend failed'); } })).rejects.toThrow('draft backend failed');
});

test('mixed RFC sources route external RSA and native Ed25519 by label; any/all preserved', async () => {
	const pair = await (await getWebcrypto()).subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
	const req = request();
	await signAsRFC9421ToRequestOrResponse(req, {
		rsa: { key: custom, identifiers: ['@method'], signer: custom.signer },
		ed: { key: { keyId: 'ed', privateKey: pair.privateKey }, identifiers: ['@method'], signer: webCryptoSigner },
	});
	const parsed = parseRequestSignature(req);
	if (parsed.version !== 'rfc9421') throw new Error('Expected RFC');
	const verifier = async (context: Parameters<typeof webCryptoVerifier>[0]) => context.label === 'rsa' ? false : webCryptoVerifier(context);
	const resolveKey = async (context: { label?: string }) => context.label === 'rsa' ? pem : pair.publicKey;
	expect(await verifyRFC9421Signature(parsed.value, { resolveKey, verifier, verifyAll: false })).toBe(true);
	expect(await verifyRFC9421Signature(parsed.value, { resolveKey, verifier, verifyAll: true })).toBe(false);
});

test('unknown algorithms and wrong CryptoKey bindings fail before hooks', async () => {
	const signer = jest.fn(custom.signer);
	await expect(signAsDraftToRequest(request(), { ...custom, signatureAlgorithm: 'ed25519' }, ['host'])).rejects.toThrow();
	const key = await (await getWebcrypto()).subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
	await expect(signAsRFC9421ToRequestOrResponse(request(), { rsa: { key: { ...custom, signer, privateKey: key.privateKey }, identifiers: ['@method'] } })).rejects.toThrow('incompatible');
	expect(signer).not.toHaveBeenCalled();
	const parsed = await parsedRsa();
	if (parsed.version !== 'rfc9421') throw new Error('Expected RFC');
	const verifier = jest.fn(async () => true);
	expect(await verifyRFC9421Signature([['bad', { ...parsed.value[0][1], algorithm: 'unknown' }]], { keys: pem, verifier })).toBe(false);
	expect(await verifyRFC9421Signature(parsed.value, { keys: key.publicKey, verifier })).toBe(false);
	expect(verifier).not.toHaveBeenCalled();
});

test('parse-stage time and required-component protections remain before callbacks', async () => {
	const req = request();
	await signAsRFC9421ToRequestOrResponse(req, { rsa: { key: custom, identifiers: ['@method'], created: 1, expiresAfter: 1 } });
	expect(() => parseRequestSignature(req)).toThrow();
	const current = request();
	await signAsRFC9421ToRequestOrResponse(current, { rsa: { key: custom, identifiers: ['@method'] } });
	expect(() => parseRequestSignature(current, { requiredComponents: { rfc9421: ['@target-uri'] } })).toThrow();
});

test('draft unknown algorithm is rejected before resolver/backend callbacks', async () => {
	const req = request();
	await signAsDraftToRequest(req, { ...custom, signatureAlgorithm: 'rsa-sha256' }, ['host']);
	const parsed = parseRequestSignature(req);
	if (parsed.version !== 'draft') throw new Error('Expected draft');
	parsed.value.algorithm = 'unknown';
	const resolveKey = jest.fn(async () => pem);
	const verifier = jest.fn(async () => true);
	expect(await verifyParsedSignature(parsed, { resolveKey, verifier })).toBe(false);
	expect(resolveKey).not.toHaveBeenCalled();
	expect(verifier).not.toHaveBeenCalled();
});

test('signer backend exceptions propagate and invalid byte results fail', async () => {
	await expect(signAsRFC9421ToRequestOrResponse(request(), { rsa: { key: { ...custom, signer: async () => { throw new Error('signing backend failed'); } }, identifiers: ['@method'] } })).rejects.toThrow('signing backend failed');
	await expect(signAsDraftToRequest(request(), { ...custom, signatureAlgorithm: 'rsa-sha256', signer: async () => 'invalid' as unknown as Uint8Array }, ['host'])).rejects.toThrow('Uint8Array');
});
