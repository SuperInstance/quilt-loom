// Reversi — flipped cells — elite specimen #3
// family: flat_index   hash: ba37556a50
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Reversi grid (0 empty, 1/2 players), and a move (r,c) by `player`, return the sorted "r,c" list of ALL cells flipped by the move (the placement cell is not included).
export const solve = function solve(input) {
  const g = input.grid, W = g[0].length, H = g.length;
  const flat = g.flat(), opp = input.player === 1 ? 2 : 1;
  const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const flips = new Set();
  for (const [dr, dc] of DIRS) {
    const run = [];
    let r = input.r + dr, c = input.c + dc;
    while (r >= 0 && c >= 0 && r < H && c < W && flat[r * W + c] === opp) {
      run.push(r * W + c); r += dr; c += dc;
    }
    if (run.length && r >= 0 && c >= 0 && r < H && c < W && flat[r * W + c] === input.player)
      run.forEach(i => flips.add(Math.floor(i / W) + "," + (i - Math.floor(i / W) * W)));
  }
  const out = [...flips]; out.sort(); return out;
};
export default solve;