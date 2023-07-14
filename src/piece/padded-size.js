import * as API from '../api.js'
import { onesCount64, log2Ceil } from '../uint64.js'
import * as Node from '../node.js'

const NODE_SIZE = BigInt(Node.Size)

/**
 * Validates that given `size` is a valid {@link API.PaddedPieceSize} and
 * returns {@link API.PaddedPieceSize} capturing the validation at the type
 * level. If given `size` is not a valid `PaddedPieceSize` throws an error.
 *
 * This function is a variation on {@link validate} that throws exceptions
 * instead of returning a {@link API.Result}.
 *
 * @param {number|API.uint64} size
 */
export const from = (size) => {
  const result = validate(BigInt(size))
  if (result.error) {
    throw result.error
  } else {
    return result.ok
  }
}

/**
 * Validates that given `size` is a valid {@link API.PaddedPieceSize} that is a
 * power of 2. Returns {@link API.Result} with `PaddedPieceSize` ok case and an
 * Error in the error case.
 *
 * @see https://github.com/filecoin-project/go-state-types/blob/ff2ed169ff566458f2acd8b135d62e8ca27e7d0c/abi/piece.go#L18-L29
 *
 * @param {API.uint64} size
 * @returns {API.Result<API.PaddedPieceSize, RangeError>}
 */
export const validate = (size) => {
  if (size < 128) {
    return { error: RangeError('minimum padded piece size is 128 bytes') }
  }

  if (onesCount64(size) !== 1) {
    return { error: Error('padded piece size must be a power of 2') }
  }

  return { ok: size }
}

/**
 *
 * @param {API.PaddedPieceSize} size
 * @returns {API.UnpaddedPieceSize}
 */
export const toUnpaddedSize = (size) => size - size / 128n

/**
 * Calculates the height of the piece tree from unpadded size.
 *
 * @param {API.PaddedPieceSize} size
 */
export const toHeight = (size) => log2Ceil(size / NODE_SIZE)
