export type DrugId =
  | 'acid'
  | 'cocaine'
  | 'wax'
  | 'heroin'
  | 'spice'
  | 'ecstasy'
  | 'oxy'
  | 'meth'
  | 'shrooms'
  | 'fentanyl'
  | 'marijuana'

export type CityId =
  | 'duluth'
  | 'suwanee'
  | 'norcross'
  | 'snellville'
  | 'lawrenceville'
  | 'lilburn'
  | 'grayson'
  | 'dacula'

export type NewsTone = 'system' | 'move' | 'market' | 'alert'
export type MarketModifier = 'standard' | 'cheap' | 'expensive'

export interface PriceBand {
  min: number
  max: number
}

export interface MarketTrigger extends PriceBand {
  headline: string
}

export interface DrugDefinition {
  id: DrugId
  label: string
  flavor: string
  accent: string
  basePrice: PriceBand
  cheap?: MarketTrigger
  expensive?: MarketTrigger
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

export interface MarketOffer {
  drugId: DrugId
  available: boolean
  price: number
  modifier: MarketModifier
}

export interface NewsItem {
  id: number
  tone: NewsTone
  text: string
}

export interface GameState {
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
}

export interface ScoreTier {
  threshold: number
  message: string
}
