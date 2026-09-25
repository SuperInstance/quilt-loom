// Conway life — one step, dead borders — elite specimen #2
// family: offset_fold   hash: f63884929c
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a binary grid, return the next generation under Conway B3/S23 with dead (zero) borders: a dead cell with exactly 3 live neighbors is born; a live cell with 2 or 3 live neighbors survives; everything else dies.
export const solve = function solve(input) {
  const g = input.grid, H = g.length, W = g[0].length;
  const DIRS = [[-1,0],[1,1],[0,1],[-1,1],[-1,-1],[0,-1],[1,-1],[1,0]];
  const out = [];
  for (let r = 0; r < H; r++) {
    const row = [];
    for (let c = 0; c < W; c++) {
      const n = DIRS.reduce((s, [dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        return s + (nr >= 0 && nc >= 0 && nr < H && nc < W ? g[nr][nc] : 0);
      }, 0);
      const alive = g[r][c];
      const next = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      row.push(next);
    }
    out.push(row);
  }
  return out;
};
export default solve;