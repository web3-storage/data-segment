import * as API from './api.js'
import * as Node from './node.js'
import * as Segment from './segment.js'

export const { Uint64Size, ChecksumSize } = Segment

/**
 * The size of an entry in bytes. This is number of bytes encoded
 * {@link API.Segment} will take: {@link Node.Size} for the merkle root,
 * {@link Uint64Size} for the segment `offset`, {@link Uint64Size} for the
 * segment `size` and {@link Segment.ChecksumSize} for the segment `checksum`.
 */
export const EntrySize = Node.Size + Uint64Size + Uint64Size + ChecksumSize

/**
 * Function that returns the maximum number of index entries in a given deal
 * size according to the formula in the specification:
 *
 * ```
 * number of entries = max(4, 2**floor(log2(padded size of deal / 2048 / 64 [byte/entry])))
 * ```
 *
 * @see https://github.com/filecoin-project/FIPs/blob/master/FRCs/frc-0058.md#data-segment-index
 *
 * The calculation is based on the size of the deal divided by the product of 2048 and
 * the size of an entry (in bytes), rounded up to the nearest power of 2. The minimum
 * return value is 4.
 *
 * @param {number} size - The size of the deal in bytes.
 * @returns {number} - The maximum number of index entries for a given deal size.
 */
export const maxIndexEntriesInDeal = (size) => {
  // The raw result is the size of the deal divided by 2048 times the size of an
  // entry, rounded up to the nearest power of 2.
  const n = 1 << Math.ceil(Math.log2(size / 2048 / EntrySize))

  // If the number is less than 4, return 4, otherwise return actual number.
  return n < 4 ? 4 : n
}

/**
 *
 * @param {API.MerkleTreeNodeSource[]} source
 * @returns {API.IndexData}
 */
export const fromSourceNodes = (source) => {
  const entries = new Array(source.length)
  for (const [index, node] of source.entries()) {
    entries[index] = Segment.fromSourceWithChecksum(node)
  }

  return { entries }
}
