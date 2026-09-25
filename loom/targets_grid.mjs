// quilt-loom/loom/targets_grid.mjs — grid-game targets for the Divergence
// Foundry: Minesweeper deduction, Reversi flips, Conway life. Each target:
//   spec        — natural but precise language (the contract)
//   oracle      — self-contained reference `function solve(input){}` source
//   canon(out)  — canonical form so structurally different but equivalent
//                 outputs hash to the same fingerprint token
//   genInput(R) — a random VALID input (satisfiable by construction)
//   baseProbes  — hand-forged boundary cases the forge always keeps
//   families    — structurally distinct strategy templates the generator
//                 renders with dials; corrupt[] sites are the mutatable
//                 semantics that can turn a template into a "fake"

const j = (lines) => lines.join('\n');
const shuffle = (arr, R) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(R() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; }
  return a;
};

// ── T1: MINESWEEPER certainly-safe cells ────────────────────────────────────
// Semantics: grid[r][c] === -1 → unknown (may hide a mine); 0..8 → revealed
// count of mined 8-neighbors. A cell is certainly-safe iff it is non-mined in
// EVERY globally consistent assignment of the unknown cells.
const T1 = {
  id: 'mines_safe',
  title: 'Minesweeper — certainly-safe cells',
  spec: 'Given a Minesweeper grid (numbers = revealed adjacent-mine counts, -1 = unknown), return every unknown cell that is provably safe under ALL globally consistent mine assignments, as sorted "r,c" strings.',
  probeCap: 40,
  oracle: `function solve(input) {
  const g = input.grid, R = g.length, C = g[0].length;
  const unk = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === -1) unk.push([r, c]);
  const cnt = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] >= 0) cnt.push([r, c]);
  const n = unk.length, idx = {};
  unk.forEach((u, i) => { idx[u[0] + "_" + u[1]] = i; });
  const adj = cnt.map(([r, c]) => {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      if (g[nr][nc] === -1) out.push(idx[nr + "_" + nc]);
    }
    return { need: g[r][c], u: out };
  });
  const minedEver = new Array(n).fill(false);
  for (let mask = 0; mask < (1 << n); mask++) {
    let ok = true;
    for (let i = 0; i < adj.length && ok; i++) {
      let have = 0;
      for (const ui of adj[i].u) if ((mask >> ui) & 1) have++;
      if (have !== adj[i].need) ok = false;
    }
    if (!ok) continue;
    for (let k = 0; k < n; k++) if ((mask >> k) & 1) minedEver[k] = true;
  }
  const out = [];
  for (let k = 0; k < n; k++) if (!minedEver[k]) out.push(unk[k][0] + "," + unk[k][1]);
  out.sort();
  return out;
}`,
  canon: (out) => JSON.stringify([...(out || [])].map(String).sort()),
  genInput(R) {
    const rows = 4 + Math.floor(R() * 2), cols = 4 + Math.floor(R() * 2);
    const mines = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (R() < 0.22 ? 1 : 0)));
    const counts = mines.map((row, r) => row.map((_, c) => {
      let s = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols) s += mines[nr][nc];
      }
      return s;
    }));
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c]);
    const k = 4 + Math.floor(R() * 4); // hide 4..7 cells
    const hidden = new Set(shuffle(cells, R).slice(0, k).map(([r, c]) => r + '_' + c));
    const grid = counts.map((row, r) => row.map((_, c) => (hidden.has(r + '_' + c) ? -1 : counts[r][c])));
    return { grid };
  },
  baseProbes: [
    { grid: [[-1]] },                                     // single unknown: always safe (no constraints)
    { grid: [[1, -1], [-1, -1]] },
    { grid: [[0, 0], [0, -1]] },                          // the hidden cell is safe
    { grid: [[-1, 1], [1, 1]] },
    { grid: [[2, -1], [-1, 2]] },                         // coupled constraints
    { grid: [[0, 1, 1], [1, -1, 2], [1, 2, -1]] },
    { grid: [[1, 2, -1], [-1, -1, 3], [1, 3, 2]] },
  ],
  rarity: (out) => -((out || []).length),  // boards with FEW certainly-safe cells are rare
  families: [
    {
      id: 'mask_scan', note: 'iterative bitmask enumeration over unknowns', sound: true,
      render(R, corrupt) {
        const down = R() < 0.5 ? '(1 << n) - 1 - mask' : 'mask';
        const flipCmp = corrupt > 0.8 ? '>' : '!==';
        const flipSafe = corrupt > 0.85 ? 'mined[k]' : '!mined[k]';
        const dirs = shuffle([[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]], R);
        // FORM DIAL: boolean-array verdicts vs bitmask algebra (safeMask/minedMask)
        const bitmaskAlgebra = R() < 0.5;
        if (bitmaskAlgebra) {
          return `function solve(input) {
  const g = input.grid, R = g.length, C = g[0].length;
  const unk = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === -1) unk.push([r, c]);
  const n = unk.length, uIdx = {};
  unk.forEach((u, i) => { uIdx[u[0] * 100 + u[1]] = i; });
  const cons = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] >= 0) {
    const us = [];
    for (const [dr, dc] of ${JSON.stringify(dirs)}) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] !== -1) continue;
      us.push(uIdx[nr * 100 + nc]);
    }
    cons.push([g[r][c], us]);
  }
  let everMined = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    const m2 = ${down};
    let ok = true;
    for (let i = 0; i < cons.length && ok; i++) {
      let have = 0;
      for (const ui of cons[i][1]) if ((m2 >> ui) & 1) have++;
      if (have ${flipCmp} cons[i][0]) ok = false;
    }
    if (ok) everMined |= m2;
  }
  const out = [];
  for (let k = 0; k < n; k++) if (!(everMined >> k & 1)) out.push(unk[k][0] + "," + unk[k][1]);
  out.sort();
  return out;
}`;
        }
        return `function solve(input) {
  const g = input.grid, R = g.length, C = g[0].length;
  const unk = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === -1) unk.push([r, c]);
  const n = unk.length, uIdx = {};
  unk.forEach((u, i) => { uIdx[u[0] * 100 + u[1]] = i; });
  const cons = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] >= 0) {
    const us = [];
    for (const [dr, dc] of ${JSON.stringify(dirs)}) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] !== -1) continue;
      us.push(uIdx[nr * 100 + nc]);
    }
    cons.push([g[r][c], us]);
  }
  const mined = new Array(n).fill(false);
  for (let mask = 0; mask < (1 << n); mask++) {
    const m2 = ${down};
    let ok = true;
    for (let i = 0; i < cons.length && ok; i++) {
      let have = 0;
      for (const ui of cons[i][1]) if ((m2 >> ui) & 1) have++;
      if (have ${flipCmp} cons[i][0]) ok = false;
    }
    if (ok) for (let k = 0; k < n; k++) if ((m2 >> k) & 1) mined[k] = true;
  }
  const out = [];
  for (let k = 0; k < n; k++) if (${flipSafe}) out.push(unk[k][0] + "," + unk[k][1]);
  out.sort();
  return out;
}`;
      },
    },
    {
      id: 'backtrack', note: 'recursive backtracking over unknowns with leaf validation', sound: true,
      render(R, corrupt) {
        const seqExpr = R() < 0.5 ? 'unk' : 'unk.slice().reverse()';
        const prune = corrupt > 0.9;
        return `function solve(input) {
  const g = input.grid, R = g.length, C = g[0].length;
  const unk = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === -1) unk.push([r, c]);
  const seq = ${seqExpr};
  const cons = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] >= 0) {
    const us = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] !== -1) continue;
      us.push(unk.findIndex(u => u[0] === nr && u[1] === nc));
    }
    cons.push([g[r][c], us]);
  }
  const order2 = seq, n = order2.length;
  const assign = new Array(n).fill(0);
  const mined = new Array(n).fill(false);
  const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  function consistentUpTo(depth) {
    if (${prune ? 'false' : 'true'}) return true;
    for (const [need, us] of cons) {
      let assigned = 0, have = 0;
      for (const ui of us) { if (us.length && ui < depth) { assigned++; have += assign[ui]; } }
      if (assigned === us.length && have !== need) return false;
    }
    return true;
  }
  function walk(depth) {
    if (depth === n) {
      for (const [need, us] of cons) {
        let have = 0;
        for (const ui of us) have += assign[ui];
        if (have !== need) return;
      }
      for (let k = 0; k < n; k++) if (assign[k]) mined[k] = true;
      return;
    }
    for (const val of [0, 1]) {
      assign[depth] = val;
      if (consistentUpTo(depth + 1)) walk(depth + 1);
      assign[depth] = 0;
    }
  }
  walk(0);
  const out = [];
  for (let k = 0; k < n; k++) if (!mined[k]) out.push(order2[k][0] + "," + order2[k][1]);
  out.sort();
  return out;
}`;
      },
    },
    {
      id: 'pair_rule', note: 'subset-rule constraint propagation to fixpoint (shortcut — forge bait)', sound: false,
      render(R, corrupt) {
        const fixIters = 2 + Math.floor(R() * 3);
        return `function solve(input) {
  const g = input.grid, R = g.length, C = g[0].length;
  const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const cons = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] >= 0) {
    const us = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < R && nc < C && g[nr][nc] === -1) us.push(nr * 100 + nc);
    }
    cons.push({ need: g[r][c], us, knownMined: 0, safe: [] });
  }
  const mined = new Set(), safe = new Set();
  for (let iter = 0; iter < ${fixIters}; iter++) {
    for (const con of cons) {
      const unk = con.us.filter(k => !mined.has(k) && !safe.has(k));
      const forced = con.need - con.knownMined;
      if (unk.length && forced === 0) unk.forEach(k => safe.add(k));
      else if (unk.length && forced === unk.length ${corrupt > 0.75 ? '+ 1' : ''}) unk.forEach(k => mined.add(k));
      con.us.forEach(k => { if (mined.has(k)) con.knownMined += 0; });
    }
    for (const a of cons) for (const b of cons) {
      if (a === b) continue;
      const sub = a.us.every(k => b.us.includes(k));
      if (sub && b.us.length > a.us.length) {
        const diff = b.us.filter(k => !a.us.includes(k));
        if (b.need - a.need === 0) diff.forEach(k => safe.add(k));
      }
    }
  }
  const out = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++)
    if (g[r][c] === -1 && safe.has(r * 100 + c) && !mined.has(r * 100 + c)) out.push(r + "," + c);
  out.sort();
  return out;
}`;
      },
    },
    {
      id: 'local_scan', note: 'single-pass local consistency per unknown (weaker — forge bait)', sound: false,
      render(R, corrupt) {
        const pass = corrupt > 0.7 ? '>=' : '===';
        return `function solve(input) {
  const g = input.grid, R = g.length, C = g[0].length;
  const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const out = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (g[r][c] !== -1) continue;
    let canBeMined = false, canBeSafe = false;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] < 0) continue;
      let knownMined = 0, unkN = 0;
      for (const [dr2, dc2] of DIRS) {
        const ar = nr + dr2, ac = nc + dc2;
        if (ar < 0 || ac < 0 || ar >= R || ac >= C || !dr2 && !dc2) continue;
        if (g[ar][ac] === -1) unkN++;
      }
      const need = g[nr][nc];
      if (need ${pass} unkN) canBeMined = true;
      if (0 ${pass} need) canBeSafe = true;
    }
    if (canBeSafe && !canBeMined) out.push(r + "," + c);
    else if (!canBeSafe && !canBeMined) out.push(r + "," + c);
  }
  out.sort();
  return out;
}`;
      },
    },
  ],
};

// ── T3: REVERSI flips ───────────────────────────────────────────────────────
// grid: 0 empty, 1 black, 2 white. Move at (r,c) by `player`. Return sorted
// "r,c" flips (placement cell excluded). Assumed legal (≥1 flip).
const DIRS8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const T3 = {
  id: 'reversi_flips',
  title: 'Reversi — flipped cells',
  spec: 'Given a Reversi grid (0 empty, 1/2 players), and a move (r,c) by `player`, return the sorted "r,c" list of ALL cells flipped by the move (the placement cell is not included).',
  probeCap: 64,
  oracle: `function solve(input) {
  const g = input.grid, opp = input.player === 1 ? 2 : 1;
  const flips = new Set();
  const DIRS = ${JSON.stringify(DIRS8)};
  for (const [dr, dc] of DIRS) {
    const run = [];
    let r = input.r + dr, c = input.c + dc;
    while (r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === opp) {
      run.push([r, c]); r += dr; c += dc;
    }
    if (run.length && r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === input.player)
      run.forEach(([fr, fc]) => flips.add(fr + "," + fc));
  }
  const out = [...flips]; out.sort(); return out;
}`,
  canon: (out) => JSON.stringify([...(out || [])].map(String).sort()),
  genInput(R) {
    for (let tries = 0; tries < 200; tries++) {
      const rows = 4 + Math.floor(R() * 3), cols = 4 + Math.floor(R() * 3);
      const g = Array.from({ length: rows }, () => Array.from({ length: cols }, () => {
        const x = R();
        return x < 0.34 ? 1 : x < 0.68 ? 2 : 0;
      }));
      const player = R() < 0.5 ? 1 : 2, opp = player === 1 ? 2 : 1;
      const empties = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (g[r][c] === 0) empties.push([r, c]);
      if (!empties.length) continue;
      const [r, c] = empties[Math.floor(R() * empties.length)];
      let legal = false;
      for (const [dr, dc] of DIRS8) {
        let rr = r + dr, cc = c + dc, seen = false;
        while (rr >= 0 && cc >= 0 && rr < rows && cc < cols && g[rr][cc] === opp) { seen = true; rr += dr; cc += dc; }
        if (seen && rr >= 0 && cc >= 0 && rr < rows && cc < cols && g[rr][cc] === player) { legal = true; break; }
      }
      if (legal) return { grid: g, r, c, player };
    }
    return { grid: [[1, 2, 0], [0, 1, 2], [2, 0, 1]], r: 0, c: 2, player: 1 };
  },
  baseProbes: [
    { grid: [[1, 2, 0]], r: 0, c: 2, player: 1 },
    { grid: [[0, 2, 2, 1]], r: 0, c: 0, player: 1 },
    { grid: [[1], [2], [0]], r: 2, c: 0, player: 1 },
    { grid: [[2, 2, 2], [2, 0, 2], [2, 2, 2]], r: 1, c: 1, player: 1 },
    { grid: [[1, 1, 1], [1, 0, 1], [1, 1, 1]], r: 1, c: 1, player: 2 },
    { grid: [[0, 0, 0], [0, 2, 0], [0, 1, 0]], r: 0, c: 0, player: 1 },
  ],
  rarity: (out) => -((out || []).length) + (((out || []).length > 0) ? 0.5 : 0),
  families: [
    {
      id: 'ray_loop', note: 'per-direction ray walk with a Set dedupe', sound: true,
      render(R, corrupt) {
        const dirs = shuffle(DIRS8, R);
        const dedupe = corrupt > 0.8 ? 'run.forEach(([fr, fc]) => flips.push(fr + "," + fc))' : 'run.forEach(([fr, fc]) => flips.add(fr + "," + fc))';
        return `function solve(input) {
  const g = input.grid, opp = input.player === 1 ? 2 : 1;
  const flips = ${corrupt > 0.8 ? '[]' : 'new Set()'};
  const DIRS = ${JSON.stringify(dirs)};
  for (const [dr, dc] of DIRS) {
    const run = [];
    let r = input.r + dr, c = input.c + dc;
    while (r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === opp) {
      run.push([r, c]); r += dr; c += dc;
    }
    if (run.length && r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === input.player)
      ${dedupe};
  }
  const out = [...flips]; out.sort(); return out;
}`;
      },
    },
    {
      id: 'rec_ray', note: 'recursive ray collector', sound: true,
      render(R, corrupt) {
        const orderFirst = R() < 0.5;
        const dirs = orderFirst ? DIRS8 : shuffle(DIRS8, R);
        return `function solve(input) {
  const g = input.grid, opp = input.player === 1 ? 2 : 1;
  const DIRS = ${JSON.stringify(dirs)};
  const flips = new Set();
  function ray(r, c, dr, dc, run) {
    if (r < 0 || c < 0 || r >= g.length || c >= g[0].length) return null;
    if (g[r][c] === 0) return null;
    if (g[r][c] === input.player) return run;
    return ray(r + dr, c + dc, dr, dc, run.concat([[r, c]]));
  }
  for (const [dr, dc] of DIRS) {
    const got = ray(input.r + dr, input.c + dc, dr, dc, []);
    if (got) got.forEach(([fr, fc]) => flips.add(fr + "," + fc));
  }
  const out = [...flips]; out.sort(); return out;
}`;
      },
    },
    {
      id: 'flat_index', note: '1-D index arithmetic walk (no coordinate pairs)', sound: true,
      render(R, corrupt) {
        const stepMod = corrupt > 0.85;
        // FORM DIAL: scalar walk vs DIRS.map over flat offsets
        const viaMap = R() < 0.5;
        if (viaMap) {
          return `function solve(input) {
  const g = input.grid, W = g[0].length, H = g.length;
  const flat = g.flat(), opp = input.player === 1 ? 2 : 1;
  const DIRS = ${JSON.stringify(DIRS8)};
  const start = input.r * W + input.c;
  const flips = new Set();
  DIRS.map(([dr, dc]) => start + dr * W + dc).forEach((_, k) => {
    const [dr, dc] = DIRS[k];
    const run = [];
    let r = input.r + dr, c = input.c + dc;
    while (r >= 0 && c >= 0 && r < H && c < W && flat[r * W + c] === opp) { run.push(r * W + c); r += dr; c += dc; }
    if (run.length && r >= 0 && c >= 0 && r < H && c < W && flat[r * W + c] === input.player)
      run.forEach(i => flips.add(Math.floor(i / W) + "," + (i ${stepMod ? '%' : '-'} Math.floor(i / W) * W)));
  });
  const out = [...flips]; out.sort(); return out;
}`;
        }
        return `function solve(input) {
  const g = input.grid, W = g[0].length, H = g.length;
  const flat = g.flat(), opp = input.player === 1 ? 2 : 1;
  const DIRS = ${JSON.stringify(DIRS8)};
  const flips = new Set();
  for (const [dr, dc] of DIRS) {
    const run = [];
    let r = input.r + dr, c = input.c + dc;
    while (r >= 0 && c >= 0 && r < H && c < W && flat[r * W + c] === opp) {
      run.push(r * W + c); r += dr; c += dc;
    }
    if (run.length && r >= 0 && c >= 0 && r < H && c < W && flat[r * W + c] === input.player)
      run.forEach(i => flips.add(Math.floor(i / W) + "," + (i ${stepMod ? '%' : '-'} Math.floor(i / W) * W)));
  }
  const out = [...flips]; out.sort(); return out;
}`;
      },
    },
    {
      id: 'fold_dirs', note: 'functional fold over directions, dedupe via map keys', sound: true,
      render(R, corrupt) {
        const skipGuard = corrupt > 0.82 ? '/* guard folded away */ true' : 'run.length';
        // FORM DIAL: object-map dedupe vs Set dedupe vs array-concat + final Set
        const form = R();
        if (form < 0.34) {
          return `function solve(input) {
  const g = input.grid, opp = input.player === 1 ? 2 : 1;
  const DIRS = ${JSON.stringify(DIRS8)};
  const found = DIRS.reduce((acc, [dr, dc]) => {
    const run = [];
    let r = input.r + dr, c = input.c + dc;
    while (r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === opp) { run.push([r, c]); r += dr; c += dc; }
    if (${skipGuard} && r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === input.player)
      run.forEach(([fr, fc]) => { acc[fr + "," + fc] = 1; });
    return acc;
  }, {});
  const out = Object.keys(found); out.sort(); return out;
}`;
        }
        if (form < 0.67) {
          return `function solve(input) {
  const g = input.grid, opp = input.player === 1 ? 2 : 1;
  const DIRS = ${JSON.stringify(DIRS8)};
  const flips = new Set();
  DIRS.forEach(([dr, dc]) => {
    const run = [];
    let r = input.r + dr, c = input.c + dc;
    while (r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === opp) { run.push([r, c]); r += dr; c += dc; }
    if (${skipGuard} && r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === input.player)
      run.forEach(([fr, fc]) => flips.add(fr + "," + fc));
  });
  const out = [...flips]; out.sort(); return out;
}`;
        }
        return `function solve(input) {
  const g = input.grid, opp = input.player === 1 ? 2 : 1;
  const DIRS = ${JSON.stringify(DIRS8)};
  const runs = DIRS.map(([dr, dc]) => {
    const run = [];
    let r = input.r + dr, c = input.c + dc;
    while (r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === opp) { run.push([r, c]); r += dr; c += dc; }
    return (${skipGuard} && r >= 0 && c >= 0 && r < g.length && c < g[0].length && g[r][c] === input.player) ? run : [];
  });
  const out = [...new Set(runs.flat().map(([fr, fc]) => fr + "," + fc))];
  out.sort();
  return out;
}`;
      },
    },
  ],
};

// ── T5: CONWAY LIFE step (dead borders) ─────────────────────────────────────
// B3/S23. Outside the grid everything is permanently dead.
const T5 = {
  id: 'life_step',
  title: 'Conway life — one step, dead borders',
  spec: 'Given a binary grid, return the next generation under Conway B3/S23 with dead (zero) borders: a dead cell with exactly 3 live neighbors is born; a live cell with 2 or 3 live neighbors survives; everything else dies.',
  probeCap: 64,
  oracle: `function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const out = g.map(row => row.slice());
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= H || nc >= W) continue;
      n += g[nr][nc];
    }
    out[r][c] = g[r][c] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
  }
  return out;
}`,
  canon: (out) => JSON.stringify((out || []).map((row) => row.join(''))),
  genInput(R) {
    const H = 4 + Math.floor(R() * 3), W = 4 + Math.floor(R() * 3);
    return { grid: Array.from({ length: H }, () => Array.from({ length: W }, () => (R() < 0.42 ? 1 : 0))) };
  },
  baseProbes: [
    { grid: [[0, 0], [0, 0]] },
    { grid: [[1, 1], [1, 1]] },
    { grid: [[1, 0], [0, 1]] },
    { grid: [[1, 1, 0], [1, 0, 0], [0, 0, 0]] },
    { grid: [[0, 1, 0], [0, 1, 0], [0, 1, 0]] },
    { grid: [[1, 0, 1], [0, 0, 0], [1, 0, 1]] },
    { grid: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  ],
  rarity: (out, input) => {
    if (!out || !input || !input.grid) return 0;
    let changed = 0, cells = 0;
    for (let r = 0; r < input.grid.length; r++) for (let c = 0; c < input.grid[0].length; c++) {
      cells++;
      if (out[r] && out[r][c] !== input.grid[r][c]) changed++;
    }
    return changed / Math.max(1, cells);
  },
  families: [
    {
      id: 'nested_scan', note: 'nested neighbor window, row-major', sound: true,
      render(R, corrupt) {
        const bLive = corrupt > 0.8 ? 'n === 1 || n === 2 || n === 3' : 'n === 2 || n === 3';
        const born = corrupt > 0.85 ? 'n === 2 || n === 3' : 'n === 3';
        // FORM DIAL: dr/dc inner loops vs fully unrolled 8-neighbor sum
        const unrolled = R() < 0.5;
        const countExpr = unrolled
          ? `const n =
      (r > 0 && c > 0 ? g[r-1][c-1] : 0) + (r > 0 ? g[r-1][c] : 0) +
      (r > 0 && c < W-1 ? g[r-1][c+1] : 0) + (c > 0 ? g[r][c-1] : 0) +
      (c < W-1 ? g[r][c+1] : 0) + (r < H-1 && c > 0 ? g[r+1][c-1] : 0) +
      (r < H-1 ? g[r+1][c] : 0) + (r < H-1 && c < W-1 ? g[r+1][c+1] : 0);`
          : `let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= H || nc >= W) continue;
      n += g[nr][nc];
    }`;
        return `function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const out = g.map(row => row.slice());
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    ${countExpr}
    out[r][c] = g[r][c] ? (${bLive} ? 1 : 0) : (${born} ? 1 : 0);
  }
  return out;
}`;
      },
    },
    {
      id: 'offset_fold', note: 'offset table folded with reduce', sound: true,
      render(R, corrupt) {
        const dirs = shuffle(DIRS8, R);
        // FORM DIAL: reduce-fold vs for-of accumulate vs every-cell helper
        const form = R();
        const countExpr = form < 0.34
          ? `const n = DIRS.reduce((s, [dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        return s + (nr >= 0 && nc >= 0 && nr < H && nc < W ? g[nr][nc] : 0);
      }, 0);`
          : form < 0.67
          ? `let n = 0;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < H && nc < W) n += g[nr][nc];
      }`
          : `const n = DIRS.map(([dr, dc]) => [r + dr, c + dc])
        .filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < H && nc < W)
        .reduce((s, [nr, nc]) => s + g[nr][nc], 0);`;
        return `function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const DIRS = ${JSON.stringify(dirs)};
  const out = [];
  for (let r = 0; r < H; r++) {
    const row = [];
    for (let c = 0; c < W; c++) {
      ${countExpr}
      const alive = g[r][c];
      const next = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      row.push(next);
    }
    out.push(row);
  }
  return out;
}`;
      },
    },
    {
      id: 'transposed', note: 'column-major (transposed) traversal', sound: true,
      render(R, corrupt) {
        // FORM DIAL: swap loop order in place vs transpose → row-major → transpose back
        const viaTranspose = R() < 0.5;
        if (!viaTranspose) {
          return `function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const out = g.map(row => row.slice());
  for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= H || nc >= W) continue;
      n += g[nr][nc];
    }
    out[r][c] = g[r][c] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
  }
  return out;
}`;
        }
        return `function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const cols = Array.from({ length: W }, (_, c) => Array.from({ length: H }, (_, r) => g[r][c]));
  const next = cols.map((col, c) => col.map((_, r) => {
    let n = 0;
    for (let k = -1; k <= 1; k++) for (let m = -1; m <= 1; m++) {
      if (!k && !m) continue;
      const cc = c + k, rr = r + m;
      if (cc < 0 || rr < 0 || cc >= W || rr >= H) continue;
      n += cols[cc][rr];
    }
    return g[r][c] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
  }));
  return Array.from({ length: H }, (_, r) => Array.from({ length: W }, (_, c) => next[c][r]));
}`;
      },
    },
    {
      id: 'flat_kernel', note: 'flattened grid + 1-D kernel convolution', sound: true,
      render(R, corrupt) {
        // corrupt variant zeroes one kernel tap — a subtle, forge-bait bug
        const K = corrupt > 0.84 ? '[1,1,1,1,0,1,1,1]' : '[1,1,1,1,1,1,1,1]';
        return `function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const flat = g.flat();
  const KER = ${K};
  const DIRS = ${JSON.stringify(DIRS8)};
  const out = [];
  for (let i = 0; i < H * W; i++) {
    const r = Math.floor(i / W), c = i % W;
    let n = 0;
    DIRS.forEach(([dr, dc], k) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < H && nc < W) n += flat[nr * W + nc] * KER[k];
    });
    const alive = flat[i];
    out.push(alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0));
  }
  return Array.from({ length: H }, (_, r) => out.slice(r * W, r * W + W));
}`;
      },
    },
  ],
};

export const GRID_TARGETS = [T1, T3, T5];
export { j, shuffle };
