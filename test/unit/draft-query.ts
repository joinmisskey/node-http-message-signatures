import { describe, expect, test } from '@jest/globals';
import httpSignature from '@peertube/http-signature';
import { ed25519, rsa4096 } from '../keys.js';
import type { RequestLike } from '@/types.js';
import { genDraftSigningString } from '@/draft/string.js';
import { signAsDraftToRequest } from '@/draft/sign.js';
import { parseRequestSignature } from '@/shared/parse.js';
import { verifyDraftSignature } from '@/draft/verify.js';
import { collectHeaders } from '@/utils.js';
import { RFC9421SignatureBaseFactory } from '@/rfc9421/base.js';

const theDate = new Date('2024-02-28T17:44:06.000Z');
const includeHeaders = ['(request-target)', 'host', 'date'];
const cases = [
	['/inbox', '/inbox'],
	['/inbox?foo=bar&foo=baz', '/inbox?foo=bar&foo=baz'],
	['/inbox?value=%2f%3F%23&space=a+b&empty=', '/inbox?value=%2f%3F%23&space=a+b&empty='],
	['/inbox?', '/inbox?'],
	['/inbox#fragment?ignored=yes', '/inbox'],
	['/inbox?foo=bar#fragment', '/inbox?foo=bar'],
	['/inbox?#fragment', '/inbox?'],
	['?foo=bar', '/?foo=bar'],
	['?', '/?'],
	['', '/'],
] as const;

const requestFor = (url: string, method: string): RequestLike => ({
	url,
	method,
	headers: { Host: 'example.com:8443', Date: theDate.toUTCString() },
});

describe.each(['GET', 'POST'])('draft request target: %s', method => {
	test.each(cases)('absolute URL %s yields %s', (suffix, target) => {
		const request = requestFor(`https://example.com:8443${suffix}`, method);
		expect(genDraftSigningString(request, includeHeaders)).toBe(
			`(request-target): ${method.toLowerCase()} ${target}\nhost: example.com:8443\ndate: ${theDate.toUTCString()}`,
		);
	});

	test.each(cases.filter(([suffix]) => suffix.startsWith('/')))('origin-form %s yields %s', (url, target) => {
		expect(genDraftSigningString(requestFor(url, method), includeHeaders)).toBe(
			`(request-target): ${method.toLowerCase()} ${target}\nhost: example.com:8443\ndate: ${theDate.toUTCString()}`,
		);
	});

	describe.each([['RSA', rsa4096], ['Ed25519', ed25519]])('%s signatures', (_algorithm, keyPair) => {
		test.each(cases)('absolute URL %s verifies against origin-form %s', async (suffix, target) => {
			const request = requestFor(`https://example.com:8443${suffix}`, method);
			const signed = await signAsDraftToRequest(request, {
				privateKeyPem: keyPair.privateKey,
				keyId: 'https://example.com/actor#key',
			}, includeHeaders);
			const received = { ...request, url: target, headers: collectHeaders(request) };
			const parsed = parseRequestSignature(received, { clockSkew: { now: theDate } });
			expect(parsed.version).toBe('draft');
			if (parsed.version !== 'draft') throw new Error('Expected draft signature');
			expect(parsed.value.signingString).toBe(signed.signingString);
			expect(await verifyDraftSignature(parsed.value, keyPair.publicKey)).toBe(true);
			// Independent implementation uses the received origin-form request target.
			const independent = httpSignature.parseRequest(received, { clockSkew: 60 * 60 * 24 * 365 * 1000 });
			expect(httpSignature.verifySignature(independent, keyPair.publicKey)).toBe(true);

			// The absolute-URL verification path must agree as well.
			const absoluteParsed = parseRequestSignature(request, { clockSkew: { now: theDate } });
			if (absoluteParsed.version !== 'draft') throw new Error('Expected draft signature');
			expect(await verifyDraftSignature(absoluteParsed.value, keyPair.publicKey)).toBe(true);

			const tampered = { ...received, url: `${target}extra` };
			const tamperedParsed = parseRequestSignature(tampered, { clockSkew: { now: theDate } });
			if (tamperedParsed.version !== 'draft') throw new Error('Expected draft signature');
			expect(await verifyDraftSignature(tamperedParsed.value, keyPair.publicKey)).toBe(false);
		});
	});
});

describe('RFC 9421 components remain separate', () => {
	test.each(['https://example.com:8443/inbox?foo=%2f&foo=bar', '/inbox?foo=%2f&foo=bar'])('%s', url => {
		const factory = new RFC9421SignatureBaseFactory({
			...requestFor(url, 'POST'),
			headers: { Host: 'example.com:8443', 'Signature-Input': 'sig1=("@method" "@authority" "@path" "@query")' },
		});
		expect(factory.get('@path')).toBe('/inbox');
		expect(factory.get('@query')).toBe('?foo=%2f&foo=bar');
		expect(factory.get('@authority')).toBe('example.com:8443');
	});
});
