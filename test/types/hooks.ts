import { processSingleRFC9421SignSource, signAsDraftToRequest, signAsRFC9421ToRequestOrResponse, verifyParsedSignature, verifyDraftSignature, verifyRFC9421Signature, webCryptoSigner, webCryptoVerifier, SignatureOperation, SignatureSigner, CustomSigningKey, ParsedSignature, ParsedDraftSignature, ParsedRFC9421Signature, PrivateKey } from '../../dist/index.js';
declare const parsed: ParsedSignature;
declare const draft: ParsedDraftSignature;
declare const rfc: ParsedRFC9421Signature;
declare const publicKey: CryptoKey;
declare const privateKey: CryptoKey;
declare const oldSource: PrivateKey;
const signer: SignatureSigner = async context => {
	if (context.algorithm.name === 'ECDSA') context.algorithm.namedCurve satisfies string;
	if (context.algorithm.name === 'RSA-PSS') context.algorithm.saltLength satisfies 64;
	return webCryptoSigner(context);
};
const key: CustomSigningKey = { keyId: 'custom', signatureAlgorithm: 'rsa-v1_5-sha256', algorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, signer };
const request = { method: 'GET', url: 'https://example.com/', headers: { Host: 'example.com' } };
void signAsDraftToRequest(request, oldSource, ['host']);
void signAsDraftToRequest(request, { ...key, signatureAlgorithm: 'rsa-sha256', privateKey }, ['host']);
void signAsRFC9421ToRequestOrResponse(request, { label: { key, signer, identifiers: ['@method'] } });
void verifyParsedSignature(parsed, publicKey, console.log);
void verifyParsedSignature(parsed, { keys: publicKey, resolveKey: async context => { context.algorithm satisfies string | undefined; return publicKey; }, verifier: webCryptoVerifier });
void verifyDraftSignature(draft.value, { resolveKey: async () => undefined });
void verifyRFC9421Signature(rfc.value, { keys: new Map([['label', publicKey]]), verifyAll: true });
void verifyRFC9421Signature(rfc.value, publicKey, { verifyAll: false });
// @ts-expect-error ECDH is not a signature operation
const invalidEcdh: SignatureOperation = { name: 'ECDH', hash: 'SHA-256', namedCurve: 'P-256' };
// @ts-expect-error PSS operation requires SHA-512 and salt 64
const invalidPss: SignatureOperation = { name: 'RSA-PSS', hash: 'SHA-256', saltLength: 32 };
// @ts-expect-error Ed25519 does not accept an invented prehash
const invalidEd: SignatureOperation = { name: 'Ed25519', hash: 'SHA-512' };
void invalidEcdh; void invalidPss; void invalidEd;

void processSingleRFC9421SignSource({ key: oldSource, identifiers: ["@method"] }).then(result => { result.key satisfies CryptoKey; });
