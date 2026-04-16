import type {
  CityDefinition,
  ContentPackDefinition,
  ContentPackId,
  DrugDefinition,
  GearItemDefinition,
  MapDistrictDefinition,
  MapLabelDefinition,
  MapSceneDefinition,
  MarketEventDefinition,
  PriceBand,
  ScoreTier,
} from './types'

export const GAME_CONFIG = {
  defaultContentPackId: 'gwinnett-county',
  startingCityId: 'lawrenceville',
  startingCash: 2000,
  startingDebt: 5500,
  startingPawnDebt: 0,
  totalSpace: 100,
  maxHealth: 100,
  endDay: 30,
  dailyInterestRate: 1.1,
  pawnDailyInterestRate: 1.08,
  pawnAdvanceFeeRate: 1.35,
  maxPawnDebt: 6000,
  bankDailyYieldRate: 1.02,
  finalStretchDays: 5,
  finalStretchEncounterChanceBonus: 0.18,
  finalStretchCollectorChanceBonus: 0.14,
  finalStretchCollectorTakeShareBonus: 0.09,
  closeoutInventoryPenaltyRate: 0.35,
  closeoutHealthPenaltyPerMissingPoint: 40,
  marketEventChance: 0.05,
  travelEncounterBaseChance: 0.06,
  travelEncounterHeatFactor: 0.0035,
  travelEncounterMaxChance: 0.42,
  travelEncounterLuckyBreakMaxCops: 25,
  travelEncounterLuckyBreakChance: 0.24,
  travelEncounterLuckyBreakCashBonus: {
    min: 180,
    max: 960,
  },
  travelEncounterJackerAmbushChance: 0.32,
  travelEncounterJackerDemandBaseShare: 0.24,
  travelEncounterJackerDemandHeatDivisor: 240,
  travelEncounterJackerDamageMin: 6,
  travelEncounterJackerDamageMaxBase: 12,
  travelEncounterJackerDamageHeatDivisor: 6,
  travelEncounterStashSweepChance: 0.46,
  travelEncounterStashSweepBaseShare: 0.18,
  travelEncounterStashSweepHeatDivisor: 220,
  travelEncounterShakedownChance: 0.7,
  travelEncounterShakedownBaseShare: 0.08,
  travelEncounterShakedownHeatDivisor: 280,
  encounterFightBaseChance: 0.22,
  encounterFightPowerFactor: 0.03,
  encounterFightDefenseFactor: 0.012,
  encounterFightHeatFactor: 0.0045,
  encounterFightMinChance: 0.12,
  encounterFightMaxChance: 0.82,
  copStopFightDamageRelief: 5,
  copStopFightDamagePenalty: 6,
  copStopFightStashSeizureBaseShare: 0.16,
  copStopFightStashSeizureHeatDivisor: 210,
  copStopSurrenderDamage: 2,
  jackerFightChanceBonus: 0.08,
  jackerFightDamageRelief: 4,
  jackerFightDamagePenalty: 4,
  jackerFightLootCashMin: 140,
  jackerFightLootCashMax: 520,
  jackerFightLootPowerFactor: 26,
  travelEncounterDamageMin: 8,
  travelEncounterDamageMaxBase: 14,
  travelEncounterDamageHeatDivisor: 5,
  healthRecoveryCostPerPoint: 85,
  maxHealthRecoveryPerVisit: 24,
  defenseMitigationRate: 0.75,
  debtCollectionThreshold: 12000,
  debtCollectionBaseChance: 0.08,
  debtCollectionDebtChanceDivisor: 50000,
  debtCollectionMaxChance: 0.42,
  debtCollectionMinTake: 900,
  debtCollectionBaseShare: 0.06,
  debtCollectionDebtShareDivisor: 50000,
  debtCollectionBankTakeShare: 0.55,
  debtCollectionDamageMin: 6,
  debtCollectionDamageMax: 12,
  newsLimit: 10,
  activityLimit: 16,
  maxDebt: 20000,
} as const

export const GEAR_ITEMS: GearItemDefinition[] = [
  {
    id: 'switchblade',
    label: 'Switchblade',
    flavor: 'Pocket insurance for tense handoffs',
    accent: '#f97316',
    category: 'weapon',
    cost: 450,
    defense: 2,
    fightPower: 3,
    maxOwned: 2,
    pawnBaseValue: 260,
    pawnDecayRate: 0.72,
  },
  {
    id: 'snub-nose',
    label: 'Snub-nose',
    flavor: 'Cheap hand cannon with just enough pull',
    accent: '#f4c95d',
    category: 'weapon',
    cost: 2200,
    defense: 5,
    fightPower: 8,
    maxOwned: 2,
    pawnBaseValue: 1350,
    pawnDecayRate: 0.68,
  },
  {
    id: 'kevlar-vest',
    label: 'Kevlar vest',
    flavor: 'Sweaty armor that keeps bad nights survivable',
    accent: '#38bdf8',
    category: 'armor',
    cost: 1800,
    defense: 4,
    fightPower: 0,
    maxOwned: 1,
    pawnBaseValue: 950,
    pawnDecayRate: 0.6,
  },
  {
    id: 'pump-shotgun',
    label: 'Pump shotgun',
    flavor: 'Heavy deterrent for routes that go loud',
    accent: '#ef4444',
    category: 'weapon',
    cost: 4600,
    defense: 9,
    fightPower: 14,
    maxOwned: 1,
    pawnBaseValue: 2550,
    pawnDecayRate: 0.55,
  },
] as const

function cloneDrugDefinitions(drugs: DrugDefinition[]) {
  return drugs.map((drug) => ({
    ...drug,
    cheap: drug.cheap ? { ...drug.cheap } : undefined,
    expensive: drug.expensive ? { ...drug.expensive } : undefined,
    marketEvents: drug.marketEvents?.map((event) => ({ ...event })),
  }))
}

const GWINNETT_DRUGS: DrugDefinition[] = [
  {
    id: 'acid',
    label: 'Acid',
    flavor: 'Late-night tab run',
    accent: '#f97316',
    basePrice: { min: 1000, max: 4400 },
    marketEvents: [
      {
        kind: 'bust',
        modifier: 'expensive',
        chance: 0.03,
        min: 5400,
        max: 8600,
        headline:
          'A busted tab cook scorched supply nearby. Acid prices just jumped.',
      },
    ],
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
    marketEvents: [
      {
        kind: 'raid',
        modifier: 'expensive',
        chance: 0.04,
        min: 42000,
        max: 76000,
        headline:
          'A regional supply raid torched the coke lane. Prices are exploding.',
      },
    ],
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
      headline:
        'Some basement chemists just dumped a load of spice onto the strip.',
    },
  },
  {
    id: 'ecstasy',
    label: 'Ecstasy',
    flavor: 'Party stock with reliable spread',
    accent: '#38bdf8',
    basePrice: { min: 1500, max: 4400 },
    marketEvents: [
      {
        kind: 'lucky-break',
        modifier: 'cheap',
        chance: 0.05,
        min: 420,
        max: 1400,
        headline:
          'A careless festival courier dumped party stock nearby. Ecstasy is cheap tonight.',
      },
    ],
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
      headline:
        'A local plug overdosed. Oxy is impossibly expensive tonight.',
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

const ATLANTA_DRUGS: DrugDefinition[] = cloneDrugDefinitions(GWINNETT_DRUGS).map((drug) => {
  if (drug.id === 'wax' && drug.cheap) {
    return {
      ...drug,
      cheap: {
        ...drug.cheap,
        headline: 'Wax carts are flooded across the eastside tonight.',
      },
    }
  }

  if (drug.id === 'marijuana' && drug.cheap) {
    return {
      ...drug,
      cheap: {
        ...drug.cheap,
        headline: 'Cheap weed is everywhere tonight. Peak harvest energy.',
      },
    }
  }

  return drug
})

const GWINNETT_CITIES: CityDefinition[] = [
  {
    id: 'duluth',
    label: 'Duluth',
    district: 'Gas South corridor',
    landmark: 'Arena spillover and hotel exits',
    atmosphere:
      'Clean surfaces, event traffic, and windows that open after crowds break.',
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
    atmosphere:
      'Quiet money, polished sidewalks, and a market that prefers low drama.',
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
    atmosphere:
      'Dense movement, layered side streets, and a market that shifts by the hour.',
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
    atmosphere:
      'Every move feels exposed here, but the payouts can spike when supply thins.',
    signature: 'High-risk pressure cooker with occasional massive upside.',
    cops: 80,
    minDrugs: 4,
    map: { x: 64, y: 66 },
    tagline:
      'High visibility and suburban scrutiny make every move loud.',
  },
  {
    id: 'lawrenceville',
    label: 'Lawrenceville',
    district: 'Downtown square',
    landmark: 'Courthouse blocks and side-street churn',
    atmosphere:
      'The center of gravity: crowded enough to work, exposed enough to punish mistakes.',
    signature: 'Home base for timing runs across the county.',
    cops: 30,
    minDrugs: 6,
    map: { x: 47, y: 47 },
    tagline:
      'The home base: courthouse traffic, side streets, and steady churn.',
  },
  {
    id: 'lilburn',
    label: 'Lilburn',
    district: 'Old Town',
    landmark: 'Tight roads and compressed sightlines',
    atmosphere:
      'A tense pocket where heat rises quickly and panic changes prices fast.',
    signature: 'Great for chasing volatility if you can handle the pressure.',
    cops: 70,
    minDrugs: 4,
    maxDrugs: 10,
    map: { x: 39, y: 63 },
    tagline:
      'Tighter roads, tighter nerves, and occasional price explosions.',
  },
  {
    id: 'grayson',
    label: 'Grayson',
    district: 'Rosebud Road belt',
    landmark: 'Residential sprawl and long approach roads',
    atmosphere:
      'Spread-out routes create room to breathe if your timing is right.',
    signature: 'Good for medium-risk repositioning and longer plays.',
    cops: 70,
    minDrugs: 6,
    map: { x: 67, y: 54 },
    tagline:
      'Residential sprawl creates opportunity if you can stay invisible.',
  },
  {
    id: 'dacula',
    label: 'Dacula',
    district: 'Harbins frontier',
    landmark: 'Outer-county lanes and wider buffers',
    atmosphere:
      'The edge of the board, where movement slows down and bigger jumps become possible.',
    signature:
      'Useful for escaping pressure and resetting the run tempo.',
    cops: 20,
    minDrugs: 5,
    map: { x: 82, y: 36 },
    tagline:
      'Wider lanes, lower pressure, and room to make bigger jumps.',
  },
]

const ATLANTA_CITIES: CityDefinition[] = [
  {
    id: 'midtown',
    label: 'Midtown',
    district: 'Peachtree spine',
    landmark: 'Tower lobbies and late hotel elevators',
    atmosphere:
      'Bright glass, expensive rideshares, and enough turnover to hide a quick exchange.',
    signature: 'Strong central hub when you need reach in every direction.',
    cops: 28,
    minDrugs: 5,
    maxDrugs: 10,
    map: { x: 42, y: 19 },
    tagline: 'Hotel traffic and tower money keep the board moving.',
  },
  {
    id: 'buckhead',
    label: 'Buckhead',
    district: 'North towers',
    landmark: 'Clubs, parking decks, and polished exits',
    atmosphere:
      'Money moves fast here, but every mistake gets lit up under a cleaner spotlight.',
    signature: 'Big upside with tighter patrol pressure than it first appears.',
    cops: 46,
    minDrugs: 4,
    maxDrugs: 8,
    map: { x: 60, y: 14 },
    tagline: 'Bottle-service money and expensive mistakes travel together.',
  },
  {
    id: 'little-five-points',
    label: 'Little Five',
    district: 'Eastside strip',
    landmark: 'Dive bars, record stores, and sidewalk spillover',
    atmosphere:
      'Dense foot traffic, odd hours, and a crowd that rewards staying flexible.',
    signature: 'Low-to-mid heat volume play with steady overnight movement.',
    cops: 18,
    minDrugs: 6,
    maxDrugs: 10,
    map: { x: 28, y: 36 },
    tagline: 'Sidewalk drift and late-night churn open clean small windows.',
  },
  {
    id: 'old-fourth-ward',
    label: 'Old Fourth Ward',
    district: 'Beltline core',
    landmark: 'Trail cut-throughs and warehouse edges',
    atmosphere:
      'Always in motion, always visible, and balanced right on the line between opportunity and pressure.',
    signature: 'The best launch point for working the intown graph.',
    cops: 34,
    minDrugs: 6,
    maxDrugs: 10,
    map: { x: 45, y: 38 },
    tagline: 'Constant turnover makes it the engine room of the pack.',
  },
  {
    id: 'decatur',
    label: 'Decatur',
    district: 'Square and east rail',
    landmark: 'Station exits and quiet-money side streets',
    atmosphere:
      'Cleaner transfers, calmer blocks, and enough eastside demand to keep margins honest.',
    signature: 'Reliable for lower-drama repositioning plays.',
    cops: 22,
    minDrugs: 6,
    maxDrugs: 10,
    map: { x: 72, y: 36 },
    tagline: 'Rail links and quieter blocks make for steadier flips.',
  },
  {
    id: 'west-end',
    label: 'West End',
    district: 'Southwest corridor',
    landmark: 'Long blocks, stations, and older storefronts',
    atmosphere:
      'Wide lanes and older routes leave room to pivot, but nothing stays quiet for long.',
    signature: 'Good for route changes when the eastside gets too bright.',
    cops: 38,
    minDrugs: 5,
    maxDrugs: 9,
    map: { x: 20, y: 61 },
    tagline: 'Room to move, but never enough room to get lazy.',
  },
  {
    id: 'summerhill',
    label: 'Summerhill',
    district: 'Stadium belt',
    landmark: 'Game-day spillover and patrol-heavy blocks',
    atmosphere:
      'Pressure rises fast here, especially once crowds thin out and the patrol pattern tightens.',
    signature: 'Sharp payouts if you can tolerate a louder board.',
    cops: 62,
    minDrugs: 4,
    maxDrugs: 8,
    map: { x: 45, y: 63 },
    tagline: 'Crowd energy turns into patrol pressure after midnight.',
  },
  {
    id: 'east-atlanta',
    label: 'East Atlanta',
    district: 'Village lanes',
    landmark: 'Bar edges, back lots, and neighborhood cut-throughs',
    atmosphere:
      'Loose enough to work, tense enough to punish bad timing once the late crowd peaks.',
    signature: 'Volatile eastside node with strong upside on the right night.',
    cops: 54,
    minDrugs: 4,
    maxDrugs: 9,
    map: { x: 60, y: 58 },
    tagline: 'Back-lot movement and bar-close spikes make it swingy.',
  },
]

const GWINNETT_SCORE_TIERS: ScoreTier[] = [
  {
    threshold: 100000000,
    message: 'Come on, you definitely cheated to get there.',
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

const ATLANTA_SCORE_TIERS: ScoreTier[] = [
  {
    threshold: 100000000,
    message: 'Come on, you definitely cheated to get there.',
  },
  {
    threshold: 1000000,
    message: 'You are running Atlanta better than anyone in the universe.',
  },
  {
    threshold: 400000,
    message: 'That is more money than this city can comfortably handle.',
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

export const GWINNETT_CONTENT_PACK: ContentPackDefinition = {
  id: 'gwinnett-county',
  label: 'Gwinnett County',
  shortLabel: 'Gwinnett',
  description:
    'Suburban Georgia after dark: wider buffers, courthouse gravity, and enough room to turn patience into money.',
  accent: '#f4c95d',
  startingCityId: 'lawrenceville',
  map: {
    title: 'Gwinnett network',
    ariaLabel: 'Illustrated Gwinnett County market map',
    routes: [
      ['suwanee', 'duluth'],
      ['duluth', 'lawrenceville'],
      ['lawrenceville', 'dacula'],
      ['lawrenceville', 'grayson'],
      ['lawrenceville', 'snellville'],
      ['lawrenceville', 'lilburn'],
      ['duluth', 'norcross'],
      ['norcross', 'lilburn'],
      ['lilburn', 'snellville'],
    ],
    districts: [
      {
        id: 'northwest',
        label: 'Norcross / Duluth',
        subtitle: 'Older corridors',
        points: '14,31 28,18 42,21 40,41 20,46 10,39',
        cityIds: ['norcross', 'duluth'],
        fill: 'rgba(56, 189, 248, 0.09)',
      },
      {
        id: 'north',
        label: 'Suwanee / Dacula',
        subtitle: 'Wide-lane expansion',
        points: '41,21 58,11 84,23 84,39 71,42 40,41',
        cityIds: ['suwanee', 'dacula'],
        fill: 'rgba(34, 197, 94, 0.08)',
      },
      {
        id: 'core',
        label: 'Lawrenceville core',
        subtitle: 'Courthouse gravity',
        points: '20,46 40,41 71,42 69,62 31,67 15,57',
        cityIds: ['lawrenceville', 'grayson'],
        fill: 'rgba(244, 197, 93, 0.1)',
      },
      {
        id: 'south',
        label: 'Lilburn / Snellville',
        subtitle: 'Heat-heavy suburbs',
        points: '15,57 31,67 69,62 77,82 33,86 13,72',
        cityIds: ['lilburn', 'snellville'],
        fill: 'rgba(249, 115, 22, 0.08)',
      },
    ],
    arterials: [
      'M18 39 C26 34, 34 30, 42 28 C53 25, 63 24, 78 26',
      'M21 49 C30 49, 39 49, 49 48 C61 47, 71 48, 79 54',
      'M30 18 C38 25, 44 31, 48 40 C52 49, 58 60, 70 78',
      'M16 67 C30 61, 42 57, 57 56 C67 55, 75 58, 84 63',
    ],
    labels: [
      { x: 19, y: 28, text: 'Historic routes' },
      { x: 62, y: 17, text: 'Expansion belt' },
      { x: 48, y: 46, text: 'Downtown grid' },
      { x: 58, y: 75, text: 'Suburban pressure' },
    ],
  },
  cities: GWINNETT_CITIES,
  drugs: GWINNETT_DRUGS,
  scoreTiers: GWINNETT_SCORE_TIERS,
}

export const ATLANTA_INTOWN_CONTENT_PACK: ContentPackDefinition = {
  id: 'atlanta-intown',
  label: 'Atlanta Intown',
  shortLabel: 'Atlanta',
  description:
    'Denser neighborhoods, faster heat shifts, and tighter route pressure across Atlanta after midnight.',
  accent: '#38bdf8',
  startingCityId: 'old-fourth-ward',
  map: {
    title: 'Atlanta intown grid',
    ariaLabel: 'Illustrated Atlanta intown market map',
    routes: [
      ['buckhead', 'midtown'],
      ['midtown', 'old-fourth-ward'],
      ['old-fourth-ward', 'little-five-points'],
      ['little-five-points', 'decatur'],
      ['old-fourth-ward', 'summerhill'],
      ['summerhill', 'west-end'],
      ['summerhill', 'east-atlanta'],
      ['east-atlanta', 'decatur'],
      ['midtown', 'west-end'],
    ],
    districts: [
      {
        id: 'north',
        label: 'Buckhead / Midtown',
        subtitle: 'High-rise money',
        points: '26,14 44,10 66,12 66,26 40,29 25,24',
        cityIds: ['midtown', 'buckhead'],
        fill: 'rgba(56, 189, 248, 0.1)',
      },
      {
        id: 'east',
        label: 'Little Five / Decatur',
        subtitle: 'Eastside drift',
        points: '25,24 40,29 78,27 82,43 58,48 24,41',
        cityIds: ['little-five-points', 'old-fourth-ward', 'decatur'],
        fill: 'rgba(34, 197, 94, 0.08)',
      },
      {
        id: 'southwest',
        label: 'West End / Summerhill',
        subtitle: 'Station and stadium pressure',
        points: '14,49 36,44 58,48 63,76 20,82 10,66',
        cityIds: ['west-end', 'summerhill'],
        fill: 'rgba(249, 115, 22, 0.09)',
      },
      {
        id: 'southeast',
        label: 'East Atlanta',
        subtitle: 'Village volatility',
        points: '58,48 82,43 84,68 65,79 50,71',
        cityIds: ['east-atlanta'],
        fill: 'rgba(244, 197, 93, 0.1)',
      },
    ],
    arterials: [
      'M20 22 C31 21, 42 21, 59 20 C69 20, 76 23, 83 28',
      'M18 39 C29 39, 39 39, 49 39 C60 39, 70 42, 80 47',
      'M42 15 C43 26, 44 36, 45 49 C46 59, 47 68, 48 81',
      'M12 63 C24 58, 36 55, 49 55 C61 55, 72 57, 82 63',
    ],
    labels: [
      { x: 60, y: 15, text: 'North towers' },
      { x: 69, y: 34, text: 'East rail' },
      { x: 46, y: 58, text: 'Stadium belt' },
      { x: 20, y: 70, text: 'Westside route' },
    ],
  },
  cities: ATLANTA_CITIES,
  drugs: ATLANTA_DRUGS,
  scoreTiers: ATLANTA_SCORE_TIERS,
}

const CUSTOM_CONTENT_PACKS_KEY = 'local-dope-wars.custom-packs.v1'

const BUILT_IN_CONTENT_PACKS: ContentPackDefinition[] = [
  GWINNETT_CONTENT_PACK,
  ATLANTA_INTOWN_CONTENT_PACK,
]

type ResolvedContentPack = ContentPackDefinition & {
  citiesById: Record<CityDefinition['id'], CityDefinition>
  drugsById: Record<DrugDefinition['id'], DrugDefinition>
}

const BUILT_IN_CONTENT_PACK_IDS = new Set(BUILT_IN_CONTENT_PACKS.map((pack) => pack.id))

let CONTENT_PACKS: ContentPackDefinition[] = [...BUILT_IN_CONTENT_PACKS]
let CONTENT_PACKS_BY_ID: Record<ContentPackId, ResolvedContentPack> = {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readStorage<T>(key: string) {
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

function requireStringField(record: Record<string, unknown>, field: string, context: string) {
  const value = record[field]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${context} requires a non-empty "${field}" string.`)
  }

  return value
}

function requireHexColorField(record: Record<string, unknown>, field: string, context: string) {
  const value = requireStringField(record, field, context)

  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`${context} "${field}" must use a 6-digit hex color.`)
  }

  return value
}

function requireNumberField(record: Record<string, unknown>, field: string, context: string) {
  const value = record[field]

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${context} requires a numeric "${field}" value.`)
  }

  return value
}

function readOptionalStringField(record: Record<string, unknown>, field: string) {
  const value = record[field]

  if (typeof value === 'undefined') {
    return undefined
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Optional field "${field}" must be a non-empty string when present.`)
  }

  return value
}

function parsePriceBand(value: unknown, context: string): PriceBand {
  if (!isRecord(value)) {
    throw new Error(`${context} must be an object with "min" and "max".`)
  }

  const min = requireNumberField(value, 'min', context)
  const max = requireNumberField(value, 'max', context)

  if (max < min) {
    throw new Error(`${context} must not have "max" lower than "min".`)
  }

  return { min, max }
}

function parseMarketEventDefinition(value: unknown, index: number): MarketEventDefinition {
  if (!isRecord(value)) {
    throw new Error(`Market event ${index + 1} must be an object.`)
  }

  const kind = requireStringField(value, 'kind', `Market event ${index + 1}`)
  const modifier = requireStringField(value, 'modifier', `Market event ${index + 1}`)
  const headline = requireStringField(value, 'headline', `Market event ${index + 1}`)
  const chance = value.chance

  if (
    kind !== 'flood' &&
    kind !== 'shortage' &&
    kind !== 'raid' &&
    kind !== 'bust' &&
    kind !== 'lucky-break'
  ) {
    throw new Error(`Market event ${index + 1} has an unsupported "kind".`)
  }

  if (modifier !== 'cheap' && modifier !== 'expensive') {
    throw new Error(`Market event ${index + 1} must use "cheap" or "expensive" modifier.`)
  }

  if (typeof chance !== 'undefined' && (typeof chance !== 'number' || chance < 0 || chance > 1)) {
    throw new Error(`Market event ${index + 1} chance must stay between 0 and 1.`)
  }

  return {
    kind,
    modifier,
    headline,
    chance,
    ...parsePriceBand(value, `Market event ${index + 1}`),
  }
}

function parseDrugDefinition(value: unknown, index: number): DrugDefinition {
  if (!isRecord(value)) {
    throw new Error(`Drug ${index + 1} must be an object.`)
  }

  const cheap = value.cheap
  const expensive = value.expensive
  const marketEvents = value.marketEvents

  if (typeof marketEvents !== 'undefined' && !Array.isArray(marketEvents)) {
    throw new Error(`Drug ${index + 1} marketEvents must be an array when present.`)
  }

  return {
    id: requireStringField(value, 'id', `Drug ${index + 1}`),
    label: requireStringField(value, 'label', `Drug ${index + 1}`),
    flavor: requireStringField(value, 'flavor', `Drug ${index + 1}`),
    accent: requireHexColorField(value, 'accent', `Drug ${index + 1}`),
    basePrice: parsePriceBand(value.basePrice, `Drug ${index + 1} basePrice`),
    cheap:
      typeof cheap === 'undefined' ?
        undefined
      : {
          ...parsePriceBand(cheap, `Drug ${index + 1} cheap trigger`),
          headline: requireStringField(cheap as Record<string, unknown>, 'headline', `Drug ${index + 1} cheap trigger`),
        },
    expensive:
      typeof expensive === 'undefined' ?
        undefined
      : {
          ...parsePriceBand(expensive, `Drug ${index + 1} expensive trigger`),
          headline: requireStringField(
            expensive as Record<string, unknown>,
            'headline',
            `Drug ${index + 1} expensive trigger`,
          ),
        },
    marketEvents:
      Array.isArray(marketEvents) ?
        marketEvents.map((event, eventIndex) => parseMarketEventDefinition(event, eventIndex))
      : undefined,
  }
}

function parseCityDefinition(value: unknown, index: number): CityDefinition {
  if (!isRecord(value)) {
    throw new Error(`City ${index + 1} must be an object.`)
  }

  if (!isRecord(value.map)) {
    throw new Error(`City ${index + 1} requires a "map" object.`)
  }

  const maxDrugs = value.maxDrugs

  if (
    typeof maxDrugs !== 'undefined' &&
    (typeof maxDrugs !== 'number' || !Number.isFinite(maxDrugs))
  ) {
    throw new Error(`City ${index + 1} "maxDrugs" must be numeric when present.`)
  }

  return {
    id: requireStringField(value, 'id', `City ${index + 1}`),
    label: requireStringField(value, 'label', `City ${index + 1}`),
    district: requireStringField(value, 'district', `City ${index + 1}`),
    landmark: requireStringField(value, 'landmark', `City ${index + 1}`),
    atmosphere: requireStringField(value, 'atmosphere', `City ${index + 1}`),
    signature: requireStringField(value, 'signature', `City ${index + 1}`),
    cops: requireNumberField(value, 'cops', `City ${index + 1}`),
    minDrugs: requireNumberField(value, 'minDrugs', `City ${index + 1}`),
    maxDrugs,
    map: {
      x: requireNumberField(value.map, 'x', `City ${index + 1} map`),
      y: requireNumberField(value.map, 'y', `City ${index + 1} map`),
    },
    tagline: requireStringField(value, 'tagline', `City ${index + 1}`),
  }
}

function parseMapDistrictDefinition(
  value: unknown,
  index: number,
  cityIds: Set<string>,
): MapDistrictDefinition {
  if (!isRecord(value)) {
    throw new Error(`Map district ${index + 1} must be an object.`)
  }

  if (!Array.isArray(value.cityIds) || value.cityIds.length === 0) {
    throw new Error(`Map district ${index + 1} must list at least one city id.`)
  }

  const districtCityIds = value.cityIds.map((cityId) => {
    if (typeof cityId !== 'string' || !cityIds.has(cityId)) {
      throw new Error(`Map district ${index + 1} references an unknown city id.`)
    }

    return cityId
  })

  return {
    id: requireStringField(value, 'id', `Map district ${index + 1}`),
    label: requireStringField(value, 'label', `Map district ${index + 1}`),
    subtitle: requireStringField(value, 'subtitle', `Map district ${index + 1}`),
    points: requireStringField(value, 'points', `Map district ${index + 1}`),
    cityIds: districtCityIds,
    fill: requireStringField(value, 'fill', `Map district ${index + 1}`),
  }
}

function parseMapLabelDefinition(value: unknown, index: number): MapLabelDefinition {
  if (!isRecord(value)) {
    throw new Error(`Map label ${index + 1} must be an object.`)
  }

  return {
    x: requireNumberField(value, 'x', `Map label ${index + 1}`),
    y: requireNumberField(value, 'y', `Map label ${index + 1}`),
    text: requireStringField(value, 'text', `Map label ${index + 1}`),
  }
}

function parseMapSceneDefinition(
  value: unknown,
  cityIds: Set<string>,
): MapSceneDefinition {
  if (!isRecord(value)) {
    throw new Error('Content pack "map" must be an object.')
  }

  if (!Array.isArray(value.routes)) {
    throw new Error('Content pack map requires a "routes" array.')
  }

  const routes = value.routes.map((route, index) => {
    if (
      !Array.isArray(route) ||
      route.length !== 2 ||
      typeof route[0] !== 'string' ||
      typeof route[1] !== 'string' ||
      !cityIds.has(route[0]) ||
      !cityIds.has(route[1])
    ) {
      throw new Error(`Map route ${index + 1} must connect two known city ids.`)
    }

    return [route[0], route[1]] as [string, string]
  })

  if (!Array.isArray(value.districts) || !Array.isArray(value.arterials) || !Array.isArray(value.labels)) {
    throw new Error('Content pack map must provide districts, arterials, and labels arrays.')
  }

  return {
    title: requireStringField(value, 'title', 'Content pack map'),
    ariaLabel: requireStringField(value, 'ariaLabel', 'Content pack map'),
    routes,
    districts: value.districts.map((district, index) =>
      parseMapDistrictDefinition(district, index, cityIds),
    ),
    arterials: value.arterials.map((arterial, index) => {
      if (typeof arterial !== 'string' || arterial.trim() === '') {
        throw new Error(`Map arterial ${index + 1} must be a non-empty string.`)
      }

      return arterial
    }),
    labels: value.labels.map((label, index) => parseMapLabelDefinition(label, index)),
  }
}

function parseScoreTier(value: unknown, index: number): ScoreTier {
  if (!isRecord(value)) {
    throw new Error(`Score tier ${index + 1} must be an object.`)
  }

  return {
    threshold: requireNumberField(value, 'threshold', `Score tier ${index + 1}`),
    message: requireStringField(value, 'message', `Score tier ${index + 1}`),
  }
}

function assertUniqueIds(values: string[], context: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${context} must use unique ids.`)
  }
}

function parseContentPackDefinition(
  value: unknown,
  allowBuiltInId = false,
): ContentPackDefinition {
  if (!isRecord(value)) {
    throw new Error('Content pack JSON must be an object.')
  }

  const id = requireStringField(value, 'id', 'Content pack')

  if (!allowBuiltInId && BUILT_IN_CONTENT_PACK_IDS.has(id)) {
    throw new Error(`"${id}" is reserved by a built-in content pack.`)
  }

  if (!Array.isArray(value.cities) || value.cities.length === 0) {
    throw new Error('Content pack must include at least one city.')
  }

  if (!Array.isArray(value.drugs) || value.drugs.length === 0) {
    throw new Error('Content pack must include at least one drug.')
  }

  if (!Array.isArray(value.scoreTiers) || value.scoreTiers.length === 0) {
    throw new Error('Content pack must include at least one score tier.')
  }

  const cities = value.cities.map((city, index) => parseCityDefinition(city, index))
  const drugs = value.drugs.map((drug, index) => parseDrugDefinition(drug, index))
  const scoreTiers = value.scoreTiers.map((tier, index) => parseScoreTier(tier, index))
  const cityIds = new Set(cities.map((city) => city.id))
  const drugIds = drugs.map((drug) => drug.id)
  const startingCityId = readOptionalStringField(value, 'startingCityId')

  assertUniqueIds([...cityIds], 'Content pack cities')
  assertUniqueIds(drugIds, 'Content pack drugs')

  if (startingCityId && !cityIds.has(startingCityId)) {
    throw new Error('Content pack "startingCityId" must reference one of its cities.')
  }

  return {
    id,
    label: requireStringField(value, 'label', 'Content pack'),
    shortLabel: requireStringField(value, 'shortLabel', 'Content pack'),
    description: requireStringField(value, 'description', 'Content pack'),
    accent: requireHexColorField(value, 'accent', 'Content pack'),
    startingCityId,
    map: parseMapSceneDefinition(value.map, cityIds),
    cities,
    drugs,
    scoreTiers,
  }
}

function buildContentPackLookup(packs: ContentPackDefinition[]) {
  return packs.reduce(
    (lookup, pack) => {
      lookup[pack.id] = {
        ...pack,
        citiesById: pack.cities.reduce(
          (cityLookup, city) => {
            cityLookup[city.id] = city
            return cityLookup
          },
          {} as Record<CityDefinition['id'], CityDefinition>,
        ),
        drugsById: pack.drugs.reduce(
          (drugLookup, drug) => {
            drugLookup[drug.id] = drug
            return drugLookup
          },
          {} as Record<DrugDefinition['id'], DrugDefinition>,
        ),
      }
      return lookup
    },
    {} as Record<ContentPackId, ResolvedContentPack>,
  )
}

function readPersistedCustomContentPacks() {
  const stored = readStorage<unknown>(CUSTOM_CONTENT_PACKS_KEY)

  if (!Array.isArray(stored)) {
    return []
  }

  return stored.flatMap((pack) => {
    try {
      return [parseContentPackDefinition(pack)]
    } catch {
      return []
    }
  })
}

function writePersistedCustomContentPacks(packs: ContentPackDefinition[]) {
  writeStorage(CUSTOM_CONTENT_PACKS_KEY, packs)
}

function refreshContentPackRegistry(customPacks = readPersistedCustomContentPacks()) {
  CONTENT_PACKS = [...BUILT_IN_CONTENT_PACKS, ...customPacks]
  CONTENT_PACKS_BY_ID = buildContentPackLookup(CONTENT_PACKS)
}

refreshContentPackRegistry()

export function listContentPacks() {
  return [...CONTENT_PACKS]
}

export function listImportedContentPacks() {
  return CONTENT_PACKS.filter((pack) => !BUILT_IN_CONTENT_PACK_IDS.has(pack.id))
}

export function isBuiltInContentPack(packId: string) {
  return BUILT_IN_CONTENT_PACK_IDS.has(packId)
}

export function importCustomContentPack(value: unknown) {
  const nextPack = parseContentPackDefinition(value)
  const importedPacks = listImportedContentPacks().filter((pack) => pack.id !== nextPack.id)
  const nextImportedPacks = [...importedPacks, nextPack]

  writePersistedCustomContentPacks(nextImportedPacks)
  refreshContentPackRegistry(nextImportedPacks)

  return nextPack
}

export const DEFAULT_CONTENT_PACK = CONTENT_PACKS_BY_ID[GAME_CONFIG.defaultContentPackId]

export function hasContentPack(packId: string) {
  return packId in CONTENT_PACKS_BY_ID
}

export function getContentPack(packId: ContentPackId) {
  return CONTENT_PACKS_BY_ID[packId] ?? DEFAULT_CONTENT_PACK
}

export const CITIES = DEFAULT_CONTENT_PACK.cities
export const DRUGS = DEFAULT_CONTENT_PACK.drugs
export const SCORE_TIERS = DEFAULT_CONTENT_PACK.scoreTiers
export const CITIES_BY_ID = DEFAULT_CONTENT_PACK.citiesById
export const DRUGS_BY_ID = DEFAULT_CONTENT_PACK.drugsById
