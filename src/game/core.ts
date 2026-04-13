import {
  CITIES_BY_ID,
  DRUGS,
  DRUGS_BY_ID,
  GAME_CONFIG,
} from './content'
import type {
  CityId,
  DrugId,
  GameState,
  MarketOffer,
  MarketTrigger,
  NewsTone,
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
  }

  return applyNews(initialState, [
    {
      tone: 'system',
      text: 'Fresh off the curb in Lawrenceville. Thirty days to stack cash.',
    },
    ...bulletins,
  ])
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

export function getNetWorth(state: GameState) {
  const inventoryValue = DRUGS.reduce((total, drug) => {
    const offer = state.market[drug.id]

    if (!offer.available) {
      return total
    }

    return total + state.inventory[drug.id] * offer.price
  }, 0)

  return state.cash + state.bankDeposit + inventoryValue - state.debt
}

export function travelToCity(state: GameState, cityId: CityId) {
  if (cityId === state.currentCityId) {
    return applyNews(state, [
      {
        tone: 'system',
        text: `You are already working ${getCurrentCity(state).label}.`,
      },
    ])
  }

  if (state.day >= state.endDay) {
    return applyNews(state, [
      {
        tone: 'alert',
        text: 'The 30-day run is over. Start a new run to keep moving.',
      },
    ])
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

  return applyNews(nextState, [
    {
      tone: 'move',
      text: `Shifted operations to ${city.label}. Street heat is running ${city.cops}%.`,
    },
    ...bulletins,
  ])
}

export function buyDrug(
  state: GameState,
  drugId: DrugId,
  quantity: number,
) {
  if (quantity <= 0) {
    return applyNews(state, [
      {
        tone: 'alert',
        text: 'Set a quantity higher than zero before you buy.',
      },
    ])
  }

  const offer = state.market[drugId]
  const drug = DRUGS_BY_ID[drugId]

  if (!offer.available) {
    return applyNews(state, [
      {
        tone: 'alert',
        text: `${drug.label} is dry in ${getCurrentCity(state).label} today.`,
      },
    ])
  }

  if (quantity > getAvailableSpace(state)) {
    return applyNews(state, [
      {
        tone: 'alert',
        text: 'You need more stash space.',
      },
    ])
  }

  const total = offer.price * quantity

  if (total > state.cash) {
    return applyNews(state, [
      {
        tone: 'alert',
        text: 'You do not have enough cash for that pickup.',
      },
    ])
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash - total,
    inventory: {
      ...state.inventory,
      [drugId]: state.inventory[drugId] + quantity,
    },
  }

  return applyNews(nextState, [
    {
      tone: 'market',
      text: `Bought ${quantity} ${drug.label} at $${offer.price.toLocaleString()} each.`,
    },
  ])
}

export function sellDrug(
  state: GameState,
  drugId: DrugId,
  quantity: number,
) {
  if (quantity <= 0) {
    return applyNews(state, [
      {
        tone: 'alert',
        text: 'Set a quantity higher than zero before you sell.',
      },
    ])
  }

  const offer = state.market[drugId]
  const drug = DRUGS_BY_ID[drugId]

  if (!offer.available) {
    return applyNews(state, [
      {
        tone: 'alert',
        text: `${drug.label} is not moving in ${getCurrentCity(state).label} today.`,
      },
    ])
  }

  if (state.inventory[drugId] < quantity) {
    return applyNews(state, [
      {
        tone: 'alert',
        text: `You do not own ${quantity} ${drug.label}.`,
      },
    ])
  }

  const nextState: GameState = {
    ...state,
    cash: state.cash + offer.price * quantity,
    inventory: {
      ...state.inventory,
      [drugId]: state.inventory[drugId] - quantity,
    },
  }

  return applyNews(nextState, [
    {
      tone: 'market',
      text: `Sold ${quantity} ${drug.label} at $${offer.price.toLocaleString()} each.`,
    },
  ])
}
