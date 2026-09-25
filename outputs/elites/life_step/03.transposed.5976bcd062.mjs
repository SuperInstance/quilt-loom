// Conway life — one step, dead borders — elite specimen #3
// family: transposed   hash: 5976bcd062
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a binary grid, return the next generation under Conway B3/S23 with dead (zero) borders: a dead cell with exactly 3 live neighbors is born; a live cell with 2 or 3 live neighbors survives; everything else dies.
export const solve = function solve(input) {
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
};
export default solve;