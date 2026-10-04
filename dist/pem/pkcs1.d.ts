import { ASN1 } from '@lapo/asn1js';
export declare class Pkcs1ParseError extends Error {
    constructor(message: string);
}
/**
 * Parse PKCS#1 public key
 */
export declare function parsePkcs1(input: ASN1.StreamOrBinary): {
    pkcs1: ArrayBufferLike;
    modulus: number;
    publicExponent: number;
};
export declare const rsaASN1AlgorithmIdentifier: Uint8Array;
/**
 * Generate SPKI public key from PKCS#1 public key
 * as RSASSA-PKCS1-v1_5
 * @param input PKCS#1 public key
 * @returns SPKI public key DER
 */
export declare function genSpkiFromPkcs1(input: ASN1.StreamOrBinary): Uint8Array;
/** Parse an unencrypted, two-prime RSA private key (RFC 8017 Appendix A.1.2). */
export declare function parsePkcs1PrivateKey(input: ASN1.StreamOrBinary): {
    pkcs1: ArrayBuffer;
};
/** Wrap a validated two-prime PKCS#1 private key in an unencrypted PKCS#8 container. */
export declare function genPkcs8FromPkcs1(input: ASN1.StreamOrBinary): Uint8Array;
