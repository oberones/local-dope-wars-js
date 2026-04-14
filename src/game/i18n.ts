import type { ActivityKind, LocaleId, MarketEventKind, MarketModifier } from './types'

const moneyFormatter = new Intl.NumberFormat('en-US')
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatMoney(value: number) {
  const absolute = moneyFormatter.format(Math.abs(value))
  return value < 0 ? `-$${absolute}` : `$${absolute}`
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatUnits(quantity: number) {
  return `${quantity} unit${quantity === 1 ? '' : 's'}`
}

function formatDay(day: number) {
  return `Day ${day}`
}

function formatDayProgress(day: number, endDay: number) {
  return `${formatDay(day)} / ${endDay}`
}

function formatRank(rank: number) {
  return `#${rank}`
}

function formatScoreboardTitle(contentLabel: string, cityLabel: string, day: number) {
  return `${contentLabel} · ${cityLabel} · ${formatDay(day)}`
}

function formatActivityKind(kind: ActivityKind) {
  if (kind === 'run') {
    return 'Run'
  }

  if (kind === 'travel') {
    return 'Travel'
  }

  if (kind === 'trade') {
    return 'Trade'
  }

  if (kind === 'encounter') {
    return 'Encounter'
  }

  return 'Finance'
}

function formatMarketModifier(modifier: MarketModifier) {
  if (modifier === 'cheap') {
    return 'Flooded'
  }

  if (modifier === 'expensive') {
    return 'Burning'
  }

  return 'Steady'
}

function assertNever(value: never): never {
  throw new Error(`Unhandled market event kind: ${String(value)}`)
}

function formatMarketEventKind(kind: MarketEventKind) {
  switch (kind) {
    case 'flood':
      return 'Flood'
    case 'shortage':
      return 'Shortage'
    case 'raid':
      return 'Raid'
    case 'bust':
      return 'Bust'
    case 'lucky-break':
      return 'Lucky break'
    default:
      return assertNever(kind)
  }
}

function formatHeatLabel(cops: number) {
  if (cops < 20) {
    return 'Low profile'
  }

  if (cops < 50) {
    return 'Manageable heat'
  }

  return 'Red hot'
}

export const EN_US_LOCALE = {
  id: 'en-US' as LocaleId,
  label: 'English (US)',
  appTitle: 'Local Dope Wars',
  formatMoney,
  formatDate,
  formatUnits,
  formatDay,
  formatDayProgress,
  formatRank,
  formatScoreboardTitle,
  formatActivityKind,
  formatMarketModifier,
  formatMarketEventKind,
  formatHeatLabel,
  menu: {
    eyebrow: 'Starter content pack',
    heroLede: (contentLabel: string, description: string) =>
      `${contentLabel} is armed for the next new run. ${description}`,
    starterPackLoaded: (shortLabel: string) => `${shortLabel} starter pack loaded`,
    runFormat: 'Thirty-day run format',
    persistenceEnabled: 'Autosave + high scores enabled',
    savedRunReady: 'Saved run ready',
    freshRunReady: 'Fresh run ready',
    savedRunHeading: (cityLabel: string, day: number) =>
      `${cityLabel}, day ${day}`,
    freshRunHeading: 'Thirty nights to build a stack',
    savedRunSummary: (score: number, cash: number, debt: number) =>
      `Resume with ${formatMoney(score)} in net worth, ${formatMoney(cash)} cash, and ${formatMoney(debt)} debt still hanging over the run.`,
    freshRunSummary: (shortLabel: string) =>
      `Open a new ${shortLabel} run with cash in pocket, debt on your back, and the county map ready to work.`,
    newRunArmedNote: (contentLabel: string) =>
      `New runs are currently armed for ${contentLabel}.`,
    continueSavedRun: 'Continue saved run',
    startNewRun: 'Start new run',
    packSelectorEyebrow: 'Pack selector',
    packSelectorHeading: 'Choose next run map',
    packSelectorSummary:
      'New runs use the selected pack. Saved runs keep their original setting.',
    builtInDefault: 'Built-in default',
    alternateBundle: 'Alternate bundle',
    selectedForNewRuns: 'Selected for new runs',
    useThisPack: 'Use this pack',
    locationsCount: (count: number) =>
      `${count} location${count === 1 ? '' : 's'}`,
    startsIn: (cityLabel: string) => `Starts in ${cityLabel}`,
    packLaunchNote: (shortLabel: string, cityLabel: string) =>
      `${shortLabel} opens in ${cityLabel}.`,
    topRunsEyebrow: 'Top runs',
    highScoresHeading: 'High scores',
    highScoresSummary: 'Best closed-out runs from this browser.',
    emptyHighScores:
      'No finished runs recorded yet. Close one out to seed the board.',
    currentBuildEyebrow: 'Current build',
    currentBuildHeading: 'What is live',
    currentBuildItems: [
      'Runs autosave and can be resumed from the launch screen.',
      'Banking, withdrawals, debt payoff, borrowing, and patch-up recovery are live.',
      'Players can now choose between bundled starter location packs for new runs.',
      'Travel heat now drives encounter risk, stash losses, and cash pressure.',
      'Drug lanes can now hit typed floods, shortages, raids, busts, and lucky breaks.',
    ],
  },
  summary: {
    eyebrow: 'Run closed',
    leaderboardRank: (rank: number) => `Leaderboard rank #${rank}`,
    runLogged: 'Run logged',
    cashLabel: 'Cash',
    bankLabel: 'Bank',
    inventoryValueLabel: 'Inventory value',
    debtLabel: 'Debt',
    backToLaunchBoard: 'Back to launch board',
    startAnotherRun: 'Start another run',
    currentLeaderboardHeading: 'Current leaderboard',
  },
  run: {
    dashboardEyebrow: 'Operational dashboard',
    heroLede: (shortLabel: string) =>
      `The ${shortLabel} starter map is still the active default pack, but the run now carries a shared locale layer on top of persistence, finance, and end-of-run flow.`,
    liveProducts: (count: number) => `${count} live products tonight`,
    nightsLeft: (count: number) =>
      `${count} night${count === 1 ? '' : 's'} left in the run`,
    operatingCity: 'Operating city',
    runClock: 'Run clock',
    campaignProgress: 'Campaign progress',
    finalDayNote:
      'Final day reached. You can still settle inventory and finances before closing the run.',
    activeRunNote: (count: number) =>
      `${count} night${count === 1 ? '' : 's'} remain before the books close. This run autosaves after each move.`,
    saveAndExit: 'Save and exit',
    newRun: 'New run',
    completeEyebrow: 'Run complete',
    completeHeading: 'Close the books when you are ready',
    completeCopy:
      'Travel is locked now, but you can still liquidate the stash, work the bank, and pay debt before filing the final score.',
    currentScorePreview: 'Current score preview',
    finalizeRun: 'Finalize run',
    cashOnHand: 'Cash on hand',
    health: 'Health',
    bankReserve: 'Bank reserve',
    debtPressure: 'Debt pressure',
    stashSpace: 'Stash space',
    runValue: 'Run value',
    cheapestLane: 'Cheapest lane',
    highestTicket: 'Highest ticket',
    marketPulse: 'Market pulse',
    bagLeader: 'Bag leader',
    noOpenMarket: 'No open market',
    unavailable: 'Unavailable',
    cheapestLaneMeta: (cityLabel: string) =>
      `Lowest price currently moving in ${cityLabel}.`,
    highestTicketMeta: 'Biggest single-unit payout on the board right now.',
    marketPulseMeta:
      'The loudest active event or pricing swing currently on the board.',
    marketPulseIdle: 'No special market events are active tonight.',
    emptyStash: 'Empty stash',
    emptyInventoryBoard: 'No inventory yet, so the board is clean.',
    inventoryLeaderMeta: 'Largest stack currently in inventory.',
    financeEyebrow: 'Finance desk',
    financeHeading: 'Bank and debt',
    financeSummary:
      'Move cash, protect winnings, and decide how hard to lean on the loan ceiling.',
    streetMedicLabel: 'Street medic',
    streetMedicButton: 'Patch up',
    streetMedicReady: (health: number, cost: number) =>
      `Restore ${health} health for ${formatMoney(cost)}.`,
    streetMedicNoNeed: 'Health is already topped off.',
    streetMedicNoCash: 'No cash on hand to patch up right now.',
    streetMedicTravelLock:
      'You are too beat up to travel. Patch up before moving again.',
    outstandingDebt: 'Outstanding debt',
    creditRemaining: 'Credit remaining',
    depositLabel: 'Deposit to bank',
    depositButton: 'Deposit',
    withdrawLabel: 'Withdraw from bank',
    withdrawButton: 'Withdraw',
    payDebtLabel: 'Pay debt',
    payDebtButton: 'Pay',
    borrowLabel: 'Borrow more cash',
    borrowButton: 'Borrow',
    ledgerEyebrow: 'Ledger',
    ledgerHeading: 'Activity log',
    ledgerSummary:
      'Recent trades, travel, and finance actions for this run.',
    activityMeta: (day: number, kind: ActivityKind) =>
      `${formatDay(day)} · ${formatActivityKind(kind)}`,
    territoryEyebrow: 'Territory scene',
    focusedCityEyebrow: 'Focused city',
    heatLabel: 'Heat',
    signatureLabel: 'Signature',
    statusLabel: 'Status',
    currentTerritory: 'Current territory',
    travelLocked: 'Travel locked',
    tooHurtToTravel: 'Too hurt to travel',
    availableToTravel: 'Available to travel',
    streetChatterEyebrow: 'Street chatter',
    signalFeedHeading: 'Signal feed',
    signalFeedSummary:
      'Market headlines, travel signals, and warnings from the run.',
    tradingFloorEyebrow: 'Trading floor',
    marketBoardHeading: 'Market board',
    marketBoardNote:
      'Trading still runs on the pure game core, but the board now reflects typed market events and clearer input limits before a move fires.',
    offMarket: 'Off market',
    hidden: 'Hidden',
    ownedLabel: (quantity: number) => `Owned ${quantity}`,
    buyingRoom: (maxBuy: number) => `Buying room ${maxBuy}`,
    travelElsewhere: 'Travel to another city to move it',
    quantityLabel: 'Quantity',
    maxBuyButton: 'Max buy',
    buyButton: 'Buy',
    maxSellButton: 'Max sell',
    sellButton: 'Sell',
    runCompleteTitle: (cityLabel: string, day: number) =>
      `${cityLabel} · ${formatDay(day)}`,
  },
  hints: {
    withdrawVerb: 'Pull',
    payDebtVerb: 'Pay down',
    currentMax: (maxAmount: number) => `Current max is ${formatMoney(maxAmount)}.`,
    readyUpTo: (verb: string, maxAmount: number) =>
      `${verb} up to ${formatMoney(maxAmount)}.`,
    noCashToStash: 'No cash available to stash right now.',
    noBankReserve: 'No bank reserve available to withdraw.',
    debtCleared: 'Debt is cleared.',
    noCashForDebt: 'No cash available to pay debt.',
    loanCeilingReached: 'Loan ceiling already reached for this run.',
    offMarket:
      'Off market here. You can only unload this elsewhere.',
    buyLimitAndInventory: (maxBuy: number, maxSell: number) =>
      `Buy limit ${maxBuy} units. Inventory on hand ${maxSell}.`,
    buyLimit: (maxBuy: number) => `Buy limit ${maxBuy} units at this price.`,
    inventoryOnly: (maxSell: number) =>
      `You only hold ${maxSell} units right now.`,
    buySellRange: (maxBuy: number, maxSell: number) =>
      `Buy up to ${maxBuy}. Sell up to ${maxSell}.`,
  },
  map: {
    focus: (cityLabel: string) => `Focus: ${cityLabel}`,
    heat: (cops: number) => `Heat ${cops}%`,
    lowHeat: 'Low heat',
    activeCorridor: 'Active corridor',
    hotZone: 'Hot zone',
    travelTo: (cityLabel: string) => `Travel to ${cityLabel}`,
  },
  game: {
    runStartedTitle: 'Run started',
    startingHeadline: (cityLabel: string) =>
      `Fresh off the curb in ${cityLabel}. Thirty days to stack cash.`,
    runStarted: (shortLabel: string, cash: number, debt: number) =>
      `Opened the ${shortLabel} run with ${formatMoney(cash)} cash and ${formatMoney(debt)} in debt.`,
    alreadyWorking: (cityLabel: string) =>
      `You are already working ${cityLabel}.`,
    runClockSpent:
      'The run clock is spent. Settle inventory, work the bank, and close the books.',
    shiftedOperations: (cityLabel: string, cops: number) =>
      `Shifted operations to ${cityLabel}. Street heat is running ${cops}%.`,
    finalDayReached:
      'Final day reached. Sell off, settle your money, and finalize the run when ready.',
    movedToTitle: (cityLabel: string) => `Moved to ${cityLabel}`,
    movedToDetail: (debt: number, day: number) =>
      `Debt rolled to ${formatMoney(debt)} and the market reset for day ${day}.`,
    buyQuantityRequired: 'Set a quantity higher than zero before you buy.',
    dryMarket: (drugLabel: string, cityLabel: string) =>
      `${drugLabel} is dry in ${cityLabel} today.`,
    needMoreStashSpace: 'You need more stash space.',
    notEnoughCash: 'You do not have enough cash for that pickup.',
    tooHurtToMove:
      'You are too beat up to travel. Patch up before you move again.',
    shakedownNews: (amount: number) =>
      `A roadside shakedown cost you ${formatMoney(amount)} in cash.`,
    shakedownTitle: 'Roadside shakedown',
    shakedownDetail: (cityLabel: string, amount: number) =>
      `Heat on the way into ${cityLabel} forced you to drop ${formatMoney(amount)} to keep moving.`,
    roughRideNews: (damage: number) =>
      `A rough stop left you down ${damage} health.`,
    roughRideTitle: 'Rough stop',
    roughRideDetail: (cityLabel: string, health: number) =>
      `Pressure around ${cityLabel} knocked you down to ${health}% health.`,
    stashSweepNews: (quantity: number, drugLabel: string) =>
      `A patrol sweep ripped ${quantity} ${drugLabel} out of your stash.`,
    stashSweepTitle: (quantity: number, drugLabel: string) =>
      `Lost ${quantity} ${drugLabel}`,
    stashSweepDetail: (cityLabel: string) =>
      `A hot approach into ${cityLabel} cost you part of the stash before the market even opened.`,
    luckyBreakNews: (amount: number) =>
      `A quiet back-channel handoff put ${formatMoney(amount)} in your pocket.`,
    luckyBreakTitle: 'Lucky break',
    luckyBreakDetail: (cityLabel: string, amount: number) =>
      `A contact near ${cityLabel} handed you a soft ${formatMoney(amount)} score on arrival.`,
    boughtNews: (quantity: number, drugLabel: string, price: number) =>
      `Bought ${quantity} ${drugLabel} at ${formatMoney(price)} each.`,
    boughtTitle: (quantity: number, drugLabel: string) =>
      `Bought ${quantity} ${drugLabel}`,
    boughtDetail: (total: number, cityLabel: string) =>
      `Spent ${formatMoney(total)} in ${cityLabel}.`,
    sellQuantityRequired: 'Set a quantity higher than zero before you sell.',
    notMoving: (drugLabel: string, cityLabel: string) =>
      `${drugLabel} is not moving in ${cityLabel} today.`,
    doNotOwn: (quantity: number, drugLabel: string) =>
      `You do not own ${quantity} ${drugLabel}.`,
    soldNews: (quantity: number, drugLabel: string, price: number) =>
      `Sold ${quantity} ${drugLabel} at ${formatMoney(price)} each.`,
    soldTitle: (quantity: number, drugLabel: string) =>
      `Sold ${quantity} ${drugLabel}`,
    soldDetail: (total: number, cityLabel: string) =>
      `Pulled in ${formatMoney(total)} in ${cityLabel}.`,
    depositAmountRequired: 'Enter a deposit amount higher than zero.',
    depositTooHigh: 'You cannot stash more cash than you are carrying.',
    depositedNews: (amount: number) =>
      `Deposited ${formatMoney(amount)} into the bank.`,
    depositedTitle: (amount: number) => `Deposited ${formatMoney(amount)}`,
    depositedDetail: (bankDeposit: number) =>
      `Bank reserve climbed to ${formatMoney(bankDeposit)}.`,
    withdrawAmountRequired: 'Enter a withdrawal amount higher than zero.',
    withdrawTooHigh: 'Your bank reserve is not that deep.',
    withdrewNews: (amount: number) =>
      `Withdrew ${formatMoney(amount)} from the bank.`,
    withdrewTitle: (amount: number) => `Withdrew ${formatMoney(amount)}`,
    withdrewDetail: (cash: number) =>
      `Cash on hand is now ${formatMoney(cash)}.`,
    paymentAmountRequired: 'Enter a payment amount higher than zero.',
    paymentTooHigh:
      'You cannot pay more debt than your cash on hand or remaining balance.',
    paidDebtNews: (amount: number) =>
      `Paid down ${formatMoney(amount)} in debt.`,
    paidDebtTitle: (amount: number) =>
      `Paid ${formatMoney(amount)} toward debt`,
    paidDebtDetail: (debt: number) =>
      `Outstanding debt dropped to ${formatMoney(debt)}.`,
    borrowAmountRequired: 'Enter a borrow amount higher than zero.',
    noCreditAvailable: 'No more credit is available on this run.',
    borrowTooHigh:
      'That would push your debt past the current loan ceiling.',
    borrowedNews: (amount: number) =>
      `Borrowed ${formatMoney(amount)} against the next collection day.`,
    borrowedTitle: (amount: number) => `Borrowed ${formatMoney(amount)}`,
    borrowedDetail: (cash: number, debt: number) =>
      `Cash rose to ${formatMoney(cash)} while debt climbed to ${formatMoney(debt)}.`,
    noRecoveryNeeded: 'You do not need to patch up right now.',
    noRecoveryCash: 'You do not have the cash to patch yourself up.',
    recoveredHealthNews: (health: number, cost: number) =>
      `You patched up ${health} health for ${formatMoney(cost)}.`,
    recoveredHealthTitle: (health: number) => `Patched up ${health} health`,
    recoveredHealthDetail: (health: number) =>
      `Condition improved to ${health}% before the next move.`,
  },
}

export const LOCALES = [EN_US_LOCALE]

export const DEFAULT_LOCALE = EN_US_LOCALE

export function getLocale(localeId: LocaleId = DEFAULT_LOCALE.id) {
  return LOCALES.find((locale) => locale.id === localeId) ?? DEFAULT_LOCALE
}
