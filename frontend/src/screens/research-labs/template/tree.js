/**
 * Template Lab's block tree: the same JSON the backend stores, checks and searches. Pure
 * functions, so the builder swaps one tree for the next and undo is a stack of trees.
 *
 * A block is addressed by the path of input indices from the root: `[]` is the root and
 * `[0, 1]` the second input of the root's first input.
 */
export const TAGS = ['A', 'B', 'C', 'D']
export const GROUP_FIELDS = ['market', 'sector', 'industry', 'subindustry']
export function at(root, path) {
  let node = root
  for (const index of path) {
    if (node === null || node.kind !== 'op') return null
    node = node.args[index] ?? null
  }
  return node
}
export function put(root, path, next) {
  const [index, ...rest] = path
  if (index === undefined) return next
  if (root === null || root.kind !== 'op') return root
  const args = root.args.slice()
  args[index] = put(root.args[index] ?? null, rest, next)
  return { ...root, args }
}
/** Whether `path` is `ancestor` itself or lies inside it. */
export function within(path, ancestor) {
  return ancestor.length <= path.length && ancestor.every((index, i) => path[i] === index)
}
export const pathKey = (path) => (path.length ? path.join('.') : 'root')
export const keyPath = (key) => (key === 'root' ? [] : key.split('.').map(Number))
/**
 * Moves a placed block onto another slot: an empty slot takes it, a filled one swaps with
 * it, and dropping a block on its own ancestor replaces that ancestor. `undefined` when the
 * target is the block itself or lies inside it.
 */
export function move(root, from, to, blocks) {
  if (!canMove(root, from, to, blocks)) return undefined
  const node = at(root, from)
  if (node === null) return undefined
  if (within(from, to)) return put(root, to, node)
  return put(put(root, from, at(root, to)), to, node)
}
/** Whether a placed block may be dropped on ``to``. A swap is two placements, so the displaced
 * block has to be legal where the dragged one came from, not just the dragged one. */
export function canMove(root, from, to, blocks) {
  const node = at(root, from)
  if (node === null || within(to, from)) return false
  if (!accepts(socketAt(root, to, blocks), node, blocks)) return false
  // Dropping onto an ancestor replaces it; nothing is displaced back.
  if (within(from, to)) return true
  const displaced = at(root, to)
  return displaced === null || accepts(socketAt(root, from, blocks), displaced, blocks)
}
/** The block an operator node draws its inputs and options from: its first choice. */
export const blockOf = (blocks, node) => blocks[node.ops[0] ?? '']
export function socketAt(root, path, blocks) {
  const last = path.at(-1)
  if (last === undefined) return 'signal'
  const parent = at(root, path.slice(0, -1))
  if (parent === null || parent.kind !== 'op') return 'signal'
  return blockOf(blocks, parent)?.inputs[last] ?? 'signal'
}
/** Whether a block may go in an input: fields and operators are signals, lookbacks and groups have their own. */
export function accepts(socket, node, blocks) {
  if (node.kind === 'var') {
    if (node.name === 'GROUP') return socket === 'group'
    if (node.name === 'FIELD' || node.name === 'WEIGHT' || node.name === 'POWER')
      return socket === 'signal'
    return socket === 'lookback'
  }
  if (node.kind === 'data')
    return GROUP_FIELDS.includes(node.name) ? socket === 'group' : socket === 'signal'
  if (node.kind === 'num')
    return (
      socket === 'signal' ||
      (socket === 'lookback' && Number.isInteger(node.value) && node.value > 0)
    )
  return socket === (blockOf(blocks, node)?.output ?? 'signal')
}
export function blank(block) {
  return { kind: 'op', ops: [block.name], args: block.inputs.map(() => null) }
}
/** Drops a new block on a slot. An operator dropped on a filled slot wraps what was there. */
export function drop(root, path, node, blocks) {
  const current = at(root, path)
  if (current !== null && node.kind === 'op') {
    const inputs = blockOf(blocks, node)?.inputs ?? []
    const index = inputs.findIndex(
      (socket, i) => node.args[i] === null && accepts(socket, current, blocks),
    )
    if (index >= 0) {
      const args = node.args.slice()
      args[index] = current
      return put(root, path, { ...node, args })
    }
  }
  return put(root, path, node)
}
/** Removes an operator block, keeping the first of its inputs that fits where it was. */
export function unwrap(root, path, blocks) {
  const node = at(root, path)
  if (node === null || node.kind !== 'op') return put(root, path, null)
  const socket = socketAt(root, path, blocks)
  const keep = node.args.find((child) => child !== null && accepts(socket, child, blocks)) ?? null
  return put(root, path, keep)
}
export function sameInputs(a, b) {
  return a.length === b.length && a.every((socket, i) => socket === b[i])
}
/** Operators that may share a choice block with this one: the same inputs, and every option it sets. */
export function choices(node, blocks) {
  const first = blockOf(blocks, node)
  if (!first) return []
  const set = Object.keys(node.options ?? {})
  return Object.values(blocks).filter(
    (block) => sameInputs(block.inputs, first.inputs) && set.every((key) => key in block.options),
  )
}
export function walk(root, visit, path = []) {
  if (root === null) return
  visit(root, path)
  if (root.kind !== 'op') return
  root.args.forEach((child, index) => {
    walk(child, visit, [...path, index])
  })
}
export function count(root) {
  let total = 0
  walk(root, () => {
    total += 1
  })
  return total
}
export function holes(root, path = []) {
  if (root === null) return [path]
  if (root.kind !== 'op') return []
  return root.args.flatMap((child, index) => holes(child, [...path, index]))
}
/** The first empty slot a block fits, so clicking a palette block places it. */
export function firstHole(root, node, blocks) {
  return holes(root).find((path) => accepts(socketAt(root, path, blocks), node, blocks)) ?? null
}
export function tagsOf(root, name) {
  const found = new Set()
  walk(root, (node) => {
    if (node.kind === 'var' && node.name === name) found.add(node.tag)
  })
  return TAGS.filter((tag) => found.has(tag))
}
export function nextTag(root, name) {
  const used = new Set(tagsOf(root, name))
  return TAGS.find((tag) => !used.has(tag)) ?? null
}
/** A new variable block, linked to the first tag of its name already in the template. */
export function variable(root, name) {
  return { kind: 'var', name, tag: tagsOf(root, name)[0] ?? 'A' }
}
export function retag(root, path, tag) {
  const node = at(root, path)
  return node?.kind === 'var' ? put(root, path, { ...node, tag }) : root
}
const VARIABLES = [
  'FIELD',
  'LOOKBACK',
  'FAST_LOOKBACK',
  'SLOW_LOOKBACK',
  'GROUP',
  'WEIGHT',
  'POWER',
]
const CATEGORIES = [
  'Cross Sectional',
  'Time Series',
  'Group',
  'Arithmetic',
  'Logical',
  'Transformational',
]
/** What the palette offers, section by section: variables, fields, numbers, then operators by category. */
export function paletteSections(root, blocks, options) {
  const operators = new Map()
  for (const block of Object.values(blocks)) {
    const items = operators.get(block.category) ?? []
    items.push({
      key: `op:${block.name}`,
      label: block.symbol ? `${block.name} ${block.symbol}` : block.name,
      node: blank(block),
      hint: block.description ?? undefined,
    })
    operators.set(block.category, items)
  }
  const categories = [
    ...CATEGORIES.filter((c) => operators.has(c)),
    ...[...operators.keys()].filter((c) => !CATEGORIES.includes(c)),
  ]
  return [
    {
      heading: 'Variables',
      items: VARIABLES.map((name) => ({
        key: `var:${name}`,
        label: name,
        node: variable(root, name),
        hint: describe(name, options),
      })),
    },
    {
      heading: 'Data Fields',
      items: (options?.dataFields ?? []).map((name) => ({
        key: `data:${name}`,
        label: name,
        node: { kind: 'data', name },
      })),
    },
    {
      heading: 'Grouping Fields',
      items: (options?.groupFields ?? []).map((name) => ({
        key: `group:${name}`,
        label: name,
        node: { kind: 'data', name },
      })),
    },
    {
      heading: 'Numbers',
      items: [{ key: 'num', label: 'Number', node: { kind: 'num', value: 1 } }],
    },
    ...categories.map((heading) => ({
      heading,
      items: operators.get(heading) ?? [],
    })),
  ]
}
function describe(name, options) {
  if (name === 'FIELD')
    return 'A field from your datasets. Blocks with the same letter are the same field.'
  const values = options?.variables[name] ?? []
  return `Blocks with the same letter take the same value: ${values.join(', ')}.`
}
// ── Layout ──────────────────────────────────────────────────────────────────────────────
/** An operator's arguments as display rows: runs of leaves share a row, each operator gets its own. */
export function argumentRows(args) {
  const out = []
  args.forEach((arg, index) => {
    const last = out.at(-1)
    const lead = last?.[0]
    if (arg?.kind !== 'op' && last && lead !== undefined && args[lead]?.kind !== 'op')
      last.push(index)
    else out.push([index])
  })
  return out
}
