/**
 * Pure helpers for the <List.Columns> tabular layer. No Vue reactivity — the
 * primitive wraps these and feeds the results to v-models. Keeping them as
 * data-in / data-out functions means the sort-toggle / reorder math stays
 * unit-testable without mounting a component.
 */
import type { Column, ListSort, ListSortDirection } from '../types'

/**
 * Returns the current sort direction for `key`, or `null` if not sorted.
 */
export function sortDirectionFor(
  sort: readonly ListSort[],
  key: string,
): ListSortDirection | null {
  for (const s of sort) {
    if (s.key === key) return s.direction
  }
  return null
}

/**
 * Cycle a column's sort: none → asc → desc → none. Replaces any existing
 * entry for `key`; leaves other keys untouched so multi-key sorts compose.
 */
export function cycleSort(
  current: readonly ListSort[],
  key: string,
): ListSort[] {
  const dir = sortDirectionFor(current, key)
  const others = current.filter((s) => s.key !== key)
  if (dir === null) return [...others, { key, direction: 'asc' }]
  if (dir === 'asc') return [...others, { key, direction: 'desc' }]
  return others
}

/**
 * Resolve the rendered column order. `order` (if non-empty) wins for the
 * keys it mentions; unmentioned keys keep their declared position relative
 * to each other and slot in after the explicit ones. Hidden columns are
 * dropped.
 */
export function resolveColumnOrder<Key extends string>(
  columns: readonly Column<Key>[],
  order: readonly string[],
): Column<Key>[] {
  const visible = columns.filter((c) => !c.hidden)
  if (order.length === 0) return [...visible]

  const byKey = new Map(visible.map((c) => [c.key, c]))
  const seen = new Set<string>()
  const ordered: Column<Key>[] = []

  for (const key of order) {
    const col = byKey.get(key as Key)
    if (col && !seen.has(key)) {
      ordered.push(col)
      seen.add(key)
    }
  }
  for (const col of visible) {
    if (!seen.has(col.key)) ordered.push(col)
  }
  return ordered
}

/**
 * Move `key` to the position currently occupied by `target`. Used by the
 * drag-reorder handler on column headers. Both keys must be present.
 */
export function moveColumn(
  order: readonly string[],
  key: string,
  target: string,
): string[] {
  if (key === target) return [...order]
  const next = order.filter((k) => k !== key)
  const targetIndex = next.indexOf(target)
  if (targetIndex < 0) return [...order]
  next.splice(targetIndex, 0, key)
  return next
}

/**
 * Resolve the effective width for a column — Columns context's `widths`
 * override beats `column.width`. Returns undefined when no width is set.
 */
export function resolveColumnWidth(
  column: { key: string; width?: number | string },
  widths: Record<string, number | string>,
): number | string | undefined {
  const override = widths[column.key]
  if (override !== undefined) return override
  return column.width
}

/**
 * Render a width as a CSS dimension string. Numbers become px.
 */
export function formatWidth(width: number | string | undefined): string | undefined {
  if (width === undefined) return undefined
  return typeof width === 'number' ? `${width}px` : width
}
