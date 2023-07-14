import * as Piece from '../../src/piece.js'
import * as Node from '../../src/node.js'

export const sizes = [
  256 << 20,
  1024 << 20,
  512 << 20,
  512 << 20,
  1024 << 20,
  256 << 20,
  512 << 20,
  1024 << 20,
  256 << 20,
  512 << 20,
]

/**
 * Generates a node from a given size. It does exactly what the
 * original go code does.
 *
 * @see https://github.com/filecoin-project/go-data-segment/blob/5d01fdd3e4a17651b1b271f80a8df8f991b5307a/datasegment/inclusion_test.go#L30-L43
 *
 * @param {number} n
 */
export const createNodeFromInt = (n) => {
  const bytes = [0xd, 0xe, 0xa, 0x1]
  const chars = [...`${n}`]
  const base = '0'.charCodeAt(0)
  for (const [index, char] of chars.entries()) {
    bytes[index + 5] = char.charCodeAt(0) - base
  }

  return Node.from(bytes)
}

export const pieces = sizes.map((size, index) => ({
  size: Piece.PaddedSize.from(size),
  link: Piece.createLink(createNodeFromInt(index)),
}))
