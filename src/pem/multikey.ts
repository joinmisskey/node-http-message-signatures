import { derSequence, unsignedDerInteger } from './der.js';
import { genSpkiFromPkcs1 } from './pkcs1.js';

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
/** Bounded public Multikey decoding: z/base58btc Ed25519 or PKCS#1 RSA. */
export function decodePublicMultikey(input: string): Uint8Array {
	if (!input.startsWith('z') || input.length < 2 || input.length > 8192) throw new Error('Invalid or oversized public Multikey');
	let value = 0n;
	for (const char of input.slice(1)) {
		const digit = alphabet.indexOf(char);
		if (digit < 0) throw new Error('Invalid base58btc character');
		value = value * 58n + BigInt(digit);
	}
	const bytes: number[] = [];
	while (value) { bytes.push(Number(value & 255n)); value >>= 8n; }
	bytes.reverse();
	let leadingZeroes = 0;
	for (const char of input.slice(1)) { if (char !== '1') break; leadingZeroes++; }
	const decoded = Uint8Array.from([...new Array(leadingZeroes).fill(0), ...bytes]);
	// Only canonical two-byte multicodec varints for our explicitly supported codecs.
	if (decoded[0] === 0xed && decoded[1] === 1) {
		if (decoded.length !== 34) throw new Error('Ed25519 Multikey requires 32 public bytes');
		return Uint8Array.from([0x30, 42, 0x30, 5, 6, 3, 0x2b, 0x65, 0x70, 3, 33, 0, ...decoded.subarray(2)]);
	}
	if (decoded[0] === 0x85 && decoded[1] === 0x24) {
		const key = decoded.subarray(2);
		if (key.length > 4096) throw new Error('RSA Multikey exceeds size limit');
		const fields = derSequence(key);
		if (fields.length !== 2) throw new Error('RSA Multikey requires a PKCS#1 public key');
		for (const field of fields) unsignedDerInteger(field);
		return genSpkiFromPkcs1(key);
	}
	throw new Error('Unsupported or secret Multikey codec');
}
