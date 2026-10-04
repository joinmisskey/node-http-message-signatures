import { generateKeyPairSync, sign, verify } from 'node:crypto';
import { importPublicJwk, importPrivateJwk, importPublicKey, importPrivateKey, parseAndImportPublicKey, getWebcrypto, genSignature, signAsDraftToRequest, signAsRFC9421ToRequestOrResponse, parseRequestSignature, verifyParsedSignature } from '../../src/index.js';
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicJwk = rsa.publicKey.export({ format: 'jwk' });
const privateJwk = rsa.privateKey.export({ format: 'jwk' });

test('typed JWK imports and RSA draft signing interoperate with Node', async () => {
	const key = await importPrivateKey({ ...privateJwk, alg: 'RS256', use: 'sig', key_ops: ['sign'], ext: false });
	const signature = await genSignature(key, 'JWK RSA');
	expect(verify('sha256', Buffer.from('JWK RSA'), rsa.publicKey, Buffer.from(signature, 'base64'))).toBe(true);
	const request = { method: 'GET', url: 'https://example.com/?jwk=1', headers: { Host: 'example.com', Date: new Date().toUTCString() } };
	await signAsDraftToRequest(request, { privateKeyJwk: privateJwk, keyId: 'jwk' }, ['(request-target)', 'host', 'date']);
	expect(await verifyParsedSignature(parseRequestSignature(request), new Map([['jwk', { ...publicJwk, alg: 'RS256' }]]))).toBe(true);
	const normalized = await parseAndImportPublicKey(publicJwk, ['verify'], 'rsa-v1_5-sha256');
	expect(await (await getWebcrypto()).subtle.verify(normalized.algorithm, normalized.publicKey, sign('sha256', Buffer.from('native'), rsa.privateKey), new TextEncoder().encode('native'))).toBe(true);
});

test.each([
	['wrong alg', { alg: 'PS512' }], ['unknown alg', { alg: 'PS256' }], ['wrong use', { use: 'enc' }],
	['wrong key_ops', { key_ops: ['sign'] }], ['duplicate key_ops', { key_ops: ['verify', 'verify'] }],
	['private d', { d: privateJwk.d }], ['private CRT', { qi: privateJwk.qi }], ['secret', { k: 'AAAA' }],
])('rejects public JWK %s', async (_, changes) => {
	await expect(parseAndImportPublicKey({ ...publicJwk, ...changes }, ['verify'], 'rsa-v1_5-sha256')).rejects.toThrow();
});

test('honors ext and rejects public JWK for private import', async () => {
	await expect(importPublicJwk({ ...publicJwk, ext: false }, ['verify'], undefined, true)).rejects.toThrow();
	const key = await importPublicKey({ ...publicJwk, ext: false });
	expect(key.extractable).toBe(false);
	await expect(importPrivateJwk(publicJwk)).rejects.toThrow();
	await expect(importPrivateJwk({ ...privateJwk, key_ops: ['verify'] })).rejects.toThrow();
	await expect(importPublicJwk({ kty: 'oct', k: 'AAAA', alg: 'HS256' })).rejects.toThrow();
});

test.each([['P-256', 'ES256', 'SHA-256'], ['P-384', 'ES384', 'SHA-384']])('RFC signing and verification with %s JWK', async (namedCurve, alg, hash) => {
	const crypto = await getWebcrypto();
	const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve }, true, ['sign', 'verify']);
	const pub = { ...await crypto.subtle.exportKey('jwk', pair.publicKey), alg };
	const priv = { ...await crypto.subtle.exportKey('jwk', pair.privateKey), alg };
	const request = { method: 'POST', url: 'https://example.com/inbox?jwk=1', headers: { Host: 'example.com' } };
	await signAsRFC9421ToRequestOrResponse(request, { jwk: { key: { keyId: 'jwk', privateKeyJwk: priv }, defaults: { hash: hash as 'SHA-256' | 'SHA-384', ec: 'DSA' }, identifiers: ['@method', '@target-uri'] } });
	expect(await verifyParsedSignature(parseRequestSignature(request), pub)).toBe(true);
	await expect(parseAndImportPublicKey({ ...pub, alg: 'ES512' })).rejects.toThrow();
	await expect(parseAndImportPublicKey({ ...pub, alg: namedCurve === 'P-256' ? 'ES384' : 'ES256' }, ['verify'])).rejects.toThrow();
});

test.each([['RS384', 'SHA-384'], ['RS512', 'SHA-512']])('draft %s derives omitted hash and rejects conflicting defaults', async (alg, hash) => {
	const request = { method: 'GET', url: 'https://example.com/jwk', headers: { Host: 'example.com' } };
	const key = { keyId: 'jwk', privateKeyJwk: { ...privateJwk, alg } };
	const result = await signAsDraftToRequest(request, key, ['(request-target)', 'host']);
	expect(result.signatureHeader).toContain(`algorithm="rsa-${hash.replace('-', '').toLowerCase()}"`);
	expect(await verifyParsedSignature(parseRequestSignature(request), { ...publicJwk, alg })).toBe(true);
	await expect(signAsDraftToRequest(request, key, ['host'], { hash: 'SHA-256', ec: 'DSA' })).rejects.toThrow('conflict');
	await expect(signAsRFC9421ToRequestOrResponse(request, { jwk: { key, identifiers: ['@method'] } })).rejects.toThrow('unsupported');
});

test('ES384 draft/RFC and PS512 RFC derive omitted defaults and reject hash/mode overrides', async () => {
	const crypto = await getWebcrypto();
	const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, true, ['sign', 'verify']);
	for (const [priv, pub, alg] of [[await crypto.subtle.exportKey('jwk', pair.privateKey), await crypto.subtle.exportKey('jwk', pair.publicKey), 'ES384'], [privateJwk, publicJwk, 'PS512']] as const) {
		const request = { method: 'GET', url: 'https://example.com/jwk', headers: { Host: 'example.com' } };
		const key = { keyId: 'jwk', privateKeyJwk: { ...priv, alg } };
		await signAsRFC9421ToRequestOrResponse(request, { jwk: { key, identifiers: ['@method', '@target-uri'] } });
		expect(await verifyParsedSignature(parseRequestSignature(request), { ...pub, alg })).toBe(true);
		await expect(signAsRFC9421ToRequestOrResponse(request, { jwk: { key, defaults: { hash: 'SHA-256', ec: 'DSA' }, identifiers: ['@method'] } })).rejects.toThrow('conflict');
		if (alg === 'ES384') {
			const draftRequest = { method: 'GET', url: request.url, headers: { Host: 'example.com' } };
			await signAsDraftToRequest(draftRequest, key, ['(request-target)', 'host']);
			expect(await verifyParsedSignature(parseRequestSignature(draftRequest), { ...pub, alg })).toBe(true);
			await expect(signAsDraftToRequest(request, key, ['host'], { hash: 'SHA-256', ec: 'DSA' })).rejects.toThrow('conflict');
		} else {
			await expect(signAsRFC9421ToRequestOrResponse(request, { jwk: { key, defaults: { hash: 'SHA-512', ec: 'DSA', rsa: 'RSASSA-PKCS1-v1_5' }, identifiers: ['@method'] } })).rejects.toThrow('conflict');
			await expect(signAsDraftToRequest(request, key, ['host'])).rejects.toThrow('unsupported');
		}
	}
});
