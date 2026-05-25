<script setup lang="ts">
import { ref } from 'vue'
import { List, type Column } from 'frappe-ui'

interface Person {
  id: string
  name: string
  email: string
  role: string
}

const columns: Column[] = [
  { key: 'name', label: 'Name', width: 200 },
  { key: 'email', label: 'Email', width: 240 },
  { key: 'role', label: 'Role', width: 140, align: 'right' },
]

const people: Person[] = [
  { id: '1', name: 'Aarav Mehta', email: 'aarav@example.com', role: 'Owner' },
  { id: '2', name: 'Priya Patel', email: 'priya@example.com', role: 'Editor' },
  { id: '3', name: 'Daniyal Khan', email: 'daniyal@example.com', role: 'Viewer' },
  { id: '4', name: 'Sara Iyer', email: 'sara@example.com', role: 'Editor' },
]

const selected = ref(new Set<string>())
</script>

<template>
  <List.Root
    v-model:selected="selected"
    selection="multiple"
    aria-label="Team members"
    as="table"
    class="w-full border-collapse rounded border border-outline-gray-2 text-base"
  >
    <List.Columns as="thead" class="bg-surface-gray-2 text-ink-gray-7">
      <tr>
        <List.ColumnHeader
          v-for="c in columns"
          :key="c.key"
          :column="c"
          class="cursor-default border-b border-outline-gray-2 px-3 py-2 text-left font-medium"
        >
          {{ c.label }}
        </List.ColumnHeader>
      </tr>
    </List.Columns>

    <tbody>
      <List.Item
        v-for="row in people"
        :key="row.id"
        :value="row.id"
        as="tr"
        class="cursor-default outline-none data-[active]:bg-surface-gray-2 data-[selected]:bg-surface-gray-3"
        @click="selected.has(row.id) ? selected.delete(row.id) : selected.add(row.id)"
      >
        <List.Cell
          v-for="c in columns"
          :key="c.key"
          :column="c"
          class="border-b border-outline-gray-2 px-3 py-2 outline-none data-[active]:ring-2 data-[active]:ring-outline-gray-modals"
        >
          {{ (row as any)[c.key] }}
        </List.Cell>
      </List.Item>
    </tbody>
  </List.Root>
</template>
