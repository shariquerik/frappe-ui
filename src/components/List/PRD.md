# `<List>` family for frappe-ui — PRD

## Problem Statement

Consumers building list and table UIs in frappe-ui (CRM, ERPNext, HR, Insights) have one option today: `<ListView>` and its 12 publicly-exported sub-components. It is structurally compound already — `DealsListView.vue` manually assembles `<ListView>` + `<ListHeader>` + `<ListHeaderItem v-for>` + `<ListRows v-slot>` + `<ListRowItem>` + `<ListSelectBanner>` + `<ListFooter>` — but the surface is leaky and the primitives are underpowered:

- Function-returning-VNode props (`getLabel`, `getTooltip`, `prefix`) violate the library's "no render-prop functions" principle (P10) and force consumers into runtime indirection.
- A single `#cell` slot is the only customization seam — there is no per-cell, per-header, or per-group control.
- Row and column shapes are untyped — TypeScript consumers get no help.
- No keyboard navigation, no roving focus, no ARIA grid/listbox semantics — screen-reader users cannot navigate a CRM list.
- Because the primitive does not cover editable cells, the CRM has shipped its own `Grid.vue` (an inline-editable child-table editor) that reinvents selection, grouping, column widths, keyboard nav — diverging behavior across two grids in the same app.

The result is that every new list-shaped surface in a frappe-ui consumer either copy-pastes `ListView` ceremony or rolls its own primitive. There is no shared substrate.

## Solution

Ship a **headless primitive family** under a compound dot-namespace `<List.*>`: `<List.Root>`, `<List.Item>`, `<List.Group>`, `<List.GroupLabel>`, `<List.Columns>`, `<List.ColumnHeader>`, `<List.Cell>`. Consumers assemble primitives directly — no opinionated wrapper, no `:rows`/`:columns` data props. The Root owns selection, focus, keyboard navigation, and ARIA mode (listbox by default; auto-promotes to grid when `<List.Columns>` is present). Every primitive supports `as` and `asChild` for element-type override, matching the reka-ui pattern already used elsewhere in the library. Customization is via slots (P6/P7) and `data-*` attributes (P10) — no class-injection props, no function-returning-VNode props.

The existing `ListView` stays byte-for-byte untouched in v1. The pre-existing flat `List = ListView` alias deprecates immediately because the name is now taken by the new namespace root. Full `ListView` deprecation comes only after at least one CRM view migrates cleanly.

The deviation from the library's flat-component convention is recorded in [ADR-0004](../../../spec/adr/0004-list-family-compound-namespace.md).

## User Stories

1. As a frappe-ui consumer building a sidebar nav, I want a `<List.Root>` + `<List.Item>` pair with roving tabindex and arrow-key navigation, so that keyboard and screen-reader users can navigate without my writing any nav code.

2. As a frappe-ui consumer building a Combobox-style picker, I want `<List.Root selection="single">` and a `selectedValue` slot prop, so that I can read the single chosen value without spreading a `Set` myself.

3. As a frappe-ui consumer building a tabular list (e.g. DealsListView), I want `<List.Columns>` + `<List.ColumnHeader>` + `<List.Cell>` with sort/width/order v-models, so that I can hold the table state in my own component without re-implementing column resize math.

4. As a frappe-ui consumer building a multi-select table, I want `<List.Root selection="multiple" v-model:selected>` with Shift+Click and Shift+Arrow range extension, so that bulk actions work the way users expect from native tables.

5. As a frappe-ui consumer rendering grouped rows, I want `<List.Group :label v-model:collapsed>` that registers with Root, so that keyboard nav and selection cross group boundaries correctly and collapse state lives with the group, not in row mutations.

6. As a frappe-ui consumer rendering a group with non-text content in the header (badges, counts, icons), I want `<List.GroupLabel>` with a default slot, so that I am not constrained to a string `:label`.

7. As a frappe-ui consumer wiring routing, I want `<List.Item :as="RouterLink" :to="route">`, so that middle-click and open-in-new-tab work through the underlying `<router-link>` without my passing a `getRowRoute` callback.

8. As a frappe-ui consumer building a draggable list, I want `<List.Item :draggable>` to emit `reorder({from, to, value})`, so that I can persist the new order without writing drag-event plumbing.

9. As a TypeScript consumer, I want `<List.Root>` to be generic over `Key extends string | number`, so that `selected`, `@activate`, and item `:value` props are type-checked end-to-end.

10. As a TypeScript consumer, I want a published `Column` interface (`key`, `label`, `width?`, `align?`, `resizable?`, `hidden?`, `sortable?`), so that I can type my column arrays without inventing my own shape.

11. As a frappe-ui consumer who needs a non-tabular layout, I want public composables (`useListContext`, `useListItem`, `useListGroup`, `useListCell`, `useListColumns`), so that I can build a custom row component while still participating in Root's selection and keyboard nav.

12. As an accessibility-conscious consumer, I want the Root to apply `role="listbox"` by default and `role="grid"` automatically when `<List.Columns>` is rendered, so that assistive tech reads the right structure without my managing ARIA roles.

13. As an accessibility-conscious consumer, I want full keyboard support out of the box — Up/Down, Home/End, PageUp/PageDown, Space to toggle selection, Enter to activate, Shift+Arrow to extend range — so that keyboard users have parity with mouse users.

14. As an accessibility-conscious consumer rendering a tabular `<List>`, I want 2D arrow navigation (Left/Right between cells, Up/Down between same-column cells in adjacent rows) with roving tabindex on cells, so that the grid behaves like a native data grid.

15. As a consumer building a search-as-you-type list, I want to opt into type-to-search on Root (default off), so that the behavior is available where it makes sense and absent where it would interfere.

16. As a consumer building a list that is read-only display only, I want `selection="none"` to be the default, so that I do not pay for selection state or click handlers I do not need.

17. As a consumer wiring item interaction, I want `<List.Item>` to have **no** default click handler, so that I decide whether clicking toggles selection, activates the row, navigates, or does nothing — the same primitive then powers sidebars, data tables, and pickers.

18. As a consumer styling primitives, I want every primitive to expose state via `data-*` attributes (`data-selected`, `data-active`, `data-disabled`, `data-sort`, `data-collapsed`), so that I can write Tailwind selectors against them without class-injection props.

19. As a consumer customizing primitive element types, I want both `as="div"` (prop) and `asChild` (slot merge) on every primitive, so that I can swap the rendered element or merge into an existing element without wrapper divs.

20. As a CRM maintainer, I want the existing `ListView` to be untouched and continue to work in v1, so that the new primitive can ship without forcing a coordinated CRM release.

21. As a CRM maintainer planning the eventual migration, I want a near-1:1 mapping from `DealsListView.vue`'s current structure to the new `<List.*>` primitives, so that the migration is a rename + slot-prop adjustment rather than a rewrite.

22. As a CRM maintainer, I want a working migration of one smaller CRM ListView shipped alongside the primitive, so that the migration guide is drawn from real experience rather than written speculatively.

23. As a future contributor adding `<List.EditableCell>` in v2, I want the v1 selection/keyboard/ARIA modules to be exported as composables and internal utilities, so that the editable cell builds on the same substrate rather than re-implementing it.

24. As a bundle-size-conscious consumer, I want importing `List` to not double the bundle when `ListView` is also imported, so that the staged migration does not regress payload.

25. As a contributor writing tests, I want the selection logic, keyboard handlers, and ARIA wiring to live in small modules with no Vue surface, so that they can be unit-tested directly without mounting components.

26. As a frappe-ui user, I want a one-time deprecation warning when the old `List` (alias to `ListView`) shape is detected at runtime, so that I have a clear signal to migrate without my app breaking.

## Implementation Decisions

**Public surface.** Seven Vue components, exposed as a compound dot-namespace via `Object.assign(List, { Root, Item, Group, GroupLabel, Columns, ColumnHeader, Cell })`. One top-level export: `export { List } from './components/List'`. The new `List` replaces the pre-existing `List = ListView` alias; the alias emits a one-time `warnDeprecated` when its old shape is detected.

**Caller writes v-for.** No `:rows` or `:columns` data props on any primitive. Consumers iterate themselves. This is the structural decision that lets the same primitive power data tables, sidebars, and Combobox-style pickers.

**Selection module (deep, headless, testable in isolation).** Encapsulates: single/multiple/none modes, `Set<Key>`-based state, toggle, range-select (anchor + shift), clear, select-all. Pure functions over `(current: Set<Key>, event, items: Key[]) => Set<Key>`. No Vue reactivity inside the module — Root wraps it. Single mode is "a Set you've agreed to never grow past 1"; Root exposes a `selectedValue` slot prop for single-mode ergonomic access.

**Keyboard module (deep, headless, testable in isolation).** Two handler tables — listbox 1D and grid 2D. Inputs: current active key, event, item registry, columns registry (grid mode), options (wrap, type-to-search on/off). Output: next active key + optional selection delta. No DOM access — Root translates output to focus calls.

**ARIA module.** Pure mapping from `(mode: 'listbox' | 'grid', state)` to the attribute set each primitive should render. Driven by whether `<List.Columns>` registered with Root.

**`asChild` / `as` helper.** Shared internal utility mirroring reka-ui's slot-merge semantics — merges class, listeners, and refs from the primitive onto the user-provided child. Every primitive uses it.

**Context plumbing.** Root provides via `provide()` a context object that Item, Group, Columns, ColumnHeader, and Cell consume. `<List.Columns>` registers itself with Root so that `<List.Cell>` (which lives inside `<List.Item>`, outside the Columns DOM subtree) can read widths/order/align via Root.

**Group state.** `v-model:collapsed` is owned by the `<List.Group>` instance. No row mutation, no `_collapsed` field smuggled onto consumer data. Root's keyboard nav consults the group registry to skip collapsed groups.

**Routing.** No dedicated `<List.ItemLink>` primitive. The `as` prop covers it: `<List.Item :as="RouterLink" :to="…">`. The legacy `getRowRoute(row)` pattern is gone.

**Click behavior.** `<List.Item>` has no default click handler. Consumers wire `@click="toggle(value)"`, `@click="activate(value)"`, or routing as needed.

**TypeScript.** Every primitive is generic over `Key extends string | number` (default `string`) via `<script setup lang="ts" generic="Key">`. The `Column` interface is exported from `types.ts` and is flat (no function-returning-VNode fields).

**Composables (public).** `useListContext`, `useListItem`, `useListGroup`, `useListCell`, `useListColumns`. These are the same hooks the primitives themselves use internally — exporting them gives advanced consumers an escape hatch for custom non-tabular layouts.

**`ListView` untouched.** Zero edits to `src/components/ListView/*` in v1. Full deprecation of `ListView` itself is gated on a successful CRM migration of at least one view and is a v1.x concern, not v1.0.

**Compound namespace deviation.** Recorded in ADR-0004 (already drafted at `spec/adr/0004-list-family-compound-namespace.md`). Gating heuristic for future families: structural roles in one render tree → compound; distinct UX components sharing internals → flat siblings.

## Testing Decisions

**What makes a good test here.** Test external behavior, not implementation details. The selection, keyboard, and ARIA modules are pure functions — tests assert input → output. The Vue primitives are tested through their public slot/prop/emit contract using `@vue/test-utils`; tests never reach into internal `provide`/`inject` keys or component instance state.

**Modules to unit-test directly (no Vue mount):**

- **Selection module** — single/multiple/none mode behavior; toggle; range select with anchor; Shift+Click extending an existing range; clear; select-all on a paged subset; the "single mode never grows past 1" invariant.
- **Keyboard module — listbox** — Up/Down wrap and clamp behavior; Home/End/PageUp/PageDown targeting; Space toggle only when `selection !== "none"`; Enter emits activate; type-to-search opt-in respects the off-by-default flag.
- **Keyboard module — grid** — Left/Right between cells in a row; Up/Down between same-column cells in adjacent rows; roving tabindex transitions; row-level selection still works in grid mode.
- **ARIA module** — `role="listbox"` when no Columns registered; `role="grid"` when Columns registered; `aria-selected`, `aria-activedescendant` (or roving tabindex equivalent), `aria-sort`, `aria-rowindex` / `aria-colindex` for the simple case.

**Modules to test through their Vue surface (component tests):**

- **`<List.Root>` + `<List.Item>`** — `v-model:selected` round-trips; `@activate` fires on Enter and not on plain click (consumer wires click); `selectedValue` slot prop matches the singleton in single mode; `:disabled` items are skipped by keyboard nav and not selectable.
- **`<List.Group>`** — `v-model:collapsed` round-trips; keyboard nav skips collapsed groups; `role="group"` + `aria-labelledby` wires to `<List.GroupLabel>`.
- **`<List.Columns>` v-models** — `sort`, `widths`, `order` round-trip through Root to `<List.Cell>` and `<List.ColumnHeader>`.
- **`asChild` / `as`** — `<List.Item :as="RouterLink" :to="…">` renders an `<a>` with the correct href; `asChild` merges class and listeners onto the child without an extra wrapper.

**Integration / a11y:**

- **axe-core a11y audit** on a dev page rendering both ARIA modes — zero violations is the gate.
- **Manual VoiceOver pass** on macOS for both listbox and grid modes — row/cell announcements, selection state, sort state must read correctly.
- **Visual smoke stories** in the frappe-ui dev playground: sidebar (listbox), single-mode picker, grouped sortable tabular list (mirrors DealsListView), draggable list.
- **CRM no-op smoke** — verify `ListView` is byte-for-byte unchanged and CRM views continue to work.
- **Migration proof** — port one smaller CRM ListView to the new primitives; the act of porting is the migration guide source material.
- **Bundle-size check** — import both `List` and `ListView` and assert that the new family does not double the relevant chunk.

**Prior art in the codebase.** `src/components/ListView/*` is the behavior reference for selection-toggle, shift-click range, group-collapse, and column-resize math. `src/components/Dropdown/*` and `src/components/Tabs/*` are the reference for how frappe-ui wraps reka-ui compound primitives and the `asChild` pattern. `src/components/Tree/*` is the closest existing recursive headless-ish pattern. There are no existing component-level a11y tests to mirror — this PR introduces that pattern.

## Out of Scope

**Deferred to v2** (built on top of the same primitives, designed against real consumers):

- `<List.EditableCell>` + `useEditableCell` — designed when the CRM `Grid.vue` migration starts, not speculatively.
- **Virtualization** — designed when a real ≥1000-row consumer emerges. Today's `ListView` does not virtualize, so this is not a v1 parity gap.
- **Runtime-discovered columns** (generic doctype renderer) — speculative; defer until concrete demand.
- **Cell-range / block selection.**
- **Frozen columns** and sticky-header `aria-rowindex` math beyond the simple case.
- **Server-grouped data shape.**

**Out of scope, permanently — consumer-owned:**

- `:rows` / `:columns` props on the primitive.
- Pagination (already consumer-owned in today's CRM via external `<ListFooter>`).
- Loading skeletons, density, empty-state default rendering.
- `groupBy` transformation — consumer declares `<List.Group>` directly.
- `getRowRoute` — caller uses `<List.Item :as="RouterLink" :to="…">`.

**Will not change in v1:**

- `<ListView>` and its exported sub-components are byte-for-byte unchanged.
- Full `<ListView>` deprecation comes after migration proof, in v1.x — not v1.0.

## Further Notes

- The compound dot-namespace deviation is load-bearing — once `<List.Root>` is documented and consumed, renaming to `<ListRoot>` is a breaking rename across every call site. ADR-0004 records the trade-off and is the gate for future compound families.
- The v1 deliverable is the primitive family + tests + dev-playground stories + one CRM view migration. The migration is what makes the primitive credible; without it, this is "another headless list library" rather than "the frappe-ui list primitive."
- The `Grid.vue` editable-table problem in CRM is the implicit forcing function for v2's `<List.EditableCell>`. Keeping selection/keyboard/ARIA in small headless modules in v1 is what makes v2 cheap; if they end up entangled inside Root, the v2 design will be much harder.
- File layout follows the plan at `src/components/List/plan.md` — `primitives/`, `composables/`, `internal/`, `types.ts`, `index.ts`. The plan is the engineering-level companion to this PRD.
