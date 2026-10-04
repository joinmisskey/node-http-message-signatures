# Release preparation

The maintenance source is https://github.com/joinmisskey/node-http-message-signatures.
Keep the npm name `@misskey-dev/node-http-message-signatures`, the original authors,
and all MIT copyright/license notices. This fork does not transfer the source
repository or imply endorsement by its original maintainers.

## Validate the reviewed commit

Use an isolated checkout, Node.js supported by `package.json`, and the pinned
`pnpm@8.15.4`. The inherited CI matrix covers Node 18, 20, and 21; Node 24 also
supports the Web Crypto RSA and Ed25519 tests. No global tooling changes are needed
when a local pnpm installation is used.

```sh
pnpm install --frozen-lockfile
pnpm eslint
pnpm build
pnpm run test --runInBand
pnpm run test --runInBand test/unit/draft-query.ts
pnpm performance
pnpm pack --pack-destination /tmp
```

Inspect the tarball: `dist/index.mjs`, `dist/index.cjs`, type declarations,
`package.json`, README, and the unchanged LICENSE must be present. Confirm the
repository, bugs, and homepage metadata point to the fork. Smoke-test both the
ESM import and CommonJS require entry points. A browser check should bundle the
source for the browser and exercise native Web Crypto with RSA and Ed25519;
record unsupported browser algorithms explicitly.

Draft regression tests verify absolute-URL signatures against origin-form targets
using both this library and `@peertube/http-signature`. Queries retain their raw
encoding/order and an empty `?`; fragments are excluded. Existing no-query
signature fixtures and RFC 9421 component tests must still pass. RFC 9421 code is
outside the scope of this fix.

## Choose the release version and channel

Read registry state again immediately before deciding a version:

```sh
npm view @misskey-dev/node-http-message-signatures versions dist-tags --json
```

At preparation time (2026-10-04), registry `latest` is `0.0.10`. The source main
commit `308c1e1630b77ef1c961e52e1af05a0e9df5e6d2` and source Git tag
`1.0.0-beta.1` both have package version `0.0.10`. A GitHub tag/release name does
not establish an npm package version. This fix intentionally does not bump it.

A maintainer must choose an unused version and explicitly approve the dist-tag
(`latest` for a stable release or an agreed prerelease tag such as `beta`). npm
cannot reuse a published name/version. Change `package.json` in a separate
reviewed release commit, rerun validation, and pack that exact commit. Use
`npm publish --dry-run ./<reviewed-tarball>.tgz --access public --tag <approved-tag>`
to inspect the intended payload without publishing. Keep the scope unchanged.

## Publishing gates — a later, separately approved action

No npm publish, GitHub release, workflow dispatch, credential creation, or
authentication changes are part of this preparation. Merge and publishing need
separate approval. npm write rights must be confirmed by the releasing maintainer;
GitHub repository permissions do not establish npm rights.

The inherited `.github/workflows/npm-publish.yml` publishes on a GitHub release
with activity type `created` or manual dispatch. It installs dependencies, builds,
and runs `pnpm publish --access public --no-git-checks --provenance`, using
`secrets.NODE_AUTH_TOKEN` and `id-token: write`. It does not run tests, verify a
tag/version match, or select a prerelease dist-tag. Do not use it for a beta as-is.
It is retained unchanged; do not create a release or dispatch it during review.

GitHub's Actions permissions API reported `enabled: true` for this fork on
2026-10-04; this task did not enable Actions or modify any grants. Recheck that
state before a release. The workflow listing returned no registered workflows,
and there were no workflow runs or PR checks after this branch was pushed; the
permissions setting alone does not establish that fork workflows will run. Fork
credentials/trusted publisher authorization are not assumed to exist and have
not been inspected or configured.

For a later CI release, a maintainer must review the publishing workflow and
authorize its exact repository/workflow/environment and authentication method.
The source repository's npm trusted publisher authorization, if any, does not
automatically authorize this fork. npm's current trusted publishing requirements
and CLI versions differ from this inherited workflow; review the official docs
before proposing changes. Keep tokens out of files, logs, commands, and PRs.

After explicit release approval, publish the reviewed tarball through the
approved method and selected dist-tag, then verify registry version, integrity,
repository metadata, and ESM/CommonJS entry points. Only create the corresponding
GitHub release once its publishing-trigger consequences have been approved.

Official references:

- [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/)
- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
