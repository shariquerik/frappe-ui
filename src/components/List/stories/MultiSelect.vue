<script setup lang="ts">
import { computed, ref } from 'vue'
import { List } from 'frappe-ui'

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'mango', label: 'Mango' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'banana', label: 'Banana' },
  { value: 'peach', label: 'Peach' },
  { value: 'plum', label: 'Plum' },
]

const selected = ref(new Set<string>())

const summary = computed(() =>
  selected.value.size === 0
    ? 'none'
    : [...selected.value]
        .map((v) => fruits.find((f) => f.value === v)?.label ?? v)
        .join(', '),
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <List.Root
      v-model:selected="selected"
      selection="multiple"
      aria-label="Pick fruits"
      class="w-60 rounded border border-outline-gray-2 p-1"
    >
      <template #default="{ select, selectAll, clear }">
        <div class="flex gap-2 px-2 pt-1 pb-2 text-sm">
          <button
            type="button"
            class="text-ink-gray-7 underline-offset-2 hover:underline"
            @click="selectAll"
          >
            Select all
          </button>
          <button
            type="button"
            class="text-ink-gray-7 underline-offset-2 hover:underline"
            @click="clear"
          >
            Clear
          </button>
        </div>

        <List.Item
          v-for="fruit in fruits"
          :key="fruit.value"
          :value="fruit.value"
          :disabled="fruit.disabled"
          class="flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-base text-ink-gray-7 outline-none data-[active]:bg-surface-gray-2 data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-gray-3 data-[selected]:bg-surface-gray-3"
          @click="select(fruit.value, $event)"
        >
          <template #default="{ selected: itemSelected }">
            <span
              class="inline-flex size-4 items-center justify-center rounded border"
              :class="
                itemSelected
                  ? 'border-outline-gray-modals bg-surface-gray-7 text-ink-white'
                  : 'border-outline-gray-2'
              "
              aria-hidden="true"
            >
              <span v-if="itemSelected" class="text-xs leading-none">✓</span>
            </span>
            <span>{{ fruit.label }}</span>
          </template>
        </List.Item>
      </template>
    </List.Root>

    <p class="text-sm text-ink-gray-6">
      Selected:
      <code class="rounded bg-surface-gray-2 px-1">{{ summary }}</code>
    </p>
    <p class="text-xs text-ink-gray-5">
      Shift+Click or Shift+Arrow to extend a range from the last click.
    </p>
  </div>
</template>
