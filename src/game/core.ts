import {
  CITIES_BY_ID,
  DRUGS,
  DRUGS_BY_ID,
  GAME_CONFIG,
  SCORE_TIERS,
} from './content'
import type {
  ActivityItem,
  ActivityKind,
  CityId,
  DrugId,
  GameState,
  MarketOffer,
  MarketTrigger,
  NewsTone,
  RunSummary,
} from './types'

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

function formatMoney(value: number) {
  const absolute = Math.abs(value).toLocaleString()
  return value < 0 ? `-$${absolute}` : `$${absolute}`
}

function createRunId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createInventoryRecord() {
  return DRUGS.reduce(
    (inventory, drug) => {
      inventory[drug.id] = 0
      return inventory
    },
    {} as Record<DrugId, number>,
  )
}

function createMarketRecord() {
  return DRUGS.reduce(
    (market, drug) => {
      market[drug.id] = {
        drugId: drug.id,
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

function buildMarket(cityId: CityId) {
  const city = CITIES_BY_ID[cityId]
  const market = createMarketRecord()
  const availableCount = randomInt(
    city.minDrugs,
    city.maxDrugs ?? DRUGS.length,
  )
  const activeIds = new Set(
    shuffle(DRUGS.map((drug) => drug.id)).slice(0, availableCount),
  )
  const bulletins: Array<{ tone: NewsTone; text: string }> = []

  for (const drug of DRUGS) {
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

export function createNewGame(): GameState {
  const { market, bulletins } = buildMarket(GAME_CONFIG.startingCityId)
  const initialState: GameState = {
    runId: createRunId(),
    createdAt: new Date().toISOString(),
    day: 1,
    endDay: GAME_CONFIG.endDay,
    debt: GAME_CONFIG.startingDebt,
    bankDeposit: 0,
    stoneLevel: 0,
    health: GAME_CONFIG.maxHealth,
    totalSpace: GAME_CONFIG.totalSpace,
    cash: GAME_CONFIG.startingCash,
    currentCityId: GAME_CONFIG.startingCityId,
    inventory: createInventoryRecord(),
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
        text: 'Fresh off the curb in Lawrenceville. Thirty days to stack cash.',
      },
      ...bulletins,
    ],
    activity: [
      createActivity(
        initialState,
        'run',
        'Run started',
        `Opened the Gwinnett run with ${formatMoney(initialState.cash)} cash and ${formatMoney(initialState.debt)} in debt.`,
      ),
    ],
  })
}

export function getCurrentCity(state: GameState) {
  return CITIES_BY_ID[state.currentCityId]
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
  return DRUGS.reduce((total, drug) => {
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

export function getScoreTier(score: number) {
  return (
    SCORE_TIERS.find((tier) => score >= tier.threshold) ??
    SCORE_TIERS[SCORE_TIERS.length - 1]
  )
}

export function buildRunSummary(state: GameState): RunSummary {
  const score = getNetWorth(state)

  return {
    runId: state.runId,
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
    tierMessage: getScoreTier(score).message,
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
          text: `You are already working ${getCurrentCity(state).label}.`,
        },
      ],
    })
  }

  if (isRunOver(state)) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: 'The run clock is spent. Settle inventory, work the bank, and close the books.',
        },
      ],
    })
  }

  const city = CITIES_BY_ID[cityId]
  const { market, bulletins } = buildMarket(cityId)
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
        text: `Shifted operations to ${city.label}. Street heat is running ${city.cops}%.`,
      },
      ...(nextState.day >= nextState.endDay
        ? [
            {
              tone: 'alert' as const,
              text: 'Final day reached. Sell off, settle your money, and finalize the run when ready.',
            },
          ]
        : []),
      ...bulletins,
    ],
    activity: [
      createActivity(
        nextState,
        'travel',
        `Moved to ${city.label}`,
        `Debt rolled to ${formatMoney(nextState.debt)} and the market reset for day ${nextState.day}.`,
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
          text: 'Set a quantity higher than zero before you buy.',
        },
      ],
    })
  }

  const offer = state.market[drugId]
  const drug = DRUGS_BY_ID[drugId]

  if (!offer.available) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: `${drug.label} is dry in ${getCurrentCity(state).label} today.`,
        },
      ],
    })
  }

  if (quantity > getAvailableSpace(state)) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: 'You need more stash space.',
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
          text: 'You do not have enough cash for that pickup.',
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
        text: `Bought ${quantity} ${drug.label} at ${formatMoney(offer.price)} each.`,
      },
    ],
    activity: [
      createActivity(
        nextState,
        'trade',
        `Bought ${quantity} ${drug.label}`,
        `Spent ${formatMoney(total)} in ${getCurrentCity(nextState).label}.`,
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
          text: 'Set a quantity higher than zero before you sell.',
        },
      ],
    })
  }

  const offer = state.market[drugId]
  const drug = DRUGS_BY_ID[drugId]

  if (!offer.available) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: `${drug.label} is not moving in ${getCurrentCity(state).label} today.`,
        },
      ],
    })
  }

  if (state.inventory[drugId] < quantity) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: `You do not own ${quantity} ${drug.label}.`,
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
        text: `Sold ${quantity} ${drug.label} at ${formatMoney(offer.price)} each.`,
      },
    ],
    activity: [
      createActivity(
        nextState,
        'trade',
        `Sold ${quantity} ${drug.label}`,
        `Pulled in ${formatMoney(total)} in ${getCurrentCity(nextState).label}.`,
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
          text: 'Enter a deposit amount higher than zero.',
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
          text: 'You cannot stash more cash than you are carrying.',
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
        text: `Deposited ${formatMoney(amount)} into the bank.`,
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        `Deposited ${formatMoney(amount)}`,
        `Bank reserve climbed to ${formatMoney(nextState.bankDeposit)}.`,
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
          text: 'Enter a withdrawal amount higher than zero.',
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
          text: 'Your bank reserve is not that deep.',
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
        text: `Withdrew ${formatMoney(amount)} from the bank.`,
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        `Withdrew ${formatMoney(amount)}`,
        `Cash on hand is now ${formatMoney(nextState.cash)}.`,
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
          text: 'Enter a payment amount higher than zero.',
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
          text: 'You cannot pay more debt than your cash on hand or remaining balance.',
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
        text: `Paid down ${formatMoney(amount)} in debt.`,
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        `Paid ${formatMoney(amount)} toward debt`,
        `Outstanding debt dropped to ${formatMoney(nextState.debt)}.`,
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
          text: 'Enter a borrow amount higher than zero.',
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
          text: 'No more credit is available on this run.',
        },
      ],
    })
  }

  if (amount > maxBorrow) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: 'That would push your debt past the current loan ceiling.',
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
        text: `Borrowed ${formatMoney(amount)} against the next collection day.`,
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        `Borrowed ${formatMoney(amount)}`,
        `Cash rose to ${formatMoney(nextState.cash)} while debt climbed to ${formatMoney(nextState.debt)}.`,
      ),
    ],
  })
}
