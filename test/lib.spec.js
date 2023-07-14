import * as Lib from '@web3-storage/data-segment'
import * as Link from 'multiformats/link'

/**
 * @type {import('entail').Suite}
 */
export const testLib = {
  'test aggregate sample': async (assert) => {
    /** @type {Lib.PieceInfo[]} */
    const pieces = [
      {
        link: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ),
        size: Lib.Piece.UnpaddedSize.toPaddedSize(
          Lib.Piece.UnpaddedSize.from(520192)
        ),
      },
      {
        link: Link.parse(
          `baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa`
        ),
        size: Lib.Piece.UnpaddedSize.toPaddedSize(
          Lib.Piece.UnpaddedSize.from(260096)
        ),
      },
    ]

    const dealSize = Lib.Piece.PaddedSize.from(1 << 20)
    const aggregate = Lib.Aggregate.createBuilder({
      size: dealSize,
    })
    for (const piece of pieces) {
      aggregate.write(piece)
    }
  },
}
