// 离线复现行内小字的渲染：比较「按词取第一条义项」与「按句选义项」的差异
const fs = require('fs');
const path = require('path');
const path0 = require('path');
const ROOT = path0.resolve(__dirname, '..');
const VOCAB = JSON.parse(fs.readFileSync(path.join(ROOT, 'shadow/data/vocab.json'), 'utf8'));
const SECTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'shadow/data/sections.json'), 'utf8'));
const accent = 'en-GB';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function loadNew() {
  const src = fs.readFileSync(path.join(ROOT, 'shadow/index.html'), 'utf8');
  const i = src.indexOf('function glossPhon');
  const j = src.indexOf('function refreshGloss');
  if (i < 0 || j < 0 || j <= i) throw new Error('marker not found');
  const block = src.slice(i, j);
  return new Function('VOCAB', 'accent', 'esc', 'SECTIONS', block + '\nreturn { glossParts, glossHTML, guessPos, verbLex };')(VOCAB, accent, esc, SECTIONS);
}
function oldGloss(k) {
  const info = VOCAB[k] || null;
  if (!info || !info.m) return '';
  const parts = String(info.m).split(/[；;]/).map(s => s.trim()).filter(Boolean);
  const two = parts.slice(0, 2).join('；');
  return (two.length <= 12 ? two : parts[0]).slice(0, 12);
}

const { glossParts, guessPos } = loadNew();
const RE = /\[\[([^\]:]+):([^\]]+)\]\]/g;
let total = 0, changed = 0, lost = 0;
const byKey = new Map();
const rows = [];
for (const ch of SECTIONS) {
  const sents = [];
  for (const p of (ch.paragraphs || [])) for (const s of p) sents.push(s);
  for (const text of sents) {
    const plain = text.replace(RE, '$2');
    let walk = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(text))) {
      const key = m[1].toLowerCase(), disp = m[2];
      const at = plain.toLowerCase().indexOf(disp.toLowerCase(), walk);
      if (at >= 0) walk = at + disp.length;
      const L = at >= 0 ? plain.slice(0, at) : '';
      const R = at >= 0 ? plain.slice(at + disp.length) : plain;
      total++;
      const before = oldGloss(key);
      const g = glossParts(key, disp, L, R);
      const after = g ? g.m : '';
      if (!before) continue;
      if (before !== after) {
        changed++;
        byKey.set(key, (byKey.get(key) || 0) + 1);
        rows.push({ key, disp, before, after, ctx: L.slice(-26) + '【' + disp + '】' + R.slice(0, 26), guess: guessPos(disp, L, R) || '-' });
      }
    }
  }
}
console.log(JSON.stringify({ total, changed, uniqueKeys: byKey.size, invariantBroken: lost }));
if (process.argv[2] === '--detail') {
  const grp = new Map();
  for (const r of rows) {
    const sig = r.key + '|' + r.before + '=>' + r.after;
    if (!grp.has(sig)) grp.set(sig, { n: 0, sample: r });
    grp.get(sig).n++;
  }
  const list = [...grp.entries()].sort((a, b) => b[1].n - a[1].n);
  console.log('unique patterns: ' + grp.size);
  for (const [sig, v] of list) console.log(String(v.n).padStart(3) + '  ' + sig + '   e.g. ' + v.sample.ctx);
}
