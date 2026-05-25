# `<List>` family for frappe-ui — Implementation Plan

## Context

The existing `ListView` (`src/components/ListView/`, 12 sub-components, all publicly exported) is frappe-ui's only list/table primitive. It is already compound-ish — `DealsListView.vue` manually assembles `<ListView>` + `<ListHeader>` + `<ListHeaderItem v-for>` + `<ListRows v-slot>` + `<ListRowItem>` + `<ListSelectBanner>` + `<ListFooter>` (the last outside `</ListView>`). The `:rows :columns :options` props on `<ListView>` are just data sources; the layout is caller-written.

What's wrong with it today:
- Function-returning-VNode props that violate P10.
- A single `#cell` slot for all customization.
- No TypeScript types for row/column shapes.
- No keyboard navigation or ARIA grid semantics.
- The CRM ships its own `Grid.vue` (inline-editable child-table editor) that reinvents selection, grouping, column width, keyboard nav.

This plan introduces a **headless primitive family** under a compound dot-namespace, `<List.*>`. There is no opinionated wrapper — consumers assemble primitives directly. The existing `ListView` is left untouched in v1 and deprecated only after at least one CRM view migrates cleanly.

## Goals / Non-goals

**v1 ships:**
- A headless primitive family: `<List.Root>`, `<List.Item>`, `<List.Group>`, `<List.GroupLabel>`, `<List.Columns>`, `<List.ColumnHeader>`, `<List.Cell>`.
- Matching composables for advanced consumers.
- Full a11y baseline: listbox mode by default; auto-promotes to grid mode when `<List.Columns>` is present.
- TypeScript-first, generic over `Key`.

**Deferred to v2 (built on top of the same primitives, designed against real consumers):**
- `<List.EditableCell>` + `useEditableCell` — designed when CRM's `Grid.vue` migration starts.
- Virtualization — designed when a real ≥1000-row consumer emerges. Today's `ListView` doesn't virtualize, so this is not a parity gap.
- Runtime-discovered columns (generic doctype renderer) — speculative; defer until concrete demand.
- Cell-range / block selection.
- Frozen columns; sticky-header `aria-rowindex` math beyond the simple case.
- Server-grouped data shape.

**Out of scope, permanently — consumer-owned:**
- `:rows` / `:columns` props on `<List>` (caller writes v-for).
- Pagination (already consumer-owned in today's CRM via external `<ListFooter>`).
- Loading skeletons, density, empty-state default rendering.
- `groupBy` transformation — consumer declares `<List.Group>` directly.
- `getRowRoute` — caller uses `<List.Item :as="RouterLink" :to="…">` via the `as` pattern.

**Will not change in v1:**
- `ListView` and all its exported sub-components stay byte-for-byte the same.
- The pre-existing flat `List = ListView` alias deprecates immediately per P13 (the name is taken by the new namespace root). Full `ListView` deprecation comes after migration proof — likely v1.x, not v1.0.

## Why a compound dot-namespace `<List.*>` (deviation from library convention)

The library has so far used flat sibling components (`<Dialog>`, `<Combobox>`, `<ItemListRow>`). The selection family explicitly chose flat + shell pattern over compound primitives.

`<List>` deviates because:
- The family has 7 primitives in v1 (Root, Item, Group, GroupLabel, Columns, ColumnHeader, Cell) and will grow to ~10 by v2. Flat sibling naming (`<ListColumnHeader>`, `<ListEditableCell>`) is hard to discover. Dot-namespace + autocomplete makes the family browsable.
- The selection family's split was on **semantic UX boundaries** (Combobox vs MultiSelect vs Dropdown — different mental models, different visuals). The List family's split is **structural** (Root vs Item vs Cell are different *roles in the same render tree*, not different components).
- Implemented as `Object.assign(List, { Root, Item, Group, GroupLabel, Columns, ColumnHeader, Cell })` so one import (`import { List } from 'frappe-ui'`) yields the whole family.

This is a precedent. An ADR (`v1-release/adr/000X-list-family-compound-namespace.md`) should be written before merging to record the trade-off and gate future compound families.

## Primitive surface

Each primitive is a real Vue component. **The caller writes `v-for`.** Every primitive supports `as` (prop) and `asChild` (slot-merge) for element-type override, matching reka-ui's pattern. Customization is via slots (P6/P7) and `data-*` attributes (P10) — no class-injection props.

| Primitive | Purpose | Key API |
|---|---|---|
| `<List.Root>` | Owns selection, focus/active item, keyboard nav, ARIA mode | `v-model:selected: Set<Key>`, `selection="none" \| "single" \| "multiple"` (default `"none"`), `@activate(value)` |
| `<List.Item>` | One row; registers with Root | `:value` (required when selectable), `:disabled`, `:draggable`, emits `reorder({from, to, value})` |
| `<List.Group>` | Optional grouping wrapper | `:label`, `v-model:collapsed`; nests `<List.Item>`s |
| `<List.GroupLabel>` | Optional label override (non-text content) | default slot |
| `<List.Columns>` | Opt-in tabular state holder; auto-promotes Root to grid mode. Registers itself with Root so Cells (outside the Columns DOM subtree) can read state. | `v-model:sort: Array<{key, direction}>`, `v-model:widths: Record<key, width>`, `v-model:order: Array<key>` |
| `<List.ColumnHeader>` | One column header; renders sort indicator + resize/reorder handles. Reads state from Columns. | `:column` |
| `<List.Cell>` | One cell inside a row. Reads widths/align/order from Columns context via Root. | `:column` |

### Selection

- State is always `Set<Key>` regardless of mode. Single mode = "a Set you've agreed to never grow past 1." Single-mode callers read `[...selected][0]` or use the `selectedValue` slot prop exposed by Root for ergonomic single-value access.
- Default is `selection="none"` — opt into selection explicitly. Most lists in the wild (sidebars, file lists, picker dropdowns) aren't selectable.
- `active` (keyboard cursor) and `selected` (membership) are distinct axes. A non-selectable list still has roving focus and arrow-key nav.
- **No default click handler on `<List.Item>`.** Clicks do nothing until the consumer wires `@click="toggle(value)"`, `@click="activate(value)"`, or a routing handler. This is what lets one primitive power data tables, sidebars, and Combobox-style pickers.

### Keyboard nav (owned by `<List.Root>`)

- **Listbox mode (default):** Up/Down move active; Space toggles selected when `selection !== "none"`; Home/End/PageUp/PageDown; Shift+Arrow / Shift+Click extends range when `selection="multiple"`; Enter fires `@activate(value)`; type-to-search is an opt-in axis (default off).
- **Grid mode (auto, when `<List.Columns>` is present):** 2D arrow nav (Left/Right between cells, Up/Down between same-column cells in adjacent rows); roving tabindex on cells; row-level selection.

### Grouping

`<List.Group>` registers with Root so keyboard nav and selection cross group boundaries correctly. `collapsed` is owned by the group component itself via `v-model:collapsed` — no row mutation like today's `ListView`. ARIA: `role="group"` + `aria-labelledby` to `<List.GroupLabel>`.

### Routing integration

`<List.Item :as="RouterLink" :to="route">` — the `as` prop handles middle-click / open-in-new-tab correctly via the underlying `<router-link>`. No separate `<List.ItemLink>` primitive. The legacy `getRowRoute(row)` callback pattern is gone.

### Composables (public)

`useListContext()`, `useListItem()`, `useListGroup()`, `useListCell()`, `useListColumns()`. Advanced consumers (custom non-tabular layouts, mixed read-only/editable rows) skip primitives entirely and reach for composables.

## Canonical example

```vue
<List.Root v-model:selected="selected" selection="multiple" @activate="onActivate">
  <List.Columns v-model:sort="sort" v-model:widths="widths" v-model:order="order">
    <List.ColumnHeader v-for="c in columns" :key="c.key" :column="c">
      {{ c.label }}
    </List.ColumnHeader>
  </List.Columns>

  <List.Group v-for="g in groups" :key="g.label" :label="g.label" v-model:collapsed="g.collapsed">
    <List.Item
      v-for="row in g.rows"
      :key="row.id"
      :value="row.id"
      :disabled="row.archived"
      @click="toggle(row.id)"
    >
      <List.Cell v-for="c in columns" :key="c.key" :column="c">
        <Badge v-if="c.key === 'status'" :label="row.status" :theme="statusTheme(row.status)" />
        <template v-else>{{ row[c.key] }}</template>
      </List.Cell>
    </List.Item>
  </List.Group>
</List.Root>
```

### Column shape (P3-flat)

```ts
interface Column {
  key: string
  label: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  resizable?: boolean
  hidden?: boolean
  sortable?: boolean
}
```

No `getLabel` / `getTooltip` / `prefix` function-returning-VNode props.

### TypeScript

Primitives are generic over `Key extends string | number` (default `string`). `<List.Root<MyKey>>` via `<script setup lang="ts" generic="Key">`. Consumer owns row typing — primitives never see rows.

## File organization

```
src/components/List/
├── primitives/
│   ├── ListRoot.vue
│   ├── ListItem.vue
│   ├── ListGroup.vue
│   ├── ListGroupLabel.vue
│   ├── ListColumns.vue
│   ├── ListColumnHeader.vue
│   └── ListCell.vue
├── composables/
│   ├── useListContext.ts
│   ├── useListItem.ts
│   ├── useListGroup.ts
│   ├── useListCell.ts
│   └── useListColumns.ts
├── internal/
│   ├── selection.ts               # Set-based selection logic
│   ├── keyboard.ts                # listbox/grid key handlers
│   ├── aria.ts                    # role + aria-* wiring
│   └── asChild.ts                 # slot-merge helper
├── types.ts                       # Column, Sort, Width, Key, etc.
├── plan.md                        # this document
└── index.ts                       # exports `List` with .Root/.Item/... attached
```

Top-level `src/index.ts`: add `export { List } from './components/List'`. The pre-existing flat `List = ListView` alias deprecates immediately (P13) — replaced by the new namespace root, one-time `warnDeprecated` call when the old shape is detected.

## Files to reuse / mine

- `src/components/ListView/*` — behavior reference: selection-toggle logic, shift-click range, group-collapse, column-resize math.
- `src/components/Dropdown/*`, `src/components/Tabs/*` — reference for how frappe-ui wraps reka-ui compound primitives + `asChild` pattern.
- `src/components/Tree/*` — closest existing recursive/headless-ish list pattern.
- `apps/crm/frontend/src/components/ListViews/DealsListView.vue` — the de-facto API spec; structurally already compound, so the migration should be a near-1:1 rewrite (rename + dot-namespace + slot-prop adjustments).

## Verification

End-to-end checks before declaring v1 done:

1. **Build & type-check.** `yarn build` and `yarn type-check` (if present) pass with the new generic-over-Key surface.
2. **Unit tests** (`src/components/List/*.test.ts`):
   - Selection: single/multiple/none, range select, select-all, clear; `selectedValue` slot prop returns the singular value in single mode.
   - Keyboard nav: listbox 1D, grid 2D, Home/End/PageUp/PageDown, type-to-search opt-in.
   - Grouping: collapse/expand, nav skips collapsed groups, selection scoped per group.
   - Sort / widths / order v-models round-trip correctly through `<List.Columns>` → Root → `<List.Cell>`.
3. **A11y audit** with axe-core on a dev-page that renders `<List.Root>` (listbox) and `<List.Root>` + `<List.Columns>` (grid) cases — zero violations.
4. **Manual screen-reader pass** (VoiceOver on macOS) on both ARIA modes — row/cell announcements, selection state, sort state read correctly.
5. **Visual smoke tests** in the frappe-ui dev playground / stories:
   - Sidebar nav using `<List.Root>` + `<List.Item>` only (listbox case).
   - Combobox-style picker using `<List.Root selection="single">` (single-mode case, exercises `selectedValue`).
   - Grouped + sortable tabular list (grid case, mirrors DealsListView).
   - Reorderable list (`:draggable` on `<List.Item>`).
6. **CRM smoke test (no migration yet).** Verify `ListView` is untouched and CRM views continue to work — should be a no-op.
7. **Migration proof.** Port one CRM ListView (e.g., a smaller one before tackling DealsListView) to the new primitives. The result is the migration guide. Only after this passes does `ListView` itself enter deprecation.
8. **Bundle size check.** New `<List>` family should not double the bundle when both `List` and `ListView` are imported.

## Open items deferred to follow-up plans

- **ADR for compound dot-namespace deviation.** Write before v1 merge; record trade-off + gate future compound families.
- **`<List.EditableCell>` + `useEditableCell` spec** — design against `Grid.vue` migration when it starts.
- **Virtualization spec** — design when a real ≥1000-row consumer emerges.
- **CRM migration guide** — written *after* the first CRM view migrates, drawn from that experience.
