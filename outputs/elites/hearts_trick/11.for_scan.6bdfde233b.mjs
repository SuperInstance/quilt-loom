// Hearts — trick winner — elite specimen #11
// family: for_scan   hash: 6bdfde233b
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.
export const solve = function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  let best = 0, i = 1;
  while (i < plays.length) {
    if (plays[i].s === lead && plays[i].r > plays[best].r) best = i;
    i++;
  }
  return best;
};
export default solve;