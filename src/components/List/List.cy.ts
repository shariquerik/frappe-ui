import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'
import { List } from './index'
import type { Column, ListSort } from './types'

const items = ['Apple', 'Mango', 'Cherry', 'Banana', 'Peach']

interface MountOpts {
  disabledIndexes?: number[]
  as?: string
  itemAs?: string
  hrefs?: string[]
  selection?: 'none' | 'single' | 'multiple'
  initialSelected?: string[]
  onActivate?: (value: string) => void
  exposeSelected?: (ref: Ref<Set<string>>) => void
}

function mountList(opts: MountOpts = {}) {
  const disabled = new Set(opts.disabledIndexes ?? [])
  const Wrapper = defineComponent({
    setup() {
      const selected = ref(new Set<string>(opts.initialSelected ?? []))
      // Tests can capture the ref so we can inspect selection state directly
      // instead of round-tripping through DOM attributes.
      opts.exposeSelected?.(selected)

      return () =>
        h(
          List.Root as any,
          {
            'aria-label': 'Fruit',
            selection: opts.selection ?? 'none',
            selected: selected.value,
            'onUpdate:selected': (v: Set<string>) => (selected.value = v),
            onActivate: opts.onActivate,
          },
          {
            default: ({
              select,
            }: {
              select: (v: string, e?: MouseEvent) => void
            }) =>
              items.map((label, i) =>
                h(
                  List.Item as any,
                  {
                    key: label,
                    value: label,
                    disabled: disabled.has(i),
                    as: opts.itemAs ?? 'li',
                    ...(opts.hrefs ? { href: opts.hrefs[i] } : {}),
                    'data-cy': `item-${i}`,
                    onClick: (event: MouseEvent) => select(label, event),
                  },
                  { default: () => label },
                ),
              ),
          },
        )
    },
  })
  cy.mount(Wrapper)
}

describe('<List.Root> + <List.Item> (slice 1)', () => {
  it('renders listbox + options with one entry per child', () => {
    mountList()
    cy.get('[role="listbox"]').should('have.attr', 'aria-label', 'Fruit')
    cy.get('[role="option"]').should('have.length', items.length)
  })

  it('places roving tabindex=0 on the first enabled item only', () => {
    mountList()
    cy.get('[role="option"]').eq(0).should('have.attr', 'tabindex', '0')
    cy.get('[role="option"]').eq(1).should('have.attr', 'tabindex', '-1')
  })

  it('exposes data-active on the active row', () => {
    mountList()
    cy.get('[data-cy="item-0"]').should('have.attr', 'data-active', '')
  })

  describe('keyboard navigation', () => {
    it('ArrowDown / ArrowUp moves active and focused row', () => {
      mountList()
      cy.get('[data-cy="item-0"]').focus()

      cy.focused().trigger('keydown', { key: 'ArrowDown' })
      cy.get('[data-cy="item-1"]').should('have.attr', 'data-active', '')
      cy.focused().should('have.attr', 'data-cy', 'item-1')

      cy.focused().trigger('keydown', { key: 'ArrowDown' })
      cy.focused().trigger('keydown', { key: 'ArrowUp' })
      cy.focused().should('have.attr', 'data-cy', 'item-1')
    })

    it('Home / End jump to first / last enabled', () => {
      mountList()
      cy.get('[data-cy="item-2"]').focus()
      cy.focused().trigger('keydown', { key: 'End' })
      cy.focused().should('have.attr', 'data-cy', `item-${items.length - 1}`)

      cy.focused().trigger('keydown', { key: 'Home' })
      cy.focused().should('have.attr', 'data-cy', 'item-0')
    })

    it('skips disabled items', () => {
      mountList({ disabledIndexes: [1, 2] })
      cy.get('[data-cy="item-0"]').focus()

      cy.focused().trigger('keydown', { key: 'ArrowDown' })
      cy.focused().should('have.attr', 'data-cy', 'item-3')

      cy.get('[data-cy="item-1"]')
        .should('have.attr', 'aria-disabled', 'true')
        .and('have.attr', 'data-disabled', '')
        .and('have.attr', 'tabindex', '-1')
    })

    it('does not wrap past either end', () => {
      mountList()
      cy.get('[data-cy="item-0"]').focus()

      // already at top — ArrowUp is a no-op
      cy.focused().trigger('keydown', { key: 'ArrowUp' })
      cy.focused().should('have.attr', 'data-cy', 'item-0')

      cy.focused().trigger('keydown', { key: 'End' })
      // already at bottom — ArrowDown is a no-op
      cy.focused().trigger('keydown', { key: 'ArrowDown' })
      cy.focused().should('have.attr', 'data-cy', `item-${items.length - 1}`)
    })
  })

  it('renders items through `as="a"` with the right href and no default click', () => {
    const hrefs = items.map((_, i) => `/fruit/${i}`)
    mountList({ itemAs: 'a', hrefs })

    cy.get('a[role="option"]').should('have.length', items.length)
    cy.get('[data-cy="item-2"]').should('have.attr', 'href', '/fruit/2')
  })
})

describe('<List.Root> selection (slice 2)', () => {
  describe('mode: single', () => {
    it('selects on click and replaces the previous selection', () => {
      let selectedRef!: Ref<Set<string>>
      mountList({
        selection: 'single',
        exposeSelected: (r) => (selectedRef = r),
      })

      cy.get('[data-cy="item-1"]').click()
      cy.get('[data-cy="item-1"]')
        .should('have.attr', 'data-selected', '')
        .and('have.attr', 'aria-selected', 'true')
        .then(() => {
          expect([...selectedRef.value]).to.deep.equal(['Mango'])
        })

      cy.get('[data-cy="item-3"]').click()
      cy.get('[data-cy="item-1"]').should('have.attr', 'aria-selected', 'false')
      cy.get('[data-cy="item-3"]')
        .should('have.attr', 'aria-selected', 'true')
        .then(() => {
          expect([...selectedRef.value]).to.deep.equal(['Banana'])
        })
    })

    it('emits @activate on Enter', () => {
      const onActivate = cy.stub().as('activate')
      mountList({ selection: 'single', onActivate })
      cy.get('[data-cy="item-2"]').focus()
      cy.focused().trigger('keydown', { key: 'Enter' })
      cy.get('@activate').should('have.been.calledWith', 'Cherry')
    })
  })

  describe('mode: multiple', () => {
    it('toggles on click', () => {
      let selectedRef!: Ref<Set<string>>
      mountList({
        selection: 'multiple',
        exposeSelected: (r) => (selectedRef = r),
      })

      cy.get('[data-cy="item-0"]').click()
      cy.get('[data-cy="item-3"]')
        .click()
        .then(() => {
          expect([...selectedRef.value].sort()).to.deep.equal([
            'Apple',
            'Banana',
          ])
        })

      cy.get('[data-cy="item-0"]')
        .click()
        .then(() => {
          expect([...selectedRef.value]).to.deep.equal(['Banana'])
        })
    })

    it('extends a range with Shift+Click from the last anchor', () => {
      let selectedRef!: Ref<Set<string>>
      mountList({
        selection: 'multiple',
        exposeSelected: (r) => (selectedRef = r),
      })

      cy.get('[data-cy="item-0"]').click()
      cy.get('[data-cy="item-3"]')
        .click({ shiftKey: true })
        .then(() => {
          expect([...selectedRef.value].sort()).to.deep.equal([
            'Apple',
            'Banana',
            'Cherry',
            'Mango',
          ])
        })
    })

    it('extends a range with Shift+Arrow when the selection mode is multiple', () => {
      let selectedRef!: Ref<Set<string>>
      mountList({
        selection: 'multiple',
        exposeSelected: (r) => (selectedRef = r),
      })

      cy.get('[data-cy="item-0"]').click()
      cy.get('[data-cy="item-0"]').focus()
      cy.focused().trigger('keydown', { key: 'ArrowDown', shiftKey: true })
      cy.focused().trigger('keydown', { key: 'ArrowDown', shiftKey: true })
      cy.focused()
        .should('have.attr', 'data-cy', 'item-2')
        .then(() => {
          expect([...selectedRef.value].sort()).to.deep.equal([
            'Apple',
            'Cherry',
            'Mango',
          ])
        })
    })

    it('Space toggles the active item', () => {
      let selectedRef!: Ref<Set<string>>
      mountList({
        selection: 'multiple',
        exposeSelected: (r) => (selectedRef = r),
      })

      cy.get('[data-cy="item-1"]').focus()
      cy.focused()
        .trigger('keydown', { key: ' ' })
        .then(() => {
          expect([...selectedRef.value]).to.deep.equal(['Mango'])
        })
    })

    it('does not select a disabled item via click', () => {
      let selectedRef!: Ref<Set<string>>
      mountList({
        selection: 'multiple',
        disabledIndexes: [2],
        exposeSelected: (r) => (selectedRef = r),
      })

      cy.get('[data-cy="item-2"]')
        .click({ force: true })
        .then(() => {
          expect([...selectedRef.value]).to.deep.equal([])
        })
    })

    it('does not select a disabled item via Shift+Click range', () => {
      let selectedRef!: Ref<Set<string>>
      mountList({
        selection: 'multiple',
        disabledIndexes: [2],
        exposeSelected: (r) => (selectedRef = r),
      })

      cy.get('[data-cy="item-0"]').click()
      cy.get('[data-cy="item-3"]')
        .click({ shiftKey: true })
        .then(() => {
          expect([...selectedRef.value].sort()).to.deep.equal([
            'Apple',
            'Banana',
            'Mango',
          ])
          expect(selectedRef.value.has('Cherry')).to.be.false
        })
    })
  })

  describe('mode: none', () => {
    it('ignores clicks and Space — selection stays empty', () => {
      let selectedRef!: Ref<Set<string>>
      mountList({
        selection: 'none',
        exposeSelected: (r) => (selectedRef = r),
      })

      cy.get('[data-cy="item-1"]').click()
      cy.get('[data-cy="item-1"]').focus().trigger('keydown', { key: ' ' })
      cy.get('[data-cy="item-1"]')
        .should('not.have.attr', 'aria-selected')
        .then(() => {
          expect([...selectedRef.value]).to.deep.equal([])
        })
    })
  })
})

// ─── Slice 3: <List.Group> + <List.GroupLabel> ───────────────────────────

interface GroupSpec {
  label: string
  collapsed?: boolean
  items: { value: string; label?: string; disabled?: boolean }[]
}

interface GroupedMountOpts {
  groups: GroupSpec[]
  selection?: 'none' | 'single' | 'multiple'
  initialSelected?: string[]
  exposeSelected?: (ref: Ref<Set<string>>) => void
  exposeGroups?: (refs: Ref<boolean>[]) => void
  /** When set, the first group renders a <List.GroupLabel> slot with this text. */
  groupLabelSlot?: string
}

function mountGrouped(opts: GroupedMountOpts) {
  const Wrapper = defineComponent({
    setup() {
      const selected = ref(new Set<string>(opts.initialSelected ?? []))
      const collapsedRefs = opts.groups.map((g) => ref(!!g.collapsed))
      opts.exposeSelected?.(selected)
      opts.exposeGroups?.(collapsedRefs)

      return () =>
        h(
          List.Root as any,
          {
            'aria-label': 'Grouped',
            selection: opts.selection ?? 'none',
            selected: selected.value,
            'onUpdate:selected': (v: Set<string>) => (selected.value = v),
          },
          {
            default: ({
              select,
            }: {
              select: (v: string, e?: MouseEvent) => void
            }) =>
              opts.groups.map((g, gi) =>
                h(
                  List.Group as any,
                  {
                    key: g.label,
                    label:
                      gi === 0 && opts.groupLabelSlot ? undefined : g.label,
                    collapsed: collapsedRefs[gi].value,
                    'onUpdate:collapsed': (v: boolean) =>
                      (collapsedRefs[gi].value = v),
                    'data-cy': `group-${gi}`,
                  },
                  {
                    default: () => [
                      gi === 0 && opts.groupLabelSlot
                        ? h(
                            List.GroupLabel as any,
                            { 'data-cy': `group-${gi}-label` },
                            { default: () => opts.groupLabelSlot },
                          )
                        : null,
                      ...g.items.map((it, ii) =>
                        h(
                          List.Item as any,
                          {
                            key: it.value,
                            value: it.value,
                            disabled: it.disabled,
                            'data-cy': `g${gi}-item-${ii}`,
                            'data-value': it.value,
                            onClick: (event: MouseEvent) =>
                              select(it.value, event),
                          },
                          { default: () => it.label ?? it.value },
                        ),
                      ),
                    ],
                  },
                ),
              ),
          },
        )
    },
  })
  cy.mount(Wrapper)
}

describe('<List.Group> (slice 3)', () => {
  const groups: GroupSpec[] = [
    {
      label: 'Fruits',
      items: [{ value: 'apple' }, { value: 'mango' }],
    },
    {
      label: 'Veggies',
      items: [{ value: 'kale' }, { value: 'beet' }],
    },
  ]

  it('renders role=group with aria-labelledby pointing at the label element', () => {
    mountGrouped({ groups })
    cy.get('[data-cy="group-0"]').should('have.attr', 'role', 'group')
    cy.get('[data-cy="group-0"]')
      .invoke('attr', 'aria-labelledby')
      .should('be.a', 'string')
      .then((labelledby) => {
        cy.get(`#${labelledby}`).should('contain.text', 'Fruits')
      })
  })

  it('exposes data-collapsed only when collapsed', () => {
    mountGrouped({ groups: [{ ...groups[0], collapsed: true }, groups[1]] })
    cy.get('[data-cy="group-0"]').should('have.attr', 'data-collapsed', '')
    cy.get('[data-cy="group-1"]').should('not.have.attr', 'data-collapsed')
  })

  it('hides items inside a collapsed group from view', () => {
    let collapsedRefs!: Ref<boolean>[]
    mountGrouped({
      groups,
      exposeGroups: (r) => (collapsedRefs = r),
    })
    cy.get('[data-cy="g0-item-0"]').should('be.visible')
    cy.then(() => (collapsedRefs[0].value = true))
    cy.get('[data-cy="g0-item-0"]').should('not.be.visible')
    cy.get('[data-cy="g1-item-0"]').should('be.visible')
  })

  it('keyboard nav skips items inside a collapsed group', () => {
    let collapsedRefs!: Ref<boolean>[]
    mountGrouped({
      groups,
      exposeGroups: (r) => (collapsedRefs = r),
    })
    cy.then(() => (collapsedRefs[0].value = true))
    cy.get('[data-cy="g1-item-0"]').focus()
    // ArrowUp from the first item in group 1 must NOT enter the collapsed
    // group above — it should stay put because there is no enabled item
    // before it.
    cy.focused().trigger('keydown', { key: 'ArrowUp' })
    cy.focused().should('have.attr', 'data-cy', 'g1-item-0')
  })

  it('keyboard nav crosses group boundaries when no group is collapsed', () => {
    mountGrouped({ groups })
    cy.get('[data-cy="g0-item-1"]').focus()
    cy.focused().trigger('keydown', { key: 'ArrowDown' })
    cy.focused().should('have.attr', 'data-cy', 'g1-item-0')
  })

  it('range-select scopes correctly: items in a collapsed group are excluded', () => {
    let selectedRef!: Ref<Set<string>>
    let collapsedRefs!: Ref<boolean>[]
    mountGrouped({
      groups,
      selection: 'multiple',
      exposeSelected: (r) => (selectedRef = r),
      exposeGroups: (r) => (collapsedRefs = r),
    })
    // Click first item of group 1 (no anchor yet), then shift-click last item
    // of group 1 with group 1's preceding group collapsed. Range should only
    // span enabled items — nothing from the collapsed first group.
    cy.then(() => (collapsedRefs[0].value = true))
    cy.get('[data-cy="g1-item-0"]').click()
    cy.get('[data-cy="g1-item-1"]')
      .click({ shiftKey: true })
      .then(() => {
        const arr = [...selectedRef.value].sort()
        expect(arr).to.deep.equal(['beet', 'kale'])
        expect(selectedRef.value.has('apple')).to.be.false
        expect(selectedRef.value.has('mango')).to.be.false
      })
  })

  it('range-select across an expanded group includes every enabled row', () => {
    let selectedRef!: Ref<Set<string>>
    mountGrouped({
      groups,
      selection: 'multiple',
      exposeSelected: (r) => (selectedRef = r),
    })
    cy.get('[data-cy="g0-item-0"]').click()
    cy.get('[data-cy="g1-item-1"]')
      .click({ shiftKey: true })
      .then(() => {
        expect([...selectedRef.value].sort()).to.deep.equal([
          'apple',
          'beet',
          'kale',
          'mango',
        ])
      })
  })

  it('<List.GroupLabel> slot overrides the :label prop', () => {
    mountGrouped({ groups, groupLabelSlot: 'Slot label' })
    cy.get('[data-cy="group-0-label"]').should('contain.text', 'Slot label')
    // The auto-generated <span> fallback must NOT be rendered when the slot
    // is present — assert by id collision (only one element should own the
    // aria-labelledby target).
    cy.get('[data-cy="group-0"]')
      .invoke('attr', 'aria-labelledby')
      .then((labelledby) => {
        cy.get(`[id="${labelledby}"]`).should('have.length', 1)
        cy.get(`[id="${labelledby}"]`).should('contain.text', 'Slot label')
      })
  })
})


// ---- Slice 4: <List.Columns> + <List.ColumnHeader> + <List.Cell> ----

interface TabularRow {
  id: string
  name: string
  amount: number
  stage: string
}

const tabularRows: TabularRow[] = [
  { id: 'r1', name: 'Alpha', amount: 100, stage: 'New' },
  { id: 'r2', name: 'Bravo', amount: 250, stage: 'Won' },
  { id: 'r3', name: 'Charlie', amount: 175, stage: 'Lost' },
]

const tabularColumns: Column[] = [
  { key: 'name', label: 'Name', width: 160, sortable: true, resizable: true },
  { key: 'amount', label: 'Amount', width: 120, sortable: true },
  { key: 'stage', label: 'Stage', width: 120 },
]

interface MountTabularOpts {
  initialSort?: ListSort[]
  initialWidths?: Record<string, number | string>
  initialOrder?: string[]
  exposeState?: (state: {
    sort: Ref<ListSort[]>
    widths: Ref<Record<string, number | string>>
    order: Ref<string[]>
  }) => void
}

function mountTabular(opts: MountTabularOpts = {}) {
  const Wrapper = defineComponent({
    setup() {
      const sort = ref<ListSort[]>(opts.initialSort ?? [])
      const widths = ref<Record<string, number | string>>(
        opts.initialWidths ?? {},
      )
      const order = ref<string[]>(opts.initialOrder ?? [])
      opts.exposeState?.({ sort, widths, order })

      return () =>
        h(
          List.Root as any,
          {
            'aria-label': 'Deals',
            as: 'table',
            'data-cy': 'root',
          },
          {
            default: () => [
              h(
                List.Columns as any,
                {
                  as: 'thead',
                  sort: sort.value,
                  'onUpdate:sort': (v: ListSort[]) => (sort.value = v),
                  widths: widths.value,
                  'onUpdate:widths': (v: Record<string, number | string>) =>
                    (widths.value = v),
                  order: order.value,
                  'onUpdate:order': (v: string[]) => (order.value = v),
                },
                {
                  default: () =>
                    h(
                      'tr',
                      {},
                      tabularColumns.map((c) =>
                        h(
                          List.ColumnHeader as any,
                          {
                            key: c.key,
                            column: c,
                            'data-cy': `header-${c.key}`,
                          },
                          { default: () => c.label },
                        ),
                      ),
                    ),
                },
              ),
              h(
                'tbody',
                {},
                tabularRows.map((row, ri) =>
                  h(
                    List.Item as any,
                    {
                      key: row.id,
                      value: row.id,
                      as: 'tr',
                      'data-cy': `row-${ri}`,
                    },
                    {
                      default: () =>
                        tabularColumns.map((c) =>
                          h(
                            List.Cell as any,
                            {
                              key: c.key,
                              column: c,
                              'data-cy': `cell-${ri}-${c.key}`,
                            },
                            { default: () => String((row as any)[c.key]) },
                          ),
                        ),
                    },
                  ),
                ),
              ),
            ],
          },
        )
    },
  })
  cy.mount(Wrapper)
}

describe('<List.Columns> + <List.ColumnHeader> + <List.Cell> (slice 4)', () => {
  it('promotes Root to grid ARIA mode with row / columnheader / gridcell roles', () => {
    mountTabular()
    cy.get('[role="grid"]').should('exist')
    cy.get('[role="row"]').should('have.length', tabularRows.length + 1)
    cy.get('[role="columnheader"]').should('have.length', tabularColumns.length)
    cy.get('[role="gridcell"]').should(
      'have.length',
      tabularRows.length * tabularColumns.length,
    )
  })

  it('exposes data-sort on the header (initially none, asc after click)', () => {
    mountTabular()
    cy.get('[data-cy="header-name"]')
      .should('have.attr', 'data-sort', 'none')
      .click()
      .should('have.attr', 'data-sort', 'asc')
      .and('have.attr', 'aria-sort', 'ascending')
  })

  describe('2D keyboard navigation', () => {
    it('ArrowRight / ArrowLeft moves between cells in a row', () => {
      mountTabular()
      cy.get('[data-cy="cell-0-name"]').focus()
      cy.focused().trigger('keydown', { key: 'ArrowRight' })
      cy.focused().should('have.attr', 'data-cy', 'cell-0-amount')
      cy.focused().trigger('keydown', { key: 'ArrowLeft' })
      cy.focused().should('have.attr', 'data-cy', 'cell-0-name')
    })

    it('ArrowDown / ArrowUp moves between same-column cells across rows', () => {
      mountTabular()
      cy.get('[data-cy="cell-0-amount"]').focus()
      cy.focused().trigger('keydown', { key: 'ArrowDown' })
      cy.focused().should('have.attr', 'data-cy', 'cell-1-amount')
      cy.focused().trigger('keydown', { key: 'ArrowUp' })
      cy.focused().should('have.attr', 'data-cy', 'cell-0-amount')
    })

    it('Home / End move within the current row; Ctrl+Home / Ctrl+End to corners', () => {
      mountTabular()
      cy.get('[data-cy="cell-1-amount"]').focus()
      cy.focused().trigger('keydown', { key: 'End' })
      cy.focused().should('have.attr', 'data-cy', 'cell-1-stage')
      cy.focused().trigger('keydown', { key: 'Home' })
      cy.focused().should('have.attr', 'data-cy', 'cell-1-name')

      cy.focused().trigger('keydown', { key: 'End', ctrlKey: true })
      cy.focused().should('have.attr', 'data-cy', 'cell-2-stage')

      cy.focused().trigger('keydown', { key: 'Home', ctrlKey: true })
      cy.focused().should('have.attr', 'data-cy', 'cell-0-name')
    })
  })

  it('round-trips v-model:sort through Columns ↔ ColumnHeader', () => {
    let state!: {
      sort: Ref<ListSort[]>
      widths: Ref<Record<string, number | string>>
      order: Ref<string[]>
    }
    mountTabular({ exposeState: (s) => (state = s) })

    cy.get('[data-cy="header-amount"]')
      .click()
      .then(() => {
        expect(state.sort.value).to.deep.equal([
          { key: 'amount', direction: 'asc' },
        ])
      })

    cy.get('[data-cy="header-amount"]')
      .click()
      .then(() => {
        expect(state.sort.value).to.deep.equal([
          { key: 'amount', direction: 'desc' },
        ])
      })

    cy.get('[data-cy="header-amount"]')
      .click()
      .then(() => {
        expect(state.sort.value).to.deep.equal([])
      })
  })

  it('updates v-model:widths when the resize handle is dragged', () => {
    let state!: {
      sort: Ref<ListSort[]>
      widths: Ref<Record<string, number | string>>
      order: Ref<string[]>
    }
    mountTabular({ exposeState: (s) => (state = s) })

    cy.get('[data-cy="header-name"] .list-resize-handle')
      .trigger('pointerdown', { clientX: 160, button: 0 })
    cy.window().then((win) => {
      win.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 260, bubbles: true }),
      )
      win.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    })

    cy.then(() => {
      expect(state.widths.value.name).to.be.a('number')
      expect(state.widths.value.name as number).to.be.greaterThan(160)
    })
  })

  it('updates v-model:order when a header is dragged onto another', () => {
    let state!: {
      sort: Ref<ListSort[]>
      widths: Ref<Record<string, number | string>>
      order: Ref<string[]>
    }
    mountTabular({
      initialOrder: ['name', 'amount', 'stage'],
      exposeState: (s) => (state = s),
    })

    cy.get('[data-cy="header-stage"]').trigger('dragstart', {
      dataTransfer: new DataTransfer(),
    })
    cy.get('[data-cy="header-name"]')
      .trigger('dragover')
      .trigger('drop')
      .then(() => {
        expect(state.order.value).to.deep.equal(['stage', 'name', 'amount'])
      })
  })

  it('clicking an item still toggles selection (row-level selection works in grid mode)', () => {
    const Wrapper = defineComponent({
      setup() {
        const selected = ref(new Set<string>())
        return () =>
          h(
            List.Root as any,
            {
              'aria-label': 'Deals',
              as: 'table',
              selection: 'multiple',
              selected: selected.value,
              'onUpdate:selected': (v: Set<string>) => (selected.value = v),
            },
            {
              default: ({ select }: { select: (v: string, e?: MouseEvent) => void }) => [
                h(
                  List.Columns as any,
                  { as: 'thead' },
                  {
                    default: () =>
                      h(
                        'tr',
                        {},
                        tabularColumns.map((c) =>
                          h(
                            List.ColumnHeader as any,
                            { key: c.key, column: c },
                            { default: () => c.label },
                          ),
                        ),
                      ),
                  },
                ),
                h(
                  'tbody',
                  {},
                  tabularRows.map((row, ri) =>
                    h(
                      List.Item as any,
                      {
                        key: row.id,
                        value: row.id,
                        as: 'tr',
                        'data-cy': `row-${ri}`,
                        onClick: (e: MouseEvent) => select(row.id, e),
                      },
                      {
                        default: () =>
                          tabularColumns.map((c) =>
                            h(
                              List.Cell as any,
                              {
                                key: c.key,
                                column: c,
                                'data-cy': `cell-${ri}-${c.key}`,
                              },
                              { default: () => String((row as any)[c.key]) },
                            ),
                          ),
                      },
                    ),
                  ),
                ),
              ],
            },
          )
      },
    })
    cy.mount(Wrapper)
    cy.get('[data-cy="row-0"]').click()
    cy.get('[data-cy="row-0"]').should('have.attr', 'aria-selected', 'true')
  })
})

interface ReorderMountOpts {
  disabledIndexes?: number[]
  onReorder?: (payload: { from: number; to: number; value: string }) => void
}

function mountReorderableList(opts: ReorderMountOpts = {}) {
  const disabled = new Set(opts.disabledIndexes ?? [])
  const Wrapper = defineComponent({
    setup() {
      return () =>
        h(
          List.Root as any,
          {
            'aria-label': 'Fruit (drag to reorder)',
            onReorder: opts.onReorder,
          },
          {
            default: () =>
              items.map((label, i) =>
                h(
                  List.Item as any,
                  {
                    key: label,
                    value: label,
                    disabled: disabled.has(i),
                    draggable: true,
                    'data-cy': `item-${i}`,
                  },
                  { default: () => label },
                ),
              ),
          },
        )
    },
  })
  cy.mount(Wrapper)
}

/**
 * Fire a realistic HTML5 drag-and-drop sequence. Cypress doesn't have a
 * built-in drag command; the native events with a shared DataTransfer
 * mirror what the browser produces during a real user drag.
 */
function dragAndDrop(sourceCy: string, targetCy: string) {
  const dataTransfer = new DataTransfer()
  cy.get(`[data-cy="${sourceCy}"]`).trigger('dragstart', { dataTransfer })
  cy.get(`[data-cy="${targetCy}"]`).trigger('dragover', { dataTransfer })
  cy.get(`[data-cy="${targetCy}"]`).trigger('drop', { dataTransfer })
  cy.get(`[data-cy="${sourceCy}"]`).trigger('dragend', { dataTransfer })
}

describe('<List.Root> reorder (slice 5)', () => {
  it('emits @reorder with positional from/to and the source value on drop', () => {
    const onReorder = cy.stub().as('reorder')
    mountReorderableList({ onReorder })

    dragAndDrop('item-0', 'item-3')

    cy.get('@reorder').should('have.been.calledOnce')
    cy.get('@reorder').should('have.been.calledWithMatch', {
      from: 0,
      to: 3,
      value: 'Apple',
    })
  })

  it('emits @reorder when dragging up the list', () => {
    const onReorder = cy.stub().as('reorder')
    mountReorderableList({ onReorder })

    dragAndDrop('item-4', 'item-1')

    cy.get('@reorder').should('have.been.calledOnce')
    cy.get('@reorder').should('have.been.calledWithMatch', {
      from: 4,
      to: 1,
      value: 'Peach',
    })
  })

  it('renders draggable="true" on enabled items and skips disabled items', () => {
    mountReorderableList({ disabledIndexes: [2] })

    cy.get('[data-cy="item-0"]').should('have.attr', 'draggable', 'true')
    cy.get('[data-cy="item-2"]').should('not.have.attr', 'draggable')
  })

  it('does not begin a drag from a disabled item', () => {
    const onReorder = cy.stub().as('reorder')
    mountReorderableList({ disabledIndexes: [2], onReorder })

    dragAndDrop('item-2', 'item-0')

    cy.get('@reorder').should('not.have.been.called')
    cy.get('[data-cy="item-2"]').should('not.have.attr', 'data-dragging')
  })

  it('does not anchor a drop on a disabled item — no reorder fires', () => {
    const onReorder = cy.stub().as('reorder')
    mountReorderableList({ disabledIndexes: [2], onReorder })

    dragAndDrop('item-0', 'item-2')

    cy.get('@reorder').should('not.have.been.called')
  })

  it('sets data-dragging on the source and data-drop-target on the hover target', () => {
    mountReorderableList()
    const dataTransfer = new DataTransfer()

    cy.get('[data-cy="item-0"]').trigger('dragstart', { dataTransfer })
    cy.get('[data-cy="item-0"]').should('have.attr', 'data-dragging', '')

    cy.get('[data-cy="item-3"]').trigger('dragover', { dataTransfer })
    cy.get('[data-cy="item-3"]').should('have.attr', 'data-drop-target', '')

    // Drop clears both attrs once the gesture completes.
    cy.get('[data-cy="item-3"]').trigger('drop', { dataTransfer })
    cy.get('[data-cy="item-0"]').trigger('dragend', { dataTransfer })
    cy.get('[data-cy="item-0"]').should('not.have.attr', 'data-dragging')
    cy.get('[data-cy="item-3"]').should('not.have.attr', 'data-drop-target')
  })

  it('does not emit @reorder when dropping onto the source itself', () => {
    const onReorder = cy.stub().as('reorder')
    mountReorderableList({ onReorder })

    dragAndDrop('item-1', 'item-1')

    cy.get('@reorder').should('not.have.been.called')
  })

  it('does not emit @reorder when the drag is cancelled (dragend without drop)', () => {
    const onReorder = cy.stub().as('reorder')
    mountReorderableList({ onReorder })

    const dataTransfer = new DataTransfer()
    cy.get('[data-cy="item-0"]').trigger('dragstart', { dataTransfer })
    cy.get('[data-cy="item-2"]').trigger('dragover', { dataTransfer })
    // No `drop` — user released over a non-drop target.
    cy.get('[data-cy="item-0"]').trigger('dragend', { dataTransfer })

    cy.get('@reorder').should('not.have.been.called')
    cy.get('[data-cy="item-0"]').should('not.have.attr', 'data-dragging')
  })

  it('does not enable draggable when :draggable is not set', () => {
    mountList()
    cy.get('[data-cy="item-0"]').should('not.have.attr', 'draggable')
  })
})
