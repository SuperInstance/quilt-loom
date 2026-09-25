// quilt-loom/loom/targets_mind.mjs — DECISION targets for the Divergence
// Foundry. Logic the fleet actually plays and gates with:
//
//   hand_eval5 — the arcade hold'em evaluator (5-card best-class + kickers)
//   gate_law   — quilt-cortex chord gate (jev-quilt law 5): calibrated
//                probabilities + doubt -> accept / flag / escalate
//
// Both are integer/exact-output contracts: bit-exact across structures, so
// every caught fake is a REAL semantic scar (wheel straights, doubt veto,
// first-sample guards), never a float lottery.

// ── M1: FIVE-CARD HAND EVALUATION (arcade hold'em core) ─────────────────────
const M1 = {
  id: 'hand_eval5',
  title: 'Hold\u2019em — 5-card best class + kickers',
  spec: 'Given {cards} (exactly 5 card strings like "As","Th","2c"; ranks 23456789TJQKA, suits shdc), return {cat, kickers}: cat 0 highcard, 1 pair, 2 two pair, 3 trips, 4 straight, 5 flush, 6 full house, 7 quads, 8 straight flush. Kickers = tiebreak ranks descending, per category: highcard/flush all 5; pair [pair,k,k,k]; two pair [hi,lo,k]; trips [t,k,k]; straight/SF [hi, 5 for the wheel A-5]; full house [trip,pair]; quads [q,k]. Ace plays high AND low in straights (A2345 is a straight with hi=5).',
  probeCap: 44,
  oracle: `function solve(input) {
  const RV = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  const cards = input.cards;
  const rs = cards.map((c) => RV[c[0]]);
  const ss = cards.map((c) => c[1]);
  const flush = ss.every((s) => s === ss[0]);
  const cnt = {};
  for (const r of rs) cnt[r] = (cnt[r] || 0) + 1;
  const groups = Object.entries(cnt).map((e) => [Number(e[0]), e[1]])
    .sort((x, y) => (y[1] - x[1]) || (y[0] - x[0]));
  const uniq = [...new Set(rs)].sort((a, b) => b - a);
  let straightHi = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHi = uniq[0];
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHi = 5;
  }
  if (flush && straightHi) return { cat: 8, kickers: [straightHi] };
  if (groups[0][1] === 4) return { cat: 7, kickers: [groups[0][0], groups[1][0]] };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { cat: 6, kickers: [groups[0][0], groups[1][0]] };
  if (flush) return { cat: 5, kickers: uniq.slice(0, 5) };
  if (straightHi) return { cat: 4, kickers: [straightHi] };
  if (groups[0][1] === 3) return { cat: 3, kickers: [groups[0][0], groups[1][0], groups[2][0]] };
  if (groups[0][1] === 2 && groups[1][1] === 2) return { cat: 2, kickers: [groups[0][0], groups[1][0], groups[2][0]] };
  if (groups[0][1] === 2) return { cat: 1, kickers: [groups[0][0], groups[1][0], groups[2][0], groups[3][0]] };
  return { cat: 0, kickers: uniq.slice(0, 5) };
}`,
  canon: (o) => JSON.stringify([o.cat, ...(o.kickers || [])]),
  genInput(R) {
    const RANKS = '23456789TJQKA';
    const SUITS = 'shdc';
    const deck = [];
    for (const r of RANKS) for (const s of SUITS) deck.push(r + s);
    const take = (used) => {
      let c = deck[Math.floor(R() * deck.length)];
      while (used.has(c)) c = deck[Math.floor(R() * deck.length)];
      used.add(c);
      return c;
    };
    const plain = () => {
      const used = new Set();
      return Array.from({ length: 5 }, () => take(used));
    };
    const roll = R();
    const used = new Set();
    const suit = SUITS[Math.floor(R() * 4)];
    const ranks = [...RANKS];
    if (roll < 0.14) {                     // straight (incl. wheel)
      const lo = R() < 0.25 ? 9 : 2 + Math.floor(R() * 9);   // hi from 6..14, or wheel
      const his = R() < 0.25 ? [14, 5, 4, 3, 2] : [lo + 4, lo + 3, lo + 2, lo + 1, lo];
      const CH = { 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
      return { cards: his.map((r) => (r >= 10 ? CH[r] : String(r)) + SUITS[Math.floor(R() * 4)]) };
    }
    if (roll < 0.26) {                     // flush-shaped (may be SF — fine)
      const usedF = new Set();
      return { cards: Array.from({ length: 5 }, () => {
        let c = RANKS[Math.floor(R() * 13)] + suit;
        while (usedF.has(c)) c = RANKS[Math.floor(R() * 13)] + suit;
        usedF.add(c);
        return c;
      }) };
    }
    if (roll < 0.40) {                     // pair
      const p = RANKS[Math.floor(R() * 13)];
      const c1 = p + SUITS[Math.floor(R() * 4)];
      let c2 = p + SUITS[Math.floor(R() * 4)];
      while (c2 === c1) c2 = p + SUITS[Math.floor(R() * 4)];
      used.add(c1); used.add(c2);
      return { cards: [c1, c2, take(used), take(used), take(used)] };
    }
    if (roll < 0.52) {                     // two pair
      const p1 = RANKS[Math.floor(R() * 13)];
      let p2 = RANKS[Math.floor(R() * 13)];
      while (p2 === p1) p2 = RANKS[Math.floor(R() * 13)];
      const a = p1 + 's', b = p1 + 'h', c = p2 + 'd', d = p2 + 'c';
      used.add(a); used.add(b); used.add(c); used.add(d);
      return { cards: [a, b, c, d, take(used)] };
    }
    if (roll < 0.66) {                     // trips
      const t = RANKS[Math.floor(R() * 13)];
      const a = t + 's', b = t + 'h', c = t + 'd';
      used.add(a); used.add(b); used.add(c);
      return { cards: [a, b, c, take(used), take(used)] };
    }
    if (roll < 0.78) {                     // full house
      const t = RANKS[Math.floor(R() * 13)];
      let p = RANKS[Math.floor(R() * 13)];
      while (p === t) p = RANKS[Math.floor(R() * 13)];
      return { cards: [t + 's', t + 'h', t + 'd', p + 'c', p + 'd'] };
    }
    if (roll < 0.88) {                     // quads
      const q = RANKS[Math.floor(R() * 13)];
      const qs = RANKS.indexOf(q);
      const cards4 = SUITS.split('').map((s) => q + s);
      const kickR = RANKS[(qs + 3) % 13];
      let kick = kickR + 's';
      if (q === 'A' || (kickR === q)) kick = RANKS[(qs + 4) % 13] + 'h';
      return { cards: [...cards4, kick] };
    }
    return { cards: plain() };
  },
  baseProbes: [
    { cards: ['As', 'Ks', 'Qs', 'Js', 'Ts'] },          // royal SF
    { cards: ['As', '2s', '3s', '4s', '5s'] },          // wheel SF (hi=5)
    { cards: ['Ad', '2s', '3h', '4c', '5d'] },          // wheel straight
    { cards: ['As', '2s', '3s', '4s', '6s'] },          // flush, A-6 NOT a straight
    { cards: ['9c', '9d', '9h', '9s', 'Kd'] },          // quads
    { cards: ['7h', '7c', '7d', '2s', '2c'] },          // full house
    { cards: ['Kh', 'Kd', 'Kc', 'As', 'Qd'] },          // trips
    { cards: ['8s', '8d', '5h', '5c', 'Ks'] },          // two pair
    { cards: ['Jc', 'Jh', 'Td', '4s', '2c'] },          // pair of jacks
    { cards: ['Ah', 'Qd', '9c', '6s', '3h'] },          // high card
  ],
  rarity: (o) => -Number(o.cat || 0),
  families: [
    {
      id: 'sorted_runs', note: 'sort ranks, run-length encode, straight by max-min span + wheel special', sound: true,
      render(R, corrupt) {
        const wheel = corrupt > 0.75 ? 'if (sHi === 5) sHi = 0;' : '';
        return `function solve(input) {
  const RV = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  const rs = input.cards.map((c) => RV[c[0]]).sort((a, b) => b - a);
  const flush = input.cards.every((c) => c[1] === input.cards[0][1]);
  const runs = [];
  for (const r of rs) {
    if (runs.length && runs[runs.length - 1][0] === r) runs[runs.length - 1][1]++;
    else runs.push([r, 1]);
  }
  const u = runs.map((x) => x[0]);
  let sHi = 0;
  if (u.length === 5) {
    sHi = (u[0] - u[4] === 4) ? u[0] : 0;
    if (!sHi && u[0] === 14 && u[1] === 5 && u[4] === 2) sHi = 5;
  }
  ${wheel}
  const shape = runs.map((x) => x[1]).sort().join('');
  const pairs = runs.filter((x) => x[1] === 2).map((x) => x[0]).sort((a, b) => b - a);
  const trips = runs.filter((x) => x[1] === 3).map((x) => x[0]);
  const quads = runs.filter((x) => x[1] === 4).map((x) => x[0]);
  const singles = runs.filter((x) => x[1] === 1).map((x) => x[0]).sort((a, b) => b - a);
  if (flush && sHi) return { cat: 8, kickers: [sHi] };
  if (quads.length) return { cat: 7, kickers: [quads[0], u.find((r) => r !== quads[0])] };
  if (trips.length && pairs.length) return { cat: 6, kickers: [trips[0], pairs[0]] };
  if (flush) return { cat: 5, kickers: u.slice(0, 5) };
  if (sHi) return { cat: 4, kickers: [sHi] };
  if (trips.length) return { cat: 3, kickers: [trips[0], ...singles] };
  if (pairs.length >= 2) return { cat: 2, kickers: [pairs[0], pairs[1], singles[0]] };
  if (pairs.length === 1) return { cat: 1, kickers: [pairs[0], ...singles] };
  return { cat: 0, kickers: u.slice(0, 5) };
}`;
      },
    },
    {
      id: 'bit_count_scan', note: 'suit tallies + per-rank multiplicity array scanned high-to-low', sound: true,
      render(R, corrupt) {
        const wheel = corrupt > 0.75 ? 0 : 5;
        const rMin = corrupt > 0.8 ? 3 : 2;
        return `function solve(input) {
  const RV = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  const mult = new Array(15).fill(0);
  const suits = {};
  for (const c of input.cards) {
    mult[RV[c[0]]]++;
    suits[c[1]] = (suits[c[1]] || 0) + 1;
  }
  const flush = Object.keys(suits).some((s) => suits[s] === 5);
  const groups = [];
  for (let r = 14; r >= ${rMin}; r--) {
    if (mult[r]) groups.push([r, mult[r]]);
  }
  let sHi = 0;
  for (let hi = 14; hi >= 6; hi--) {
    let ok = true;
    for (let r = hi; r > hi - 5; r--) if (!mult[r]) { ok = false; break; }
    if (ok) { sHi = hi; break; }
  }
  if (!sHi && ${wheel} && mult[14] && mult[5] && mult[4] && mult[3] && mult[2]) sHi = 5;
  const trips = groups.filter((g) => g[1] === 3).length;
  const pairs = groups.filter((g) => g[1] === 2).map((g) => g[0]).sort((a, b) => b - a);
  const quads = groups.filter((g) => g[1] === 4).map((g) => g[0]);
  const tripRank = groups.filter((g) => g[1] === 3).map((g) => g[0]);
  const singles = groups.filter((g) => g[1] === 1).map((g) => g[0]);
  if (flush && sHi) return { cat: 8, kickers: [sHi] };
  if (quads.length) return { cat: 7, kickers: [quads[0], singles[0]] };
  if (trips && pairs.length) return { cat: 6, kickers: [tripRank[0], pairs[0]] };
  if (flush) return { cat: 5, kickers: groups.map((g) => g[0]).slice(0, 5) };
  if (sHi) return { cat: 4, kickers: [sHi] };
  if (trips) return { cat: 3, kickers: [tripRank[0], ...singles.slice(0, 2)] };
  if (pairs.length >= 2) return { cat: 2, kickers: [pairs[0], pairs[1], singles[0]] };
  if (pairs.length === 1) return { cat: 1, kickers: [pairs[0], ...singles.slice(0, 3)] };
  return { cat: 0, kickers: singles.slice(0, 5) };
}`;
      },
    },
    {
      id: 'count_entries', note: 'Object.entries counting, groups sorted by (count, rank) — oracle doctrine', sound: true,
      render(R, corrupt) {
        const wheel = corrupt > 0.75 ? 'false' : '(uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2)';
        const kickN = corrupt > 0.9 ? 4 : 5;
        return `function solve(input) {
  const RV = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  const rs = input.cards.map((c) => RV[c[0]]);
  const flush = input.cards.every((c) => c[1] === input.cards[0][1]);
  const cnt = {};
  for (const r of rs) cnt[r] = (cnt[r] || 0) + 1;
  const groups = Object.entries(cnt).map((e) => [Number(e[0]), e[1]])
    .sort((x, y) => (y[1] - x[1]) || (y[0] - x[0]));
  const uniq = [...new Set(rs)].sort((a, b) => b - a);
  let straightHi = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHi = uniq[0];
    else if (${wheel}) straightHi = 5;
  }
  const seq = flush && straightHi ? [8] : groups[0][1] === 4 ? [7]
    : groups[0][1] === 3 && groups[1][1] === 2 ? [6] : flush ? [5]
    : straightHi ? [4] : groups[0][1] === 3 ? [3]
    : groups[0][1] === 2 && groups[1][1] === 2 ? [2]
    : groups[0][1] === 2 ? [1] : [0];
  const cat = seq[0];
  if (cat === 8 || cat === 4) return { cat, kickers: [straightHi] };
  if (cat === 7 || cat === 6) return { cat, kickers: [groups[0][0], groups[1][0]] };
  if (cat === 5 || cat === 0) return { cat, kickers: uniq.slice(0, ${kickN}) };
  if (cat === 3) return { cat, kickers: [groups[0][0], groups[1][0], groups[2][0]] };
  if (cat === 2) return { cat, kickers: [groups[0][0], groups[1][0], groups[2][0]] };
  return { cat, kickers: [groups[0][0], groups[1][0], groups[2][0], groups[3][0]] };
}`;
      },
    },
  ],
};

// ── M2: THE CORTEX GATE LAW (chord law 5) ───────────────────────────────────
// p_max >= 0.55 AND doubt < 0.5 -> fast-accept; p_max >= 0.35 -> flagged;
// else escalate. Doubt vetoes the fast path (never escalates by itself).
// Grid inputs (k/20) land exactly on both boundaries: the forge farms them.
const M2 = {
  id: 'gate_law',
  title: 'Cortex chord — the gate law',
  spec: 'Given {probs} (2-5 calibrated probabilities on a 0.05 grid) and {doubt} (0-1, 0.05 grid): let pmax = max(probs). If pmax >= 0.55 AND doubt < 0.5 -> mode "accept". Else if pmax >= 0.35 -> mode "flag". Else -> mode "escalate". Return {mode, pmax} (pmax as a number).',
  probeCap: 36,
  oracle: `function solve(input) {
  let pmax = input.probs[0];
  for (const p of input.probs) if (p > pmax) pmax = p;
  let mode;
  if (pmax >= 0.55 && input.doubt < 0.5) mode = 'accept';
  else if (pmax >= 0.35) mode = 'flag';
  else mode = 'escalate';
  return { mode, pmax };
}`,
  canon: (o) => JSON.stringify({ mode: String(o.mode), pmax: Number(o.pmax).toFixed(2) }),
  genInput(R) {
    const k = () => 3 + Math.floor(R() * 18);            // 3..20 -> 0.15..1.00
    const n = 2 + Math.floor(R() * 4);
    const probs = Array.from({ length: n }, () => k() / 20);
    if (R() < 0.4) probs[0] = (R() < 0.5 ? 7 : 11) / 20;  // farm the boundaries
    return { probs, doubt: Math.floor(R() * 21) / 20 };
  },
  baseProbes: [
    { probs: [0.55, 0.3], doubt: 0.2 },
    { probs: [0.55, 0.3], doubt: 0.5 },
    { probs: [0.55, 0.3], doubt: 0.55 },
    { probs: [0.35, 0.2], doubt: 0.0 },
    { probs: [0.3, 0.15], doubt: 0.0 },
    { probs: [1.0, 0.05], doubt: 0.45 },
    { probs: [1.0, 0.05], doubt: 0.9 },
    { probs: [0.15, 0.35, 0.2], doubt: 0.5 },
  ],
  rarity: (o) => -(o.mode === 'escalate' ? 2 : (o.mode === 'accept' ? 1 : 0)),
  families: [
    {
      id: 'reduce_carrier', note: 'single reduce pass carrying (pmax, mode) simultaneously', sound: true,
      render(R, corrupt) {
        const t1 = corrupt > 0.8 ? 0.5 : 0.55;
        const dv = corrupt > 0.85 ? '>' : '<';
        return `function solve(input) {
  const st = input.probs.reduce(
    (acc, p) => {
      const m = p ${'>'} acc.pmax ? p : acc.pmax;
      return { pmax: m, mode: (m >= ${t1} && input.doubt ${dv} 0.5) ? 'accept' : (m >= 0.35 ? 'flag' : 'escalate') };
    },
    { pmax: input.probs[0], mode: 'escalate' },
  );
  return st;
}`;
      },
    },
    {
      id: 'sorted_index', note: 'sorted-first pmax + boolean-sum mode index with doubt downgrade', sound: true,
      render(R, corrupt) {
        const t1 = corrupt > 0.8 ? 0.5 : 0.55;
        const dv = corrupt > 0.85 ? '<' : '>=';
        return `function solve(input) {
  const sorted = [...input.probs].sort((a, b) => b - a);
  const pmax = sorted[0];
  let idx = (pmax >= 0.35) + (pmax >= ${t1});
  if (idx === 2 && input.doubt ${dv} 0.5) idx = 1;
  const mode = ['escalate', 'flag', 'accept'][idx];
  return { mode, pmax };
}`;
      },
    },
    {
      id: 'math_max_ternary', note: 'spread Math.max + nested ternary one-liner', sound: true,
      render(R, corrupt) {
        const t1 = corrupt > 0.8 ? 0.5 : 0.55;
        const dv = corrupt > 0.85 ? '>=' : '<';
        return `function solve(input) {
  const pmax = Math.max(...input.probs);
  const mode = (pmax >= ${t1} && input.doubt ${dv} 0.5) ? 'accept'
    : (pmax >= 0.35 ? 'flag' : 'escalate');
  return { mode, pmax };
}`;
      },
    },
  ],
};

export const MIND_TARGETS = [M1, M2];
