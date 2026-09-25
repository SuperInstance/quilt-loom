// Conway life — one step, dead borders — elite specimen #4
// family: flat_kernel   hash: 0aab3e36f6
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a binary grid, return the next generation under Conway B3/S23 with dead (zero) borders: a dead cell with exactly 3 live neighbors is born; a live cell with 2 or 3 live neighbors survives; everything else dies.
export const solve = function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const flat = g.flat();
  const KER = [1,1,1,1,1,1,1,1];
  const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
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
};
export default solve;