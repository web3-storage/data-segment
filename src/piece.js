import * as API from './api.js'
import * as Fr32 from './fr32.js'
import { Size as NodeSize } from './node.js'
import * as Digest from 'multiformats/hashes/digest'
import * as Link from 'multiformats/link'
import * as Tree from './piece/tree.js'
import * as UnpaddedSize from './piece/unpadded-size.js'
import * as PaddedSize from './piece/padded-size.js'
import { log2Ceil } from './uint64.js'

export { Tree }

/**
 * @see https://github.com/multiformats/go-multihash/blob/dc3bd6897fcd17f6acd8d4d6ffd2cea3d4d3ebeb/multihash.go#L73
 */
export const SHA2_256_TRUNC254_PADDED = 0x1012

/**
 * @see https://github.com/ipfs/go-cid/blob/829c826f6be23320846f4b7318aee4d17bf8e094/cid.go#L104
 */
export const FilCommitmentUnsealed = 0xf101

/**
 * Current maximum piece size is limited by the maximum number of leaves in the
 * tree, which is limited by max size of the JS array, which is 128GiB.
 */
export const MAX_PIECE_SIZE = Tree.MAX_LEAF_COUNT * NodeSize

/**
 * The maximum amount of data that one can compute for the piece.
 */
export const MAX_PAYLOAD_SIZE = (MAX_PIECE_SIZE / 128) * 127

export { UnpaddedSize, PaddedSize }

/**
 * @param {API.PieceInfo} piece
 */
class PieceInfo {
  /**
   * @param {object} data
   * @param {API.PieceLink} data.link
   * @param {number} data.height
   */
  constructor({ link, height }) {
    this.link = link
    this.height = height
  }
  get size() {
    return 2n ** BigInt(this.height) * BigInt(NodeSize)
  }
  toJSON() {
    return toJSON(this)
  }
  toString() {
    return toString(this)
  }
}

/**
 * @implements {API.Piece}
 */
class Piece extends PieceInfo {
  /**
   * @param {object} data
   * @param {number} data.contentSize
   * @param {API.PieceTree} data.tree
   */
  constructor({ contentSize, tree }) {
    super({ link: createLink(tree.root), height: tree.height })
    this.contentSize = contentSize
    this.tree = tree
  }

  get paddedSize() {
    return Fr32.toZeroPaddedSize(this.contentSize)
  }
}

/**
 * @param {API.PieceInfo} piece
 * @returns {API.PieceJSON}
 */
export const toJSON = (piece) => ({
  link: { '/': piece.link.toString() },
  height: PaddedSize.toHeight(piece.size),
})

/**
 *
 * @param {API.PieceJSON} json
 * @returns {API.PieceInfoView}
 */
export const fromJSON = ({ link, height }) =>
  new PieceInfo({ link: Link.parse(link['/']), height })

/**
 * @param {API.PieceInfo} piece
 * @returns {API.ToString<API.PieceJSON>}
 */
export const toString = (piece) => JSON.stringify(toJSON(piece), null, 2)

/**
 * @param {API.ToString<API.PieceJSON>|string} source
 */
export const fromString = (source) => fromJSON(JSON.parse(source))

/**
 * Creates Piece CID from the the merkle tree root. It will not perform
 * any validation.
 *
 * @param {API.MerkleTreeNode} root
 * @returns {API.PieceLink}
 */
export const createLink = (root) =>
  Link.create(
    FilCommitmentUnsealed,
    Digest.create(SHA2_256_TRUNC254_PADDED, root)
  )

/**
 * @param {Uint8Array} source
 * @returns {API.Piece}
 */
export const build = (source) => {
  if (source.length < Fr32.MIN_PIECE_SIZE) {
    throw new RangeError(
      `Piece is not defined for payloads smaller than ${Fr32.MIN_PIECE_SIZE} bytes`
    )
  }

  if (source.length > MAX_PAYLOAD_SIZE) {
    throw new RangeError(
      `Payload exceeds maximum supported size of ${MAX_PAYLOAD_SIZE} bytes`
    )
  }

  const tree = Tree.build(Fr32.pad(source))

  return new Piece({ tree, contentSize: source.byteLength })
}
