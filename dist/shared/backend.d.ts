import { SignInfoDefaults } from '../utils.js';
import type { CustomSigningKey, PrivateKey, SignatureOperation, SignatureSigner, SignatureSignerContext, SignatureVerifierContext, VerificationOptions } from '../types.js';
export declare function isVerificationOptions(value: unknown): value is VerificationOptions;
export declare function validateSignatureAlgorithm(version: 'draft' | 'rfc9421', wire: string): void;
export declare function validateSignatureOperation(version: 'draft' | 'rfc9421', wire: string, operation: SignatureOperation): SignatureOperation;
export declare function operationWithoutKey(version: 'draft' | 'rfc9421', wire: string): SignatureOperation;
/** Normalize the already validated import operation, preserving JWK hash metadata. */
export declare function operationFromImport(imported: Awaited<ReturnType<typeof import('../pem/spki.js').parseAndImportPublicKey>>): SignatureOperation;
export declare function validateOperationKey(key: CryptoKey, operation: SignatureOperation, usage: 'sign' | 'verify'): void;
/** Stable default backend for callers routing only selected algorithms externally. */
export declare function webCryptoSigner(context: SignatureSignerContext): Promise<Uint8Array>;
export declare function webCryptoVerifier(context: SignatureVerifierContext): Promise<boolean>;
export declare function prepareSigningKey(version: 'draft' | 'rfc9421', source: PrivateKey | CustomSigningKey, defaults?: SignInfoDefaults, signer?: SignatureSigner): Promise<{
    key: CryptoKey | undefined;
    operation: SignatureOperation;
    wire: "rsa-sha1" | "rsa-sha256" | "rsa-sha384" | "rsa-sha512" | "ecdsa-sha1" | "ecdsa-sha256" | "ecdsa-sha384" | "ecdsa-sha512" | "ed25519-sha512" | "ed25519" | "ed448" | "rsa-pss-sha512" | "rsa-v1_5-sha256" | "hmac-sha256" | "ecdsa-p256-sha256" | "ecdsa-p384-sha384";
    signer: SignatureSigner;
} | {
    key: CryptoKey;
    operation: SignatureOperation;
    wire: string;
    signer: SignatureSigner;
}>;
