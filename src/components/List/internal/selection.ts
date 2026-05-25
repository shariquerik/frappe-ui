/**
 * Headless selection logic for <List.Root>. Pure: every function takes the
 * current `Set<Key>` plus arguments and returns a new `Set<Key>`. No Vue
 * reactivity here — the component layer wraps these.
 *
 * Single mode is "a Set you've agreed to never grow past 1". `applySelection`
 * is the single funnel that enforces that invariant: it clamps the result down
 * to the most-recent value when mode is "single", and returns the input
 * untouched when mode is "none".
 */
import type { ListKey, ListSelection } from '../types'

export interface SelectableItem<Key extends ListKey = ListKey> {
  value: Key
  disabled?: boolean
}

function clamp<Key extends ListKey>(
  next: Set<Key>,
  mode: ListSelection,
  preferred?: Key,
): Set<Key> {
  if (mode === 'none') return new Set()
  if (mode === 'single') {
    if (next.size <= 1) return next
    // Prefer the explicitly-named value (the one the user just touched);
    // fall back to the last inserted value in the Set.
    if (preferred !== undefined && next.has(preferred)) {
      return new Set([preferred])
    }
    let last: Key | undefined
    for (const v of next) last = v
    return last === undefined ? new Set() : new Set([last])
  }
  return next
}

export function toggleSelection<Key extends ListKey>(
  current: Set<Key>,
  value: Key,
  mode: ListSelection,
): Set<Key> {
  if (mode === 'none') return current

  if (mode === 'single') {
    // Toggle semantics in single mode: clicking the already-selected row
    // deselects it; clicking anything else replaces.
    if (current.has(value) && current.size === 1) return new Set()
    return new Set([value])
  }

  const next = new Set(current)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

/**
 * Range select from anchor to target, additive over current selection.
 * Only meaningful in `multiple` mode — other modes fall back to a single-
 * value toggle so callers don't need to branch.
 *
 * Disabled items in the range are skipped. If `anchor` is null/undefined or
 * not present in `items`, the range starts at `target` itself.
 */
export function extendRange<Key extends ListKey>(
  current: Set<Key>,
  items: readonly SelectableItem<Key>[],
  anchor: Key | null | undefined,
  target: Key,
  mode: ListSelection,
): Set<Key> {
  if (mode !== 'multiple') return toggleSelection(current, target, mode)

  const targetIndex = items.findIndex((i) => i.value === target)
  if (targetIndex < 0) return current

  const anchorIndex =
    anchor == null ? -1 : items.findIndex((i) => i.value === anchor)
  const start = anchorIndex < 0 ? targetIndex : anchorIndex
  const [lo, hi] = start <= targetIndex ? [start, targetIndex] : [targetIndex, start]

  const next = new Set(current)
  for (let i = lo; i <= hi; i++) {
    const item = items[i]
    if (!item.disabled) next.add(item.value)
  }
  return next
}

export function selectAll<Key extends ListKey>(
  items: readonly SelectableItem<Key>[],
  mode: ListSelection,
): Set<Key> {
  if (mode !== 'multiple') return new Set()
  const next = new Set<Key>()
  for (const item of items) {
    if (!item.disabled) next.add(item.value)
  }
  return next
}

export function clearSelection<Key extends ListKey>(): Set<Key> {
  return new Set()
}

/**
 * Apply an arbitrary candidate set, enforcing the mode's invariant. Used as
 * the funnel for every selection update so single-mode can never accidentally
 * persist a >1 set written by a consumer.
 */
export function applySelection<Key extends ListKey>(
  candidate: Set<Key>,
  mode: ListSelection,
  preferred?: Key,
): Set<Key> {
  return clamp(candidate, mode, preferred)
}

export function singleValue<Key extends ListKey>(
  selected: Set<Key>,
  mode: ListSelection,
): Key | undefined {
  if (mode !== 'single') return undefined
  for (const v of selected) return v
  return undefined
}
