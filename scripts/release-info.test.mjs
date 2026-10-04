import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseInfo } from './release-info.mjs';

const pkg = { name: '@misskey-dev/node-http-message-signatures', version: '0.0.11' };
const manual = (version = pkg.version, channel = 'latest', confirm = 'true') => ({ inputs: { release_tag: `v${version}`, dist_tag: channel, confirm_stage: confirm } });
const released = (version = pkg.version, prerelease = false) => ({ action: 'published', release: { tag_name: version, prerelease, draft: false } });

test('stable release and confirmed manual dispatch select latest and exact artifact', () => {
  for (const [name, event] of [['release', released()], ['workflow_dispatch', manual()]]) {
    const info = releaseInfo(pkg, name, event);
    assert.equal(info.version, '0.0.11');
    assert.equal(info.dist_tag, 'latest');
    assert.equal(info.tarball, 'misskey-dev-node-http-message-signatures-0.0.11.tgz');
  }
});

test('each supported prerelease uses its own channel for release and manual events', () => {
  for (const channel of ['alpha', 'beta', 'rc', 'next']) {
    const version = `0.0.12-${channel}.1`;
    const prerelease = { ...pkg, version };
    assert.equal(releaseInfo(prerelease, 'release', released(version, true)).dist_tag, channel);
    assert.equal(releaseInfo(prerelease, 'workflow_dispatch', manual(version, channel, true)).dist_tag, channel);
    assert.throws(() => releaseInfo(prerelease, 'workflow_dispatch', manual(version)), /dist-tag/);
    assert.throws(() => releaseInfo(prerelease, 'release', released(version, false)), /prerelease flag/);
  }
});

test('rejects version/tag mismatch, arbitrary refs and injected input', () => {
  for (const tag of ['v0.0.10', 'main', 'v0.0.11\nunsafe=value', 'v0.0.11;echo unsafe']) {
    const event = manual();
    event.inputs.release_tag = tag;
    assert.throws(() => releaseInfo(pkg, 'workflow_dispatch', event), /tag must match/);
  }
});

test('rejects unapproved event, draft release, or unconfirmed manual dispatch', () => {
  assert.throws(() => releaseInfo(pkg, 'push', {}), /allowed only/);
  assert.throws(() => releaseInfo(pkg, 'pull_request', {}), /allowed only/);
  assert.throws(() => releaseInfo(pkg, 'release', { ...released(), action: 'created' }), /published release/);
  assert.throws(() => releaseInfo(pkg, 'release', { ...released(), release: { ...released().release, draft: true } }), /published release/);
  for (const confirm of [false, 'false', null]) assert.throws(() => releaseInfo(pkg, 'workflow_dispatch', manual(pkg.version, 'latest', confirm)), /confirmed/);
  const missingConfirmation = manual();
  delete missingConfirmation.inputs.confirm_stage;
  assert.throws(() => releaseInfo(pkg, 'workflow_dispatch', missingConfirmation), /confirmed/);
});

test('rejects wrong package, unsupported channels and noncanonical versions', () => {
  assert.throws(() => releaseInfo({ ...pkg, name: '@joinmisskey/renamed' }, 'workflow_dispatch', manual()), /package name/);
  assert.throws(() => releaseInfo(pkg, 'workflow_dispatch', manual(pkg.version, 'beta')), /dist-tag/);
  assert.throws(() => releaseInfo(pkg, 'release', released(pkg.version, true)), /prerelease flag/);
  for (const version of ['01.0.0', '0.0.11+build', '0.0.11-beta.01', '0.0.11-preview.1']) {
    assert.throws(() => releaseInfo({ ...pkg, version }, 'workflow_dispatch', manual(version)), /canonical|leading zeros|channel/);
  }
});
