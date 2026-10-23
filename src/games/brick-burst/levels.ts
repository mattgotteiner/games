export const LAYOUTS = [
  ['............', 'nnnnnnnnnnnn', 'nnnnnnnnnnnn', 'nnnnnnnnnnnn', 'nnnnnnnnnnnn', 'nnnnnnnnnnnn', 'nnnnnnnnnnnn', '............'],
  ['.....tt.....', '....nnnn....', '...nnnnnn...', '..nnnnnnnn..', '.nnnnnnnnnn.', 'nnnnnnnnnnnn', '............', '............'],
  ['tntntnntntnt', 'ntntnttntntn', '............', 'nnnn....nnnn', 'nnnn....nnnn', '............', 'nn.nn..nn.nn', 'nn.nn..nn.nn'],
  ['tttttttttttt', 't..........t', 't.nnnnnnnn.t', 't.nnnnnnnn.t', 't.nnnnnnnn.t', 't..........t', 'tttt....tttt', '............'],
  ['..t......t..', '...n....n...', '..nnnnnnnn..', '.nn.nnnn.nn.', 'nnnnnnnnnnnn', 'n.nnnnnnnn.n', 'n.n......n.n', '...nn..nn...'],
] as const
export const ROW_POINTS = [40, 40, 30, 30, 20, 20, 10, 10] as const
export function layoutForLevel(level: number): ReadonlyArray<string> {
  return LAYOUTS[(Math.max(1, Math.floor(level)) - 1) % LAYOUTS.length]
}
