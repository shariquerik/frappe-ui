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

> The pre-existing flat `List` alias for `ListView` is deprecated — the name
> now belongs to the new namespace. Use `<ListView>` directly if you still
> need the legacy component while you migrate.
>
> See [ADR-0004](../../../../spec/adr/0004-list-family-compound-namespace.md)
> for the rationale behind compound dot-namespace.

## What slice 1 gives you

- **`<List.Root>`** — owns ARIA role (`listbox`), keyboard navigation, and
  the registry of items.
- **`<List.Item>`** — one row; registers with Root, opts in to roving
  tabindex and the `data-active` / `data-disabled` attribute axes.
- 1D keyboard nav: `ArrowUp` / `ArrowDown` / `Home` / `End` / `PageUp` /
  `PageDown`. Disabled items are skipped.
- `as` prop and `asChild` slot-merge on both primitives (see
  [reka-ui composition](https://www.reka-ui.com/docs/guides/composition)).
- No default click handler — wire interactions yourself with `@click`.

Selection, grouping, tabular layout (`<List.Columns>` / `<List.Cell>`),
reordering, and the editable-cell story all arrive in subsequent slices and
build on these two primitives.

## Default

<ComponentPreview name="List-Default" />

## As a sidebar (`as="a"` for routing)

`<List.Item :as="a">` (or `:as="RouterLink"`) renders through the underlying
anchor so middle-click and open-in-new-tab work naturally. There is no
separate `<List.ItemLink>` primitive.

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

| Key                        | Effect                                                      |
| -------------------------- | ----------------------------------------------------------- |
| `Space`                    | Toggles the active item when `selection !== "none"`.        |
| `Enter`                    | Emits `@activate(value)` on the active item.                |
| `Shift` + `ArrowUp/Down`   | Extends the selection range when `selection="multiple"`.    |

Type-to-search is opt-in via `typeahead` on `<List.Root>` — when enabled,
printable keys advance the active item to the next label matching the typed
prefix (resets after ~500ms idle).

## Styling

State is surfaced as data attributes on each item:

| Attribute        | When                                           |
| ---------------- | ---------------------------------------------- |
| `data-active`    | Item is the roving-tabindex / keyboard cursor. |
| `data-disabled`  | Item has `:disabled` set.                      |
| `data-selected`  | Item is currently in the selection set.        |

Style with `data-[active]:…` / `data-[disabled]:…` / `data-[selected]:…`
Tailwind variants:

```html
<List.Item
  class="rounded px-2 py-1.5 data-[active]:bg-surface-gray-2 data-[selected]:bg-surface-gray-3 data-[disabled]:text-ink-gray-3"
/>
```

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

| Prop                | Type                                       | Default      | Description                                                                          |
| ------------------- | ------------------------------------------ | ------------ | ------------------------------------------------------------------------------------ |
| `as`                | `AsTag \| Component`                       | `'ul'`       | Element/component to render.                                                         |
| `asChild`           | `boolean`                                  | `false`      | Merge attributes into the slotted child element.                                     |
| `selection`         | `'none' \| 'single' \| 'multiple'`         | `'none'`     | Selection mode.                                                                      |
| `v-model:selected`  | `Set<Key>`                                 | `new Set()`  | The selection set. Clamped to size ≤ 1 in single mode and to empty in none mode.     |
| `typeahead`         | `boolean`                                  | `false`      | Opt in to type-to-search navigation by visible label.                                |
| `aria-label`        | `string`                                   | —            | Accessible label for the listbox.                                                    |
| `aria-labelledby`   | `string`                                   | —            | ID of an external label element.                                                     |

Events:

| Event                  | Payload | Fires on              |
| ---------------------- | ------- | --------------------- |
| `update:selected`      | `Set<Key>` | Any selection mutation.                                                          |
| `activate`             | `Key`   | Enter on the active item.                                                            |

Slot props on default:

| Name             | Type                                                                  | Notes                                                                            |
| ---------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `activeId`       | `string \| null`                                                      | Internal id of the keyboard-focused row.                                         |
| `selected`       | `Set<Key>`                                                            | Current selection set.                                                           |
| `selectedValue`  | `Key \| undefined`                                                    | Singleton accessor — only populated in single mode.                              |
| `select`         | `(value, event?) => void`                                             | Smart selector — shift-aware. Wire to `@click` on `<List.Item>`.                 |
| `toggle`         | `(value) => void`                                                     | Force a toggle regardless of modifier keys.                                      |
| `activate`       | `(value) => void`                                                     | Programmatically fire `@activate`.                                               |
| `selectAll`      | `() => void`                                                          | Selects every enabled item (multiple mode only).                                 |
| `clear`          | `() => void`                                                          | Empties the selection set.                                                       |

### `<List.Item>`

| Prop       | Type                 | Default | Description                                              |
| ---------- | -------------------- | ------- | -------------------------------------------------------- |
| `as`       | `AsTag \| Component` | `'li'`  | Element/component to render.                             |
| `asChild`  | `boolean`            | `false` | Merge attributes into the slotted child element.         |
| `value`    | `Key`                | —       | Stable identity. Required once selection is enabled.     |
| `disabled` | `boolean`            | `false` | Skip in keyboard navigation; sets `aria-disabled=true`.  |

Slot props on default:

| Name       | Type                                       | Notes                                                                  |
| ---------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `active`   | `boolean`                                  | Currently the roving-tabindex / keyboard cursor.                       |
| `disabled` | `boolean`                                  | Mirrors the `:disabled` prop.                                          |
| `selected` | `boolean`                                  | Whether this item's value is in the selection set.                     |
| `select`   | `(event?) => void`                         | Shorthand for `root.select(value, event)` — already disabled-aware.    |
