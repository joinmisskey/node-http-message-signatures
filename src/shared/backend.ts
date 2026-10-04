import { defaultSignInfoDefaults, getWebcrypto, SignInfoDefaults } from '../utils.js';
import { importPrivateKey } from '../pem/pkcs8.js';
import { getJwkSigningDefaults } from '../pem/jwk.js';
import { getDraftAlgoString } from '../draft/sign.js';
import { getRFC9421AlgoString } from '../rfc9421/sign.js';
import { textEncoder } from '../const.js';
import { parseSignInfo } from './verify.js';
import type { CustomSigningKey, PrivateKey, SignatureOperation, SignatureSigner, SignatureSignerContext, SignatureVerifierContext, VerificationOptions } from '../types.js';

export function isVerificationOptions(value: unknown): value is VerificationOptions {
	return !!value && typeof value === 'object' && !(value instanceof Map) && !('algorithm' in value) && !('kty' in value);
}

export function validateSignatureAlgorithm(version: 'draft' | 'rfc9421', wire: string) {
	const allowed = version === 'rfc9421' ? ['rsa-pss-sha512', 'rsa-v1_5-sha256', 'ecdsa-p256-sha256', 'ecdsa-p384-sha384', 'ed25519']
		: ['hs2019', 'rsa-sha1', 'rsa-sha256', 'rsa-sha384', 'rsa-sha512', 'ecdsa-sha1', 'ecdsa-sha256', 'ecdsa-sha384', 'ecdsa-sha512', 'ed25519-sha512', 'ed25519', 'ed448'];
	if (!allowed.includes(wire.toLowerCase())) throw new Error('Unsupported signature algorithm');
}

export function validateSignatureOperation(version: 'draft' | 'rfc9421', wire: string, operation: SignatureOperation): SignatureOperation {
	validateSignatureAlgorithm(version, wire);
	if (operation.name === 'RSA-PSS' && (operation.hash !== 'SHA-512' || operation.saltLength !== 64)) throw new Error('RFC 9421 PSS operation requires SHA-512 and saltLength 64');
	if (!['RSA-PSS', 'RSASSA-PKCS1-v1_5', 'ECDSA', 'Ed25519', 'Ed448'].includes(operation.name)) throw new Error('Unsupported signing operation');
	if ((operation.name === 'Ed25519' || operation.name === 'Ed448') && ('hash' in operation || 'saltLength' in operation)) throw new Error('EdDSA does not accept a prehash operation');
	const expected = parseSignInfo(wire, operation);
	if (expected.name !== operation.name || ('hash' in expected && (!('hash' in operation) || expected.hash !== operation.hash)) || ('namedCurve' in expected && (!('namedCurve' in operation) || expected.namedCurve !== operation.namedCurve))) throw new Error('Operation conflicts with wire algorithm');
	return expected as SignatureOperation;
}
export function operationWithoutKey(version: 'draft' | 'rfc9421', wire: string): SignatureOperation {
	validateSignatureAlgorithm(version, wire);
	if (wire === 'rsa-pss-sha512') return { name: 'RSA-PSS', hash: 'SHA-512', saltLength: 64 };
	if (wire === 'ecdsa-p256-sha256') return { name: 'ECDSA', hash: 'SHA-256', namedCurve: 'P-256' };
	if (wire === 'ecdsa-p384-sha384') return { name: 'ECDSA', hash: 'SHA-384', namedCurve: 'P-384' };
	if (wire === 'ed25519' || wire === 'ed25519-sha512') return { name: 'Ed25519' };
	if (wire === 'ed448') return { name: 'Ed448' };
	if (wire.startsWith('rsa-')) return parseSignInfo(wire, { name: 'RSASSA-PKCS1-v1_5' }) as SignatureOperation;
	throw new Error('Keyless verification requires an unambiguous signature algorithm');
}
/** Normalize the already validated import operation, preserving JWK hash metadata. */
export function operationFromImport(imported: Awaited<ReturnType<typeof import('../pem/spki.js').parseAndImportPublicKey>>): SignatureOperation {
	const raw = imported.algorithm;
	const rawHash = ('hash' in raw ? raw.hash : null) as string | { name: string } | null;
	const hash = typeof rawHash === 'object' && rawHash !== null ? rawHash.name : rawHash;
	if (raw.name === 'Ed25519' || raw.name === 'Ed448') return { name: raw.name };
	if (raw.name === 'RSASSA-PKCS1-v1_5') return { name: raw.name, hash } as SignatureOperation;
	if (raw.name === 'RSA-PSS') return { name: raw.name, hash, saltLength: 64 } as SignatureOperation;
	if (raw.name === 'ECDSA') return { name: raw.name, hash, namedCurve: (imported.publicKey.algorithm as EcKeyAlgorithm).namedCurve } as SignatureOperation;
	throw new Error('Unsupported imported signature operation');
}
export function validateOperationKey(key: CryptoKey, operation: SignatureOperation, usage: 'sign' | 'verify') {
	if (key.type !== (usage === 'sign' ? 'private' : 'public') || !key.usages.includes(usage) || key.algorithm.name !== operation.name) throw new Error('CryptoKey is incompatible with signature operation');
	if ('hash' in key.algorithm && (!('hash' in operation) || (key.algorithm as RsaHashedKeyAlgorithm).hash.name !== operation.hash)) throw new Error('CryptoKey hash conflicts with signature operation');
	if ('namedCurve' in key.algorithm && (!('namedCurve' in operation) || (key.algorithm as EcKeyAlgorithm).namedCurve !== operation.namedCurve)) throw new Error('CryptoKey curve conflicts with signature operation');
}
/** Stable default backend for callers routing only selected algorithms externally. */
export async function webCryptoSigner(context: SignatureSignerContext): Promise<Uint8Array> {
	validateSignatureOperation(context.version, context.signatureAlgorithm, context.algorithm);
	if (!context.key) throw new Error('WebCrypto signing requires a private key');
	validateOperationKey(context.key, context.algorithm, 'sign');
	return new Uint8Array(await (await getWebcrypto()).subtle.sign(context.algorithm, context.key, textEncoder.encode(context.signingString)));
}
export async function webCryptoVerifier(context: SignatureVerifierContext): Promise<boolean> {
	validateSignatureOperation(context.version, context.signatureAlgorithm, context.algorithm);
	if (!context.key) throw new Error('WebCrypto verification requires a public key');
	validateOperationKey(context.key, context.algorithm, 'verify');
	return (await getWebcrypto()).subtle.verify(context.algorithm, context.key, context.signature, textEncoder.encode(context.signingString));
}
export async function prepareSigningKey(version: 'draft' | 'rfc9421', source: PrivateKey | CustomSigningKey, defaults?: SignInfoDefaults, signer?: SignatureSigner) {
	if ('signatureAlgorithm' in source) {
		const operation = validateSignatureOperation(version, source.signatureAlgorithm, source.algorithm);
		if (defaults && 'hash' in operation && defaults.hash !== operation.hash) throw new Error('Signing defaults conflict with explicit operation');
		if (defaults?.rsa && defaults.rsa !== operation.name) throw new Error('Signing defaults conflict with explicit RSA mode');
		if (source.privateKey) validateOperationKey(source.privateKey, operation, 'sign');
		return { key: source.privateKey, operation, wire: source.signatureAlgorithm, signer: signer ?? source.signer };
	}
	const effective = 'privateKeyJwk' in source ? getJwkSigningDefaults(source.privateKeyJwk, defaults) : defaults ?? defaultSignInfoDefaults;
	const key = 'privateKey' in source ? source.privateKey : await importPrivateKey('privateKeyJwk' in source ? source.privateKeyJwk : source.privateKeyPem, ['sign'], effective);
	if (effective.rsa && (key.algorithm.name === 'RSA-PSS' || key.algorithm.name === 'RSASSA-PKCS1-v1_5') && effective.rsa !== key.algorithm.name) throw new Error('CryptoKey RSA mode conflicts with signing defaults');
	const wire = version === 'draft' ? getDraftAlgoString(key.algorithm.name, effective.hash) : getRFC9421AlgoString(key.algorithm, effective.hash);
	const operation = validateSignatureOperation(version, wire, parseSignInfo(wire, key.algorithm) as SignatureOperation);
	validateOperationKey(key, operation, 'sign');
	return { key, operation, wire, signer: signer ?? webCryptoSigner };
}
