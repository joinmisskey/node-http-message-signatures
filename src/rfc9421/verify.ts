import { base64 } from 'rfc4648';
import { ParsedRFC9421Signature, PublicKeySource, RFC9421SignatureAlgorithm, SignatureOperation, VerificationOptions } from '../types.js';
import { parseAndImportPublicKey } from '../pem/spki.js';
import { parseSignInfo } from '../shared/verify.js';
import { isVerificationOptions, validateSignatureAlgorithm, operationWithoutKey, validateOperationKey, validateSignatureOperation, webCryptoVerifier } from '../shared/backend.js';
import { getRFC9421AlgoString } from './sign.js';

const algorithmsDefault = ['ed25519', 'rsa-pss-sha512', 'ecdsa-p384-sha384', 'ecdsa-p256-sha256', 'hmac-sha256', 'rsa-v1_5-sha256'] satisfies RFC9421SignatureAlgorithm[];
export type RFC9421VerificationOptions = VerificationOptions & { verifyAll?: boolean; algorithms?: RFC9421SignatureAlgorithm[] };
/** Verify parsed signatures. A resolver is authoritative; label precedes keyid in legacy maps. */
export function verifyRFC9421Signature(parsedEntries: ParsedRFC9421Signature['value'], options: RFC9421VerificationOptions): Promise<boolean>;
export function verifyRFC9421Signature(parsedEntries: ParsedRFC9421Signature['value'], keys: PublicKeySource | Map<string, PublicKeySource>, options?: { verifyAll: boolean; algorithms?: RFC9421SignatureAlgorithm[] }, errorLogger?: (message: any) => any): Promise<boolean>;
export async function verifyRFC9421Signature(
	parsedEntries: ParsedRFC9421Signature['value'],
	keysOrOptions: PublicKeySource | Map<string, PublicKeySource> | RFC9421VerificationOptions,
	options?: { verifyAll: boolean; algorithms?: RFC9421SignatureAlgorithm[] },
	errorLogger?: (message: any) => any,
): Promise<boolean> {
	const settings: RFC9421VerificationOptions = isVerificationOptions(keysOrOptions) ? keysOrOptions : { ...options, keys: keysOrOptions, logger: errorLogger };
	const keys = settings.keys;
	const verifyAll = settings.verifyAll ?? false;
	const logger = settings.logger;
	if (parsedEntries.length === 0) throw new Error('parsedEntries is empty');
	if (verifyAll && !(keys instanceof Map) && !settings.resolveKey && !settings.verifier && parsedEntries.length > 1) throw new Error('If you want to verify multiple signatures, you need to use Map as the keys');
	const algorithms = settings.algorithms?.map(x => x.toLowerCase()) ?? algorithmsDefault;
	if (algorithms.length === 0) throw new Error('algorithms is empty');
	const toVerify = parsedEntries.filter(([, parsed]) => !parsed.algorithm || algorithms.includes(parsed.algorithm.toLowerCase() as RFC9421SignatureAlgorithm));
	if (!toVerify.length) { logger?.('No matched signature found'); return false; }
	if (!verifyAll) toVerify.sort(([, a], [, b]) => algorithms.indexOf(a.algorithm?.toLowerCase() as RFC9421SignatureAlgorithm) - algorithms.indexOf(b.algorithm?.toLowerCase() as RFC9421SignatureAlgorithm));
	for (const [label, parsed] of toVerify) {
		const wire = parsed.algorithm?.toLowerCase();
		if (wire) {
			try { validateSignatureAlgorithm('rfc9421', wire); } catch (error) { logger?.(error); if (verifyAll) return false; continue; }
		}
		let candidates: (PublicKeySource | undefined)[];
		if (settings.resolveKey) {
			const resolved = await settings.resolveKey({ version: 'rfc9421', label, keyId: parsed.keyid, algorithm: wire });
			candidates = resolved === undefined ? [] : Array.isArray(resolved) ? [...resolved] : [resolved as PublicKeySource];
		} else if (keys instanceof Map) {
			candidates = keys.has(label) ? [keys.get(label)] : parsed.keyid !== undefined ? keys.has(parsed.keyid) ? [keys.get(parsed.keyid)] : [] : wire ? [...keys.values()] : [];
		} else candidates = keys === undefined ? settings.verifier && wire ? [undefined] : [] : [keys];
		let verified = false;
		for (const candidate of candidates) {
			let key: CryptoKey | undefined;
			let operation: SignatureOperation;
			let signature: Uint8Array;
			let signatureAlgorithm: string;
			try {
				key = candidate === undefined ? undefined : (await parseAndImportPublicKey(candidate, ['verify'], wire)).publicKey;
				operation = key ? parseSignInfo(wire, key.algorithm) as SignatureOperation : operationWithoutKey('rfc9421', wire!);
				signatureAlgorithm = wire ?? getRFC9421AlgoString(key!.algorithm, 'hash' in operation ? operation.hash : null);
				validateSignatureOperation('rfc9421', signatureAlgorithm, operation);
				if (key) validateOperationKey(key, operation, 'verify');
				signature = base64.parse(parsed.signature);
			} catch (error) { logger?.(`Invalid candidate in ${label}: ${error}`); continue; }
			const context = { version: 'rfc9421' as const, label, keyId: parsed.keyid, key, algorithm: operation, signatureAlgorithm, signature, signingString: parsed.base };
			if (settings.verifier) {
				// Backend errors propagate. False ends this signature without another backend/key attempt.
				verified = await settings.verifier(context) === true;
				if (!verified) logger?.(`verification simply failed, label: ${label}`);
				break;
			}
			try { verified = await webCryptoVerifier(context); } catch (error) { logger?.(`Verification failed in ${label}: ${error}`); }
			if (!verified) logger?.(`verification simply failed, label: ${label}`);
			if (verified) break;
		}
		if (verifyAll && !verified) return false;
		if (!verifyAll && verified) return true;
	}
	return verifyAll;
}
