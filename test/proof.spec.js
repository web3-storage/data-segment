import {
  Node,
  Proof,
  API,
  Piece,
  Aggregate,
  Inclusion,
} from '@web3-storage/data-segment'
import { base16 } from 'multiformats/bases/base16'

/**
 * @type {{
 * subtree: API.MerkleTreeNode
 * path: API.MerkleTreeNode[]
 * at: API.uint64
 * root?: API.MerkleTreeNode
 * error?: string
 * }[]}
 */
const testVectors = [
  {
    subtree: Node.of(0x1),
    path: [Node.of(0x2), Node.of(0x3)],
    at: 0n,
    root: Node.from([
      0xaa, 0x96, 0x27, 0x47, 0xb, 0x12, 0x9f, 0xab, 0xd, 0xb1, 0x26, 0xd, 0xa8,
      0x0, 0x65, 0xa1, 0xbd, 0xd3, 0x1b, 0x4a, 0xcc, 0x4c, 0x79, 0x12, 0x1f,
      0x2e, 0x1b, 0xa8, 0x48, 0x7d, 0x1f, 0x30,
    ]),
  },
  {
    subtree: Node.of(0x1),
    path: [Node.of(0x2), Node.of(0x3)],
    at: 1n,
    root: Node.from([
      0x47, 0x5a, 0x97, 0x98, 0xaf, 0x48, 0xc5, 0x36, 0x28, 0x33, 0xcd, 0x64,
      0x51, 0xa8, 0xfa, 0x8a, 0x5f, 0x4f, 0x4c, 0x1c, 0xe6, 0x1d, 0x3a, 0xcb,
      0xd4, 0xf5, 0xc7, 0x30, 0xf, 0xe1, 0xe, 0x6,
    ]),
  },
  {
    subtree: Node.of(0xff),
    path: [Node.of(0x2), Node.of(0x3)],
    at: 1n,
    root: Node.from([
      0xfd, 0xb3, 0x7a, 0xef, 0x9d, 0x22, 0xce, 0xcd, 0xc0, 0x58, 0xc9, 0x9e,
      0xbf, 0x94, 0xa3, 0x4c, 0xe1, 0x65, 0x88, 0x2b, 0x1e, 0x2d, 0x3a, 0x81,
      0x56, 0xae, 0x2, 0x22, 0x2d, 0xde, 0x8a, 0x28,
    ]),
  },
  {
    subtree: Node.of(0x1),
    path: [Node.of(0x2), Node.of(0x3)],
    at: 3n,
    root: Node.from([
      0xd4, 0x71, 0x6c, 0xaf, 0x3f, 0xa7, 0x1, 0xea, 0x26, 0x96, 0x2e, 0x53,
      0x4, 0x71, 0x67, 0xbb, 0x25, 0xb0, 0x38, 0x13, 0x8f, 0xb6, 0x51, 0xfb,
      0xff, 0xe, 0xd2, 0x1d, 0x9b, 0x1c, 0x88, 0x22,
    ]),
  },
  {
    subtree: Node.of(0x1),
    path: [Node.of(0x2), Node.of(0x3)],
    at: 4n,
    error: 'offset greater than width of the tree',
  },
  {
    subtree: Node.of(0x1),
    path: [Node.of(0x2), Node.of(0x3), Node.of(0x4)],
    at: 8n,
    error: 'offset greater than width of the tree',
  },
  {
    subtree: Node.of(0x1),
    path: Array(64).fill(Node.of()),
    at: 8n,
    error: 'merkle proofs with depths greater than 63 are not supported',
  },
]

/**
 * @type {import("entail").Suite}
 */
export const testProof = {
  'test compute empty node': async (assert) => {
    assert.deepEqual(
      new Uint8Array([
        0xf5, 0xa5, 0xfd, 0x42, 0xd1, 0x6a, 0x20, 0x30, 0x27, 0x98, 0xef, 0x6e,
        0xd3, 0x9, 0x97, 0x9b, 0x43, 0x0, 0x3d, 0x23, 0x20, 0xd9, 0xf0, 0xe8,
        0xea, 0x98, 0x31, 0xa9, 0x27, 0x59, 0xfb, 0xb,
      ]),
      await Proof.computeNode(Node.of(), Node.of())
    )
  },

  'test compute node 1 2': async (assert) => {
    assert.deepEqual(
      new Uint8Array([
        0xff, 0x55, 0xc9, 0x79, 0x76, 0xa8, 0x40, 0xb4, 0xce, 0xd9, 0x64, 0xed,
        0x49, 0xe3, 0x79, 0x45, 0x94, 0xba, 0x3f, 0x67, 0x52, 0x38, 0xb5, 0xfd,
        0x25, 0xd2, 0x82, 0xb6, 0xf, 0x70, 0xa1, 0x14,
      ]),
      await Proof.computeNode(Node.of(0x01), Node.of(0x02))
    )
  },
  'test compute node 2 1': async (assert) => {
    assert.deepEqual(
      new Uint8Array([
        0x95, 0xe7, 0x3e, 0x86, 0x16, 0xbb, 0x92, 0x7b, 0xb0, 0x74, 0xee, 0x5,
        0x5b, 0x12, 0x23, 0xf3, 0xa0, 0x85, 0xf7, 0x10, 0xc, 0x97, 0x46, 0x8d,
        0x92, 0xe6, 0x3a, 0x1c, 0x87, 0xaf, 0x1c, 0x1a,
      ]),
      await Proof.computeNode(Node.of(0x02), Node.of(0x01))
    )
  },

  'test hash truncation': async (assert) => {
    // RC4.55 test data, note the two least significant bits have been truncated
    const truncatedInput = base16.baseDecode(
      'de188941a3375d3a8a061e67576e926dc71a7fa3f0cceb97452b4d3227965f9ea8cc75076d9fb9c5417aa5cb30fc22198b34982dbb621e'
    )
    const truncatedHash = await Proof.truncatedHash(truncatedInput)
    const expected = base16.baseDecode(
      'ab54eaeefe01cd1396247efa4ac59029b4c44c1729f5200f0693645d427db502'
    )

    assert.equal(
      expected[Node.Size - 1] & 0b00111111,
      truncatedHash[Node.Size - 1]
    )
    assert.deepEqual(expected, truncatedHash)
  },

  ...Object.fromEntries(
    testVectors.map(({ subtree, path, at, root, error }) => [
      `test compute proof ${subtree.join('')} ${at}`,
      async (assert) => {
        const proofData = Proof.create({ path, offset: at })
        const result = await Proof.resolveRoot(proofData, subtree)
        if (error) {
          assert.ok(result.error)
          assert.ok(result.error?.message.includes(error))
        } else {
          assert.equal(result.error, undefined)
          assert.deepEqual(result.ok, root)
        }
      },
    ])
  ),

  'Proof.from': (assert) => {
    assert.deepEqual(
      Proof.from({
        offset: 8,
        path: [Node.of(0x2), Node.of(0x3), Node.of(0x4)],
      }),
      Proof.create({
        offset: 8n,
        path: [Node.of(0x2), Node.of(0x3), Node.of(0x4)],
      })
    )

    assert.deepEqual(
      Proof.from([8, [Node.of(0x2), Node.of(0x3), Node.of(0x4)]]),
      Proof.create({
        offset: 8n,
        path: [Node.of(0x2), Node.of(0x3), Node.of(0x4)],
      })
    )
  },

  'Proof.verify': (assert) => {
    const payload = new Uint8Array(1024).fill(7)
    const piece = Piece.fromPayload(payload)
    const aggregate = Aggregate.build({
      pieces: [piece],
      size: Piece.Size.from(2n ** 12n),
    })

    const inclusion = aggregate.resolveProof(piece.link)
    if (inclusion.error) {
      throw inclusion.error
    }
    const proof = Inclusion.tree(inclusion.ok)

    assert.deepEqual(
      Proof.verify(proof, { tree: aggregate.root, node: piece.root }),
      {
        ok: {},
      }
    )

    const fail = Proof.verify(proof, {
      tree: aggregate.root,
      node: Piece.fromPayload(payload.subarray(512)).root,
    })

    assert.match(
      fail.error?.message,
      /inclusion proof does not lead to the same root/
    )

    const invalid = Proof.verify(
      Proof.create({
        path: Proof.path(proof),
        offset: 1024n,
      }),
      {
        tree: aggregate.root,
        node: piece.root,
      }
    )

    assert.match(invalid.error?.message, /offset greater than width/gi)
  },
}
