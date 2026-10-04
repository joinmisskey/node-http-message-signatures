import * as modern from 'slacc-modern';
import * as legacy from 'slacc-legacy';
import { createSlaccSigningKey, createSlaccVerifier, createLegacySlaccRsaSigningKey, createLegacySlaccWebCryptoSigningKey } from '@misskey-dev/node-http-message-signatures/node/slacc';
import type { CustomSigningKey, SignatureVerifier } from '@misskey-dev/node-http-message-signatures';
const options = { keyId: 'actor', version: 'draft' as const, algorithm: 'rsa-v1_5-sha256' as const, privateKey: 'PEM' };
const key: CustomSigningKey = createSlaccSigningKey(modern, options);
const old: CustomSigningKey = createLegacySlaccRsaSigningKey(legacy, options);
const verifier: SignatureVerifier = createSlaccVerifier(modern, { algorithm: 'ed25519', publicKey: new Uint8Array(), version: 'rfc9421' });
void [key, old, verifier];
// @ts-expect-error Unsupported slacc algorithm.
createSlaccSigningKey(modern, { ...options, algorithm: 'rsa-pss-sha512' });
// @ts-expect-error Caller must choose the signature version.
createSlaccSigningKey(modern, { keyId: 'actor', algorithm: 'ed25519', privateKey: 'PEM' });
// @ts-expect-error CryptoKey is not an exportable input to this adapter.
createSlaccSigningKey(modern, { ...options, privateKey: {} as CryptoKey });
// @ts-expect-error Legacy slacc has no modern Verifier.
createSlaccVerifier(legacy, { algorithm: 'rsa-v1_5-sha256', publicKey: 'PEM' });

const hybrid: Promise<CustomSigningKey> = createLegacySlaccWebCryptoSigningKey(legacy, options);
void hybrid;
