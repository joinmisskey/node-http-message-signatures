import { ASN1 } from '@lapo/asn1js';
import { asn1ToArrayBuffer, decodePem } from './spki.js';
import { genASN1Length } from '../utils.js';
import { derSequence, unsignedDerInteger } from './der.js';

export class Pkcs1ParseError extends Error {
	constructor(message: string) { super(message); }
}

/**
 * Parse PKCS#1 public key
 */
export function parsePkcs1(input: ASN1.StreamOrBinary) {
	const parsed = ASN1.decode(decodePem(input));
	if (!parsed.sub || parsed.sub.length !== 2) throw new Pkcs1ParseError('Invalid SPKI (invalid sub length)');
	const modulus = parsed.sub[0];
	const publicExponent = parsed.sub[1];
	if (!modulus || modulus.tag.tagNumber !== 0x02) throw new Pkcs1ParseError('Invalid SPKI (invalid modulus)');
	if (!publicExponent || publicExponent.tag.tagNumber !== 0x02) throw new Pkcs1ParseError('Invalid SPKI (invalid publicExponent)');

	return {
		pkcs1: asn1ToArrayBuffer(parsed),
		modulus: (asn1ToArrayBuffer(modulus, true).byteLength - 1) * 8,
		publicExponent: parseInt(publicExponent.content() || '0'),
	};
}

// 15 bytes
export const rsaASN1AlgorithmIdentifier = Uint8Array.from([
	0x30, 13,
		0x06, 9,
			42, 134, 72, 134, 247, 13, 1, 1, 1, // 1.2.840.113549.1.1.1
		0x05, 0,
]);

/**
 * Generate SPKI public key from PKCS#1 public key
 * as RSASSA-PKCS1-v1_5
 * @param input PKCS#1 public key
 * @returns SPKI public key DER
 */
export function genSpkiFromPkcs1(input: ASN1.StreamOrBinary): Uint8Array {
	const { pkcs1 } = parsePkcs1(input);
	const pkcsLength = genASN1Length(pkcs1.byteLength + 1);
	const rootContent = Uint8Array.from([
		...rsaASN1AlgorithmIdentifier,
		0x03, ...pkcsLength, // BIT STRING
			0x00, ...(new Uint8Array(pkcs1)),
	]);
	return Uint8Array.from([
		0x30, ...genASN1Length(rootContent.length), // SEQUENCE
			...rootContent,
	]);
}

/** Parse an unencrypted, two-prime RSA private key (RFC 8017 Appendix A.1.2). */
export function parsePkcs1PrivateKey(input: ASN1.StreamOrBinary): { pkcs1: ArrayBuffer } {
	try {
		if (typeof input === 'string' && /ENCRYPTED|Proc-Type:|DEK-Info:/.test(input)) throw new Error('Encrypted private keys are unsupported');
		const decoded = decodePem(input);
		const data = typeof decoded === 'object' && 'enc' in decoded ? decoded.enc : decoded;
		const bytes = typeof data === 'string' ? Uint8Array.from(data, char => char.charCodeAt(0))
			: data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data as number[]);
		const fields = derSequence(bytes);
		if (fields.length !== 9) throw new Error('Expected nine two-prime RSA fields');
		const version = unsignedDerInteger(fields[0], true);
		if (version.length !== 1 || version[0] !== 0) throw new Error('Only two-prime version 0 is supported');
		for (const field of fields.slice(1)) unsignedDerInteger(field);
		return { pkcs1: new Uint8Array(bytes).buffer };
	} catch (error) {
		throw new Pkcs1ParseError(`Invalid PKCS#1 private key: ${(error as Error).message}`);
	}
}

/** Wrap a validated two-prime PKCS#1 private key in an unencrypted PKCS#8 container. */
export function genPkcs8FromPkcs1(input: ASN1.StreamOrBinary): Uint8Array {
	const { pkcs1 } = parsePkcs1PrivateKey(input);
	const content = Uint8Array.from([
		2, 1, 0, ...rsaASN1AlgorithmIdentifier,
		4, ...genASN1Length(pkcs1.byteLength), ...new Uint8Array(pkcs1),
	]);
	return Uint8Array.from([0x30, ...genASN1Length(content.length), ...content]);
}
