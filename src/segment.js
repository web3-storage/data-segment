import * as SHA256 from 'sync-multihash-sha2/sha256'
import { Size as NodeSize } from './node.js'
import * as API from './api.js'

/**
 * The size of the checksum in bytes
 */
export const ChecksumSize = 16

/**
 * Amount of bytes a uint64 will take.
 */
export const Uint64Size = 64 / 8

/**
 *
 * @param {API.Segment} segment
 * @returns {API.Checksum<API.Segment, typeof ChecksumSize>}
 */
export const computeChecksum = (segment) =>
  /** Take only the first {@link ChecksumSize} bytes */
  toBytes(segment).subarray(NodeSize + Uint64Size + Uint64Size)

/**
 * @param {API.Segment} segment
 * @returns {API.SegmentInfo}
 */
export const withChecksum = (segment) => ({
  ...segment,
  checksum: computeChecksum(segment),
})

/**
 * @param {API.MerkleTreeNodeSource} source
 */
export const fromSource = ({ node, location }) => ({
  root: node,
  offset: toLeafIndex(location) * NodeSize,
  size: (1 << location.level) * NodeSize,
})

/**
 * @param {API.MerkleTreeNodeSource} source
 */
export const fromSourceWithChecksum = (source) =>
  withChecksum(fromSource(source))

/**
 * Calculates the `index` in the leaf layer corresponding to the given
 * `location` in (the hybrid merkle tree).
 *
 * @param {API.MerkleTreeLocation} location
 */
export const toLeafIndex = ({ index, level }) =>
  // This is done by bit shifting Index to the left by `level` places.
  // In the context of a binary tree, this operation essentially corresponds to
  // descending `level` levels down from the current node.
  index << level

/**
 * @param {API.Segment} segment
 * @returns {API.MerkleTreeNode}
 */
export const toIndexNode = (segment) => toBytes(segment).subarray(NodeSize)

/**
 * @param {(API.Segment & {checksum?: undefined}) |API.SegmentInfo} segment
 */
export const toBytes = ({ root, size, offset, checksum }) => {
  const buffer = new Uint8Array(
    NodeSize + Uint64Size + Uint64Size + ChecksumSize
  )
  buffer.set(root, 0)
  const view = new DataView(buffer.buffer)
  view.setBigUint64(NodeSize, BigInt(offset), true)
  view.setBigUint64(NodeSize + Uint64Size, BigInt(size), true)

  if (!checksum) {
    const { digest } = SHA256.digest(buffer)
    checksum = digest.subarray(0, ChecksumSize)
    // Truncate to  126 bits
    checksum[ChecksumSize - 1] &= 0b00111111
  }

  buffer.set(checksum, NodeSize + Uint64Size + Uint64Size)

  return buffer
}

/**
 * @param {API.Segment} segment
 * @returns {API.Result<API.Segment, Error>}
 */
export const validate = (segment) => {
  if (segment.offset % 128 !== 0) {
    return { error: Error('offset is not aligned in padded data') }
  }
  if (segment.size % 128 !== 0) {
    return { error: Error('size is not aligned in padded data') }
  }

  return { ok: segment }
}