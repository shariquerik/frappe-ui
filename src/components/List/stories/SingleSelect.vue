<script setup lang="ts">
import { ref } from 'vue'
import { List } from 'frappe-ui'

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'mango', label: 'Mango' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'banana', label: 'Banana' },
  { value: 'peach', label: 'Peach' },
]

const selected = ref(new Set<string>(['mango']))
</script>

<template>
  <div class="flex flex-col gap-3">
    <List.Root
      v-model:selected="selected"
      selection="single"
      aria-label="Pick a fruit"
      class="w-60 rounded border border-outline-gray-2 p-1"
    >
      <template #default="{ selectedValue, select }">
        <List.Item
          v-for="fruit in fruits"
          :key="fruit.value"
          :value="fruit.value"
          :disabled="fruit.disabled"
          class="flex cursor-default items-center justify-between rounded px-2 py-1.5 text-base text-ink-gray-7 outline-none data-[active]:bg-surface-gray-2 data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-gray-3 data-[selected]:bg-surface-gray-3"
          @click="select(fruit.value, $event)"
        >
          <span>{{ fruit.label }}</span>
          <span
            v-if="selectedValue === fruit.value"
            class="text-ink-gray-7"
            aria-hidden="true"
            >✓</span
          >
        </List.Item>
      </template>
    </List.Root>

    <p class="text-sm text-ink-gray-6">
      Selected:
      <code class="rounded bg-surface-gray-2 px-1">{{
        [...selected][0] ?? 'none'
      }}</code>
    </p>
  </div>
</template>
