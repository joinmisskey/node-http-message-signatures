import { parseSignInfo } from '../shared/verify.js';
import { defaultSignInfoDefaults, genAlgorithmForSignAndVerify, getWebcrypto, SignInfoDefaults } from '../utils.js';
import type { SignInfo } from '../types.js';

const jwkAlgorithms: Record<string, string> = {
	RS256: 'rsa-sha256', RS384: 'rsa-sha384', RS512: 'rsa-sha512', PS512: 'rsa-pss-sha512',
	ES256: 'ecdsa-p256-sha256', ES384: 'ecdsa-p384-sha384', ES512: 'ecdsa-sha512',
};
const privateMembers = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k'];

function operationForJwk(jwk: JsonWebKey, wire?: string, defaults: SignInfoDefaults = defaultSignInfoDefaults): SignInfo {
	let real: KeyAlgorithm;
	if (jwk.kty === 'RSA') real = { name: 'RSASSA-PKCS1-v1_5' };
	else if (jwk.kty === 'EC' && ['P-256', 'P-384', 'P-521'].includes(jwk.crv ?? '')) real = { name: 'ECDSA', namedCurve: jwk.crv } as EcKeyAlgorithm;
	else if (jwk.kty === 'OKP' && ['Ed25519', 'Ed448'].includes(jwk.crv ?? '')) real = { name: jwk.crv! };
	else throw new Error('Unsupported signature JWK key type or curve');
	let declared: string | undefined;
	if (jwk.alg !== undefined) {
		declared = jwk.alg === 'EdDSA' && jwk.kty === 'OKP' ? jwk.crv!.toLowerCase() : jwkAlgorithms[jwk.alg];
		if (!declared) throw new Error('Unsupported JWK alg');
		if (jwk.alg === 'ES512' && jwk.crv !== 'P-521') throw new Error('ES512 requires P-521');
	}
	const fallback = real.name === 'RSASSA-PKCS1-v1_5' ? defaults.rsa === 'RSA-PSS' ? 'rsa-pss-sha512' : `rsa-${defaults.hash?.replace('-', '').toLowerCase()}`
		: real.name === 'ECDSA' ? `ecdsa-${defaults.hash?.replace('-', '').toLowerCase()}` : real.name.toLowerCase();
	const operation = parseSignInfo(wire ?? declared ?? fallback, real);
	if (declared && JSON.stringify(parseSignInfo(declared, real)) !== JSON.stringify(operation)) throw new Error('JWK alg conflicts with requested signature algorithm');
	return operation;
}

/** Explicit local JWK import. Metadata is validated; no URLs or remote key sets are fetched. */
export async function importSignatureJwk(
	jwk: JsonWebKey,
	privateKey: boolean,
	keyUsages: KeyUsage[],
	defaults: SignInfoDefaults = defaultSignInfoDefaults,
	extractable = false,
	providedAlgorithm?: string,
) {
	if (!jwk || typeof jwk !== 'object' || Array.isArray(jwk)) throw new Error('Invalid JWK');
	if (jwk.use !== undefined && jwk.use !== 'sig') throw new Error('JWK use must be sig');
	if (jwk.ext !== undefined && typeof jwk.ext !== 'boolean') throw new Error('Invalid JWK ext');
	if (extractable && jwk.ext === false) throw new Error('Nonextractable JWK');
	const expectedUsage = privateKey ? 'sign' : 'verify';
	if (!keyUsages.length || keyUsages.some(usage => usage !== expectedUsage)) throw new Error('Invalid signature key usage');
	if (jwk.key_ops !== undefined && (!Array.isArray(jwk.key_ops) || new Set(jwk.key_ops).size !== jwk.key_ops.length || jwk.key_ops.some(usage => usage !== expectedUsage) || !jwk.key_ops.includes(expectedUsage))) throw new Error('JWK key_ops conflicts with requested usage');
	if (!privateKey && privateMembers.some(member => member in jwk)) throw new Error('Private or secret material in public JWK');
	if (privateKey && (typeof jwk.d !== 'string' || !jwk.d)) throw new Error('Missing JWK private key material');
	const operation = operationForJwk(jwk, providedAlgorithm, defaults);
	const key = await (await getWebcrypto()).subtle.importKey('jwk', jwk, operation, extractable, keyUsages);
	return { key, algorithm: genAlgorithmForSignAndVerify(key.algorithm, 'hash' in operation ? operation.hash : null) };
}

export async function importPublicJwk(jwk: JsonWebKey, keyUsages: KeyUsage[] = ['verify'], defaults: SignInfoDefaults = defaultSignInfoDefaults, extractable = false): Promise<CryptoKey> {
	return (await importSignatureJwk(jwk, false, keyUsages, defaults, extractable)).key;
}
export async function importPrivateJwk(jwk: JsonWebKey, keyUsages: KeyUsage[] = ['sign'], defaults: SignInfoDefaults = defaultSignInfoDefaults, extractable = false): Promise<CryptoKey> {
	return (await importSignatureJwk(jwk, true, keyUsages, defaults, extractable)).key;
}
