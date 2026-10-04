import { type SignInfoDefaults, encodeArrayBufferToBase64 } from '../utils.js';
import { prepareSigningKey } from '../shared/backend.js';
import { genSignature } from '../shared/sign.js';
import { keyHashAlgosForDraftEncofing } from './const.js';
import { genDraftSigningString } from './string.js';
import type { CustomSigningKey, IncomingRequest, PrivateKey, SignatureHashAlgorithmUpperSnake, SignatureSigner } from '../types.js';

/**
 * Get the algorithm string for draft encoding
 * @param keyAlgorithm Comes from `privateKey.algorithm.name` e.g. 'RSASSA-PKCS1-v1_5'
 * @param hashAlgorithm e.g. 'SHA-256'
 * @returns string e.g. 'rsa-sha256'
 */
export function getDraftAlgoString(keyAlgorithm: string, hashAlgorithm: SignatureHashAlgorithmUpperSnake) {
	const verifyHash = () => {
		if (!hashAlgorithm) throw new Error('hash is required or must not be null');
		if (!(hashAlgorithm in keyHashAlgosForDraftEncofing)) throw new Error(`unsupported hash: ${hashAlgorithm}`);
	};
	if (keyAlgorithm === 'RSASSA-PKCS1-v1_5') {
		// https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
		verifyHash();
		return `rsa-${keyHashAlgosForDraftEncofing[hashAlgorithm!]}`;
	}
	if (keyAlgorithm === 'ECDSA') {
		// https://developer.mozilla.org/en-US/docs/Web/API/EcKeyGenParams
		verifyHash();
		return `ecdsa-${keyHashAlgosForDraftEncofing[hashAlgorithm!]}`;
	}
	if (keyAlgorithm === 'ECDH') {
		// https://developer.mozilla.org/en-US/docs/Web/API/EcKeyGenParams
		verifyHash();
		return `ecdh-${keyHashAlgosForDraftEncofing[hashAlgorithm!]}`;
	}
	if (keyAlgorithm === 'Ed25519') {
		return 'ed25519-sha512'; // Joyent/@peertube/http-signatureではこう指定する必要がある
	}
	if (keyAlgorithm === 'Ed448') {
		return 'ed448';
	}
	throw new Error('unsupported keyAlgorithm');
}

/**
 * @deprecated Use `genSignature`
 */
export const genDraftSignature = genSignature;

export function genDraftSignatureHeader(includeHeaders: string[], keyId: string, signature: string, algorithm: string) {
	return `keyId="${keyId}",algorithm="${algorithm}",headers="${includeHeaders.join(' ')}",signature="${signature}"`;
}

/**
 *
 * @param request Request object to sign
 * @param key Private key to sign
 * @param includeHeaders Headers to build the sigining string
 * @param opts
 * @returns result object
 */
export async function signAsDraftToRequest(request: IncomingRequest, key: PrivateKey | CustomSigningKey, includeHeaders: string[], opts?: SignInfoDefaults & { signer?: SignatureSigner }) {
	if (opts && (opts as any).hashAlgorithm) opts.hash = (opts as any).hashAlgorithm;
	const prepared = await prepareSigningKey('draft', key, opts, opts?.signer);
	const algoString = prepared.wire;

	const signingString = genDraftSigningString(request, includeHeaders, { keyId: key.keyId, algorithm: algoString });

	const bytes = await prepared.signer({ version: 'draft', keyId: key.keyId, algorithm: prepared.operation, signatureAlgorithm: algoString, signingString, key: prepared.key });
	if (!(bytes instanceof Uint8Array)) throw new Error('Signer must return Uint8Array');
	const signature = encodeArrayBufferToBase64(new Uint8Array(bytes).buffer);
	const signatureHeader = genDraftSignatureHeader(includeHeaders, key.keyId, signature, algoString);

	Object.assign(request.headers, {
		Signature: signatureHeader,
	});

	return {
		signingString,
		signature,
		signatureHeader,
	};
}
