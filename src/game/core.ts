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
  DrugId,
  GameState,
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
  entries: Array<{ tone: NewsTone; text: string }>,
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
    news?: Array<{ tone: NewsTone; text: string }>
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

function buildHeadline(trigger: MarketTrigger | undefined) {
  if (!trigger) {
    return undefined
  }

  return trigger.headline
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
  const bulletins: Array<{ tone: NewsTone; text: string }> = []

  for (const drug of content.drugs) {
    if (!activeIds.has(drug.id)) {
      continue
    }

    let min = drug.basePrice.min
    let max = drug.basePrice.max
    let modifier: MarketOffer['modifier'] = 'standard'
    let headline: string | undefined

    if (
      drug.cheap &&
      Math.random() < GAME_CONFIG.marketEventChance
    ) {
      min = drug.cheap.min
      max = drug.cheap.max
      modifier = 'cheap'
      headline = buildHeadline(drug.cheap)
    } else if (
      drug.expensive &&
      Math.random() < GAME_CONFIG.marketEventChance
    ) {
      min = drug.expensive.min
      max = drug.expensive.max
      modifier = 'expensive'
      headline = buildHeadline(drug.expensive)
    }

    market[drug.id] = {
      drugId: drug.id,
      available: true,
      price: randomInt(min, max),
      modifier,
    }

    if (headline) {
      bulletins.push({
        tone: 'market',
        text: headline,
      })
    }
  }

  return { market, bulletins }
}

export function createNewGame(contentPackId = GAME_CONFIG.defaultContentPackId): GameState {
  const content = getContentPack(contentPackId)
  const startingCityId =
    content.citiesById[GAME_CONFIG.startingCityId] ?
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

export function getMaxBorrowAmount(state: GameState) {
  return Math.max(GAME_CONFIG.maxDebt - state.debt, 0)
}

export function getNetWorth(state: GameState) {
  return state.cash + state.bankDeposit + getInventoryValue(state) - state.debt
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

  const content = getContentPack(state.contentPackId)
  const city = content.citiesById[cityId] ?? content.cities[0]
  const { market, bulletins } = buildMarket(state.contentPackId, cityId)
  const nextState: GameState = {
    ...state,
    currentCityId: cityId,
    day: state.day + 1,
    debt: Math.round(state.debt * GAME_CONFIG.dailyInterestRate),
    market,
  }

  return applyUpdates(nextState, {
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
      ...bulletins,
    ],
    activity: [
      createActivity(
        nextState,
        'travel',
        locale.game.movedToTitle(city.label),
        locale.game.movedToDetail(nextState.debt, nextState.day),
      ),
    ],
  })
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
