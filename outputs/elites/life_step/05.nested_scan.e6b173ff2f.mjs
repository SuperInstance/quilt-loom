// Conway life — one step, dead borders — elite specimen #5
// family: nested_scan   hash: e6b173ff2f
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a binary grid, return the next generation under Conway B3/S23 with dead (zero) borders: a dead cell with exactly 3 live neighbors is born; a live cell with 2 or 3 live neighbors survives; everything else dies.
export const solve = function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const out = g.map(row => row.slice());
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const n =
      (r > 0 && c > 0 ? g[r-1][c-1] : 0) + (r > 0 ? g[r-1][c] : 0) +
      (r > 0 && c < W-1 ? g[r-1][c+1] : 0) + (c > 0 ? g[r][c-1] : 0) +
      (c < W-1 ? g[r][c+1] : 0) + (r < H-1 && c > 0 ? g[r+1][c-1] : 0) +
      (r < H-1 ? g[r+1][c] : 0) + (r < H-1 && c < W-1 ? g[r+1][c+1] : 0);
    out[r][c] = g[r][c] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
  }
  return out;
};
export default solve;