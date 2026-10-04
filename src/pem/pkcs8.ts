import { normalizePssContainer } from './pss.js';
import { genPkcs8FromPkcs1 } from './pkcs1.js';
import { ASN1 } from '@lapo/asn1js';
import { ParsedAlgorithmIdentifierBase, asn1ToArrayBuffer, decodePem, parseAlgorithmIdentifier } from './spki.js';
import { SignInfoDefaults, defaultSignInfoDefaults, genSignInfo, getWebcrypto } from '../utils.js';

export class Pkcs8ParseError extends Error {
	constructor(message: string) { super(message); }
}

export type ParsedPkcs8 = ParsedAlgorithmIdentifierBase & {
	/**
	 * DER
	 */
	der: ArrayBuffer;

	attributesRaw: ArrayBuffer | null;
};

/**
 * Parse PKCS#8 private key
 *
 * PrivateKeyInfo ::= SEQUENCE {
 *	version Version,
 *	privateKeyAlgorithm AlgorithmIdentifier {{PrivateKeyAlgorithms}},
 *	privateKey PrivateKey,
 *	attributes [0] Attributes OPTIONAL }
 *
 * PrivateKey ::= OCTET STRING
 * Version ::= INTEGER
 * Attributes ::= SET OF Attribute
 * @param input
 * @returns
 */
export function parsePkcs8(input: ASN1.StreamOrBinary): ParsedPkcs8 {
	const parsed = ASN1.decode(decodePem(input));
	if (!parsed.sub || parsed.sub.length < 3 || parsed.sub.length > 4) throw new Pkcs8ParseError('Invalid PKCS#8 (invalid sub length)');
	const version = parsed.sub[0];
	if (!version || !version.tag || version.tag.tagNumber !== 0x02) throw new Pkcs8ParseError('Invalid PKCS#8 (invalid version)');
	const privateKeyAlgorithm = parseAlgorithmIdentifier(parsed.sub[1]);
	if (privateKeyAlgorithm.algorithm.split('\n')[0] === '1.2.840.113549.1.1.10' && parsed.posEnd() !== parsed.stream.enc.length) throw new Pkcs8ParseError('Trailing PSS key data');
	const privateKey = parsed.sub[2];
	if (!privateKey || !privateKey.tag || privateKey.tag.tagNumber !== 0x04) throw new Pkcs8ParseError('Invalid PKCS#8 (invalid privateKey)');
	const attributes = parsed.sub[3];
	if (attributes) {
		if (attributes.tag.tagNumber !== 0x31) throw new Pkcs8ParseError('Invalid PKCS#8 (invalid attributes)');
	}

	return {
		der: privateKeyAlgorithm.algorithm.split('\n')[0] === '1.2.840.113549.1.1.10'
			? normalizePssContainer(new Uint8Array(asn1ToArrayBuffer(parsed)), 1) : asn1ToArrayBuffer(parsed),
		...privateKeyAlgorithm,
		attributesRaw: attributes ? asn1ToArrayBuffer(attributes) : null,
	};
}
/**
 * Parse private key and run `crypto.subtle.importKey`
 * (supports unencrypted PKCS#8 and two-prime PKCS#1 RSA)
 * @param key string or ArrayBuffer
 * @param keyUsages e.g. ['verify']
 * @param defaults
 * @returns CryptoKey
 */
export async function importPrivateKey(key: ASN1.StreamOrBinary, keyUsages: KeyUsage[] = ['sign'], defaults: SignInfoDefaults = defaultSignInfoDefaults, extractable = false) {
	let parsedPrivateKey: ParsedPkcs8;
	try {
		parsedPrivateKey = parsePkcs8(key);
	} catch {
		parsedPrivateKey = parsePkcs8(genPkcs8FromPkcs1(key));
	}
	const importParams = genSignInfo(parsedPrivateKey, defaults);
	return await (await getWebcrypto()).subtle.importKey('pkcs8', parsedPrivateKey.der, importParams, extractable, keyUsages);
}
