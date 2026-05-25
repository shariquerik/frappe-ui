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
