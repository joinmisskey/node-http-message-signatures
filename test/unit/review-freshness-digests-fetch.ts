import {
	checkClockSkew, genRFC3230DigestHeader, getWebcrypto, parseRequestSignature,
	signAsDraftToRequest, verifyDigestHeader, verifyParsedSignature,
	verifyRFC3230DigestHeader, verifyRFC9530DigestHeader,
} from '../../src/index.js';
import type { RequestLike } from '../../src/types.js';

const now = new Date('2026-11-15T12:00:00Z');
const currentDate = now.toUTCString();
const staleDate = 'Mon, 01 Jan 2001 00:00:00 GMT';
const request = (headers: RequestLike['headers'] = {}): RequestLike => ({
	method: 'POST', url: '/resource', headers: { host: 'example.test', ...headers },
});
let pair: CryptoKeyPair;
beforeAll(async () => {
	const generated = await (await getWebcrypto()).subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
	if (!('publicKey' in generated)) throw new Error('Expected a key pair');
	pair = generated;
});

async function signedXDate(value: string) {
	const source = request({ 'x-date': value });
	await signAsDraftToRequest(source, { keyId: 'review-test', privateKey: pair.privateKey }, ['(request-target)', 'host', 'x-date']);
	return source;
}

const parse = (source: RequestLike | Request) => parseRequestSignature(source, {
	clockSkew: { now }, requiredComponents: { draft: ['date'] },
});

for (const raw of [false, true]) {
	test(`stale signed X-Date cannot be hidden by unsigned Date (raw=${raw})`, async () => {
		const source = await signedXDate(staleDate);
		source.headers.date = currentDate;
		if (raw) source.rawHeaders = Object.entries(source.headers).flat() as string[];
		expect(() => parse(source)).toThrow('Clock skew is invalid');
	});
	test(`single fresh signed X-Date verifies (raw=${raw})`, async () => {
		const source = await signedXDate(currentDate);
		if (raw) source.rawHeaders = Object.entries(source.headers).flat() as string[];
		expect(await verifyParsedSignature(parse(source), pair.publicKey)).toBe(true);
	});
	test(`stale X-Date alone is rejected (raw=${raw})`, async () => {
		const source = await signedXDate(staleDate);
		if (raw) source.rawHeaders = Object.entries(source.headers).flat() as string[];
		expect(() => parse(source)).toThrow('Clock skew is invalid');
	});
}

for (const field of ['date', 'x-date']) {
	for (const invalid of ['', 'not-a-date', '999999999999999999999999']) {
		test(`invalid ${field} ${JSON.stringify(invalid)} fails closed`, () => {
			expect(() => parse(request({ [field]: invalid, signature: 'test' }))).toThrow('Clock skew is invalid');
		});
	}
	test(`duplicate ${field} is rejected even when both values are fresh`, () => {
		const source = request({ signature: 'test' });
		source.rawHeaders = ['Host', 'example.test', field, currentDate, field, currentDate, 'Signature', 'test'];
		expect(() => parse(source)).toThrow('Request has multiple date headers');
	});
}

test('invalid reference clock is not accepted', () => {
	expect(() => checkClockSkew(now, new Date('invalid'))).toThrow('Clock skew is invalid');
});

const digestChecks = [
	['combined', (source: RequestLike, failOnNoDigest?: boolean) => verifyDigestHeader(source, 'body', { algorithms: ['SHA-256'], ...(failOnNoDigest === undefined ? {} : { failOnNoDigest }) })],
	['draft', (source: RequestLike, failOnNoDigest?: boolean) => verifyRFC3230DigestHeader(source, 'body', { algorithms: ['SHA-256'], ...(failOnNoDigest === undefined ? {} : { failOnNoDigest }) })],
	['rfc9530', (source: RequestLike, failOnNoDigest?: boolean) => verifyRFC9530DigestHeader(source, 'body', { algorithms: ['sha-256'], ...(failOnNoDigest === undefined ? {} : { failOnNoDigest }) })],
] as const;
for (const [name, check] of digestChecks) {
	test(`${name} partial digest options preserve missing-header rejection`, async () => {
		expect(await check(request())).toBe(false);
		expect(await check(request(), true)).toBe(false);
		expect(await check(request(), false)).toBe(true);
	});
}

test('partial options preserve verifyAll; explicit false still selects the first digest', async () => {
	const digest = await genRFC3230DigestHeader('body', 'SHA-256');
	const sha256 = digest.slice(digest.indexOf('=') + 1);
	const source = request({ 'content-digest': `sha-256=:${sha256}:, sha-512=:AA==:` });
	const options: NonNullable<Parameters<typeof verifyRFC9530DigestHeader>[2]>[] = [
		{}, { failOnNoDigest: true }, { algorithms: ['sha-256', 'sha-512'] },
	];
	for (const opts of options) {
		expect(await verifyRFC9530DigestHeader(source, 'body', opts)).toBe(false);
	}
	expect(await verifyDigestHeader(source, 'body', { algorithms: ['SHA-256', 'SHA-512'] })).toBe(false);
	expect(await verifyRFC9530DigestHeader(source, 'body', { verifyAll: false })).toBe(true);
	expect(await verifyDigestHeader(source, 'body', { algorithms: ['SHA-256', 'SHA-512'], verifyAll: false })).toBe(true);
});

test('native Fetch draft signing writes a real header and verifies', async () => {
	const source = new Request('https://example.test/resource', { method: 'POST', headers: { date: currentDate } });
	const result = await signAsDraftToRequest(source, { keyId: 'review-test', privateKey: pair.privateKey }, ['(request-target)', 'date']);
	expect(source.headers.get('signature')).toBe(result.signatureHeader);
	expect(await verifyParsedSignature(parseRequestSignature(source, { clockSkew: { now }, requiredComponents: { draft: ['date'] } }), pair.publicKey)).toBe(true);
});
