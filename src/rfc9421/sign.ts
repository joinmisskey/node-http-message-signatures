import * as sh from 'structured-headers';
import { type SignInfoDefaults, setHeaderToRequestOrResponse, getMap } from '../utils.js';
import { prepareSigningKey } from '../shared/backend.js';
import { encodeArrayBufferToBase64 } from '../utils.js';
import { RFC9421SignatureBaseFactory, convertSignatureParamsDictionary } from './base.js';
import { SFVHeaderTypeDictionary } from './sfv.js';
import type { IncomingRequest, MapLikeObj, OutgoingResponse, PrivateKey, CustomSigningKey, SignatureSigner, SFVSignatureParamsForInput, SignatureHashAlgorithmUpperSnake } from '../types.js';

export type RFC9421SignSource = {
	key: PrivateKey | CustomSigningKey;
	signer?: SignatureSigner;
	defaults?: SignInfoDefaults;
	/**
	 * @examples
	 *	```
	 *	[
	 *		'@method',
	 *		[
	 *			'@query-param',
	 *			{ name: 'foo' },
	 *		],
	 *	]
	 *	```
	 */
	identifiers: SFVSignatureParamsForInput[0];
	/**
	 * seconds, unix time
	 * @default `Math.round(Date.now() / 1000)`
	 */
	created?: number;
	/**
	 * seconds from `created`
	 * @default (not set, no expiration)
	 */
	expiresAfter?: number;
	/**
	 * TODO
	 */
	nonce?: string;
	/**
	 * tag
	 */
	tag?: string;
};

/**
 * Get the algorithm string for RFC 9421 encoding
 * https://datatracker.ietf.org/doc/html/rfc9421#name-http-signature-algorithms-r
 * @param keyAlgorithm Comes from `privateKey.algorithm.name` e.g. 'RSASSA-PKCS1-v1_5'
 * @param hashAlgorithm e.g. 'SHA-256'
 * @returns string e.g. 'rsa-v1_5-sha256'
 */
export function getRFC9421AlgoString(keyAlgorithm: CryptoKey['algorithm'], hashAlgorithm: SignatureHashAlgorithmUpperSnake) {
	if (typeof keyAlgorithm === 'string') {
		keyAlgorithm = { name: keyAlgorithm };
	}

	if (keyAlgorithm.name === 'RSA-PSS') {
		if (hashAlgorithm !== 'SHA-512' || (keyAlgorithm as RsaHashedKeyAlgorithm).hash.name !== 'SHA-512') throw new Error('RFC 9421 RSA-PSS requires SHA-512');
		return 'rsa-pss-sha512';
	}
	if (keyAlgorithm.name === 'RSASSA-PKCS1-v1_5') {
		if (hashAlgorithm === 'SHA-256') return 'rsa-v1_5-sha256';
		if (hashAlgorithm === 'SHA-512') return 'rsa-v1_5-sha512';
		throw new Error(`unsupported hash(RSASSA-PKCS1-v1_5): ${hashAlgorithm}`);
	}
	if (keyAlgorithm.name === 'ECDSA') {
		if ((keyAlgorithm as EcKeyAlgorithm).namedCurve === 'P-256' && hashAlgorithm === 'SHA-256') {
			return 'ecdsa-p256-sha256';
		}
		if ((keyAlgorithm as EcKeyAlgorithm).namedCurve === 'P-384' && hashAlgorithm === 'SHA-384') {
			return 'ecdsa-p384-sha384';
		}
		throw new Error(`unsupported curve(${(keyAlgorithm as any).namedCurve}) or hash(${hashAlgorithm})`);
	}
	if (keyAlgorithm.name === 'Ed25519') {
		return 'ed25519'; // Joyent/@peertube/http-signatureではこう指定する必要がある
	}
	throw new Error(`unsupported keyAlgorithm(${JSON.stringify(keyAlgorithm)}) or hash(${hashAlgorithm})`);
}

export function processSingleRFC9421SignSource(source: RFC9421SignSource & { key: PrivateKey }): Promise<{ key: CryptoKey; params: SFVSignatureParamsForInput }>;
export function processSingleRFC9421SignSource(source: RFC9421SignSource): Promise<{ key: CryptoKey | undefined; params: SFVSignatureParamsForInput }>;
export async function processSingleRFC9421SignSource(source: RFC9421SignSource) {
	const prepared = await prepareSigningKey('rfc9421', source.key, source.defaults, source.signer);
	const alg = prepared.wire;
	const created = source.created ?? Math.round(Date.now() / 1000);
	const expires = source.expiresAfter ? created + source.expiresAfter : undefined;

	return {
		key: prepared.key,
		params: [
			source.identifiers,
			{
				keyid: source.key.keyId,
				alg,
				created,
				expires,
				nonce: source.nonce,
				tag: source.tag,
			},
		] as SFVSignatureParamsForInput,
	};
}

/**
 *
 * @param request Request object to sign
 * @param sources MapLikeObj<label, RFC9421SiginingOptions>
 * @param signatureBaseOptions Options for RFC9421SignatureBaseFactory
 * @param opts
 * @returns result object
 */
export async function signAsRFC9421ToRequestOrResponse(
	request: IncomingRequest | OutgoingResponse,
	sources: MapLikeObj<string, RFC9421SignSource>,
	signatureBaseOptions: {
		// e.g. https
		scheme?: string;
		additionalSfvTypeDictionary?: SFVHeaderTypeDictionary;
		request?: Request;
		signer?: SignatureSigner;
	} = {
		scheme: 'https',
		additionalSfvTypeDictionary: {},
	},
) {
	const sourcesMap = getMap(sources) as Map<string, RFC9421SignSource>;
	const preparedKeys = new Map<string, Awaited<ReturnType<typeof prepareSigningKey>>>();
	const inputDictionary = new Map<string, SFVSignatureParamsForInput>();
	for (const [label, source] of sourcesMap) {
		const prepared = await prepareSigningKey('rfc9421', source.key, source.defaults, source.signer ?? ('signer' in source.key ? source.key.signer : signatureBaseOptions.signer));
		preparedKeys.set(label, prepared);
		const created = source.created ?? Math.round(Date.now() / 1000);
		const params: SFVSignatureParamsForInput = [source.identifiers, { keyid: source.key.keyId, alg: prepared.wire, created, ...(source.expiresAfter ? { expires: created + source.expiresAfter } : {}), ...(source.nonce !== undefined ? { nonce: source.nonce } : {}), ...(source.tag !== undefined ? { tag: source.tag } : {}) }];
		inputDictionary.set(label, params);
	}

	const inputHeader = convertSignatureParamsDictionary(inputDictionary);
	setHeaderToRequestOrResponse(request, 'Signature-Input', inputHeader);

	const factory = new RFC9421SignatureBaseFactory(
		request,
		signatureBaseOptions.scheme,
		signatureBaseOptions.additionalSfvTypeDictionary,
		signatureBaseOptions.request,
	);

	const signaturesEntries = (factory.isRequest() ? factory.requestSignatureInput : factory.responseSignatureInput!).keys();
	if (!signaturesEntries) throw new Error('signaturesEntries is undefined');

	const signatureDictionary = new Map<string, [sh.ByteSequence, Map<any, any>]>();
	const signatureBases = new Map<string, string>();
	for (const label of signaturesEntries) {
		const base = factory.generate(label);
		const prepared = preparedKeys.get(label);
		if (!prepared) throw new Error(`key not found: ${label}`);
		const bytes = await prepared.signer({ version: 'rfc9421', label, keyId: sourcesMap.get(label)!.key.keyId, algorithm: prepared.operation, signatureAlgorithm: prepared.wire, signingString: base, key: prepared.key });
		if (!(bytes instanceof Uint8Array)) throw new Error('Signer must return Uint8Array');
		signatureBases.set(label, base);
		signatureDictionary.set(label, [
			new sh.ByteSequence(
				encodeArrayBufferToBase64(new Uint8Array(bytes).buffer),
			),
			new Map(),
		]);
	}

	const signatureHeader = sh.serializeDictionary(signatureDictionary);
	setHeaderToRequestOrResponse(request, 'Signature', signatureHeader);

	return {
		inputHeader,
		signatureHeader,
		signatureDictionary,
		signatureBases,
	};
}
