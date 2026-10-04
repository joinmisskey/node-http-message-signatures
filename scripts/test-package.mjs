import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(join(tmpdir(), 'http-signatures-pack-'));
try {
  // Normal pack deliberately exercises prepack; release staging separately packs after its checked build.
  execFileSync('npm', ['pack', '--pack-destination', temporary], { cwd: root, stdio: 'inherit' });
  const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const tarball = join(temporary, `${metadata.name.replace(/^@/, '').replace('/', '-')}-${metadata.version}.tgz`);
  execFileSync('tar', ['-xzf', tarball, '-C', temporary]);
  const packed = join(temporary, 'package');
  const manifest = JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8'));
  assert.equal(manifest.name, metadata.name);
  assert.equal(manifest.version, metadata.version);
  for (const path of ['dist/index.mjs', 'dist/index.cjs', 'dist/index.d.ts', 'LICENSE']) assert.ok(readFileSync(join(packed, path)).length > 0);
  assert.throws(() => readFileSync(join(packed, 'src/index.ts')), /ENOENT/);
  const hasNodeAdapter = Boolean(manifest.exports['./node/slacc']);
  if (hasNodeAdapter) for (const path of ['dist/node/slacc.mjs', 'dist/node/slacc.cjs', 'dist/node/slacc.d.ts']) assert.ok(readFileSync(join(packed, path)).length > 0);
  symlinkSync(join(root, 'node_modules'), join(packed, 'node_modules'), 'dir');
  const consumer = join(temporary, 'consumer');
  mkdirSync(join(consumer, 'node_modules', '@misskey-dev'), { recursive: true });
  symlinkSync(packed, join(consumer, 'node_modules', '@misskey-dev', 'node-http-message-signatures'), 'dir');
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
  const body = `
const { generateKeyPairSync } = await import('node:crypto');
const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = pair.privateKey.export({type:'pkcs8',format:'pem'}).toString();
const publicPem = pair.publicKey.export({type:'spki',format:'pem'}).toString();
for (const method of ['GET', 'POST']) {
  const request = {method,url:'https://example.com/inbox?encoded=%2F&x=1',headers:{host:'example.com'}};
  await api.signAsDraftToRequest(request,{keyId:'actor',privateKeyPem:pem},['(request-target)','host']);
  const parsed=api.parseRequestSignature(request);
  assert.ok(await api.verifyParsedSignature(parsed,publicPem));
  assert.ok(parsed.value.signingString.includes('/inbox?encoded=%2F&x=1'));
}
${hasNodeAdapter ? `
assert.equal(typeof adapter.createSlaccSigningKey,'function');
assert.equal(typeof adapter.createSlaccVerifier,'function');
const {sign,createPrivateKey,createPublicKey}=await import('node:crypto');
const binding={SignatureAlgorithmIdentifier:{Rsa2048_8192:'Rsa2048_8192',Eddsa:'Eddsa'},Signer:{fromPkcs8Der(suite,der){const privateKey=createPrivateKey({key:der,format:'der',type:'pkcs8'});return {publicKey:createPublicKey(privateKey).export({type:'pkcs1',format:'der'}),signRaw(payload,callback){callback(null,sign('sha256',payload,privateKey));}};}}};
const key=adapter.createSlaccSigningKey(binding,{keyId:'actor',version:'draft',algorithm:'rsa-v1_5-sha256',privateKey:pem});
const request={method:'GET',url:'https://example.com/path?q=1',headers:{host:'example.com'}};
await api.signAsDraftToRequest(request,key,['(request-target)','host']);
assert.ok(await api.verifyParsedSignature(api.parseRequestSignature(request),publicPem));
` : ''}
`;
  writeFileSync(join(consumer, 'esm.mjs'), `import assert from 'node:assert/strict';\nimport * as api from '${metadata.name}';\n${hasNodeAdapter ? `import * as adapter from '${metadata.name}/node/slacc';` : ''}\n${body}`);
  writeFileSync(join(consumer, 'commonjs.cjs'), `const assert=require('node:assert/strict');\nconst api=require('${metadata.name}');\n${hasNodeAdapter ? `const adapter=require('${metadata.name}/node/slacc');` : ''}\n(async()=>{${body}})().catch(error=>{console.error(error);process.exitCode=1;});`);
  for (const name of ['esm.mjs', 'commonjs.cjs']) execFileSync(process.execPath, [join(consumer, name)], { stdio: 'inherit' });
  writeFileSync(join(consumer, 'types.ts'), `import {signAsDraftToRequest, type CustomSigningKey} from '${metadata.name}';\n${hasNodeAdapter ? `import {createSlaccSigningKey} from '${metadata.name}/node/slacc';\nvoid createSlaccSigningKey;` : ''}\ndeclare const key:CustomSigningKey;\nvoid signAsDraftToRequest({method:'GET',url:'https://example.com/',headers:{}},key,['(request-target)']);`);
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2020', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--lib', 'esnext,dom,dom.iterable', join(consumer, 'types.ts')], { stdio: 'inherit' });
  console.log(`Packed artifact passed ESM/CommonJS signing and package-export types${hasNodeAdapter ? ', including Node slacc subpath' : ''}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
