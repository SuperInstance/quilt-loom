// build_playground.mjs — bakes the offline run + live leg into a single
// self-contained HTML replay (the "see the GAN" artifact).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HERE = new URL('.', import.meta.url).pathname;
const results = JSON.parse(readFileSync(join(HERE, 'outputs/results.json'), 'utf8'));
const live = existsSync(join(HERE, 'outputs/live_results.json'))
  ? JSON.parse(readFileSync(join(HERE, 'outputs/live_results.json'), 'utf8'))
  : null;
const traceLines = readFileSync(join(HERE, 'outputs/trace.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);

const NAMES = {
  mines_safe: 'Minesweeper · certainly-safe cells',
  reversi_flips: 'Reversi · flipped cells',
  life_step: 'Conway life · one step',
  hearts_trick: 'Hearts · trick winner',
  holdem_cat: "Hold'em · hand category",
};

const targets = results.reports.map((r) => {
  const rows = traceLines.filter((x) => x.target === r.target);
  const verdictsByGen = r.curve.map((c) => {
    const g = rows.filter((x) => x.gen === c.gen);
    return {
      gen: c.gen,
      mimic: g.filter((x) => x.verdict === 'mimic').length,
      caught: g.filter((x) => x.verdict === 'caught').length,
      crowned: g.filter((x) => x.verdict === 'divergent' || x.verdict === 'alien').length,
      top: g.reduce((a, b) => (b.novelty > (a?.novelty ?? -1) ? b : a), null),
    };
  });
  return {
    id: r.target,
    name: NAMES[r.target],
    record: r.record,
    diversity: r.diversity,
    curve: r.curve,
    elites: r.archive.map((e) => ({
      family: e.family, hash: e.hash, novelty: e.novelty, struct: e.struct,
      voice: e.voice, gen: e.gen, bytes: e.src_bytes,
    })),
    eliteSrc: r.elites_src,
    verdictsByGen,
    stats: r.stats,
  };
});

const DATA = {
  date: results.date,
  totals: {
    candidates: results.candidates,
    caught: targets.reduce((a, t) => a + t.stats.caught, 0),
    crowns: targets.reduce((a, t) => a + t.stats.crowned, 0),
    mimics: targets.reduce((a, t) => a + t.stats.mimic, 0),
    chains: results.reports.every((r) => r.chain_ok),
  },
  targets,
  live: live ? {
    budgets: live.budgets,
    perTarget: live.reports.map((r) => ({
      id: r.target, elites: r.archive.length, diversity: r.diversity,
      families: [...new Set(r.archive.map((e) => e.family))],
      director_calls: r.director_calls,
    })),
  } : null,
};

let template = readFileSync(join(HERE, 'playground_template.html'), 'utf8');
template = template.replace('/*__DATA__*/null', JSON.stringify(DATA));
const outPath = join(HERE, 'outputs', 'playground.html');
writeFileSync(outPath, template);
console.log('playground built:', outPath, `${(template.length / 1024).toFixed(0)}KB`);
