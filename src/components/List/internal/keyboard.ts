/**
 * Listbox 1D keyboard navigation. Pure: given a list of items and a key,
 * returns the next active index — or `null` if the key is unhandled or
 * there is no valid target. The Vue layer translates that into focus moves.
 */

export interface NavItem {
  disabled?: boolean
  /**
   * Item is structurally present (registered with Root) but hidden from
   * keyboard nav — used by <List.Group v-model:collapsed> so collapsed-group
   * rows are skipped without changing their `disabled` semantic.
   */
  skipped?: boolean
}

const PAGE_STEP = 10

export const LISTBOX_NAV_KEYS = [
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
  'PageDown',
  'PageUp',
] as const

export type ListboxNavKey = (typeof LISTBOX_NAV_KEYS)[number]

export function isListboxNavKey(key: string): key is ListboxNavKey {
  return (LISTBOX_NAV_KEYS as readonly string[]).includes(key)
}

/** Predicate used by both nav and range-select to exclude an item. */
export function isNavSkipped(item: NavItem): boolean {
  return !!item.disabled || !!item.skipped
}

function findEnabled(
  items: NavItem[],
  start: number,
  step: 1 | -1,
): number | null {
  let i = start
  while (i >= 0 && i < items.length) {
    if (!isNavSkipped(items[i])) return i
    i += step
  }
  return null
}

export function nextListboxIndex(
  items: NavItem[],
  current: number,
  key: string,
): number | null {
  if (items.length === 0) return null
  if (!isListboxNavKey(key)) return null

  const last = items.length - 1

  switch (key) {
    case 'ArrowDown':
      return findEnabled(items, current + 1, 1)
    case 'ArrowUp':
      return findEnabled(items, current - 1, -1)
    case 'Home':
      return findEnabled(items, 0, 1)
    case 'End':
      return findEnabled(items, last, -1)
    case 'PageDown': {
      const target = Math.min(current + PAGE_STEP, last)
      // Prefer the page-down target; if disabled, scan backwards toward current
      // so we still move forward but land on the nearest enabled row.
      return (
        findEnabled(items, target, -1) ?? findEnabled(items, current + 1, 1)
      )
    }
    case 'PageUp': {
      const target = Math.max(current - PAGE_STEP, 0)
      return (
        findEnabled(items, target, 1) ?? findEnabled(items, current - 1, -1)
      )
    }
  }
}

/**
 * Space / Enter classification. Kept separate from {@link isListboxNavKey} so
 * the Vue layer can treat selection vs. activation as independent axes — a
 * `selection="none"` list still activates on Enter.
 */
export function isToggleKey(key: string): boolean {
  return key === ' ' || key === 'Spacebar'
}

export function isActivationKey(key: string): boolean {
  return key === 'Enter'
}

/**
 * Typeahead (opt-in on Root). Returns the index of the next enabled item
 * whose label starts with `query`, starting the scan just after `current` and
 * wrapping. Returns `null` when nothing matches.
 *
 * Label resolution is the caller's responsibility — selection-state and DOM
 * concerns stay out of this module.
 */
export interface TypeaheadItem extends NavItem {
  label: string
}

export function nextTypeaheadIndex(
  items: TypeaheadItem[],
  current: number,
  query: string,
): number | null {
  if (items.length === 0 || query === '') return null
  const q = query.toLowerCase()
  const n = items.length

  // When the query is a single repeated char ("ggg"), advance to the *next*
  // item starting with that char rather than re-matching the current one.
  const sameChar = q.length > 1 && q.split('').every((c) => c === q[0])
  const startOffset = sameChar ? 1 : 0
  const origin = current < 0 ? 0 : current

  for (let step = startOffset; step < n + startOffset; step++) {
    const idx = (origin + step) % n
    const item = items[idx]
    if (isNavSkipped(item)) continue
    const candidate = sameChar ? q[0] : q
    if (item.label.toLowerCase().startsWith(candidate)) return idx
  }
  return null
}
