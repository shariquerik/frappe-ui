<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, watch } from 'vue'
import { Primitive } from '../internal/asChild'
import {
  LIST_COLUMNS_CONTEXT,
  useListRootContext,
} from '../internal/context'
import { headerRowAriaAttrs } from '../internal/aria'
import { cycleSort, moveColumn } from '../internal/columns'
import type {
  ListColumnsContext,
  ListColumnsProps,
  ListSort,
} from '../types'

const props = withDefaults(defineProps<ListColumnsProps>(), {
  as: 'thead',
  asChild: false,
})

const sortModel = defineModel<ListSort[]>('sort', {
  default: () => [] as ListSort[],
})
const widthsModel = defineModel<Record<string, number | string>>('widths', {
  default: () => ({}) as Record<string, number | string>,
})
const orderModel = defineModel<string[]>('order', {
  default: () => [] as string[],
})

defineSlots<{
  default(props: {
    sort: ListSort[]
    widths: Record<string, number | string>
    order: string[]
  }): any
}>()

const root = useListRootContext('List.Columns')

// Live mirrors that the context exposes. Writes happen through setters so
// the v-models stay the single source of truth; we never mutate them in
// place from a context consumer.
const sortRef = computed(() => sortModel.value)
const widthsRef = computed(() => widthsModel.value)
const orderRef = computed(() => orderModel.value)

// Resize-drag book-keeping. Kept in module-local state because the column
// header is the only thing that needs to read it back, and dragging never
// crosses Columns boundaries.
const resizing = ref<{
  key: string
  startX: number
  startWidth: number
} | null>(null)
const reorderSource = ref<string | null>(null)

function setSort(next: ListSort[]) {
  sortModel.value = [...next]
}

function setWidth(key: string, width: number | string) {
  widthsModel.value = { ...widthsModel.value, [key]: width }
}

function setOrder(next: string[]) {
  orderModel.value = [...next]
}

function toggleSort(key: string) {
  setSort(cycleSort(sortModel.value, key))
}

function beginResize(key: string, startX: number, startWidth: number) {
  resizing.value = { key, startX, startWidth }

  const onMove = (event: PointerEvent) => {
    const state = resizing.value
    if (!state) return
    const delta = event.clientX - state.startX
    // Floor at 24px so the column can't be dragged below a usable size.
    const next = Math.max(24, state.startWidth + delta)
    setWidth(state.key, next)
  }
  const onUp = () => {
    resizing.value = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function beginReorder(key: string) {
  reorderSource.value = key
  // Seed `order` with the current declared order on first reorder so the
  // setter has something to mutate. Consumers can also pass an `order`
  // v-model up-front; in that case we leave it alone.
  if (orderModel.value.length === 0) {
    // No-op: the actual column order is owned by the consumer's `:columns`
    // array. The Columns primitive only mutates `order` when the user
    // explicitly drags — at which point we need to seed from the slot
    // children. We defer that to `reorderTo` since we don't have the keys
    // until then.
  }
}

function reorderTo(targetKey: string) {
  const source = reorderSource.value
  if (!source || source === targetKey) return
  // Build an effective order: if the consumer hasn't seeded one, derive it
  // from sortModel + widthsModel keys + the source/target. We can't see
  // every column key from here without the consumer's array, so callers
  // (ListColumnHeader) supply both keys via beginReorder/reorderTo and we
  // rely on orderModel being primed by the consumer or by an earlier drag.
  const current =
    orderModel.value.length > 0 ? orderModel.value : [source, targetKey]
  if (!current.includes(targetKey)) current.push(targetKey)
  if (!current.includes(source)) current.unshift(source)
  setOrder(moveColumn(current, source, targetKey))
}

function endReorder() {
  reorderSource.value = null
}

const columnsCtx: ListColumnsContext = {
  sort: sortRef,
  widths: widthsRef,
  order: orderRef,
  setSort,
  setWidth,
  setOrder,
  toggleSort,
  beginResize,
  beginReorder,
  reorderTo,
  endReorder,
}

const unregister = root.registerColumns(columnsCtx)
onBeforeUnmount(() => unregister())

provide(LIST_COLUMNS_CONTEXT, columnsCtx)

// Re-register on remount: if Vue tears the component down and re-creates
// it (e.g. via v-if), the root context needs the fresh instance.
watch(
  () => root.columns.value,
  (live) => {
    if (live === null) root.registerColumns(columnsCtx)
  },
)

const ariaAttrs = headerRowAriaAttrs()
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" v-bind="ariaAttrs">
    <slot
      :sort="sortModel"
      :widths="widthsModel"
      :order="orderModel"
    />
  </Primitive>
</template>
