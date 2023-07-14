import { Piece, Node } from '@web3-storage/data-segment'
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
      String(result).includes('not defined for payloads smaller than 65 bytes')
    )
  },
  ...Object.fromEntries(
    Object.values(vector).map((data) => [
      `${data.in.contentSize}\t\t${data.in.cid}`,
      async (assert) => {
        const source = deriveBuffer(data.in.contentSize)
        const root = SHA256.digest(raw.encode(source))
        const link = createLink(raw.code, root)
        const piece = await Piece.build(source)
        assert.deepEqual(link.toString(), data.in.cid, 'same source content')
        assert.deepEqual(
          piece.tree.root,
          parseLink(data.out.cid).multihash.digest
        )
        assert.deepEqual(parseLink(data.out.cid), piece.link)
        assert.deepEqual(piece.size, BigInt(data.out.size))
        assert.deepEqual(piece.height, Math.log2(data.out.size / Node.Size))
        assert.deepEqual(piece.paddedSize, data.out.paddedSize)

        const json = piece.toJSON()

        assert.deepEqual(json, {
          link: {
            '/': data.out.cid,
          },
          height: Math.log2(data.out.size / Node.Size),
        })

        const view = Piece.fromJSON(json)
        assert.deepEqual(view.link, piece.link)
        assert.deepEqual(view.size, piece.size)
        assert.deepEqual(view.height, piece.height)
      },
    ])
  ),

  'throws if payload is too large': async (assert) => {
    // Subclass Uint8Array as we can't actually allocate a buffer this large
    class HugePayload extends Uint8Array {
      get length() {
        return Piece.MAX_PAYLOAD_SIZE + 1
      }
    }

    assert.throws(
      () => Piece.build(new HugePayload()),
      /Payload exceeds maximum supported size/
    )
  },

  'toString <-> fromString': async (assert) => {
    const source = deriveBuffer(128)
    const piece = await Piece.build(source)

    const serialized = piece.toString()
    assert.deepEqual(JSON.parse(serialized), {
      link: { '/': piece.link.toString() },
      height: piece.height,
    })

    const deserialized = Piece.fromString(serialized)
    assert.deepEqual(deserialized.link, piece.link)
    assert.deepEqual(deserialized.size, piece.size)
    assert.deepEqual(deserialized.height, piece.height)
  },
}
