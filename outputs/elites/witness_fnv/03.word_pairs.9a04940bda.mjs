// Witness idiom — fnv-1a-64 hex — elite specimen #3
// family: word_pairs   hash: 9a04940bda
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given {text} (ASCII string), compute FNV-1a 64-bit: h=0xcbf29ce484222325; for each char code c in order: h ^= c; h *= 0x100000001b3 (mod 2^64). Return h as lowercase hex, zero-padded to 16 chars.
export const solve = function solve(input) {
  const s = input.text;
  let h = 0xcbf29ce484222325n;
  const P = 0x100000001b3n, M = 0xffffffffffffffffn;
  const step = (ch) => { h = ((h ^ BigInt(ch.charCodeAt(0))) * P) & M; };
  for (let i = 0; i < s.length; i += 2) {
    const a = s[i], b = s[i + 1];
    if (false) { if (b !== undefined) step(b); step(a); }
    else { step(a); if (b !== undefined) step(b); }
  }
  return h.toString(16).padStart(16, '0');
};
export default solve;