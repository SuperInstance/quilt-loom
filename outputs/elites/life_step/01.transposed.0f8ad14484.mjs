// Conway life — one step, dead borders — elite specimen #1
// family: transposed   hash: 0f8ad14484
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a binary grid, return the next generation under Conway B3/S23 with dead (zero) borders: a dead cell with exactly 3 live neighbors is born; a live cell with 2 or 3 live neighbors survives; everything else dies.
export const solve = function solve(input) {
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
};
export default solve;