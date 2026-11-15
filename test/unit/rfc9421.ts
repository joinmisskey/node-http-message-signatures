import { sign } from 'node:crypto';
import { HeadersLike, RequestLike } from "@/types";
import { RFC9421SignSource, processSingleRFC9421SignSource, signAsRFC9421ToRequestOrResponse } from "@/rfc9421/sign";
import { ed25519, rsa4096 } from "test/keys";
import { parseRFC9421RequestOrResponse } from "@/rfc9421/parse";
import { verifyParsedSignature } from "@/shared/verify";
import { verifyRFC9421Signature } from "@/rfc9421/verify";
import { jest } from "@jest/globals";
import { parseRequestSignature } from "@/shared/parse";

//#region data
const theDate = new Date('2024-02-28T17:44:06.000Z');

const getBasicRequest = () => ({
	headers: {
		Date: theDate.toUTCString(),
		Host: 'example.com',
		'Content-Digest': 'sha-256=base64',
		Accept: '*/*',
	} as HeadersLike,
	method: 'GET',
	url: '/foo/bar',
});

const basicIdentifiers = ["@method", "@authority", "@path", "@query", "content-digest", "accept"];
//#endregion

describe('RFC9421', () => {
	describe(processSingleRFC9421SignSource, () => {
		test('basic', async () => {
			const source = {
				key: {
					privateKeyPem: rsa4096.privateKey,
					keyId: 'x',
				},
				defaults: {
					ec: 'DSA',
					hash: 'SHA-256',
				},
				identifiers: basicIdentifiers,
				created: 1618884475,
			} as RFC9421SignSource;
			const result = await processSingleRFC9421SignSource(source);
			expect(result).toStrictEqual({
				key: expect.anything(),
				params: [
					basicIdentifiers,
					{
						keyid: 'x',
						alg: 'rsa-v1_5-sha256',
						created: 1618884475,
						expires: undefined,
						nonce: undefined,
						tag: undefined,
					},
				],
			});
		});
		test('with expires', async () => {
			const source = {
				key: {
					privateKeyPem: rsa4096.privateKey,
					keyId: 'x',
				},
				defaults: {
					ec: 'DSA',
					hash: 'SHA-256',
				},
				identifiers: basicIdentifiers,
				created: 1618884475,
				expiresAfter: 600,
			} as RFC9421SignSource;
			const result = await processSingleRFC9421SignSource(source);
			expect(result).toStrictEqual({
				key: expect.anything(),
				params: [
					basicIdentifiers,
					{
						keyid: 'x',
						alg: 'rsa-v1_5-sha256',
						created: 1618884475,
						expires: 1618885075,
						nonce: undefined,
						tag: undefined,
					},
				],
			});
		});
	});

	const sig1ExpectedParams = '("@method" "@authority" "@path" "@query" "content-digest" "accept");keyid="x";alg="rsa-v1_5-sha256";created=1618884475';
	const sig2ExpectedParams = '("@method" "@authority" "@path" "@query" "content-digest" "accept");keyid="y";alg="ed25519";created=1618884475';
	// Independent RFC 9421 base: an absent query is represented by "?".
	const expectedBase = (params: string) => [
		'"@method": GET',
		'"@authority": example.com',
		'"@path": /foo/bar',
		'"@query": ?',
		'"content-digest": sha-256=base64',
		'"accept": */*',
		`"@signature-params": ${params}`,
	].join('\n');
	const sig1ExpectedSign = sign('sha256', Buffer.from(expectedBase(sig1ExpectedParams)), rsa4096.privateKey).toString('base64');
	const sig2ExpectedSign = sign(null, Buffer.from(expectedBase(sig2ExpectedParams)), ed25519.privateKey).toString('base64');
	const basicSources = {
		sig1: {
			key: {
				privateKeyPem: rsa4096.privateKey,
				keyId: 'x',
			},
			defaults: {
				ec: 'DSA',
				hash: 'SHA-256',
			},
			identifiers: basicIdentifiers,
			created: 1618884475,
		},
	} satisfies Record<string, RFC9421SignSource>;

	const multipleSources = {
		sig1: basicSources.sig1,
		sig2: {
			key: {
				privateKeyPem: ed25519.privateKey,
				keyId: 'y',
			},
			defaults: {
				ec: 'DSA',
				hash: 'SHA-512',
			},
			identifiers: basicIdentifiers,
			created: 1618884475,
		},
	} satisfies Record<string, RFC9421SignSource>;

	describe(signAsRFC9421ToRequestOrResponse, () => {
		test('basic', async () => {
			const request = getBasicRequest();
			await signAsRFC9421ToRequestOrResponse(request, basicSources);
			expect(request.headers['Signature-Input']).toBe(`sig1=${sig1ExpectedParams}`);
			expect(request.headers['Signature']).toBe(`sig1=:${sig1ExpectedSign}:`);
		});
		test('multiple', async () => {
			const request = getBasicRequest();
			await signAsRFC9421ToRequestOrResponse(request, multipleSources);
			expect(request.headers['Signature-Input']).toBe(`sig1=${sig1ExpectedParams}, sig2=${sig2ExpectedParams}`);
			expect(request.headers['Signature']).toBe(`sig1=:${sig1ExpectedSign}:, sig2=:${sig2ExpectedSign}:`);
		});
	});

	describe('integrated single', () => {
		let request: RequestLike;
		let result: Awaited<ReturnType<typeof signAsRFC9421ToRequestOrResponse>>;
		beforeAll(async () => {
			request = getBasicRequest();
			result = await signAsRFC9421ToRequestOrResponse(request, basicSources);
		});
		test('parse (invalid skew fail)', () => {
			expect(() => parseRFC9421RequestOrResponse(request)).toThrow();
		});
		test('parse and verify', async () => {
			const parsed = parseRequestSignature(request, { clockSkew: { now: theDate } });
			expect(parsed.value).toStrictEqual([
				[
					'sig1',
					{
						algorithm: 'rsa-v1_5-sha256',
						base: result.signatureBases.get('sig1'),
						created: 1618884475,
						expires: undefined,
						keyid: 'x',
						nonce: undefined,
						params: sig1ExpectedParams,
						signature: sig1ExpectedSign,
						tag: undefined,
					},
				],
			]);
			const verified = await verifyParsedSignature(parsed, rsa4096.publicKey);
			expect(verified).toBe(true);
		});

		test('parse (invalid signature verify false)', async () => {
			const invalidSignature = `${Array.from({ length: 86 }, () => 'A').join('')}==`;
			request.headers['Signature'] = `sig1=:${invalidSignature}:`;
			const parsed = parseRequestSignature(request, { clockSkew: { now: theDate } });
			expect(parsed.value).toStrictEqual([
				[
					'sig1',
					{
						algorithm: 'rsa-v1_5-sha256',
						base: result.signatureBases.get('sig1'),
						created: 1618884475,
						expires: undefined,
						keyid: 'x',
						nonce: undefined,
						params: sig1ExpectedParams,
						signature: invalidSignature,
						tag: undefined,
					},
				],
			]);
			const verified = await verifyParsedSignature(parsed, rsa4096.publicKey);
			expect(verified).toBe(false);
		});
	});

	describe('multiple', () => {
		describe('parse and verify', () => {
			test('two sign by one verification (integrated succ)', async () => {
				const request = getBasicRequest();
				const result = await signAsRFC9421ToRequestOrResponse(request, multipleSources);
				const parsed = parseRequestSignature(request, { clockSkew: { now: theDate } });
				expect(parsed.value).toStrictEqual([
					[
						'sig1',
						{
							algorithm: 'rsa-v1_5-sha256',
							base: result.signatureBases.get('sig1'),
							created: 1618884475,
							expires: undefined,
							keyid: 'x',
							nonce: undefined,
							params: sig1ExpectedParams,
							signature: sig1ExpectedSign,
							tag: undefined,
						},
					],
					[
						'sig2',
						{
							algorithm: 'ed25519',
							base: result.signatureBases.get('sig2'),
							created: 1618884475,
							expires: undefined,
							keyid: 'y',
							nonce: undefined,
							params: sig2ExpectedParams,
							signature: sig2ExpectedSign,
							tag: undefined,
						},
					],
				]);
				const verified = await verifyParsedSignature(parsed, rsa4096.publicKey);
				expect(verified).toBe(true);
			});

			test('two sign by one verification (integrated fail)', async () => {
				const request = getBasicRequest();
				await signAsRFC9421ToRequestOrResponse(request, multipleSources);
				request.headers['Signature'] = `sig1=:${sig2ExpectedSign}:, sig2=:${sig1ExpectedSign}:`;
				const parsed = parseRequestSignature(request, { clockSkew: { now: theDate } });
				const logger = jest.fn();
				const verified = await verifyParsedSignature(parsed, rsa4096.publicKey, logger);
				expect(verified).toBe(false);
				expect(logger).toHaveBeenCalledWith('verification simply failed, label: sig1');
			});

			test('two sign by two verification; verifyAll: true (succ)', async () => {
				const request = getBasicRequest();
				await signAsRFC9421ToRequestOrResponse(request, multipleSources);
				const parsed = parseRFC9421RequestOrResponse(request, { clockSkew: { now: theDate } });
				const verified = await verifyRFC9421Signature(parsed.value, new Map([['sig1', rsa4096.publicKey], ['sig2', ed25519.publicKey]]), { verifyAll: true });
				expect(verified).toBe(true);
			});

			test('two sign by two verification; verifyAll: true (one fail)', async () => {
				const request = getBasicRequest();
				await signAsRFC9421ToRequestOrResponse(request, multipleSources);
				request.headers['Signature'] = `sig1=:${sig2ExpectedSign}:, sig2=:${sig2ExpectedSign}:`;
				const parsed = parseRFC9421RequestOrResponse(request, { clockSkew: { now: theDate } });
				const verified = await verifyRFC9421Signature(parsed.value, new Map([['sig1', rsa4096.publicKey], ['sig2', ed25519.publicKey]]), { verifyAll: true });
				expect(verified).toBe(false);
			});

			test('two sign by two verification; verifyAll: false (succ)', async () => {
				const request = getBasicRequest();
				await signAsRFC9421ToRequestOrResponse(request, multipleSources);
				const parsed = parseRFC9421RequestOrResponse(request, { clockSkew: { now: theDate } });
				const logger = jest.fn();
				const verified = await verifyRFC9421Signature(parsed.value, new Map([['sig1', rsa4096.publicKey], ['sig2', ed25519.publicKey]]), { verifyAll: false }, logger);
				expect(verified).toBe(true);
				expect(logger).not.toHaveBeenCalled();
			});

			test('two sign by two verification; verifyAll: false (one succ)', async () => {
				const request = getBasicRequest();
				await signAsRFC9421ToRequestOrResponse(request, multipleSources);
				request.headers['Signature'] = `sig1=:${sig1ExpectedSign}:, sig2=:${sig1ExpectedSign}:`;
				const parsed = parseRFC9421RequestOrResponse(request, { clockSkew: { now: theDate } });
				const logger = jest.fn();
				const verified = await verifyRFC9421Signature(parsed.value, new Map([['sig1', rsa4096.publicKey], ['sig2', ed25519.publicKey]]), { verifyAll: false }, logger);
				expect(verified).toBe(true);
				expect(logger).toHaveBeenCalledWith('verification simply failed, label: sig2');
			});

			test('two sign by two verification; verifyAll: false (fail)', async () => {
				const request = getBasicRequest();
				await signAsRFC9421ToRequestOrResponse(request, multipleSources);
				request.headers['Signature'] = `sig1=:${sig2ExpectedSign}:, sig2=:${sig1ExpectedSign}:`;
				const parsed = parseRFC9421RequestOrResponse(request, { clockSkew: { now: theDate } });
				const logger = jest.fn();
				const verified = await verifyRFC9421Signature(parsed.value, new Map([['sig1', rsa4096.publicKey], ['sig2', ed25519.publicKey]]), { verifyAll: false }, logger);
				expect(verified).toBe(false);
				expect(logger).toHaveBeenCalledWith('verification simply failed, label: sig1');
				expect(logger).toHaveBeenCalledWith('verification simply failed, label: sig2');
			});
		});
	});
});

describe('independent RFC 9421 coverage regressions', () => {
	function independentlySigned(url: string, method: string, components: string, lines: string[]) {
		const params = `(${components});keyid="test-key";alg="ed25519"`;
		const base = [...lines, `"@signature-params": ${params}`].join('\n');
		return {
			url, method,
			headers: {
				host: 'example.com',
				'signature-input': `sig=${params}`,
				signature: `sig=:${sign(null, Buffer.from(base), ed25519.privateKey).toString('base64')}:`,
			},
		};
	}

	test('changing a covered request-target query invalidates the signature', async () => {
		const request = independentlySigned('/resource?item=one', 'GET', '"@method" "@request-target"', ['"@method": GET', '"@request-target": /resource?item=one']);
		const options = { requiredComponents: { rfc9421: ['@request-target'] } };
		expect(await verifyParsedSignature(parseRequestSignature(request, options), ed25519.publicKey)).toBe(true);
		request.url = '/resource?item=two';
		expect(await verifyParsedSignature(parseRequestSignature(request, options), ed25519.publicKey)).toBe(false);
	});

	test('changing case of a covered custom method invalidates the signature', async () => {
		const request = independentlySigned('/resource', 'custom', '"@method"', ['"@method": custom']);
		expect(await verifyParsedSignature(parseRequestSignature(request), ed25519.publicKey)).toBe(true);
		request.method = 'CUSTOM';
		expect(await verifyParsedSignature(parseRequestSignature(request), ed25519.publicKey)).toBe(false);
	});

	test('encoded query values interoperate and appended duplicates are rejected', async () => {
		const request = independentlySigned('/resource?item=a%20b%0Ac', 'GET', '"@query-param";name="item"', ['"@query-param";name="item": a%20b%0Ac']);
		const options = { requiredComponents: { rfc9421: ['"@query-param";name="item"'] } };
		expect(await verifyParsedSignature(parseRequestSignature(request, options), ed25519.publicKey)).toBe(true);
		request.url += '&%69tem=another';
		expect(() => parseRequestSignature(request, options)).toThrow('No valid signature');
	});

	test('response signing and verification work for unsigned requests', async () => {
		const response = {
			req: { method: 'GET', url: '/resource', headers: { host: 'example.com' } },
			statusCode: 200,
			headers: { date: new Date().toUTCString() },
		};
		await signAsRFC9421ToRequestOrResponse(response, { sig: { key: { keyId: 'test-key', privateKeyPem: ed25519.privateKey }, identifiers: ['@status', 'date'] } });
		expect(await verifyParsedSignature(parseRFC9421RequestOrResponse(response), ed25519.publicKey)).toBe(true);
	});
});
