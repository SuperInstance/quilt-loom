// Minesweeper — certainly-safe cells — elite specimen #2
// family: backtrack   hash: f37a1f9910
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Minesweeper grid (numbers = revealed adjacent-mine counts, -1 = unknown), return every unknown cell that is provably safe under ALL globally consistent mine assignments, as sorted "r,c" strings.
export const solve = function solve(input) {
  const g = input.grid, R = g.length, C = g[0].length;
  const unk = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === -1) unk.push([r, c]);
  const seq = unk;
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
    if (true) return true;
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
};
export default solve;