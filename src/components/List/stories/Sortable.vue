<script setup lang="ts">
import { computed, ref } from 'vue'
import { List, type Column, type ListSort } from 'frappe-ui'

interface Deal {
  id: string
  name: string
  organization: string
  amount: number
  stage: string
  closeDate: string
}

const columns: Column[] = [
  { key: 'name', label: 'Deal', width: 220, sortable: true, resizable: true },
  {
    key: 'organization',
    label: 'Organization',
    width: 200,
    sortable: true,
    resizable: true,
  },
  {
    key: 'amount',
    label: 'Amount',
    width: 140,
    align: 'right',
    sortable: true,
  },
  { key: 'stage', label: 'Stage', width: 140, sortable: true },
  { key: 'closeDate', label: 'Close date', width: 160, sortable: true },
]

const deals: Deal[] = [
  {
    id: '1',
    name: 'Frappe ERPNext rollout',
    organization: 'Acme Corp',
    amount: 120_000,
    stage: 'Negotiation',
    closeDate: '2026-06-15',
  },
  {
    id: '2',
    name: 'CRM onboarding',
    organization: 'Globex',
    amount: 45_000,
    stage: 'Proposal',
    closeDate: '2026-05-30',
  },
  {
    id: '3',
    name: 'Insights pilot',
    organization: 'Hooli',
    amount: 80_000,
    stage: 'Qualified',
    closeDate: '2026-07-02',
  },
  {
    id: '4',
    name: 'HR module expansion',
    organization: 'Initech',
    amount: 35_000,
    stage: 'Proposal',
    closeDate: '2026-08-21',
  },
]

const sort = ref<ListSort[]>([{ key: 'amount', direction: 'desc' }])
const widths = ref<Record<string, number | string>>({})
const order = ref<string[]>([])
const selected = ref(new Set<string>())

const sortedDeals = computed(() => {
  if (sort.value.length === 0) return deals
  const { key, direction } = sort.value[0]
  return [...deals].sort((a, b) => {
    const av = (a as any)[key]
    const bv = (b as any)[key]
    if (av === bv) return 0
    const sign = av < bv ? -1 : 1
    return direction === 'asc' ? sign : -sign
  })
})

function formatAmount(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}
</script>

<template>
  <List.Root
    v-model:selected="selected"
    selection="multiple"
    aria-label="Deals"
    as="table"
    class="w-full border-collapse rounded border border-outline-gray-2 text-base"
  >
    <List.Columns
      v-model:sort="sort"
      v-model:widths="widths"
      v-model:order="order"
      as="thead"
      class="bg-surface-gray-2 text-ink-gray-7"
    >
      <tr>
        <List.ColumnHeader
          v-for="c in columns"
          :key="c.key"
          :column="c"
          class="cursor-pointer select-none border-b border-outline-gray-2 px-3 py-2 text-left font-medium data-[sort=asc]:text-ink-gray-9 data-[sort=desc]:text-ink-gray-9"
        >
          <template #default="{ sort: dir, sortable }">
            <span class="inline-flex items-center gap-1">
              {{ c.label }}
              <span
                v-if="sortable"
                aria-hidden="true"
                class="text-xs"
              >
                {{ dir === 'asc' ? '↑' : dir === 'desc' ? '↓' : '↕' }}
              </span>
            </span>
          </template>
        </List.ColumnHeader>
      </tr>
    </List.Columns>

    <tbody>
      <List.Item
        v-for="row in sortedDeals"
        :key="row.id"
        :value="row.id"
        as="tr"
        class="outline-none data-[active]:bg-surface-gray-2 data-[selected]:bg-surface-gray-3"
        @click="
          selected.has(row.id) ? selected.delete(row.id) : selected.add(row.id)
        "
      >
        <List.Cell
          v-for="c in columns"
          :key="c.key"
          :column="c"
          class="border-b border-outline-gray-2 px-3 py-2 outline-none data-[active]:ring-2 data-[active]:ring-outline-gray-modals"
        >
          <template v-if="c.key === 'amount'">
            {{ formatAmount(row.amount) }}
          </template>
          <template v-else>{{ (row as any)[c.key] }}</template>
        </List.Cell>
      </List.Item>
    </tbody>
  </List.Root>

  <p class="mt-3 text-sm text-ink-gray-6">
    Click a header to sort. Sort state lives in the
    <code class="rounded bg-surface-gray-2 px-1">sort</code> v-model:
    <code class="rounded bg-surface-gray-2 px-1">{{
      sort.length ? `${sort[0].key} ${sort[0].direction}` : 'none'
    }}</code>
  </p>
</template>
