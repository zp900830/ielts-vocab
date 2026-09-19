// 定向复核：can / might 的名词用法必须没被情态规则带走
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const VOCAB = JSON.parse(fs.readFileSync(ROOT + '/shadow/data/vocab.json', 'utf8'));
const SECTIONS = JSON.parse(fs.readFileSync(ROOT + '/shadow/data/sections.json', 'utf8'));
const accent = 'en-GB';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const src = fs.readFileSync(ROOT + '/shadow/index.html', 'utf8');
const block = src.slice(src.indexOf('function glossPhon'), src.indexOf('function refreshGloss'));
const { glossParts, verbLex } = new Function('VOCAB', 'accent', 'esc', 'SECTIONS',
  block + '\nreturn { glossParts, verbLex };')(VOCAB, accent, esc, SECTIONS);
const RE = /\[\[([^\]:]+):([^\]]+)\]\]/g;
const rows = [];
for (const ch of SECTIONS) for (const p of ch.paragraphs) for (const text of p) {
  const plain = text.replace(RE, '$2');
  let walk = 0, m; RE.lastIndex = 0;
  while ((m = RE.exec(text))) {
    const key = m[1].toLowerCase(), disp = m[2];
    if (key !== 'can' && key !== 'might') continue;
    const at = plain.toLowerCase().indexOf(disp.toLowerCase(), walk);
    if (at >= 0) walk = at + disp.length;
    const L = at >= 0 ? plain.slice(0, at) : '', R = at >= 0 ? plain.slice(at + disp.length) : plain;
    const g = glossParts(key, disp, L, R);
    rows.push({ key, gloss: g ? g.m : '', ctx: L.slice(-18) + '【' + disp + '】' + R.slice(0, 18) });
  }
}
console.log('verbLex 词条数', verbLex().size);
const noun = rows.filter(r => /[金属罐力量]/.test(r.gloss));
console.log('仍显示名词义的处数', noun.length);
noun.forEach(r => console.log('  ', r.key, r.gloss, '|', r.ctx));
console.log('can 总数', rows.filter(r => r.key === 'can').length, '| might 总数', rows.filter(r => r.key === 'might').length);
