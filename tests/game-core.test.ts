import { afterEach, describe, expect, it, vi } from 'vitest'

import { GAME_CONFIG } from '../src/game/content'
import {
  buyGear,
  createNewGame,
  getDailyBankYield,
  getDebtCollectionChance,
  payPawnDebt,
  pawnGear,
  takePawnAdvance,
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
    const spotlightBulletin = game.news.find((item) => item.tone === 'market' && item.spotlight)

    expect(Object.values(game.market).some((offer) => offer.event)).toBe(true)
    expect(game.news.some((item) => item.tone === 'market')).toBe(true)
    expect(spotlightBulletin?.spotlight).toMatchObject({
      tone: 'market',
    })
    expect(spotlightBulletin?.spotlight?.title).toEqual(expect.any(String))
    expect(spotlightBulletin?.spotlight?.detail).toEqual(expect.any(String))
    expect(spotlightBulletin?.spotlight?.artKey).toMatch(/^market-/)
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
    const collectionNews = next.news.find(
      (item) => item.spotlight?.artKey === 'collector',
    )

    expect(next.bankDeposit).toBeLessThan(state.bankDeposit + getDailyBankYield(state))
    expect(
      next.activity.some((item) => item.title === DEFAULT_LOCALE.game.debtCollectionTitle),
    ).toBe(true)
    expect(next.news.some((item) => item.spotlight?.artKey === 'collector')).toBe(true)
    expect(collectionNews?.spotlight).toMatchObject({
      tone: 'alert',
      title: DEFAULT_LOCALE.game.debtCollectionTitle,
      artKey: 'collector',
      artLabel: 'Collectors',
    })
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

  it('supports pawn advances with harsher debt pressure and repayment', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const pawned = takePawnAdvance(baseGame, 1_000)

    expect(pawned.cash).toBe(baseGame.cash + 1_000)
    expect(pawned.pawnDebt).toBe(1_350)

    mockRandomSequence([], 0.999)
    const traveled = travelToCity(
      {
        ...pawned,
        currentCityId: 'lawrenceville',
      },
      'duluth',
    )

    expect(traveled.pawnDebt).toBe(Math.round(1_350 * GAME_CONFIG.pawnDailyInterestRate))

    const repaid = payPawnDebt(
      {
        ...pawned,
        cash: 3_000,
      },
      500,
    )

    expect(repaid.cash).toBe(2_500)
    expect(repaid.pawnDebt).toBe(850)
  })

  it('rejects pawn advances when the fee would push pawn debt past the ceiling', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const nearLimit = {
      ...baseGame,
      pawnDebt: GAME_CONFIG.maxPawnDebt - 1,
    }

    const rejected = takePawnAdvance(nearLimit, 2)

    expect(rejected.cash).toBe(nearLimit.cash)
    expect(rejected.pawnDebt).toBe(nearLimit.pawnDebt)
    expect(rejected.news[0]?.text).toBe(DEFAULT_LOCALE.game.pawnTooHigh)
  })

  it('reduces rough-stop damage when defensive gear is equipped', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const bareState = {
      ...baseGame,
      currentCityId: 'duluth',
      cash: 0,
      inventory: Object.fromEntries(
        Object.keys(baseGame.inventory).map((drugId) => [drugId, 0]),
      ) as typeof baseGame.inventory,
      gear: {
        ...baseGame.gear,
        'kevlar-vest': 0,
      },
    }
    const armoredState = {
      ...bareState,
      gear: {
        ...bareState.gear,
        'kevlar-vest': 1,
      },
    }

    mockRandomSequence([], 0)
    const bareResult = travelToCity(bareState, 'lawrenceville')
    vi.restoreAllMocks()

    mockRandomSequence([], 0)
    const armoredResult = travelToCity(armoredState, 'lawrenceville')

    expect(bareResult.health).toBe(92)
    expect(armoredResult.health).toBe(95)
    expect(armoredResult.health).toBeGreaterThan(bareResult.health)
    expect(armoredResult.news[0]?.spotlight?.artKey).toBe('rough-stop')
  })

  it('pawns duplicate gear with diminishing returns', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const stocked = {
      ...baseGame,
      cash: 0,
      gear: {
        ...baseGame.gear,
        switchblade: 2,
      },
    }

    const firstPawn = pawnGear(stocked, 'switchblade')
    const secondPawn = pawnGear(firstPawn, 'switchblade')
    const rebought = buyGear(
      {
        ...baseGame,
        cash: 1_000,
      },
      'switchblade',
    )

    expect(firstPawn.cash).toBe(187)
    expect(secondPawn.cash - firstPawn.cash).toBe(260)
    expect(secondPawn.cash).toBe(447)
    expect(rebought.gear.switchblade).toBe(1)
    expect(rebought.cash).toBe(550)
  })
})
