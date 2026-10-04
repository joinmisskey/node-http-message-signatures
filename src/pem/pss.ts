import { genASN1Length } from '../utils.js';
import { derChildren, DerElement, derSequence, unsignedDerInteger } from './der.js';
import { rsaASN1AlgorithmIdentifier } from './pkcs1.js';

const sha512Oid = [0x60, 0x86, 0x48, 1, 0x65, 3, 4, 2, 3];
const mgf1Oid = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 1, 1, 8];

function matchesOid(element: DerElement, expected: number[]) {
	return element.tag === 6 && element.content.length === expected.length && element.content.every((byte, i) => byte === expected[i]);
}

function hash512(element: DerElement) {
	if (element.tag !== 0x30) throw new Error('Invalid PSS hash identifier');
	const parts = derChildren(element.content);
	if (parts.length < 1 || parts.length > 2 || !matchesOid(parts[0], sha512Oid) || (parts[1] && (parts[1].tag !== 5 || parts[1].content.length))) {
		throw new Error('RSA-PSS requires SHA-512');
	}
}

/** Validate restricted key parameters for the RFC 9421 operation before normalization. */
export function validateRfc9421PssParameters(identifier: DerElement): void {
	const parts = derSequence(identifier.encoded);
	if (parts.length === 1) return; // Absent key parameters impose no restrictions (RFC 4055).
	if (parts.length !== 2 || parts[1].tag !== 0x30) throw new Error('Invalid RSA-PSS parameters');
	let hash = false;
	let mgf = false;
	let saltLength = 20;
	let lastTag = -1;
	for (const field of derChildren(parts[1].content)) {
		if (field.tag < 0xa0 || field.tag > 0xa3 || field.tag <= lastTag) throw new Error('Invalid RSA-PSS parameter field');
		lastTag = field.tag;
		const values = derChildren(field.content);
		if (values.length !== 1) throw new Error('Invalid explicit RSA-PSS field');
		if (field.tag === 0xa0) { hash512(values[0]); hash = true; }
		if (field.tag === 0xa1) {
			const mgfParts = derSequence(values[0].encoded);
			if (mgfParts.length !== 2 || !matchesOid(mgfParts[0], mgf1Oid)) throw new Error('RSA-PSS requires MGF1');
			hash512(mgfParts[1]); mgf = true;
		}
		if (field.tag === 0xa2 || field.tag === 0xa3) {
			const integer = unsignedDerInteger(values[0], true);
			if (integer.length > 2) throw new Error('Unsupported RSA-PSS integer parameter');
			const value = integer.reduce((total, byte) => total * 256 + byte, 0);
			if (field.tag === 0xa2) saltLength = value;
			else if (value !== 1) throw new Error('Unsupported RSA-PSS trailer');
		}
	}
	// Omitted hash/MGF fields mean SHA-1, which conflicts with RFC 9421.
	if (!hash || !mgf || saltLength > 64) throw new Error('RSA-PSS key restrictions conflict with RFC 9421');
}
/** Native WebCrypto accepts rsaEncryption containers; validate PSS restrictions first. */
export function normalizePssContainer(data: Uint8Array, identifierIndex: number): ArrayBuffer {
	const fields = derSequence(data);
	validateRfc9421PssParameters(fields[identifierIndex]);
	const content = fields.flatMap((field, i) => Array.from(i === identifierIndex ? rsaASN1AlgorithmIdentifier : field.encoded));
	return Uint8Array.from([0x30, ...genASN1Length(content.length), ...content]).buffer;
}
