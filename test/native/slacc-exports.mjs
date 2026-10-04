import assert from 'node:assert/strict';
import { build } from 'esbuild';
import * as main from '@misskey-dev/node-http-message-signatures';
assert.equal('createSlaccSigningKey' in main, false);
const settings = { stdin: { contents: "import { signAsDraftToRequest } from '@misskey-dev/node-http-message-signatures'; console.log(signAsDraftToRequest);", resolveDir: process.cwd() }, bundle: true, platform: 'browser', external: ['node:crypto'], write: false, metafile: true, logLevel: 'silent' };
const browser = await build(settings);
assert.equal(Object.keys(browser.metafile.inputs).some(path => /slacc|\.node$|src\/node\//.test(path)), false);
await assert.rejects(build({ ...settings, stdin: { ...settings.stdin, contents: "import * as adapter from '@misskey-dev/node-http-message-signatures/node/slacc'; console.log(adapter);" } }), /not exported|conditions|resolve/);
console.log('Main browser bundle excludes slacc; Node-only subpath rejects browser resolution');
