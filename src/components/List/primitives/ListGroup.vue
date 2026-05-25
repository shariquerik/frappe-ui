<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  provide,
  ref,
  watch,
} from 'vue'
import { Primitive } from '../internal/asChild'
import { LIST_GROUP_CONTEXT, useListRootContext } from '../internal/context'
import type { ListGroupContext, ListGroupProps } from '../types'

const props = withDefaults(defineProps<ListGroupProps>(), {
  as: 'li',
  asChild: false,
})

defineSlots<{
  default(props: { collapsed: boolean; toggle: () => void }): any
}>()

const collapsed = defineModel<boolean>('collapsed', { default: false })

const ctx = useListRootContext('List.Group')

const uid = getCurrentInstance()!.uid
const id = `list-group-${uid}`
const labelId = `${id}-label`

// Tracks whether a <List.GroupLabel> child claimed the labelledby id. When
// false and `:label` is set, we auto-render a <span> with that id so screen
// readers still get an aria-labelledby target.
const labelledBySlotUsed = ref(false)
function setLabelledBySlot(used: boolean) {
  labelledBySlotUsed.value = used
}

const groupContext: ListGroupContext = {
  id,
  labelId,
  setLabelledBySlot,
}
provide(LIST_GROUP_CONTEXT, groupContext)

ctx.registerGroup({ id, collapsed: collapsed.value })

watch(collapsed, (next) => ctx.updateGroup(id, { collapsed: next }))

onBeforeUnmount(() => ctx.unregisterGroup(id))

const hasLabelledBy = computed(
  () => labelledBySlotUsed.value || typeof props.label === 'string',
)

function toggle() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    role="group"
    :aria-labelledby="hasLabelledBy ? labelId : undefined"
    :data-collapsed="collapsed ? '' : undefined"
  >
    <span
      v-if="props.label !== undefined && !labelledBySlotUsed"
      :id="labelId"
      data-list-group-label
    >{{ props.label }}</span>
    <!--
      Items stay mounted while collapsed so their selection state survives a
      collapse/expand cycle. The `hidden` attribute removes them visually and
      from the a11y tree; Root.keyboard nav also skips them via the `skipped`
      axis on NavItem.
    -->
    <div v-show="!collapsed" data-list-group-items>
      <slot :collapsed="collapsed" :toggle="toggle" />
    </div>
  </Primitive>
</template>
