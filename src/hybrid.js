import * as API from './api.js'
import * as Node from './node.js'
import * as zeroComm from './zero-comm.js'
import * as Proof from './proof.js'

const MAX = 60

/**
 * @param {number} log2Leafs
 */
export const create = (log2Leafs) => {
  if (log2Leafs > 60) {
    throw new Error(`too many leafs: ${log2Leafs}`)
  }

  if (log2Leafs < 0) {
    throw new Error(`cannot have negative log2Leafs`)
  }

  return new Hybrid(log2Leafs)
}

class Hybrid {
  /**
   * The sparse array contains the data of the tree. Levels of the tree are
   * counted from the leaf layer (layer 0).
   * Where the leaf layer lands depends on the `log2Leafs` value.
   * The root node of a the tree is stored at position [1].
   *
   * @param {number} log2Leafs
   * @param {SparseArray<API.MerkleTreeNode>} data
   */

  constructor(log2Leafs, data = new SparseArray()) {
    this.log2Leafs = log2Leafs
    this.data = data
  }

  get maxLevel() {
    return this.log2Leafs
  }

  get root() {
    try {
      return this.getNode(this.maxLevel, 0)
    } catch (cause) {
      const error = /** @type {Error} */ (cause)
      throw new Error('unexpected: ' + error.message)
    }
  }

  /**
   * Collects a proof from the specified node to the root of the tree.
   *
   * @param {number} level
   * @param {number} index
   */
  collectProof(level, index) {
    validateLevelIndex(this.log2Leafs, level, index)
    const path = []
    let currentLevel = level
    let currentIndex = index
    while (currentLevel < this.maxLevel) {
      // idx^1 is the sibling index
      const node = this.getNode(currentLevel, currentIndex ^ 1)
      currentIndex = currentIndex / 2
      path.push(node)
      currentLevel++
    }

    return { path, index }
  }

  /**
   *
   * @param {number} level
   * @param {number} index
   */
  getNode(level, index) {
    const node = getNodeRaw(this, level, index)
    return node || zeroComm.fromLevel(level)
  }

  /**
   *
   * @param {number} level
   * @param {number} index
   * @param {API.MerkleTreeNode} node
   */
  setNode(level, index, node) {
    validateLevelIndex(this.log2Leafs, level, index)

    if (level > 0) {
      let left = getNodeRaw(this, level - 1, 2 * index)
      let right = getNodeRaw(this, level - 1, 2 * index + 1)

      if (left) {
        throw new Error('left subtree not empty')
      }

      if (right) {
        throw new Error('right subtree not empty')
      }
    }

    this.data.set(idxFor(this.log2Leafs, level, index), node)

    let currentIndex = index
    let n = level
    while (n < this.maxLevel) {
      const nextIndex = currentIndex >> 1
      // clear the lowest bit of index for left node
      const left = getNodeRaw(this, n, currentIndex & ~1)
      // set the lowest bit of index for right now
      const right = getNodeRaw(this, n, currentIndex | 1)

      const node =
        left === null && right === null
          ? Node.empty()
          : Proof.computeNode(
              left || zeroComm.fromLevel(n),
              right || zeroComm.fromLevel(n)
            )

      this.data.set(idxFor(this.log2Leafs, n + 1, nextIndex), node)
      currentIndex = nextIndex
      n++
    }
  }
}

/**
 * @type {number}
 */
const SparseBlockLog2Size = 8

/**
 * @type {number}
 */
const SparseBlockSize = 1 << SparseBlockLog2Size

/**
 * @template T
 */
class SparseArray {
  /**
   * @param {Map<number, T[]>} subs
   */
  constructor(subs = new Map()) {
    /**
     * @private
     */
    this.subs = subs
  }
  clear() {
    this.subs.clear()
  }
  /**
   * @param {number} index
   * @returns {T | undefined}
   */
  at(index) {
    const subIndex = Math.floor(index / SparseBlockSize)
    const sub = this.subs.get(subIndex)
    if (!sub) {
      return undefined
    }

    return sub[index % SparseBlockSize]
  }
  /**
   * @param {number} index
   * @param {T} value
   */
  set(index, value) {
    const subIndex = Math.floor(index / SparseBlockSize)
    let sub = this.subs.get(subIndex)
    if (!sub) {
      sub = new Array(SparseBlockSize)
      this.subs.set(subIndex, sub)
    }

    sub[index % SparseBlockSize] = value
  }

  /**
   * @param {number} start
   * @param {number} end
   * @returns
   */
  slice(start, end) {
    const startSub = Math.floor(start / SparseBlockSize)
    const endSub = Math.floor((end - 1) / SparseBlockSize)
    if (startSub !== endSub) {
      throw new Error('requested slice does not align with one sparse block')
    }

    let sub = this.subs.get(startSub)
    if (!sub) {
      sub = new Array(SparseBlockSize)
      this.subs.set(startSub, sub)
    }

    return sub.slice(start % SparseBlockSize, end % SparseBlockSize)
  }
}

/**
 * @param {Hybrid} tree
 * @param {API.MerkleTreeNodeSource[]} values
 */
export const batchSet = (tree, values) => {
  for (const {
    location: { level, index },
    node,
  } of values) {
    tree.setNode(level, index, node)
  }
}

/**
 * @param {Hybrid} tree
 */
export const clear = (tree) => {
  tree.data.clear()
}

/**
 * @typedef {{
 * log2Leafs: number
 * data: SparseArray<API.MerkleTreeNode>
 * }} Model
 *
 * @param {Model} tree
 * @param {number} level
 * @param {number} idx
 */
const getNodeRaw = (tree, level, idx) => {
  validateLevelIndex(tree.log2Leafs, level, idx)

  return tree.data.at(idxFor(tree.log2Leafs, level, idx))
}

/**
 * @param {number} maxLevel
 * @param {number} level
 * @param {number} index
 */
const validateLevelIndex = (maxLevel, level, index) => {
  if (level < 0) {
    throw new Error('level is negative')
  }

  if (level > maxLevel) {
    throw new Error(`level too high: ${level} >= ${maxLevel}`)
  }

  if (index > (1 << (maxLevel - level)) - 1) {
    throw new Error(`index too large for level: idx ${index}, level ${level}`)
  }
}

/**
 * @param {number} maxLevel
 * @param {number} level
 * @param {number} index
 * @returns {number}
 */
export const idxFor = (maxLevel, level, index) => {
  const depth = maxLevel - level
  // Hybrid Tree stores the MT as smaller trees in chunks dictated by SparseBlockSize
  // For example with SparseBlockLog2Size of 8, each SparseBlock will store a single
  // 8 deep tree. These threes are then stored one after breath-wise.
  const SubtreeDepth = SparseBlockLog2Size

  // how deep is the subtree counted by subtree
  const depthOfSubtree = Math.floor(depth / SubtreeDepth)
  const depthInSubtree = depth % SubtreeDepth

  // how wide is the subtree for given depth
  const widthOfSubtreeAtDepth = 1 << depthInSubtree
  // what is the index of the subtree we should write to
  const indexOfSubtree = Math.floor(index / widthOfSubtreeAtDepth)
  // what is the index in subtree
  const indexInSubtree = widthOfSubtreeAtDepth + (index % widthOfSubtreeAtDepth)

  const offsetOfSubtreeLayer =
    (Math.pow(2, (depthOfSubtree + 1) * SparseBlockLog2Size) - 1) /
      (SparseBlockSize - 1) -
    1

  const offsetOfSubtree =
    offsetOfSubtreeLayer + SparseBlockSize * indexOfSubtree

  return offsetOfSubtree + indexInSubtree
}
