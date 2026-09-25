// Conway life — one step, dead borders — elite specimen #6
// family: offset_fold   hash: 6d5e36869e
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a binary grid, return the next generation under Conway B3/S23 with dead (zero) borders: a dead cell with exactly 3 live neighbors is born; a live cell with 2 or 3 live neighbors survives; everything else dies.
export const solve = function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const DIRS = [[-1,1],[1,-1],[1,0],[1,1],[-1,0],[0,1],[0,-1],[-1,-1]];
  const out = [];
  for (let r = 0; r < H; r++) {
    const row = [];
    for (let c = 0; c < W; c++) {
      let n = 0;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < H && nc < W) n += g[nr][nc];
      }
      const alive = g[r][c];
      const next = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      row.push(next);
    }
    out.push(row);
  }
  return out;
};
export default solve;