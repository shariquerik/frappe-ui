<script setup lang="ts">
import { List } from 'frappe-ui'

const links = [
  { to: '/leads', label: 'Leads', icon: 'lucide-users' },
  { to: '/deals', label: 'Deals', icon: 'lucide-briefcase' },
  { to: '/contacts', label: 'Contacts', icon: 'lucide-user-check' },
  { to: '/organizations', label: 'Organizations', icon: 'lucide-building' },
  { to: '/notes', label: 'Notes', icon: 'lucide-clipboard' },
  { to: '/tasks', label: 'Tasks', icon: 'lucide-check-square' },
]
</script>

<template>
  <nav class="w-56 rounded border border-outline-gray-2 bg-surface-menu-bar p-2">
    <List.Root aria-label="Sidebar navigation" class="flex flex-col gap-0.5">
      <List.Item
        v-for="link in links"
        :key="link.to"
        :value="link.to"
        as="a"
        :href="link.to"
        class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-base text-ink-gray-7 no-underline outline-none transition-colors data-[active]:bg-surface-gray-2 data-[active]:text-ink-gray-9"
      >
        <span :class="[link.icon, 'size-4']" aria-hidden="true" />
        {{ link.label }}
      </List.Item>
    </List.Root>
  </nav>
</template>
