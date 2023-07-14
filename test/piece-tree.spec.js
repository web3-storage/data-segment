import { Tree } from '@web3-storage/data-segment'

/**
 * @type {import("entail").Suite}
 */
export const testTree = {
  'throws on empty tree': async (assert) => {
    let result = null
    try {
      result = Tree.fromChunks([])
    } catch (error) {
      result = { catch: error }
    }

    assert.ok(String(Object(result).catch).includes('Empty source'))
  },

  'builds from chunks': async (assert) => {
    const tree = await Tree.build(new Uint8Array(128))
    assert.equal(tree.height, 2)
    assert.equal(tree.leafs.length, 4)
    assert.equal(tree.node(0, 0), tree.root)
    assert.equal(tree.leafCount, 4)
  },
  'throws when exceeding max leaf count': async (assert) => {
    assert.throws(() => Tree.allocate(2 ** 32), /too many leafs/)
  },
}
