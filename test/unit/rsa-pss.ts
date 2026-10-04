import { generateKeyPairSync, sign, constants, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getPublicKeyAlgorithmNameFromOid, importPrivateKey, importPublicKey, parseAndImportPublicKey, verifyRFC9421Signature, signAsRFC9421ToRequestOrResponse, parseRequestSignature, genSignature, getWebcrypto } from '../../src/index.js';
const defaults = { hash: 'SHA-512', ec: 'DSA', rsa: 'RSA-PSS' } as const;
const vector = JSON.parse(readFileSync(new URL('../fixtures/rfc9421-pss.json', import.meta.url), 'utf8'));

test('verifies RFC 9421 Appendix B.2.1 supplied signature', async () => {
	expect(await verifyRFC9421Signature([['sig-b21', { base: vector.base, params: '', algorithm: 'rsa-pss-sha512', signature: vector.signature }]], vector.publicKey)).toBe(true);
});

test('imports RFC PSS-OID private key and interoperates with Node', async () => {
	const key = await importPrivateKey(vector.privateKey, ['sign'], defaults);
	const signature = await genSignature(key, vector.base, defaults);
	expect(verify('sha512', Buffer.from(vector.base), { key: vector.publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 64 }, Buffer.from(signature, 'base64'))).toBe(true);
});

test('signs PSS-OID PEM with explicit PSS mode and parses/verifies it', async () => {
	const request = { method: 'POST', url: 'https://example.com/p?q=1', headers: { Host: 'example.com' } };
	await signAsRFC9421ToRequestOrResponse(request, { pss: { key: { keyId: 'pss', privateKeyPem: vector.privateKey }, defaults, identifiers: ['@method', '@target-uri'] } });
	const parsed = parseRequestSignature(request);
	expect(parsed.version).toBe('rfc9421');
	if (parsed.version !== 'rfc9421') throw new Error('Unexpected format');
	expect(parsed.value[0][1].algorithm).toBe('rsa-pss-sha512');
	expect(await verifyRFC9421Signature(parsed.value, vector.publicKey)).toBe(true);
});

test.each([0, 32, 63, 65])('rejects signature with salt length %s', async saltLength => {
	const signature = sign('sha512', Buffer.from(vector.base), { key: vector.privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength });
	expect(await verifyRFC9421Signature([['pss', { base: vector.base, params: '', algorithm: 'rsa-pss-sha512', signature: signature.toString('base64') }]], vector.publicKey)).toBe(false);
});

test.each([
	['compatible restricted salt 64', 'sha512', 'sha512', 64, true],
	['compatible minimum salt 32', 'sha512', 'sha512', 32, true],
	['incompatible hash', 'sha256', 'sha512', 32, false],
	['incompatible MGF', 'sha512', 'sha256', 64, false],
	['excess minimum salt', 'sha512', 'sha512', 65, false],
])('%s validates restrictions for public and private containers', async (_, hashAlgorithm, mgf1HashAlgorithm, saltLength, accepted) => {
	const pair = generateKeyPairSync('rsa-pss', { modulusLength: 2048, hashAlgorithm: hashAlgorithm as string, mgf1HashAlgorithm: mgf1HashAlgorithm as string, saltLength: saltLength as number });
	const pub = pair.publicKey.export({ format: 'pem', type: 'spki' }).toString();
	const priv = pair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
	if (!accepted) {
		await expect(parseAndImportPublicKey(pub, ['verify'], 'rsa-pss-sha512')).rejects.toThrow();
		await expect(importPrivateKey(priv, ['sign'], defaults)).rejects.toThrow();
		return;
	}
	const imported = await importPrivateKey(priv, ['sign'], defaults);
	const signature = await genSignature(imported, 'restricted PSS', defaults);
	expect(await verifyRFC9421Signature([['pss', { base: 'restricted PSS', params: '', algorithm: 'rsa-pss-sha512', signature }]], pub)).toBe(true);
	await expect(parseAndImportPublicKey(pub, ['verify'], 'rsa-v1_5-sha256')).rejects.toThrow();
});

test('rejects OAEP OID and wrong imported CryptoKey hash', async () => {
	expect(getPublicKeyAlgorithmNameFromOid('1.2.840.113549.1.1.10')).toBe('RSA-PSS');
	expect(() => getPublicKeyAlgorithmNameFromOid('1.2.840.113549.1.1.7')).toThrow();
	const key = await (await getWebcrypto()).subtle.generateKey({ name: 'RSA-PSS', hash: 'SHA-256', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['sign', 'verify']);
	await expect(parseAndImportPublicKey(key.publicKey, ['verify'], 'rsa-pss-sha512')).rejects.toThrow();
	await expect(genSignature(key.privateKey, 'wrong hash', defaults)).rejects.toThrow();
	await expect(importPublicKey(vector.publicKey, ['verify'], { ...defaults, hash: 'SHA-256' })).rejects.toThrow();
});

test('rejects malformed/duplicate/defaulted restrictions and trailing container data', async () => {
	const { derSequence, derChildren } = await import('../../src/pem/der.js');
	const { genASN1Length } = await import('../../src/utils.js');
	const wrap = (tag: number, content: number[]) => new Uint8Array([tag, ...genASN1Length(content.length), ...content]);
	const pair = generateKeyPairSync('rsa-pss', { modulusLength: 2048, hashAlgorithm: 'sha512', mgf1HashAlgorithm: 'sha512', saltLength: 64 });
	const der = new Uint8Array(pair.publicKey.export({ type: 'spki', format: 'der' }));
	const root = derSequence(der);
	const identifier = derSequence(root[0].encoded);
	const fields = derChildren(identifier[1].content).map(field => Array.from(field.encoded));
	for (const parameters of [[], [...fields, fields[0]].flat(), [...fields, [0xa4, 3, 2, 1, 1]].flat(), [fields[0], fields[1], [0xa2, 3, 2, 1, 128]].flat(), [...fields, [0xa3, 3, 2, 1, 2]].flat()]) {
		const alg = wrap(0x30, [...identifier[0].encoded, ...wrap(0x30, parameters)]);
		const malformed = wrap(0x30, [...alg, ...root[1].encoded]);
		await expect(parseAndImportPublicKey(malformed, ['verify'], 'rsa-pss-sha512')).rejects.toThrow();
	}
	await expect(parseAndImportPublicKey(new Uint8Array([...der, 0]), ['verify'], 'rsa-pss-sha512')).rejects.toThrow();
});
