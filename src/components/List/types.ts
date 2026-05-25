import type { Component, Ref } from 'vue'
import type { PrimitiveProps } from 'reka-ui'

export type ListKey = string | number

export type ListSelection = 'none' | 'single' | 'multiple'

export type ListAriaMode = 'listbox' | 'grid'

export type ListSortDirection = 'asc' | 'desc'

export interface ListSort {
  key: string
  direction: ListSortDirection
}

export type ListColumnAlign = 'left' | 'center' | 'right'

/**
 * Flat column descriptor. Consumers declare an array of these and pass each
 * via `:column` to <List.ColumnHeader> / <List.Cell>. No function-returning-
 * VNode fields (P10) — customization happens through the default slot on the
 * primitive that receives the column.
 */
export interface Column<Key extends string = string> {
  key: Key
  label: string
  width?: number | string
  align?: ListColumnAlign
  resizable?: boolean
  hidden?: boolean
  sortable?: boolean
}

export interface ListItemEntry<Key extends ListKey = ListKey> {
  id: string
  value: Key | undefined
  disabled: boolean
  el: HTMLElement | null
}

export interface ListRootContext<Key extends ListKey = ListKey> {
  /** Resolved live ARIA mode — auto-promotes to `grid` when Columns registers. */
  ariaMode: Ref<ListAriaMode>
  selection: ListSelection
  activeId: { value: string | null }
  /** Grid-mode cursor — null when no cell has roving tabindex. */
  activeCell: { value: { rowId: string; columnKey: string } | null }
  selected: Ref<Set<Key>>
  items: Map<string, ListItemEntry<Key>>
  orderedIds: { value: string[] }
  registerItem: (entry: ListItemEntry<Key>) => void
  unregisterItem: (id: string) => void
  updateItem: (id: string, patch: Partial<ListItemEntry<Key>>) => void
  /**
   * Slice 4: tabular layer registers itself here so Cells (rendered inside
   * Items, outside the Columns DOM subtree) can read widths/order/align via
   * Root. Returns an unregister fn. Only one Columns block per Root.
   */
  registerColumns: (ctx: ListColumnsContext) => () => void
  /** Live Columns context, or null when no <List.Columns> has registered. */
  columns: Ref<ListColumnsContext | null>
  setActive: (id: string | null, opts?: { focus?: boolean }) => void
  setActiveCell: (
    rowId: string | null,
    columnKey: string | null,
    opts?: { focus?: boolean },
  ) => void
  /** Register a cell DOM element so Root can focus it on 2D arrow nav. */
  registerCell: (rowId: string, columnKey: string, el: HTMLElement) => void
  unregisterCell: (rowId: string, columnKey: string) => void
  isSelected: (value: Key | undefined) => boolean
  /** Selection helpers — exposed both on Root slot scope and here for Item. */
  select: (value: Key, event?: MouseEvent | KeyboardEvent) => void
  toggle: (value: Key) => void
  activate: (value: Key) => void
  selectAll: () => void
  clear: () => void
}

/**
 * Shared state exposed by <List.Columns> to descendants (ColumnHeaders) and,
 * via Root registration, to siblings (Cells inside Items).
 */
export interface ListColumnsContext {
  /** Current sort spec. Multi-key sort is supported; most consumers use one. */
  sort: Ref<ListSort[]>
  /** Per-column width override; merged on top of `column.width`. */
  widths: Ref<Record<string, number | string>>
  /** Explicit column order; merged on top of declared order. */
  order: Ref<string[]>
  setSort: (next: ListSort[]) => void
  setWidth: (key: string, width: number | string) => void
  setOrder: (next: string[]) => void
  /** Cycle a column's sort direction: none → asc → desc → none. */
  toggleSort: (key: string) => void
  /** Resize drag bookkeeping — headers call into these from pointer handlers. */
  beginResize: (key: string, startX: number, startWidth: number) => void
  /** Reorder drag bookkeeping — headers call into these from drag handlers. */
  beginReorder: (key: string) => void
  reorderTo: (key: string) => void
  endReorder: () => void
}

export interface ListRootProps extends /* @vue-ignore */ PrimitiveProps {
  /** Underlying element/component for Root. Defaults to <ul>. */
  as?: PrimitiveProps['as']
  /** Merge attributes into the child element instead of rendering a wrapper. */
  asChild?: boolean
  /** Selection mode. Defaults to "none". */
  selection?: ListSelection
  /** Accessible label for the listbox. */
  ariaLabel?: string
  /** ID of element labelling the listbox (mirrors `aria-labelledby`). */
  ariaLabelledby?: string
  /** Opt-in: enable type-to-search jump-by-prefix navigation. */
  typeahead?: boolean
}

export interface ListItemProps<Key extends ListKey = ListKey>
  extends /* @vue-ignore */ PrimitiveProps {
  /** Underlying element/component for Item. Defaults to <li>. */
  as?: PrimitiveProps['as'] | Component
  /** Merge attributes into the child element instead of rendering a wrapper. */
  asChild?: boolean
  /** Stable identity for selection / activation. Required once selection is enabled. */
  value?: Key
  /** Skip the item in keyboard navigation and selection. */
  disabled?: boolean
}

export interface ListColumnsProps extends /* @vue-ignore */ PrimitiveProps {
  /** Underlying element/component for the header row. Defaults to <thead>. */
  as?: PrimitiveProps['as'] | Component
  /** Merge attributes into the child element instead of rendering a wrapper. */
  asChild?: boolean
}

export interface ListColumnHeaderProps<Key extends string = string>
  extends /* @vue-ignore */ PrimitiveProps {
  /** Underlying element/component for the header cell. Defaults to <th>. */
  as?: PrimitiveProps['as'] | Component
  /** Merge attributes into the child element instead of rendering a wrapper. */
  asChild?: boolean
  /** Column descriptor for this header. */
  column: Column<Key>
}

export interface ListCellProps<Key extends string = string>
  extends /* @vue-ignore */ PrimitiveProps {
  /** Underlying element/component for the cell. Defaults to <td>. */
  as?: PrimitiveProps['as'] | Component
  /** Merge attributes into the child element instead of rendering a wrapper. */
  asChild?: boolean
  /** Column descriptor for this cell — supplies width/align/order via Root. */
  column: Column<Key>
}
