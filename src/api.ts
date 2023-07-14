import exp from 'constants'
import type { Link, ToString } from 'multiformats/link'

export { ToString }
/**
 * Implementers of the `Read` interface are called "readers". Readers
 * allow for reading bytes from an underlying source.
 *
 * Readers are defined by one required method, `read`. Each call to `read`
 * will attempt to pull bytes from this source into a provided buffer. A
 * number of high level functions are implemented in terms of `read`, giving
 * users a number of ways to read bytes while only needing to implement a
 * single method.
 *
 * This is based on [std::io::Read] trait in Rust.
 * [std::io::Read]:https://doc.rust-lang.org/nightly/std/io/trait.Read.html
 */
export interface Read {
  /**
   * Pull some bytes from this source into the specified buffer, returning how
   * many bytes were read.
   *
   * If the return value of this method is `{ok: n}`, then implementations MUST
   * guarantee that `0 <= n <= buffer.length`. A nonzero `n` value indicates
   * that the buffer has been filled in with `n` bytes of data from this source.
   * If `n` is `0`, then it can indicate one of two scenarios:
   *
   * 1. This reader has reached its “end of file” and will likely no longer be
   *    able to produce bytes. Note that this does not mean that the reader
   *    will always no longer be able to produce bytes. For example, underlying
   *    source may be a stream that simply does not currently have more data,
   *    but once more data is added read may succeed.
   *
   * 2. The buffer specified was 0 bytes in length.
   *
   * It is not an error if the returned value `n` is smaller than the `buffer`
   * size, even when the reader is not at the end of the stream yet. This may
   * happen for example because fewer bytes are actually available right now.
   */
  read(buffer: Uint8Array): Poll<number, Error>
}

type Poll<T, X> = Variant<{
  ok: T
  error: X
  wait: Promise<void>
}>

export interface Aggregate {
  dealSize: PaddedPieceSize
  index: IndexData
  tree: AggregateTree
}

export interface Vector<T> extends Iterable<T> {
  append(value: T): Vector<T>
}

export type uint64 = bigint

export type PaddedPieceSize = New<{ PaddedPieceSize: uint64 }>

/**
 * `UnpaddedPieceSize` is the size of a piece, in bytes.
 * @see https://github.com/filecoin-project/go-state-types/blob/ff2ed169ff566458f2acd8b135d62e8ca27e7d0c/abi/piece.go#L10C4-L11
 */
export type UnpaddedPieceSize = New<{ UnpaddedPieceSize: uint64 }>

export type Fr23Padded = New<{ Fr23Padded: Uint8Array }>

export interface IndexData {
  entries: SegmentInfo[]
}

export interface MerkleTree<I extends uint64 | number = uint64 | number> {
  /**
   * Amount of leafs in this Merkle tree.
   */
  leafCount: I

  /**
   * Height of the tree.
   */
  height: number
  /**
   * Root node of this Merkle tree.
   */
  root: MerkleTreeNode

  /**
   * Returns a node at the given level and index.
   *
   * @param level
   * @param index
   */
  node(level: number, index: I): MerkleTreeNode | undefined
}

export interface MerkleTreeBuilder<
  I extends uint64 | number = uint64 | number
> {
  clear(): this
  setNode(level: number, index: I, node: MerkleTreeNode): this
}

export interface PieceTree extends MerkleTree<number> {
  /**
   * All leaf nodes of this Merkle tree.
   */
  leafs: MerkleTreeNode[]
}

export interface AggregateTree<I extends uint64 | number = uint64>
  extends MerkleTree<I>,
    MerkleTreeBuilder<I> {
  collectProof(level: number, index: I): ProofData
}

export interface PieceInfo {
  /**
   * Commitment to the data segment (Merkle node which is the root of the
   * subtree containing all the nodes making up the data segment)
   */
  link: PieceLink

  /**
   * Size is the number of padded bytes that is contained in this piece.
   */
  size: PaddedPieceSize
}

export interface PieceInfoView extends PieceInfo {
  /**
   * Height of the perfect binary merkle tree representing
   * this piece.
   */
  height: number
}

/**
 * Represents a piece tree and underlying merkle tree.
 */
export interface Piece extends PieceInfoView {
  tree: PieceTree

  /**
   * Size of the payload from which this piece was derived.
   */
  contentSize: number

  /**
   * Size after 0 padding to next power of 2.
   */
  paddedSize: number

  /**
   * Returns a JSON representation of this piece.
   */
  toJSON(): PieceJSON
}

export interface PieceJSON {
  link: { '/': string }
  height: number
}

export type PieceLink = Link<MerkleTreeNode, 0xf101, 0x1012>

/**
 * Contains a data segment description to be contained as two Fr32 elements in
 * 2 leaf nodes of the data segment index.
 *
 * @see https://github.com/filecoin-project/go-data-segment/blob/41a48065383eca6f52efc4ee78a9902a9d25293b/datasegment/index.go#L146C16-L156
 */
export interface Segment {
  /**
   * Commitment to the data segment (Merkle node which is the root of the
   * subtree containing all the nodes making up the data segment)
   */
  root: MerkleTreeNode

  /**
   * Offset is the offset from the start of the deal in padded bytes
   */
  offset: uint64

  /**
   * Number of padded bytes in this segment
   * reflected by this segment.
   */
  size: uint64
}

/**
 * Segment contains a data segment description to be contained as two Fr32
 * elements in 2 leaf nodes of the data segment index.
 */
export interface SegmentInfo extends Segment {
  /**
   * Checksum is a 126 bit checksum (SHA256) computes on `[...root, offset, size]`
   */
  checksum: Checksum<Segment, 16>
}

export type Checksum<Payload = unknown, Size extends number = number> = New<
  { Checksum: SizedUint8Array<number> },
  Payload
>

export type SizedUint8Array<Size extends number> = New<{
  SizedUint8Array: Uint8Array & { length: Size }
}>

/**
 * Represents a location in a Merkle tree.
 */
export interface MerkleTreeLocation {
  /**
   * Level is counted from the leaf layer, with 0 being leaf layer.
   */
  level: number
  index: uint64
}

/**
 * Represents a commitment and its location in a Merkle tree.
 */
export interface MerkleTreeNodeSource {
  node: MerkleTreeNode
  location: MerkleTreeLocation
}

export interface MerkleProof {
  /**
   * ConstructProof constructs a Merkle proof of the subtree (or leaf) at level lvl with index idx.
   * level 0 is the root and index 0 is the left-most node in a level.
   */
  constructProof(level?: number, index?: number): Result<ProofData, Error>
  /**
   * ValidateFromLeafs checks that the Merkle tree is correctly constructed based on all the leafData
   */
  validateFromLeafs(leafData: Uint8Array[]): Result<Unit, Error>
  /**
   * Validate checks that the Merkle tree is correctly constructed, based on the internal nodes
   */
  validate(): Result<Unit, Error>
}

export interface TreeData {
  /**
   * nodes start from root and go down left-to-right
   * thus `nodes[0].length === 1, nodes[1].length === 2len(nodes[1]) = 2`, etc...
   */
  nodes: MerkleTreeNode[][]

  /**
   * Leafs is the amount of raw leafs being used. I.e. without padding to
   * nearest two-power
   */
  height: number
}

export interface AggregateTreeData {
  /**
   * Height of the (perfect binary) tree.
   */
  height: number

  /**
   * Sparse array that contains tree nodes. Levels
   * of the tree are counted from the leaf layer (0).
   */
  data: SparseArray<MerkleTreeNode>
}

export interface SparseArray<T> {
  clear(): this
  at(index: uint64): T | undefined
  set(index: uint64, value: T): this
}

export interface ProofData {
  path: MerkleTreeNode[]
  // index indicates the index within the level where the element whose membership to prove is located
  // Leftmost node is index 0
  index: uint64
}

export type MerkleTreeNode = New<{ Node: Uint8Array }, { size: 32 }>

export type Tagged<T> = {
  [Case in keyof T]: Exclude<keyof T, Case> extends never
    ? T
    : InferenceError<'It may only contain one key'>
}[keyof T]

declare const Marker: unique symbol

/**
 * A utility type to retain an unused type parameter `T`.
 * Similar to [phantom type parameters in Rust](https://doc.rust-lang.org/rust-by-example/generics/phantom.html).
 *
 * Capturing unused type parameters allows us to define "nominal types," which
 * TypeScript does not natively support. Nominal types in turn allow us to capture
 * semantics not represented in the actual type structure, without requiring us to define
 * new classes or pay additional runtime costs.
 *
 * For a concrete example, see {@link ByteView}, which extends the `Uint8Array` type to capture
 * type information about the structure of the data encoded into the array.
 */
export interface Phantom<T> {
  // This field can not be represented because field name is non-existent
  // unique symbol. But given that field is optional any object will valid
  // type constraint.
  [Marker]?: T
}

export type New<T, Type = Tagged<T>> = Tagged<T>[keyof Tagged<T>] &
  Phantom<Type>

/**
 * Utility type for including type errors in the typescript checking. It
 * defines impossible type (object with non-existent unique symbol field).
 * This type can be used in cases where typically `never` is used, but
 * where some error message would be useful.
 */
interface InferenceError<message> {
  [Marker]: never & message
}

/**
 * Defines result type in an idiomatic IPLD representation.
 */

export type Result<T extends {} = {}, X extends {} = {}> = Variant<{
  ok: T
  error: X
}>

/**
 * @see {@link https://en.wikipedia.org/wiki/Unit_type|Unit type - Wikipedia}
 */
export interface Unit {}
/**
 * Utility type for defining a [keyed union] type as in IPLD Schema. In practice
 * this just works around typescript limitation that requires discriminant field
 * on all variants.
 *
 * ```ts
 * type Result<T, X> =
 *   | { ok: T }
 *   | { error: X }
 *
 * const demo = (result: Result<string, Error>) => {
 *   if (result.ok) {
 *   //  ^^^^^^^^^ Property 'ok' does not exist on type '{ error: Error; }`
 *   }
 * }
 * ```
 *
 * Using `Variant` type we can define same union type that works as expected:
 *
 * ```ts
 * type Result<T, X> = Variant<{
 *   ok: T
 *   error: X
 * }>
 *
 * const demo = (result: Result<string, Error>) => {
 *   if (result.ok) {
 *     result.ok.toUpperCase()
 *   }
 * }
 * ```
 *
 * [keyed union]:https://ipld.io/docs/schemas/features/representation-strategies/#union-keyed-representation
 */
export type Variant<U extends Record<string, unknown>> = {
  [Key in keyof U]: { [K in Exclude<keyof U, Key>]?: never } & {
    [K in Key]: U[Key]
  }
}[keyof U]
