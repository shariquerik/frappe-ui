import { describe, expect, it } from 'vitest'
import {
  cycleSort,
  formatWidth,
  moveColumn,
  resolveColumnOrder,
  resolveColumnWidth,
  sortDirectionFor,
} from './columns'
import type { Column, ListSort } from '../types'

const columns: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
  { key: 'archived', label: 'Archived', hidden: true },
]

describe('sortDirectionFor', () => {
  it('returns null when key is not in the sort spec', () => {
    expect(sortDirectionFor([], 'name')).toBeNull()
    expect(
      sortDirectionFor([{ key: 'status', direction: 'asc' }], 'name'),
    ).toBeNull()
  })

  it('returns the matching direction', () => {
    const sort: ListSort[] = [
      { key: 'name', direction: 'desc' },
      { key: 'status', direction: 'asc' },
    ]
    expect(sortDirectionFor(sort, 'name')).toBe('desc')
    expect(sortDirectionFor(sort, 'status')).toBe('asc')
  })
})

describe('cycleSort', () => {
  it('none → asc', () => {
    expect(cycleSort([], 'name')).toEqual([{ key: 'name', direction: 'asc' }])
  })

  it('asc → desc', () => {
    expect(cycleSort([{ key: 'name', direction: 'asc' }], 'name')).toEqual([
      { key: 'name', direction: 'desc' },
    ])
  })

  it('desc → none (removes the entry)', () => {
    expect(cycleSort([{ key: 'name', direction: 'desc' }], 'name')).toEqual([])
  })

  it('preserves other sort entries (multi-key sort)', () => {
    const sort: ListSort[] = [
      { key: 'status', direction: 'asc' },
      { key: 'name', direction: 'asc' },
    ]
    expect(cycleSort(sort, 'name')).toEqual([
      { key: 'status', direction: 'asc' },
      { key: 'name', direction: 'desc' },
    ])
  })
})

describe('resolveColumnOrder', () => {
  it('returns declared order when no override is provided', () => {
    expect(resolveColumnOrder(columns, []).map((c) => c.key)).toEqual([
      'name',
      'status',
      'amount',
    ])
  })

  it('honors the explicit order for mentioned keys, appends the rest', () => {
    expect(
      resolveColumnOrder(columns, ['amount', 'name']).map((c) => c.key),
    ).toEqual(['amount', 'name', 'status'])
  })

  it('drops hidden columns even when present in the order', () => {
    expect(
      resolveColumnOrder(columns, ['archived', 'name']).map((c) => c.key),
    ).toEqual(['name', 'status', 'amount'])
  })

  it('ignores unknown keys in the override', () => {
    expect(
      resolveColumnOrder(columns, ['nope', 'status']).map((c) => c.key),
    ).toEqual(['status', 'name', 'amount'])
  })
})

describe('moveColumn', () => {
  it('moves a key into the target position', () => {
    expect(moveColumn(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual([
      'a',
      'd',
      'b',
      'c',
    ])
    expect(moveColumn(['a', 'b', 'c', 'd'], 'a', 'd')).toEqual([
      'b',
      'c',
      'a',
      'd',
    ])
  })

  it('is a no-op when key === target', () => {
    expect(moveColumn(['a', 'b'], 'a', 'a')).toEqual(['a', 'b'])
  })

  it('returns a copy when the target is missing', () => {
    expect(moveColumn(['a', 'b'], 'a', 'z')).toEqual(['a', 'b'])
  })
})

describe('resolveColumnWidth', () => {
  it('returns the column.width when no override is set', () => {
    expect(resolveColumnWidth({ key: 'name', width: 200 }, {})).toBe(200)
    expect(resolveColumnWidth({ key: 'name' }, {})).toBeUndefined()
  })

  it('lets the widths context override the declared width', () => {
    expect(
      resolveColumnWidth({ key: 'name', width: 200 }, { name: 320 }),
    ).toBe(320)
  })
})

describe('formatWidth', () => {
  it('appends px to numbers', () => {
    expect(formatWidth(120)).toBe('120px')
  })

  it('passes strings through', () => {
    expect(formatWidth('20%')).toBe('20%')
    expect(formatWidth('auto')).toBe('auto')
  })

  it('returns undefined for undefined', () => {
    expect(formatWidth(undefined)).toBeUndefined()
  })
})
