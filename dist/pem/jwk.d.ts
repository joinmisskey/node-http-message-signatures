import { SignInfoDefaults } from '../utils.js';
/** Explicit local JWK import. Metadata is validated; no URLs or remote key sets are fetched. */
export declare function importSignatureJwk(jwk: JsonWebKey, privateKey: boolean, keyUsages: KeyUsage[], defaults?: SignInfoDefaults, extractable?: boolean, providedAlgorithm?: string): Promise<{
    key: CryptoKey;
    algorithm: {
        name: string;
        hash: string;
        saltLength: number;
    } | {
        name: string;
        hash: import("../types.js").SignatureHashAlgorithmUpperSnake;
        saltLength?: undefined;
    };
}>;
export declare function importPublicJwk(jwk: JsonWebKey, keyUsages?: KeyUsage[], defaults?: SignInfoDefaults, extractable?: boolean): Promise<CryptoKey>;
export declare function importPrivateJwk(jwk: JsonWebKey, keyUsages?: KeyUsage[], defaults?: SignInfoDefaults, extractable?: boolean): Promise<CryptoKey>;
/** Declared JWK algorithms determine omitted signing defaults; explicit conflicts fail. */
export declare function getJwkSigningDefaults(jwk: JsonWebKey, defaults?: SignInfoDefaults): SignInfoDefaults;
