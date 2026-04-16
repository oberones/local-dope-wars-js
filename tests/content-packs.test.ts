import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SAVANNAH_PACK } from './fixtures/content-packs'

function createLocalStorageMock() {
  const store = new Map<string, string>()

  return {
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    get length() {
      return store.size
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  } satisfies Storage
}

describe('content pack registry', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
    })
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('imports a custom pack and reloads it from browser storage', async () => {
    const content = await import('../src/game/content')

    content.importCustomContentPack(SAVANNAH_PACK)

    expect(content.hasContentPack('savannah-nights')).toBe(true)
    expect(content.getContentPack('savannah-nights').startingCityId).toBe('starland')
    expect(content.listContentPacks().some((pack) => pack.id === 'savannah-nights')).toBe(true)

    vi.resetModules()

    const reloadedContent = await import('../src/game/content')

    expect(reloadedContent.hasContentPack('savannah-nights')).toBe(true)
    expect(reloadedContent.getContentPack('savannah-nights').label).toBe('Savannah Nights')
  })

  it('rejects imported packs that try to overwrite a built-in id', async () => {
    const content = await import('../src/game/content')

    expect(() =>
      content.importCustomContentPack({
        ...SAVANNAH_PACK,
        id: 'gwinnett-county',
      }),
    ).toThrowError(/reserved by a built-in content pack/i)
  })

  it('rejects malformed optional arrays instead of silently dropping them', async () => {
    const content = await import('../src/game/content')

    expect(() =>
      content.importCustomContentPack({
        ...SAVANNAH_PACK,
        id: 'savannah-bad-events',
        drugs: [
          {
            ...SAVANNAH_PACK.drugs[0],
            marketEvents: 'not-an-array',
          },
        ],
      }),
    ).toThrowError(/marketEvents must be an array/i)
  })

  it('rejects non-hex accent colors for imported packs', async () => {
    const content = await import('../src/game/content')

    expect(() =>
      content.importCustomContentPack({
        ...SAVANNAH_PACK,
        accent: 'rgb(20, 184, 166)',
      }),
    ).toThrowError(/must use a 6-digit hex color/i)
  })

  it('returns a defensive copy of the registered pack list', async () => {
    const content = await import('../src/game/content')

    const snapshot = content.listContentPacks()

    snapshot.push(SAVANNAH_PACK as (typeof snapshot)[number])

    expect(content.listContentPacks().some((pack) => pack.id === 'savannah-nights')).toBe(false)
  })
})
