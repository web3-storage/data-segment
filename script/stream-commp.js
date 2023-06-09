import process from 'node:process'
import { deriveBuffer } from '../test/util.js'
import * as Piece from '../src/piece.js'

/**
 * @param  {Parameters<typeof deriveBuffer>} args
 */
const main = async (...args) => {
  try {
    const content = await readInput(process.stdin)
    const buffer = new Uint8Array(
      content.buffer,
      content.byteOffset,
      content.byteLength
    )

    const result = await Piece.build(buffer)

    console.log(`
CommPCid: ${result.link()}
Payload:                ${result.contentSize} bytes
Unpadded piece:         ${result.paddedSize} bytes
Padded piece:           ${result.size} bytes`)
  } catch (err) {
    console.error(err)
  }
}
/**
 * @param {NodeJS.ReadStream} stream
 */
const readInput = (stream) => {
  process.stdin.resume()

  return new Promise((succeed) => {
    process.stdin.once('data', function (data) {
      succeed(data)
    })
  })
}

main(...process.argv.slice(2, 4))
