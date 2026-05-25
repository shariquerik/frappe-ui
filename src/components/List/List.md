# List

`<List.*>` is a **headless primitive family** for rendering lists, sidebars,
pickers and (in later slices) tables. Slices 1–2 ship the foundation:
`<List.Root>` and `<List.Item>` with listbox-style keyboard navigation and
single / multiple selection.

The family is exposed under a single compound dot-namespace. One import gives
you everything:

```ts
import { List } from 'frappe-ui'
```

> The pre-existing flat `List` alias for `ListView` is deprecated — the name now
> belongs to the new namespace. Use `<ListView>` directly if you still need the
> legacy component while you migrate.
>
> See [ADR-0004](../../../../spec/adr/0004-list-family-compound-namespace.md)
> for the rationale behind compound dot-namespace.

## What slice 1 gives you

- **`<List.Root>`** — owns ARIA role (`listbox`), keyboard navigation, and the
  registry of items.
- **`<List.Item>`** — one row; registers with Root, opts in to roving tabindex
  and the `data-active` / `data-disabled` attribute axes.
- 1D keyboard nav: `ArrowUp` / `ArrowDown` / `Home` / `End` / `PageUp` /
  `PageDown`. Disabled items are skipped.
- `as` prop and `asChild` slot-merge on both primitives (see
  [reka-ui composition](https://www.reka-ui.com/docs/guides/composition)).
- No default click handler — wire interactions yourself with `@click`.

Selection, grouping, reordering, and the editable-cell story all arrive in
subsequent slices and build on these two primitives. Tabular layout
(`<List.Columns>` / `<List.ColumnHeader>` / `<List.Cell>`) is documented
below.

## Default

<ComponentPreview name="List-Default" />

## As a sidebar (`as="a"` for routing)

`<List.Item :as="a">` (or `:as="RouterLink"`) renders through the underlying
anchor so middle-click and open-in-new-tab work naturally. There is no separate
`<List.ItemLink>` primitive.

<ComponentPreview name="List-Sidebar" />

## Selection

Selection is **opt-in** via `selection="single" | "multiple"` on `<List.Root>`
(default `"none"`). State always travels as a `Set<Key>` through
`v-model:selected` — single mode is "a `Set` you've agreed to never grow past
1." Single-mode callers can reach for the `selectedValue` slot prop instead of
spreading the Set themselves.

`<List.Item :value="…">` becomes required once selection is enabled, and
`:disabled` items are skipped by clicks, Space, Shift-arrow ranges, and
Shift-click ranges.

### Single

<ComponentPreview name="List-SingleSelect" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { List } from 'frappe-ui'

const selected = ref(new Set<string>())
</script>

<template>
  <List.Root v-model:selected="selected" selection="single" v-slot="{ select }">
    <List.Item
      v-for="row in rows"
      :key="row.id"
      :value="row.id"
      @click="select(row.id, $event)"
    >
      {{ row.label }}
    </List.Item>
  </List.Root>
</template>
```

### Multiple

`select(value, $event)` is range-aware: a plain click toggles, `Shift+click`
extends a range from the last anchor.

<ComponentPreview name="List-MultiSelect" />

`selectAll` and `clear` arrive as Root slot props for select-all / clear-all
affordances.

### Keyboard

| Key                      | Effect                                                   |
| ------------------------ | -------------------------------------------------------- |
| `Space`                  | Toggles the active item when `selection !== "none"`.     |
| `Enter`                  | Emits `@activate(value)` on the active item.             |
| `Shift` + `ArrowUp/Down` | Extends the selection range when `selection="multiple"`. |

Type-to-search is opt-in via `typeahead` on `<List.Root>` — when enabled,
printable keys advance the active item to the next label matching the typed
prefix (resets after ~500ms idle).

## Tabular layout

Adding `<List.Columns>` anywhere inside `<List.Root>` auto-promotes Root to
**grid ARIA mode**:

- `<List.Root>` becomes `role="grid"`.
- `<List.Item>` becomes `role="row"`.
- `<List.Cell>` becomes `role="gridcell"`.
- `<List.ColumnHeader>` becomes `role="columnheader"`.

Roving `tabindex` moves to cells, and arrow keys upgrade to 2D navigation
(`ArrowLeft` / `ArrowRight` between cells in a row, `ArrowUp` / `ArrowDown`
between same-column cells in adjacent rows). `Home` / `End` move within the
current row; `Ctrl`/`Cmd` + `Home` / `End` jump to the grid corners. Row
selection from the listbox mode continues to work.

### Basic table

<ComponentPreview name="List-Tabular" />

### Sortable

`<List.Columns>` holds three v-models that the consumer fully owns:

```vue
<List.Columns v-model:sort="sort" v-model:widths="widths" v-model:order="order">
  <tr>
    <List.ColumnHeader v-for="c in columns" :key="c.key" :column="c">
      {{ c.label }}
    </List.ColumnHeader>
  </tr>
</List.Columns>
```

- `sort: Array<{ key, direction }>` — current sort spec. Click on a sortable
  header cycles `none → asc → desc → none` via the
  `cycleSort` helper.
- `widths: Record<key, number | string>` — per-column width override that
  beats the declared `column.width`. Dragging the resize handle on a
  `resizable` column writes here.
- `order: Array<key>` — explicit column order; unmentioned keys keep their
  declared position relative to each other.

The `<List.ColumnHeader>` exposes a `data-sort` attribute (`asc` / `desc` /
`none`) for styling and emits `aria-sort` for screen readers. Sorting the
underlying rows is the consumer's responsibility — primitives never touch
the data array.

<ComponentPreview name="List-Sortable" />

### `Column` interface

```ts
interface Column<Key extends string = string> {
  key: Key
  label: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  resizable?: boolean
  hidden?: boolean
  sortable?: boolean
}
```

Per P10, there are no function-returning-VNode fields on `Column`. Anything
beyond the listed scalars is rendered via the default slot on
`<List.ColumnHeader>` / `<List.Cell>`.

## Reordering

`<List.Item :draggable>` opts a row into native HTML5 drag-and-drop. The
primitive never mutates your row array — `<List.Root>` emits `@reorder` with
the positional `from` / `to` indices and the source item's `:value`. The
consumer applies the move and feeds the new order back through `v-for`.

Disabled items cannot be drag sources or drop targets. The drag handle is
consumer-owned: the primitive exposes `data-dragging` on the source and
`data-drop-target` on the current hover row, and you style from there.

<ComponentPreview name="List-Reorderable" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { List } from 'frappe-ui'

const rows = ref([
  { id: '1', label: 'Apple' },
  { id: '2', label: 'Mango' },
  { id: '3', label: 'Banana' },
])

function onReorder({ from, to }: { from: number; to: number; value: string }) {
  if (from === to) return
  const next = rows.value.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  rows.value = next
}
</script>

<template>
  <List.Root @reorder="onReorder">
    <List.Item
      v-for="row in rows"
      :key="row.id"
      :value="row.id"
      :draggable="true"
      class="data-[dragging]:opacity-50 data-[drop-target]:bg-surface-gray-3"
    >
      {{ row.label }}
    </List.Item>
  </List.Root>
</template>
```

`from` and `to` are indices into the **currently visible** item list — when
`<List.Group>` is present, rows inside a collapsed group are excluded and
cannot anchor a drop.

## Styling

State is surfaced as data attributes on each item:

| Attribute          | When                                                |
| ------------------ | --------------------------------------------------- |
| `data-active`      | Item is the roving-tabindex / keyboard cursor.      |
| `data-disabled`    | Item has `:disabled` set.                           |
| `data-selected`    | Item is currently in the selection set.             |
| `data-dragging`    | Item is the current `:draggable` drag source.       |
| `data-drop-target` | Item is the current drop hover target during drag.  |

Style with `data-[active]:…` / `data-[disabled]:…` / `data-[selected]:…`
Tailwind variants:

```html
<List.Item
  class="rounded px-2 py-1.5 data-[active]:bg-surface-gray-2 data-[selected]:bg-surface-gray-3 data-[disabled]:text-ink-gray-3"
/>
```

## Grouping

`<List.Group>` wraps a set of `<List.Item>`s. The group owns its `collapsed`
state via `v-model:collapsed` — no row-data mutation, and items keep their
identity (and selection) across collapse/expand cycles.

`<List.Root>`'s keyboard navigation and range-select are group-aware:

- **Up / Down** crosses group boundaries between adjacent enabled rows.
- **Items inside a collapsed group** are skipped by Up/Down/Home/End/PageUp/
  PageDown and by Shift-click / Shift-Arrow range extension in
  `selection="multiple"`. A range that visually spans a collapsed group lands on
  the visible rows only — hidden rows are never silently selected.

```vue
<List.Root selection="multiple">
  <List.Group
    v-for="g in groups"
    :key="g.label"
    :label="g.label"
    v-model:collapsed="g.collapsed"
  >
    <List.Item v-for="row in g.rows" :key="row.id" :value="row.id">
      {{ row.label }}
    </List.Item>
  </List.Group>
</List.Root>
```

For non-text headers (icons, badges, counts) use `<List.GroupLabel>`. Its
default slot replaces the `:label` prop and claims the group's `aria-labelledby`
id automatically.

```vue
<List.Group v-model:collapsed="collapsed">
  <List.GroupLabel>
    <Badge :label="`${rows.length}`" theme="gray" />
    Fruits
  </List.GroupLabel>
  <List.Item v-for="row in rows" :key="row.id" :value="row.id">
    {{ row.label }}
  </List.Item>
</List.Group>
```

The group element exposes `data-collapsed` for Tailwind styling
(`data-[collapsed]:bg-surface-gray-1`).

<ComponentPreview name="List-Grouped" />

### `<List.Group>`

| Prop                | Type                 | Default | Description                                                              |
| ------------------- | -------------------- | ------- | ------------------------------------------------------------------------ |
| `as`                | `AsTag \| Component` | `'li'`  | Element/component to render.                                             |
| `asChild`           | `boolean`            | `false` | Merge attributes into the slotted child element.                         |
| `label`             | `string`             | —       | Plain-text label. Auto-renders a `<span>` with the `aria-labelledby` id. |
| `v-model:collapsed` | `boolean`            | `false` | Whether the group is collapsed. Items inside stay registered but hidden. |

Slot props on default:

| Name        | Type         | Notes                                                  |
| ----------- | ------------ | ------------------------------------------------------ |
| `collapsed` | `boolean`    | Current collapsed flag.                                |
| `toggle`    | `() => void` | Flip `collapsed` from inside the slot (custom header). |

### `<List.GroupLabel>`

| Prop      | Type                 | Default | Description                                      |
| --------- | -------------------- | ------- | ------------------------------------------------ |
| `as`      | `AsTag \| Component` | `'div'` | Element/component to render.                     |
| `asChild` | `boolean`            | `false` | Merge attributes into the slotted child element. |

The default slot replaces the `:label` prop on the enclosing `<List.Group>`.

## TypeScript

The primitives are generic over the key shape, defaulting to `string`:

```vue
<script setup lang="ts">
type DealId = string & { __brand: 'DealId' }
</script>

<template>
  <List.Root<DealId> aria-label="Deals">
    <List.Item v-for="d in deals" :key="d.id" :value="d.id">
      {{ d.name }}
    </List.Item>
  </List.Root>
</template>
```

## API

### `<List.Root>`

| Prop               | Type                               | Default     | Description                                                                      |
| ------------------ | ---------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| `as`               | `AsTag \| Component`               | `'ul'`      | Element/component to render.                                                     |
| `asChild`          | `boolean`                          | `false`     | Merge attributes into the slotted child element.                                 |
| `selection`        | `'none' \| 'single' \| 'multiple'` | `'none'`    | Selection mode.                                                                  |
| `v-model:selected` | `Set<Key>`                         | `new Set()` | The selection set. Clamped to size ≤ 1 in single mode and to empty in none mode. |
| `typeahead`        | `boolean`                          | `false`     | Opt in to type-to-search navigation by visible label.                            |
| `aria-label`       | `string`                           | —           | Accessible label for the listbox.                                                |
| `aria-labelledby`  | `string`                           | —           | ID of an external label element.                                                 |

Events:

| Event             | Payload                                    | Fires on                                                                          |
| ----------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| `update:selected` | `Set<Key>`                                 | Any selection mutation.                                                           |
| `activate`        | `Key`                                      | Enter on the active item.                                                         |
| `reorder`         | `{ from: number; to: number; value: Key }` | A drag completes onto a valid drop target (`from`/`to` are visible-list indices). |

Slot props on default:

| Name            | Type                      | Notes                                                            |
| --------------- | ------------------------- | ---------------------------------------------------------------- |
| `activeId`      | `string \| null`          | Internal id of the keyboard-focused row.                         |
| `selected`      | `Set<Key>`                | Current selection set.                                           |
| `selectedValue` | `Key \| undefined`        | Singleton accessor — only populated in single mode.              |
| `select`        | `(value, event?) => void` | Smart selector — shift-aware. Wire to `@click` on `<List.Item>`. |
| `toggle`        | `(value) => void`         | Force a toggle regardless of modifier keys.                      |
| `activate`      | `(value) => void`         | Programmatically fire `@activate`.                               |
| `selectAll`     | `() => void`              | Selects every enabled item (multiple mode only).                 |
| `clear`         | `() => void`              | Empties the selection set.                                       |

### `<List.Item>`

| Prop        | Type                 | Default | Description                                                                      |
| ----------- | -------------------- | ------- | -------------------------------------------------------------------------------- |
| `as`        | `AsTag \| Component` | `'li'`  | Element/component to render.                                                     |
| `asChild`   | `boolean`            | `false` | Merge attributes into the slotted child element.                                 |
| `value`     | `Key`                | —       | Stable identity. Required once selection is enabled.                             |
| `disabled`  | `boolean`            | `false` | Skip in keyboard navigation; sets `aria-disabled=true`. Disables drag and drop.  |
| `draggable` | `boolean`            | `false` | Make this row a native HTML5 drag source and drop target. Pairs with `@reorder`. |

Slot props on default:

| Name       | Type               | Notes                                                               |
| ---------- | ------------------ | ------------------------------------------------------------------- |
| `active`   | `boolean`          | Currently the roving-tabindex / keyboard cursor.                    |
| `disabled` | `boolean`          | Mirrors the `:disabled` prop.                                       |
| `selected` | `boolean`          | Whether this item's value is in the selection set.                  |
| `select`   | `(event?) => void` | Shorthand for `root.select(value, event)` — already disabled-aware. |

### `<List.Columns>`

| Prop              | Type                                       | Default     | Description                                                       |
| ----------------- | ------------------------------------------ | ----------- | ----------------------------------------------------------------- |
| `as`              | `AsTag \| Component`                       | `'thead'`   | Element/component to render.                                      |
| `asChild`         | `boolean`                                  | `false`     | Merge attributes into the slotted child element.                  |
| `v-model:sort`    | `Array<{ key, direction }>`                | `[]`        | Current sort spec; mutated by header clicks.                      |
| `v-model:widths`  | `Record<key, number \| string>`            | `{}`        | Per-column width overrides; mutated by resize-handle drags.       |
| `v-model:order`   | `Array<key>`                               | `[]`        | Explicit column order; mutated by header drag-reorder.            |

Slot props on default:

| Name      | Type                              | Notes                                                       |
| --------- | --------------------------------- | ----------------------------------------------------------- |
| `sort`    | `Array<{ key, direction }>`       | Mirror of the `sort` v-model — convenient for inline reads. |
| `widths`  | `Record<key, number \| string>`   | Mirror of the `widths` v-model.                             |
| `order`   | `Array<key>`                      | Mirror of the `order` v-model.                              |

### `<List.ColumnHeader>`

| Prop      | Type                 | Default | Description                              |
| --------- | -------------------- | ------- | ---------------------------------------- |
| `as`      | `AsTag \| Component` | `'th'`  | Element/component to render.             |
| `asChild` | `boolean`            | `false` | Merge attributes into the slotted child. |
| `column`  | `Column<Key>`        | —       | Column descriptor.                       |

Attributes surfaced for styling / a11y:

| Attribute    | Values                          | When                                                    |
| ------------ | ------------------------------- | ------------------------------------------------------- |
| `data-sort`  | `'asc' \| 'desc' \| 'none'`     | Always present — drives sort indicator styling.         |
| `aria-sort`  | `'ascending' \| 'descending' \| 'none'` | Mirrors `data-sort` in ARIA terms.              |

Slot props on default:

| Name        | Type                            | Notes                                                          |
| ----------- | ------------------------------- | -------------------------------------------------------------- |
| `sort`      | `'asc' \| 'desc' \| 'none'`     | Current sort direction for this column.                        |
| `sortable`  | `boolean`                       | Mirror of `column.sortable`.                                   |
| `resizable` | `boolean`                       | Mirror of `column.resizable`.                                  |

### `<List.Cell>`

| Prop      | Type                 | Default | Description                              |
| --------- | -------------------- | ------- | ---------------------------------------- |
| `as`      | `AsTag \| Component` | `'td'`  | Element/component to render.             |
| `asChild` | `boolean`            | `false` | Merge attributes into the slotted child. |
| `column`  | `Column<Key>`        | —       | Column descriptor — supplies width / align / order via Root. |

Slot props on default:

| Name     | Type      | Notes                                                  |
| -------- | --------- | ------------------------------------------------------ |
| `active` | `boolean` | Currently the grid-mode roving-tabindex / focus cell.  |
