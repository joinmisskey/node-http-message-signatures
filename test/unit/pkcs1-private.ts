import { generateKeyPairSync, createPrivateKey, sign, verify } from 'node:crypto';
import { decodePem, parsePkcs8, genPkcs8FromPkcs1, importPrivateKey, parsePkcs1PrivateKey, genSignature } from '../../src/index.js';
import { derSequence } from '../../src/pem/der.js';
import { genASN1Length } from '../../src/utils.js';

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const der = new Uint8Array(pair.privateKey.export({ type: 'pkcs1', format: 'der' }));
const pem = pair.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
const sequence = (content: number[]) => new Uint8Array([0x30, ...genASN1Length(content.length), ...content]);
const fields = derSequence(der).map(field => Array.from(field.encoded));

test.each([['PEM', pem], ['DER', der], ['offset view', new Uint8Array(new Uint8Array([99, ...der, 99]).buffer, 1, der.length)]])('imports PKCS#1 %s and signs interoperably', async (_, key) => {
	const imported = await importPrivateKey(key as string | Uint8Array);
	const signature = await genSignature(imported, 'PKCS#1 interop');
	expect(verify('sha256', Buffer.from('PKCS#1 interop'), pair.publicKey, Buffer.from(signature, 'base64'))).toBe(true);
	const wrapped = genPkcs8FromPkcs1(key as string | Uint8Array);
	const native = createPrivateKey({ key: Buffer.from(wrapped), format: 'der', type: 'pkcs8' });
	expect(verify('sha256', Buffer.from('wrapped'), pair.publicKey, sign('sha256', Buffer.from('wrapped'), native))).toBe(true);
});

test.each([
	['trailing', new Uint8Array([...der, 0])],
	['truncated', der.slice(0, -1)],
	['multiprime', sequence([[2, 1, 1], ...fields.slice(1)].flat())],
	['extra field', sequence([...fields, [2, 1, 1]].flat())],
	['missing field', sequence(fields.slice(0, -1).flat())],
	['negative', sequence([fields[0], [2, 1, 128], ...fields.slice(2)].flat())],
	['zero', sequence([fields[0], [2, 1, 0], ...fields.slice(2)].flat())],
	['nonminimal integer', sequence([fields[0], [2, 2, 0, 1], ...fields.slice(2)].flat())],
	['indefinite length', new Uint8Array([0x30, 0x80, ...der.slice(4), 0, 0])],
])('rejects %s', async (_, key) => {
	expect(() => parsePkcs1PrivateKey(key)).toThrow();
	await expect(importPrivateKey(key)).rejects.toThrow();
});

test('rejects encrypted PEM and encrypted PKCS#8', async () => {
	const encrypted = pair.privateKey.export({ type: 'pkcs1', format: 'pem', cipher: 'aes-256-cbc', passphrase: 'fixture-only' }).toString();
	await expect(importPrivateKey(encrypted)).rejects.toThrow();
	const encrypted8 = pair.privateKey.export({ type: 'pkcs8', format: 'der', cipher: 'aes-256-cbc', passphrase: 'fixture-only' });
	await expect(importPrivateKey(encrypted8)).rejects.toThrow();
});

test('bounds encoded and decoded inputs before generic ASN.1 parsing', async () => {
	const encoded = 'A'.repeat(4 * 1024 * 1024 + 1);
	const decoded = new Uint8Array(1024 * 1024 + 1);
	for (const oversized of [encoded, decoded, Buffer.from(decoded).toString('base64')]) {
		expect(() => decodePem(oversized)).toThrow(/limit/);
		expect(() => parsePkcs8(oversized)).toThrow(/limit/);
		await expect(importPrivateKey(oversized)).rejects.toThrow(/limit/);
	}
	expect(() => parsePkcs1PrivateKey(sequence(new Array(65).fill([2, 1, 1]).flat()))).toThrow('Too many DER fields');
});

test('normal PEM whitespace remains accepted', async () => {
	const whitespace = pem.replace(/\n/g, '\r\n').replace(/(.{64})\r\n/g, '$1  \t\r\n');
	await expect(importPrivateKey(whitespace)).resolves.toHaveProperty('type', 'private');
});
