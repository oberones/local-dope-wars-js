import {
  GAME_CONFIG,
  getContentPack,
} from './content'
import { DEFAULT_LOCALE } from './i18n'
import type {
  ActivityItem,
  ActivityKind,
  CityId,
  ContentPackId,
  DrugDefinition,
  DrugId,
  EventSpotlight,
  GameState,
  MarketEventDefinition,
  MarketOffer,
  MarketTrigger,
  NewsTone,
  RunSummary,
} from './types'

const locale = DEFAULT_LOCALE

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]

    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}

function createRunId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createInventoryRecord(drugIds: DrugId[]) {
  return drugIds.reduce(
    (inventory, drug) => {
      inventory[drug] = 0
      return inventory
    },
    {} as Record<DrugId, number>,
  )
}

function createMarketRecord(drugIds: DrugId[]) {
  return drugIds.reduce(
    (market, drugId) => {
      market[drugId] = {
        drugId,
        available: false,
        price: 0,
        modifier: 'standard',
      }
      return market
    },
    {} as Record<DrugId, MarketOffer>,
  )
}

function applyNews(
  state: GameState,
  entries: Array<{ tone: NewsTone; text: string; spotlight?: EventSpotlight }>,
) {
  if (entries.length === 0) {
    return state
  }

  const stamped = entries
    .map((entry, index) => ({
      ...entry,
      id: state.newsCursor + index,
    }))
    .reverse()

  return {
    ...state,
    newsCursor: state.newsCursor + stamped.length,
    news: [...stamped, ...state.news].slice(0, GAME_CONFIG.newsLimit),
  }
}

function applyActivity(
  state: GameState,
  entries: Array<Omit<ActivityItem, 'id'>>,
) {
  if (entries.length === 0) {
    return state
  }

  const stamped = entries
    .map((entry, index) => ({
      ...entry,
      id: state.activityCursor + index,
    }))
    .reverse()

  return {
    ...state,
    activityCursor: state.activityCursor + stamped.length,
    activity: [...stamped, ...state.activity].slice(0, GAME_CONFIG.activityLimit),
  }
}

function applyUpdates(
  state: GameState,
  updates: {
    news?: Array<{ tone: NewsTone; text: string; spotlight?: EventSpotlight }>
    activity?: Array<Omit<ActivityItem, 'id'>>
  },
) {
  const withNews = applyNews(state, updates.news ?? [])
  return applyActivity(withNews, updates.activity ?? [])
}

function createActivity(
  state: GameState,
  kind: ActivityKind,
  title: string,
  detail: string,
): Omit<ActivityItem, 'id'> {
  return {
    day: state.day,
    kind,
    title,
    detail,
  }
}

function createDefaultMarketEvent(
  trigger: MarketTrigger,
  kind: MarketEventDefinition['kind'],
  modifier: MarketEventDefinition['modifier'],
): MarketEventDefinition {
  return {
    ...trigger,
    kind,
    modifier,
  }
}

function getDrugMarketEvents(drug: DrugDefinition) {
  const events = [...(drug.marketEvents ?? [])]

  if (drug.cheap) {
    events.push(createDefaultMarketEvent(drug.cheap, 'flood', 'cheap'))
  }

  if (drug.expensive) {
    events.push(createDefaultMarketEvent(drug.expensive, 'shortage', 'expensive'))
  }

  return events
}

function selectDrugMarketEvent(drug: DrugDefinition) {
  for (const event of getDrugMarketEvents(drug)) {
    if (Math.random() < (event.chance ?? GAME_CONFIG.marketEventChance)) {
      return event
    }
  }

  return undefined
}

function getMarketEventSpotlight(event: MarketEventDefinition, drug: DrugDefinition, cityLabel: string) {
  const artKeyByKind: Record<MarketEventDefinition['kind'], EventSpotlight['artKey']> = {
    flood: 'market-flood',
    shortage: 'market-shortage',
    raid: 'market-raid',
    bust: 'market-bust',
    'lucky-break': 'market-lucky-break',
  }
  const artLabelByKind: Record<MarketEventDefinition['kind'], string> = {
    flood: `${drug.label} flood`,
    shortage: `${drug.label} shortage`,
    raid: `${drug.label} raid`,
    bust: `${drug.label} bust`,
    'lucky-break': `${drug.label} break`,
  }

  return {
    tone: 'market',
    title: locale.spotlight.marketEventTitle(drug.label, event.kind),
    detail: locale.spotlight.marketEventDetail(cityLabel, event.headline),
    artKey: artKeyByKind[event.kind],
    artLabel: artLabelByKind[event.kind],
  } satisfies EventSpotlight
}

function buildMarket(contentPackId: GameState['contentPackId'], cityId: CityId) {
  const content = getContentPack(contentPackId)
  const city = content.citiesById[cityId] ?? content.cities[0]
  const market = createMarketRecord(content.drugs.map((drug) => drug.id))
  const availableCount = randomInt(
    city.minDrugs,
    city.maxDrugs ?? content.drugs.length,
  )
  const activeIds = new Set(
    shuffle(content.drugs.map((drug) => drug.id)).slice(0, availableCount),
  )
  const bulletins: Array<{ tone: NewsTone; text: string; spotlight?: EventSpotlight }> = []

  for (const drug of content.drugs) {
    if (!activeIds.has(drug.id)) {
      continue
    }

    let min = drug.basePrice.min
    let max = drug.basePrice.max
    let modifier: MarketOffer['modifier'] = 'standard'
    const event = selectDrugMarketEvent(drug)

    if (event) {
      min = event.min
      max = event.max
      modifier = event.modifier
    }

    market[drug.id] = {
      drugId: drug.id,
      available: true,
      price: randomInt(min, max),
      modifier,
      event:
        event ?
          {
            kind: event.kind,
            headline: event.headline,
          }
        : undefined,
    }

    if (event) {
      bulletins.push({
        tone: 'market',
        text: event.headline,
        spotlight: getMarketEventSpotlight(event, drug, city.label),
      })
    }
  }

  return { market, bulletins }
}

export function createNewGame(
  contentPackId: ContentPackId = GAME_CONFIG.defaultContentPackId,
): GameState {
  const content = getContentPack(contentPackId)
  const startingCityId =
    content.startingCityId && content.citiesById[content.startingCityId] ?
      content.startingCityId
    : content.citiesById[GAME_CONFIG.startingCityId] ?
      GAME_CONFIG.startingCityId
    : content.cities[0]?.id

  if (!startingCityId) {
    throw new Error(`Content pack "${content.id}" has no cities.`)
  }

  const { market, bulletins } = buildMarket(content.id, startingCityId)
  const initialState: GameState = {
    runId: createRunId(),
    createdAt: new Date().toISOString(),
    contentPackId: content.id,
    day: 1,
    endDay: GAME_CONFIG.endDay,
    debt: GAME_CONFIG.startingDebt,
    pawnDebt: GAME_CONFIG.startingPawnDebt,
    bankDeposit: 0,
    stoneLevel: 0,
    health: GAME_CONFIG.maxHealth,
    totalSpace: GAME_CONFIG.totalSpace,
    cash: GAME_CONFIG.startingCash,
    currentCityId: startingCityId,
    inventory: createInventoryRecord(content.drugs.map((drug) => drug.id)),
    market,
    news: [],
    newsCursor: 0,
    activity: [],
    activityCursor: 0,
  }

  return applyUpdates(initialState, {
    news: [
      {
        tone: 'system',
        text: locale.game.startingHeadline(
          content.citiesById[startingCityId]?.label ?? startingCityId,
        ),
      },
      ...bulletins,
    ],
    activity: [
      createActivity(
        initialState,
        'run',
        locale.game.runStartedTitle,
        locale.game.runStarted(
          content.shortLabel,
          initialState.cash,
          initialState.debt,
        ),
      ),
    ],
  })
}

export function getCurrentCity(state: GameState) {
  const content = getContentPack(state.contentPackId)
  return content.citiesById[state.currentCityId] ?? content.cities[0]
}

export function getUsedSpace(state: GameState) {
  return Object.values(state.inventory).reduce(
    (used, quantity) => used + quantity,
    0,
  )
}

export function getAvailableSpace(state: GameState) {
  return state.totalSpace - getUsedSpace(state)
}

function getLargestInventoryHolding(state: GameState) {
  const content = getContentPack(state.contentPackId)

  return content.drugs.reduce<{
    drugId: DrugId | null
    label: string
    quantity: number
  }>(
    (leader, drug) => {
      const quantity = state.inventory[drug.id]

      if (quantity > leader.quantity) {
        return {
          drugId: drug.id,
          label: drug.label,
          quantity,
        }
      }

      return leader
    },
    {
      drugId: null,
      label: '',
      quantity: 0,
    },
  )
}

function getTravelEncounterChance(cops: number) {
  return Math.min(
    GAME_CONFIG.travelEncounterBaseChance + cops * GAME_CONFIG.travelEncounterHeatFactor,
    GAME_CONFIG.travelEncounterMaxChance,
  )
}

export function getDailyBankYield(state: GameState) {
  if (state.bankDeposit <= 0) {
    return 0
  }

  return Math.max(
    Math.round(state.bankDeposit * GAME_CONFIG.bankDailyYieldRate) - state.bankDeposit,
    0,
  )
}

export function getDebtCollectionChance(state: GameState) {
  if (state.debt <= GAME_CONFIG.debtCollectionThreshold) {
    return 0
  }

  return Math.min(
    GAME_CONFIG.debtCollectionBaseChance +
      (state.debt - GAME_CONFIG.debtCollectionThreshold) /
        GAME_CONFIG.debtCollectionDebtChanceDivisor,
    GAME_CONFIG.debtCollectionMaxChance,
  )
}

function resolveDebtCollection(state: GameState, city: ReturnType<typeof getCurrentCity>) {
  const collectionChance = getDebtCollectionChance(state)

  if (collectionChance <= 0 || Math.random() >= collectionChance) {
    return state
  }

  const debtOverage = Math.max(state.debt - GAME_CONFIG.debtCollectionThreshold, 0)
  const target = Math.max(
    GAME_CONFIG.debtCollectionMinTake,
    Math.round(
      state.debt *
        (GAME_CONFIG.debtCollectionBaseShare +
          debtOverage / GAME_CONFIG.debtCollectionDebtShareDivisor),
    ),
  )
  const bankTaken = Math.min(
    state.bankDeposit,
    Math.round(target * GAME_CONFIG.debtCollectionBankTakeShare),
  )
  const cashTaken = Math.min(state.cash, target - bankTaken)
  const uncovered = Math.max(target - bankTaken - cashTaken, 0)
  const healthLoss =
    uncovered > 0 ?
      Math.min(
        state.health,
        randomInt(
          GAME_CONFIG.debtCollectionDamageMin,
          GAME_CONFIG.debtCollectionDamageMax,
        ),
      )
    : 0
  const totalTaken = bankTaken + cashTaken
  const nextState: GameState = {
    ...state,
    bankDeposit: state.bankDeposit - bankTaken,
    cash: state.cash - cashTaken,
    health: Math.max(state.health - healthLoss, 0),
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'alert',
        text: locale.game.debtCollectionNews(totalTaken, healthLoss),
        spotlight: {
          tone: 'alert',
          title: locale.game.debtCollectionTitle,
          detail: locale.game.debtCollectionDetail(
            city.label,
            bankTaken,
            cashTaken,
            nextState.health,
          ),
          artKey: 'collector',
          artLabel: 'Collectors',
        },
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.debtCollectionTitle,
        locale.game.debtCollectionDetail(city.label, bankTaken, cashTaken, nextState.health),
      ),
    ],
  })
}

function resolveTravelEncounter(state: GameState, city: ReturnType<typeof getCurrentCity>) {
  if (Math.random() >= getTravelEncounterChance(city.cops)) {
    return state
  }

  const largestHolding = getLargestInventoryHolding(state)
  const canTriggerLuckyBreak =
    city.cops < GAME_CONFIG.travelEncounterLuckyBreakMaxCops &&
    Math.random() < GAME_CONFIG.travelEncounterLuckyBreakChance

  if (canTriggerLuckyBreak) {
    const bonus = randomInt(
      GAME_CONFIG.travelEncounterLuckyBreakCashBonus.min,
      GAME_CONFIG.travelEncounterLuckyBreakCashBonus.max,
    )
    const nextState: GameState = {
      ...state,
      cash: state.cash + bonus,
    }

    return applyUpdates(nextState, {
      news: [
        {
          tone: 'encounter',
          text: locale.game.luckyBreakNews(bonus),
          spotlight: {
            tone: 'encounter',
            title: locale.game.luckyBreakTitle,
            detail: locale.game.luckyBreakDetail(city.label, bonus),
            artKey: 'lucky-break',
            artLabel: 'Cash drop',
          },
        },
      ],
      activity: [
        createActivity(
          nextState,
          'encounter',
          locale.game.luckyBreakTitle,
          locale.game.luckyBreakDetail(city.label, bonus),
        ),
      ],
    })
  }

  if (largestHolding.drugId && Math.random() < GAME_CONFIG.travelEncounterStashSweepChance) {
    const seizedQuantity = Math.min(
      largestHolding.quantity,
      Math.max(
        1,
        Math.round(
          largestHolding.quantity *
            (GAME_CONFIG.travelEncounterStashSweepBaseShare +
              city.cops / GAME_CONFIG.travelEncounterStashSweepHeatDivisor),
        ),
      ),
    )
    const nextState: GameState = {
      ...state,
      inventory: {
        ...state.inventory,
        [largestHolding.drugId]: state.inventory[largestHolding.drugId] - seizedQuantity,
      },
    }

    return applyUpdates(nextState, {
      news: [
        {
          tone: 'encounter',
          text: locale.game.stashSweepNews(seizedQuantity, largestHolding.label),
          spotlight: {
            tone: 'encounter',
            title: locale.game.stashSweepTitle(seizedQuantity, largestHolding.label),
            detail: locale.game.stashSweepDetail(city.label),
            artKey: 'stash-sweep',
            artLabel: `${largestHolding.label} seized`,
          },
        },
      ],
      activity: [
        createActivity(
          nextState,
          'encounter',
          locale.game.stashSweepTitle(seizedQuantity, largestHolding.label),
          locale.game.stashSweepDetail(city.label),
        ),
      ],
    })
  }

  if (state.cash > 0 && Math.random() < GAME_CONFIG.travelEncounterShakedownChance) {
    const cashTaken = Math.min(
      state.cash,
      Math.max(
        1,
        Math.round(
          state.cash *
            (GAME_CONFIG.travelEncounterShakedownBaseShare +
              city.cops / GAME_CONFIG.travelEncounterShakedownHeatDivisor),
        ),
      ),
    )
    const nextState: GameState = {
      ...state,
      cash: state.cash - cashTaken,
    }

    return applyUpdates(nextState, {
      news: [
        {
          tone: 'encounter',
          text: locale.game.shakedownNews(cashTaken),
          spotlight: {
            tone: 'encounter',
            title: locale.game.shakedownTitle,
            detail: locale.game.shakedownDetail(city.label, cashTaken),
            artKey: 'shakedown',
            artLabel: 'Cash shakedown',
          },
        },
      ],
      activity: [
        createActivity(
          nextState,
          'encounter',
          locale.game.shakedownTitle,
          locale.game.shakedownDetail(city.label, cashTaken),
        ),
      ],
    })
  }

  const damage = Math.min(
    state.health,
    randomInt(
      GAME_CONFIG.travelEncounterDamageMin,
      GAME_CONFIG.travelEncounterDamageMaxBase +
        Math.round(city.cops / GAME_CONFIG.travelEncounterDamageHeatDivisor),
    ),
  )
  const nextState: GameState = {
    ...state,
    health: Math.max(state.health - damage, 0),
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'encounter',
        text: locale.game.roughRideNews(damage),
        spotlight: {
          tone: 'encounter',
          title: locale.game.roughRideTitle,
          detail: locale.game.roughRideDetail(city.label, nextState.health),
          artKey: 'rough-stop',
          artLabel: 'Rough stop',
        },
      },
    ],
    activity: [
      createActivity(
        nextState,
        'encounter',
        locale.game.roughRideTitle,
        locale.game.roughRideDetail(city.label, nextState.health),
      ),
    ],
  })
}

export function getInventoryValue(state: GameState) {
  const content = getContentPack(state.contentPackId)

  return content.drugs.reduce((total, drug) => {
    const offer = state.market[drug.id]

    if (!offer.available) {
      return total
    }

    return total + state.inventory[drug.id] * offer.price
  }, 0)
}

export function getMaxBuyQuantity(state: GameState, drugId: DrugId) {
  const offer = state.market[drugId]

  if (!offer.available) {
    return 0
  }

  return Math.min(
    getAvailableSpace(state),
    Math.floor(state.cash / offer.price),
  )
}

export function getMaxSellQuantity(state: GameState, drugId: DrugId) {
  if (!state.market[drugId].available) {
    return 0
  }

  return state.inventory[drugId]
}

export function getMaxDepositAmount(state: GameState) {
  return state.cash
}

export function getMaxWithdrawAmount(state: GameState) {
  return state.bankDeposit
}

export function getMaxDebtPayment(state: GameState) {
  return Math.min(state.cash, state.debt)
}

export function getMaxPawnRepayment(state: GameState) {
  return Math.min(state.cash, state.pawnDebt)
}

export function getMaxBorrowAmount(state: GameState) {
  return Math.max(GAME_CONFIG.maxDebt - state.debt, 0)
}

function getPawnCharge(amount: number) {
  return Math.round(amount * GAME_CONFIG.pawnAdvanceFeeRate)
}

export function getMaxPawnAdvanceAmount(state: GameState) {
  const remainingHeadroom = Math.max(GAME_CONFIG.maxPawnDebt - state.pawnDebt, 0)

  if (remainingHeadroom <= 0) {
    return 0
  }

  let maxPrincipal = Math.floor(
    remainingHeadroom / GAME_CONFIG.pawnAdvanceFeeRate,
  )

  while (maxPrincipal > 0 && getPawnCharge(maxPrincipal) > remainingHeadroom) {
    maxPrincipal -= 1
  }

  while (getPawnCharge(maxPrincipal + 1) <= remainingHeadroom) {
    maxPrincipal += 1
  }

  return maxPrincipal
}

export function getMaxHealthRecoveryAmount(state: GameState) {
  const missingHealth = Math.max(GAME_CONFIG.maxHealth - state.health, 0)

  return Math.min(
    missingHealth,
    GAME_CONFIG.maxHealthRecoveryPerVisit,
    Math.floor(state.cash / GAME_CONFIG.healthRecoveryCostPerPoint),
  )
}

export function getHealthRecoveryCost(state: GameState) {
  return getMaxHealthRecoveryAmount(state) * GAME_CONFIG.healthRecoveryCostPerPoint
}

export function getNetWorth(state: GameState) {
  return (
    state.cash +
    state.bankDeposit +
    getInventoryValue(state) -
    state.debt -
    state.pawnDebt
  )
}

export function getScoreTier(
  score: number,
  contentPackId: ContentPackId = GAME_CONFIG.defaultContentPackId,
) {
  const content = getContentPack(contentPackId)

  return (
    content.scoreTiers.find((tier) => score >= tier.threshold) ??
    content.scoreTiers[content.scoreTiers.length - 1]
  )
}

export function buildRunSummary(state: GameState): RunSummary {
  const score = getNetWorth(state)
  const content = getContentPack(state.contentPackId)

  return {
    runId: state.runId,
    contentPackId: state.contentPackId,
    contentLabel: content.label,
    day: state.day,
    endDay: state.endDay,
    cityId: state.currentCityId,
    cityLabel: getCurrentCity(state).label,
    cash: state.cash,
    debt: state.debt,
    pawnDebt: state.pawnDebt,
    bankDeposit: state.bankDeposit,
    health: state.health,
    inventoryValue: getInventoryValue(state),
    stashUsed: getUsedSpace(state),
    totalSpace: state.totalSpace,
    score,
    tierMessage: getScoreTier(score, state.contentPackId).message,
  }
}

export function isRunOver(state: GameState) {
  return state.day >= state.endDay
}

export function travelToCity(state: GameState, cityId: CityId) {
  if (cityId === state.currentCityId) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'system',
          text: locale.game.alreadyWorking(getCurrentCity(state).label),
        },
      ],
    })
  }

  if (isRunOver(state)) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.runClockSpent,
        },
      ],
    })
  }

  if (state.health <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.tooHurtToMove,
        },
      ],
    })
  }

  const content = getContentPack(state.contentPackId)
  const city = content.citiesById[cityId] ?? content.cities[0]
  const { market, bulletins } = buildMarket(state.contentPackId, cityId)
  const bankYield = getDailyBankYield(state)
  const nextState: GameState = {
    ...state,
    currentCityId: cityId,
    day: state.day + 1,
    debt: Math.round(state.debt * GAME_CONFIG.dailyInterestRate),
    pawnDebt: Math.round(state.pawnDebt * GAME_CONFIG.pawnDailyInterestRate),
    bankDeposit: state.bankDeposit + bankYield,
    market,
  }

  const traveledState = applyUpdates(nextState, {
    news: [
      {
        tone: 'move',
        text: locale.game.shiftedOperations(city.label, city.cops),
      },
      ...(nextState.day >= nextState.endDay
        ? [
            {
              tone: 'alert' as const,
              text: locale.game.finalDayReached,
            },
          ]
        : []),
      ...(bankYield > 0
        ? [
            {
              tone: 'system' as const,
              text: locale.game.bankYieldNews(bankYield),
            },
          ]
        : []),
      ...bulletins,
    ],
    activity: [
      createActivity(
        nextState,
        'travel',
        locale.game.movedToTitle(city.label),
        locale.game.movedToDetail(nextState.debt, nextState.day),
      ),
      ...(bankYield > 0
        ? [
            createActivity(
              nextState,
              'finance',
              locale.game.bankYieldTitle(bankYield),
              locale.game.bankYieldDetail(nextState.bankDeposit),
            ),
          ]
        : []),
    ],
  })

  const financedState = resolveDebtCollection(traveledState, city)

  return resolveTravelEncounter(financedState, city)
}

export function buyDrug(
  state: GameState,
  drugId: DrugId,
  quantity: number,
) {
  if (quantity <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.buyQuantityRequired,
        },
      ],
    })
  }

  const offer = state.market[drugId]
  const content = getContentPack(state.contentPackId)
  const drug = content.drugsById[drugId]

  if (!offer.available) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.dryMarket(
            drug.label,
            getCurrentCity(state).label,
          ),
        },
      ],
    })
  }

  if (quantity > getAvailableSpace(state)) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.needMoreStashSpace,
        },
      ],
    })
  }

  const total = offer.price * quantity

  if (total > state.cash) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.notEnoughCash,
        },
      ],
    })
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash - total,
    inventory: {
      ...state.inventory,
      [drugId]: state.inventory[drugId] + quantity,
    },
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'market',
        text: locale.game.boughtNews(quantity, drug.label, offer.price),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'trade',
        locale.game.boughtTitle(quantity, drug.label),
        locale.game.boughtDetail(total, getCurrentCity(nextState).label),
      ),
    ],
  })
}

export function sellDrug(
  state: GameState,
  drugId: DrugId,
  quantity: number,
) {
  if (quantity <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.sellQuantityRequired,
        },
      ],
    })
  }

  const offer = state.market[drugId]
  const content = getContentPack(state.contentPackId)
  const drug = content.drugsById[drugId]

  if (!offer.available) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.notMoving(
            drug.label,
            getCurrentCity(state).label,
          ),
        },
      ],
    })
  }

  if (state.inventory[drugId] < quantity) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.doNotOwn(quantity, drug.label),
        },
      ],
    })
  }

  const total = offer.price * quantity
  const nextState: GameState = {
    ...state,
    cash: state.cash + total,
    inventory: {
      ...state.inventory,
      [drugId]: state.inventory[drugId] - quantity,
    },
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'market',
        text: locale.game.soldNews(quantity, drug.label, offer.price),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'trade',
        locale.game.soldTitle(quantity, drug.label),
        locale.game.soldDetail(total, getCurrentCity(nextState).label),
      ),
    ],
  })
}

export function depositCash(state: GameState, amount: number) {
  if (amount <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.depositAmountRequired,
        },
      ],
    })
  }

  const maxDeposit = getMaxDepositAmount(state)

  if (amount > maxDeposit) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.depositTooHigh,
        },
      ],
    })
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash - amount,
    bankDeposit: state.bankDeposit + amount,
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.depositedNews(amount),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.depositedTitle(amount),
        locale.game.depositedDetail(nextState.bankDeposit),
      ),
    ],
  })
}

export function withdrawCash(state: GameState, amount: number) {
  if (amount <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.withdrawAmountRequired,
        },
      ],
    })
  }

  const maxWithdraw = getMaxWithdrawAmount(state)

  if (amount > maxWithdraw) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.withdrawTooHigh,
        },
      ],
    })
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash + amount,
    bankDeposit: state.bankDeposit - amount,
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.withdrewNews(amount),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.withdrewTitle(amount),
        locale.game.withdrewDetail(nextState.cash),
      ),
    ],
  })
}

export function payDebt(state: GameState, amount: number) {
  if (amount <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.paymentAmountRequired,
        },
      ],
    })
  }

  const maxPayment = getMaxDebtPayment(state)

  if (amount > maxPayment) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.paymentTooHigh,
        },
      ],
    })
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash - amount,
    debt: state.debt - amount,
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.paidDebtNews(amount),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.paidDebtTitle(amount),
        locale.game.paidDebtDetail(nextState.debt),
      ),
    ],
  })
}

export function borrowMoney(state: GameState, amount: number) {
  if (amount <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.borrowAmountRequired,
        },
      ],
    })
  }

  const maxBorrow = getMaxBorrowAmount(state)

  if (maxBorrow <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.noCreditAvailable,
        },
      ],
    })
  }

  if (amount > maxBorrow) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.borrowTooHigh,
        },
      ],
    })
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash + amount,
    debt: state.debt + amount,
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.borrowedNews(amount),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.borrowedTitle(amount),
        locale.game.borrowedDetail(nextState.cash, nextState.debt),
      ),
    ],
  })
}

export function takePawnAdvance(state: GameState, amount: number) {
  if (amount <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.pawnAmountRequired,
        },
      ],
    })
  }

  const maxPawnAdvance = getMaxPawnAdvanceAmount(state)

  if (maxPawnAdvance <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.noPawnRoom,
        },
      ],
    })
  }

  if (amount > maxPawnAdvance) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.pawnTooHigh,
        },
      ],
    })
  }

  const pawnCharge = getPawnCharge(amount)

  if (state.pawnDebt + pawnCharge > GAME_CONFIG.maxPawnDebt) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.pawnTooHigh,
        },
      ],
    })
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash + amount,
    pawnDebt: state.pawnDebt + pawnCharge,
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.pawnedNews(amount, pawnCharge),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.pawnedTitle(amount),
        locale.game.pawnedDetail(nextState.cash, nextState.pawnDebt),
      ),
    ],
  })
}

export function payPawnDebt(state: GameState, amount: number) {
  if (amount <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.payPawnAmountRequired,
        },
      ],
    })
  }

  const maxPayment = getMaxPawnRepayment(state)

  if (amount > maxPayment) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.payPawnTooHigh,
        },
      ],
    })
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash - amount,
    pawnDebt: state.pawnDebt - amount,
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.repaidPawnNews(amount),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.repaidPawnTitle(amount),
        locale.game.repaidPawnDetail(nextState.pawnDebt),
      ),
    ],
  })
}

export function recoverHealth(state: GameState) {
  const missingHealth = Math.max(GAME_CONFIG.maxHealth - state.health, 0)

  if (missingHealth <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.noRecoveryNeeded,
        },
      ],
    })
  }

  const healthRecovered = getMaxHealthRecoveryAmount(state)

  if (healthRecovered <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.noRecoveryCash,
        },
      ],
    })
  }

  const recoveryCost = healthRecovered * GAME_CONFIG.healthRecoveryCostPerPoint
  const nextState: GameState = {
    ...state,
    cash: state.cash - recoveryCost,
    health: Math.min(state.health + healthRecovered, GAME_CONFIG.maxHealth),
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.recoveredHealthNews(healthRecovered, recoveryCost),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.recoveredHealthTitle(healthRecovered),
        locale.game.recoveredHealthDetail(nextState.health),
      ),
    ],
  })
}
