import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const packageName = '@misskey-dev/node-http-message-signatures';
const prereleaseChannels = ['alpha', 'beta', 'rc', 'next'];

export function releaseInfo(pkg, eventName, event) {
  if (pkg.name !== packageName) throw new Error('Unexpected npm package name');
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(pkg.version);
  if (!match) throw new Error('Expected a canonical release version without build metadata');
  const prerelease = match[4];
  if (prerelease?.split('.').some(part => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) {
    throw new Error('Prerelease numeric identifiers must not have leading zeros');
  }
  const channel = prerelease ? prerelease.split('.')[0] : 'latest';
  if (prerelease && !prereleaseChannels.includes(channel)) throw new Error('Unsupported prerelease channel');

  let tag;
  if (eventName === 'release') {
    if (event.action !== 'published' || event.release?.draft !== false) throw new Error('A published release is required');
    if (event.release.prerelease !== Boolean(prerelease)) throw new Error('Release prerelease flag disagrees with package version');
    tag = event.release.tag_name;
  } else if (eventName === 'workflow_dispatch') {
    if (event.inputs?.confirm_stage !== true && event.inputs?.confirm_stage !== 'true') throw new Error('Manual staging must be explicitly confirmed');
    if (event.inputs.dist_tag !== channel) throw new Error('Selected dist-tag disagrees with package version');
    tag = event.inputs.release_tag;
  } else {
    throw new Error('Staging is allowed only for a published release or manual dispatch');
  }
  if (tag !== pkg.version && tag !== `v${pkg.version}`) throw new Error('Selected release tag must match package version');
  return {
    release_tag: tag,
    version: pkg.version,
    dist_tag: channel,
    tarball: `misskey-dev-node-http-message-signatures-${pkg.version}.tgz`,
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const info = releaseInfo(pkg, process.env.GITHUB_EVENT_NAME, event);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(info).map(([key, value]) => `${key}=${value}\n`).join(''));
  }
  console.log(JSON.stringify(info));
}
