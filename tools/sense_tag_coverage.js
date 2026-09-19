// 统计：多义词条里「第二条义项到底有没有标词性」——用来解释为什么 910 处嫌疑只能改判 23 处
const fs = require('fs');
const ROOT = require('path').resolve(__dirname, '..');
const VOCAB = JSON.parse(fs.readFileSync(ROOT + '/shadow/data/vocab.json', 'utf8'));
const S = JSON.parse(fs.readFileSync(ROOT + '/shadow/data/sections.json', 'utf8'));
const src = fs.readFileSync(ROOT + '/shadow/index.html', 'utf8');
const blk = src.slice(src.indexOf('function glossPhon'), src.indexOf('function refreshGloss'));
const { senseTags } = new Function('VOCAB', 'accent', 'esc', blk + '\nreturn { senseTags };')(VOCAB, 'en-GB', s => s);

const TAG = /^\s*(n|v|vt|vi|a|adj|ad|prep|conj|num|pron)\./;
let markerSpots = 0, wordKinds = 0, single = 0, multiNoTag2nd = 0, multiTagged = 0;
let crossPOS = 0, spotsCross = 0;
const per = {};
for (const [k, e] of Object.entries(VOCAB)) {
  if (!e || !e.m) continue;
  wordKinds++;
  const parts = String(e.m).split(/[；;]/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) { single++; continue; }
  const explicit = parts.slice(1).some(p => TAG.test(p));
  const tags = senseTags(parts);
  const kinds = new Set(tags.filter(Boolean));
  if (!explicit) multiNoTag2nd++;
  else multiTagged++;
  if (kinds.size > 1) { crossPOS++; per[k] = tags; }
}
const RE = /\[\[([^\]:]+):([^\]]+)\]\]/g;
for (const ch of S) for (const p of ch.paragraphs) for (const t of p) {
  let m; RE.lastIndex = 0;
  while ((m = RE.exec(t))) { markerSpots++; if (per[m[1].toLowerCase()]) spotsCross++; }
}
console.log(JSON.stringify({
  vocabEntries: wordKinds, singleSense: single,
  multiSense_secondSenseUntagged: multiNoTag2nd, multiSense_secondSenseTagged: multiTagged,
  crossPOSKinds: crossPOS, markerSpots, markerSpotsOnCrossPOSWords: spotsCross,
}, null, 1));
