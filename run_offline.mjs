// run_offline.mjs — THE DIVERGENCE RUN (zero live calls, fully deterministic).
//
// 5 game-derived targets × 24 generations × 8 candidates = 960 logic
// specimens bred, probed, caught, crowned. The MOTH voice runs in labeled
// synthetic mode (mock:true — the OFF metronome); the jev director is
// offline-absent (its live role is exercised in run_live.mjs).
//
// Products:
//   outputs/results.json        — full per-target report + generation curve
//   outputs/trace.jsonl         — every candidate verdict, append-only
//   outputs/elites/<target>/…   — THE DURABLE LOGIC: one file per elite,
//                                 named by family + hash, ready to drop
//                                 into any quilt program cell

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { GRID_TARGETS } from './loom/targets_grid.mjs';
import { CARD_TARGETS } from './loom/targets_cards.mjs';
import { Loom } from './loom/loom.mjs';
import { mulberry32 } from './loom/receipts.mjs';

const HERE = new URL('.', import.meta.url).pathname;
const OUT = join(HERE, 'outputs');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'elites'), { recursive: true });

const GEN = 24;
const CAND = 8;

// synthetic MOTH — labeled quantum-mock packets (deterministic per tag)
function syntheticMoth() {
  return {
    mock: true,
    async packet(tag) {
      let h = 2166136261 >>> 0;
      for (const ch of tag) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
      const rng = mulberry32(h);
      const floats = Array.from({ length: 32 }, () => rng());
      return { floats, mock: true, source: 'synthetic-xorshift-seeded' };
    },
  };
}

const moth = syntheticMoth();
const TARGETS = [...GRID_TARGETS, ...CARD_TARGETS];
const t0 = Date.now();
const traceFd = [];
const reports = [];

for (const target of TARGETS) {
  const loom = await new Loom(target, { seed: 1337 + TARGETS.indexOf(target), moth, candidatesPerGen: CAND }).init();
  const curve = [];
  for (let g = 0; g < GEN; g++) {
    const s = await loom.runGeneration({ salt: g });
    curve.push({
      gen: s.gen, fakes: s.fakes, cand_n: s.cand_n, probes: s.probes, budget: s.budget,
      archive: s.archive, record: s.record, diversity: s.diversity, axis: s.axis, crowned: s.crowned_gen,
    });
  }
  // flush trace rows
  for (const t of loom.trace) {
    for (const row of t.rows) traceFd.push(JSON.stringify(row));
  }
  const rep = loom.report();
  rep.curve = curve;
  rep.elapsed_ms = Date.now() - t0;
  reports.push(rep);

  // persist the durable product: one file per elite
  const dir = join(OUT, 'elites', target.id);
  mkdirSync(dir, { recursive: true });
  rep.elites_src.forEach((e, i) => {
    const fname = `${String(i + 1).padStart(2, '0')}.${e.family}.${e.hash}.mjs`;
    const banner = [
      `// ${target.title} — elite specimen #${i + 1}`,
      `// family: ${e.family}   hash: ${e.hash}`,
      `// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)`,
      `// contract: ${target.spec}`,
      `export const solve = ${e.src.trim()};`,
      `export default solve;`,
    ].join('\n');
    writeFileSync(join(dir, fname), banner);
  });
}

writeFileSync(join(OUT, 'trace.jsonl'), traceFd.join('\n'));
const finalReports = {
  run: 'divergence-foundry offline',
  date: new Date().toISOString(),
  targets: reports.length,
  gens: GEN,
  candidates: GEN * CAND * reports.length,
  elapsed_ms: Date.now() - t0,
  reports,
};
writeFileSync(join(OUT, 'results.json'), JSON.stringify(finalReports, null, 1));

// ── human summary ──
console.log('══ DIVERGENCE FOUNDRY — OFFLINE RUN ══\n');
for (const r of reports) {
  const fams = [...new Set(r.archive.map((e) => e.family))];
  console.log(`${r.target.padEnd(14)} elites=${String(r.archive.length).padEnd(3)} record=${String(r.record).padEnd(8)} diversity=${String(r.diversity).padEnd(8)} families=${fams.length}/${r.archive.length} crownable=${r.stats.divergent + r.stats.alien} caught=${r.stats.caught} mimic=${r.stats.mimic}`);
}
const tot = reports.reduce((a, r) => ({
  caught: a.caught + r.stats.caught, div: a.div + r.stats.divergent, alien: a.alien + r.stats.alien, mimic: a.mimic + r.stats.mimic,
}), { caught: 0, div: 0, alien: 0, mimic: 0 });
console.log(`\ntotal: ${finalReports.candidates} candidates → ${tot.caught} caught fakes, ${tot.div + tot.alien} crowns, ${tot.mimic} mimics`);
console.log(`chain integrity: ${reports.every((r) => r.chain_ok) ? 'ALL VERIFIED' : 'BROKEN'}`);
console.log(`elapsed: ${(finalReports.elapsed_ms / 1000).toFixed(1)}s`);
