import { ParsedRFC9421Signature, PublicKeySource, RFC9421SignatureAlgorithm, VerificationOptions } from '../types.js';
export type RFC9421VerificationOptions = VerificationOptions & {
    verifyAll?: boolean;
    algorithms?: RFC9421SignatureAlgorithm[];
};
/** Verify parsed signatures. A resolver is authoritative; label precedes keyid in legacy maps. */
export declare function verifyRFC9421Signature(parsedEntries: ParsedRFC9421Signature['value'], options: RFC9421VerificationOptions): Promise<boolean>;
export declare function verifyRFC9421Signature(parsedEntries: ParsedRFC9421Signature['value'], keys: PublicKeySource | Map<string, PublicKeySource>, options?: {
    verifyAll: boolean;
    algorithms?: RFC9421SignatureAlgorithm[];
}, errorLogger?: (message: any) => any): Promise<boolean>;
