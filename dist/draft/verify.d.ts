import { parseSignInfo } from '../shared/verify.js';
import type { ParsedDraftSignature, PublicKeySource, VerificationOptions } from '../types.js';
/** @deprecated Use parseSignInfo */
export declare const genSignInfoDraft: typeof parseSignInfo;
export declare function verifyDraftSignature(parsed: ParsedDraftSignature['value'], options: VerificationOptions): Promise<boolean>;
export declare function verifyDraftSignature(parsed: ParsedDraftSignature['value'], key: PublicKeySource, errorLogger?: (message: any) => any): Promise<boolean>;
