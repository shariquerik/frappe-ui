import type { ListAriaMode } from '../types'

export interface ListboxRootAttrs {
  role: 'listbox'
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-multiselectable'?: 'true'
  'aria-activedescendant'?: string
}

export interface ListboxItemAttrs {
  role: 'option'
  id: string
  tabindex: 0 | -1
  'data-active': '' | undefined
  'data-disabled': '' | undefined
  'aria-disabled'?: 'true'
  'aria-selected'?: 'true' | 'false'
}

export function rootAriaAttrs(opts: {
  mode: ListAriaMode
  multiSelectable: boolean
  ariaLabel?: string
  ariaLabelledby?: string
  activeDescendantId?: string | null
}): ListboxRootAttrs {
  if (opts.mode !== 'listbox') {
    throw new Error(
      `[List] grid mode ARIA is not implemented yet; got mode="${opts.mode}"`,
    )
  }
  const attrs: ListboxRootAttrs = { role: 'listbox' }
  if (opts.ariaLabel) attrs['aria-label'] = opts.ariaLabel
  if (opts.ariaLabelledby) attrs['aria-labelledby'] = opts.ariaLabelledby
  if (opts.multiSelectable) attrs['aria-multiselectable'] = 'true'
  if (opts.activeDescendantId)
    attrs['aria-activedescendant'] = opts.activeDescendantId
  return attrs
}

export function itemAriaAttrs(opts: {
  id: string
  active: boolean
  disabled: boolean
  selected?: boolean
}): ListboxItemAttrs {
  const attrs: ListboxItemAttrs = {
    role: 'option',
    id: opts.id,
    tabindex: opts.active && !opts.disabled ? 0 : -1,
    'data-active': opts.active ? '' : undefined,
    'data-disabled': opts.disabled ? '' : undefined,
  }
  if (opts.disabled) attrs['aria-disabled'] = 'true'
  if (opts.selected !== undefined)
    attrs['aria-selected'] = opts.selected ? 'true' : 'false'
  return attrs
}
