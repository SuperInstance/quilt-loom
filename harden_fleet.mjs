// harden_fleet.mjs — THE WRITE-BACK: the loom's crowned logic returns to the
// fleet. For each fleet target, the surviving elites (offline + live legs,
// including GLM System-Two wildcards) are written into the host project as
// GAN-hardened modules with:
//   contract.mjs   — vendored spec + oracle + canon + frozen probe corpus
//                    (base probes + 200 deterministic genInput samples)
//   elite-NN.mjs   — one file per elite, provenance banner (family, hash,
//                    novelty, voice, generation)
//   verify.mjs     — self-contained equivalence run: every elite vs the
//                    oracle on the whole corpus + structural-distance receipt
// The host projects stay self-contained (no imports from quilt-loom), so the
// hardened logic is durable anywhere the repo is cloned.
//
// Run: node harden_fleet.mjs   (after run_offline.mjs / run_fleet_live.mjs)

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { mulberry32, fnv1a64 } from './loom/receipts.mjs';
import { FLEET_TARGETS } from './loom/targets_fleet.mjs';
import { MIND_TARGETS } from './loom/targets_mind.mjs';
import { structSketch, structDist } from './loom/engine_lib.mjs';

const HERE = new URL('.', import.meta.url).pathname;
const OUT = join(HERE, 'outputs');

const HOSTS = {
  pager_band:    { repo: '../quilt-tools',  dir: 'gan-elites/pager-band',    project: 'quilt-tools/01 fleet-pager (hysteresis paging bands)' },
  witness_fnv:   { repo: '../quilt-tools',  dir: 'gan-elites/witness-fnv',   project: 'quilt-tools/02 ledger-seal + ocean receipts (the witness idiom)' },
  cosine_sparse: { repo: '../quilt-tools',  dir: 'gan-elites/cosine-sparse', project: 'quilt-tools/03 ocean-recall (sparse integer cosine)' },
  hand_eval5:    { repo: '../quilt-arcade', dir: 'games/holdem/gan-elites',  project: 'quilt-arcade/games/holdem (5-card evaluation)' },
  gate_law:      { repo: '../quilt-quant',  dir: 'lab/gan-elites',           project: 'quilt-quant/lab (the chord gate law)' },
};

const TARGETS = [...FLEET_TARGETS, ...MIND_TARGETS];

// ── collect elites from both legs ────────────────────────────────────────────
function loadElites(file, label) {
  const p = join(OUT, file);
  if (!existsSync(p)) return [];
  const data = JSON.parse(readFileSync(p, 'utf8'));
  const out = [];
  for (const rep of data.reports || []) {
    (rep.elites_src || []).forEach((e, i) => {
      const meta = (rep.archive || [])[i] || {};
      out.push({
        target: rep.target, family: e.family, hash: e.hash, src: e.src,
        voice: meta.voice || 'mech', gen: meta.gen ?? null, novelty: meta.novelty ?? null,
        leg: label,
      });
    });
  }
  return out;
}
const pool = [...loadElites('fleet_live_results.json', 'live'), ...loadElites('results.json', 'offline')];

const receipts = { run: 'loom harden_fleet write-back', date: new Date().toISOString(), hosts: [] };
let written = 0;

for (const target of TARGETS) {
  const host = HOSTS[target.id];
  if (!host) continue;
  const elites = pool.filter((e) => e.target === target.id).slice(0, 4);
  if (!elites.length) { console.log(`${target.id}: no elites found — skip`); continue; }

  // freeze a deterministic corpus: base probes + 200 genInput samples
  const R = mulberry32(97531 + target.id.length);
  const corpus = [...target.baseProbes];
  let guard = 0;
  while (corpus.length < 200 + target.baseProbes.length && guard++ < 800) {
    corpus.push(target.genInput(R));
  }

  const dir = join(HERE, host.repo, host.dir);
  mkdirSync(dir, { recursive: true });

  // contract.mjs — vendored, self-contained
  const contractSrc = `// ${target.title} — contract, vendored by quilt-loom harden_fleet.mjs
// Host project: ${host.project}
// Contract spec: ${target.spec}
// The oracle is the reference implementation; every elite must agree with it
// on the ENTIRE frozen corpus (${corpus.length} probes). This file has zero
// imports — the hardened logic travels with its own judge.
export const CONTRACT = {
  id: ${JSON.stringify(target.id)},
  title: ${JSON.stringify(target.title)},
  spec: ${JSON.stringify(target.spec)},
  oracleSrc: ${JSON.stringify(target.oracle)},
  canonSrc: ${JSON.stringify(String(target.canon))},
  probes: ${JSON.stringify(corpus)},
};

export const oracle = new Function('"use strict"; return (' + CONTRACT.oracleSrc + ');')();
export const canon = new Function('"use strict"; return (' + CONTRACT.canonSrc + ');')();
`;
  writeFileSync(join(dir, 'contract.mjs'), contractSrc);

  // elite modules
  const imports = [];
  const pairs = [];
  elites.forEach((e, i) => {
    const fname = `elite-${String(i + 1).padStart(2, '0')}.mjs`;
    const banner = `// ${target.title} — GAN-HARDENED elite #${i + 1}
// bred by the quilt-loom Divergence Foundry (${e.leg} leg)
// family: ${e.family}   hash: ${e.hash}   voice: ${e.voice}   gen: ${e.gen}   novelty: ${e.novelty}
// contract: ${target.spec}
// provenance: outputs/elites/${target.id}/ + outputs/fleet_live_results.json
export const solve = ${e.src.trim()};
export default solve;
`;
    writeFileSync(join(dir, fname), banner);
    imports.push(`import { solve as s${i + 1} } from './${fname}';`);
    pairs.push(`  ['${fname}', s${i + 1}],`);
  });

  // verify.mjs — self-contained equivalence + structural-divergence receipt
  const verifySrc = `// verify.mjs — is the GAN-hardened logic STILL FUNCTIONING in place?
// Every elite runs against the vendored oracle on the full frozen corpus.
// Also reports the structural distance (token 3-gram Jaccard, alpha-renamed)
// between each elite and the oracle — proof of divergence, not mimicry.
// Zero imports beyond this directory. Exit 0 only if 100%% equivalent.
${imports.join('\n')}

import { CONTRACT, oracle, canon } from './contract.mjs';

const ELITES = [
${pairs.join('\n')}
];

function alphaTokens(src) {
  const toks = String(src).match(/=>|[A-Za-z_$][\\w$]*|\\d+(?:\\.\\d+)?|[{}()[\\];,.]|<=|>=|===|!==|&&|\\|\\||[+\\-*/%<>=!?:&|]/g) || [];
  const KW = new Set(['function','return','const','let','var','if','else','for','while','of','in','new','typeof','true','false','null','undefined','break','continue']);
  const map = new Map(); const out = []; let prevDot = false;
  for (const t of toks) {
    const ident = /^[A-Za-z_$][\\w$]*$/.test(t) && !KW.has(t);
    if (ident && !prevDot) { if (!map.has(t)) map.set(t, 'a' + map.size); out.push(map.get(t)); }
    else out.push(t);
    prevDot = t === '.';
  }
  return out;
}
function structDist(a, b) {
  const ga = new Set(), gb = new Set();
  const ta = alphaTokens(a), tb = alphaTokens(b);
  for (let i = 0; i + 3 <= ta.length; i++) ga.add(ta.slice(i, i + 3).join(' '));
  for (let i = 0; i + 3 <= tb.length; i++) gb.add(tb.slice(i, i + 3).join(' '));
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  const uni = ga.size + gb.size - inter;
  return uni ? +(1 - inter / uni).toFixed(4) : 0;
}

const corpus = CONTRACT.probes;
const want = corpus.map((p) => { try { return canon(oracle(p)); } catch { return '<oracle-error>'; } });

let checks = 0, ok = 0;
const rows = [];
for (const [name, fn] of ELITES) {
  let local = 0;
  corpus.forEach((p, i) => {
    checks++;
    let tok;
    try { tok = canon(fn(p)); } catch { tok = '<error>'; }
    if (tok === want[i]) { ok++; local++; }
    else if (local + 1 === corpus.length - [...corpus.slice(0, i + 1)].length) { /* unreachable */ }
  });
  const dist = structDist(CONTRACT.oracleSrc, String(fn));
  rows.push(\`\${name}: equivalence \${local}/\${corpus.length}  structural-distance-from-oracle \${dist}\`);
}

console.log('══ GAN-HARDENED LOGIC — in-place verification ══');
console.log('contract:', CONTRACT.title);
for (const r of rows) console.log('  ' + r);
console.log(\`TOTAL: \${ok}/\${checks} equivalence checks across \${ELITES.length} elites × \${corpus.length} probes\`);
if (ok !== checks) { console.log('VERDICT: BROKEN — an elite diverged from the oracle'); process.exit(1); }
console.log('VERDICT: ALL ELITES STILL FUNCTIONING — divergent in form, exact in behavior');
`;
  writeFileSync(join(dir, 'verify.mjs'), verifySrc);

  const receipt = {
    target: target.id, host: host.repo + '/' + host.dir, project: host.project,
    elites: elites.map((e) => ({ family: e.family, hash: e.hash, voice: e.voice, leg: e.leg, novelty: e.novelty })),
    corpus_size: corpus.length,
    seal: fnv1a64([target.id, elites.map((e) => e.hash).join(','), corpus.length].join('|')),
  };
  receipts.hosts.push(receipt);
  written += elites.length;
  console.log(`${target.id}: wrote ${elites.length} elites + contract + verify → ${host.repo}/${host.dir}`);
}

writeFileSync(join(OUT, 'hardening_receipts.json'), JSON.stringify(receipts, null, 1));
console.log(`\n${written} hardened elites across ${receipts.hosts.length} host projects — receipts sealed in outputs/hardening_receipts.json`);
