import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'
import { List } from './index'

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
            default: ({ select }: { select: (v: string, e?: MouseEvent) => void }) =>
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
      cy.get('[data-cy="item-3"]').click().then(() => {
        expect([...selectedRef.value].sort()).to.deep.equal(['Apple', 'Banana'])
      })

      cy.get('[data-cy="item-0"]').click().then(() => {
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
      cy.get('[data-cy="item-3"]').click({ shiftKey: true }).then(() => {
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

      cy.get('[data-cy="item-2"]').click({ force: true }).then(() => {
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
      cy.get('[data-cy="item-3"]').click({ shiftKey: true }).then(() => {
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

// ---- Slice 4: <List.Columns> + <List.ColumnHeader> + <List.Cell> ----

import type { Column, ListSort } from './types'

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
