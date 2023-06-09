import { Piece } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
import * as SHA256 from 'sync-multihash-sha2/sha256'
import * as raw from 'multiformats/codecs/raw'
import { create as createLink, parse as parseLink } from 'multiformats/link'

/**
 * Module is generated from `./commp.csv` using prepare script.
 * @see https://github.com/hugomrdias/playwright-test/issues/544
 */
import vector from './commp/vector.js'

/**
 * @type {import("entail").Suite}
 */
export const testPiece = {
  'size shorter than allowed': async (assert) => {
    const source = deriveBuffer(64)
    let result = null
    try {
      result = await Piece.build(source)
    } catch (error) {
      result = error
    }

    assert.ok(
      String(result).includes('not defined for inputs shorter than 65 bytes')
    )
  },
  ...Object.fromEntries(
    Object.values(vector).map((data) => [
      `${data.in.contentSize}\t\t${data.in.cid}`,
      async (assert) => {
        const source = deriveBuffer(data.in.contentSize)
        const link = createLink(raw.code, SHA256.digest(raw.encode(source)))
        const piece = await Piece.build(source)
        assert.deepEqual(link.toString(), data.in.cid, 'same source content')
        assert.deepEqual(piece.root, parseLink(data.out.cid).multihash.digest)

        assert.deepEqual(piece.toJSON(), {
          link: {
            '/': data.out.cid,
          },
          contentSize: data.in.contentSize,
          paddedSize: data.out.paddedSize,
          size: data.out.size,
        })
      },
    ])
  ),
}
