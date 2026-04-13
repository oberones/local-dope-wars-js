import type {
  CityDefinition,
  DrugDefinition,
  ScoreTier,
} from './types'

export const GAME_CONFIG = {
  startingCityId: 'lawrenceville',
  startingCash: 2000,
  startingDebt: 5500,
  totalSpace: 100,
  maxHealth: 100,
  endDay: 30,
  dailyInterestRate: 1.1,
  marketEventChance: 0.05,
  newsLimit: 10,
} as const

export const DRUGS: DrugDefinition[] = [
  {
    id: 'acid',
    label: 'Acid',
    flavor: 'Late-night tab run',
    accent: '#f97316',
    basePrice: { min: 1000, max: 4400 },
    cheap: {
      min: 400,
      max: 1100,
      headline: 'The black market is saturated with acid.',
    },
    expensive: {
      min: 5000,
      max: 8000,
      headline: 'Cops just rolled up local acid dealers. Prices are boosted.',
    },
  },
  {
    id: 'cocaine',
    label: 'Cocaine',
    flavor: 'Club supply with a high ceiling',
    accent: '#f4c95d',
    basePrice: { min: 15000, max: 29000 },
    expensive: {
      min: 40000,
      max: 70000,
      headline: 'Cocaine is moving at reckless prices tonight.',
    },
  },
  {
    id: 'wax',
    label: 'Wax',
    flavor: 'Discreet pen-cart money',
    accent: '#fb7185',
    basePrice: { min: 480, max: 1280 },
    cheap: {
      min: 130,
      max: 400,
      headline: 'Wax is flooded across Gwinnett right now.',
    },
  },
  {
    id: 'heroin',
    label: 'Heroin',
    flavor: 'Risky weight with heavy swings',
    accent: '#fb923c',
    basePrice: { min: 5500, max: 13000 },
    expensive: {
      min: 12000,
      max: 19000,
      headline: 'Addicts will pay absurd numbers for heroin here.',
    },
  },
  {
    id: 'spice',
    label: 'Spice',
    flavor: 'Cheap synthetic panic',
    accent: '#84cc16',
    basePrice: { min: 11, max: 75 },
    cheap: {
      min: 2,
      max: 15,
      headline: 'Some basement chemists just dumped a load of spice onto the strip.',
    },
  },
  {
    id: 'ecstasy',
    label: 'Ecstasy',
    flavor: 'Party stock with reliable spread',
    accent: '#38bdf8',
    basePrice: { min: 1500, max: 4400 },
  },
  {
    id: 'oxy',
    label: 'Oxycontin',
    flavor: 'Pill money with rare spikes',
    accent: '#c084fc',
    basePrice: { min: 540, max: 1250 },
    expensive: {
      min: 34000,
      max: 68000,
      headline: 'A local plug overdosed. Oxy is impossibly expensive tonight.',
    },
  },
  {
    id: 'meth',
    label: 'Meth',
    flavor: 'Fast-moving volume play',
    accent: '#facc15',
    basePrice: { min: 1000, max: 2500 },
  },
  {
    id: 'shrooms',
    label: 'Shrooms',
    flavor: 'Festival bag with gentle margins',
    accent: '#34d399',
    basePrice: { min: 630, max: 1300 },
  },
  {
    id: 'fentanyl',
    label: 'Fentanyl',
    flavor: 'Ultra-risky street poison',
    accent: '#ef4444',
    basePrice: { min: 90, max: 250 },
    expensive: {
      min: 2000,
      max: 5000,
      headline: 'Fentanyl is almost impossible to find here right now.',
    },
  },
  {
    id: 'marijuana',
    label: 'Marijuana',
    flavor: 'Steady neighborhood volume',
    accent: '#22c55e',
    basePrice: { min: 315, max: 890 },
    cheap: {
      min: 60,
      max: 220,
      headline: 'Cheap weed is everywhere today. Happy harvest season.',
    },
  },
]

export const CITIES: CityDefinition[] = [
  {
    id: 'duluth',
    label: 'Duluth',
    district: 'Gas South corridor',
    landmark: 'Arena spillover and hotel exits',
    atmosphere: 'Clean surfaces, event traffic, and windows that open after crowds break.',
    signature: 'Best for quick flips when venue nights let out.',
    cops: 10,
    minDrugs: 5,
    maxDrugs: 10,
    map: { x: 34, y: 31 },
    tagline: 'Event traffic and nightlife create soft openings.',
  },
  {
    id: 'suwanee',
    label: 'Suwanee',
    district: 'Town Center',
    landmark: 'Greenway edges and polished retail lanes',
    atmosphere: 'Quiet money, polished sidewalks, and a market that prefers low drama.',
    signature: 'Low heat makes it ideal for steady accumulation plays.',
    cops: 5,
    minDrugs: 7,
    map: { x: 48, y: 18 },
    tagline: 'Low heat, polished streets, and a lot of quiet money.',
  },
  {
    id: 'norcross',
    label: 'Norcross',
    district: 'Historic downtown edge',
    landmark: 'Older corridors and fast connection points',
    atmosphere: 'Dense movement, layered side streets, and a market that shifts by the hour.',
    signature: 'A good node for volume if you stay nimble.',
    cops: 15,
    minDrugs: 6,
    map: { x: 16, y: 42 },
    tagline: 'Dense routes and older corridors keep the market fluid.',
  },
  {
    id: 'snellville',
    label: 'Snellville',
    district: 'Scenic Highway',
    landmark: 'Bright roads and suburban visibility',
    atmosphere: 'Every move feels exposed here, but the payouts can spike when supply thins.',
    signature: 'High-risk pressure cooker with occasional massive upside.',
    cops: 80,
    minDrugs: 4,
    map: { x: 64, y: 66 },
    tagline: 'High visibility and suburban scrutiny make every move loud.',
  },
  {
    id: 'lawrenceville',
    label: 'Lawrenceville',
    district: 'Downtown square',
    landmark: 'Courthouse blocks and side-street churn',
    atmosphere: 'The center of gravity: crowded enough to work, exposed enough to punish mistakes.',
    signature: 'Home base for timing runs across the county.',
    cops: 30,
    minDrugs: 6,
    map: { x: 47, y: 47 },
    tagline: 'The home base: courthouse traffic, side streets, and steady churn.',
  },
  {
    id: 'lilburn',
    label: 'Lilburn',
    district: 'Old Town',
    landmark: 'Tight roads and compressed sightlines',
    atmosphere: 'A tense pocket where heat rises quickly and panic changes prices fast.',
    signature: 'Great for chasing volatility if you can handle the pressure.',
    cops: 70,
    minDrugs: 4,
    maxDrugs: 10,
    map: { x: 39, y: 63 },
    tagline: 'Tighter roads, tighter nerves, and occasional price explosions.',
  },
  {
    id: 'grayson',
    label: 'Grayson',
    district: 'Rosebud Road belt',
    landmark: 'Residential sprawl and long approach roads',
    atmosphere: 'Spread-out routes create room to breathe if your timing is right.',
    signature: 'Good for medium-risk repositioning and longer plays.',
    cops: 70,
    minDrugs: 6,
    map: { x: 67, y: 54 },
    tagline: 'Residential sprawl creates opportunity if you can stay invisible.',
  },
  {
    id: 'dacula',
    label: 'Dacula',
    district: 'Harbins frontier',
    landmark: 'Outer-county lanes and wider buffers',
    atmosphere: 'The edge of the board, where movement slows down and bigger jumps become possible.',
    signature: 'Useful for escaping pressure and resetting the run tempo.',
    cops: 20,
    minDrugs: 5,
    map: { x: 82, y: 36 },
    tagline: 'Wider lanes, lower pressure, and room to make bigger jumps.',
  },
]

export const SCORE_TIERS: ScoreTier[] = [
  {
    threshold: 100000000,
    message: "Come on, you definitely cheated to get there.",
  },
  {
    threshold: 1000000,
    message: 'You are running Gwinnett better than anyone in the universe.',
  },
  {
    threshold: 400000,
    message: 'That is more money than this county can comfortably handle.',
  },
  {
    threshold: 300000,
    message: 'Perfect.',
  },
  {
    threshold: 200000,
    message: 'Excellent.',
  },
  {
    threshold: 100000,
    message: 'Wow.',
  },
  {
    threshold: 50000,
    message: 'Quite good.',
  },
  {
    threshold: 10000,
    message: 'Not bad.',
  },
  {
    threshold: 5000,
    message: 'Almost respectable.',
  },
  {
    threshold: 1000,
    message: 'Try making some real money next run.',
  },
  {
    threshold: 0,
    message: 'That was a rough hustle.',
  },
  {
    threshold: -4050,
    message: 'Why do you even keep trying?',
  },
  {
    threshold: -10000,
    message: 'This line of work normally makes money.',
  },
  {
    threshold: -99999,
    message: 'You might be the worst dealer in recorded history.',
  },
  {
    threshold: -100000,
    message: 'Absolute catastrophe.',
  },
]

export const CITIES_BY_ID = CITIES.reduce(
  (lookup, city) => {
    lookup[city.id] = city
    return lookup
  },
  {} as Record<CityDefinition['id'], CityDefinition>,
)

export const DRUGS_BY_ID = DRUGS.reduce(
  (lookup, drug) => {
    lookup[drug.id] = drug
    return lookup
  },
  {} as Record<DrugDefinition['id'], DrugDefinition>,
)
