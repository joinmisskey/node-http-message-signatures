import { base64 } from 'rfc4648';
import { parseAndImportPublicKey } from '../pem/spki.js';
import { parseSignInfo } from '../shared/verify.js';
import { isVerificationOptions, validateSignatureAlgorithm, operationWithoutKey, validateOperationKey, validateSignatureOperation, webCryptoVerifier } from '../shared/backend.js';
import { getDraftAlgoString } from './sign.js';
import type { ParsedDraftSignature, PublicKeySource, SignatureOperation, VerificationOptions } from '../types.js';
/** @deprecated Use parseSignInfo */
export const genSignInfoDraft = parseSignInfo;
export function verifyDraftSignature(parsed: ParsedDraftSignature['value'], options: VerificationOptions): Promise<boolean>;
export function verifyDraftSignature(parsed: ParsedDraftSignature['value'], key: PublicKeySource, errorLogger?: (message: any) => any): Promise<boolean>;
export async function verifyDraftSignature(parsed: ParsedDraftSignature['value'], keyOrOptions: PublicKeySource | VerificationOptions, errorLogger?: (message: any) => any): Promise<boolean> {
	const options: VerificationOptions = isVerificationOptions(keyOrOptions) ? keyOrOptions : { keys: keyOrOptions, logger: errorLogger };
	if (parsed.algorithm) {
		try { validateSignatureAlgorithm('draft', parsed.algorithm); } catch (error) { options.logger?.(error); return false; }
	}
	let candidates: (PublicKeySource | undefined)[];
	if (options.resolveKey) {
		const resolved = await options.resolveKey({ version: 'draft', keyId: parsed.keyId, algorithm: parsed.algorithm?.toLowerCase() });
		candidates = resolved === undefined ? [] : Array.isArray(resolved) ? [...resolved] : [resolved as PublicKeySource];
	} else if (options.keys instanceof Map) candidates = options.keys.has(parsed.keyId) ? [options.keys.get(parsed.keyId)] : [];
	else candidates = options.keys === undefined ? options.verifier && parsed.algorithm ? [undefined] : [] : [options.keys];
	for (const candidate of candidates) {
		let context;
		try {
			const key = candidate === undefined ? undefined : (await parseAndImportPublicKey(candidate, ['verify'], parsed.algorithm)).publicKey;
			const algorithm = key ? parseSignInfo(parsed.algorithm, key.algorithm) as SignatureOperation : operationWithoutKey('draft', parsed.algorithm!.toLowerCase());
			const signatureAlgorithm = parsed.algorithm?.toLowerCase() ?? getDraftAlgoString(key!.algorithm.name, 'hash' in algorithm ? algorithm.hash : null);
			validateSignatureOperation('draft', signatureAlgorithm, algorithm);
			if (key) validateOperationKey(key, algorithm, 'verify');
			context = { version: 'draft' as const, keyId: parsed.keyId, key, algorithm, signatureAlgorithm, signature: base64.parse(parsed.params.signature), signingString: parsed.signingString };
		} catch (error) { options.logger?.(error); continue; }
		if (options.verifier) return await options.verifier(context) === true;
		try { if (await webCryptoVerifier(context)) return true; options.logger?.('verification simply failed'); } catch (error) { options.logger?.(error); }
	}
	return false;
}
