// Reversi — flipped cells — elite specimen #2
// family: rec_ray   hash: b2f653204e
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Reversi grid (0 empty, 1/2 players), and a move (r,c) by `player`, return the sorted "r,c" list of ALL cells flipped by the move (the placement cell is not included).
export const solve = function solve(input) {
  const g = input.grid, opp = input.player === 1 ? 2 : 1;
  const DIRS = [[0,-1],[1,1],[-1,0],[-1,-1],[1,-1],[1,0],[0,1],[-1,1]];
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
};
export default solve;