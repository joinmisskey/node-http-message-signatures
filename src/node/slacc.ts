import { Buffer } from 'node:buffer';
import { createPrivateKey, createPublicKey, type KeyObject } from 'node:crypto';
import { decodePem } from '../pem/spki.js';
import { genPkcs8FromPkcs1, genSpkiFromPkcs1, parsePkcs1PrivateKey } from '../pem/pkcs1.js';
import { derSequence, readDer, unsignedDerInteger } from '../pem/der.js';
import { importPrivateKey } from '../pem/pkcs8.js';
import { webCryptoSigner, validateSignatureOperation } from '../shared/backend.js';
import type { CustomSigningKey, SignatureOperation, SignatureSignerContext, SignatureVerifier, SignatureVerifierContext } from '../types.js';

export type SlaccKeyInput = string | Uint8Array | ArrayBuffer;
export type SlaccAlgorithm = 'rsa-v1_5-sha256' | 'ed25519';
export type SlaccVersion = 'draft' | 'rfc9421';
type Callback<T> = (error: Error | null, result: T) => unknown;
export interface SlaccSignerHandle {
	readonly publicKey: Buffer;
	signRaw(payload: Buffer, callback: Callback<Buffer>): void;
}
export interface SlaccVerifierHandle {
	verifyRaw(signature: Buffer, payload: Buffer, callback: Callback<boolean>): void;
}
/** Inject the caller's slacc 0.2 binding. Initialization remains caller-owned. */
export interface SlaccBinding<Suite = string> {
	SignatureAlgorithmIdentifier: { Rsa2048_8192: Suite; Eddsa: Suite };
	Signer: { fromPkcs8Der(suite: Suite, der: Buffer): SlaccSignerHandle };
	Verifier: { fromSpkiDer(suite: Suite, der: Buffer): SlaccVerifierHandle };
}
/** slacc 0.1.5 has RSA signing only, with a distinct API. */
export interface LegacySlaccBinding {
	RsaKeyPair: { fromPem(pem: string): { sign(payload: Buffer, callback: Callback<Buffer>): void } };
}
export type SlaccSigningOptions = { keyId: string; version: SlaccVersion; algorithm: SlaccAlgorithm; privateKey: SlaccKeyInput };
export type SlaccVerifierOptions = { algorithm: SlaccAlgorithm; publicKey: SlaccKeyInput; version?: SlaccVersion };

function operation(algorithm: SlaccAlgorithm): SignatureOperation {
	if (algorithm === 'rsa-v1_5-sha256') return { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
	if (algorithm === 'ed25519') return { name: 'Ed25519' };
	throw new Error('Unsupported slacc signature algorithm');
}

function wire(version: SlaccVersion, algorithm: SlaccAlgorithm) {
	if (version !== 'draft' && version !== 'rfc9421') throw new Error('Unsupported signature version');
	return version === 'rfc9421' ? algorithm : algorithm === 'ed25519' ? 'ed25519-sha512' : 'rsa-sha256';
}

function bytes(input: SlaccKeyInput): Uint8Array {
	if (typeof input !== 'string' && !(input instanceof Uint8Array) && !(input instanceof ArrayBuffer)) throw new Error('slacc requires explicit PEM or DER; CryptoKey/JWK inputs are unsupported');
	if (typeof input === 'string' && /-----BEGIN ENCRYPTED|^Proc-Type:|^DEK-Info:/m.test(input)) throw new Error('Encrypted keys are unsupported');
	const decoded = decodePem(input);
	const raw = typeof decoded === 'object' && 'enc' in decoded ? decoded.enc : decoded;
	return typeof raw === 'string' ? Uint8Array.from(raw, char => char.charCodeAt(0)) : new Uint8Array(raw as ArrayBuffer);
}

function checkIdentifier(encoded: Uint8Array, algorithm: SlaccAlgorithm) {
	const fields = derSequence(encoded);
	const oid = algorithm === 'ed25519' ? [0x2b, 0x65, 0x70] : [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 1, 1, 1];
	if (!fields[0] || fields[0].tag !== 6 || !Buffer.from(fields[0].content).equals(Buffer.from(oid))) throw new Error('Key type conflicts with slacc algorithm');
	if (algorithm === 'ed25519' ? fields.length !== 1 : fields.length !== 1 && !(fields.length === 2 && fields[1].tag === 5 && fields[1].content.length === 0)) throw new Error('Unsupported key algorithm parameters');
}

function checkKey(key: KeyObject, algorithm: SlaccAlgorithm): number {
	if (key.asymmetricKeyType !== (algorithm === 'ed25519' ? 'ed25519' : 'rsa')) throw new Error('Key type conflicts with slacc algorithm');
	if (algorithm === 'ed25519') return 64;
	const bits = key.asymmetricKeyDetails?.modulusLength;
	if (!bits || bits < 2048 || bits > 8192) throw new Error('slacc RSA keys must be 2048–8192 bits');
	return Math.ceil(bits / 8);
}

function privateKey(input: SlaccKeyInput, algorithm: SlaccAlgorithm) {
	let der = bytes(input);
	let fields = derSequence(der);
	if (fields.length === 9 && fields.every(field => field.tag === 2)) {
		if (algorithm !== 'rsa-v1_5-sha256') throw new Error('PKCS#1 requires RSA');
		der = genPkcs8FromPkcs1(der);
		fields = derSequence(der);
	}
	if (fields.length !== 3 || fields[0].tag !== 2 || fields[0].content.length !== 1 || fields[0].content[0] !== 0 || fields[2].tag !== 4) throw new Error('Expected unencrypted version-0 PKCS#8 without attributes');
	checkIdentifier(fields[1].encoded, algorithm);
	if (algorithm === 'rsa-v1_5-sha256') parsePkcs1PrivateKey(fields[2].content);
	else {
		const seed = readDer(fields[2].content);
		if (seed.tag !== 4 || seed.content.length !== 32 || seed.end !== fields[2].content.length) throw new Error('Invalid Ed25519 PKCS#8 seed');
	}
	const key = createPrivateKey({ key: Buffer.from(der), format: 'der', type: 'pkcs8' });
	return { key, der: Buffer.from(der), signatureLength: checkKey(key, algorithm) };
}

function publicKey(input: SlaccKeyInput, algorithm: SlaccAlgorithm) {
	let der = bytes(input);
	let fields = derSequence(der);
	if (fields.length === 2 && fields.every(field => field.tag === 2)) {
		if (algorithm !== 'rsa-v1_5-sha256') throw new Error('PKCS#1 requires RSA');
		for (const field of fields) unsignedDerInteger(field);
		der = genSpkiFromPkcs1(der);
		fields = derSequence(der);
	}
	if (fields.length !== 2 || fields[1].tag !== 3 || fields[1].content[0] !== 0) throw new Error('Expected SPKI with an unpadded public key');
	checkIdentifier(fields[0].encoded, algorithm);
	const raw = fields[1].content.subarray(1);
	if (algorithm === 'ed25519' && raw.length !== 32) throw new Error('Invalid Ed25519 public key');
	if (algorithm === 'rsa-v1_5-sha256') {
		const rsa = derSequence(raw);
		if (rsa.length !== 2) throw new Error('Invalid RSA public key');
		for (const field of rsa) unsignedDerInteger(field);
	}
	const key = createPublicKey({ key: Buffer.from(der), format: 'der', type: 'spki' });
	return { der: Buffer.from(der), signatureLength: checkKey(key, algorithm) };
}

function suite<Suite>(binding: SlaccBinding<Suite>, algorithm: SlaccAlgorithm): Suite {
	const value = algorithm === 'ed25519' ? binding.SignatureAlgorithmIdentifier.Eddsa : binding.SignatureAlgorithmIdentifier.Rsa2048_8192;
	if (value !== (algorithm === 'ed25519' ? 'Eddsa' : 'Rsa2048_8192')) throw new Error('Unknown slacc suite');
	return value;
}

function invoke<T>(run: (callback: Callback<T>) => void, valid: (value: T) => boolean): Promise<T> {
	return new Promise((resolve, reject) => {
		let settled = false;
		const callback: Callback<T> = (error, result) => {
			if (settled) return;
			settled = true;
			if (error) reject(error);
			else if (!valid(result)) reject(new Error('Invalid slacc callback result'));
			else resolve(result);
		};
		try { run(callback); } catch (error) { if (!settled) { settled = true; reject(error); } }
	});
}

function checkContext(context: SignatureSignerContext | SignatureVerifierContext, algorithm: SlaccAlgorithm, version?: SlaccVersion) {
	if (context.key !== undefined) throw new Error('Fixed-key slacc adapters require a keyless context; route keys explicitly');
	if (version !== undefined && context.version !== version) throw new Error('Signature version conflicts with slacc adapter');
	const expected = operation(algorithm);
	wire(context.version, algorithm);
	validateSignatureOperation(context.version, context.signatureAlgorithm, context.algorithm);
	if (context.algorithm.name !== expected.name || ('hash' in expected && (!('hash' in context.algorithm) || context.algorithm.hash !== expected.hash))) throw new Error('Signature operation conflicts with slacc adapter');
}

/** Construct once and reuse; the native signer is bound to validated private-key bytes. */
export function createSlaccSigningKey<Suite>(binding: SlaccBinding<Suite>, options: SlaccSigningOptions): CustomSigningKey {
	const { keyId, version, algorithm: selection, privateKey: input } = options;
	const algorithm = operation(selection);
	const signatureAlgorithm = wire(version, selection);
	const parsed = privateKey(input, selection);
	const signatureLength = parsed.signatureLength;
	const handle = binding.Signer.fromPkcs8Der(suite(binding, selection), parsed.der);
	const publicPart = createPublicKey(parsed.key).export({ format: 'der', type: 'spki' });
	const expectedPublic = selection === 'ed25519' ? publicPart.subarray(publicPart.length - 32) : createPublicKey(parsed.key).export({ format: 'der', type: 'pkcs1' });
	if (!Buffer.isBuffer(handle.publicKey) || !handle.publicKey.equals(expectedPublic)) throw new Error('slacc signer handle conflicts with provided key');
	return { keyId, algorithm, signatureAlgorithm, signer: async context => {
		checkContext(context, selection, version);
		if (context.keyId !== keyId) throw new Error('Signer key ID conflicts with slacc adapter');
		return Uint8Array.from(await invoke(callback => handle.signRaw(Buffer.from(context.signingString, 'utf8'), callback), result => Buffer.isBuffer(result) && result.length === signatureLength));
	} };
}
/** Fixed trusted public key; callers own identity/label routing. Never ignores context.key. */
export function createSlaccVerifier<Suite>(binding: SlaccBinding<Suite>, options: SlaccVerifierOptions): SignatureVerifier {
	const { algorithm, version, publicKey: input } = options;
	operation(algorithm);
	if (version !== undefined) wire(version, algorithm);
	const parsed = publicKey(input, algorithm);
	const signatureLength = parsed.signatureLength;
	const handle = binding.Verifier.fromSpkiDer(suite(binding, algorithm), parsed.der);
	return async context => {
		checkContext(context, algorithm, version);
		if (context.signature.length !== signatureLength) return false;
		return invoke(callback => handle.verifyRaw(Buffer.from(context.signature), Buffer.from(context.signingString, 'utf8'), callback), result => typeof result === 'boolean');
	};
}
/** Explicit compatibility with slacc 0.1.5; only RSA-v1.5/SHA-256 signing is supported. */
export function createLegacySlaccRsaSigningKey(binding: LegacySlaccBinding, options: Omit<SlaccSigningOptions, 'algorithm'>): CustomSigningKey {
	const { keyId, version, privateKey: input } = options;
	const signatureAlgorithm = wire(version, 'rsa-v1_5-sha256');
	const parsed = privateKey(input, 'rsa-v1_5-sha256');
	const signatureLength = parsed.signatureLength;
	const handle = binding.RsaKeyPair.fromPem(parsed.key.export({ type: 'pkcs8', format: 'pem' }).toString());
	return { keyId, algorithm: operation('rsa-v1_5-sha256'), signatureAlgorithm, signer: async context => {
		checkContext(context, 'rsa-v1_5-sha256', version);
		if (context.keyId !== keyId) throw new Error('Signer key ID conflicts with slacc adapter');
		return Uint8Array.from(await invoke(callback => handle.sign(Buffer.from(context.signingString, 'utf8'), callback), result => Buffer.isBuffer(result) && result.length === signatureLength));
	} };
}

/** slacc 0.1.5 RSA signing plus WebCrypto Ed25519; construct once in the caller's cache. */
export async function createLegacySlaccWebCryptoSigningKey(binding: LegacySlaccBinding, options: Omit<SlaccSigningOptions, 'algorithm'>): Promise<CustomSigningKey> {
	const { keyId, version, privateKey: input } = options;
	// Determine the declared DER key type, then apply the same strict validation as native adapters.
	const fields = derSequence(bytes(input));
	let selection: SlaccAlgorithm;
	if (fields.length === 9 && fields.every(field => field.tag === 2)) selection = 'rsa-v1_5-sha256';
	else {
		if (fields.length !== 3) throw new Error('Expected unencrypted PKCS#8 or PKCS#1');
		const identifier = derSequence(fields[1].encoded);
		if (identifier[0]?.tag !== 6) throw new Error('Expected key algorithm OID');
		const oid = Buffer.from(identifier[0].content).toString('hex');
		if (oid === '2b6570') selection = 'ed25519';
		else if (oid === '2a864886f70d010101') selection = 'rsa-v1_5-sha256';
		else throw new Error('Legacy slacc/WebCrypto supports only RSA-v1.5/SHA-256 and Ed25519');
	}
	const signatureAlgorithm = wire(version, selection);
	const parsed = privateKey(input, selection);
	if (selection === 'rsa-v1_5-sha256') return createLegacySlaccRsaSigningKey(binding, { keyId, version, privateKey: parsed.der });
	const key = await importPrivateKey(parsed.der);
	return { keyId, algorithm: operation(selection), signatureAlgorithm, signer: async context => {
		checkContext(context, selection, version);
		if (context.keyId !== keyId) throw new Error('Signer key ID conflicts with slacc adapter');
		return webCryptoSigner({ ...context, key });
	} };
}
