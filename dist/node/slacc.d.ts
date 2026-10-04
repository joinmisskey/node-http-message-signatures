/// <reference types="node" />
import { Buffer } from 'node:buffer';
import type { CustomSigningKey, SignatureVerifier } from '../types.js';
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
    SignatureAlgorithmIdentifier: {
        Rsa2048_8192: Suite;
        Eddsa: Suite;
    };
    Signer: {
        fromPkcs8Der(suite: Suite, der: Buffer): SlaccSignerHandle;
    };
    Verifier: {
        fromSpkiDer(suite: Suite, der: Buffer): SlaccVerifierHandle;
    };
}
/** slacc 0.1.5 has RSA signing only, with a distinct API. */
export interface LegacySlaccBinding {
    RsaKeyPair: {
        fromPem(pem: string): {
            sign(payload: Buffer, callback: Callback<Buffer>): void;
        };
    };
}
export type SlaccSigningOptions = {
    keyId: string;
    version: SlaccVersion;
    algorithm: SlaccAlgorithm;
    privateKey: SlaccKeyInput;
};
export type SlaccVerifierOptions = {
    algorithm: SlaccAlgorithm;
    publicKey: SlaccKeyInput;
    version?: SlaccVersion;
};
/** Construct once and reuse; the native signer is bound to validated private-key bytes. */
export declare function createSlaccSigningKey<Suite>(binding: SlaccBinding<Suite>, options: SlaccSigningOptions): CustomSigningKey;
/** Fixed trusted public key; callers own identity/label routing. Never ignores context.key. */
export declare function createSlaccVerifier<Suite>(binding: SlaccBinding<Suite>, options: SlaccVerifierOptions): SignatureVerifier;
/** Explicit compatibility with slacc 0.1.5; only RSA-v1.5/SHA-256 signing is supported. */
export declare function createLegacySlaccRsaSigningKey(binding: LegacySlaccBinding, options: Omit<SlaccSigningOptions, 'algorithm'>): CustomSigningKey;
export {};
