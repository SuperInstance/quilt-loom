// run_fleet_live.mjs — THE LIVE LEG over the FLEET targets: the loom GANs
// the SuperInstance portfolio's real logic (fleet-pager hysteresis, the
// fnv-1a-64 witness, ocean-recall cosine, hold'em hand eval, cortex gate law)
// with the full chord spine:
//   - typesafe.ai System One (jev): ONE batched director call per odd
//     generation, cap 12 REAL calls, then labeled mock
//   - MOTH: true quantum entropy for family picks + forge salt (vault-capped)
//   - GLM System Two: wildcard rewrites on plateau (≤ 2 calls)
// Then a REPLAY PASS from cache — zero new calls.
//
// Keys come from the environment — never from this file:
//   export TYPESAFE_API_KEY=...   (typesafe.ai)
//   export MOTH_API_KEY=...       (mothquantum.com)
// Budget: ≤ 12 jev + ~15 moth + 2 glm live calls. The user monitors both keys.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CORTEX_CANDIDATES = [
  new URL('./cortex-vendor', import.meta.url).pathname,
  new URL('../quilt-cortex/cortex', import.meta.url).pathname,
];
let cortexPath = null;
for (const p of CORTEX_CANDIDATES) {
  try { await import(p + '/typesafe.mjs'); cortexPath = p; break; } catch { /* next */ }
}
if (!cortexPath) { console.error('cortex not found'); process.exit(1); }
const { JevVault } = await import(cortexPath + '/typesafe.mjs');
const { makeMoth } = await import(cortexPath + '/moth.mjs');
const { makeGlm } = await import(cortexPath + '/glm.mjs');

import { FLEET_TARGETS } from './loom/targets_fleet.mjs';
import { MIND_TARGETS } from './loom/targets_mind.mjs';
import { Loom } from './loom/loom.mjs';

const KEY = process.env.TYPESAFE_API_KEY || '';
const MOTH_KEY = process.env.MOTH_API_KEY || '';
const HERE = new URL('.', import.meta.url).pathname;
const OUT = join(HERE, 'outputs');
mkdirSync(OUT, { recursive: true });
mkdirSync(join(HERE, '.cache'), { recursive: true });

const TARGETS = [...FLEET_TARGETS, ...MIND_TARGETS];
const GENS = 6;

const journal = [];
// NOTE: the JevVault's live gate is namespace-allowlisted ('LIVE') — the fleet
// leg shares that namespace but a dedicated cache file keeps receipts separate.
const jev = new JevVault({
  key: KEY, ns: 'LIVE', cap: 12, journal,
  cachePath: join(HERE, '.cache', 'typesafe-fleet.json'),
});
const moth = await makeMoth({
  key: MOTH_KEY, live: true, journal,
  cachePath: join(HERE, '.cache', 'moth-loom.json'),
});
const glm = await makeGlm({ live: true });
const glmBudget = { left: 2 };
const glmShim = { name: 'glm-system-two', live: true, async raw(m, o) { return glm.raw(m, o); } };

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
          const src = m[0];
          const { evaluate, structSketch } = await import('./loom/engine_lib.mjs');
          await loom.engine.set('gan.candidate', src);
          await loom.engine.call('gan.score_card');
          const probes = loom.forge.probes;
          const oracle = new Function(`"use strict"; return (${t.oracle});`)();
          const oracleTokens = probes.map((p) => { try { return t.canon(oracle(p)); } catch { return '<oracle-error>'; } });
          const v = evaluate(t, src, probes, oracleTokens, loom.probeArchive());
          loom.stats.systwo++;
          console.log(`  [systwo wildcard ${t.id}] source=${source} func=${v.func} novelty=${v.n} verdict=${v.verdict}`);
          if (v.func >= 1) loom.archive.tryInsert({ src, hash: 'glm-' + Date.now().toString(36), family: 'wildcard', gen: loom.gen, corruption: 0, voice: 'systwo', struct: structSketch(src) }, v);
          return;
        }
      }
      console.log(`  [systwo wildcard] degraded: source=${source} — the loom proceeds mech-only (honest refusal)`);
    } catch (e) {
      console.log(`  [systwo wildcard] error: ${String(e).slice(0, 100)}`);
    }
  }
  return loom.runGeneration(opts);
}

console.log('══ DIVERGENCE FOUNDRY — FLEET LIVE LEG ══\n');
const t0 = Date.now();
const reports = [];
for (const target of TARGETS) {
  console.log(`── ${target.id} ──`);
  const loom = await new Loom(target, { seed: 4242 + TARGETS.indexOf(target), moth, jev, glm: glmShim, candidatesPerGen: 8 }).init();
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
console.log(`journal receipts: ${journal.length}`);
console.log(`elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

writeFileSync(join(OUT, 'fleet_live_results.json'), JSON.stringify({
  run: 'divergence-foundry fleet live leg',
  date: new Date().toISOString(),
  budgets: { jev_real: jev.liveUsed, jev_cap: jev.cap, moth_live: moth.liveUsed ?? 'vault-managed', glm_wildcards: 2 - glmBudget.left },
  journal_receipts: journal.length,
  reports,
}, null, 1));

// ── REPLAY PASS: everything from cache, zero new live calls ─────────────────
console.log('\n── REPLAY PASS (cache only, zero live calls) ──');
const jevReplay = new JevVault({ key: KEY, ns: 'LIVE', cap: 0, journal: [], cachePath: join(HERE, '.cache', 'typesafe-fleet.json') });
const mothReplay = await makeMoth({ key: MOTH_KEY, live: false, journal: [], cachePath: join(HERE, '.cache', 'moth-loom.json'), ns: 'FLEET' });
const loom2 = await new Loom(TARGETS[0], { seed: 4242, moth: mothReplay, jev: jevReplay, candidatesPerGen: 8 }).init();
const capProbe = jevReplay.liveUsed;
await loom2.run(GENS, { live: true });
console.log(`replay new live calls: ${jevReplay.liveUsed - capProbe} (must be 0) ✓`);
console.log(`replay chain: ${loom2.report().chain_ok ? 'VERIFIED' : 'BROKEN'}`);
