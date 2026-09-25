# quilt-loom — the Divergent Logic Foundry

**A GAN that breeds logic as different as possible, yet still correct — and it
lives in quilt sheets.**

Classic GANs train a forger against a judge over pixels. The loom runs the
same adversarial tension over **logic itself**: a generator breeds candidate
implementations of a game contract; a discriminator forges adversarial probes
to catch fakes; and every survivor is scored by **how different it is from
everything ever crowned**. The equilibrium is the product: an archive of
maximally-divergent, proven-correct implementations — *durable logic* — where
every dot of disagreement between them marks a boundary of understanding.

This is the ninth project in the SuperInstance portfolio and the direct
descendant of the whole arc: the games (arcade/arena) became the testbed, the
cortex chord spine became the nervous system, and stage-10's "novel effects and
affects of synergy" became a measurable selection pressure.

```
node smoke.mjs        # 40/40 green checks, zero live calls
node run_offline.mjs  # the full 960-candidate divergence run (deterministic)
node run_live.mjs     # the chord-spine live leg (budgeted, receipted)
python3 charts.py     # the three divergence charts
node build_playground.mjs   # bakes the replay into outputs/playground.html
```

Open **`outputs/playground.html`** — the flagship replay: scrub the
generations, watch the sheet's cells move, the forge harden, the crowns land.

---

## The adversarial loom

```
GENERATOR (breeder.mjs)                 DISCRIMINATOR (forge.mjs)
  mech voice     families × dials  <───  probe vector (base/random/boundary/
  render walks   best-of-4,               rare-answer mining + scar tissue)
                 farthest-from-lineage    novelty = 0.65·behavioral
  System One     1 batched typesafe       + 0.35·structural
                 call per generation      hardening: fakes > 50% →
  System Two     GLM wildcard on            budget × 1.25 (a listener reflex)
                 deep plateau
            ⇄  gan.score_card (program cell)  ⇄
            the sheet compiles, probes, and scores — reactively
```

**Everything happens inside a quilt sheet per target.** `gan.score_card` is a
program cell that compiles the candidate (`new Function`, exactly like quilt's
own formula cells), runs the forge's probe vector, and computes functionality
+ behavioral distance — in-cell, reactive. Listeners are the reflexes:
`gan.crown` fires on a record novelty, `gan.scar` books every caught fake,
`gan.harden` ratchets the probe budget when fakes dominate. The GAN is
watchable cell by cell; that is the point.

*(Engine contract learned the hard way: listener conditions evaluate with only
`caller.metadata.{current, prev}` in scope — cell ids are not. The gating
therefore lives inside the action programs. This is the E9 fence again.)*

## The five contracts (the games are the testbed)

| target | contract | oracle | sound families | bait families |
|--------|----------|--------|----------------|---------------|
| `mines_safe` | cells provably safe under ALL consistent mine assignments | bitmask enumeration | mask-scan, backtracking | pair-rule propagation, local-scan |
| `reversi_flips` | every cell flipped by a move | direction-ray walk + Set | ray-loop, recursive ray, 1-D walk, fold | — |
| `life_step` | Conway B3/S23 step, dead borders | nested neighbor window | nested, unrolled, offset-fold, transposed, kernel | — |
| `hearts_trick` | index of the winning play (lead suit rules) | guarded scan | fold, forward/backward/while scan, filter-max, sort | — |
| `holdem_cat` | five-card category 0–8 (wheel counts) | bucket chain + wheel | if-chain/switch, run-pattern/Map, bitset | — |

Every family is **born correct** (smoke sweeps the form dial — every pristine
render must agree with the oracle), then the mutator pushes it away from its
lineage; corruption sites flip semantic constants into forgery territory and
the forge is waiting.

## What the run showed (the findings)

**Offline run** — 960 candidates, 24 generations × 5 targets, 0 live calls,
2.5 s, all witness chains verified:

| target | elites | diversity | record | caught fakes | crowns | mimics |
|--------|-------:|----------:|-------:|-------------:|-------:|-------:|
| mines_safe | 3 | 0.428 | 1.000 | 80 | 3 | 109 |
| reversi_flips | 7 | 0.478 | 1.000 | 0 | 7 | 185 |
| life_step | 8 | 0.520 | 1.000 | 0 | 8 | 184 |
| hearts_trick | 11 | 0.529 | 1.000 | 0 | 11 | 181 |
| holdem_cat | 6 | 0.549 | 1.000 | 0 | 6 | 186 |

1. **The mimic pile is the finding.** 845 of 960 candidates were correct-but-
   near-duplicate shapes, rejected by the archive. The mechanical voice
   saturates: ~11–17 genuinely distinct correct shapes per target. "How varied
   can we make everything" now has a number — and it is exactly the gap the
   System One director and System Two wildcards exist to widen.
2. **The metric had to learn what "different" means.** v1's structural
   histogram was dial-blind: within-family distance measured 0.000 across the
   board. Upgrading to α-normalized 3-gram Jaccard (0.7) + histogram (0.3)
   gave dial variants real separation (0.11–0.37 within-family, 0.43–0.55
   cross-family). Behavioral distance can't do this job — two correct
   implementations agree everywhere by definition. *Structure is the
   divergence axis, because behavior is the constraint.*
3. **Rare-answer mining is the standing adversarial weapon.** Probes where the
   oracle's output is rare (few safe cells, near-tie tricks, exotic
   categories) are where surface mimics crack. Scar tissue + rare mining +
   trickle keeps the forge hunting even when the generator behaves.
4. **Corruption waves make the GAN breathe.** A template zoo with no fakes
   isn't adversarial; the generator now rhythmically pushes wilder variants
   (corruption 0.85) so the forge always has something to cull — and every
   cull is booked, scarred, and pressure-accounted.

**Live leg** — the chord spine, budgeted and receipted:

- **typesafe.ai System One**: 8–9 REAL batched director calls (axis +
  alien-score + hunger in ONE call per generation), the rest labeled mock,
  replayed from cache for free.
- **MOTH quantum**: 14 real entropy packets salting family picks + forge
  stress; vault-capped, namespace-separated, journal-receipted.
- **GLM System Two wildcard: the moment that proves the loom.** On a novelty
  plateau, GLM was handed the Hearts contract and told to be *structurally
  alien*. First wildcard: **passed every probe, novelty 0.861, crowned alien**
  — a brand-new bloodline no mechanical voice had reached. Second wildcard:
  **failed 37% of probes — the forge caught the fake.** Both verdicts in the
  witness chain. Generator and discriminator both proved themselves against a
  real LLM, in both directions.

## The durable product: `outputs/elites/`

Every crowned specimen is exported as a ready-to-import module:

```js
// 03.mask_scan.c8e427b3bf.mjs
export const solve = function solve(input) { ... };
export default solve;
```

Thirty-three specimens across five contracts — each a different correct mind
for the same rule. The ensemble property is the deep value: where many
structurally-unrelated implementations agree, confidence is high; where they
disagree is precisely where the understanding lives. This is N-version
programming with a divergence engine bolted on.

## Architecture notes (for the next agent)

- `loom/targets_*.mjs` — contracts: spec, oracle, canon, genInput, rarity hook,
  families (sound + bait). Families render `function solve(input){...}` source
  strings; helpers are inlined (quilt program-cell doctrine).
- `loom/engine_lib.mjs` — compile, probe runner, α-tokenizer, 3-gram sketch,
  distances, the composite novelty.
- `loom/breeder.mjs` — family weights + render walks + seen-sketch memory;
  `Archive` (MAP-Elites: cap 12, dedupe 0.06, crowd-replace).
- `loom/forge.mjs` — probe vector, growth rounds, scars, hardening.
- `loom/loom.mjs` — the sheet (cells + listeners), the generation loop,
  witness chain, report.
- Vendored `engine/` = patched quilt core (12 playtest patches, 36/36 green).
- Live legs reuse `../quilt-cortex/` (JevVault, makeMoth, makeGlm) — both dirs
  ship together in the portfolio, same doctrine as cortex→arena.

**Next iterations (honest TODO):** elite recombination (splice two bloodlines'
shapes), the wildcard voice widened to per-family GLM rewrites, MOTH-resonance
as a structural-distance oracle ("do two bloodlines resonate on the quantum
probe?"), and wiring the loom's archive back into arena minds as swappable
logic skins.
