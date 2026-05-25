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
import { useListRootContext } from '../internal/context'
import { itemAriaAttrs } from '../internal/aria'
import type { ListItemProps, ListKey } from '../types'

const props = withDefaults(defineProps<ListItemProps<Key>>(), {
  as: 'li',
  asChild: false,
  disabled: false,
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
  }
})

function onFocus() {
  if (!props.disabled) ctx.setActive(id)
}

function select(event?: MouseEvent | KeyboardEvent) {
  if (props.disabled || props.value === undefined) return
  ctx.select(props.value, event)
}
</script>

<template>
  <Primitive
    ref="el"
    :as="props.as"
    :as-child="props.asChild"
    :data-list-item-id="id"
    v-bind="ariaAttrs"
    @focus="onFocus"
  >
    <slot
      :active="active"
      :disabled="props.disabled"
      :selected="selected"
      :select="select"
    />
  </Primitive>
</template>
