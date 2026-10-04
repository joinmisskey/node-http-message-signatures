// Shared native-Web-Crypto regressions for Jest, Chrome main thread and workers.
export const verificationCaseNames = [
  'P-256 PEM and CryptoKey', 'P-384 PEM and CryptoKey', 'label and keyid selection',
  'same-algorithm fallback examines every PEM key', 'same-algorithm fallback examines every CryptoKey',
  'mixed and malformed fallback candidates', 'wrong curve and algorithm are rejected',
  'explicit missing or wrong keyid does not fall back', 'mapped label does not fall back',
  'verifyAll preserves all-versus-any policy', 'malformed signature does not reject valid alternatives',
  'fallback import is isolated per signature algorithm', 'algorithm allowlist is respected',
  'missing algorithm requires an identified key', 'custom SFV parsing and verification',
  'native Fetch Request signing and verification', 'pre-imported RSA keys enforce algorithm and hash',
  'RSA-PSS SHA-512 uses exactly 64 salt bytes', 'native JWK metadata and Ed25519 signing', 'Ed25519 public Multikey verification',
];

function assert(value, message) {
  if (!value) throw new Error(message);
}

export async function createVerificationCases(api, crypto) {
  const pairs = {};
  for (const curve of ['P-256', 'P-384']) {
    pairs[curve] = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: curve }, true, ['sign', 'verify']);
  }
  const wrong = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, true, ['sign', 'verify']);
  const rsa = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const pem = {};
  for (const [name, pair] of Object.entries({ ...pairs, wrong, rsa })) pem[name] = await api.exportPublicKeyPem(pair.publicKey);

  async function entry(pair, algorithm, hash, keyid, label = 'sig') {
    const params = `("@method");alg="${algorithm}"${keyid === undefined ? '' : `;keyid="${keyid}"`}`;
    const base = `"@method": POST\n"@signature-params": ${params}`;
    // Sign independently of the library's algorithm/default selection.
    const bytes = await crypto.subtle.sign({ name: pair.privateKey.algorithm.name, hash }, pair.privateKey, new TextEncoder().encode(base));
    return [label, { base, params, algorithm, keyid, signature: api.encodeArrayBufferToBase64(bytes) }];
  }
  const p256 = await entry(pairs['P-256'], 'ecdsa-p256-sha256', 'SHA-256');
  const p384 = await entry(pairs['P-384'], 'ecdsa-p384-sha384', 'SHA-384');
  const rsaEntry = await entry(rsa, 'rsa-v1_5-sha256', 'SHA-256', undefined, 'rsa');
  const mixed = [rsaEntry, ['ec', p384[1]]];
  const options = { verifyAll: true };
  const cases = {};
  const check = async (entries, keys, expected, opts = options) => {
    const actual = await api.verifyRFC9421Signature(entries, keys, opts);
    assert(actual === expected, `Expected verification ${expected}, got ${actual}`);
  };
  cases['P-256 PEM and CryptoKey'] = async () => {
    await check([p256], pem['P-256'], true);
    await check([p256], pairs['P-256'].publicKey, true);
  };
  cases['P-384 PEM and CryptoKey'] = async () => {
    await check([p384], pem['P-384'], true);
    await check([p384], pairs['P-384'].publicKey, true);
    assert(api.parseSignInfo('ecdsa-p384-sha384', pairs['P-384'].publicKey.algorithm).hash === 'SHA-384', 'P-384 must use SHA-384');
  };
  cases['label and keyid selection'] = async () => {
    await check([p384], new Map([['sig', pem['P-384']]]), true);
    const identified = await entry(pairs['P-384'], 'ecdsa-p384-sha384', 'SHA-384', 'actor-key');
    await check([identified], new Map([['actor-key', pairs['P-384'].publicKey]]), true);
  };
  cases['same-algorithm fallback examines every PEM key'] = () => check([p384], new Map([['wrong', pem.wrong], ['right', pem['P-384']]]), true);
  cases['same-algorithm fallback examines every CryptoKey'] = () => check([p384], new Map([['wrong', wrong.publicKey], ['right', pairs['P-384'].publicKey]]), true);
  cases['mixed and malformed fallback candidates'] = () => check([p384], new Map([
    ['malformed', 'not a public key'], ['RSA', pem.rsa], ['wrong-curve', pairs['P-256'].publicKey], ['wrong-key', pem.wrong], ['right', pem['P-384']],
  ]), true);
  cases['wrong curve and algorithm are rejected'] = async () => {
    for (const key of [pem['P-256'], pairs['P-256'].publicKey, pem.rsa, rsa.publicKey]) await check([p384], key, false);
    await check([['sig', { ...p384[1], algorithm: 'ecdsa-p256-sha256' }]], pairs['P-384'].publicKey, false);
    await check([['sig', { ...p384[1], algorithm: 'ed25519' }]], pem['P-384'], false);
  };
  cases['explicit missing or wrong keyid does not fall back'] = async () => {
    const identified = await entry(pairs['P-384'], 'ecdsa-p384-sha384', 'SHA-384', 'actor-key');
    for (const verifyAll of [true, false]) {
      await check([identified], new Map([['unrelated', pem['P-384']]]), false, { verifyAll });
      await check([identified], new Map([['actor-key', pem.wrong], ['unrelated', pem['P-384']]]), false, { verifyAll });
    }
  };
  cases['mapped label does not fall back'] = async () => {
    await check([p384], new Map([['sig', 'malformed'], ['right', pem['P-384']]]), false, { verifyAll: false });
    const identified = await entry(pairs['P-384'], 'ecdsa-p384-sha384', 'SHA-384', 'actor-key');
    await check([identified], new Map([['sig', pem.wrong], ['actor-key', pem['P-384']]]), false, { verifyAll: false });
  };
  cases['verifyAll preserves all-versus-any policy'] = async () => {
    const broken = ['bad', { ...p384[1], signature: 'AAAAAAAA' }];
    const keys = new Map([['bad', pem['P-384']], ['sig', pem['P-384']]]);
    await check([broken, p384], keys, false);
    await check([broken, p384], keys, true, { verifyAll: false });
    await check(mixed, new Map([['RSA', pem.rsa], ['EC', pem['P-384']]]), true);
    let threw = false;
    try { await api.verifyRFC9421Signature(mixed, pem.rsa, options); } catch { threw = true; }
    assert(threw, 'verifyAll with multiple signatures still requires a key map');
  };
  cases['malformed signature does not reject valid alternatives'] = async () => {
    const broken = ['bad', { ...p384[1], signature: '!' }];
    const keys = new Map([['bad', pem['P-384']], ['sig', pem['P-384']]]);
    await check([broken, p384], keys, true, { verifyAll: false });
    await check([broken, p384], keys, false);
  };
  cases['fallback import is isolated per signature algorithm'] = async () => {
    const keys = new Map([['RSA', pem.rsa], ['EC', pem['P-384']]]);
    await check(mixed, keys, true);
    await check([...mixed].reverse(), keys, true);
  };
  cases['algorithm allowlist is respected'] = async () => {
    await check([p384], pem['P-384'], false, { verifyAll: false, algorithms: ['ecdsa-p256-sha256'] });
    await check(mixed, new Map([['RSA', pem.rsa], ['EC', pem['P-384']]]), true, { verifyAll: true, algorithms: ['ecdsa-p384-sha384'] });
    await check([['sig', { ...p384[1], algorithm: 'ECDSA-P384-SHA384' }]], pem['P-384'], true);
  };
  cases['pre-imported RSA keys enforce algorithm and hash'] = async () => {
    const misdeclared = await entry(rsa, 'rsa-pss-sha512', 'SHA-256');
    await check([misdeclared], rsa.publicKey, false, { verifyAll: false, algorithms: ['rsa-pss-sha512'] });
    let threw = false;
    try { await api.parseAndImportPublicKey(rsa.publicKey, ['verify'], 'rsa-sha512'); } catch { threw = true; }
    assert(threw, 'A SHA-256-bound CryptoKey must not verify a declared SHA-512 signature');
  };
  cases['missing algorithm requires an identified key'] = async () => {
    const noAlgorithm = await entry(pairs['P-256'], 'ecdsa-p256-sha256', 'SHA-256');
    noAlgorithm[1].algorithm = undefined;
    await check([noAlgorithm], new Map([['unrelated', pem['P-256']]]), false);
    await check([noAlgorithm], new Map([['sig', pem['P-256']]]), true);
  };
  async function sfv(useFetchRequest) {
    const init = { method: 'POST', headers: { Host: 'example.com', 'X-Example': ' a=1 , b=?1 ' } };
    const request = useFetchRequest ? new Request('https://example.com/inbox?foo=bar', init) : { ...init, url: 'https://example.com/inbox?foo=bar' };
    await api.signAsRFC9421ToRequestOrResponse(request, { sig: {
      key: { privateKey: pairs['P-384'].privateKey, keyId: 'actor-key' },
      defaults: { hash: 'SHA-384', ec: 'DSA' },
      identifiers: ['@method', '@path', '@query', ['x-example', { sf: true }]],
    } }, { additionalSfvTypeDictionary: { 'x-example': 'dict' } });
    const parsed = api.parseRequestSignature(request, { additionalSfvTypeDictionary: { 'x-example': 'dict' } });
    assert(parsed.value[0][1].base.includes('"x-example";sf: a=1, b'), 'custom SFV must canonicalize consistently');
    assert(await api.verifyParsedSignature(parsed, new Map([['actor-key', pairs['P-384'].publicKey]])), 'custom SFV signature failed');
    let threw = false;
    try { api.parseRequestSignature(request); } catch { threw = true; }
    assert(threw, 'unknown custom SFV field must require a dictionary');
  }
  cases['custom SFV parsing and verification'] = () => sfv(false);
  cases['native Fetch Request signing and verification'] = () => sfv(true);
  cases['RSA-PSS SHA-512 uses exactly 64 salt bytes'] = async () => {
    const pair = await crypto.subtle.generateKey({ name: 'RSA-PSS', hash: 'SHA-512', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['sign', 'verify']);
    const request = { method: 'GET', url: 'https://example.com/pss?query=1', headers: { Host: 'example.com' } };
    const defaults = { hash: 'SHA-512', ec: 'DSA', rsa: 'RSA-PSS' };
    await api.signAsRFC9421ToRequestOrResponse(request, { pss: { key: { keyId: 'pss', privateKey: pair.privateKey }, defaults, identifiers: ['@method', '@target-uri'] } });
    const parsed = api.parseRequestSignature(request);
    assert(await api.verifyParsedSignature(parsed, pair.publicKey), 'PSS CryptoKey failed');
    const exported = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
    const pem = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...exported))}\n-----END PUBLIC KEY-----`;
    assert(await api.verifyParsedSignature(parsed, pem), 'PSS PEM failed');
    for (const saltLength of [0, 32, 65]) {
      const signature = new Uint8Array(await crypto.subtle.sign({ name: 'RSA-PSS', saltLength }, pair.privateKey, new TextEncoder().encode(parsed.value[0][1].base)));
      const bad = [['pss', { ...parsed.value[0][1], signature: btoa(String.fromCharCode(...signature)) }]];
      assert(!await api.verifyRFC9421Signature(bad, pair.publicKey), 'Wrong PSS salt accepted');
    }
  };
  cases['native JWK metadata and Ed25519 signing'] = async () => {
    const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    const privateKeyJwk = { ...await crypto.subtle.exportKey('jwk', pair.privateKey), alg: 'EdDSA', use: 'sig' };
    const pub = { ...await crypto.subtle.exportKey('jwk', pair.publicKey), alg: 'EdDSA', use: 'sig' };
    const request = { method: 'POST', url: 'https://example.com/jwk?q=1', headers: { Host: 'example.com' } };
    await api.signAsRFC9421ToRequestOrResponse(request, { jwk: { key: { keyId: 'jwk', privateKeyJwk }, identifiers: ['@method', '@target-uri'] } });
    const parsed = api.parseRequestSignature(request);
    assert(await api.verifyParsedSignature(parsed, pub), 'Ed25519 JWK failed');
    for (const changes of [{ use: 'enc' }, { key_ops: ['sign'] }, { d: privateKeyJwk.d }, { alg: 'RS256' }]) {
      assert(!await api.verifyParsedSignature(parsed, { ...pub, ...changes }), 'Incompatible JWK accepted');
    }
  };
  cases['Ed25519 public Multikey verification'] = async () => {
    const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    const bytes = new Uint8Array([0xed, 1, ...raw]);
    let value = BigInt('0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''));
    let encoded = '';
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    while (value) { encoded = alphabet[Number(value % 58n)] + encoded; value /= 58n; }
    const request = { method: 'GET', url: 'https://example.com/multikey?q=1', headers: { Host: 'example.com' } };
    await api.signAsRFC9421ToRequestOrResponse(request, { multi: { key: { keyId: 'multi', privateKey: pair.privateKey }, identifiers: ['@method', '@target-uri'] } });
    assert(await api.verifyParsedSignature(api.parseRequestSignature(request), 'z' + encoded), 'Multikey verification failed');
  };
  return cases;
}
