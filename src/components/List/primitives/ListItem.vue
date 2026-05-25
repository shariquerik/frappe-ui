<script setup lang="ts" generic="Key extends ListKey = string">
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { Primitive } from '../internal/asChild'
import {
  useListDropZoneContext,
  useListRootContext,
} from '../internal/context'
import { itemAriaAttrs } from '../internal/aria'
import type { ListItemProps, ListKey } from '../types'

const props = withDefaults(defineProps<ListItemProps<Key>>(), {
  as: 'li',
  asChild: false,
  disabled: false,
  draggable: false,
})

defineSlots<{
  default(props: {
    active: boolean
    disabled: boolean
    selected: boolean
    select: (event?: MouseEvent | KeyboardEvent) => void
  }): any
}>()

const ctx = useListRootContext<Key>('List.Item')
const dropZone = useListDropZoneContext()

const uid = getCurrentInstance()!.uid
const id = `list-item-${uid}`

const el = ref<HTMLElement | null>(null)

if (
  import.meta.env?.DEV &&
  ctx.selection !== 'none' &&
  props.value === undefined
) {
  // Selection needs a stable key per row. Warn loudly in dev rather than
  // silently swallowing clicks; production builds skip the check.
  console.warn(
    '[List.Item] `:value` is required when <List.Root selection="single" | "multiple">.',
  )
}

ctx.registerItem({
  id,
  value: props.value,
  disabled: props.disabled,
  el: null,
})

onMounted(() => {
  // Resolve the DOM element — works for both <Primitive as="li"> (which
  // renders a real element) and asChild (slot-merged child).
  const node = (el.value as any)?.$el ?? el.value
  ctx.updateItem(id, { el: node as HTMLElement })
})

onBeforeUnmount(() => ctx.unregisterItem(id))

watch(
  () => props.disabled,
  (disabled) => ctx.updateItem(id, { disabled }),
)

watch(
  () => props.value,
  (value) => ctx.updateItem(id, { value }),
)

const active = computed(() => ctx.activeId.value === id)
const selected = computed(() =>
  props.value === undefined ? false : ctx.isSelected(props.value),
)

const isDragSource = computed(() => ctx.dragSourceId.value === id)
const isDropTarget = computed(() => ctx.dropTargetId.value === id)

const ariaAttrs = computed(() => {
  const attrs = itemAriaAttrs({
    id,
    active: active.value,
    disabled: props.disabled,
    selected: ctx.selection === 'none' ? undefined : selected.value,
  })
  return {
    ...attrs,
    'data-selected': selected.value ? '' : undefined,
    'data-dragging': isDragSource.value ? '' : undefined,
    'data-drop-target': isDropTarget.value ? '' : undefined,
  }
})

// Hidden / collapsed group rows reject drops. <List.Group> (Slice 3) is
// optional; without it `dropZone` is null and this is always `false`.
function isInsideCollapsedGroup(): boolean {
  return !!dropZone && dropZone.collapsed.value === true
}

function onFocus() {
  if (!props.disabled) ctx.setActive(id)
}

function select(event?: MouseEvent | KeyboardEvent) {
  if (props.disabled || props.value === undefined) return
  ctx.select(props.value, event)
}

function onDragStart(event: DragEvent) {
  if (!props.draggable || props.disabled) {
    // Belt-and-braces: with `draggable="false"` the browser won't fire this
    // anyway, but disabled toggling during a drag could still leak through.
    event.preventDefault()
    return
  }
  if (event.dataTransfer) {
    // Required in some browsers (Firefox) to start a drag at all. The payload
    // is intentionally opaque — the primitive coordinates by id, not data.
    event.dataTransfer.effectAllowed = 'move'
    try {
      event.dataTransfer.setData('text/plain', id)
    } catch {
      // Some test environments (jsdom) throw on setData — ignore.
    }
  }
  ctx.beginDrag(id)
}

function onDragOver(event: DragEvent) {
  if (!props.draggable || props.disabled) return
  if (ctx.dragSourceId.value === null) return
  if (isInsideCollapsedGroup()) return
  // preventDefault is what makes this element a valid drop target per the
  // HTML5 drag spec — without it `drop` never fires.
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  ctx.setDropTarget(id)
}

function onDrop(event: DragEvent) {
  if (!props.draggable || props.disabled) return
  if (ctx.dragSourceId.value === null) return
  if (isInsideCollapsedGroup()) return
  event.preventDefault()
  ctx.setDropTarget(id)
  ctx.endDrag(true)
}

function onDragEnd() {
  // Fires on the source whether the drop landed or not. Always clear so a
  // cancelled drag (Esc / drop outside) resets the hover styling.
  ctx.endDrag(false)
}
</script>

<template>
  <Primitive
    ref="el"
    :as="props.as"
    :as-child="props.asChild"
    :data-list-item-id="id"
    :draggable="props.draggable && !props.disabled ? true : undefined"
    v-bind="ariaAttrs"
    @focus="onFocus"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @drop="onDrop"
    @dragend="onDragEnd"
  >
    <slot
      :active="active"
      :disabled="props.disabled"
      :selected="selected"
      :select="select"
    />
  </Primitive>
</template>
