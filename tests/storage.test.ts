import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createNewGame } from '../src/game/core'
import {
  clearSavedGame,
  loadHighScores,
  loadSavedGame,
  loadSelectedContentPackId,
  recordHighScore,
  saveGame,
  saveSelectedContentPackId,
} from '../src/game/storage'
import type { GameState, HighScoreEntry } from '../src/game/types'

const SAVE_KEY = 'local-dope-wars.active-run.v1'
const HIGH_SCORES_KEY = 'local-dope-wars.high-scores.v1'

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

function makeHighScore(overrides: Partial<HighScoreEntry> = {}): HighScoreEntry {
  return {
    runId: 'run-1',
    contentPackId: 'gwinnett-county',
    contentLabel: 'Gwinnett County',
    day: 20,
    endDay: 30,
    cityId: 'lawrenceville',
    cityLabel: 'Lawrenceville',
    cash: 4_500,
    debt: 3_000,
    pawnDebt: 0,
    bankDeposit: 1_500,
    health: 92,
    inventoryValue: 2_800,
    gearValue: 0,
    stashUsed: 12,
    totalSpace: 100,
    score: 5_800,
    tierMessage: 'Still standing.',
    recordedAt: '2026-04-15T00:00:00.000Z',
    ...overrides,
  }
}

describe('storage regressions', () => {
  let localStorageMock: Storage

  beforeEach(() => {
    localStorageMock = createLocalStorageMock()
    vi.stubGlobal('window', {
      localStorage: localStorageMock,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('round-trips saved games with spotlight news and selected pack state', () => {
    const baseGame = createNewGame('atlanta-intown')
    const game: GameState = {
      ...baseGame,
      pawnDebt: 900,
      currentCityId: 'midtown',
      pendingEncounter: {
        kind: 'cop-stop',
        newsId: 99,
        cityId: 'midtown',
        cityLabel: 'Midtown',
        cashDemand: 450,
        baseDamage: 11,
      },
      news: [
        {
          id: 99,
          tone: 'encounter',
          text: 'Collectors are closing in.',
          spotlight: {
            tone: 'alert',
            title: 'Collection pressure hit',
            detail: 'Collectors clocked your route again.',
            artKey: 'collector',
            artLabel: 'Collectors',
          },
        },
        ...baseGame.news,
      ],
      newsCursor: 100,
    }

    saveGame(game)
    saveSelectedContentPackId('atlanta-intown')

    expect(loadSavedGame()).toEqual(game)
    expect(loadSelectedContentPackId()).toBe('atlanta-intown')
  })

  it('clears the saved run without disturbing other persisted state', () => {
    const game = createNewGame('gwinnett-county')

    saveGame(game)
    saveSelectedContentPackId('atlanta-intown')
    clearSavedGame()

    expect(loadSavedGame()).toBeNull()
    expect(loadSelectedContentPackId()).toBe('atlanta-intown')
  })

  it('normalizes older saves that predate pawn debt, gear, and pending encounters', () => {
    const game = createNewGame('gwinnett-county')
    const legacyGame = {
      ...game,
    } as GameState & {
      pawnDebt?: number
      gear?: GameState['gear']
      pendingEncounter?: GameState['pendingEncounter']
    }
    delete legacyGame.pawnDebt
    delete legacyGame.gear
    delete legacyGame.pendingEncounter

    localStorageMock.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        game: legacyGame,
      }),
    )

    expect(loadSavedGame()).toEqual({
      ...legacyGame,
      pawnDebt: 0,
      gear: Object.fromEntries(
        Object.keys(game.gear).map((gearId) => [gearId, 0]),
      ),
      pendingEncounter: null,
    })
  })

  it('normalizes and sorts stored high scores while dropping invalid entries', () => {
    const bestLegacyEntry = {
      ...makeHighScore({
        runId: 'legacy-run',
        score: 12_500,
        recordedAt: '2026-04-16T00:00:00.000Z',
      }),
    }
    delete (bestLegacyEntry as { pawnDebt?: number }).pawnDebt
    delete (bestLegacyEntry as { gearValue?: number }).gearValue

    localStorageMock.setItem(
      HIGH_SCORES_KEY,
      JSON.stringify([
        makeHighScore({
          runId: 'solid-run',
          score: 9_000,
          pawnDebt: 400,
          gearValue: 650,
          recordedAt: '2026-04-15T00:00:00.000Z',
        }),
        bestLegacyEntry,
        {
          ...makeHighScore({
            runId: 'bad-pack',
            contentPackId: 'unknown-pack',
          }),
        },
      ]),
    )

    expect(loadHighScores()).toEqual([
      {
        ...bestLegacyEntry,
        pawnDebt: 0,
        gearValue: 0,
      },
      makeHighScore({
        runId: 'solid-run',
        score: 9_000,
        pawnDebt: 400,
        gearValue: 650,
        recordedAt: '2026-04-15T00:00:00.000Z',
      }),
    ])
  })

  it('deduplicates high scores by run id when recording replacements', () => {
    localStorageMock.setItem(
      HIGH_SCORES_KEY,
      JSON.stringify([
        makeHighScore({
          runId: 'run-1',
          score: 3_200,
          recordedAt: '2026-04-14T00:00:00.000Z',
        }),
        makeHighScore({
          runId: 'run-2',
          score: 7_400,
          recordedAt: '2026-04-15T00:00:00.000Z',
        }),
      ]),
    )

    const nextScores = recordHighScore(
      makeHighScore({
        runId: 'run-1',
        score: 8_100,
        recordedAt: '2026-04-17T00:00:00.000Z',
      }),
    )

    expect(nextScores.map((entry) => [entry.runId, entry.score])).toEqual([
      ['run-1', 8_100],
      ['run-2', 7_400],
    ])
    expect(loadHighScores()).toEqual(nextScores)
  })
})
