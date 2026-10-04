@misskey-dev/node-http-message-signatures
----

Implementation of [HTTP Signatures "Draft", RFC 9421](https://datatracker.ietf.org/doc/rfc9421/), [RFC 3230](https://datatracker.ietf.org/doc/rfc3230/) and [RFC 9530](https://datatracker.ietf.org/doc/rfc9530/) for JavaScript.

We initially started working on it with the intention of using it in Node.js, but since we rewrote it to Web Crypto API, it may also work in browsers and edge workers.

It was created for Misskey's ActivityPub implementation by the original authors, including mei23 and tamaina.

This fork is maintained at [joinmisskey/node-http-message-signatures](https://github.com/joinmisskey/node-http-message-signatures), based on [misskey-dev/node-http-message-signatures](https://github.com/misskey-dev/node-http-message-signatures). The npm package name remains `@misskey-dev/node-http-message-signatures`. The original MIT license and copyright notices are retained; this maintenance fork does not imply endorsement by the original authors or the Misskey organization.

See [RELEASING.md](./RELEASING.md) for build, test, and release preparation.

## Context
### HTTP Signatures "Draft" and RFC 9421
[RFC 9421](https://datatracker.ietf.org/doc/rfc9421/) is the standard used for signing HTTP communications, but has been used since draft in the world of ActivityPub server-to-server communications with Misskey, Mastodon, and others.
The title "HTTP Signatures" in the draft was changed to "HTTP Message Signatures" in the RFC.

This library allows both the draft and RFC to be used.

### RFC 3230 and RFC 9530
[RFC 3230](https://datatracker.ietf.org/doc/rfc3230/) and [RFC 9530](https://datatracker.ietf.org/doc/rfc9530/) are standards used for expressing the digest of the body of an HTTP communication. RFC 9530 was released at the same time as RFC 9421 and obsoletes RFC 3230.

Since ActivityPub also needs digest validation, this library also implements functions to create and validate digests.

## Comparison
### With http-signature
Previously, we used `http-signature` (`@peertube/http-signature` to be exact) to parse and verify (Draft) signatures, and this library replaces those implementations as well.

This is because `TritonDataCenter/node-sshpk` (formerly `joient/node-sshpk`), on which http-signature depends, is slower than `crypto`.

## ActivityPub Compatibility
One of the motivations for creating this package is to make Misskey compatible with the Ed25519 signature instead of RSA. In doing so, there is a need to ensure compatibility.

### HTTP Message Signatures Implementation Level
As a way of expressing the HTTP Message Signatures support status of software, I propose to express it as an implementation level (`string` of two-digit numbers).

~~Newer versions of Misskey have this string in `metadata.httpMessageSignaturesImplementationLevel` of nodeinfo.~~

|Level|Definition|
|:-:|:--|
|`00`|"Draft", RFC 3230, RSA-SHA256 Only|
|`01`|"Draft", RFC 3230, Supports multiple public keys and Ed25519|
|`10`|RFC 9421, RFC 9530, RSA-SHA256 Only|
|`11`|RFC 9421, RFC 9530, Supports multiple public keys and Ed25519|

### `additionalPublicKeys`
Misskey added the `additionalPublicKeys` property to Actor to allow it to have multiple public keys. This is an array of [publicKey](https://docs.joinmastodon.org/spec/activitypub/#publicKey)s.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
      {
        "Key": "sec:Key",
        "additionalPublicKeys": "misskey:additionalPublicKeys"
      }
  ],
  "id": "https://misskey.io/users/7rkrarq81i",
  "type": "Person",
  "publicKey": {
    "id": "https://misskey.io/users/7rkrarq81i#main-key",
    "type": "Key",
    "owner": "https://misskey.io/users/7rkrarq81i",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  },
  "additionalPublicKeys": [{
    "id": "https://misskey.io/users/7rkrarq81i#ed25519-key",
    "type": "Key",
    "owner": "https://misskey.io/users/7rkrarq81i",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  }]
}
```

## Usage

### Installation
```
npm install @misskey-dev/node-http-message-signatures
```

### Parse and verify
Parse and verify in fastify web server, implements ActivityPub inbox

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
(or set `CHROME_BIN`). It extends the earlier Chrome query regression harness,
using a temporary isolated profile and localhost server, then removes them.
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

### PKCS#1 private keys

`importPrivateKey` accepts unencrypted two-prime RSA PKCS#1 PEM/DER as well as PKCS#8. `parsePkcs1PrivateKey` validates the version-0 DER structure, and `genPkcs8FromPkcs1` returns a PKCS#8 wrapper. Encrypted keys, multiprime RSA, trailing bytes, negative/zero key integers, and nonminimal DER encodings are rejected. The default RSA signing algorithm remains RSASSA-PKCS1-v1_5 with SHA-256.

### RFC 9421 RSA-PSS

For RSA PEM keys, select `{ hash: "SHA-512", ec: "DSA", rsa: "RSA-PSS" }` in the signing source `defaults`. Existing RSA defaults are unchanged. Native RSA-PSS CryptoKeys must already bind SHA-512. Signing and verification use exactly 64 salt bytes and WebCrypto MGF1/SHA-512, as required by [RFC 9421 section 3.3.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.3.1). Restricted PSS SPKI/PKCS#8 parameters are checked before normalization: SHA-512, MGF1/SHA-512, trailer 1, and a minimum salt length no greater than 64. Absent parameters impose no restrictions; omitted hash/MGF fields in present parameters default to SHA-1 and are rejected. RSA-OAEP keys are not signature keys.

### JSON Web Keys

`importPublicJwk` and `importPrivateJwk` accept local `JsonWebKey` values; `importPublicKey`, `importPrivateKey`, and verification calls also accept them. Signing sources can use `{ keyId, privateKeyJwk }`. Supported keys are RSA, ECDSA P-256/P-384/P-521, and OKP Ed25519/Ed448 where the runtime supports them. Supported `alg` values are RS256/384/512, PS512, ES256/384/512, and EdDSA; omitted signing defaults derive from declared JWK algorithms, and conflicting explicit defaults are rejected. `use`, `key_ops`, `ext`, declared algorithms and curve bindings are checked. Public imports reject private or symmetric material. No JWK URL or JWKS fetching is performed.

### Public Multikey strings

Public-key string inputs recognize bounded `z`/base58btc Multikey encodings: Ed25519 (`ed01` plus exactly 32 bytes) and RSA (`8524` plus a strict PKCS#1 public DER structure). `decodePublicMultikey` exposes the corresponding SPKI bytes. Secret, unknown or noncanonical codecs, invalid lengths and malformed RSA are rejected without PEM fallback. Inputs are limited to 8192 characters and RSA DER to 4096 bytes. Other encodings and compressed EC codecs are outside this initial scope. These formats cover Ed25519 and legacy RSA federation keys; see [FEP-521a](https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md) and the [multicodec registry](https://github.com/multiformats/multicodec/blob/master/table.csv).
PEM/hex/base64 key strings are limited to 4 MiB before decoding; decoded and binary key inputs are limited to 1 MiB before generic ASN.1 parsing. These limits preserve normal PEM whitespace and typical key sizes. The strict DER reader for new key containers limits each field list to 64 entries; supported structures have at most nine.
