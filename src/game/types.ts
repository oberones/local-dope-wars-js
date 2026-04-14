export type DrugId = string
export type CityId = string
export type ContentPackId = string
export type LocaleId = string

export type NewsTone = 'system' | 'move' | 'market' | 'alert' | 'encounter'
export type MarketModifier = 'standard' | 'cheap' | 'expensive'
export type MarketEventKind =
  | 'flood'
  | 'shortage'
  | 'raid'
  | 'bust'
  | 'lucky-break'
export type ActivityKind = 'run' | 'travel' | 'trade' | 'finance' | 'encounter'

export interface PriceBand {
  min: number
  max: number
}

export interface MarketTrigger extends PriceBand {
  headline: string
}

export interface MarketEventDefinition extends MarketTrigger {
  kind: MarketEventKind
  modifier: Exclude<MarketModifier, 'standard'>
  chance?: number
}

export interface DrugDefinition {
  id: DrugId
  label: string
  flavor: string
  accent: string
  basePrice: PriceBand
  cheap?: MarketTrigger
  expensive?: MarketTrigger
  marketEvents?: MarketEventDefinition[]
}

export interface CityDefinition {
  id: CityId
  label: string
  district: string
  landmark: string
  atmosphere: string
  signature: string
  cops: number
  minDrugs: number
  maxDrugs?: number
  map: {
    x: number
    y: number
  }
  tagline: string
}

export interface MapDistrictDefinition {
  id: string
  label: string
  subtitle: string
  points: string
  cityIds: CityId[]
  fill: string
}

export interface MapLabelDefinition {
  x: number
  y: number
  text: string
}

export interface MapSceneDefinition {
  title: string
  ariaLabel: string
  routes: Array<[CityId, CityId]>
  districts: MapDistrictDefinition[]
  arterials: string[]
  labels: MapLabelDefinition[]
}

export interface MarketOffer {
  drugId: DrugId
  available: boolean
  price: number
  modifier: MarketModifier
  event?: {
    kind: MarketEventKind
    headline: string
  }
}

export interface NewsItem {
  id: number
  tone: NewsTone
  text: string
}

export interface ActivityItem {
  id: number
  day: number
  kind: ActivityKind
  title: string
  detail: string
}

export interface GameState {
  runId: string
  createdAt: string
  contentPackId: ContentPackId
  day: number
  endDay: number
  debt: number
  bankDeposit: number
  stoneLevel: number
  health: number
  totalSpace: number
  cash: number
  currentCityId: CityId
  inventory: Record<DrugId, number>
  market: Record<DrugId, MarketOffer>
  news: NewsItem[]
  newsCursor: number
  activity: ActivityItem[]
  activityCursor: number
}

export interface ScoreTier {
  threshold: number
  message: string
}

export interface RunSummary {
  runId: string
  contentPackId: ContentPackId
  contentLabel: string
  day: number
  endDay: number
  cityId: CityId
  cityLabel: string
  cash: number
  debt: number
  bankDeposit: number
  health: number
  inventoryValue: number
  stashUsed: number
  totalSpace: number
  score: number
  tierMessage: string
}

export interface HighScoreEntry extends RunSummary {
  recordedAt: string
}

export interface ContentPackDefinition {
  id: ContentPackId
  label: string
  shortLabel: string
  description: string
  accent: string
  startingCityId?: CityId
  map: MapSceneDefinition
  cities: CityDefinition[]
  drugs: DrugDefinition[]
  scoreTiers: ScoreTier[]
}
