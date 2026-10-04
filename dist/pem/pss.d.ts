import { DerElement } from './der.js';
/** Validate restricted key parameters for the RFC 9421 operation before normalization. */
export declare function validateRfc9421PssParameters(identifier: DerElement): void;
/** Native WebCrypto accepts rsaEncryption containers; validate PSS restrictions first. */
export declare function normalizePssContainer(data: Uint8Array, identifierIndex: number): ArrayBuffer;
