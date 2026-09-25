// smoke.mjs — offline sanity for the Divergence Foundry (zero live calls).
// 1. every pristine family render is CORRECT (agrees with oracle on base
//    probes) — templates must be born functional
// 2. oracle determinism + canon stability
// 3. one full Loom generation per target: sheet scores, listeners react,
//    archive books, chain seals
// 4. the forge hardens under pressure; scars accumulate
import { GRID_TARGETS } from './loom/targets_grid.mjs';
import { CARD_TARGETS } from './loom/targets_cards.mjs';
import { FLEET_TARGETS } from './loom/targets_fleet.mjs';
import { MIND_TARGETS } from './loom/targets_mind.mjs';
import { compile, runProbes, evaluate, structSketch, structDist } from './loom/engine_lib.mjs';
import { Loom } from './loom/loom.mjs';
import { sealChain, verifyChain } from './loom/receipts.mjs';

const CHECKS = [];
const check = (name, ok, detail = '') => {
  CHECKS.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const TARGETS = [...GRID_TARGETS, ...CARD_TARGETS, ...FLEET_TARGETS, ...MIND_TARGETS];

// ── 1. pristine family renders must be born functional ──
for (const t of TARGETS) {
  const oracle = compile(t.oracle);
  check(`${t.id}: oracle compiles`, !!oracle);
  const probes = t.baseProbes;
  const oTok = probes.map((p) => t.canon(oracle(p)));
  let bornOK = 0, bornTotal = 0, baitCompiled = 0;
  for (const fam of t.families) {
    const fn0 = compile(fam.render(() => 0.5, 0));
    if (!fn0) { console.log(`   ✗ ${t.id}/${fam.id} does not compile`); continue; }
    if (fam.sound === false) { baitCompiled++; continue; } // bait: allowed to be wrong
    bornTotal++;
    // sweep the form dial: every render must be born correct
    let ok = true;
    for (const draw of [0.05, 0.2, 0.4, 0.5, 0.6, 0.8, 0.95, () => 0.5]) {
      const R = typeof draw === 'function' ? draw : () => draw;
      const fn = compile(fam.render(R, 0));
      const per = runProbes(fn, probes, oTok, t);
      if (!per.every((p) => p.ok)) {
        ok = false;
        const bad = per.findIndex((p) => !p.ok);
        console.log(`   ✗ ${t.id}/${fam.id} (rng=${typeof draw === 'function' ? 'walk' : draw}) fails probe ${bad}: got ${per[bad].tok} want ${oTok[bad]} err=${per[bad].err || '-'}`);
        break;
      }
    }
    if (ok) bornOK++;
  }
  check(`${t.id}: sound families born correct (form-dial sweep)`, bornOK === bornTotal, `${bornOK}/${bornTotal} sound (+${baitCompiled} bait compile)`);
}

// ── 2. structural metric sanity: renaming shouldn't fool it ──
{
  const t = TARGETS[0];
  const a = t.families[0].render(() => 0.3, 0);
  const b = t.families[1].render(() => 0.3, 0);
  const dDiff = structDist(structSketch(a), structSketch(b));
  check('structural distance separates different families', dDiff > 0.15, `d=${dDiff}`);
  const sameTwice = structDist(structSketch(a), structSketch(t.families[0].render(() => 0.3, 0)));
  check('structural distance is dial-stable-ish', sameTwice < dDiff, `same=${sameTwice} diff=${dDiff}`);
}

// ── 3. one live-sheet generation per target ──
for (const t of TARGETS) {
  const loom = await new Loom(t, { seed: 42 }).init();
  const s = await loom.runGeneration({});
  check(`${t.id}: generation ran`, s.cand_n > 0, `fakes=${s.fakes}/${s.cand_n} probes=${s.probes}`);
  const ev = (await loom.engine.get('gan.events')).data || [];
  check(`${t.id}: sheet events booked by listeners`, ev.length > 0, `${ev.length} events (${ev.map((e) => e.kind).join(',')})`);
  check(`${t.id}: archive seeded`, loom.archive.elites.length > 0, `${loom.archive.elites.length} elites`);
  // second generation — forge should grow, some pressure dynamics visible
  const before = loom.forge.probes.length;
  await loom.runGeneration({});
  check(`${t.id}: forge grows across generations`, loom.forge.probes.length > before, `${before}→${loom.forge.probes.length}`);
  const rep = loom.report();
  check(`${t.id}: witness chain seals & verifies`, rep.chain_ok, `${rep.chain_links} links`);
}

// ── 4. hardening: fake pressure (mines_safe carries bait families) ──
{
  const t = TARGETS.find((x) => x.id === 'mines_safe');
  const loom = await new Loom(t, { seed: 7 }).init();
  const b0 = loom.forge.budget;
  for (let i = 0; i < 4; i++) await loom.runGeneration({ salt: i });
  const st = loom.forge.stats();
  check('forge budget ratchets or scars accumulate under pressure', st.budget > b0 || st.scarred > 0, `budget ${b0}→${st.budget}, scars=${st.scarred}`);
  const kinds = new Set(st.kinds ? Object.keys(st.kinds) : []);
  check('forge probe kinds diversified', kinds.size >= 2, [...kinds].join(','));
  const evKinds = new Set(((await loom.engine.get('gan.events')).data || []).map((e) => e.kind));
  check('crown + scar reflexes both observed', evKinds.has('crown') && evKinds.has('scar'), [...evKinds].join(','));
}

const fails = CHECKS.filter((c) => !c.ok).length;
console.log(`\n${CHECKS.length - fails}/${CHECKS.length} checks pass`);
process.exit(fails ? 1 : 0);
