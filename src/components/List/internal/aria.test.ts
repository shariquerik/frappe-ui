import { describe, expect, it } from 'vitest'
import {
  columnHeaderAriaAttrs,
  gridCellAriaAttrs,
  headerRowAriaAttrs,
  itemAriaAttrs,
  rootAriaAttrs,
} from './aria'

describe('rootAriaAttrs (listbox mode)', () => {
  it('exposes role=listbox by default', () => {
    expect(
      rootAriaAttrs({ mode: 'listbox', multiSelectable: false }),
    ).toEqual({ role: 'listbox' })
  })

  it('adds aria-multiselectable only when multiple', () => {
    expect(
      rootAriaAttrs({ mode: 'listbox', multiSelectable: true })[
        'aria-multiselectable'
      ],
    ).toBe('true')
    expect(
      rootAriaAttrs({ mode: 'listbox', multiSelectable: false })[
        'aria-multiselectable'
      ],
    ).toBeUndefined()
  })

  it('passes through aria-label and aria-labelledby', () => {
    const attrs = rootAriaAttrs({
      mode: 'listbox',
      multiSelectable: false,
      ariaLabel: 'Files',
      ariaLabelledby: 'files-heading',
    })
    expect(attrs['aria-label']).toBe('Files')
    expect(attrs['aria-labelledby']).toBe('files-heading')
  })

  it('sets aria-activedescendant when an active id is given', () => {
    const attrs = rootAriaAttrs({
      mode: 'listbox',
      multiSelectable: false,
      activeDescendantId: 'list-item-7',
    })
    expect(attrs['aria-activedescendant']).toBe('list-item-7')
  })

})

describe('rootAriaAttrs (grid mode)', () => {
  it('exposes role=grid', () => {
    expect(rootAriaAttrs({ mode: 'grid', multiSelectable: false })).toEqual({
      role: 'grid',
    })
  })

  it('passes through aria-label / aria-labelledby / aria-multiselectable', () => {
    const attrs = rootAriaAttrs({
      mode: 'grid',
      multiSelectable: true,
      ariaLabel: 'Deals',
      ariaLabelledby: 'deals-heading',
    })
    expect(attrs).toEqual({
      role: 'grid',
      'aria-label': 'Deals',
      'aria-labelledby': 'deals-heading',
      'aria-multiselectable': 'true',
    })
  })

  it('does not emit aria-activedescendant in grid mode (roving tabindex lives on cells)', () => {
    const attrs = rootAriaAttrs({
      mode: 'grid',
      multiSelectable: false,
      activeDescendantId: 'row-1',
    })
    expect((attrs as any)['aria-activedescendant']).toBeUndefined()
  })
})

describe('itemAriaAttrs (listbox mode)', () => {
  it('renders role=option with id', () => {
    const attrs = itemAriaAttrs({
      id: 'list-item-1',
      active: false,
      disabled: false,
    })
    expect(attrs.role).toBe('option')
    expect(attrs.id).toBe('list-item-1')
  })

  it('exposes roving tabindex — 0 when active, -1 otherwise', () => {
    expect(
      itemAriaAttrs({ id: 'x', active: true, disabled: false }).tabindex,
    ).toBe(0)
    expect(
      itemAriaAttrs({ id: 'x', active: false, disabled: false }).tabindex,
    ).toBe(-1)
  })

  it('never makes a disabled item tab-focusable', () => {
    expect(
      itemAriaAttrs({ id: 'x', active: true, disabled: true }).tabindex,
    ).toBe(-1)
  })

  it('emits data-active and data-disabled flags for styling', () => {
    const active = itemAriaAttrs({ id: 'x', active: true, disabled: false })
    expect(active['data-active']).toBe('')
    expect(active['data-disabled']).toBeUndefined()

    const disabled = itemAriaAttrs({ id: 'x', active: false, disabled: true })
    expect(disabled['data-active']).toBeUndefined()
    expect(disabled['data-disabled']).toBe('')
    expect(disabled['aria-disabled']).toBe('true')
  })

  it('only emits aria-selected when a selected state is provided', () => {
    expect(
      itemAriaAttrs({ id: 'x', active: false, disabled: false })[
        'aria-selected'
      ],
    ).toBeUndefined()
    expect(
      itemAriaAttrs({
        id: 'x',
        active: false,
        disabled: false,
        selected: true,
      })['aria-selected'],
    ).toBe('true')
    expect(
      itemAriaAttrs({
        id: 'x',
        active: false,
        disabled: false,
        selected: false,
      })['aria-selected'],
    ).toBe('false')
  })
})

describe('itemAriaAttrs (grid mode)', () => {
  it('renders role=row with id (no roving tabindex on the row itself)', () => {
    const attrs = itemAriaAttrs({
      id: 'list-item-1',
      active: true,
      disabled: false,
      mode: 'grid',
    })
    expect(attrs.role).toBe('row')
    expect(attrs.id).toBe('list-item-1')
    expect((attrs as any).tabindex).toBeUndefined()
  })

  it('still surfaces data-active / data-disabled / aria-selected', () => {
    const attrs = itemAriaAttrs({
      id: 'row',
      active: true,
      disabled: true,
      selected: true,
      mode: 'grid',
    })
    expect(attrs['data-active']).toBe('')
    expect(attrs['data-disabled']).toBe('')
    expect(attrs['aria-disabled']).toBe('true')
    expect(attrs['aria-selected']).toBe('true')
  })
})

describe('headerRowAriaAttrs', () => {
  it('returns role=row for the header row wrapper', () => {
    expect(headerRowAriaAttrs()).toEqual({ role: 'row' })
  })
})

describe('columnHeaderAriaAttrs', () => {
  it('renders role=columnheader with data-sort=none when unsorted', () => {
    const attrs = columnHeaderAriaAttrs({ sort: null })
    expect(attrs.role).toBe('columnheader')
    expect(attrs['data-sort']).toBe('none')
    expect(attrs['aria-sort']).toBe('none')
  })

  it('maps asc / desc to ascending / descending', () => {
    expect(columnHeaderAriaAttrs({ sort: 'asc' })).toMatchObject({
      'data-sort': 'asc',
      'aria-sort': 'ascending',
    })
    expect(columnHeaderAriaAttrs({ sort: 'desc' })).toMatchObject({
      'data-sort': 'desc',
      'aria-sort': 'descending',
    })
  })
})

describe('gridCellAriaAttrs', () => {
  it('renders role=gridcell with roving tabindex on the active cell', () => {
    expect(gridCellAriaAttrs({ active: true })).toEqual({
      role: 'gridcell',
      tabindex: 0,
      'data-active': '',
    })
    expect(gridCellAriaAttrs({ active: false })).toEqual({
      role: 'gridcell',
      tabindex: -1,
      'data-active': undefined,
    })
  })
})
