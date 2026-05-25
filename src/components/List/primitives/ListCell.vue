<script setup lang="ts" generic="Key extends string = string">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Primitive } from '../internal/asChild'
import {
  useListColumnsContext,
  useListRootContext,
} from '../internal/context'
import { gridCellAriaAttrs } from '../internal/aria'
import {
  formatWidth,
  resolveColumnWidth,
} from '../internal/columns'
import type { ListCellProps } from '../types'

const props = withDefaults(defineProps<ListCellProps<Key>>(), {
  as: 'td',
  asChild: false,
})

defineSlots<{
  default(props: { active: boolean }): any
}>()

const root = useListRootContext('List.Cell')
const columns = useListColumnsContext('List.Cell', root)

const el = ref<HTMLElement | null>(null)

// Cells discover the enclosing row id via the same data attribute that
// <List.Item> stamps. We read it once on mount; if items are inserted /
// removed dynamically Vue will tear down + re-mount the Cell anyway.
const rowId = ref<string | null>(null)

const active = computed(
  () =>
    root.activeCell.value?.rowId === rowId.value &&
    root.activeCell.value.columnKey === props.column.key,
)

const ariaAttrs = computed(() => gridCellAriaAttrs({ active: active.value }))

const width = computed(() =>
  formatWidth(resolveColumnWidth(props.column, columns.widths.value)),
)
const align = computed(() => props.column.align)

const style = computed(() => {
  const out: Record<string, string> = {}
  if (width.value) {
    out.width = width.value
    out.minWidth = width.value
    out.maxWidth = width.value
  }
  if (align.value) {
    out.textAlign = align.value
  }
  return out
})

onMounted(() => {
  const node = (el.value as any)?.$el ?? el.value
  if (!node) return
  // Walk up to the nearest List.Item to discover the rowId.
  const row = (node as HTMLElement).closest<HTMLElement>('[data-list-item-id]')
  rowId.value = row?.dataset.listItemId ?? null
  if (rowId.value) {
    root.registerCell(rowId.value, props.column.key, node as HTMLElement)
  }
})

onBeforeUnmount(() => {
  if (rowId.value) root.unregisterCell(rowId.value, props.column.key)
})

watch(
  () => props.column.key,
  (next, prev) => {
    if (rowId.value && prev) root.unregisterCell(rowId.value, prev)
    const node = (el.value as any)?.$el ?? el.value
    if (rowId.value && node) {
      root.registerCell(rowId.value, next, node as HTMLElement)
    }
  },
)

function onFocus() {
  if (rowId.value) {
    root.setActiveCell(rowId.value, props.column.key)
  }
}
</script>

<template>
  <Primitive
    ref="el"
    :as="props.as"
    :as-child="props.asChild"
    :data-column-key="props.column.key"
    :style="style"
    v-bind="ariaAttrs"
    @focus="onFocus"
  >
    <slot :active="active" />
  </Primitive>
</template>
