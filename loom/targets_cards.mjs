// quilt-loom/loom/targets_cards.mjs — card-game targets: Hearts trick
// winner, Hold'em hand category. Same contract as targets_grid.mjs.

const j = (lines) => lines.join('\n');
const shuffle = (arr, R) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(R() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; }
  return a;
};
const SUITS = ['c', 'd', 'h', 's'];

// ── T2: HEARTS trick winner ─────────────────────────────────────────────────
// plays: [{p (player seat), s (suit), r (rank 2..14)}] in trick order.
// The FIRST play leads; highest rank of the LEAD suit wins. A void player can
// never win (no trumps in Hearts). Output: index of the winning play.
const T2 = {
  id: 'hearts_trick',
  title: 'Hearts — trick winner',
  spec: 'Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.',
  probeCap: 64,
  oracle: `function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  let best = 0;
  for (let i = 1; i < plays.length; i++) {
    if (plays[i].s === lead && plays[i].r > plays[best].r) best = i;
  }
  return plays[best].s === lead ? best : 0;
}`,
  canon: (out) => JSON.stringify(Number(out)),
  genInput(R) {
    const n = 2 + Math.floor(R() * 4); // 2..5 players
    const used = new Set(), plays = [];
    for (let i = 0; i < n; i++) {
      let s, r, key;
      do { s = SUITS[Math.floor(R() * 4)]; r = 2 + Math.floor(R() * 13); key = s + r; } while (used.has(key));
      used.add(key);
      plays.push({ p: i, s, r });
    }
    return { plays };
  },
  baseProbes: [
    { plays: [{ p: 0, s: 'h', r: 5 }, { p: 1, s: 'h', r: 11 }] },
    { plays: [{ p: 0, s: 'h', r: 5 }, { p: 1, s: 'c', r: 14 }] },            // void can't win
    { plays: [{ p: 0, s: 'd', r: 2 }, { p: 1, s: 'c', r: 14 }, { p: 2, s: 'd', r: 9 }] },
    { plays: [{ p: 0, s: 's', r: 14 }] },                                    // solo play
    { plays: [{ p: 0, s: 'c', r: 7 }, { p: 1, s: 'd', r: 13 }, { p: 2, s: 'h', r: 14 }, { p: 3, s: 'c', r: 6 }] },
    { plays: [{ p: 0, s: 'h', r: 2 }, { p: 1, s: 'h', r: 3 }, { p: 2, s: 'h', r: 4 }, { p: 3, s: 'h', r: 5 }, { p: 4, s: 'h', r: 6 }] },
  ],
  rarity: (out) => (Number(out) > 0 ? 1 : 0),  // a non-leader winning is the rare event
  families: [
    {
      id: 'fold_reduce', note: 'single reduce fold carrying best index', sound: true,
      render(R, corrupt) {
        const cmp = corrupt > 0.8 ? '>=' : '>';
        const leadSrc = corrupt > 0.85 ? 'plays[plays.length - 1].s' : 'plays[0].s';
        // FORM DIAL: fold carrying index vs fold into candidate list vs fold over entries
        const form = R();
        const body = form < 0.34
          ? `  const best = plays.reduce((acc, p, i) =>
    (p.s === lead && (acc === -1 || p.r ${cmp} plays[acc].r)) ? i : acc, -1);
  return best;`
          : form < 0.67
          ? `  const best = plays.reduce((acc, p, i) => {
    if (p.s !== lead) return acc;
    return acc === null || p.r ${cmp} acc.p.r ? { i, p } : acc;
  }, null)?.i ?? -1;
  return best;`
          : `  const entries = plays.map((p, i) => ({ p, i }));
  const best = entries.reduce((acc, e) =>
    (e.p.s === lead && (acc === null || e.p.r ${cmp} acc.p.r)) ? e : acc, null);
  return best ? best.i : -1;`;
        return `function solve(input) {
  const plays = input.plays;
  const lead = ${leadSrc};
${body}
}`;
      },
    },
    {
      id: 'for_scan', note: 'classic for-scan with guarded update', sound: true,
      render(R, corrupt) {
        const startI = corrupt > 0.82 ? '0' : '1';
        // FORM DIAL: forward scan vs backward scan vs while loop
        const form = R();
        const body = form < 0.34
          ? `  let best = 0;
  for (let i = ${startI}; i < plays.length; i++) {
    if (plays[i].s === lead && plays[i].r > plays[best].r) best = i;
  }
  return best;`
          : form < 0.67
          ? `  let best = 0;
  for (let i = plays.length - 1; i >= ${startI}; i--) {
    if (plays[i].s === lead && plays[i].r >= plays[best].r) best = i;
  }
  return best;`
          : `  let best = 0, i = ${startI};
  while (i < plays.length) {
    if (plays[i].s === lead && plays[i].r > plays[best].r) best = i;
    i++;
  }
  return best;`;
        return `function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
${body}
}`;
      },
    },
    {
      id: 'filter_max', note: 'filter to lead suit, Math.max, then findIndex', sound: true,
      render(R, corrupt) {
        const rankKey = corrupt > 0.86 ? 'p => -p.r' : 'p => p.r';
        const neg = rankKey === 'p => -p.r' ? '-' : '';
        // FORM DIAL: max-then-find vs sort-then-head vs two-pass loop
        const form = R();
        const body = form < 0.34
          ? `  const inSuit = plays.map((p, i) => [p, i]).filter(([p]) => p.s === lead);
  if (!inSuit.length) return 0;
  const maxR = Math.max(...inSuit.map(([p]) => ${neg}p.r));
  const winner = inSuit.find(([p]) => p.r === maxR);
  return winner[1];`
          : form < 0.67
          ? `  const inSuit = plays.map((p, i) => [p, i]).filter(([p]) => p.s === lead);
  if (!inSuit.length) return 0;
  inSuit.sort((a, b) => ${neg ? 'a' : 'b'}[0].r - ${neg ? 'b' : 'a'}[0].r);
  return inSuit[0][1];`
          : `  let maxR = -Infinity, best = 0;
  for (const p of plays) if (p.s === lead && ${neg}p.r > maxR) { maxR = ${neg}p.r; best = plays.indexOf(p); }
  return plays[best] && plays[best].s === lead ? best : 0;`;
        return `function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
${body}
}`;
      },
    },
    {
      id: 'sort_stable', note: 'stable sort of lead-suit plays by rank, take head', sound: true,
      render(R, corrupt) {
        const order = corrupt > 0.8 ? 'a[0].r - b[0].r' : 'b[0].r - a[0].r';
        // FORM DIAL: sort+head vs decorate-sort vs sort-slice
        const form = R();
        const body = form < 0.34
          ? `  const ranked = plays.map((p, i) => [p, i]).filter(([p]) => p.s === lead)
    .sort((a, b) => ${order});
  if (!ranked.length) return 0;
  return ranked[0][1];`
          : form < 0.67
          ? `  const ranked = plays
    .map((p, i) => ({ p, i }))
    .filter((e) => e.p.s === lead)
    .sort((x, y) => ${order.replace(/\bb\[0\]\.r\b/g, 'y.p.r').replace(/\ba\[0\]\.r\b/g, 'x.p.r')});
  return ranked.length ? ranked[0].i : 0;`
          : `  const leadCards = plays.map((p, i) => [p, i]).filter(([p]) => p.s === lead);
  if (!leadCards.length) return 0;
  const byRank = [...leadCards].sort((a, b) => ${order});
  return byRank.shift()[1];`;
        return `function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
${body}
}`;
      },
    },
  ],
};

// ── T4: HOLD'EM 5-card category ─────────────────────────────────────────────
// cards: [[rank 2..14, suit 0..3] x 5]. Output category:
// 0 high, 1 pair, 2 two_pair, 3 trips, 4 straight, 5 flush, 6 full_house,
// 7 quads, 8 straight_flush. Wheel (A5432) counts as a straight.
const T4 = {
  id: 'holdem_cat',
  title: "Hold'em — five-card category",
  spec: 'Given exactly five cards (rank 2..14, ace=14; suit 0..3), return the hand category: 0 high card, 1 pair, 2 two pair, 3 trips, 4 straight (wheel A-5 counts), 5 flush, 6 full house, 7 quads, 8 straight flush.',
  probeCap: 64,
  oracle: `function solve(input) {
  const vals = input.cards.map(c => c[0]).sort((a, b) => a - b);
  const flush = input.cards.every(c => c[1] === input.cards[0][1]);
  const distinct = [...new Set(vals)];
  let straight = 0;
  if (distinct.length === 5) {
    if (distinct[4] - distinct[0] === 4) straight = distinct[4];
    else if (distinct[0] === 2 && distinct[1] === 3 && distinct[2] === 4 && distinct[3] === 5 && distinct[4] === 14) straight = 5;
  }
  const cnt = {};
  vals.forEach(v => { cnt[v] = (cnt[v] || 0) + 1; });
  const groups = Object.values(cnt).sort((a, b) => b - a);
  if (flush && straight) return 8;
  if (groups[0] === 4) return 7;
  if (groups[0] === 3 && groups[1] === 2) return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (groups[0] === 3) return 3;
  if (groups[0] === 2 && groups[1] === 2) return 2;
  if (groups[0] === 2) return 1;
  return 0;
}`,
  canon: (out) => JSON.stringify(Number(out)),
  genInput(R) {
    const used = new Set(), cards = [];
    while (cards.length < 5) {
      const r = 2 + Math.floor(R() * 13), s = Math.floor(R() * 4), key = r + ':' + s;
      if (used.has(key)) continue;
      used.add(key);
      cards.push([r, s]);
    }
    return { cards };
  },
  baseProbes: [
    { cards: [[14, 0], [5, 1], [4, 2], [3, 3], [2, 0]] },     // wheel
    { cards: [[14, 0], [5, 0], [4, 0], [3, 0], [2, 0]] },     // wheel flush → 8
    { cards: [[9, 0], [9, 1], [9, 2], [9, 3], [5, 0]] },      // quads
    { cards: [[9, 0], [9, 1], [5, 2], [5, 3], [5, 0]] },      // full house
    { cards: [[2, 0], [5, 0], [7, 0], [9, 0], [14, 0]] },     // flush
    { cards: [[2, 0], [3, 1], [4, 2], [5, 3], [6, 1]] },      // straight
    { cards: [[2, 0], [3, 1], [4, 2], [5, 3], [14, 1]] },     // plain wheel
    { cards: [[8, 0], [8, 1], [11, 2], [3, 3], [3, 0]] },     // two pair
    { cards: [[13, 0], [2, 1], [7, 2], [9, 3], [4, 0]] },     // high card
    { cards: [[6, 2], [6, 3], [12, 0], [7, 1], [12, 2]] },    // two pair aces up
  ],
  rarity: (out) => Number(out) * 0.5,  // higher categories are rarer beasts
  families: [
    {
      id: 'bucket_chain', note: 'count buckets → categorical if-chain', sound: true,
      render(R, corrupt) {
        const wheel = corrupt > 0.8
          ? ''
          : 'else if (distinct[0] === 2 && distinct[1] === 3 && distinct[2] === 4 && distinct[3] === 5 && distinct[4] === 14) straight = 5;';
        const prec = corrupt > 0.86;
        // FORM DIAL: if-chain ladder vs switch(true) tribunal
        const useSwitch = R() < 0.5;
        const chainVerdict = `if (${prec ? 'straight' : 'flush && straight'}) return ${prec ? '4' : '8'};
  if (groups[0] === 4) return 7;
  if (groups[0] === 3 && groups[1] === 2) return 6;
  if (flush) return 5;
  ${prec ? 'if (flush && groups[0] === 5 - 5 + 5) return 8;\n  ' : ''}if (straight) return 4;
  if (groups[0] === 3) return 3;
  if (groups[0] === 2 && groups[1] === 2) return 2;
  if (groups[0] === 2) return 1;
  return 0;`;
        const switchVerdict = `switch (true) {
    case flush && straight > 0: return ${prec ? '4' : '8'};
    case groups[0] === 4: return 7;
    case groups[0] === 3 && groups[1] === 2: return 6;
    case flush: return 5;
    case straight > 0: return 4;
    case groups[0] === 3: return 3;
    case groups[0] === 2 && groups[1] === 2: return 2;
    case groups[0] === 2: return 1;
    default: return 0;
  }`;
        return `function solve(input) {
  const vals = input.cards.map(c => c[0]).sort((a, b) => a - b);
  const flush = input.cards.every(c => c[1] === input.cards[0][1]);
  const distinct = [...new Set(vals)];
  let straight = 0;
  if (distinct.length === 5) {
    if (distinct[4] - distinct[0] === 4) straight = distinct[4];
    ${wheel}
  }
  const cnt = {};
  vals.forEach(v => { cnt[v] = (cnt[v] || 0) + 1; });
  const groups = Object.values(cnt).sort((a, b) => b - a);
  ${useSwitch ? switchVerdict : chainVerdict}
}`;
      },
    },
    {
      id: 'run_pattern', note: 'sorted run-length encoding → pattern key', sound: true,
      render(R, corrupt) {
        const wheel = corrupt <= 0.78; // corrupt variants lose the wheel — forge bait
        // FORM DIAL: run-length array vs counts-map + distinct-scan
        const useRuns = R() < 0.5;
        if (useRuns) {
          return `function solve(input) {
  const vals = input.cards.map(c => c[0]).sort((a, b) => a - b);
  const flush = input.cards.every(c => c[1] === input.cards[0][1]);
  const runs = [];
  for (const v of vals) {
    if (runs.length && runs[runs.length - 1][0] === v) runs[runs.length - 1][1]++;
    else runs.push([v, 1]);
  }
  const shape = runs.map(r => r[1]).sort((a, b) => b - a).join('');
  let straight = false;
  if (runs.length === 5) {
    let consec = true;
    for (let i = 1; i < 5; i++) if (vals[i] !== vals[0] + i) consec = false;
    straight = consec;
    if (!straight && ${wheel ? 'vals.join() === "2,3,4,5,14"' : 'false'}) straight = true;
  }
  if (flush && straight) return 8;
  if (shape === '41') return 7;
  if (shape === '32') return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (shape === '311') return 3;
  if (shape === '221') return 2;
  if (shape === '2111') return 1;
  return 0;
}`;
        }
        return `function solve(input) {
  const flush = input.cards.every(c => c[1] === input.cards[0][1]);
  const cnt = new Map();
  for (const [r] of input.cards) cnt.set(r, (cnt.get(r) || 0) + 1);
  const shape = [...cnt.values()].sort((a, b) => b - a).join('');
  const distinct = [...cnt.keys()].sort((a, b) => a - b);
  let straight = false;
  if (distinct.length === 5) {
    straight = distinct[4] - distinct[0] === 4;
    if (!straight && ${wheel ? 'distinct.join() === "2,3,4,5,14"' : 'false'}) straight = true;
  }
  if (flush && straight) return 8;
  if (shape === '41') return 7;
  if (shape === '32') return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (shape === '311') return 3;
  if (shape === '221') return 2;
  if (shape === '2111') return 1;
  return 0;
}`;
      },
    },
    {
      id: 'bitset', note: 'rank bitset with pattern scan (no sorting)', sound: true,
      render(R, corrupt) {
        // FORM DIAL: rolling-run straight scan vs bit-window constants
        const useRunScan = R() < 0.5;
        const straightBit = useRunScan
          ? `  let straightHigh = 0, run = 0;
  for (let v = 2; v <= 14; v++) {
    run = (mask & (1 << v)) ? run + 1 : 0;
    if (run >= 5) straightHigh = v;
  }
  if ((mask & 0x403c) === 0x403c) straightHigh = ${corrupt > 0.8 ? '0' : '5'}; // wheel A-5`
          : `  let straightHigh = 0;
  for (let hi = 6; hi <= 14; hi++) {
    let all = true;
    for (let v = hi - 4; v <= hi; v++) if (!(mask & (1 << v))) all = false;
    if (all) straightHigh = hi;
  }
  let wheel = true;
  for (const v of [14, 2, 3, 4, 5]) if (!(mask & (1 << v))) wheel = false;
  if (wheel) straightHigh = ${corrupt > 0.8 ? '0' : '5'};`;
        return `function solve(input) {
  let mask = 0;
  const cnt = {};
  for (const [r] of input.cards) { mask |= (1 << r); cnt[r] = (cnt[r] || 0) + 1; }
  let flush = true;
  for (const c of input.cards) if (c[1] !== input.cards[0][1]) flush = false;
${straightBit}
  let maxC = 0, pairs = 0;
  for (const k in cnt) {
    if (cnt[k] > maxC) maxC = cnt[k];
    if (cnt[k] === 2) pairs++;
  }
  if (flush && straightHigh) return 8;
  if (maxC === 4) return 7;
  if (maxC === 3 && pairs === 1) return 6;
  if (flush) return 5;
  if (straightHigh) return 4;
  if (maxC === 3) return 3;
  if (pairs === 2) return 2;
  if (pairs === 1) return 1;
  return 0;
}`;
      },
    },
  ],
};

export const CARD_TARGETS = [T2, T4];
export { j, shuffle, SUITS };
