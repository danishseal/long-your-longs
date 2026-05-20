/**
 * Animation sequences - ported from sequences.js
 * flyingbirdSequence uses the r() helper for repeat patterns.
 */

import { r } from "./animascii";

export const flyingbirdSequence: number[] = [
  r([r(3, 20), r([r(2, 2), 3, 4, r(5, 2), 4, 3], 2)], 2),
  r(2, 2),
  1,
  r(0, 10),
  r(1, 2),
  r(2, 2),
  r(3, 10),
  r(2, 2),
  3,
  4,
  r(5, 2),
  r(6, 2),
  r(0, 10),
  r(6, 2),
  r(5, 2),
  4,
  3,
].flat(Infinity) as number[];
