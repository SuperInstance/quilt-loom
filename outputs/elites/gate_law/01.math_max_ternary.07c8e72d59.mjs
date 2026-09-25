// Cortex chord — the gate law — elite specimen #1
// family: math_max_ternary   hash: 07c8e72d59
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given {probs} (2-5 calibrated probabilities on a 0.05 grid) and {doubt} (0-1, 0.05 grid): let pmax = max(probs). If pmax >= 0.55 AND doubt < 0.5 -> mode "accept". Else if pmax >= 0.35 -> mode "flag". Else -> mode "escalate". Return {mode, pmax} (pmax as a number).
export const solve = function solve(input) {
  const pmax = Math.max(...input.probs);
  const mode = (pmax >= 0.55 && input.doubt < 0.5) ? 'accept'
    : (pmax >= 0.35 ? 'flag' : 'escalate');
  return { mode, pmax };
};
export default solve;