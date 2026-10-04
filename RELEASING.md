# Release preparation

The maintenance source is https://github.com/joinmisskey/node-http-message-signatures.
Keep the npm name `@misskey-dev/node-http-message-signatures`, the original authors,
and all MIT copyright/license notices. This fork does not transfer the source
repository or imply endorsement by its original maintainers.

## Validate the reviewed commit

Use an isolated checkout, Node.js supported by `package.json`, and the pinned
`pnpm@8.15.4`. CI covers Node 22 and 24 (supported LTS) and Node 26 (Current). Lint and
browser jobs use Node 24; the engines compatibility declaration is unchanged. No global tooling changes are needed
when a local pnpm installation is used.

```sh
pnpm install --frozen-lockfile
node --test scripts/release-info.test.mjs
pnpm eslint
pnpm build
node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand
node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand test/unit/draft-query.ts
pnpm run test:types
pnpm run test:browser
pnpm performance
pnpm run test:package
npm pack --pack-destination /tmp
```

Generated `dist/` is ignored and is not committed to Git. A fresh checkout has
source only: install the pinned development dependencies, then run `pnpm build`
before type checks or tests that import built files. Normal `npm pack` (and
`pnpm pack`) runs `prepack`, which invokes the existing build and regenerates
ESM, CommonJS and declarations. There is no install-time `prepare` hook. Direct
Git dependency installs are not a supported prebuilt distribution; use the npm
package or a reviewed, locally built tarball. Pack/build do not initialize any
native crypto thread pool.

The staging workflow keeps its explicit validated build and `npm pack
--ignore-scripts`; do not bypass that build. `pnpm run test:package` exercises
normal pack from source and imports the actual tarball through package exports
in ESM/CommonJS, including a Node subpath when declared.

Inspect the tarball: `dist/index.mjs`, `dist/index.cjs`, type declarations,
`dist/node/slacc.mjs`, `dist/node/slacc.cjs`, `dist/node/slacc.d.ts`,
`package.json`, README, and the unchanged LICENSE must be present. Confirm the
repository, bugs, and homepage metadata point to the fork. Smoke-test both the
ESM import and CommonJS require entry points. A browser check should bundle the
source for the browser and exercise native Web Crypto with RSA and Ed25519;
record unsupported browser algorithms explicitly.

Draft regression tests verify absolute-URL signatures against origin-form targets
using both this library and `@peertube/http-signature`. Queries retain their raw
encoding/order and an empty `?`; fragments are excluded. Existing no-query
signature fixtures and RFC 9421 component tests must still pass. The 1.0.0 release also includes reviewed RFC 9421 ECDSA/SFV verification,
RSA-PSS, PKCS#1 private keys, local JWK input, public Multikey input and
signer/verifier/resolver hooks. Multikey support covers Ed25519 and RSA only.
Chrome main-thread and DedicatedWorker WebCrypto are tested; Firefox, Safari
and Service Worker network/lifecycle behavior are not covered.

## Choose the release version and channel

Read registry state again immediately before deciding a version:

```sh
npm view @misskey-dev/node-http-message-signatures versions dist-tags --json
```

As of the 2026-10-04 release preflight, npm `latest` is publicly published
`1.0.0`; `1.1.0` is absent from published versions. The user selected stable
`1.1.0` and channel `latest` for reviewed PRs #10 (source-only build/pack) and
#9 (optional slacc 0.2.0 adapters), merged at
`1a3f79e7838bb70952c20b7be9d59dcfdc7395a0`. The release commit updates the
package version and these instructions; `dist/` stays untracked and is generated
during build/pack. Tag `v1.1.0` must point to that release commit.

Existing local npm access cannot list staged packages (`E401`). Repository tags,
releases and all staging-workflow history show no prior 1.1.0 attempt. The user
approved one attempt through the existing authenticated OIDC workflow; its result
is authoritative. If it reports an existing staged version, stop without replacing
it or retrying staging. Do not change credentials to bypass the failed lookup.
Read registry and staging history before any future release; never reuse an old
artifact or assume that a GitHub tag determines the npm package version.

A maintainer must choose an unused version and explicitly approve the dist-tag
(`latest` for a stable release or an agreed prerelease tag such as `beta`). npm
cannot reuse a published name/version. Change `package.json` in a separate
reviewed release commit, rerun validation, and pack that exact commit. Use
`npm stage publish --dry-run ./<reviewed-tarball>.tgz --access public --tag <approved-tag>`
to inspect the intended payload without publishing. Keep the scope unchanged.

## npm Trusted Publishing and staged approval

The selected release method is npm OIDC **staged publishing**. The workflow
`.github/workflows/npm-publish.yml` stages only; it never directly publishes,
approves a staged package, or executes `npm dist-tag`. The selected package version is
`1.1.0`, and the npm name remains `@misskey-dev/node-http-message-signatures`.

The owner registers the Trusted Publisher in npm package settings with:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization/user | `joinmisskey` |
| Repository | `node-http-message-signatures` |
| Workflow filename | `npm-publish.yml` (filename only) |
| Environment | Leave empty |
| Permissions | `npm stage publish`; `npm dist-tag` may remain selected but is unused |

Direct `npm publish` permission is unnecessary. The source repository's trust
configuration does not authorize this fork. No npm trust, credentials, package
permissions, or persistent authentication have been configured by this task.

The GitHub-hosted `ubuntu-latest` job keeps `contents: read` and `id-token: write`.
It pins Node `24.21.0` (24 LTS), npm `12.2.0`, and pnpm `8.15.4`. Node and npm meet
the staged-publishing minimums (Node 22.14 and npm 11.15). npm handles OIDC and
provenance; no npm token secret/env references are used. Dependencies and build
use pnpm, while pack/dry-run/staging use npm.

## Trigger the approved release staging run

Before staging, check published versions and available Staged Packages/history;
staged versions also reserve their version number. Follow the access-limited
preflight and single-attempt rule above for this approved 1.1.0 release. The selected
tag must reference the approved commit that includes this workflow and scripts.
The user has approved the 1.1.0 GitHub Release and npm staging. Owner approval
of the staged npm package remains a separate final action.

Choose exactly one trigger for the approved version:

- Publish a GitHub Release using the reviewed version tag. The trigger is
  `release: published`, so saving a draft does not stage anything. The release's
  prerelease flag must match the package version.
- Run the workflow manually from `main`, providing an existing reviewed
  `release_tag`, `dist_tag`, and `confirm_stage=true`. For example, after an
  approved `v1.1.0` tag exists:

  ```sh
  gh workflow run npm-publish.yml --repo joinmisskey/node-http-message-signatures --ref main -f release_tag=v1.1.0 -f dist_tag=latest -f confirm_stage=true
  ```

Tags must be exactly the package version, with an optional `v` prefix. The job
checks out that tag, verifies HEAD equals its commit and belongs to main history,
then checks the package name/version, confirmation, and channel. Stable versions
use `latest`; prereleases use their first identifier (`alpha`, `beta`, `rc`, or
`next`, for example `0.0.12-beta.1` uses `beta`). Manual channel mismatches fail.
Other prerelease channels and build metadata are rejected until explicitly
supported. Release events derive the same channel from the version.

The job runs the guard tests, frozen dependency install, lint, build, and unit
tests. It packs one tarball, checks its expected filename, and runs
`npm stage publish --dry-run` on it before staging **the same tarball**. For
`1.1.0` the artifact is
`misskey-dev-node-http-message-signatures-1.1.0.tgz`. Staging does not make that
version publicly installable. Pushes and PR merges never trigger staging.

## Owner review and final publication

After an approved staging run, the owner opens npm's **Staged Packages** tab and
reviews package/version, immutable dist-tag, artifact contents, integrity, and
provenance. The owner clicks **Approve** and completes npm 2FA to publish. The
owner may alternatively review with `npm stage view <stage-id>` and approve with
`npm stage approve <stage-id>` in their own authenticated environment. CI does
not perform that approval or log in on the owner's behalf.

Avoid triggering both release and manual staging for the same version. A staged
version cannot be restaged with a different tag; correction requires owner
rejection and a new approved staging run. After owner approval, verify npm
version/dist-tag, integrity, repository metadata, and ESM/CommonJS entry points.
No automatic dist-tag changes are configured.

Official references:

- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm staged publishing](https://docs.npmjs.com/staged-publishing/)
- [npm stage CLI](https://docs.npmjs.com/cli/v12/commands/npm-stage/)
