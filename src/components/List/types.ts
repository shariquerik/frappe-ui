import type { Component, Ref } from 'vue'
import type { PrimitiveProps } from 'reka-ui'

export type ListKey = string | number

export type ListSelection = 'none' | 'single' | 'multiple'

export type ListAriaMode = 'listbox' | 'grid'

export interface ListItemEntry<Key extends ListKey = ListKey> {
  id: string
  value: Key | undefined
  disabled: boolean
  el: HTMLElement | null
  /** The id of the enclosing <List.Group>, if any. */
  groupId: string | null
}

export interface ListGroupEntry {
  id: string
  /** Whether the group is currently collapsed; items inside are hidden + skipped. */
  collapsed: boolean
}

export interface ListRootContext<Key extends ListKey = ListKey> {
  ariaMode: ListAriaMode
  selection: ListSelection
  activeId: { value: string | null }
  selected: Ref<Set<Key>>
  items: Map<string, ListItemEntry<Key>>
  orderedIds: { value: string[] }
  groups: Map<string, ListGroupEntry>
  registerItem: (entry: ListItemEntry<Key>) => void
  unregisterItem: (id: string) => void
  updateItem: (id: string, patch: Partial<ListItemEntry<Key>>) => void
  registerGroup: (entry: ListGroupEntry) => void
  unregisterGroup: (id: string) => void
  updateGroup: (id: string, patch: Partial<ListGroupEntry>) => void
  setActive: (id: string | null, opts?: { focus?: boolean }) => void
  isSelected: (value: Key | undefined) => boolean
  /** Selection helpers — exposed both on Root slot scope and here for Item. */
  select: (value: Key, event?: MouseEvent | KeyboardEvent) => void
  toggle: (value: Key) => void
  activate: (value: Key) => void
  selectAll: () => void
  clear: () => void
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

export interface ListItemProps<
  Key extends ListKey = ListKey,
> extends /* @vue-ignore */ PrimitiveProps {
  /** Underlying element/component for Item. Defaults to <li>. */
  as?: PrimitiveProps['as'] | Component
  /** Merge attributes into the child element instead of rendering a wrapper. */
  asChild?: boolean
  /** Stable identity for selection / activation. Required once selection is enabled. */
  value?: Key
  /** Skip the item in keyboard navigation and selection. */
  disabled?: boolean
}

export interface ListGroupProps extends /* @vue-ignore */ PrimitiveProps {
  /** Underlying element/component for Group. Defaults to <li>. */
  as?: PrimitiveProps['as'] | Component
  /** Merge attributes into the child element instead of rendering a wrapper. */
  asChild?: boolean
  /** Plain-text group label. Use <List.GroupLabel> for non-text content. */
  label?: string
}

export interface ListGroupLabelProps extends /* @vue-ignore */ PrimitiveProps {
  /** Underlying element/component for the label. Defaults to <div>. */
  as?: PrimitiveProps['as'] | Component
  /** Merge attributes into the child element instead of rendering a wrapper. */
  asChild?: boolean
}

/**
 * Context provided by <List.Group> to nested <List.Item> and <List.GroupLabel>.
 * Items use it to register their `groupId`; GroupLabel uses it to claim the
 * `aria-labelledby` id.
 */
export interface ListGroupContext {
  id: string
  labelId: string
  setLabelledBySlot: (used: boolean) => void
}
