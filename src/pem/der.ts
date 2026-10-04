/** Strict, bounded DER reader for key containers. Offsets stay within the supplied view. */
export type DerElement = { tag: number; content: Uint8Array; encoded: Uint8Array; end: number };
export function readDer(data: Uint8Array, offset = 0): DerElement {
	const start = offset;
	if (offset + 2 > data.length) throw new Error('Truncated DER');
	const tag = data[offset++];
	if ((tag & 31) === 31) throw new Error('Unsupported DER tag');
	let length = data[offset++];
	if (length & 128) {
		const count = length & 127;
		if (!count || count > 4 || offset + count > data.length || data[offset] === 0) throw new Error('Invalid DER length');
		length = 0;
		for (let i = 0; i < count; i++) length = length * 256 + data[offset++];
		if (length < 128) throw new Error('Nonminimal DER length');
	}
	const end = offset + length;
	if (end > data.length) throw new Error('Truncated DER content');
	return { tag, content: data.subarray(offset, end), encoded: data.subarray(start, end), end };
}
export function derChildren(data: Uint8Array): DerElement[] {
	const children: DerElement[] = [];
	for (let offset = 0; offset < data.length;) {
		const child = readDer(data, offset);
		if (children.length >= 64) throw new Error('Too many DER fields');
		children.push(child);
		offset = child.end;
	}
	return children;
}
export function derSequence(data: Uint8Array): DerElement[] {
	if (data.length > 1024 * 1024) throw new Error('Key DER exceeds size limit');
	const root = readDer(data);
	if (root.tag !== 0x30 || root.end !== data.length) throw new Error('Expected one DER sequence');
	return derChildren(root.content);
}
export function unsignedDerInteger(element: DerElement, allowZero = false): Uint8Array {
	const bytes = element.content;
	if (element.tag !== 2 || !bytes.length || (bytes[0] & 128)) throw new Error('Expected nonnegative DER integer');
	if (bytes.length > 1 && bytes[0] === 0 && !(bytes[1] & 128)) throw new Error('Nonminimal DER integer');
	if (!allowZero && bytes.every(value => value === 0)) throw new Error('Expected positive DER integer');
	return bytes;
}
