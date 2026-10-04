// Persist the earlier temporary Chrome/CDP harness; no browser automation dependency.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

if (typeof WebSocket === 'undefined') throw new Error('Browser test runner requires Node 22 or newer');
const profile = await mkdtemp(join(tmpdir(), 'http-signatures-chrome-'));
let chrome;
let socket;
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./entry.js', import.meta.url))],
  bundle: true, platform: 'browser', format: 'iife', external: ['node:crypto'], write: false,
});
const server = createServer((request, response) => {
  if (request.url === '/bundle.js' || request.url === '/worker.js') {
    response.setHeader('Content-Type', 'application/javascript');
    response.end(bundle.outputFiles[0].contents);
  } else {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><title>HTTP signatures browser regressions</title><script src="/bundle.js"></script>');
  }
});
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  chrome = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, url], { stdio: ['ignore', 'ignore', 'pipe'] });
  let startupLog = '';
  chrome.stderr.on('data', chunk => { startupLog = (startupLog + chunk.toString()).slice(-4096); });
  let launchError;
  chrome.on('error', error => { launchError = error; });
  let port;
  for (let i = 0; i < 300; i++) {
    if (launchError) throw launchError;
    if (chrome.exitCode !== null || chrome.signalCode !== null) throw new Error(`Chrome exited during startup: ${startupLog}`);
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await delay(100); }
  }
  if (!port) throw new Error(`Chrome did not start within 30 seconds; set CHROME_BIN to the Chrome executable. ${startupLog}`);
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const tab = tabs.find(item => item.type === 'page' && item.url === url);
  if (!tab) throw new Error('Chrome test tab not found');
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  };
  async function evaluate(expression) {
    const requestId = ++id;
    const response = new Promise(resolve => pending.set(requestId, resolve));
    socket.send(JSON.stringify({ id: requestId, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Chrome evaluation timed out')), 5000); });
    return Promise.race([response.then(message => message.result.result.value), timeout]).finally(() => clearTimeout(timer));
  }
  let result;
  for (let i = 0; i < 300; i++) {
    result = await evaluate('globalThis.browserTestResult');
    if (result) break;
    await delay(100);
  }
  if (!result) throw new Error('Browser regressions timed out');
  console.log(JSON.stringify({ browser: await evaluate('navigator.userAgent'), ...result }, null, 2));
  if (result.error || result.main.failures.length || result.worker.failures.length) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  socket?.close();
  if (chrome?.pid && chrome.exitCode === null && chrome.signalCode === null) {
    const stopped = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill();
    await stopped;
  }
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
