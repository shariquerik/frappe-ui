<script setup lang="ts" generic="Key extends string = string">
import { computed, ref } from 'vue'
import { Primitive } from '../internal/asChild'
import {
  useListColumnsContext,
  useListRootContext,
} from '../internal/context'
import { columnHeaderAriaAttrs } from '../internal/aria'
import {
  formatWidth,
  resolveColumnWidth,
  sortDirectionFor,
} from '../internal/columns'
import type { ListColumnHeaderProps } from '../types'

const props = withDefaults(defineProps<ListColumnHeaderProps<Key>>(), {
  as: 'th',
  asChild: false,
})

defineSlots<{
  default(props: {
    sort: 'asc' | 'desc' | 'none'
    sortable: boolean
    resizable: boolean
  }): any
}>()

const root = useListRootContext('List.ColumnHeader')
const columns = useListColumnsContext('List.ColumnHeader', root)

const el = ref<HTMLElement | null>(null)

const sort = computed(() =>
  sortDirectionFor(columns.sort.value, props.column.key),
)
const dataSort = computed<'asc' | 'desc' | 'none'>(() => sort.value ?? 'none')

const sortable = computed(() => props.column.sortable ?? false)
const resizable = computed(() => props.column.resizable ?? false)

const width = computed(() =>
  formatWidth(resolveColumnWidth(props.column, columns.widths.value)),
)
const align = computed(() => props.column.align)

const ariaAttrs = computed(() => columnHeaderAriaAttrs({ sort: sort.value }))

function onHeaderClick() {
  if (!sortable.value) return
  columns.toggleSort(props.column.key)
}

function onHeaderKeyDown(event: KeyboardEvent) {
  if (!sortable.value) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    columns.toggleSort(props.column.key)
  }
}

function onResizeStart(event: PointerEvent) {
  if (!resizable.value) return
  event.preventDefault()
  event.stopPropagation()
  const node = (el.value as any)?.$el ?? el.value
  const startWidth = node ? (node as HTMLElement).getBoundingClientRect().width : 0
  columns.beginResize(props.column.key, event.clientX, startWidth)
}

function onReorderStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.column.key)
  }
  columns.beginReorder(props.column.key)
}

function onReorderOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function onReorderDrop(event: DragEvent) {
  event.preventDefault()
  columns.reorderTo(props.column.key)
  columns.endReorder()
}

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
</script>

<template>
  <Primitive
    ref="el"
    :as="props.as"
    :as-child="props.asChild"
    :data-column-key="props.column.key"
    :draggable="true"
    :style="style"
    v-bind="ariaAttrs"
    @click="onHeaderClick"
    @keydown="onHeaderKeyDown"
    @dragstart="onReorderStart"
    @dragover="onReorderOver"
    @drop="onReorderDrop"
    @dragend="columns.endReorder"
  >
    <slot
      :sort="dataSort"
      :sortable="sortable"
      :resizable="resizable"
    >
      <span>{{ props.column.label }}</span>
      <span
        v-if="sortable"
        aria-hidden="true"
        class="list-sort-indicator"
        :data-sort="dataSort"
      />
      <span
        v-if="resizable"
        aria-hidden="true"
        class="list-resize-handle"
        @pointerdown="onResizeStart"
      />
    </slot>
  </Primitive>
</template>
