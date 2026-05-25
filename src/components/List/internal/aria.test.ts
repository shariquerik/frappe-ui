import { describe, expect, it } from 'vitest'
import { itemAriaAttrs, rootAriaAttrs } from './aria'

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

  it('throws when asked for non-listbox modes (slice-1 scope)', () => {
    expect(() =>
      rootAriaAttrs({ mode: 'grid' as any, multiSelectable: false }),
    ).toThrow(/grid mode/)
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
