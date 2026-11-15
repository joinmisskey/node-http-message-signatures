import { RequestLike, ResponseLike, SFVSignatureInputDictionaryForInput } from '../types';
import { RFC9421SignatureBaseFactory, convertSignatureParamsDictionary } from './base';

const tinySignatureInput = `x=(x)`;
const requestBase = {
	method: 'GET',
	url: 'https://example.com/resource/1',
	headers: {
		Host: 'example.com',
		Date: 'Tue, 07 Jun 2014 20:51:35 GMT',
		'Signature-Input': tinySignatureInput,
	},
} as RequestLike;

const responseBase = {
	req: requestBase,
	statusCode: 200,
	headers: {
		Date: 'Tue, 07 Jun 2024 20:51:35 GMT',
		'Signature-Input': tinySignatureInput,
	},
} as ResponseLike;

describe(RFC9421SignatureBaseFactory, () => {
	describe('input dictionary', () => {
		test('record', () => {
			const result = convertSignatureParamsDictionary({
				sig1: [
					[['@method', {}], ['@query-param', { name: 'foo', hoge: 'fuga' }]],
					{ keyid: 'x', algo: 'rsa-v1_5-sha256' },
				],
			});
			expect(result).toBe(`sig1=("@method" "@query-param";name="foo";hoge="fuga");keyid="x";algo="rsa-v1_5-sha256"`);
		});
		test('record with string identifier', () => {
			const result = convertSignatureParamsDictionary({
				sig1: [
					['@method', ['@query-param', { name: 'foo', hoge: 'fuga' }]],
					{ keyid: 'x', algo: 'rsa-v1_5-sha256' },
				],
			});
			expect(result).toBe(`sig1=("@method" "@query-param";name="foo";hoge="fuga");keyid="x";algo="rsa-v1_5-sha256"`);
		});
		test('array', () => {
			const result = convertSignatureParamsDictionary([
				['sig1', [
					[['@method', []], ['@query-param', [['name', 'foo']]]],
					{ keyid: 'x', algo: 'rsa-v1_5-sha256' },
				]],
			]);
			expect(result).toBe(`sig1=("@method" "@query-param";name="foo");keyid="x";algo="rsa-v1_5-sha256"`);
		});
	});

	describe('construct', () => {
		test('request basic', () => {
			const factory = new RFC9421SignatureBaseFactory(
				requestBase,
			);
			expect(factory).toBeInstanceOf(RFC9421SignatureBaseFactory);
			expect(factory.request).toBe(requestBase);
			expect(factory.requestHeaders).toEqual({
				host: 'example.com',
				date: 'Tue, 07 Jun 2014 20:51:35 GMT',
				'signature-input': tinySignatureInput,
			});
			expect(factory.response).toBeNull();
			expect(factory.scheme).toBe('https');
			expect(factory.targetUri).toBe('https://example.com/resource/1');
			expect(factory.url.href).toBe('https://example.com/resource/1');
		});

		test('request with path url', () => {
			const request = {
				...requestBase,
				url: '/resource/1',
			} satisfies RequestLike;
			const factory = new RFC9421SignatureBaseFactory(
				request,
			);

			expect(factory.scheme).toBe('https');
			expect(factory.targetUri).toBe('https://example.com/resource/1');
			expect(factory.url.href).toBe('https://example.com/resource/1');
		});

		test('request with invalid headers', () => {
			const request = {
				...requestBase,
				headers: undefined,
			} as any;
			expect(() => new RFC9421SignatureBaseFactory(
				request,
				tinySignatureInput,
			)).toThrow();
		});

		test('request with raw headers', () => {
			const request = {
				...requestBase,
				rawHeaders: [
					...Object.entries(requestBase.headers),
					...['x-test', 'value'],
					...['x-test', 'value2'],
					...['X-Test', null],
				].flat(2),
			} satisfies RequestLike;
			const factory = new RFC9421SignatureBaseFactory(
				request,
			);
			expect(factory.requestHeaders).toEqual({
				date: ['Tue, 07 Jun 2014 20:51:35 GMT'],
				host: ['example.com'],
				'signature-input': [tinySignatureInput],
				'x-test': ['value', 'value2', ''],
			});
		});

		test('request with raw headers (entries)', () => {
			const request = {
				...requestBase,
				rawHeaders: [
					...Object.entries(requestBase.headers),
					['x-test', 'value'],
					['x-test', 'value2'],
					['X-Test', null],
				].flat(2),
			} satisfies RequestLike;
			const factory = new RFC9421SignatureBaseFactory(
				request,
			);
			expect(factory.requestHeaders).toEqual({
				date: ['Tue, 07 Jun 2014 20:51:35 GMT'],
				host: ['example.com'],
				'signature-input': [tinySignatureInput],
				'x-test': ['value', 'value2', ''],
			});
		});

		test('response basic', () => {
			const factory = new RFC9421SignatureBaseFactory(
				responseBase,
				undefined,
				{},
			);
			expect(factory).toBeInstanceOf(RFC9421SignatureBaseFactory);
			expect(factory.request).toBe(requestBase);
			expect(factory.requestHeaders).toEqual({
				host: 'example.com',
				date: 'Tue, 07 Jun 2014 20:51:35 GMT',
				'signature-input': tinySignatureInput,
			});
			expect(factory.response).toBe(responseBase);
			expect(factory.scheme).toBe('https');
			expect(factory.targetUri).toBe('https://example.com/resource/1');
			expect(factory.url.href).toBe('https://example.com/resource/1');
		});
	});

	describe('get', () => {
		describe('request', () => {
			test('derived with no query', () => {
				const factory = new RFC9421SignatureBaseFactory(
					requestBase,
					tinySignatureInput,
				);
				expect(() => factory.get('@signature-params')).toThrow();
				expect(factory.get('@method')).toBe('GET');
				expect(factory.get('"@method"')).toBe('GET');
				expect(factory.get('@authority')).toBe('example.com');
				expect(factory.get('@scheme')).toBe('https');
				expect(factory.get('@target-uri')).toBe('https://example.com/resource/1');
				expect(factory.get('@request-target')).toBe('https://example.com/resource/1');
				expect(factory.get('@path')).toBe('/resource/1');
				expect(factory.get('@query')).toBe('?');
				expect(() => factory.get('@query-param')).toThrow();
			});
			test('derived with query', () => {
				const request = {
					...requestBase,
					url: 'https://example.com/resource/1?foo=bar',
				} satisfies RequestLike;
				const factory = new RFC9421SignatureBaseFactory(
					request,
					tinySignatureInput,
				);
				expect(factory.get('@query')).toBe('?foo=bar');
				expect(factory.get('@query-param', new Map([['name', 'foo']]))).toBe('bar');
				expect(factory.get('@query-param', { name: 'foo' })).toBe('bar');
			});
			test('header', () => {
				const factory = new RFC9421SignatureBaseFactory(
					requestBase,
					tinySignatureInput,
				);
				expect(factory.get('host')).toBe('example.com');
				expect(factory.get('date')).toBe('Tue, 07 Jun 2014 20:51:35 GMT');

				expect(factory.get('host', { bs: true })).toBe(':ZXhhbXBsZS5jb20=:');
				expect(() => factory.get('host', { bs: true, sf: true })).toThrow();
			});
			test('trailer', () => {
				const request = {
					...requestBase,
					trailers: {
						'x-trailer': 'value',
					},
				} as RequestLike;
				const factory = new RFC9421SignatureBaseFactory(
					request,
					tinySignatureInput,
				);
				expect(factory.get('x-trailer', { tr: true })).toBe('value');
				expect(() => factory.get('date', { tr: true })).toThrow(`Header not found: "date";tr`);
			});
			test('header canonicalization', () => {
				const request = {
					...requestBase,
					headers: {
						...requestBase.headers,
						'x-obsolete-line-folding': 'value\n\tvalue   \n      value',
						'x-multi-value': ['value1', 'value2'],
						'x-single-array': ['value'],
					},
				} as RequestLike;
				const factory = new RFC9421SignatureBaseFactory(
					request,
					tinySignatureInput,
				);
				expect(factory.get('x-obsolete-line-folding')).toBe('value value value');
				expect(factory.get('x-multi-value')).toBe('value1, value2');
				expect(factory.get('x-multi-value', { bs: true })).toBe(':dmFsdWUx:, :dmFsdWUy:');
				expect(factory.get('x-single-array')).toBe('value');
			});
			test('sfv header', () => {
				const request = {
					...requestBase,
					headers: {
						...requestBase.headers,
						'x-item-string': '"value"',
						'x-item-token': 'token',
						'x-item-number-a': '123',
						'x-item-number-b': '123.456',
						'x-item-number-c': '-100',
						'x-item-true': '?1',
						'x-item-false': '?0',
						'x-item-binary': ':ZXhhbXBsZS5jb20=:',
						'x-item-with-param': 'value; param="foo"',
						'x-list': '("one" "two" "three")',
					},
				};
				const headerDictionary = {
					'x-item-string': 'item',
					'x-item-token': 'item',
					'x-item-number-a': 'item',
					'x-item-number-b': 'item',
					'x-item-number-c': 'item',
					'x-item-true': 'item',
					'x-item-false': 'item',
					'x-item-binary': 'item',
					'x-item-with-param': 'item',
					'x-list': 'list',
				} as const;
				const factory = new RFC9421SignatureBaseFactory(
					request,
					undefined,
					headerDictionary,
				);
				expect(factory.get('x-item-string')).toBe('"value"');
				expect(factory.get('x-item-token')).toBe('token');
				expect(factory.get('x-item-number-a')).toBe('123');
				expect(factory.get('x-item-number-b')).toBe('123.456');
				expect(factory.get('x-item-number-c')).toBe('-100');
				expect(factory.get('x-item-true')).toBe('?1');
				expect(factory.get('x-item-false')).toBe('?0');
				expect(factory.get('x-item-binary')).toBe(':ZXhhbXBsZS5jb20=:');
				expect(factory.get('x-item-with-param')).toBe('value; param="foo"');
				expect(factory.get('x-list')).toBe('("one" "two" "three")');
			});
			test('sfv dictionary', () => {
				const request = {
					...requestBase,
					headers: {
						...requestBase.headers,
						'unknown-dict': '  a=1,    b=2;x=1;y=2,   c=(a   b   c)  ',
						'example-dict': '  a=1,    b=2;x=1;y=2,   c=(a   b   c)  ',
					},
				} as RequestLike;
				const factory = new RFC9421SignatureBaseFactory(
					request,
					undefined,
					{ 'example-dict': 'dict' },
				);
				expect(() => factory.get('unknown-dict', { sf: true })).toThrow();
				expect(factory.get('example-dict')).toBe('a=1,    b=2;x=1;y=2,   c=(a   b   c)');
				expect(factory.get('example-dict', { sf: true })).toBe('a=1, b=2;x=1;y=2, c=(a b c)');
				expect(factory.get('example-dict', { key: 'a' })).toBe('1');
				expect(factory.get('example-dict', { key: 'b' })).toBe('2;x=1;y=2');
				expect(factory.get('example-dict', { key: 'c' })).toBe('(a b c)');
				expect(() => factory.get('example-dict', { key: 'c', sf: true } as any)).toThrow();
			});
		});
		describe('response', () => {
			test('header', () => {
				const factory = new RFC9421SignatureBaseFactory(
					responseBase,
					undefined,
					{},
				);
				expect(factory.get('date')).toBe('Tue, 07 Jun 2024 20:51:35 GMT');
				expect(factory.get('@method', { req: true })).toBe('GET');
				expect(factory.get('@status')).toBe('200');
				expect(factory.get('date', { req: true })).toBe('Tue, 07 Jun 2014 20:51:35 GMT');
			});
		});
	});
	describe('generate', () => {
		describe('request', () => {
			const input = {
				sig1: [
					[['date', {}], ['@authority', {}]],
					{ keyid: 'https://example.com/users/:id#main-key', algo: 'rsa-pss-sha512' },
				],
			} satisfies SFVSignatureInputDictionaryForInput;
			const request = {
				...requestBase,
				headers: {
					...requestBase.headers,
					'signature-input': convertSignatureParamsDictionary(input),
				},
			};
			test('simple', () => {
				const factory = new RFC9421SignatureBaseFactory(
					request,
				);
				expect(factory.generate('sig1')).toBe(
					`"date": ${requestBase.headers.Date}\n` +
					`"@authority": example.com\n` +
					`"@signature-params": ("date" "@authority");keyid="https://example.com/users/:id#main-key";algo="rsa-pss-sha512"`
				);
			});
			test('with requirecComponents', () => {
				const factory = new RFC9421SignatureBaseFactory(
					request,
					undefined,
					undefined,
					undefined,
					['date'],
				);
				expect(factory.generate('sig1')).toBe(
					`"date": ${requestBase.headers.Date}\n` +
					`"@authority": example.com\n` +
					`"@signature-params": ("date" "@authority");keyid="https://example.com/users/:id#main-key";algo="rsa-pss-sha512"`
				);
			});
			test('with requirecComponents (lacked required components)', () => {
				const factory = new RFC9421SignatureBaseFactory(
					request,
					undefined,
					undefined,
					undefined,
					['@path'],
				);
				expect(() => factory.generate('sig1')).toThrow('Required component not found: "@path"');
			});
		});
		test('response', () => {
			const input = {
				sig1: [
					[['date', {}], ['@authority', { req: true }]],
					{ keyid: 'https://example.com/users/:id#main-key', algo: 'rsa-pss-sha512' },
				],
			} satisfies SFVSignatureInputDictionaryForInput;
			const response = {
				...responseBase,
				headers: {
					...responseBase.headers,
					'signature-input': convertSignatureParamsDictionary(input),
				},
			};
			const factory = new RFC9421SignatureBaseFactory(
				response,
				undefined,
				{},
			);
			expect(factory.generate('sig1')).toBe(
				`"date": ${responseBase.headers.Date}\n` +
				`"@authority";req: example.com\n` +
				`"@signature-params": ("date" "@authority";req);keyid="https://example.com/users/:id#main-key";algo="rsa-pss-sha512"`
			);
		});
	});
});

describe('RFC 9421 component regressions', () => {
	const factoryFor = (url: string, method = 'GET') => new RFC9421SignatureBaseFactory({
		method, url, headers: { host: 'example.com', 'signature-input': 'sig=("@method")' },
	});

	test.each([
		['/path?param=value', 'POST', '/path?param=value'],
		['https://example.com/path?param=value', 'GET', 'https://example.com/path?param=value'],
		['example.com:80', 'CONNECT', 'example.com:80'],
		['*', 'OPTIONS', '*'],
		['/path?', 'GET', '/path?'],
		['//path?param=%2F#fragment', 'GET', '//path?param=%2F'],
	])('request-target preserves the RFC target form: %s', (url, method, expected) => {
		expect(factoryFor(url, method).get('@request-target')).toBe(expected);
	});

	test('Fetch requests derive an origin-form target with empty query preserved', () => {
		const request = new Request('https://example.com/path?', { headers: { 'signature-input': 'sig=("@method")' } });
		expect(new RFC9421SignatureBaseFactory(request).get('@request-target')).toBe('/path?');
	});

	test('a leading double slash is not a replacement authority', () => {
		const factory = factoryFor('//other.example/path');
		expect(factory.get('@authority')).toBe('example.com');
		expect(factory.get('@target-uri')).toBe('https://example.com//other.example/path');
	});

	test('method case is significant and absent queries use a question mark', () => {
		expect(factoryFor('/path', 'custom').get('@method')).toBe('custom');
		expect(factoryFor('/path').get('@query')).toBe('?');
		expect(factoryFor('/path?').get('@query')).toBe('?');
		expect(factoryFor('/path?foo=%2f').get('@query')).toBe('?foo=%2f');
	});

	test('query parameters use encoded names and values', () => {
		const factory = factoryFor('/path?var=this%20is%20a%20big%0Amultiline%20value&bar=with+plus+whitespace&fa%C3%A7ade%22%3A%20=something&plus=%2B&empty=');
		expect(factory.get('@query-param', { name: 'var' })).toBe('this%20is%20a%20big%0Amultiline%20value');
		expect(factory.get('@query-param', { name: 'bar' })).toBe('with%20plus%20whitespace');
		expect(factory.get('@query-param', { name: 'fa%C3%A7ade%22%3A%20' })).toBe('something');
		expect(factory.get('@query-param', { name: 'plus' })).toBe('%2B');
		expect(factory.get('@query-param', { name: 'empty' })).toBe('');
		expect(() => factory.get('@query-param', { name: 'missing' })).toThrow('Query parameter not found');
		expect(() => factory.get('@query-param', { name: true } as any)).toThrow('name not found or invalid');
	});

	test('matches the exact RFC 9421 section 2.2.8 multiline and encoded-name example', () => {
		const params = '("@query-param";name="var" "@query-param";name="bar" "@query-param";name="fa%C3%A7ade%22%3A%20")';
		const factory = new RFC9421SignatureBaseFactory({
			method: 'GET',
			url: '/parameters?var=this%20is%20a%20big%0Amultiline%20value&bar=with+plus+whitespace&fa%C3%A7ade%22%3A%20=something',
			headers: { host: 'www.example.com', 'signature-input': `sig=${params}` },
		});
		expect(factory.generate('sig')).toBe([
			'"@query-param";name="var": this%20is%20a%20big%0Amultiline%20value',
			'"@query-param";name="bar": with%20plus%20whitespace',
			'"@query-param";name="fa%C3%A7ade%22%3A%20": something',
			`"@signature-params": ${params}`,
		].join('\n'));
	});

	test.each(['/path?item=one&item=two', '/path?item=one&%69tem=two'])('repeated decoded query names are rejected: %s', url => {
		expect(() => factoryFor(url).get('@query-param', { name: 'item' })).toThrow('Repeated query parameter');
	});

	test('built-in and custom Structured Field types coexist', () => {
		const source = { ...requestBase, headers: { ...requestBase.headers, 'content-digest': 'sha-256=:AA==:', 'x-dict': 'a=1' } };
		const factory = new RFC9421SignatureBaseFactory(source, undefined, { 'x-dict': 'dict' });
		expect(factory.get('content-digest', { sf: true })).toBe('sha-256=:AA==:');
		expect(factory.get('content-digest', { key: 'sha-256' })).toBe(':AA==:');
		expect(factory.get('x-dict', { key: 'a' })).toBe('1');
	});

	test('dictionary members combine Node rawHeaders and native Fetch Headers', () => {
		const source = { ...requestBase, rawHeaders: ['Host', 'example.com', 'Signature-Input', 'sig=("@method")', 'Content-Digest', 'sha-256=:AA==:', 'Content-Digest', 'sha-512=:AQ==:'] };
		const factory = new RFC9421SignatureBaseFactory(source);
		expect(factory.get('content-digest', { key: 'sha-256' })).toBe(':AA==:');
		expect(factory.get('content-digest', { key: 'sha-512' })).toBe(':AQ==:');
		const request = new Request('https://example.com/', { headers: { 'signature-input': 'sig=("@method")', 'content-digest': 'sha-256=:AA==:' } });
		expect(new RFC9421SignatureBaseFactory(request).get('content-digest', { key: 'sha-256' })).toBe(':AA==:');
	});

	test('response bases do not require a signed initiating request', () => {
		const req = { method: 'GET', url: '/path', headers: { host: 'example.com' } };
		const response = { req, statusCode: 200, headers: { 'signature-input': 'sig=("@status" "@method";req)' } };
		expect(new RFC9421SignatureBaseFactory(response).generate('sig')).toBe('"@status": 200\n"@method";req: GET\n"@signature-params": ("@status" "@method";req)');
		const invalidRequestSignature = { ...response, req: { ...req, headers: { ...req.headers, 'signature-input': 'not a dictionary' } } };
		expect(new RFC9421SignatureBaseFactory(invalidRequestSignature).generate('sig')).toBe(new RFC9421SignatureBaseFactory(response).generate('sig'));
	});

	test('query-param on responses requires the request context marker', () => {
		const response = { req: { method: 'GET', url: '/?x=1', headers: { host: 'example.com' } }, statusCode: 200, headers: { 'signature-input': 'sig=("@status")' } };
		expect(() => new RFC9421SignatureBaseFactory(response).get('@query-param', { name: 'x' })).toThrow('must use with ;req');
	});
});
