// pretest guard: a stale `python3 -m http.server 8931` started from a foreign
// cwd serves the wrong directory, and playwright's `reuseExistingServer: true`
// would silently reuse it -> every test fails/hangs. Kill only a WRONG server;
// leave a healthy one (or no server) alone so webServer can start fresh.
const { execSync } = require('child_process');

const PORT = 8931;

async function main() {
  if (process.env.E2E_NO_SERVER) return;
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/index.html`);
    const text = res.ok ? await res.text() : '';
    // Marker unique to shadow/index.html (also asserts the served dir is right).
    if (res.ok && text.includes('影子跟读')) {
      console.log('[pretest] reusing healthy server on 8931');
      return;
    }
    console.log('[pretest] server on 8931 serves wrong content, killing it');
  } catch {
    console.log('[pretest] no usable server on 8931, clearing stale processes (if any)');
  }
  try {
    execSync(`pkill -f "http.server ${PORT}"`);
  } catch {
    /* nothing to kill */
  }
  await new Promise((r) => setTimeout(r, 1000));
}

main();
