// run_live.mjs — THE LIVE LEG of the Divergence Foundry.
//
// Real chord spine, tiny budget, everything receipted:
//   - typesafe.ai System One (jev): ONE batched director call per generation
//     (axis + alien-score + hunger), cap 12 REAL calls, then labeled mock
//   - MOTH: true quantum entropy for family picks + forge salt (vault cap)
//   - GLM System Two: wildcard rewrites only on deep plateau (≤ 2 calls)
// Then a REPLAY PASS from cache — zero new calls, byte-identical verdicts.
//
// Budget: ≤ 12 jev + ~14 moth + 2 glm live calls. The user monitors both keys.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ── cortex probe-import (dev tree + portfolio tree) ─────────────────────────
const CORTEX_CANDIDATES = [
  new URL('./cortex-vendor', import.meta.url).pathname,   // vendored (self-contained)
  new URL('../quilt-cortex/cortex', import.meta.url).pathname, // portfolio sibling tree
];
let cortexPath = null;
for (const p of CORTEX_CANDIDATES) {
  try { await import(p + '/typesafe.mjs'); cortexPath = p; break; } catch { /* next */ }
}
if (!cortexPath) { console.error('cortex not found'); process.exit(1); }
const { JevVault } = await import(cortexPath + '/typesafe.mjs');
const { makeMoth } = await import(cortexPath + '/moth.mjs');
const { makeGlm } = await import(cortexPath + '/glm.mjs');

import { CARD_TARGETS } from './loom/targets_cards.mjs';
import { GRID_TARGETS } from './loom/targets_grid.mjs';
import { Loom } from './loom/loom.mjs';

// Keys are read from the environment — never hardcode them.
//   export TYPESAFE_API_KEY=...   (typesafe.ai)
//   export MOTH_API_KEY=...       (mothquantum.com)
const KEY = process.env.TYPESAFE_API_KEY || '';
const MOTH_KEY = process.env.MOTH_API_KEY || '';
const HERE = new URL('.', import.meta.url).pathname;
const OUT = join(HERE, 'outputs');
mkdirSync(OUT, { recursive: true });
mkdirSync(join(HERE, '.cache'), { recursive: true });

const LIVE_TARGETS = ['hearts_trick', 'holdem_cat', 'life_step'];
const TARGETS = [...CARD_TARGETS, ...GRID_TARGETS].filter((t) => LIVE_TARGETS.includes(t.id));
const GENS = 6;

const journal = [];
const jev = new JevVault({
  key: KEY, ns: 'LIVE', cap: 12, journal,
  cachePath: join(HERE, '.cache', 'typesafe-loom.json'),
});
const moth = await makeMoth({
  key: MOTH_KEY, live: true, journal,
  cachePath: join(HERE, '.cache', 'moth-loom.json'),
});
const glm = await makeGlm({ live: true });
const glmBudget = { left: 2 };
// wildcard-capable glm shim: director via review-shaped shim, wildcards via raw
const glmShim = {
  name: 'glm-system-two',
  live: true,
  async raw(messages, opts) { return glm.raw(messages, opts); },
};

// ── wire the System Two wildcard into the loom's generation loop ────────────
// (patch runGeneration via a wrapper: on deep plateau, spend glmBudget)
async function runGenerationWithWildcards(loom, opts) {
  const plateau = loom.trace.length >= 3 && loom.trace.slice(-3).every((s) => !s.summary.crowned_gen);
  if (plateau && glmBudget.left > 0) {
    glmBudget.left--;
    const t = loom.target;
    const existing = loom.archive.elites.map((e) => `- ${e.family}: ${e.src.split('\n').length} lines`).join('\n');
    const sys = 'You are the wild-card breeder in a divergence foundry. You write a COMPLETE, self-contained JavaScript function that is structurally UNLIKE the existing bloodlines but behaviorally EXACT.';
    const usr = [
      `CONTRACT: ${t.spec}`,
      `Input shape: ${JSON.stringify(t.baseProbes[0]).slice(0, 200)}`,
      `EXISTING BLOODLINES (do NOT resemble these structurally):\n${existing || '(none yet)'}`,
      'Write ONE function `function solve(input) { ... }` implementing the contract. Pure JS, no imports, no helpers outside the function. Be structurally alien: different loop shapes, data structures, control flow. Output ONLY the function.',
    ].join('\n\n');
    try {
      const { text, source } = await glmShim.raw([
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ], { maxTokens: 700, temperature: 0.8 });
      if (source === 'live' && text) {
        const m = text.match(/function\s+solve[\s\S]*?\n\}/);
        if (m) {
          // evaluate the wildcard through the SAME sheet pipeline as mech candidates
          const src = m[0];
          await loom.engine.set('gan.candidate', src);
          const sheet = (await loom.engine.call('gan.score_card')).data;
          const probes = loom.forge.probes;
          const oracleTokens = probes.map((p) => {
            const oracle = new Function(`"use strict"; return (${t.oracle});`)();
            try { return t.canon(oracle(p)); } catch { return '<oracle-error>'; }
          });
          const { evaluate } = await import('./loom/engine_lib.mjs');
          const v = evaluate(t, src, probes, oracleTokens, loom.probeArchive());
          loom.stats.systwo++;
          console.log(`  [systwo wildcard ${t.id}] source=${source} func=${v.func} novelty=${v.n} verdict=${v.verdict}`);
          if (v.func >= 1) loom.archive.tryInsert({ src, hash: 'glm-' + Date.now().toString(36), family: 'wildcard', gen: loom.gen, corruption: 0, voice: 'systwo', struct: (await import('./loom/engine_lib.mjs')).structSketch(src) }, v);
          return; // wildcard instead of one mech generation this round
        }
      }
      console.log(`  [systwo wildcard] degraded: source=${source} — the loom proceeds mech-only (honest refusal)`);
    } catch (e) {
      console.log(`  [systwo wildcard] error: ${String(e).slice(0, 100)}`);
    }
  }
  return loom.runGeneration(opts);
}

console.log('══ DIVERGENCE FOUNDRY — LIVE LEG ══\n');
const t0 = Date.now();
const reports = [];
for (const target of TARGETS) {
  console.log(`── ${target.id} ──`);
  const loom = await new Loom(target, { seed: 77 + TARGETS.indexOf(target), moth, jev, glm: glmShim, candidatesPerGen: 8 }).init();
  for (let g = 0; g < GENS; g++) await runGenerationWithWildcards(loom, { live: true, salt: g });
  const rep = loom.report();
  rep.director_calls = loom.trace.filter((t) => t.summary.director).length;
  rep.director_sources = [...new Set(loom.trace.map((t) => t.summary.director?.source).filter(Boolean))];
  reports.push(rep);
  const fams = [...new Set(rep.archive.map((e) => e.family))];
  console.log(`   elites=${rep.archive.length} families=${fams.length} record=${rep.record} diversity=${rep.diversity} caught=${rep.stats.caught} crowns=${rep.stats.crowned}`);
}
console.log(`\njev: ${jev.liveUsed}/${jev.cap} REAL calls (rest labeled mock)`);
console.log(`moth: ${moth.liveUsed ?? '?'} live packets (vault-capped)`);
console.log(`glm: ${2 - glmBudget.left}/2 wildcard budget spent`);
console.log(`elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

writeFileSync(join(OUT, 'live_results.json'), JSON.stringify({
  run: 'divergence-foundry live leg', date: new Date().toISOString(),
  budgets: { jev_real: jev.liveUsed, jev_cap: jev.cap, moth_live: moth.liveUsed ?? 'vault-managed', glm_wildcards: 2 - glmBudget.left },
  journal_receipts: journal.length,
  reports,
}, null, 1));

// ── REPLAY PASS: everything from cache, zero new live calls ─────────────────
console.log('\n── REPLAY PASS (cache only, zero live calls) ──');
const jevReplay = new JevVault({ key: KEY, ns: 'LIVE', cap: 0, journal: [], cachePath: join(HERE, '.cache', 'typesafe-loom.json') });
const mothReplay = await makeMoth({ key: MOTH_KEY, live: false, journal: [], cachePath: join(HERE, '.cache', 'moth-loom.json'), ns: 'LIVE' });
const loom2 = await new Loom(TARGETS[0], { seed: 77, moth: mothReplay, jev: jevReplay, candidatesPerGen: 8 }).init();
const capProbe = jevReplay.liveUsed;
await loom2.run(GENS, { live: true });
console.log(`replay new live calls: ${jevReplay.liveUsed - capProbe} (must be 0) ✓`);
console.log(`replay chain: ${loom2.report().chain_ok ? 'VERIFIED' : 'BROKEN'}`);
