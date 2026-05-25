<script setup lang="ts">
import { ref } from 'vue'
import { List } from 'frappe-ui'

interface Fruit {
  value: string
  label: string
  disabled?: boolean
}

const fruits = ref<Fruit[]>([
  { value: 'apple', label: 'Apple' },
  { value: 'mango', label: 'Mango' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'banana', label: 'Banana' },
  { value: 'peach', label: 'Peach' },
  { value: 'plum', label: 'Plum' },
])

// Primitive does not mutate the array — the consumer owns the data. The
// reorder emit gives us positional `from`/`to` against the visible list,
// which is all we need for an in-place splice.
function onReorder(payload: { from: number; to: number; value: string }) {
  const { from, to } = payload
  if (from === to) return
  const next = fruits.value.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  fruits.value = next
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <List.Root
      aria-label="Reorder fruits"
      class="w-60 rounded border border-outline-gray-2 p-1"
      @reorder="onReorder"
    >
      <List.Item
        v-for="fruit in fruits"
        :key="fruit.value"
        :value="fruit.value"
        :disabled="fruit.disabled"
        :draggable="!fruit.disabled"
        class="flex cursor-grab items-center gap-2 rounded px-2 py-1.5 text-base text-ink-gray-7 outline-none data-[active]:bg-surface-gray-2 data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-gray-3 data-[dragging]:opacity-50 data-[drop-target]:bg-surface-gray-3 active:cursor-grabbing"
      >
        <span
          class="lucide-grip-vertical size-4 shrink-0 text-ink-gray-4"
          aria-hidden="true"
        />
        {{ fruit.label }}
      </List.Item>
    </List.Root>

    <p class="text-xs text-ink-gray-5">
      Drag a row to reorder. Cherry is disabled — it cannot be dragged and is
      skipped as a drop target.
    </p>
  </div>
</template>
