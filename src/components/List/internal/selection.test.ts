import { describe, expect, it } from 'vitest'
import {
  applySelection,
  clearSelection,
  extendRange,
  selectAll,
  singleValue,
  toggleSelection,
  type SelectableItem,
} from './selection'

const items: SelectableItem<string>[] = [
  { value: 'a' },
  { value: 'b' },
  { value: 'c', disabled: true },
  { value: 'd' },
  { value: 'e' },
]

describe('toggleSelection', () => {
  describe('mode: none', () => {
    it('returns the same set untouched', () => {
      const current = new Set(['a'])
      expect(toggleSelection(current, 'b', 'none')).toBe(current)
    })
  })

  describe('mode: single', () => {
    it('replaces the current selection', () => {
      expect(toggleSelection(new Set(['a']), 'b', 'single')).toEqual(new Set(['b']))
    })

    it('clears when toggling the already-selected value', () => {
      expect(toggleSelection(new Set(['a']), 'a', 'single')).toEqual(new Set<string>())
    })

    it('selects from empty', () => {
      expect(toggleSelection(new Set<string>(), 'a', 'single')).toEqual(new Set(['a']))
    })

    it('never grows past 1 even if input held more', () => {
      // Defensive: if the consumer somehow seeded a >1 set, toggling a new
      // value should still collapse to that one value.
      const next = toggleSelection(new Set(['a', 'b']), 'c', 'single')
      expect(next.size).toBe(1)
      expect(next.has('c')).toBe(true)
    })
  })

  describe('mode: multiple', () => {
    it('adds a value', () => {
      expect(toggleSelection(new Set(['a']), 'b', 'multiple')).toEqual(new Set(['a', 'b']))
    })

    it('removes a value', () => {
      expect(toggleSelection(new Set(['a', 'b']), 'a', 'multiple')).toEqual(new Set(['b']))
    })

    it('does not mutate input', () => {
      const current = new Set(['a'])
      toggleSelection(current, 'b', 'multiple')
      expect(current).toEqual(new Set(['a']))
    })
  })
})

describe('extendRange', () => {
  it('selects an inclusive range from anchor to target', () => {
    const next = extendRange(new Set<string>(), items, 'a', 'd', 'multiple')
    expect(next).toEqual(new Set(['a', 'b', 'd']))
  })

  it('works when target is above anchor', () => {
    const next = extendRange(new Set<string>(), items, 'e', 'b', 'multiple')
    expect(next).toEqual(new Set(['b', 'd', 'e']))
  })

  it('preserves existing selection (additive)', () => {
    const next = extendRange(new Set(['z']), items, 'a', 'b', 'multiple')
    expect(next).toEqual(new Set(['z', 'a', 'b']))
  })

  it('skips disabled items', () => {
    const next = extendRange(new Set<string>(), items, 'a', 'd', 'multiple')
    expect(next.has('c')).toBe(false)
  })

  it('falls back to single toggle in single mode', () => {
    expect(extendRange(new Set(['a']), items, 'a', 'b', 'single')).toEqual(
      new Set(['b']),
    )
  })

  it('returns current untouched in none mode', () => {
    const current = new Set(['a'])
    expect(extendRange(current, items, 'a', 'b', 'none')).toBe(current)
  })

  it('starts at target when anchor is null', () => {
    expect(extendRange(new Set<string>(), items, null, 'b', 'multiple')).toEqual(new Set(['b']))
  })

  it('starts at target when anchor not present', () => {
    expect(extendRange(new Set<string>(), items, 'zzz', 'b', 'multiple')).toEqual(new Set(['b']))
  })

  it('returns current when target not present', () => {
    const current = new Set(['a'])
    expect(extendRange(current, items, 'a', 'zzz', 'multiple')).toBe(current)
  })
})

describe('selectAll', () => {
  it('selects every enabled item in multiple mode', () => {
    expect(selectAll(items, 'multiple')).toEqual(new Set(['a', 'b', 'd', 'e']))
  })

  it('returns empty set in single or none mode', () => {
    expect(selectAll(items, 'single')).toEqual(new Set<string>())
    expect(selectAll(items, 'none')).toEqual(new Set<string>())
  })

  it('excludes items in collapsed groups (skipped=true)', () => {
    const withCollapsed: SelectableItem<string>[] = [
      { value: 'a' },
      { value: 'b', skipped: true },
      { value: 'c', skipped: true },
      { value: 'd' },
    ]
    expect(selectAll(withCollapsed, 'multiple')).toEqual(new Set(['a', 'd']))
  })
})

describe('extendRange — collapsed-group skip', () => {
  // Items 'b' and 'c' belong to a collapsed group. A range from 'a' to 'd'
  // should land on 'a' and 'd' only — hidden rows must not be silently picked.
  const grouped: SelectableItem<string>[] = [
    { value: 'a' },
    { value: 'b', skipped: true },
    { value: 'c', skipped: true },
    { value: 'd' },
    { value: 'e' },
  ]

  it('skips collapsed-group items inside the anchor→target range', () => {
    const next = extendRange(new Set<string>(), grouped, 'a', 'd', 'multiple')
    expect(next).toEqual(new Set(['a', 'd']))
    expect(next.has('b')).toBe(false)
    expect(next.has('c')).toBe(false)
  })

  it('still skips collapsed items when the range runs upward', () => {
    const next = extendRange(new Set<string>(), grouped, 'e', 'a', 'multiple')
    expect(next).toEqual(new Set(['a', 'd', 'e']))
  })

  it('treats `disabled` and `skipped` symmetrically inside a range', () => {
    const mixed: SelectableItem<string>[] = [
      { value: 'a' },
      { value: 'b', disabled: true },
      { value: 'c', skipped: true },
      { value: 'd' },
    ]
    const next = extendRange(new Set<string>(), mixed, 'a', 'd', 'multiple')
    expect(next).toEqual(new Set(['a', 'd']))
  })
})

describe('clearSelection', () => {
  it('returns an empty set', () => {
    expect(clearSelection<string>()).toEqual(new Set<string>())
  })
})

describe('applySelection (mode invariant funnel)', () => {
  it('returns empty in none mode regardless of input', () => {
    expect(applySelection(new Set(['a', 'b']), 'none')).toEqual(new Set<string>())
  })

  it('passes through multiple mode untouched', () => {
    const cand = new Set(['a', 'b', 'd'])
    expect(applySelection(cand, 'multiple')).toEqual(cand)
  })

  it('collapses to a single value in single mode', () => {
    const next = applySelection(new Set(['a', 'b']), 'single')
    expect(next.size).toBe(1)
  })

  it('prefers the named value when collapsing', () => {
    expect(applySelection(new Set(['a', 'b', 'd']), 'single', 'b')).toEqual(
      new Set(['b']),
    )
  })

  it('keeps an empty set empty in single mode', () => {
    expect(applySelection(new Set<string>(), 'single')).toEqual(new Set<string>())
  })
})

describe('singleValue', () => {
  it('returns the lone value in single mode', () => {
    expect(singleValue(new Set(['a']), 'single')).toBe('a')
  })

  it('returns undefined when empty in single mode', () => {
    expect(singleValue(new Set<string>(), 'single')).toBeUndefined()
  })

  it('returns undefined outside single mode', () => {
    expect(singleValue(new Set(['a']), 'multiple')).toBeUndefined()
    expect(singleValue(new Set(['a']), 'none')).toBeUndefined()
  })
})
