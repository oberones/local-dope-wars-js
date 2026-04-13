import { CITIES, DRUGS } from './content'
import type { GameState, HighScoreEntry } from './types'

const SAVE_KEY = 'local-dope-wars.active-run.v1'
const HIGH_SCORES_KEY = 'local-dope-wars.high-scores.v1'
const MAX_HIGH_SCORES = 10

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

function isInventoryRecord(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  return DRUGS.every((drug) => typeof value[drug.id] === 'number')
}

function isMarketRecord(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  return DRUGS.every((drug) => {
    const offer = value[drug.id]

    return (
      isRecord(offer) &&
      offer.drugId === drug.id &&
      typeof offer.available === 'boolean' &&
      typeof offer.price === 'number' &&
      typeof offer.modifier === 'string'
    )
  })
}

function isGameState(value: unknown): value is GameState {
  return (
    isRecord(value) &&
    typeof value.runId === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.day === 'number' &&
    typeof value.endDay === 'number' &&
    typeof value.debt === 'number' &&
    typeof value.bankDeposit === 'number' &&
    typeof value.stoneLevel === 'number' &&
    typeof value.health === 'number' &&
    typeof value.totalSpace === 'number' &&
    typeof value.cash === 'number' &&
    typeof value.currentCityId === 'string' &&
    CITIES.some((city) => city.id === value.currentCityId) &&
    isInventoryRecord(value.inventory) &&
    isMarketRecord(value.market) &&
    Array.isArray(value.news) &&
    value.news.every(isNewsItem) &&
    typeof value.newsCursor === 'number' &&
    Array.isArray(value.activity) &&
    value.activity.every(isActivityItem) &&
    typeof value.activityCursor === 'number'
  )
}

function isHighScoreEntry(value: unknown): value is HighScoreEntry {
  return (
    isRecord(value) &&
    typeof value.runId === 'string' &&
    typeof value.day === 'number' &&
    typeof value.endDay === 'number' &&
    typeof value.cityId === 'string' &&
    typeof value.cityLabel === 'string' &&
    typeof value.cash === 'number' &&
    typeof value.debt === 'number' &&
    typeof value.bankDeposit === 'number' &&
    typeof value.health === 'number' &&
    typeof value.inventoryValue === 'number' &&
    typeof value.stashUsed === 'number' &&
    typeof value.totalSpace === 'number' &&
    typeof value.score === 'number' &&
    typeof value.tierMessage === 'string' &&
    typeof value.recordedAt === 'string'
  )
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

  if (!stored || stored.version !== 1 || !isGameState(stored.game)) {
    return null
  }

  return stored.game
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

  return sortHighScores(stored.filter(isHighScoreEntry)).slice(0, MAX_HIGH_SCORES)
}

export function recordHighScore(entry: HighScoreEntry) {
  const nextScores = sortHighScores([
    entry,
    ...loadHighScores().filter((score) => score.runId !== entry.runId),
  ]).slice(0, MAX_HIGH_SCORES)

  writeStorage(HIGH_SCORES_KEY, nextScores)

  return nextScores
}
