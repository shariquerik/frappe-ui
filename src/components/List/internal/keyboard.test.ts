import { describe, expect, it } from 'vitest'
import {
  isActivationKey,
  isListboxNavKey,
  isNavSkipped,
  isToggleKey,
  LISTBOX_NAV_KEYS,
  nextListboxIndex,
  nextTypeaheadIndex,
} from './keyboard'

const enabled = (n: number) =>
  Array.from({ length: n }, () => ({ disabled: false }))

describe('isListboxNavKey', () => {
  it('recognizes every key in LISTBOX_NAV_KEYS', () => {
    for (const key of LISTBOX_NAV_KEYS) {
      expect(isListboxNavKey(key)).toBe(true)
    }
  })

  it('rejects unrelated keys', () => {
    for (const key of ['Enter', 'Space', 'Tab', 'a', 'Escape', '']) {
      expect(isListboxNavKey(key)).toBe(false)
    }
  })
})

describe('nextListboxIndex', () => {
  it('returns null for empty item list', () => {
    expect(nextListboxIndex([], -1, 'ArrowDown')).toBeNull()
  })

  it('returns null for unhandled keys', () => {
    expect(nextListboxIndex(enabled(3), 0, 'Enter')).toBeNull()
    expect(nextListboxIndex(enabled(3), 0, 'Space')).toBeNull()
  })

  describe('ArrowDown', () => {
    it('moves forward by one', () => {
      expect(nextListboxIndex(enabled(3), 0, 'ArrowDown')).toBe(1)
      expect(nextListboxIndex(enabled(3), 1, 'ArrowDown')).toBe(2)
    })

    it('does not wrap past the end', () => {
      expect(nextListboxIndex(enabled(3), 2, 'ArrowDown')).toBeNull()
    })

    it('skips disabled items', () => {
      const items = [
        { disabled: false },
        { disabled: true },
        { disabled: true },
        { disabled: false },
      ]
      expect(nextListboxIndex(items, 0, 'ArrowDown')).toBe(3)
    })

    it('starts from -1 when nothing is active', () => {
      expect(nextListboxIndex(enabled(3), -1, 'ArrowDown')).toBe(0)
    })
  })

  describe('ArrowUp', () => {
    it('moves backward by one', () => {
      expect(nextListboxIndex(enabled(3), 2, 'ArrowUp')).toBe(1)
    })

    it('does not wrap past the start', () => {
      expect(nextListboxIndex(enabled(3), 0, 'ArrowUp')).toBeNull()
    })

    it('skips disabled items', () => {
      const items = [
        { disabled: false },
        { disabled: true },
        { disabled: true },
        { disabled: false },
      ]
      expect(nextListboxIndex(items, 3, 'ArrowUp')).toBe(0)
    })
  })

  describe('Home / End', () => {
    it('jumps to first / last enabled', () => {
      expect(nextListboxIndex(enabled(5), 2, 'Home')).toBe(0)
      expect(nextListboxIndex(enabled(5), 2, 'End')).toBe(4)
    })

    it('skips leading / trailing disabled items', () => {
      const items = [
        { disabled: true },
        { disabled: false },
        { disabled: false },
        { disabled: true },
      ]
      expect(nextListboxIndex(items, 0, 'Home')).toBe(1)
      expect(nextListboxIndex(items, 0, 'End')).toBe(2)
    })

    it('returns null when nothing is enabled', () => {
      const items = [{ disabled: true }, { disabled: true }]
      expect(nextListboxIndex(items, 0, 'Home')).toBeNull()
      expect(nextListboxIndex(items, 0, 'End')).toBeNull()
    })
  })

  describe('PageDown / PageUp', () => {
    it('jumps roughly a page forward / backward', () => {
      const items = enabled(25)
      expect(nextListboxIndex(items, 0, 'PageDown')).toBe(10)
      expect(nextListboxIndex(items, 20, 'PageUp')).toBe(10)
    })

    it('clamps to last / first', () => {
      const items = enabled(5)
      expect(nextListboxIndex(items, 0, 'PageDown')).toBe(4)
      expect(nextListboxIndex(items, 4, 'PageUp')).toBe(0)
    })

    it('falls back to nearest enabled when the page target is disabled', () => {
      const items = enabled(20).map((item, i) => ({
        ...item,
        disabled: i === 10,
      }))
      expect(nextListboxIndex(items, 0, 'PageDown')).toBe(9)
    })
  })
})

describe('isNavSkipped', () => {
  it('is true when the item is disabled', () => {
    expect(isNavSkipped({ disabled: true })).toBe(true)
  })

  it('is true when the item is inside a collapsed group', () => {
    expect(isNavSkipped({ skipped: true })).toBe(true)
  })

  it('is false for a plain enabled item', () => {
    expect(isNavSkipped({})).toBe(false)
    expect(isNavSkipped({ disabled: false, skipped: false })).toBe(false)
  })
})

describe('nextListboxIndex — collapsed-group skip', () => {
  it('skips items marked `skipped` (collapsed-group members)', () => {
    const items = [
      { disabled: false },
      { skipped: true },
      { skipped: true },
      { disabled: false },
    ]
    expect(nextListboxIndex(items, 0, 'ArrowDown')).toBe(3)
    expect(nextListboxIndex(items, 3, 'ArrowUp')).toBe(0)
  })

  it('Home / End skip a leading / trailing collapsed group', () => {
    const items = [
      { skipped: true },
      { disabled: false },
      { disabled: false },
      { skipped: true },
    ]
    expect(nextListboxIndex(items, 2, 'Home')).toBe(1)
    expect(nextListboxIndex(items, 0, 'End')).toBe(2)
  })

  it('treats `disabled` and `skipped` symmetrically', () => {
    const items = [
      { disabled: false },
      { disabled: true },
      { skipped: true },
      { disabled: false },
    ]
    expect(nextListboxIndex(items, 0, 'ArrowDown')).toBe(3)
  })
})

describe('isToggleKey', () => {
  it('recognizes the space bar', () => {
    expect(isToggleKey(' ')).toBe(true)
    expect(isToggleKey('Spacebar')).toBe(true)
  })

  it('rejects everything else', () => {
    for (const key of ['Enter', 'ArrowDown', 'a', 'Tab', '']) {
      expect(isToggleKey(key)).toBe(false)
    }
  })
})

describe('isActivationKey', () => {
  it('recognizes Enter', () => {
    expect(isActivationKey('Enter')).toBe(true)
  })

  it('rejects everything else', () => {
    for (const key of [' ', 'Spacebar', 'ArrowDown', 'a', '']) {
      expect(isActivationKey(key)).toBe(false)
    }
  })
})

describe('nextTypeaheadIndex', () => {
  const items = [
    { label: 'Apple', disabled: false },
    { label: 'Apricot', disabled: false },
    { label: 'Banana', disabled: false },
    { label: 'Cherry', disabled: true },
    { label: 'Coconut', disabled: false },
  ]

  it('returns null for empty query or empty list', () => {
    expect(nextTypeaheadIndex(items, 0, '')).toBeNull()
    expect(nextTypeaheadIndex([], 0, 'a')).toBeNull()
  })

  it('finds the first item starting with the query', () => {
    expect(nextTypeaheadIndex(items, -1, 'b')).toBe(2)
  })

  it('matches case-insensitively', () => {
    expect(nextTypeaheadIndex(items, -1, 'BAN')).toBe(2)
  })

  it('matches multi-char prefix', () => {
    expect(nextTypeaheadIndex(items, -1, 'Apri')).toBe(1)
  })

  it('advances on a repeated single-char query', () => {
    expect(nextTypeaheadIndex(items, 0, 'aa')).toBe(1)
  })

  it('wraps around past the end', () => {
    expect(nextTypeaheadIndex(items, 3, 'a')).toBe(0)
  })

  it('skips disabled items', () => {
    expect(nextTypeaheadIndex(items, 1, 'c')).toBe(4)
  })

  it('returns null when nothing matches', () => {
    expect(nextTypeaheadIndex(items, 0, 'z')).toBeNull()
  })
})
