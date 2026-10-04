/** Strict, bounded DER reader for key containers. Offsets stay within the supplied view. */
export type DerElement = {
    tag: number;
    content: Uint8Array;
    encoded: Uint8Array;
    end: number;
};
export declare function readDer(data: Uint8Array, offset?: number): DerElement;
export declare function derChildren(data: Uint8Array): DerElement[];
export declare function derSequence(data: Uint8Array): DerElement[];
export declare function unsignedDerInteger(element: DerElement, allowZero?: boolean): Uint8Array;
