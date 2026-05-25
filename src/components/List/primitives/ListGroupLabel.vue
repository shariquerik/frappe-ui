<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { Primitive } from '../internal/asChild'
import { useListGroupContext } from '../internal/context'
import type { ListGroupLabelProps } from '../types'

const props = withDefaults(defineProps<ListGroupLabelProps>(), {
  as: 'div',
  asChild: false,
})

defineSlots<{ default(): any }>()

const groupCtx = useListGroupContext()

if (import.meta.env?.DEV && !groupCtx) {
  console.warn('[List.GroupLabel] must be used inside <List.Group>.')
}

// Claim the group's labelledby id so <List.Group> stops auto-rendering its
// fallback label element. The flag is reset on unmount so a v-if-removed
// label gracefully hands the slot back.
onMounted(() => groupCtx?.setLabelledBySlot(true))
onBeforeUnmount(() => groupCtx?.setLabelledBySlot(false))
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :id="groupCtx?.labelId"
    data-list-group-label
  >
    <slot />
  </Primitive>
</template>
