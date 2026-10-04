import { generateKeyPairSync, sign } from 'node:crypto';
import { decodePublicMultikey, getWebcrypto, importPublicKey, parseAndImportPublicKey, verifyRFC9421Signature } from '../../src/index.js';
function multibase(bytes: Uint8Array): string {
	let value = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
	let result = '';
	const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	while (value) { result = alphabet[Number(value % 58n)] + result; value /= 58n; }
	for (const byte of bytes) { if (byte !== 0) break; result = '1' + result; }
	return 'z' + result;
}

test.each(['ed25519', 'rsa'])('verifies %s public Multikey against independent Node signatures', async name => {
	const pair = name === 'rsa' ? generateKeyPairSync('rsa', { modulusLength: 2048 }) : generateKeyPairSync('ed25519');
	const native = new Uint8Array(pair.publicKey.export({ type: name === 'rsa' ? 'pkcs1' : 'spki', format: 'der' }));
	const key = name === 'rsa' ? multibase(new Uint8Array([0x85, 0x24, ...native])) : multibase(new Uint8Array([0xed, 1, ...native.slice(-32)]));
	const base = 'Multikey interoperability';
	const signature = sign(name === 'rsa' ? 'sha256' : null, Buffer.from(base), pair.privateKey).toString('base64');
	expect(await verifyRFC9421Signature([['key', { base, params: '', algorithm: name === 'rsa' ? 'rsa-v1_5-sha256' : 'ed25519', signature }]], key)).toBe(true);
	await expect(importPublicKey(key)).resolves.toHaveProperty('type', 'public');
	await expect(parseAndImportPublicKey(key, ['verify'], name === 'rsa' ? 'ed25519' : 'rsa-v1_5-sha256')).rejects.toThrow();
});

test('imports the W3C published Ed25519 Multikey example', async () => {
	const key = await importPublicKey('z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP', ['verify'], undefined, true);
	const jwk = await (await getWebcrypto()).subtle.exportKey('jwk', key);
	expect(key.algorithm.name).toBe('Ed25519');
	expect(jwk.x).toHaveLength(43);
});

test.each([
	['invalid character', 'z0'], ['empty', 'z'], ['oversized', 'z' + '1'.repeat(8192)],
	['short Ed25519', multibase(new Uint8Array([0xed, 1, ...new Uint8Array(31)]))],
	['long Ed25519', multibase(new Uint8Array([0xed, 1, ...new Uint8Array(33)]))],
	['secret codec', multibase(new Uint8Array([0x80, 0x26, ...new Uint8Array(32)]))],
	['unknown codec', multibase(new Uint8Array([0xaa, 1, ...new Uint8Array(32)]))],
	['noncanonical varint', multibase(new Uint8Array([0xed, 0x81, 0, ...new Uint8Array(32)]))],
	['RSA private material', multibase(new Uint8Array([0x85, 0x24, ...generateKeyPairSync('rsa', { modulusLength: 1024 }).privateKey.export({ type: 'pkcs1', format: 'der' })]))],
	['RSA trailing', multibase(new Uint8Array([0x85, 0x24, ...generateKeyPairSync('rsa', { modulusLength: 1024 }).publicKey.export({ type: 'pkcs1', format: 'der' }), 0]))],
])('rejects %s without PEM fallback', async (_, key) => {
	expect(() => decodePublicMultikey(key)).toThrow();
	await expect(importPublicKey(key)).rejects.toThrow();
});
