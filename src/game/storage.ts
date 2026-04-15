import { GEAR_ITEMS, getContentPack, hasContentPack } from './content'
import type { ContentPackId, GameState, HighScoreEntry } from './types'

const SAVE_KEY = 'local-dope-wars.active-run.v1'
const HIGH_SCORES_KEY = 'local-dope-wars.high-scores.v1'
const SELECTED_PACK_KEY = 'local-dope-wars.selected-pack.v1'
const MAX_HIGH_SCORES = 10

type StoredGameState = Omit<GameState, 'pawnDebt' | 'gear'> & {
  pawnDebt?: number
  gear?: GameState['gear']
}

type StoredHighScoreEntry = Omit<HighScoreEntry, 'pawnDebt' | 'gearValue'> & {
  pawnDebt?: number
  gearValue?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNewsItem(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.tone === 'string' &&
    typeof value.text === 'string'
  )
}

function isActivityItem(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.day === 'number' &&
    typeof value.kind === 'string' &&
    typeof value.title === 'string' &&
    typeof value.detail === 'string'
  )
}

function isInventoryRecord(value: unknown, drugIds: string[]) {
  if (!isRecord(value)) {
    return false
  }

  return drugIds.every((drugId) => typeof value[drugId] === 'number')
}

function isGearRecord(value: unknown, gearIds: string[]) {
  if (!isRecord(value)) {
    return false
  }

  return gearIds.every((gearId) => typeof value[gearId] === 'number')
}

function isMarketRecord(value: unknown, drugIds: string[]) {
  if (!isRecord(value)) {
    return false
  }

  return drugIds.every((drugId) => {
    const offer = value[drugId]

    return (
      isRecord(offer) &&
      offer.drugId === drugId &&
      typeof offer.available === 'boolean' &&
      typeof offer.price === 'number' &&
      typeof offer.modifier === 'string'
    )
  })
}

function isStoredGameState(value: unknown): value is StoredGameState {
  if (
    !isRecord(value) ||
    typeof value.contentPackId !== 'string' ||
    !hasContentPack(value.contentPackId)
  ) {
    return false
  }

  const content = getContentPack(value.contentPackId)
  const drugIds = content.drugs.map((drug) => drug.id)
  const cityIds = content.cities.map((city) => city.id)
  const gearIds = GEAR_ITEMS.map((item) => item.id)

  return (
    typeof value.runId === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.day === 'number' &&
    typeof value.endDay === 'number' &&
    typeof value.debt === 'number' &&
    (typeof value.pawnDebt === 'number' || typeof value.pawnDebt === 'undefined') &&
    typeof value.bankDeposit === 'number' &&
    typeof value.stoneLevel === 'number' &&
    typeof value.health === 'number' &&
    typeof value.totalSpace === 'number' &&
    typeof value.cash === 'number' &&
    typeof value.currentCityId === 'string' &&
    cityIds.includes(value.currentCityId) &&
    isInventoryRecord(value.inventory, drugIds) &&
    (typeof value.gear === 'undefined' || isGearRecord(value.gear, gearIds)) &&
    isMarketRecord(value.market, drugIds) &&
    Array.isArray(value.news) &&
    value.news.every(isNewsItem) &&
    typeof value.newsCursor === 'number' &&
    Array.isArray(value.activity) &&
    value.activity.every(isActivityItem) &&
    typeof value.activityCursor === 'number'
  )
}

function isStoredHighScoreEntry(value: unknown): value is StoredHighScoreEntry {
  return (
    isRecord(value) &&
    typeof value.runId === 'string' &&
    typeof value.contentPackId === 'string' &&
    hasContentPack(value.contentPackId) &&
    typeof value.contentLabel === 'string' &&
    typeof value.day === 'number' &&
    typeof value.endDay === 'number' &&
    typeof value.cityId === 'string' &&
    typeof value.cityLabel === 'string' &&
    typeof value.cash === 'number' &&
    typeof value.debt === 'number' &&
    (typeof value.pawnDebt === 'number' || typeof value.pawnDebt === 'undefined') &&
    typeof value.bankDeposit === 'number' &&
    typeof value.health === 'number' &&
    typeof value.inventoryValue === 'number' &&
    (typeof value.gearValue === 'number' || typeof value.gearValue === 'undefined') &&
    typeof value.stashUsed === 'number' &&
    typeof value.totalSpace === 'number' &&
    typeof value.score === 'number' &&
    typeof value.tierMessage === 'string' &&
    typeof value.recordedAt === 'string'
  )
}

function normalizeGameState(game: StoredGameState): GameState {
  const defaultGear = Object.fromEntries(
    GEAR_ITEMS.map((item) => [item.id, 0]),
  ) as GameState['gear']

  return {
    ...game,
    pawnDebt: game.pawnDebt ?? 0,
    gear: {
      ...defaultGear,
      ...(game.gear ?? {}),
    },
  }
}

function normalizeHighScore(entry: StoredHighScoreEntry): HighScoreEntry {
  return {
    ...entry,
    pawnDebt: entry.pawnDebt ?? 0,
    gearValue: entry.gearValue ?? 0,
  }
}

function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return null
    }

    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadSavedGame() {
  const stored = readStorage<{ version: number; game: unknown }>(SAVE_KEY)

  if (!stored || stored.version !== 1 || !isStoredGameState(stored.game)) {
    return null
  }

  return normalizeGameState(stored.game)
}

export function saveGame(game: GameState) {
  writeStorage(SAVE_KEY, {
    version: 1,
    game,
  })
}

export function clearSavedGame() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(SAVE_KEY)
}

function sortHighScores(scores: HighScoreEntry[]) {
  return [...scores].sort((left, right) => {
    if (left.score !== right.score) {
      return right.score - left.score
    }

    return right.recordedAt.localeCompare(left.recordedAt)
  })
}

export function loadHighScores() {
  const stored = readStorage<unknown>(HIGH_SCORES_KEY)

  if (!Array.isArray(stored)) {
    return []
  }

  return sortHighScores(
    stored.filter(isStoredHighScoreEntry).map(normalizeHighScore),
  ).slice(0, MAX_HIGH_SCORES)
}

export function recordHighScore(entry: HighScoreEntry) {
  const nextScores = sortHighScores([
    entry,
    ...loadHighScores().filter((score) => score.runId !== entry.runId),
  ]).slice(0, MAX_HIGH_SCORES)

  writeStorage(HIGH_SCORES_KEY, nextScores)

  return nextScores
}

export function loadSelectedContentPackId() {
  const stored = readStorage<{ version: number; contentPackId: unknown }>(
    SELECTED_PACK_KEY,
  )

  if (
    !stored ||
    stored.version !== 1 ||
    typeof stored.contentPackId !== 'string' ||
    !hasContentPack(stored.contentPackId)
  ) {
    return null
  }

  return stored.contentPackId as ContentPackId
}

export function saveSelectedContentPackId(contentPackId: ContentPackId) {
  if (!hasContentPack(contentPackId)) {
    return
  }

  writeStorage(SELECTED_PACK_KEY, {
    version: 1,
    contentPackId,
  })
}
