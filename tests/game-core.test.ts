import { afterEach, describe, expect, it, vi } from 'vitest'

import { GAME_CONFIG } from '../src/game/content'
import {
  createNewGame,
  getDailyBankYield,
  getDebtCollectionChance,
  travelToCity,
} from '../src/game/core'
import { DEFAULT_LOCALE } from '../src/game/i18n'

function mockRandomSequence(values: number[], fallback = 0.999) {
  let index = 0

  return vi.spyOn(Math, 'random').mockImplementation(() => {
    const nextValue = values[index]
    index += 1
    return nextValue ?? fallback
  })
}

describe('game core regressions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts new runs in the configured starting city for each bundled content pack', () => {
    const randomSpy = mockRandomSequence([], 0.999)

    const atlantaRun = createNewGame('atlanta-intown')
    const gwinnettRun = createNewGame('gwinnett-county')

    randomSpy.mockRestore()

    expect(atlantaRun.currentCityId).toBe('old-fourth-ward')
    expect(gwinnettRun.currentCityId).toBe('lawrenceville')
  })

  it('emits typed market events into the market and news feed', () => {
    mockRandomSequence([], 0)

    const game = createNewGame('gwinnett-county')

    expect(Object.values(game.market).some((offer) => offer.event)).toBe(true)
    expect(game.news.some((item) => item.tone === 'market')).toBe(true)
  })

  it('applies daily bank yield and debt growth when traveling', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const state = {
      ...baseGame,
      currentCityId: 'lawrenceville',
      bankDeposit: 5_000,
      debt: 10_000,
      health: GAME_CONFIG.maxHealth,
    }

    mockRandomSequence([], 0.999)
    const next = travelToCity(state, 'duluth')

    expect(getDailyBankYield(state)).toBe(100)
    expect(next.day).toBe(state.day + 1)
    expect(next.debt).toBe(11_000)
    expect(next.bankDeposit).toBe(5_100)
    expect(
      next.activity.some((item) =>
        item.title === DEFAULT_LOCALE.game.bankYieldTitle(100)),
    ).toBe(true)
  })

  it('raises collector risk above the debt threshold and can hit banked cash on travel', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const state = {
      ...baseGame,
      currentCityId: 'lawrenceville',
      debt: 20_000,
      bankDeposit: 4_000,
      cash: 2_000,
      health: 100,
    }

    expect(
      getDebtCollectionChance({
        ...state,
        debt: GAME_CONFIG.debtCollectionThreshold,
      }),
    ).toBe(0)
    expect(getDebtCollectionChance(state)).toBeGreaterThan(0)

    mockRandomSequence([], 0)
    const next = travelToCity(state, 'duluth')

    expect(next.bankDeposit).toBeLessThan(state.bankDeposit + getDailyBankYield(state))
    expect(
      next.activity.some((item) => item.title === DEFAULT_LOCALE.game.debtCollectionTitle),
    ).toBe(true)
  })

  it('blocks travel when the player is too hurt to move', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const state = {
      ...baseGame,
      currentCityId: 'lawrenceville',
      health: 0,
    }

    const next = travelToCity(state, 'duluth')

    expect(next.day).toBe(state.day)
    expect(next.currentCityId).toBe(state.currentCityId)
    expect(next.news[0]?.text).toBe(DEFAULT_LOCALE.game.tooHurtToMove)
  })
})
