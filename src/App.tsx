import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { DEFAULT_CONTENT_PACK, getContentPack } from './game/content'
import { MapScene } from './components/MapScene'
import {
  borrowMoney,
  buildRunSummary,
  buyDrug,
  createNewGame,
  depositCash,
  getCurrentCity,
  getMaxBorrowAmount,
  getMaxBuyQuantity,
  getMaxDebtPayment,
  getMaxDepositAmount,
  getMaxSellQuantity,
  getMaxWithdrawAmount,
  getNetWorth,
  getUsedSpace,
  isRunOver,
  payDebt,
  sellDrug,
  travelToCity,
  withdrawCash,
} from './game/core'
import {
  clearSavedGame,
  loadHighScores,
  loadSavedGame,
  recordHighScore,
  saveGame,
} from './game/storage'
import type {
  CityId,
  DrugId,
  GameState,
  HighScoreEntry,
  MarketOffer,
} from './game/types'

type AppScreen = 'menu' | 'run' | 'summary'
type FinanceDraftKey = 'deposit' | 'withdraw' | 'payDebt' | 'borrow'

const moneyFormatter = new Intl.NumberFormat('en-US')
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function createTradeDrafts(drugIds = DEFAULT_CONTENT_PACK.drugs.map((drug) => drug.id)) {
  return drugIds.reduce(
    (drafts, drug) => {
      drafts[drug] = ''
      return drafts
    },
    {} as Record<DrugId, string>,
  )
}

function createFinanceDrafts() {
  return {
    deposit: '',
    withdraw: '',
    payDebt: '',
    borrow: '',
  }
}

function sanitizeNumericInput(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, '')

  if (digitsOnly === '') {
    return ''
  }

  return String(Number.parseInt(digitsOnly, 10))
}

function parsePositiveInteger(value: string) {
  if (value.trim() === '') {
    return null
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function formatMoney(value: number) {
  const absolute = moneyFormatter.format(Math.abs(value))
  return value < 0 ? `-$${absolute}` : `$${absolute}`
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function getCityById(cityId: CityId, cityIds: typeof DEFAULT_CONTENT_PACK.cities) {
  return cityIds.find((city) => city.id === cityId) ?? cityIds[0]
}

function modifierLabel(modifier: MarketOffer['modifier']) {
  if (modifier === 'cheap') {
    return 'Flooded'
  }

  if (modifier === 'expensive') {
    return 'Burning'
  }

  return 'Steady'
}

function heatLabel(cops: number) {
  if (cops < 20) {
    return 'Low profile'
  }

  if (cops < 50) {
    return 'Manageable heat'
  }

  return 'Red hot'
}

function actionLimitHint(
  amount: number | null,
  maxAmount: number,
  readyText: string,
  emptyText: string,
) {
  if (maxAmount <= 0) {
    return {
      error: false,
      text: emptyText,
    }
  }

  if (amount !== null && amount > maxAmount) {
    return {
      error: true,
      text: `Current max is ${formatMoney(maxAmount)}.`,
    }
  }

  return {
    error: false,
    text: `${readyText} up to ${formatMoney(maxAmount)}.`,
  }
}

function tradeHint(
  amount: number | null,
  maxBuy: number,
  maxSell: number,
  available: boolean,
) {
  if (!available) {
    return {
      error: false,
      text: `Off market here. You can only unload this elsewhere.`,
    }
  }

  if (amount !== null && amount > maxBuy && amount > maxSell) {
    return {
      error: true,
      text: `Buy limit ${maxBuy} units. Inventory on hand ${maxSell}.`,
    }
  }

  if (amount !== null && amount > maxBuy) {
    return {
      error: true,
      text: `Buy limit ${maxBuy} units at this price.`,
    }
  }

  if (amount !== null && amount > maxSell) {
    return {
      error: true,
      text: `You only hold ${maxSell} units right now.`,
    }
  }

  return {
    error: false,
    text: `Buy up to ${maxBuy}. Sell up to ${maxSell}.`,
  }
}

function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const [game, setGame] = useState<GameState | null>(null)
  const [resumeGame, setResumeGame] = useState<GameState | null>(() => loadSavedGame())
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() =>
    loadHighScores(),
  )
  const [lastSummary, setLastSummary] = useState<HighScoreEntry | null>(null)
  const [focusedCityId, setFocusedCityId] = useState<CityId>(
    DEFAULT_CONTENT_PACK.cities[0]?.id ?? '',
  )
  const [tradeDrafts, setTradeDrafts] = useState<Record<DrugId, string>>(
    () => createTradeDrafts(),
  )
  const [financeDrafts, setFinanceDrafts] = useState(createFinanceDrafts)

  useEffect(() => {
    if (screen !== 'run' || !game) {
      return
    }

    saveGame(game)
  }, [game, screen])

  function openRun(nextGame: GameState) {
    const nextContent = getContentPack(nextGame.contentPackId)

    setGame(nextGame)
    setFocusedCityId(nextGame.currentCityId)
    setTradeDrafts(createTradeDrafts(nextContent.drugs.map((drug) => drug.id)))
    setFinanceDrafts(createFinanceDrafts())
    setScreen('run')
  }

  function startNewRun() {
    clearSavedGame()
    setResumeGame(null)
    openRun(createNewGame())
  }

  function continueSavedRun() {
    if (!resumeGame) {
      return
    }

    openRun(resumeGame)
  }

  function saveAndReturnToMenu() {
    if (game) {
      saveGame(game)
      setResumeGame(game)
    }

    setGame(null)
    setScreen('menu')
  }

  function finalizeRun() {
    if (!game) {
      return
    }

    const summary: HighScoreEntry = {
      ...buildRunSummary(game),
      recordedAt: new Date().toISOString(),
    }

    setHighScores(recordHighScore(summary))
    setLastSummary(summary)
    clearSavedGame()
    setResumeGame(null)
    setGame(null)
    setTradeDrafts(createTradeDrafts())
    setFinanceDrafts(createFinanceDrafts())
    setScreen('summary')
  }

  function setDraft(drugId: DrugId, nextValue: string) {
    setTradeDrafts((current) => ({
      ...current,
      [drugId]: sanitizeNumericInput(nextValue),
    }))
  }

  function setFinanceDraft(field: FinanceDraftKey, nextValue: string) {
    setFinanceDrafts((current) => ({
      ...current,
      [field]: sanitizeNumericInput(nextValue),
    }))
  }

  function clearFinanceDraft(field: FinanceDraftKey) {
    setFinanceDraft(field, '')
  }

  function fillMaxBuy(drugId: DrugId) {
    if (!game) {
      return
    }

    const maxBuy = getMaxBuyQuantity(game, drugId)
    setDraft(drugId, maxBuy > 0 ? String(maxBuy) : '')
  }

  function fillMaxSell(drugId: DrugId) {
    if (!game) {
      return
    }

    const maxSell = getMaxSellQuantity(game, drugId)
    setDraft(drugId, maxSell > 0 ? String(maxSell) : '')
  }

  function commitBuy(drugId: DrugId) {
    const quantity = parsePositiveInteger(tradeDrafts[drugId]) ?? 0

    setGame((current) => (current ? buyDrug(current, drugId, quantity) : current))
    setDraft(drugId, '')
  }

  function commitSell(drugId: DrugId) {
    const quantity = parsePositiveInteger(tradeDrafts[drugId]) ?? 0

    setGame((current) =>
      current ? sellDrug(current, drugId, quantity) : current,
    )
    setDraft(drugId, '')
  }

  function handleTravel(cityId: CityId) {
    setFocusedCityId(cityId)
    setGame((current) =>
      current ? travelToCity(current, cityId) : current,
    )
  }

  function commitFinanceAction(
    field: FinanceDraftKey,
    action: (state: GameState, amount: number) => GameState,
  ) {
    const amount = parsePositiveInteger(financeDrafts[field]) ?? 0

    setGame((current) => (current ? action(current, amount) : current))
    clearFinanceDraft(field)
  }

  const resumeContent = resumeGame
    ? getContentPack(resumeGame.contentPackId)
    : DEFAULT_CONTENT_PACK
  const resumeSummary = resumeGame ? buildRunSummary(resumeGame) : null
  const latestRank = lastSummary
    ? highScores.findIndex((entry) => entry.runId === lastSummary.runId) + 1
    : 0

  if (screen === 'menu') {
    return (
      <main className="shell shell--centered">
        <section className="panel launch-screen">
          <div className="launch-screen__copy">
            <p className="eyebrow">Default content pack</p>
            <h1>Local Dope Wars</h1>
            <p className="hero__lede">
              The current build still ships with the {resumeContent.label} layout by
              default, but Phase 1 now has the structure for persistent runs,
              cleaner financial play, and proper end-of-run handoff.
            </p>
            <div className="hero__ticker">
              <span>{resumeContent.shortLabel} starter pack loaded</span>
              <span>Thirty-day run format</span>
              <span>Autosave + high scores enabled</span>
            </div>
          </div>

          <div className="launch-screen__card">
            <p className="meta-label">
              {resumeSummary ? 'Saved run ready' : 'Fresh run ready'}
            </p>
            <h2>
              {resumeSummary
                ? `${resumeSummary.cityLabel}, day ${resumeSummary.day}`
                : 'Thirty nights to build a stack'}
            </h2>
            <p className="launch-screen__summary">
              {resumeSummary
                ? `Resume with ${formatMoney(resumeSummary.score)} in net worth, ${formatMoney(resumeSummary.cash)} cash, and ${formatMoney(resumeSummary.debt)} debt still hanging over the run.`
                : `Open a new ${resumeContent.shortLabel} run with cash in pocket, debt on your back, and the county map ready to work.`}
            </p>
            <div className="launch-screen__actions">
              {resumeSummary ? (
                <button className="ghost-button" onClick={continueSavedRun}>
                  Continue saved run
                </button>
              ) : null}
              <button className="accent-button" onClick={startNewRun}>
                Start new run
              </button>
            </div>
          </div>
        </section>

        <section className="launch-grid">
          <article className="panel launch-card">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Top runs</p>
                <h2>High scores</h2>
              </div>
              <p className="news-panel__summary">
                Best closed-out runs from this browser.
              </p>
            </div>

            {highScores.length > 0 ? (
              <ol className="scoreboard">
                {highScores.map((entry, index) => (
                  <li key={`${entry.runId}-${entry.recordedAt}`} className="scoreboard__item">
                    <div>
                      <p className="scoreboard__rank">#{index + 1}</p>
                      <p className="scoreboard__title">
                        {entry.contentLabel} · {entry.cityLabel} · Day {entry.day}
                      </p>
                      <p className="scoreboard__detail">{entry.tierMessage}</p>
                    </div>
                    <div className="scoreboard__score">
                      <strong>{formatMoney(entry.score)}</strong>
                      <span>{formatDate(entry.recordedAt)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-state">
                No finished runs recorded yet. Close one out to seed the board.
              </p>
            )}
          </article>

          <article className="panel launch-card">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Phase 1 slice</p>
                <h2>What changed</h2>
              </div>
            </div>
            <ul className="feature-list">
              <li>Runs now autosave and can be resumed from the launch screen.</li>
              <li>Banking, withdrawals, debt payoff, and borrowing are live.</li>
              <li>The run can be formally closed with a score summary and leaderboard entry.</li>
              <li>A dedicated activity ledger now tracks the moves that matter.</li>
            </ul>
          </article>
        </section>
      </main>
    )
  }

  if (screen === 'summary' && lastSummary) {
    return (
      <main className="shell shell--centered">
        <section className="panel summary-screen">
          <p className="eyebrow">Run closed</p>
          <h1>{formatMoney(lastSummary.score)}</h1>
          <p className="summary-screen__lede">{lastSummary.tierMessage}</p>
          <div className="summary-screen__chips">
            <span>{lastSummary.cityLabel}</span>
            <span>
              Day {lastSummary.day} / {lastSummary.endDay}
            </span>
            <span>{latestRank > 0 ? `Leaderboard rank #${latestRank}` : 'Run logged'}</span>
          </div>

          <div className="summary-screen__stats">
            <article className="summary-stat">
              <p className="meta-label">Cash</p>
              <p>{formatMoney(lastSummary.cash)}</p>
            </article>
            <article className="summary-stat">
              <p className="meta-label">Bank</p>
              <p>{formatMoney(lastSummary.bankDeposit)}</p>
            </article>
            <article className="summary-stat">
              <p className="meta-label">Inventory value</p>
              <p>{formatMoney(lastSummary.inventoryValue)}</p>
            </article>
            <article className="summary-stat">
              <p className="meta-label">Debt</p>
              <p>{formatMoney(lastSummary.debt)}</p>
            </article>
          </div>

          <div className="summary-screen__actions">
            <button className="ghost-button" onClick={() => setScreen('menu')}>
              Back to launch board
            </button>
            <button className="accent-button" onClick={startNewRun}>
              Start another run
            </button>
          </div>
        </section>

        <section className="panel launch-card">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Top runs</p>
              <h2>Current leaderboard</h2>
            </div>
          </div>
          <ol className="scoreboard">
            {highScores.map((entry, index) => (
              <li key={`${entry.runId}-${entry.recordedAt}`} className="scoreboard__item">
                <div>
                  <p className="scoreboard__rank">#{index + 1}</p>
                  <p className="scoreboard__title">
                    {entry.contentLabel} · {entry.cityLabel} · Day {entry.day}
                  </p>
                  <p className="scoreboard__detail">{entry.tierMessage}</p>
                </div>
                <div className="scoreboard__score">
                  <strong>{formatMoney(entry.score)}</strong>
                  <span>{formatDate(entry.recordedAt)}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    )
  }

  if (!game) {
    return null
  }

  const content = getContentPack(game.contentPackId)
  const cities = content.cities
  const drugs = content.drugs
  const currentCity = getCurrentCity(game)
  const focusedCity = getCityById(focusedCityId, cities)
  const usedSpace = getUsedSpace(game)
  const runValue = getNetWorth(game)
  const runClosed = isRunOver(game)
  const liveOffers = drugs.filter((drug) => game.market[drug.id].available)
  const daysRemaining = Math.max(game.endDay - game.day, 0)
  const dayProgress = Math.min((game.day / game.endDay) * 100, 100)
  const maxDeposit = getMaxDepositAmount(game)
  const maxWithdraw = getMaxWithdrawAmount(game)
  const maxDebtPayment = getMaxDebtPayment(game)
  const maxBorrow = getMaxBorrowAmount(game)
  const depositAmount = parsePositiveInteger(financeDrafts.deposit)
  const withdrawAmount = parsePositiveInteger(financeDrafts.withdraw)
  const debtPaymentAmount = parsePositiveInteger(financeDrafts.payDebt)
  const borrowAmount = parsePositiveInteger(financeDrafts.borrow)
  const cheapestOffer =
    liveOffers.length > 0
      ? liveOffers.reduce((best, candidate) =>
          game.market[candidate.id].price < game.market[best.id].price
            ? candidate
            : best,
        )
      : undefined
  const priciestOffer =
    liveOffers.length > 0
      ? liveOffers.reduce((best, candidate) =>
          game.market[candidate.id].price > game.market[best.id].price
            ? candidate
            : best,
        )
      : undefined
  const inventoryLeader = drugs.reduce<{
    drugId: DrugId | null
    quantity: number
  }>(
    (leader, drug) => {
      const quantity = game.inventory[drug.id]

      if (quantity > leader.quantity) {
        return {
          drugId: drug.id,
          quantity,
        }
      }

      return leader
    },
    {
      drugId: null,
      quantity: 0,
    },
  )
  const inventoryLeaderDrug = inventoryLeader.drugId
    ? drugs.find((drug) => drug.id === inventoryLeader.drugId)
    : undefined
  const featuredModifierDrug =
    liveOffers.find((drug) => game.market[drug.id].modifier !== 'standard') ??
    cheapestOffer
  const depositHint = actionLimitHint(
    depositAmount,
    maxDeposit,
    'Move',
    'No cash available to stash right now.',
  )
  const withdrawHint = actionLimitHint(
    withdrawAmount,
    maxWithdraw,
    'Pull',
    'No bank reserve available to withdraw.',
  )
  const payDebtHint = actionLimitHint(
    debtPaymentAmount,
    maxDebtPayment,
    'Pay down',
    game.debt <= 0 ? 'Debt is cleared.' : 'No cash available to pay debt.',
  )
  const borrowHint = actionLimitHint(
    borrowAmount,
    maxBorrow,
    'Borrow',
    'Loan ceiling already reached for this run.',
  )

  return (
    <main className="shell">
      <header className="panel hero">
        <div className="hero__copy">
          <p className="eyebrow">Operational dashboard</p>
          <h1>Local Dope Wars</h1>
          <p className="hero__lede">
            The {content.shortLabel} starter map is still the active default pack, but the
            run now carries proper persistence, a working bank layer, and a
            clean way to close the books when the thirty-day clock runs out.
          </p>
          <div className="hero__ticker">
            <span>{currentCity.district}</span>
            <span>{liveOffers.length} live products tonight</span>
            <span>{daysRemaining} nights left in the run</span>
          </div>
        </div>
        <div className="hero__meta">
          <div className="hero__meta-row">
            <div>
              <p className="meta-label">Operating city</p>
              <p className="meta-value">{currentCity.label}</p>
            </div>
            <div>
              <p className="meta-label">Run clock</p>
              <p className="meta-value">
                Day {game.day} / {game.endDay}
              </p>
            </div>
          </div>
          <div className="progress-cluster">
            <div className="progress-cluster__copy">
              <p className="meta-label">Campaign progress</p>
              <p className="progress-cluster__value">
                {Math.round(dayProgress)}%
              </p>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span
                className="progress-track__fill"
                style={{ width: `${dayProgress}%` }}
              />
            </div>
            <p className="progress-cluster__note">
              {runClosed
                ? 'Final day reached. You can still settle inventory and finances before closing the run.'
                : `${daysRemaining} nights remain before the books close. This run autosaves after each move.`}
            </p>
          </div>
          <div className="hero__actions">
            <button className="ghost-button" onClick={saveAndReturnToMenu}>
              Save and exit
            </button>
            <button className="hero__reset" onClick={startNewRun}>
              New run
            </button>
          </div>
        </div>
      </header>

      {runClosed ? (
        <section className="panel run-status">
          <div>
            <p className="eyebrow">Run complete</p>
            <h2>Close the books when you are ready</h2>
            <p className="run-status__copy">
              Travel is locked now, but you can still liquidate the stash, work
              the bank, and pay debt before filing the final score.
            </p>
          </div>
          <div className="run-status__actions">
            <div>
              <p className="meta-label">Current score preview</p>
              <p className="run-status__value">{formatMoney(runValue)}</p>
            </div>
            <button className="accent-button" onClick={finalizeRun}>
              Finalize run
            </button>
          </div>
        </section>
      ) : null}

      <section className="stats-grid">
        <article className="panel stat-card">
          <p className="meta-label">Cash on hand</p>
          <p className="stat-card__value">{formatMoney(game.cash)}</p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">Bank reserve</p>
          <p className="stat-card__value">{formatMoney(game.bankDeposit)}</p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">Debt pressure</p>
          <p className="stat-card__value">{formatMoney(game.debt)}</p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">Stash space</p>
          <p className="stat-card__value">
            {usedSpace}/{game.totalSpace}
          </p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">Run value</p>
          <p className="stat-card__value">{formatMoney(runValue)}</p>
        </article>
      </section>

      <section className="signal-grid">
        <article className="panel signal-card">
          <p className="eyebrow">Cheapest lane</p>
          <h2>{cheapestOffer?.label ?? 'No open market'}</h2>
          <p className="signal-card__value">
            {cheapestOffer
              ? formatMoney(game.market[cheapestOffer.id].price)
              : 'Unavailable'}
          </p>
          <p className="signal-card__meta">
            Lowest price currently moving in {currentCity.label}.
          </p>
        </article>

        <article className="panel signal-card">
          <p className="eyebrow">Highest ticket</p>
          <h2>{priciestOffer?.label ?? 'No open market'}</h2>
          <p className="signal-card__value">
            {priciestOffer
              ? formatMoney(game.market[priciestOffer.id].price)
              : 'Unavailable'}
          </p>
          <p className="signal-card__meta">
            Biggest single-unit payout on the board right now.
          </p>
        </article>

        <article className="panel signal-card">
          <p className="eyebrow">Market pulse</p>
          <h2>{featuredModifierDrug?.label ?? currentCity.label}</h2>
          <p className="signal-card__value">
            {featuredModifierDrug
              ? modifierLabel(game.market[featuredModifierDrug.id].modifier)
              : heatLabel(currentCity.cops)}
          </p>
          <p className="signal-card__meta">
            {featuredModifierDrug
              ? 'The loudest pricing shift currently on the board.'
              : 'No special modifiers are active tonight.'}
          </p>
        </article>

        <article className="panel signal-card">
          <p className="eyebrow">Bag leader</p>
          <h2>{inventoryLeaderDrug?.label ?? 'Empty stash'}</h2>
          <p className="signal-card__value">
            {inventoryLeaderDrug ? `${inventoryLeader.quantity} units` : '0 units'}
          </p>
          <p className="signal-card__meta">
            {inventoryLeaderDrug
              ? 'Largest stack currently in inventory.'
              : 'No inventory yet, so the board is clean.'}
          </p>
        </article>
      </section>

      <section className="ops-grid">
        <article className="panel finance-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Finance desk</p>
              <h2>Bank and debt</h2>
            </div>
            <p className="news-panel__summary">
              Move cash, protect winnings, and decide how hard to lean on the
              loan ceiling.
            </p>
          </div>

          <div className="finance-panel__summary">
            <div className="finance-summary-card">
              <p className="meta-label">Bank reserve</p>
              <p>{formatMoney(game.bankDeposit)}</p>
            </div>
            <div className="finance-summary-card">
              <p className="meta-label">Outstanding debt</p>
              <p>{formatMoney(game.debt)}</p>
            </div>
            <div className="finance-summary-card">
              <p className="meta-label">Credit remaining</p>
              <p>{formatMoney(maxBorrow)}</p>
            </div>
          </div>

          <div className="finance-panel__grid">
            <label className="finance-control">
              <span>Deposit to bank</span>
              <div className="finance-control__row">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={financeDrafts.deposit}
                  onChange={(event) =>
                    setFinanceDraft('deposit', event.target.value)
                  }
                />
                <button
                  className="ghost-button"
                  disabled={
                    depositAmount === null ||
                    maxDeposit <= 0 ||
                    depositAmount > maxDeposit
                  }
                  onClick={() => commitFinanceAction('deposit', depositCash)}
                >
                  Deposit
                </button>
              </div>
              <p
                className={`finance-control__hint${
                  depositHint.error ? ' finance-control__hint--error' : ''
                }`}
              >
                {depositHint.text}
              </p>
            </label>

            <label className="finance-control">
              <span>Withdraw from bank</span>
              <div className="finance-control__row">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={financeDrafts.withdraw}
                  onChange={(event) =>
                    setFinanceDraft('withdraw', event.target.value)
                  }
                />
                <button
                  className="ghost-button"
                  disabled={
                    withdrawAmount === null ||
                    maxWithdraw <= 0 ||
                    withdrawAmount > maxWithdraw
                  }
                  onClick={() =>
                    commitFinanceAction('withdraw', withdrawCash)
                  }
                >
                  Withdraw
                </button>
              </div>
              <p
                className={`finance-control__hint${
                  withdrawHint.error ? ' finance-control__hint--error' : ''
                }`}
              >
                {withdrawHint.text}
              </p>
            </label>

            <label className="finance-control">
              <span>Pay debt</span>
              <div className="finance-control__row">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={financeDrafts.payDebt}
                  onChange={(event) =>
                    setFinanceDraft('payDebt', event.target.value)
                  }
                />
                <button
                  className="ghost-button"
                  disabled={
                    debtPaymentAmount === null ||
                    maxDebtPayment <= 0 ||
                    debtPaymentAmount > maxDebtPayment
                  }
                  onClick={() => commitFinanceAction('payDebt', payDebt)}
                >
                  Pay
                </button>
              </div>
              <p
                className={`finance-control__hint${
                  payDebtHint.error ? ' finance-control__hint--error' : ''
                }`}
              >
                {payDebtHint.text}
              </p>
            </label>

            <label className="finance-control">
              <span>Borrow more cash</span>
              <div className="finance-control__row">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={financeDrafts.borrow}
                  onChange={(event) =>
                    setFinanceDraft('borrow', event.target.value)
                  }
                />
                <button
                  className="ghost-button"
                  disabled={
                    borrowAmount === null ||
                    maxBorrow <= 0 ||
                    borrowAmount > maxBorrow
                  }
                  onClick={() => commitFinanceAction('borrow', borrowMoney)}
                >
                  Borrow
                </button>
              </div>
              <p
                className={`finance-control__hint${
                  borrowHint.error ? ' finance-control__hint--error' : ''
                }`}
              >
                {borrowHint.text}
              </p>
            </label>
          </div>
        </article>

        <aside className="panel activity-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Ledger</p>
              <h2>Activity log</h2>
            </div>
            <p className="news-panel__summary">
              Recent trades, travel, and finance actions for this run.
            </p>
          </div>
          <ol className="activity-list">
            {game.activity.map((item) => (
              <li
                key={item.id}
                className={`activity-item activity-item--${item.kind}`}
              >
                <div className="activity-item__meta">
                  <span>Day {item.day}</span>
                  <span>{item.kind}</span>
                </div>
                <p className="activity-item__title">{item.title}</p>
                <p className="activity-item__detail">{item.detail}</p>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="overview-grid">
        <article className="panel city-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Territory scene</p>
              <h2>{content.map.title}</h2>
            </div>
            <div className="heat-cluster">
              <span className="heat-cluster__label">{heatLabel(currentCity.cops)}</span>
              <div className="heat-meter" aria-hidden="true">
                <span
                  className="heat-meter__fill"
                  style={{ width: `${currentCity.cops}%` }}
                />
              </div>
            </div>
          </div>

          <div className="city-panel__body">
            <MapScene
              map={content.map}
              cities={cities}
              currentCityId={game.currentCityId}
              focusedCityId={focusedCityId}
              disableTravel={runClosed}
              onFocusCity={setFocusedCityId}
              onTravelCity={handleTravel}
            />

            <div className="city-brief">
              <p className="eyebrow">Focused city</p>
              <h3>{focusedCity.label}</h3>
              <p>{focusedCity.atmosphere}</p>
              <div className="city-brief__chips">
                <span>{focusedCity.district}</span>
                <span>{focusedCity.landmark}</span>
              </div>
              <dl className="city-brief__stats">
                <div>
                  <dt>Heat</dt>
                  <dd>{focusedCity.cops}%</dd>
                </div>
                <div>
                  <dt>Signature</dt>
                  <dd>{focusedCity.signature}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {focusedCity.id === game.currentCityId
                      ? 'Current territory'
                      : runClosed
                        ? 'Travel locked'
                        : 'Available to travel'}
                  </dd>
                </div>
              </dl>
              <button
                className="accent-button city-brief__action"
                disabled={focusedCity.id === game.currentCityId || runClosed}
                onClick={() => handleTravel(focusedCity.id)}
              >
                {focusedCity.id === game.currentCityId
                  ? 'Current territory'
                  : runClosed
                    ? 'Travel locked'
                    : `Travel to ${focusedCity.label}`}
              </button>
            </div>
          </div>
        </article>

        <aside className="panel news-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Street chatter</p>
              <h2>Signal feed</h2>
            </div>
            <p className="news-panel__summary">
              Market headlines, travel signals, and warnings from the run.
            </p>
          </div>
          <ol className="news-list">
            {game.news.map((item) => (
              <li key={item.id} className={`news-item news-item--${item.tone}`}>
                {item.text}
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="panel market-panel">
        <div className="panel__header market-panel__header">
          <div>
            <p className="eyebrow">Trading floor</p>
            <h2>Market board</h2>
          </div>
          <p className="market-panel__note">
            Trading still runs on the pure game core, but now the board gives
            clearer input limits so you can see edge cases before a move fires.
          </p>
        </div>

        <div className="offer-grid">
          {drugs.map((drug) => {
            const offer = game.market[drug.id]
            const inventory = game.inventory[drug.id]
            const maxBuy = getMaxBuyQuantity(game, drug.id)
            const maxSell = getMaxSellQuantity(game, drug.id)
            const draftQuantity = parsePositiveInteger(tradeDrafts[drug.id])
            const hint = tradeHint(draftQuantity, maxBuy, maxSell, offer.available)
            const buyDisabled =
              !offer.available ||
              draftQuantity === null ||
              draftQuantity > maxBuy
            const sellDisabled =
              maxSell === 0 ||
              draftQuantity === null ||
              draftQuantity > maxSell

            return (
              <article
                key={drug.id}
                className={`offer-card${
                  offer.available ? '' : ' offer-card--muted'
                }`}
                style={
                  {
                    '--offer-accent': drug.accent,
                    '--offer-glow': `${drug.accent}33`,
                  } as CSSProperties
                }
              >
                <div className="offer-card__top">
                  <div>
                    <p className="offer-card__kicker">{drug.flavor}</p>
                    <h3>{drug.label}</h3>
                  </div>
                  <div className="offer-card__price-block">
                    <span className="offer-card__price">
                      {offer.available ? formatMoney(offer.price) : 'Off market'}
                    </span>
                    <span className="offer-card__badge">
                      {offer.available ? modifierLabel(offer.modifier) : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="offer-card__stats">
                  <span>Owned {inventory}</span>
                  <span>
                    {offer.available
                      ? `Buying room ${maxBuy}`
                      : 'Travel to another city to move it'}
                  </span>
                </div>

                <label className="trade-field">
                  <span>Quantity</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    value={tradeDrafts[drug.id]}
                    onChange={(event) => setDraft(drug.id, event.target.value)}
                  />
                </label>
                <p
                  className={`offer-card__hint${
                    hint.error ? ' offer-card__hint--error' : ''
                  }`}
                >
                  {hint.text}
                </p>

                <div className="offer-card__actions">
                  <button
                    className="ghost-button"
                    disabled={maxBuy === 0}
                    onClick={() => fillMaxBuy(drug.id)}
                  >
                    Max buy
                  </button>
                  <button
                    className="accent-button"
                    disabled={buyDisabled}
                    onClick={() => commitBuy(drug.id)}
                  >
                    Buy
                  </button>
                  <button
                    className="ghost-button"
                    disabled={maxSell === 0}
                    onClick={() => fillMaxSell(drug.id)}
                  >
                    Max sell
                  </button>
                  <button
                    className="accent-button accent-button--secondary"
                    disabled={sellDisabled}
                    onClick={() => commitSell(drug.id)}
                  >
                    Sell
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App
