<script setup lang="ts" generic="Key extends ListKey = string">
import { computed, provide, ref, shallowRef, watch } from 'vue'
import { Primitive } from '../internal/asChild'
import { LIST_ROOT_CONTEXT } from '../internal/context'
import {
  isActivationKey,
  isGridNavKey,
  isListboxNavKey,
  isToggleKey,
  nextGridCursor,
  nextListboxIndex,
  nextTypeaheadIndex,
} from '../internal/keyboard'
import {
  applySelection,
  clearSelection as clearSelectionFn,
  extendRange,
  selectAll as selectAllFn,
  singleValue,
  toggleSelection,
  type SelectableItem,
} from '../internal/selection'
import { rootAriaAttrs } from '../internal/aria'
import type {
  ListAriaMode,
  ListColumnsContext,
  ListGroupEntry,
  ListItemEntry,
  ListKey,
  ListRootContext,
  ListRootProps,
} from '../types'

const props = withDefaults(defineProps<ListRootProps>(), {
  as: 'ul',
  asChild: false,
  selection: 'none',
  typeahead: false,
})

const emit = defineEmits<{
  (e: 'update:selected', value: Set<Key>): void
  (e: 'activate', value: Key): void
}>()

const selectedModel = defineModel<Set<Key>>('selected', {
  default: () => new Set<Key>(),
})

defineSlots<{
  default(props: {
    activeId: string | null
    selected: Set<Key>
    selectedValue: Key | undefined
    select: (value: Key, event?: MouseEvent | KeyboardEvent) => void
    toggle: (value: Key) => void
    activate: (value: Key) => void
    selectAll: () => void
    clear: () => void
  }): any
}>()

// Registration order matches DOM order for the slice-1 flat-list case (the
// only ordering source until <List.Group> lands in slice 3, at which point
// this switches to DOM-walking).
const items = new Map<string, ListItemEntry<Key>>()
const orderedIds = ref<string[]>([])
const activeId = ref<string | null>(null)
// Last value the user toggled/clicked — anchor for Shift+Click / Shift+Arrow
// range extension. Lives in Vue state because keyboard.ts is stateless.
const anchorValue = ref<Key | null>(null)
// Group registry — populated by <List.Group> on mount. The reactive bumper
// drives computed re-runs when a group's `collapsed` flips (the Map itself is
// non-reactive for the same reason `items` is).
const groups = new Map<string, ListGroupEntry>()
const groupsVersion = ref(0)

function isItemSkipped(id: string): boolean {
  const entry = items.get(id)
  if (!entry || entry.groupId == null) return false
  const group = groups.get(entry.groupId)
  return !!group?.collapsed
}

// Slice 4: tabular layer. `columns` is null until a <List.Columns> registers,
// at which point the Root flips to grid ARIA mode and 2D keyboard nav.
// `shallowRef` keeps Vue from recursively unwrapping the inner Refs on the
// ListColumnsContext shape — Cells need the live `Ref` accessors.
const columnsCtx = shallowRef<ListColumnsContext | null>(null)
const ariaMode = computed<ListAriaMode>(() =>
  columnsCtx.value ? 'grid' : 'listbox',
)
// Cell registry — a flat map keyed by "rowId::columnKey" so grid-mode focus
// can resolve the DOM element to focus when the cursor moves.
const cellEls = new Map<string, HTMLElement>()
const activeCell = ref<{ rowId: string; columnKey: string } | null>(null)

function cellKey(rowId: string, columnKey: string) {
  return `${rowId}::${columnKey}`
}

function registerColumns(ctx: ListColumnsContext) {
  columnsCtx.value = ctx
  return () => {
    if (columnsCtx.value === ctx) columnsCtx.value = null
  }
}

function registerCell(rowId: string, columnKey: string, el: HTMLElement) {
  cellEls.set(cellKey(rowId, columnKey), el)
  // Seed the active cell on first registration so roving tabindex lands
  // somewhere reasonable before the user reaches for the keyboard.
  if (activeCell.value === null && activeId.value === rowId) {
    activeCell.value = { rowId, columnKey }
  }
}

function unregisterCell(rowId: string, columnKey: string) {
  cellEls.delete(cellKey(rowId, columnKey))
  if (
    activeCell.value?.rowId === rowId &&
    activeCell.value.columnKey === columnKey
  ) {
    activeCell.value = null
  }
}

function setActiveCell(
  rowId: string | null,
  columnKey: string | null,
  opts: { focus?: boolean } = {},
) {
  if (rowId === null || columnKey === null) {
    activeCell.value = null
    return
  }
  activeCell.value = { rowId, columnKey }
  // Keep row-level active in sync so listbox-mode siblings (e.g. selection
  // helpers reading `activeId`) continue to work.
  activeId.value = rowId
  if (opts.focus) {
    const el = cellEls.get(cellKey(rowId, columnKey))
    el?.focus()
  }
}

function visibleColumnKeys(): string[] {
  const ctx = columnsCtx.value
  if (!ctx) return []
  // Use the explicit order if provided; otherwise infer from registered
  // cell keys for the first row. The Columns primitive owns the canonical
  // order via its v-model, so this fallback only kicks in before the
  // consumer hands one in.
  if (ctx.order.value.length > 0) return [...ctx.order.value]
  for (const id of orderedIds.value) {
    const keys: string[] = []
    for (const k of cellEls.keys()) {
      const [rid, col] = k.split('::')
      if (rid === id) keys.push(col)
    }
    if (keys.length > 0) return keys
  }
  return []
}

function firstEnabledId(): string | null {
  // Touch the reactive bumper so this is recomputed when groups toggle.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  groupsVersion.value
  for (const id of orderedIds.value) {
    const entry = items.get(id)
    if (entry && !entry.disabled && !isItemSkipped(id)) return id
  }
  return null
}

function registerItem(entry: ListItemEntry<Key>) {
  items.set(entry.id, entry)
  orderedIds.value = [...orderedIds.value, entry.id]
  if (activeId.value === null && !entry.disabled && !isItemSkipped(entry.id)) {
    activeId.value = entry.id
  }
}

function unregisterItem(id: string) {
  items.delete(id)
  orderedIds.value = orderedIds.value.filter((x) => x !== id)
  if (activeId.value === id) activeId.value = firstEnabledId()
}

function updateItem(id: string, patch: Partial<ListItemEntry<Key>>) {
  const existing = items.get(id)
  if (!existing) return
  Object.assign(existing, patch)
  if (id === activeId.value && (existing.disabled || isItemSkipped(id))) {
    activeId.value = firstEnabledId()
  }
}

function registerGroup(entry: ListGroupEntry) {
  groups.set(entry.id, entry)
  groupsVersion.value++
}

function unregisterGroup(id: string) {
  groups.delete(id)
  groupsVersion.value++
}

function updateGroup(id: string, patch: Partial<ListGroupEntry>) {
  const existing = groups.get(id)
  if (!existing) return
  Object.assign(existing, patch)
  groupsVersion.value++
  // If the active item just became hidden inside a now-collapsed group,
  // move focus to the next visible row.
  if (activeId.value && isItemSkipped(activeId.value)) {
    activeId.value = firstEnabledId()
  }
}

function setActive(id: string | null, opts: { focus?: boolean } = {}) {
  activeId.value = id
  if (opts.focus && id) {
    const entry = items.get(id)
    entry?.el?.focus()
  }
}

function selectableItems(): SelectableItem<Key>[] {
  const list: SelectableItem<Key>[] = []
  for (const id of orderedIds.value) {
    const entry = items.get(id)
    if (!entry || entry.value === undefined) continue
    list.push({
      value: entry.value,
      disabled: entry.disabled,
      skipped: isItemSkipped(id),
    })
  }
  return list
}

function valueOfId(id: string | null): Key | undefined {
  if (id == null) return undefined
  return items.get(id)?.value
}

function isItemDisabled(value: Key): boolean {
  for (const entry of items.values()) {
    if (entry.value === value) return entry.disabled
  }
  return false
}

function commit(next: Set<Key>, preferred?: Key) {
  const clamped = applySelection(next, props.selection, preferred)
  selectedModel.value = clamped
}

function isSelected(value: Key | undefined): boolean {
  if (value === undefined) return false
  return selectedModel.value.has(value)
}

function toggle(value: Key) {
  if (props.selection === 'none') return
  if (isItemDisabled(value)) return
  const next = toggleSelection(selectedModel.value, value, props.selection)
  commit(next, value)
  anchorValue.value = value
}

function activate(value: Key) {
  emit('activate', value)
}

function selectAll() {
  commit(selectAllFn(selectableItems(), props.selection))
}

function clear() {
  commit(clearSelectionFn<Key>())
  anchorValue.value = null
}

/**
 * Smart click/keystroke selector. Decides between toggle and range-extension
 * based on the event's shift modifier and the current mode. This is the
 * helper consumers wire to `@click` on `<List.Item>`.
 */
function select(value: Key, event?: MouseEvent | KeyboardEvent) {
  if (props.selection === 'none') return
  if (isItemDisabled(value)) return
  const shift = !!event?.shiftKey
  if (shift && props.selection === 'multiple') {
    const next = extendRange(
      selectedModel.value,
      selectableItems(),
      anchorValue.value,
      value,
      props.selection,
    )
    commit(next, value)
    // Anchor stays put on shift-extend so consecutive shift-clicks span from
    // the same origin.
    return
  }
  toggle(value)
}

// Typeahead buffer — flushed after a short idle so multi-char prefix matches
// behave like the native listbox pattern. Only allocated when typeahead is on.
let typeaheadQuery = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | null = null

function handleTypeahead(event: KeyboardEvent) {
  if (!props.typeahead) return false
  if (event.key.length !== 1) return false
  if (event.metaKey || event.ctrlKey || event.altKey) return false

  typeaheadQuery += event.key
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => {
    typeaheadQuery = ''
    typeaheadTimer = null
  }, 500)

  const ids = orderedIds.value
  const candidates = ids.map((id) => {
    const entry = items.get(id)
    return {
      disabled: entry?.disabled ?? false,
      skipped: isItemSkipped(id),
      label: entry?.el?.textContent?.trim() ?? '',
    }
  })
  const current = activeId.value ? ids.indexOf(activeId.value) : -1
  const nextIndex = nextTypeaheadIndex(candidates, current, typeaheadQuery)
  if (nextIndex === null) return true

  event.preventDefault()
  setActive(ids[nextIndex], { focus: true })
  return true
}

function onKeyDown(event: KeyboardEvent) {
  const ids = orderedIds.value
  if (ids.length === 0) return

  if (isActivationKey(event.key)) {
    const value = valueOfId(activeId.value)
    if (value !== undefined) {
      event.preventDefault()
      activate(value)
    }
    return
  }

  if (isToggleKey(event.key)) {
    if (props.selection === 'none') return
    const value = valueOfId(activeId.value)
    if (value !== undefined) {
      event.preventDefault()
      // Space is a non-shifted toggle — never extends a range.
      toggle(value)
    }
    return
  }

  // Grid mode: 2D arrow nav across cells. Falls through to the listbox
  // handler when the key is not a recognised grid nav key (e.g. PageDown).
  if (ariaMode.value === 'grid' && isGridNavKey(event.key)) {
    const cols = visibleColumnKeys()
    if (cols.length === 0) return
    const navItems = ids.map((id) => ({
      disabled: items.get(id)?.disabled ?? false,
    }))
    const cursor = activeCell.value
    const currentRow = cursor ? ids.indexOf(cursor.rowId) : -1
    const currentCol = cursor ? cols.indexOf(cursor.columnKey) : -1
    const next = nextGridCursor(
      navItems,
      cols.length,
      {
        row: currentRow < 0 ? 0 : currentRow,
        col: currentCol < 0 ? 0 : currentCol,
      },
      {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      },
    )
    if (next === null) return
    event.preventDefault()
    setActiveCell(ids[next.row], cols[next.col], { focus: true })
    return
  }

  if (isListboxNavKey(event.key)) {
    const navItems = ids.map((id) => ({
      disabled: items.get(id)?.disabled ?? false,
      skipped: isItemSkipped(id),
    }))
    const currentIndex = activeId.value ? ids.indexOf(activeId.value) : -1
    const nextIndex = nextListboxIndex(navItems, currentIndex, event.key)
    if (nextIndex === null) return

    event.preventDefault()
    const nextId = ids[nextIndex]
    setActive(nextId, { focus: true })

    if (
      event.shiftKey &&
      props.selection === 'multiple' &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      const nextValue = valueOfId(nextId)
      if (nextValue !== undefined) {
        const next = extendRange(
          selectedModel.value,
          selectableItems(),
          anchorValue.value ?? valueOfId(activeId.value),
          nextValue,
          props.selection,
        )
        commit(next, nextValue)
      }
    }
    return
  }

  handleTypeahead(event)
}

// If the consumer hands us a >1 set in single mode (or anything in none),
// clamp it on next tick so downstream subscribers see a consistent state.
watch(
  () => [props.selection, selectedModel.value] as const,
  ([mode, set]) => {
    const clamped = applySelection(set, mode)
    if (clamped !== set && clamped.size !== set.size) {
      selectedModel.value = clamped
    }
  },
  { immediate: true },
)

const selectedValue = computed(() =>
  singleValue(selectedModel.value, props.selection),
)

const context: ListRootContext<Key> = {
  ariaMode,
  selection: props.selection,
  activeId,
  activeCell,
  selected: selectedModel,
  items,
  orderedIds,
  groups,
  registerItem,
  unregisterItem,
  updateItem,
  registerGroup,
  unregisterGroup,
  updateGroup,
  registerColumns,
  columns: columnsCtx,
  setActive,
  setActiveCell,
  registerCell,
  unregisterCell,
  isSelected,
  select,
  toggle,
  activate,
  selectAll,
  clear,
}

provide(LIST_ROOT_CONTEXT, context)

const ariaAttrs = computed(() =>
  ariaMode.value === 'grid'
    ? rootAriaAttrs({
        mode: 'grid',
        multiSelectable: props.selection === 'multiple',
        ariaLabel: props.ariaLabel,
        ariaLabelledby: props.ariaLabelledby,
      })
    : rootAriaAttrs({
        mode: 'listbox',
        multiSelectable: props.selection === 'multiple',
        ariaLabel: props.ariaLabel,
        ariaLabelledby: props.ariaLabelledby,
        activeDescendantId: activeId.value,
      }),
)
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    v-bind="ariaAttrs"
    @keydown="onKeyDown"
  >
    <slot
      :active-id="activeId"
      :selected="selectedModel"
      :selected-value="selectedValue"
      :select="select"
      :toggle="toggle"
      :activate="activate"
      :select-all="selectAll"
      :clear="clear"
    />
  </Primitive>
</template>
