import type { PublicKeySource } from '../types.js';
import { ParsedRFC9421Signature, RFC9421SignatureAlgorithm } from "../types.js";
import { parseAndImportPublicKey } from "../pem/spki.js";
import { getWebcrypto } from "../utils.js";
import { base64 } from "rfc4648";
import { textEncoder } from "../const.js";

const algorithmsDefault = ['ed25519', 'rsa-pss-sha512', 'ecdsa-p384-sha384', 'ecdsa-p256-sha256', 'hmac-sha256', 'rsa-v1_5-sha256'] satisfies RFC9421SignatureAlgorithm[];

/**
 * Verify RFC 9421 signatures
 * All provided algorithms are verified. If you want to limit the algorithms, use options when parsing the signature.
 * @param parsedEntries ParsedRFC9421Signature['value'] (`[label, (obj)][]`)
 * @param keys a public key or Map of public keys
 * 		* If you want to verify multiple signatures, you need to use Map as the keys
 * 		* You can use keyid and label as the key of the Map (label takes precedence).
 * 		* Algorithm-only fallback is available only when no keyid or mapped label selects a key.
 * @param options: Options for multiple signatures verification
 * @param errorLogger: If you want to log errors, set function
 */
export async function verifyRFC9421Signature(
	parsedEntries: ParsedRFC9421Signature['value'],
	keys: PublicKeySource | Map<string, PublicKeySource>,
	options: {
		/**
		 * If you want all signatures to be verified, set true
		 */
		verifyAll: boolean;
		/**
		 * Specify signature algorithms you accept. (RFC 9421 algorithm registries)
		 *
		 * If `verifyAll: false`, it is also used to choose the hash algorithm to verify.
		 * (Younger index is preferred.)
		 */
		algorithms?: RFC9421SignatureAlgorithm[];
	} = {
		verifyAll: false,
		algorithms: algorithmsDefault,
	},
	errorLogger?: (message: any) => any
): Promise<boolean> {
	if (parsedEntries.length === 0) throw new Error('parsedEntries is empty');
	if (options.verifyAll === true && !(keys instanceof Map) && parsedEntries.length > 1) {
		throw new Error('If you want to verify multiple signatures, you need to use Map as the keys');
	}

	const algorithms = options?.algorithms?.map(x => x.toLowerCase()) ?? algorithmsDefault;
	if (algorithms.length === 0) throw new Error('algorithms is empty');

	const toVerify = parsedEntries.filter(([, parsed]) => {
		const alg = parsed.algorithm?.toLowerCase();
		return !alg || algorithms.includes(alg as RFC9421SignatureAlgorithm);
	});

	if (toVerify.length === 0) {
		if (errorLogger) errorLogger('No matched signature found');
		return false;
	}

	if (options.verifyAll === false) {
		toVerify.sort(([, a], [, b]) =>
			algorithms.indexOf(a.algorithm?.toLowerCase() as RFC9421SignatureAlgorithm) -
			algorithms.indexOf(b.algorithm?.toLowerCase() as RFC9421SignatureAlgorithm)
		);
	}

	for (const [label, parsed] of toVerify) {
		const alg = parsed.algorithm?.toLowerCase();
		let candidates: PublicKeySource[];
		if (!(keys instanceof Map)) {
			candidates = [keys];
		} else if (keys.has(label)) {
			candidates = [keys.get(label)!];
		} else if (parsed.keyid !== undefined) {
			// An explicit identity must never fall back to unrelated keys.
			candidates = keys.has(parsed.keyid) ? [keys.get(parsed.keyid)!] : [];
		} else {
			candidates = alg ? Array.from(keys.values()) : [];
		}

		let verified = false;
		for (const candidate of candidates) {
			try {
				// Import per signature and algorithm; defaults or another signature's
				// imported key must not determine the hash/curve used here.
				const { publicKey, algorithm } = await parseAndImportPublicKey(candidate, ['verify'], alg);
				const result = await (await getWebcrypto()).subtle.verify(
					algorithm, publicKey, base64.parse(parsed.signature), textEncoder.encode(parsed.base)
				);
				if (result === true) {
					verified = true;
					break;
				}
				if (errorLogger) errorLogger(`verification simply failed, label: ${label}`);
			} catch (e) {
				// A malformed/incompatible candidate does not invalidate alternatives.
				if (errorLogger) errorLogger(`Something happened in ${label}: ${e}`);
			}
		}

		if (options.verifyAll === true && !verified) {
			if (candidates.length === 0 && errorLogger) errorLogger(`key not found, label: ${label}, keyid: ${parsed.keyid}`);
			return false;
		}
		if (options.verifyAll === false && verified) return true;
	}

	return options.verifyAll === true;
}
