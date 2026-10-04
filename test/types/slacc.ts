import * as slacc from 'slacc';
import { createSlaccSigningKey, createSlaccVerifier } from '@misskey-dev/node-http-message-signatures/node/slacc';
import type { CustomSigningKey, SignatureVerifier } from '@misskey-dev/node-http-message-signatures';
const options = { keyId: 'actor', version: 'draft' as const, algorithm: 'rsa-v1_5-sha256' as const, privateKey: 'PEM' };
const key: CustomSigningKey = createSlaccSigningKey(slacc, options);
const verifier: SignatureVerifier = createSlaccVerifier(slacc, { algorithm: 'ed25519', publicKey: new Uint8Array(), version: 'rfc9421' });
void [key, verifier];
// @ts-expect-error Unsupported slacc algorithm.
createSlaccSigningKey(slacc, { ...options, algorithm: 'rsa-pss-sha512' });
// @ts-expect-error Caller must choose the signature version.
createSlaccSigningKey(slacc, { keyId: 'actor', algorithm: 'ed25519', privateKey: 'PEM' });
// @ts-expect-error CryptoKey is not an exportable input to this adapter.
createSlaccSigningKey(slacc, { ...options, privateKey: {} as CryptoKey });
// @ts-expect-error Removed RSA-only binding cannot implement the modern API.
createSlaccSigningKey({ RsaKeyPair: {} }, options);
