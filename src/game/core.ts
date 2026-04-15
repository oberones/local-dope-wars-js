import {
  GEAR_ITEMS,
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
  EncounterChoiceId,
  EventSpotlight,
  GameState,
  GearItemDefinition,
  GearItemId,
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

function createGearRecord(gearIds: GearItemId[]) {
  return gearIds.reduce(
    (gear, gearId) => {
      gear[gearId] = 0
      return gear
    },
    {} as Record<GearItemId, number>,
  )
}

const GEAR_ITEMS_BY_ID = Object.fromEntries(
  GEAR_ITEMS.map((item) => [item.id, item]),
) as Record<GearItemId, GearItemDefinition>

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
    gear: createGearRecord(GEAR_ITEMS.map((item) => item.id)),
    market,
    news: [],
    newsCursor: 0,
    pendingEncounter: null,
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

export function getDefenseRating(state: GameState) {
  return GEAR_ITEMS.reduce(
    (total, item) => total + item.defense * state.gear[item.id],
    0,
  )
}

function getWeaponRating(state: GameState) {
  return GEAR_ITEMS.reduce((total, item) => {
    if (item.category !== 'weapon') {
      return total
    }

    return total + item.defense * state.gear[item.id]
  }, 0)
}

function getMitigatedDamage(baseDamage: number, defenseRating: number) {
  if (baseDamage <= 0) {
    return 0
  }

  return Math.max(
    baseDamage - Math.round(defenseRating * GAME_CONFIG.defenseMitigationRate),
    1,
  )
}

function getGearUnitPawnValue(item: GearItemDefinition, unitIndex: number) {
  return Math.max(
    Math.round(item.pawnBaseValue * item.pawnDecayRate ** unitIndex),
    1,
  )
}

function getGearPawnProceedsForQuantity(state: GameState, gearId: GearItemId, quantity: number) {
  const item = GEAR_ITEMS_BY_ID[gearId]
  const owned = state.gear[gearId]

  if (!item || quantity <= 0 || owned <= 0) {
    return 0
  }

  const safeQuantity = Math.min(quantity, owned)

  return Array.from({ length: safeQuantity }, (_, index) =>
    getGearUnitPawnValue(item, owned - safeQuantity + index),
  ).reduce((total, value) => total + value, 0)
}

export function getGearValue(state: GameState) {
  return GEAR_ITEMS.reduce(
    (total, item) =>
      total + getGearPawnProceedsForQuantity(state, item.id, state.gear[item.id]),
    0,
  )
}

export function getMaxGearBuyQuantity(state: GameState, gearId: GearItemId) {
  const item = GEAR_ITEMS_BY_ID[gearId]

  if (!item) {
    return 0
  }

  return Math.max(
    Math.min(
      item.maxOwned - state.gear[gearId],
      Math.floor(state.cash / item.cost),
    ),
    0,
  )
}

export function getMaxGearPawnQuantity(state: GameState, gearId: GearItemId) {
  return state.gear[gearId]
}

export function getNextGearPawnOffer(state: GameState, gearId: GearItemId) {
  return getGearPawnProceedsForQuantity(state, gearId, 1)
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
        getMitigatedDamage(
          randomInt(
            GAME_CONFIG.debtCollectionDamageMin,
            GAME_CONFIG.debtCollectionDamageMax,
          ),
          getDefenseRating(state),
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

  const baseDamage = randomInt(
    GAME_CONFIG.travelEncounterDamageMin,
    GAME_CONFIG.travelEncounterDamageMaxBase +
      Math.round(city.cops / GAME_CONFIG.travelEncounterDamageHeatDivisor),
  )
  const cashDemand = Math.max(
    180,
    Math.round(baseDamage * 52 + city.cops * 7),
  )
  const pendingNewsId = state.newsCursor
  const nextState: GameState = {
    ...state,
    pendingEncounter: {
      kind: 'cop-stop',
      newsId: pendingNewsId,
      cityId: city.id,
      cityLabel: city.label,
      cashDemand,
      baseDamage,
    },
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'encounter',
        text: locale.game.copStopNews(city.label),
        spotlight: {
          tone: 'encounter',
          title: locale.game.copStopTitle,
          detail: locale.game.copStopDetail(city.label, cashDemand),
          artKey: 'rough-stop',
          artLabel: 'Rough stop',
          decision: {
            kind: 'cop-stop',
            choices: ['flee', 'fight', 'surrender'],
          },
        },
      },
    ],
    activity: [
      createActivity(
        nextState,
        'encounter',
        locale.game.copStopTitle,
        locale.game.copStopActivity(city.label, cashDemand),
      ),
    ],
  })
}

function getFightSuccessChance(state: GameState, cityCops: number) {
  const weaponRating = getWeaponRating(state)
  const defenseRating = getDefenseRating(state)

  return Math.min(
    Math.max(
      0.22 + weaponRating * 0.035 + defenseRating * 0.012 - cityCops * 0.0045,
      0.12,
    ),
    0.82,
  )
}

export function resolvePendingEncounter(
  state: GameState,
  choice: EncounterChoiceId,
) {
  const encounter = state.pendingEncounter

  if (!encounter || encounter.kind !== 'cop-stop') {
    return state
  }

  const clearedState: GameState = {
    ...state,
    pendingEncounter: null,
  }
  const defenseRating = getDefenseRating(clearedState)

  if (choice === 'flee') {
    const healthLoss = Math.min(
      clearedState.health,
      getMitigatedDamage(encounter.baseDamage, defenseRating),
    )
    const nextState: GameState = {
      ...clearedState,
      health: Math.max(clearedState.health - healthLoss, 0),
    }

    return applyUpdates(nextState, {
      news: [
        {
          tone: 'encounter',
          text: locale.game.fledCopStopNews(healthLoss),
        },
      ],
      activity: [
        createActivity(
          nextState,
          'encounter',
          locale.game.fledCopStopTitle,
          locale.game.fledCopStopDetail(encounter.cityLabel, nextState.health),
        ),
      ],
    })
  }

  if (choice === 'surrender') {
    const cashLost = Math.min(clearedState.cash, encounter.cashDemand)
    const healthLoss =
      cashLost < encounter.cashDemand ?
        Math.min(clearedState.health, getMitigatedDamage(2, defenseRating))
      : 0
    const nextState: GameState = {
      ...clearedState,
      cash: clearedState.cash - cashLost,
      health: Math.max(clearedState.health - healthLoss, 0),
    }

    return applyUpdates(nextState, {
      news: [
        {
          tone: 'encounter',
          text: locale.game.surrenderedCopStopNews(cashLost, healthLoss),
        },
      ],
      activity: [
        createActivity(
          nextState,
          'encounter',
          locale.game.surrenderedCopStopTitle,
          locale.game.surrenderedCopStopDetail(encounter.cityLabel, cashLost, nextState.health),
        ),
      ],
    })
  }

  const fightSuccess = Math.random() < getFightSuccessChance(clearedState, getCurrentCity(clearedState).cops)

  if (fightSuccess) {
    const healthLoss = Math.min(
      clearedState.health,
      getMitigatedDamage(Math.max(encounter.baseDamage - 5, 1), defenseRating),
    )
    const nextState: GameState = {
      ...clearedState,
      health: Math.max(clearedState.health - healthLoss, 0),
    }

    return applyUpdates(nextState, {
      news: [
        {
          tone: 'encounter',
          text: locale.game.wonCopFightNews(healthLoss),
        },
      ],
      activity: [
        createActivity(
          nextState,
          'encounter',
          locale.game.wonCopFightTitle,
          locale.game.wonCopFightDetail(encounter.cityLabel, nextState.health),
        ),
      ],
    })
  }

  const healthLoss = Math.min(
    clearedState.health,
    getMitigatedDamage(encounter.baseDamage + 6, defenseRating),
  )
  const cashLost = Math.min(clearedState.cash, Math.round(encounter.cashDemand * 0.5))
  const nextState: GameState = {
    ...clearedState,
    cash: clearedState.cash - cashLost,
    health: Math.max(clearedState.health - healthLoss, 0),
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'encounter',
        text: locale.game.lostCopFightNews(cashLost, healthLoss),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'encounter',
        locale.game.lostCopFightTitle,
        locale.game.lostCopFightDetail(encounter.cityLabel, cashLost, nextState.health),
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
    getInventoryValue(state) +
    getGearValue(state) -
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
    gearValue: getGearValue(state),
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
  if (state.pendingEncounter) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.resolveEncounterFirst,
        },
      ],
    })
  }

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

export function buyGear(state: GameState, gearId: GearItemId, quantity = 1) {
  if (quantity <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.gearQuantityRequired,
        },
      ],
    })
  }

  const item = GEAR_ITEMS_BY_ID[gearId]

  if (!item) {
    return state
  }

  const maxBuy = getMaxGearBuyQuantity(state, gearId)

  if (maxBuy <= 0 || quantity > maxBuy) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text:
            state.gear[gearId] >= item.maxOwned ?
              locale.game.gearCarryLimit(item.label)
            : locale.game.gearTooExpensive(item.label),
        },
      ],
    })
  }

  const total = item.cost * quantity
  const nextState: GameState = {
    ...state,
    cash: state.cash - total,
    gear: {
      ...state.gear,
      [gearId]: state.gear[gearId] + quantity,
    },
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.boughtGearNews(quantity, item.label, total),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.boughtGearTitle(quantity, item.label),
        locale.game.boughtGearDetail(getDefenseRating(nextState)),
      ),
    ],
  })
}

export function pawnGear(state: GameState, gearId: GearItemId, quantity = 1) {
  if (quantity <= 0) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.gearPawnQuantityRequired,
        },
      ],
    })
  }

  const item = GEAR_ITEMS_BY_ID[gearId]

  if (!item) {
    return state
  }

  const maxPawnQuantity = getMaxGearPawnQuantity(state, gearId)

  if (maxPawnQuantity <= 0 || quantity > maxPawnQuantity) {
    return applyUpdates(state, {
      news: [
        {
          tone: 'alert',
          text: locale.game.noGearToPawn(item.label),
        },
      ],
    })
  }

  const proceeds = getGearPawnProceedsForQuantity(state, gearId, quantity)
  const nextState: GameState = {
    ...state,
    cash: state.cash + proceeds,
    gear: {
      ...state.gear,
      [gearId]: state.gear[gearId] - quantity,
    },
  }

  return applyUpdates(nextState, {
    news: [
      {
        tone: 'system',
        text: locale.game.pawnedGearNews(quantity, item.label, proceeds),
      },
    ],
    activity: [
      createActivity(
        nextState,
        'finance',
        locale.game.pawnedGearTitle(quantity, item.label),
        locale.game.pawnedGearDetail(nextState.cash, getDefenseRating(nextState)),
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
