import { afterEach, describe, expect, it, vi } from 'vitest'

import { GAME_CONFIG } from '../src/game/content'
import {
  buildRunSummary,
  buyGear,
  createNewGame,
  getDailyBankYield,
  getDebtCollectionChance,
  getFinalStretchPressure,
  getProjectedFinalScore,
  payPawnDebt,
  pawnGear,
  resolvePendingEncounter,
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

  it('ramps final-stretch pressure and collector risk near the end of a run', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const earlyState = {
      ...baseGame,
      day: 8,
      debt: GAME_CONFIG.debtCollectionThreshold + 1_000,
    }
    const lateState = {
      ...baseGame,
      day: 28,
      debt: GAME_CONFIG.debtCollectionThreshold + 1_000,
    }

    expect(getFinalStretchPressure(earlyState)).toBe(0)
    expect(getFinalStretchPressure(lateState)).toBeGreaterThan(0)
    expect(getDebtCollectionChance(lateState)).toBeGreaterThan(getDebtCollectionChance(earlyState))
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

  it('flags when the run enters the final stretch', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const state = {
      ...baseGame,
      day: 24,
    }

    const next = travelToCity(state, 'duluth')

    expect(next.day).toBe(25)
    expect(next.news.some((item) => item.text === DEFAULT_LOCALE.game.finalStretchReached)).toBe(true)
    expect(
      next.activity.some((item) => item.title === DEFAULT_LOCALE.game.finalStretchTitle),
    ).toBe(true)
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

    const fledBare = resolvePendingEncounter(bareResult, 'flee')
    const fledArmored = resolvePendingEncounter(armoredResult, 'flee')

    expect(bareResult.pendingEncounter?.kind).toBe('cop-stop')
    expect(armoredResult.pendingEncounter?.kind).toBe('cop-stop')
    expect(fledBare.health).toBe(92)
    expect(fledArmored.health).toBe(95)
    expect(fledArmored.health).toBeGreaterThan(fledBare.health)
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

  it('creates a pending cop-stop decision when a rough-stop encounter fires', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const state = {
      ...baseGame,
      currentCityId: 'duluth',
      cash: 0,
      inventory: Object.fromEntries(
        Object.keys(baseGame.inventory).map((drugId) => [drugId, 0]),
      ) as typeof baseGame.inventory,
    }

    mockRandomSequence([], 0)
    const next = travelToCity(state, 'lawrenceville')

    expect(next.pendingEncounter).toMatchObject({
      kind: 'cop-stop',
      cityId: 'lawrenceville',
      cityLabel: 'Lawrenceville',
    })
    expect(next.news[0]?.spotlight).toMatchObject({
      title: DEFAULT_LOCALE.game.copStopTitle,
      artKey: 'rough-stop',
      decision: {
        kind: 'cop-stop',
        choices: ['flee', 'fight', 'surrender'],
      },
    })
  })

  it('applies closeout penalties for unsold stash and injuries in the final score preview', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const state = {
      ...baseGame,
      health: 72,
      cash: 6_000,
      debt: 2_000,
      inventory: {
        ...baseGame.inventory,
        meth: 5,
      },
      market: {
        ...baseGame.market,
        meth: {
          drugId: 'meth' as const,
          available: true,
          price: 1_200,
          modifier: 'standard' as const,
        },
      },
    }

    const summary = buildRunSummary(state)

    expect(summary.netWorth).toBe(10_000)
    expect(summary.inventoryCloseoutPenalty).toBe(2_100)
    expect(summary.healthCloseoutPenalty).toBe(1_120)
    expect(summary.closeoutPenalty).toBe(3_220)
    expect(summary.score).toBe(6_780)
    expect(getProjectedFinalScore(state)).toBe(summary.score)
  })

  it('resolves pending cop-stop choices through the core rules', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const encounterState = {
      ...baseGame,
      currentCityId: 'lawrenceville',
      cash: 1_800,
      health: 100,
      pendingEncounter: {
        kind: 'cop-stop' as const,
        newsId: 42,
        cityId: 'lawrenceville',
        cityLabel: 'Lawrenceville',
        cashDemand: 640,
        baseDamage: 10,
      },
    }

    const fled = resolvePendingEncounter(encounterState, 'flee')
    const surrendered = resolvePendingEncounter(encounterState, 'surrender')

    mockRandomSequence([], 0)
    const wonFight = resolvePendingEncounter(
      {
        ...encounterState,
        gear: {
          ...encounterState.gear,
          'snub-nose': 1,
          'kevlar-vest': 1,
        },
      },
      'fight',
    )
    vi.restoreAllMocks()

    mockRandomSequence([], 0.999)
    const lostFight = resolvePendingEncounter(encounterState, 'fight')

    expect(fled.pendingEncounter).toBeNull()
    expect(fled.health).toBe(90)
    expect(surrendered.cash).toBe(1_160)
    expect(surrendered.health).toBe(100)
    expect(wonFight.health).toBe(99)
    expect(wonFight.cash).toBe(encounterState.cash)
    expect(wonFight.inventory).toEqual(encounterState.inventory)
    expect(lostFight.health).toBe(84)
    expect(lostFight.cash).toBe(1_480)
    expect(lostFight.inventory).toEqual(encounterState.inventory)
    expect(lostFight.news[0]?.text).toBe(DEFAULT_LOCALE.game.lostCopFightNews(320, 16))
  })

  it('lets stronger weapons swing marginal encounter fights', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const encounterState = {
      ...baseGame,
      currentCityId: 'lawrenceville',
      health: 100,
      pendingEncounter: {
        kind: 'cop-stop' as const,
        newsId: 77,
        cityId: 'lawrenceville',
        cityLabel: 'Lawrenceville',
        cashDemand: 640,
        baseDamage: 10,
      },
    }

    mockRandomSequence([], 0.3)
    const switchbladeFight = resolvePendingEncounter(
      {
        ...encounterState,
        gear: {
          ...encounterState.gear,
          switchblade: 1,
        },
      },
      'fight',
    )
    vi.restoreAllMocks()

    mockRandomSequence([], 0.3)
    const shotgunFight = resolvePendingEncounter(
      {
        ...encounterState,
        gear: {
          ...encounterState.gear,
          'pump-shotgun': 1,
        },
      },
      'fight',
    )

    expect(switchbladeFight.health).toBeLessThan(shotgunFight.health)
    expect(switchbladeFight.cash).toBeLessThan(shotgunFight.cash)
    expect(shotgunFight.news[0]?.text).toBe(DEFAULT_LOCALE.game.wonCopFightNews(1))
  })

  it('can seize stash when a cop fight goes bad', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const encounterState = {
      ...baseGame,
      currentCityId: 'lawrenceville',
      cash: 1_800,
      health: 100,
      inventory: {
        ...baseGame.inventory,
        meth: 10,
      },
      pendingEncounter: {
        kind: 'cop-stop' as const,
        newsId: 78,
        cityId: 'lawrenceville',
        cityLabel: 'Lawrenceville',
        cashDemand: 640,
        baseDamage: 10,
      },
    }

    mockRandomSequence([], 0.999)
    const lostFight = resolvePendingEncounter(encounterState, 'fight')

    expect(lostFight.inventory.meth).toBe(7)
    expect(lostFight.news[0]?.text).toBe(
      DEFAULT_LOCALE.game.lostCopFightNews(320, 16, 3, 'Meth'),
    )
  })

  it('still punishes surrender when the player cannot cover the full cop demand', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const brokeEncounter = {
      ...baseGame,
      cash: 0,
      health: 100,
      pendingEncounter: {
        kind: 'cop-stop' as const,
        newsId: 7,
        cityId: 'lawrenceville',
        cityLabel: 'Lawrenceville',
        cashDemand: 640,
        baseDamage: 10,
      },
    }

    const surrendered = resolvePendingEncounter(brokeEncounter, 'surrender')

    expect(surrendered.cash).toBe(0)
    expect(surrendered.health).toBe(98)
    expect(surrendered.pendingEncounter).toBeNull()
    expect(surrendered.news[0]?.text).toBe(
      DEFAULT_LOCALE.game.surrenderedCopStopNews(0, 2),
    )
  })

  it('creates a pending jacker ambush when traveling with stash on hand', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const state = {
      ...baseGame,
      currentCityId: 'duluth',
      inventory: {
        ...baseGame.inventory,
        meth: 10,
      },
    }

    mockRandomSequence([], 0)
    const next = travelToCity(state, 'lawrenceville')

    expect(next.pendingEncounter).toMatchObject({
      kind: 'jacker-ambush',
      cityId: 'lawrenceville',
      drugId: 'meth',
      drugLabel: 'Meth',
    })
    expect(next.news[0]?.spotlight).toMatchObject({
      title: DEFAULT_LOCALE.game.jackerAmbushTitle,
      artKey: 'jacker-ambush',
      decision: {
        kind: 'jacker-ambush',
        choices: ['flee', 'fight', 'surrender'],
      },
    })
  })

  it('resolves jacker ambush choices through stash and combat outcomes', () => {
    const randomSpy = mockRandomSequence([], 0.999)
    const baseGame = createNewGame('gwinnett-county')
    randomSpy.mockRestore()

    const encounterState = {
      ...baseGame,
      currentCityId: 'lawrenceville',
      health: 100,
      inventory: {
        ...baseGame.inventory,
        meth: 12,
      },
      pendingEncounter: {
        kind: 'jacker-ambush' as const,
        newsId: 55,
        cityId: 'lawrenceville',
        cityLabel: 'Lawrenceville',
        drugId: 'meth' as const,
        drugLabel: 'Meth',
        quantityDemand: 4,
        baseDamage: 9,
      },
    }

    const fled = resolvePendingEncounter(encounterState, 'flee')
    const surrendered = resolvePendingEncounter(encounterState, 'surrender')

    mockRandomSequence([], 0)
    const wonFight = resolvePendingEncounter(
      {
        ...encounterState,
        gear: {
          ...encounterState.gear,
          'snub-nose': 1,
          'kevlar-vest': 1,
        },
      },
      'fight',
    )
    vi.restoreAllMocks()

    mockRandomSequence([], 0.999)
    const lostFight = resolvePendingEncounter(encounterState, 'fight')

    expect(fled.pendingEncounter).toBeNull()
    expect(fled.health).toBe(91)
    expect(surrendered.inventory.meth).toBe(8)
    expect(wonFight.inventory.meth).toBe(12)
    expect(wonFight.health).toBe(99)
    expect(wonFight.cash).toBe(2_348)
    expect(lostFight.inventory.meth).toBe(8)
    expect(lostFight.health).toBe(87)
    expect(lostFight.news[0]?.text).toBe(
      DEFAULT_LOCALE.game.lostJackerFightNews(4, 'Meth', 13),
    )
    expect(wonFight.news[0]?.text).toBe(
      DEFAULT_LOCALE.game.wonJackerFightNews(1, 348),
    )
  })
})
