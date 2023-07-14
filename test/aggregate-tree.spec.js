import * as AggregateTree from '../src/aggregate/tree.js'
import * as PieceTree from '../src/piece/tree.js'
import * as Node from '../src/node.js'
import * as ZeroComm from '../src/zero-comm.js'
import { parse as parseLink } from 'multiformats/link'
import * as API from '../src/api.js'
import * as Proof from '../src/proof.js'

/**
 * @type {import("entail").Suite}
 */
export const testAggregateTree = {
  'basic aggregate tree test': async (assert) => {
    const piece = PieceTree.fromLeafs([
      Node.of(0x1),
      Node.empty(),
      Node.empty(),
      Node.empty(),
    ])

    const aggregate = AggregateTree.create(2)

    // set first leaf and assert root
    aggregate.setNode(0, 0n, Node.of(0x1))
    assert.deepEqual(aggregate.root, piece.root)

    // update 0
    aggregate.setNode(0, 0n, Node.empty())
    assert.deepEqual(aggregate.root, ZeroComm.fromLevel(2))

    // leaf count is the same
    assert.deepEqual(aggregate.leafCount, BigInt(piece.leafCount))
    // depth is the same

    assert.deepEqual(aggregate.height, piece.height)
  },

  'aggregate tree with left padding': async (assert) => {
    const piece = PieceTree.fromLeafs([
      Node.empty(),
      Node.empty(),
      Node.empty(),
      Node.of(0x1),
    ])
    const aggregate = AggregateTree.create(2)

    aggregate.setNode(0, 3n, Node.of(0x1))

    assert.deepEqual(aggregate.root, piece.root)
  },

  'aggregate as generate unsealed CID': async (assert) => {
    const expect = parseLink(
      'baga6ea4seaqiw3gbmstmexb7sqwkc5r23o3i7zcyx5kr76pfobpykes3af62kca'
    ).multihash.digest

    /**
     * @type {API.MerkleTreeNodeSource[]}
     */
    const source = [
      {
        node: Node.from([
          0xa6, 0xe5, 0x9a, 0xd2, 0x24, 0xd3, 0xca, 0xf3, 0xd4, 0xb8, 0x36,
          0xdb, 0x9d, 0x51, 0x71, 0x66, 0x1c, 0x8d, 0x69, 0xa1, 0xd, 0xb4, 0x5f,
          0x4d, 0x48, 0x20, 0x29, 0xc2, 0x7, 0x95, 0x2c, 0x1f,
        ]),
        location: {
          level: 23,
          index: 0n,
        },
      },
      {
        node: Node.from([
          0xd8, 0x79, 0xdd, 0xb5, 0x9, 0x61, 0xbe, 0xa8, 0xc3, 0x80, 0x56, 0xbb,
          0x91, 0x1b, 0xe0, 0xd7, 0x2b, 0x3e, 0x31, 0xea, 0x6d, 0x23, 0x4, 0xc1,
          0x43, 0xb, 0x98, 0x56, 0x1a, 0xd3, 0xa2, 0x19,
        ]),
        location: { level: 25, index: 0x1n },
      },
      {
        node: Node.from([
          0xf4, 0x5d, 0x5c, 0x41, 0x42, 0xac, 0x82, 0x6e, 0xd9, 0xe9, 0x9c, 0x9,
          0x3e, 0x9e, 0x3c, 0x65, 0xae, 0x16, 0x3, 0x4e, 0x37, 0xca, 0xb7, 0x42,
          0x81, 0x6c, 0x2f, 0xa1, 0x36, 0x8f, 0xce, 0x32,
        ]),
        location: { level: 24, index: 0x4n },
      },
      {
        node: Node.from([
          0xb, 0xd8, 0x9d, 0x1e, 0x3c, 0xd9, 0xed, 0x4e, 0xec, 0xda, 0x69, 0xb3,
          0x35, 0x7c, 0x2f, 0x4, 0x2a, 0xdd, 0x60, 0xec, 0x54, 0xc0, 0xc0, 0xb9,
          0x6d, 0x3c, 0x91, 0xa2, 0xf0, 0x4d, 0x90, 0x26,
        ]),
        location: { level: 24, index: 0x5n },
      },
      {
        node: Node.from([
          0xfc, 0x6f, 0x6d, 0x9, 0x24, 0xe, 0xf, 0xce, 0x9e, 0xb0, 0x62, 0x53,
          0x1c, 0xde, 0x39, 0x3f, 0x81, 0x82, 0xe2, 0x33, 0x3e, 0xe9, 0x8b,
          0x74, 0xe0, 0x46, 0xd8, 0x4c, 0x6e, 0x95, 0x80, 0x1,
        ]),
        location: { level: 25, index: 0x3n },
      },
      {
        node: Node.from([
          0xf3, 0xd6, 0xbc, 0xbe, 0xa5, 0xaa, 0xff, 0xa, 0x30, 0xb7, 0x43, 0x4b,
          0x4a, 0x52, 0xe6, 0x11, 0x90, 0xdf, 0x40, 0xaf, 0x29, 0xa9, 0x6a,
          0x89, 0xa1, 0x5a, 0xff, 0x4c, 0xd5, 0x76, 0x8d, 0x0,
        ]),
        location: { level: 23, index: 0x10n },
      },
      {
        node: Node.from([
          0x5e, 0xd3, 0xbd, 0xcb, 0x55, 0xe4, 0xd8, 0xe3, 0x94, 0x4e, 0x4d,
          0xfc, 0x8c, 0xc9, 0xd8, 0x43, 0xa3, 0x15, 0x4d, 0xdf, 0x2b, 0x5b,
          0x5f, 0xe1, 0x7c, 0x54, 0x63, 0x67, 0xe6, 0x5, 0x30, 0xf,
        ]),
        location: { level: 24, index: 0x9n },
      },
      {
        node: Node.from([
          0xd, 0xc0, 0x20, 0xc, 0x82, 0xca, 0xab, 0xa4, 0x8f, 0xa2, 0x79, 0x27,
          0x33, 0xff, 0x2, 0x47, 0xaf, 0x26, 0xa2, 0xe6, 0x70, 0x31, 0x9a, 0xd2,
          0x68, 0x4e, 0x64, 0xd0, 0x15, 0x25, 0x97, 0x15,
        ]),
        location: { level: 25, index: 0x5n },
      },
      {
        node: Node.from([
          0x82, 0x2a, 0xa5, 0xf6, 0xb6, 0xca, 0x27, 0xc9, 0x7d, 0xcd, 0xea,
          0xca, 0x0, 0x42, 0xb1, 0x6d, 0xc7, 0x8e, 0xf, 0x69, 0xfd, 0xfb, 0x79,
          0xfe, 0x44, 0x4, 0x5e, 0x15, 0x2c, 0x24, 0x2d, 0x25,
        ]),
        location: { level: 23, index: 0x18n },
      },
      {
        node: Node.from([
          0x79, 0x12, 0xd5, 0xf7, 0x73, 0xa1, 0xf1, 0x9d, 0x77, 0x2a, 0xef,
          0x76, 0xab, 0xeb, 0xbd, 0x9e, 0x4, 0x44, 0x30, 0xea, 0x66, 0xd2, 0x55,
          0x5c, 0xff, 0x10, 0x3b, 0x9c, 0x34, 0x5d, 0xbf, 0x3d,
        ]),
        location: { level: 24, index: 0xdn },
      },
    ]

    const hybrid = AggregateTree.create(30)
    AggregateTree.batchSet(hybrid, source)

    assert.deepEqual(hybrid.root, expect)

    for (const { location, node } of source) {
      const proof = hybrid.collectProof(location.level, location.index)
      assert.deepEqual(Proof.computeRoot(node, proof), { ok: expect })
    }

    hybrid.setNode(0, 1n << (30n - 1n), Node.from([0x1]))
  },

  'hybrid can can have at most 60': (assert) => {
    assert.throws(() => AggregateTree.create(61), /too many leafs/)
  },

  'hybrid with 0 leafs': (assert) => {
    const hybrid = AggregateTree.create(0)
    assert.deepEqual(hybrid.height, 0)
    assert.deepEqual(hybrid.root, Node.empty())

    assert.throws(() => hybrid.node(61, 0n), /level too high/)
  },

  'hybrid can not have negative leafs': (assert) => {
    assert.throws(() => AggregateTree.create(-1), /cannot have negative/)
  },

  'fail when left subtree is not empty': (assert) => {
    const tree = AggregateTree.create(8)

    tree.setNode(4, 0n, Node.from([0x1]))

    assert.throws(
      () => tree.setNode(5, 0n, Node.from([0x2])),
      /left subtree is not empty/
    )
  },

  'fail when right subtree is not empty': (assert) => {
    const tree = AggregateTree.create(8)

    tree.setNode(4, 1n, Node.from([0x1]))

    assert.throws(
      () => tree.setNode(5, 0n, Node.from([0x2])),
      /right subtree is not empty/
    )
  },

  'fail when setting node in invalid location': (assert) => {
    const tree = AggregateTree.create(8)

    assert.throws(
      () => tree.setNode(-5, 0n, Node.from([0x2])),
      /level can not be negative/
    )
  },

  'fail when node index is too large': (assert) => {
    const tree = AggregateTree.create(8)

    assert.throws(
      () => tree.setNode(4, 16n, Node.from([0x1])),
      /index too large/
    )
  },

  'can clear tree': (assert) => {
    const nonEmpty = PieceTree.fromLeafs([
      Node.empty(),
      Node.empty(),
      Node.empty(),
      Node.of(0x1),
    ])

    const empty = PieceTree.fromLeafs([
      Node.empty(),
      Node.empty(),
      Node.empty(),
      Node.empty(),
    ])

    const tree = AggregateTree.create(2)

    assert.deepEqual(tree.root, empty.root)

    tree.setNode(0, 3n, Node.of(0x1))

    assert.deepEqual(tree.root, nonEmpty.root)
    tree.clear()

    assert.deepEqual(tree.root, empty.root)

    tree.setNode(0, 3n, Node.of(0x1))

    assert.deepEqual(tree.root, nonEmpty.root)
  },
}
