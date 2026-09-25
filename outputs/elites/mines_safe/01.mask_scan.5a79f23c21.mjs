// Minesweeper — certainly-safe cells — elite specimen #1
// family: mask_scan   hash: 5a79f23c21
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Minesweeper grid (numbers = revealed adjacent-mine counts, -1 = unknown), return every unknown cell that is provably safe under ALL globally consistent mine assignments, as sorted "r,c" strings.
export const solve = function solve(input) {
  const g = input.grid, R = g.length, C = g[0].length;
  const unk = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === -1) unk.push([r, c]);
  const n = unk.length, uIdx = {};
  unk.forEach((u, i) => { uIdx[u[0] * 100 + u[1]] = i; });
  const cons = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] >= 0) {
    const us = [];
    for (const [dr, dc] of [[1,1],[1,-1],[-1,-1],[-1,0],[-1,1],[0,1],[0,-1],[1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] !== -1) continue;
      us.push(uIdx[nr * 100 + nc]);
    }
    cons.push([g[r][c], us]);
  }
  const mined = new Array(n).fill(false);
  for (let mask = 0; mask < (1 << n); mask++) {
    const m2 = (1 << n) - 1 - mask;
    let ok = true;
    for (let i = 0; i < cons.length && ok; i++) {
      let have = 0;
      for (const ui of cons[i][1]) if ((m2 >> ui) & 1) have++;
      if (have !== cons[i][0]) ok = false;
    }
    if (ok) for (let k = 0; k < n; k++) if ((m2 >> k) & 1) mined[k] = true;
  }
  const out = [];
  for (let k = 0; k < n; k++) if (!mined[k]) out.push(unk[k][0] + "," + unk[k][1]);
  out.sort();
  return out;
};
export default solve;