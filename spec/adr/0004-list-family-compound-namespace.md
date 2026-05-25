# `<List>` family uses compound dot-namespace, deviating from library convention

**Status**: accepted

## Context

`frappe-ui` so far names every component with a flat top-level identifier — `<Dialog>`, `<Dropdown>`, `<Tabs>`, `<Combobox>`, `<ItemListRow>`. The selection family (`spec/selection.md`) explicitly chose flat sibling components over compound primitive families, citing the "non-goal" of exposing a broad set of low-level primitives as the primary public API.

When designing the v1 `<List>` family (replacing `ListView`), the same question came up: ship one shell + a row primitive (selection-family pattern), or ship a compound primitive family.

We chose **compound primitive family**, exposed under a dot-namespace: `<List.Root>`, `<List.Item>`, `<List.Group>`, `<List.GroupLabel>`, `<List.Columns>`, `<List.ColumnHeader>`, `<List.Cell>`. This is the first compound-namespace component in frappe-ui and a deliberate deviation from the selection family's precedent.

## Decision

Ship `<List>` as a compound primitive family under the `List.*` dot-namespace. Implementation: `Object.assign(List, { Root, Item, Group, GroupLabel, Columns, ColumnHeader, Cell })`. One import (`import { List } from 'frappe-ui'`) yields the whole family.

There is no opinionated `<List :rows :columns>` wrapper. Consumers assemble primitives directly and own the v-for over items and columns.

## Rationale

- **Family size.** The selection family settled on one shell per UX (Dropdown, Select, Combobox, MultiSelect) + one shared row primitive (`ItemListRow`). The List family has 7 primitives in v1 and will grow toward ~10 by v2 (`EditableCell`, virtualization-aware variants). Flat sibling naming (`<ListColumnHeader>`, `<ListGroupLabel>`, `<ListEditableCell>`) is hard to discover at the call site; dot-namespace plus IDE autocomplete makes the family browsable.
- **Nature of the split.** The selection family splits on **semantic UX boundaries** — `<Combobox>` and `<MultiSelect>` are different mental models with different visuals, so flat siblings reflect a real conceptual boundary. The List family splits on **structural roles in a single render tree** — Root, Item, and Cell are not different components, they are different positions in one component's composition. Dot-namespace expresses that relationship; flat siblings would obscure it.
- **Caller-assembled layout.** Today's `<ListView>` is already compound in practice — `DealsListView.vue` manually composes `<ListView>` + `<ListHeader>` + `<ListHeaderItem v-for>` + `<ListRows v-slot>` + `<ListRowItem>` + `<ListSelectBanner>` + `<ListFooter>`. The compound surface formalizes what consumers already do.
- **Reka-ui precedent.** Reka-ui (which the library already wraps for primitives like Dialog) uses compound dot-namespace pervasively. The pattern is familiar to the broader Vue ecosystem.

## Consequences

- The library now has two precedents for primitive composition: flat siblings (selection family) and compound dot-namespace (List family). Future primitive families must justify which precedent applies. The gating heuristic: **structural roles in one render tree → compound; distinct UX components sharing internals → flat siblings.**
- Existing flat `List = ListView` alias deprecates immediately (P13) — the name is taken by the new namespace root. One-time `warnDeprecated` call when the old shape is detected.
- Tree-shaking: dot-namespace is the documented import path. A sub-path export (`frappe-ui/list`) was considered for tree-shaking-sensitive consumers but rejected as additional surface area without clear demand.
- Reversal cost is high — once `<List.Root>` is documented and consumed, renaming to `<ListRoot>` is a breaking rename across every call site. This decision is effectively load-bearing for v1.
