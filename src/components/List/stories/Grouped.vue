<script setup lang="ts">
import { computed, ref } from 'vue'
import { List } from 'frappe-ui'

interface Item {
  value: string
  label: string
  disabled?: boolean
}

interface Group {
  label: string
  items: Item[]
}

const groups: Group[] = [
  {
    label: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'mango', label: 'Mango' },
      { value: 'cherry', label: 'Cherry', disabled: true },
    ],
  },
  {
    label: 'Vegetables',
    items: [
      { value: 'kale', label: 'Kale' },
      { value: 'beet', label: 'Beet' },
      { value: 'carrot', label: 'Carrot' },
    ],
  },
]

const collapsed = ref(groups.map(() => false))
const selected = ref(new Set<string>())

const summary = computed(() =>
  selected.value.size === 0 ? 'none' : [...selected.value].sort().join(', '),
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <List.Root
      v-model:selected="selected"
      selection="multiple"
      aria-label="Grouped items"
      class="w-64 rounded border border-outline-gray-2 p-1"
    >
      <template #default="{ select }">
        <List.Group
          v-for="(group, gi) in groups"
          :key="group.label"
          v-model:collapsed="collapsed[gi]"
          class="list-none"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between rounded px-2 py-1 text-sm text-ink-gray-7 hover:bg-surface-gray-2"
            @click="collapsed[gi] = !collapsed[gi]"
          >
            <List.GroupLabel as="span" class="font-medium">
              {{ group.label }}
              <span class="ml-1 text-xs text-ink-gray-5">
                ({{ group.items.length }})
              </span>
            </List.GroupLabel>
            <span
              :class="[
                'i-lucide-chevron-down size-4 transition-transform',
                collapsed[gi] ? '-rotate-90' : '',
              ]"
              aria-hidden="true"
            />
          </button>

          <List.Item
            v-for="item in group.items"
            :key="item.value"
            :value="item.value"
            :disabled="item.disabled"
            class="flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-base text-ink-gray-7 outline-none data-[active]:bg-surface-gray-2 data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-gray-3 data-[selected]:bg-surface-gray-3"
            @click="select(item.value, $event)"
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
              <span>{{ item.label }}</span>
            </template>
          </List.Item>
        </List.Group>
      </template>
    </List.Root>

    <p class="text-sm text-ink-gray-6">
      Selected:
      <code class="rounded bg-surface-gray-2 px-1">{{ summary }}</code>
    </p>
    <p class="text-xs text-ink-gray-5">
      Collapse a group and try Shift+Click across the boundary — the hidden rows
      stay out of the selection.
    </p>
  </div>
</template>
