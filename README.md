@misskey-dev/node-http-message-signatures
----

A JavaScript library for signing and verifying HTTP messages using legacy HTTP Signatures ("Draft") and [RFC 9421](https://datatracker.ietf.org/doc/rfc9421/), with body-digest support for [RFC 3230](https://datatracker.ietf.org/doc/rfc3230/) and [RFC 9530](https://datatracker.ietf.org/doc/rfc9530/).

The default backend uses the Web Crypto API in Node.js, browsers and compatible edge runtimes. Algorithm availability depends on the runtime. Custom signing, verification and key-resolution hooks support application-owned backends; an optional Node.js adapter supports slacc.

It was created for Misskey's ActivityPub implementation by the original authors, including mei23 and tamaina.

This fork is maintained at [joinmisskey/node-http-message-signatures](https://github.com/joinmisskey/node-http-message-signatures), based on [misskey-dev/node-http-message-signatures](https://github.com/misskey-dev/node-http-message-signatures). The npm package name remains `@misskey-dev/node-http-message-signatures`. The original MIT license and copyright notices are retained; this maintenance fork does not imply endorsement by the original authors or the Misskey organization.

See [RELEASING.md](./RELEASING.md) for build, test, and release preparation.

## Context
### HTTP Signatures "Draft" and RFC 9421
[RFC 9421](https://datatracker.ietf.org/doc/rfc9421/) standardizes HTTP Message Signatures. Earlier HTTP Signatures drafts are still used by applications such as ActivityPub servers.


This library provides separate APIs for the legacy draft format and RFC 9421. Applications must select the format supported by their peers; the formats are not interchangeable.

### RFC 3230 and RFC 9530
[RFC 3230](https://datatracker.ietf.org/doc/rfc3230/) and [RFC 9530](https://datatracker.ietf.org/doc/rfc9530/) are standards used for expressing the digest of the body of an HTTP communication. RFC 9530 was released at the same time as RFC 9421 and obsoletes RFC 3230.

The library provides functions to create and validate both digest formats. Body-digest validation is separate from signature verification.

## Comparison
### With http-signature
This library supports parsing and verifying legacy draft signatures, as well as RFC 9421 signatures, using Web Crypto rather than the `sshpk` backend used by `http-signature`. It is not a drop-in replacement: review the request representation, algorithm policy and key-selection behavior when migrating. Performance depends on the runtime, algorithm and workload.

## ActivityPub Compatibility
ActivityPub applications can use this library with RSA or Ed25519 keys, subject to peer support. Key discovery, identity authorization and protocol negotiation remain application responsibilities. The following sections describe an experimental capability convention; they are not requirements for using the library.

### HTTP Message Signatures Implementation Level

`metadata.httpMessageSignaturesImplementationLevel` in NodeInfo is an experimental two-character capability marker. Its positions describe independent dimensions; it is not a numeric version or an ordered level:

- First character: `0` means HTTP Signatures "Draft" with RFC 3230 digests; `1` means RFC 9421 with RFC 9530 digests.
- Second character: `0` means legacy RSA `publicKey` / `publicKeyPem`; `1` means the deprecated `additionalPublicKeys` proposal; `2` means RSA/Ed25519 keys published through `assertionMethod` / `Multikey`.

Here, `x1` means `01` or `11`, and `x2` means `02` or `12`; neither `x1` nor `x2` is a literal NodeInfo value.

|Marker|Signature / digest family|Key discovery|
|:--:|:--|:--|
|`00`|"Draft", RFC 3230|Legacy RSA `publicKey` / `publicKeyPem`|
|`01`|"Draft", RFC 3230|Deprecated x1 `additionalPublicKeys` proposal|
|`02`|"Draft", RFC 3230|x2 `assertionMethod` / `Multikey`, RSA and Ed25519|
|`10`|RFC 9421, RFC 9530|Legacy RSA `publicKey` / `publicKeyPem`|
|`11`|RFC 9421, RFC 9530|Deprecated x1 `additionalPublicKeys` proposal|
|`12`|RFC 9421, RFC 9530|x2 `assertionMethod` / `Multikey`, RSA and Ed25519|

Applications using this convention should match recognized markers exactly rather than compare them numerically or lexically. Select only signature formats and key types supported by both peers. For example, a draft-only sender must not treat a peer's `12` advertisement as support for draft Ed25519 signatures. Missing, unknown or deprecated markers require an application-defined compatibility policy; do not silently reinterpret stored x1 values as x2 support.

This marker describes application capabilities. The library supports explicit draft and RFC 9421 APIs but does not fetch NodeInfo, negotiate a marker, authorize Actor keys, or implement full FEP-521a/Data Integrity processing automatically. Changing the key-publication dimension alone does not change the signature/digest family.

### `assertionMethod` / `Multikey` (x2)

Applications using the x2 convention publish public keys as embedded `assertionMethod` entries with `type: "Multikey"`, an exact Actor ID `controller`, and a `publicKeyMultibase` string. Include the `https://www.w3.org/ns/cid/v1` context for this representation. RSA uses the `rsa-pub` multicodec with PKCS#1 public DER; Ed25519 uses `ed25519-pub` with 32 public-key bytes. Applications may also retain a legacy RSA `publicKey` / `publicKeyPem` for peer compatibility. Key IDs and fragment names are application-defined; the example below uses `#ed25519-key`.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://www.w3.org/ns/cid/v1"
  ],
  "id": "https://social.example/users/alice",
  "type": "Person",
  "assertionMethod": [{
    "id": "https://social.example/users/alice#ed25519-key",
    "type": "Multikey",
    "controller": "https://social.example/users/alice",
    "publicKeyMultibase": "z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP"
  }]
}
```

This example shows an embedded Ed25519 key. See [Public Multikey strings](#public-multikey-strings) for supported codecs, limits, ownership checks and the library's string-input API. Referenced assertion methods require application-owned resolution and authorization.

### `additionalPublicKeys`

The older, withdrawn proposal used an `additionalPublicKeys` array of [legacy publicKey objects](https://docs.joinmastodon.org/spec/activitypub/#publicKey) with `owner` and `publicKeyPem`. It is deprecated, not an alternative name for `assertionMethod`. Use the [x2 representation](#assertionmethod--multikey-x2) for new integrations. Applications migrating existing data should consider whether historical JSON-LD contexts must be retained to verify previously signed documents; this compatibility handling is outside the library.

## Usage

### Installation
```
npm install @misskey-dev/node-http-message-signatures
```

### Parse and verify
Example: parse and verify a request in a Fastify server.

See [the usage (parse-and-verify-fastify.ts)](./test/unit/readme-usage/parse-and-verify-fastify.ts)

### Draft request targets

Draft signing and verification accept absolute URLs and origin-form request targets. For example, `https://example.com:8443/inbox?foo=bar#fragment` signs `(request-target): post /inbox?foo=bar` for a POST request. Queries retain their encoding and order, including an explicitly empty `?`; fragments are excluded. Include the actual `Host` header (such as `example.com:8443`) when signing `host`.

### Sign and Post

See [the usage (sign-and-post.ts)](./test/unit/readme-usage/sign-and-post.ts)


## Verification key selection

For RFC 9421 key maps, a matching signature label takes precedence over `keyid`.
If either selects a key, verification uses that key only. An explicit missing
`keyid` fails that signature. When there is no `keyid` or mapped label, the declared
algorithm may select candidates from the map; all candidates are tried until one
verifies. Malformed or incompatible candidates are skipped. `verifyAll: true`
requires every signature admitted by the algorithm allowlist to verify;
`verifyAll: false` accepts any admitted valid signature.

Custom Structured Field headers can be parsed with the same dictionary used to
sign them:

```ts
parseRequestSignature(request, {
  additionalSfvTypeDictionary: { 'x-example': 'dict' },
});
```

### PKCS#1 private keys

`importPrivateKey` accepts unencrypted two-prime RSA PKCS#1 PEM/DER as well as PKCS#8. `parsePkcs1PrivateKey` validates the version-0 DER structure, and `genPkcs8FromPkcs1` returns a PKCS#8 wrapper. Encrypted keys, multiprime RSA, trailing bytes, negative/zero key integers, and nonminimal DER encodings are rejected. The default RSA signing algorithm remains RSASSA-PKCS1-v1_5 with SHA-256.

### RFC 9421 RSA-PSS

For RSA PEM keys, select `{ hash: "SHA-512", ec: "DSA", rsa: "RSA-PSS" }` in the signing source `defaults`. Existing RSA defaults are unchanged. Native RSA-PSS CryptoKeys must already bind SHA-512. Signing and verification use exactly 64 salt bytes and WebCrypto MGF1/SHA-512, as required by [RFC 9421 section 3.3.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.3.1). Restricted PSS SPKI/PKCS#8 parameters are checked before normalization: SHA-512, MGF1/SHA-512, trailer 1, and a minimum salt length no greater than 64. Absent parameters impose no restrictions; omitted hash/MGF fields in present parameters default to SHA-1 and are rejected. RSA-OAEP keys are not signature keys.

### JSON Web Keys

`importPublicJwk` and `importPrivateJwk` accept local `JsonWebKey` values; `importPublicKey`, `importPrivateKey`, and verification calls also accept them. Signing sources can use `{ keyId, privateKeyJwk }`. Supported keys are RSA, ECDSA P-256/P-384/P-521, and OKP Ed25519/Ed448 where the runtime supports them. Supported `alg` values are RS256/384/512, PS512, ES256/384/512, and EdDSA; omitted signing defaults derive from declared JWK algorithms, and conflicting explicit defaults are rejected. `use`, `key_ops`, `ext`, declared algorithms and curve bindings are checked. Public imports reject private or symmetric material. No JWK URL or JWKS fetching is performed.

### Public Multikey strings

`PublicKeySource` accepts a public Multikey's `publicKeyMultibase` **string**, alongside PEM strings, CryptoKeys and local JWKs. This applies to `importPublicKey`, `parseAndImportPublicKey`, and the existing verification/key-resolver APIs. Passing an Actor or a whole Multikey document is not supported.

Supported values use `z`/base58btc with canonical multicodec prefixes:

- Ed25519 public key: codec `0xed`, encoded prefix bytes `ed 01`, followed by exactly 32 public-key bytes.
- RSA public key: codec `0x1205`, encoded prefix bytes `85 24`, followed by strict PKCS#1 public DER (at most 4096 bytes).

The complete encoded string is limited to 8192 characters. Secret/unknown codecs, noncanonical prefixes, invalid lengths and malformed RSA are rejected without PEM fallback. Other multibase encodings and compressed EC codecs are unsupported. `decodePublicMultikey` exposes the corresponding SPKI bytes. See [FEP-521a](https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md) and the [multicodec registry](https://github.com/multiformats/multicodec/blob/master/table.csv) for the formats.

An application can extract these strings from an actor's `assertionMethod`. It must first authenticate/authorize the actor document for the expected actor identity, confirm that the selected key belongs to that actor's assertion methods, and validate the key's `controller` and exact signature `keyId`. Matching strings in an untrusted document does not establish ownership. The application owns fetching, referenced-key dereferencing, redirect/SSRF policy, caching and key lifetime; the library does not fetch or resolve Actors automatically.

For example, using an already authorized actor document with an embedded Multikey (the public key below is a valid Ed25519 example):

```ts
import { parseRequestSignature, verifyParsedSignature } from '@misskey-dev/node-http-message-signatures';

// Fixture: in an application, obtain this document through your trusted actor-resolution policy.
const actor = {
  id: 'https://social.example/users/alice',
  assertionMethod: [{
    id: 'https://social.example/users/alice#ed25519-key',
    type: 'Multikey',
    controller: 'https://social.example/users/alice',
    publicKeyMultibase: 'z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP',
  }],
};
const expectedActorId = 'https://social.example/users/alice'; // Authorized message sender.
if (actor.id !== expectedActorId) throw new Error('Unexpected actor');
const valid = await verifyParsedSignature(parseRequestSignature(incomingRequest), {
  resolveKey: async ({ keyId }) => {
    const key = actor.assertionMethod.find(entry => entry.id === keyId);
    if (!key || key.type !== 'Multikey' || key.controller !== expectedActorId) return undefined;
    return key.publicKeyMultibase;
  },
});
```

The resolver returns the extracted string, not `actor` or `key`. For referenced assertion methods, resolve and authorize the referenced key in application code before this step. Multikey decoding alone does not implement FEP-521a/Actor processing, verify a data-integrity proof, or select the HTTP signature protocol: draft/RFC 9421 parsing, required-component/time checks and body-digest validation remain separate. No experimental implementation-level marker is required by this key-input API.

### Signature backends and asynchronous key resolution

Existing calls use WebCrypto by default. A custom signing key specifies `keyId`, a version-appropriate `signatureAlgorithm`, a fully specified `algorithm` operation, and a `signer` returning `Promise<Uint8Array>`. Its optional `privateKey` must match the operation; omitting it avoids PEM/WebCrypto import entirely. RFC sources can set `signer` individually; a call-level default signer is also available. Source signers take precedence over the call default. The callback receives version, label (RFC only), key ID, separate wire algorithm and validated operation, signing string, and optional CryptoKey. Operations exclude ECDH and invented Ed25519 prehashes; PSS requires SHA-512/salt 64.

```ts
await signAsRFC9421ToRequestOrResponse(request, {
  external: {
    key: {
      keyId: 'https://example.com/actor#key',
      signatureAlgorithm: 'rsa-v1_5-sha256',
      algorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      signer: async ({ signingString }) => externalRsaSigner(signingString),
    },
    identifiers: ['@method', '@target-uri', 'date'],
  },
  native: { key: { keyId: edKeyId, privateKey: edPrivateKey }, identifiers: ['@method', '@target-uri', 'date'] },
});
```

The additive verification overload accepts `{ keys?, resolveKey?, verifier?, logger? }`. A resolver receives `{ version, label?, keyId?, algorithm? }`, where `algorithm` is the optional wire identifier, and returns a key, candidate array, or `undefined`. The caller owns networking, cache, identity authorization and key lifetime. A supplied resolver is authoritative: `undefined` fails that signature and never falls back to `keys`. Malformed candidate imports can be skipped. A verifier receives the validated operation, wire identifier, signing string, signature bytes and optional public CryptoKey. Its `false` ends that signature without another backend/key attempt; other signatures may satisfy `verifyAll: false`. Callback exceptions propagate. `webCryptoSigner` and `webCryptoVerifier` are exported for mixed backend routing.

```ts
const parsed = parseRequestSignature(request, {
  requiredComponents: { rfc9421: ['@method', '@target-uri', 'date'] },
});
if (!await verifyDigestHeader(request, rawBody)) throw new Error('Invalid body digest');
const valid = await verifyParsedSignature(parsed, {
  resolveKey: async ({ keyId, label, algorithm }) => localKeyStore.resolve(keyId, label, algorithm),
  verifier: webCryptoVerifier,
});
```

`verifyParsedSignature` verifies the supplied parsed cryptographic base. Time and required-component checks remain in parsing; body digest validation remains a separate call. Hooks do not add or bypass those checks. Keyless verification requires a declared wire algorithm with unambiguous operation parameters (RFC supported algorithms, draft RSA/Ed25519/Ed448); draft ECDSA needs a resolved key for its curve. Algorithm allowlists and all-versus-any behavior remain in RFC verification.
PEM/hex/base64 key strings are limited to 4 MiB before decoding; decoded and binary key inputs are limited to 1 MiB before generic ASN.1 parsing. These limits preserve normal PEM whitespace and typical key sizes. The strict DER reader for new key containers limits each field list to 64 entries; supported structures have at most nine.

### Optional Node slacc adapters

The separate `@misskey-dev/node-http-message-signatures/node/slacc` entry point provides caller-injected adapters. The main entry point remains WebCrypto-based and contains no slacc import or runtime dependency. Install slacc in the consuming Node application only if using this entry point; slacc's platform-specific native binary must be available. slacc 0.2.0 requires Node `>=24 || ^23.6.0 || ^22.14.0`, independently of this package's broader engines declaration.

For slacc **0.2.0**, `createSlaccSigningKey(binding, { keyId, version, algorithm, privateKey })` supports `rsa-v1_5-sha256` and `ed25519`. `version` is required: draft keys use `rsa-sha256` / `ed25519-sha512` wire identifiers, while RFC 9421 keys use `rsa-v1_5-sha256` / `ed25519`. The Ed25519 draft identifier does not introduce a prehash. The returned key works with the corresponding existing high-level signing function. `createSlaccVerifier(binding, { algorithm, publicKey, version? })` verifies either version unless one is explicitly configured.

Keys are explicit PEM strings, Uint8Array/Buffer DER, or ArrayBuffer DER. Unencrypted version-0 PKCS#8 without attributes is supported; strict two-prime RSA PKCS#1 is normalized to PKCS#8. Public inputs accept SPKI or strict RSA PKCS#1. RSA keys must be 2048–8192 bits. Algorithm OIDs, container structure and key type are validated before native handle construction. CryptoKey, JWK, encrypted keys, RSA-PSS, ECDSA, Ed448 and unknown suites are rejected. Nonextractable CryptoKeys are never exported. Constructors retain native handles for reuse; they do not install slacc, initialize/reconfigure its shared pool, fetch keys or create global caches.

The verifier closes over one trusted public key and requires a **keyless context**. Use `{ verifier }` with no `keys`/`resolveKey`; supplying a CryptoKey in the context is rejected. High-level keyless verification requires an explicit, unambiguous wire algorithm; use the existing keyed WebCrypto path for omitted `alg` or ambiguous draft `hs2019`. A multi-key application must route by trusted key ID/label to the appropriate verifier itself and enforce identity authorization. No key lookup or network access is performed. Unsupported operations throw; callback errors propagate, false verification remains false, and there is no automatic backend fallback. If needed, callers explicitly route other operations to `webCryptoVerifier` before invoking an adapter.

These adapters target slacc **0.2.0**; the 0.1.5 `RsaKeyPair` API is not supported. Applications migrating from that API must update their own dependency and native signing calls. Initialize the shared pool once at application startup, then create and cache a signing key for the selected algorithm:

```ts
import * as slacc from 'slacc'; // application-owned slacc 0.2.0
import { createSlaccSigningKey } from '@misskey-dev/node-http-message-signatures/node/slacc';
import { signAsDraftToRequest, parseRequestSignature, verifyParsedSignature } from '@misskey-dev/node-http-message-signatures';

// Construct on a key-cache miss; keyAlgorithm is 'rsa-v1_5-sha256' or 'ed25519'.
const signingKey = createSlaccSigningKey(slacc, {
  keyId, version: 'draft', algorithm: keyAlgorithm, privateKey: privateKeyPem,
});
await signAsDraftToRequest(request, signingKey, ['(request-target)', 'host', 'date']);
// Incoming verification can keep the existing WebCrypto path.
const valid = await verifyParsedSignature(parseRequestSignature(incomingRequest), trustedRemotePublicKeyPem);
```

slacc's `init(threadCount)` must run once before signing/verifying; initialization stays caller-owned. The native API has no shutdown, cancellation or queue-limit controls. Avoid creating duplicate pools or handles per request. The adapters call `signRaw`/`verifyRaw` over the exact UTF-8 signature base; `*Parts` hashing is incompatible with HTTP signature bases and is never used. Generic arbitrary signer/verifier/resolver hooks remain available independently of this adapter.

Native tests execute slacc 0.2.0 in a separate process. Run the opt-in bounded benchmark with `pnpm performance:slacc`: it compares cold construction and warm reused handles with WebCrypto for RSA 2048/4096 and Ed25519 at concurrency 1/16, using one slacc thread by default. For a matched four-thread comparison, run `UV_THREADPOOL_SIZE=4 pnpm performance:slacc 4` in a fresh process. Results depend on workload and machine; no general speedup is promised. Browser and edge applications should import the main entry point, not the Node adapter.

Populate the caller-owned key cache with the factory result, then pass it directly to `signAsDraftToRequest`. Bind cache identity to key material, key ID and signature version, and invalidate on rotation/refresh. Construction and PEM parsing happen on cache misses, not on each signature. When signing in background workers, choose an appropriate key representation or trusted key reference for the queue, then resolve and cache the signing key in the worker. The adapter owns no global cache or thread pool.

## Development checks

```sh
pnpm install --frozen-lockfile
pnpm eslint
pnpm build
pnpm run test --runInBand
pnpm run test:browser
```

CI tests Node 22 and 24 (supported LTS) and Node 26 (Current). Lint and browser jobs use Node 24. This CI coverage does not change the package engines compatibility declaration.

The browser runner needs Node 22+ and Chrome available as `google-chrome`
(or set `CHROME_BIN`). It uses a temporary isolated profile and localhost server, then removes them.
The same verification cases run under Jest and native Chrome Web Crypto in the
main thread and a dedicated worker. They cover independent ECDSA P-256/P-384
signatures, PEM/CryptoKey verification, candidate selection, malformed/mixed keys,
allowlists, custom SFV, native Fetch Request signing, and draft RSA/Ed25519 query
regressions. Unsupported optional Ed25519 is reported as skipped. Firefox, Safari,
and Service Worker lifecycle/network integration are not covered by this harness.

The ECDSA/SFV corrections adapt Yuanyuan (Li-Yuanyuan)'s
[upstream PR #20](https://github.com/misskey-dev/node-http-message-signatures/pull/20),
with corrected algorithm propagation and key selection. The JSON example
indentation comes from Pichu Chen (PichuChen)'s
[upstream PR #19](https://github.com/misskey-dev/node-http-message-signatures/pull/19).


## Building from source

Generated `dist/` is not tracked in Git. Run `pnpm install --frozen-lockfile` and `pnpm build` before built-file tests or local use. Normal `npm pack`/`pnpm pack` regenerates the ESM/CommonJS files and type declarations through `prepack`; published packages include them. There is no install-time `prepare` hook. Use the npm package or a locally built tarball instead of treating a Git checkout as a prebuilt dependency. See [RELEASING.md](./RELEASING.md) for clean-checkout validation and staged publishing.
