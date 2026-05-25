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
