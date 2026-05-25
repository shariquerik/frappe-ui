import type { ListAriaMode, ListSortDirection } from '../types'

export interface ListboxRootAttrs {
  role: 'listbox'
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-multiselectable'?: 'true'
  'aria-activedescendant'?: string
}

export interface GridRootAttrs {
  role: 'grid'
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-multiselectable'?: 'true'
}

export type ListRootAttrs = ListboxRootAttrs | GridRootAttrs

export interface ListboxItemAttrs {
  role: 'option'
  id: string
  tabindex: 0 | -1
  'data-active': '' | undefined
  'data-disabled': '' | undefined
  'aria-disabled'?: 'true'
  'aria-selected'?: 'true' | 'false'
}

export interface GridRowAttrs {
  role: 'row'
  id: string
  'data-active': '' | undefined
  'data-disabled': '' | undefined
  'aria-disabled'?: 'true'
  'aria-selected'?: 'true' | 'false'
}

export type ListItemAttrs = ListboxItemAttrs | GridRowAttrs

export interface ColumnHeaderAttrs {
  role: 'columnheader'
  'aria-sort'?: 'ascending' | 'descending' | 'none'
  'data-sort': 'asc' | 'desc' | 'none'
}

export interface GridCellAttrs {
  role: 'gridcell'
  tabindex: 0 | -1
  'data-active': '' | undefined
}

export function rootAriaAttrs(opts: {
  mode: 'listbox'
  multiSelectable: boolean
  ariaLabel?: string
  ariaLabelledby?: string
  activeDescendantId?: string | null
}): ListboxRootAttrs
export function rootAriaAttrs(opts: {
  mode: 'grid'
  multiSelectable: boolean
  ariaLabel?: string
  ariaLabelledby?: string
  activeDescendantId?: string | null
}): GridRootAttrs
export function rootAriaAttrs(opts: {
  mode: ListAriaMode
  multiSelectable: boolean
  ariaLabel?: string
  ariaLabelledby?: string
  activeDescendantId?: string | null
}): ListRootAttrs {
  if (opts.mode === 'grid') {
    const attrs: GridRootAttrs = { role: 'grid' }
    if (opts.ariaLabel) attrs['aria-label'] = opts.ariaLabel
    if (opts.ariaLabelledby) attrs['aria-labelledby'] = opts.ariaLabelledby
    if (opts.multiSelectable) attrs['aria-multiselectable'] = 'true'
    return attrs
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
  mode?: 'listbox'
}): ListboxItemAttrs
export function itemAriaAttrs(opts: {
  id: string
  active: boolean
  disabled: boolean
  selected?: boolean
  mode: 'grid'
}): GridRowAttrs
export function itemAriaAttrs(opts: {
  id: string
  active: boolean
  disabled: boolean
  selected?: boolean
  mode?: ListAriaMode
}): ListItemAttrs {
  const mode: ListAriaMode = opts.mode ?? 'listbox'
  if (mode === 'grid') {
    const attrs: GridRowAttrs = {
      role: 'row',
      id: opts.id,
      'data-active': opts.active ? '' : undefined,
      'data-disabled': opts.disabled ? '' : undefined,
    }
    if (opts.disabled) attrs['aria-disabled'] = 'true'
    if (opts.selected !== undefined)
      attrs['aria-selected'] = opts.selected ? 'true' : 'false'
    return attrs
  }
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

/**
 * Header row in grid mode — pure `role="row"`. Cells carry their own
 * `role="columnheader"`.
 */
export function headerRowAriaAttrs(): { role: 'row' } {
  return { role: 'row' }
}

export function columnHeaderAriaAttrs(opts: {
  sort: ListSortDirection | null
}): ColumnHeaderAttrs {
  const dataSort: 'asc' | 'desc' | 'none' = opts.sort ?? 'none'
  const attrs: ColumnHeaderAttrs = {
    role: 'columnheader',
    'data-sort': dataSort,
  }
  if (opts.sort === 'asc') attrs['aria-sort'] = 'ascending'
  else if (opts.sort === 'desc') attrs['aria-sort'] = 'descending'
  else attrs['aria-sort'] = 'none'
  return attrs
}

export function gridCellAriaAttrs(opts: { active: boolean }): GridCellAttrs {
  return {
    role: 'gridcell',
    tabindex: opts.active ? 0 : -1,
    'data-active': opts.active ? '' : undefined,
  }
}
