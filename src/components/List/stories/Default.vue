<script setup lang="ts">
import { List } from 'frappe-ui'

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'mango', label: 'Mango' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'banana', label: 'Banana' },
  { value: 'peach', label: 'Peach' },
]
</script>

<template>
  <List.Root
    aria-label="Fruit"
    class="w-60 rounded border border-outline-gray-2 p-1"
  >
    <List.Item
      v-for="fruit in fruits"
      :key="fruit.value"
      :value="fruit.value"
      :disabled="fruit.disabled"
      class="cursor-default rounded px-2 py-1.5 text-base text-ink-gray-7 outline-none data-[active]:bg-surface-gray-2 data-[disabled]:text-ink-gray-3 data-[disabled]:cursor-not-allowed"
    >
      {{ fruit.label }}
    </List.Item>
  </List.Root>
</template>
