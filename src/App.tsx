import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { CONTENT_PACKS, DEFAULT_CONTENT_PACK, GAME_CONFIG, getContentPack } from './game/content'
import { DEFAULT_LOCALE } from './game/i18n'
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
  getHealthRecoveryCost,
  getMaxHealthRecoveryAmount,
  getMaxSellQuantity,
  getMaxWithdrawAmount,
  getNetWorth,
  getUsedSpace,
  isRunOver,
  payDebt,
  recoverHealth,
  sellDrug,
  travelToCity,
  withdrawCash,
} from './game/core'
import {
  clearSavedGame,
  loadHighScores,
  loadSelectedContentPackId,
  loadSavedGame,
  recordHighScore,
  saveGame,
  saveSelectedContentPackId,
} from './game/storage'
import type {
  CityId,
  ContentPackDefinition,
  ContentPackId,
  DrugId,
  GameState,
  HighScoreEntry,
} from './game/types'

type AppScreen = 'menu' | 'run' | 'summary'
type FinanceDraftKey = 'deposit' | 'withdraw' | 'payDebt' | 'borrow'
const locale = DEFAULT_LOCALE

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

function getCityById(cityId: CityId, cityIds: typeof DEFAULT_CONTENT_PACK.cities) {
  return cityIds.find((city) => city.id === cityId) ?? cityIds[0]
}

function getStartingCity(content: ContentPackDefinition) {
  const resolvedStartingCityId =
    content.startingCityId && content.cities.some((city) => city.id === content.startingCityId)
      ? content.startingCityId
      : content.cities[0]?.id

  return content.cities.find((city) => city.id === resolvedStartingCityId) ?? content.cities[0]
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
      text: locale.hints.currentMax(maxAmount),
    }
  }

  return {
    error: false,
    text: locale.hints.readyUpTo(readyText, maxAmount),
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
      text: locale.hints.offMarket,
    }
  }

  if (amount !== null && amount > maxBuy && amount > maxSell) {
    return {
      error: true,
      text: locale.hints.buyLimitAndInventory(maxBuy, maxSell),
    }
  }

  if (amount !== null && amount > maxBuy) {
    return {
      error: true,
      text: locale.hints.buyLimit(maxBuy),
    }
  }

  if (amount !== null && amount > maxSell) {
    return {
      error: true,
      text: locale.hints.inventoryOnly(maxSell),
    }
  }

  return {
    error: false,
    text: locale.hints.buySellRange(maxBuy, maxSell),
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
  const [selectedContentPackId, setSelectedContentPackId] = useState<ContentPackId>(
    () => loadSelectedContentPackId() ?? DEFAULT_CONTENT_PACK.id,
  )
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

  useEffect(() => {
    saveSelectedContentPackId(selectedContentPackId)
  }, [selectedContentPackId])

  function openRun(nextGame: GameState) {
    const nextContent = getContentPack(nextGame.contentPackId)

    setGame(nextGame)
    setSelectedContentPackId(nextGame.contentPackId)
    setFocusedCityId(nextGame.currentCityId)
    setTradeDrafts(createTradeDrafts(nextContent.drugs.map((drug) => drug.id)))
    setFinanceDrafts(createFinanceDrafts())
    setScreen('run')
  }

  function startNewRun() {
    clearSavedGame()
    setResumeGame(null)
    openRun(createNewGame(selectedContentPackId))
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
    setTradeDrafts(
      createTradeDrafts(
        getContentPack(selectedContentPackId).drugs.map((drug) => drug.id),
      ),
    )
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

  const selectedContent = getContentPack(selectedContentPackId)
  const selectedStartCity = getStartingCity(selectedContent)
  const resumeContent = resumeGame
    ? getContentPack(resumeGame.contentPackId)
    : selectedContent
  const resumeSummary = resumeGame ? buildRunSummary(resumeGame) : null
  const latestRank = lastSummary
    ? highScores.findIndex((entry) => entry.runId === lastSummary.runId) + 1
    : 0

  if (screen === 'menu') {
    return (
      <main className="shell shell--centered">
        <section className="panel launch-screen">
          <div className="launch-screen__copy">
            <p className="eyebrow">{locale.menu.eyebrow}</p>
            <h1>{locale.appTitle}</h1>
            <p className="hero__lede">
              {locale.menu.heroLede(
                selectedContent.label,
                selectedContent.description,
              )}
            </p>
            <div className="hero__ticker">
              <span>{locale.menu.starterPackLoaded(selectedContent.shortLabel)}</span>
              <span>{locale.menu.runFormat}</span>
              <span>{locale.menu.persistenceEnabled}</span>
            </div>
          </div>

          <div className="launch-screen__card">
            <p className="meta-label">
              {resumeSummary ? locale.menu.savedRunReady : locale.menu.freshRunReady}
            </p>
            <h2>
              {resumeSummary
                ? locale.menu.savedRunHeading(
                    resumeSummary.cityLabel,
                    resumeSummary.day,
                  )
                : locale.menu.freshRunHeading}
            </h2>
            <p className="launch-screen__summary">
              {resumeSummary
                ? locale.menu.savedRunSummary(
                    resumeSummary.score,
                    resumeSummary.cash,
                    resumeSummary.debt,
                  )
                : locale.menu.freshRunSummary(resumeContent.shortLabel)}
            </p>
            <div className="launch-screen__actions">
              {resumeSummary ? (
                <button className="ghost-button" onClick={continueSavedRun}>
                  {locale.menu.continueSavedRun}
                </button>
              ) : null}
              <button className="accent-button" onClick={startNewRun}>
                {locale.menu.startNewRun}
              </button>
            </div>
            <p className="launch-screen__note">
              {locale.menu.newRunArmedNote(selectedContent.label)}
            </p>
          </div>
        </section>

        <section className="launch-grid">
          <article className="panel launch-card">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{locale.menu.packSelectorEyebrow}</p>
                <h2>{locale.menu.packSelectorHeading}</h2>
              </div>
              <p className="news-panel__summary">
                {locale.menu.packSelectorSummary}
              </p>
            </div>

            <div className="pack-list">
              {CONTENT_PACKS.map((pack) => {
                const startCity = getStartingCity(pack)
                const isSelected = pack.id === selectedContentPackId

                return (
                  <button
                    key={pack.id}
                    type="button"
                    className={`pack-card${isSelected ? ' pack-card--selected' : ''}`}
                    style={
                      {
                        '--pack-accent': pack.accent,
                        '--pack-glow': `${pack.accent}33`,
                      } as CSSProperties
                    }
                    onClick={() => setSelectedContentPackId(pack.id)}
                  >
                    <div className="pack-card__top">
                      <div>
                        <p className="pack-card__eyebrow">
                          {pack.id === DEFAULT_CONTENT_PACK.id
                            ? locale.menu.builtInDefault
                            : locale.menu.alternateBundle}
                        </p>
                        <h3>{pack.label}</h3>
                      </div>
                      <span className="pack-card__status">
                        {isSelected
                          ? locale.menu.selectedForNewRuns
                          : locale.menu.useThisPack}
                      </span>
                    </div>
                    <p className="pack-card__description">{pack.description}</p>
                    <div className="pack-card__chips">
                      <span>{locale.menu.locationsCount(pack.cities.length)}</span>
                      {startCity ? (
                        <span>{locale.menu.startsIn(startCity.label)}</span>
                      ) : null}
                      <span>{pack.map.title}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <p className="launch-card__footer">
              {selectedStartCity
                ? locale.menu.packLaunchNote(
                    selectedContent.shortLabel,
                    selectedStartCity.label,
                  )
                : selectedContent.description}
            </p>
          </article>

          <article className="panel launch-card">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{locale.menu.topRunsEyebrow}</p>
                <h2>{locale.menu.highScoresHeading}</h2>
              </div>
              <p className="news-panel__summary">
                {locale.menu.highScoresSummary}
              </p>
            </div>

            {highScores.length > 0 ? (
              <ol className="scoreboard">
                {highScores.map((entry, index) => (
                  <li key={`${entry.runId}-${entry.recordedAt}`} className="scoreboard__item">
                    <div>
                      <p className="scoreboard__rank">{locale.formatRank(index + 1)}</p>
                      <p className="scoreboard__title">
                        {locale.formatScoreboardTitle(
                          entry.contentLabel,
                          entry.cityLabel,
                          entry.day,
                        )}
                      </p>
                      <p className="scoreboard__detail">{entry.tierMessage}</p>
                    </div>
                    <div className="scoreboard__score">
                      <strong>{locale.formatMoney(entry.score)}</strong>
                      <span>{locale.formatDate(entry.recordedAt)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-state">
                {locale.menu.emptyHighScores}
              </p>
            )}
          </article>

          <article className="panel launch-card">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{locale.menu.currentBuildEyebrow}</p>
                <h2>{locale.menu.currentBuildHeading}</h2>
              </div>
            </div>
            <ul className="feature-list">
              {locale.menu.currentBuildItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
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
          <p className="eyebrow">{locale.summary.eyebrow}</p>
          <h1>{locale.formatMoney(lastSummary.score)}</h1>
          <p className="summary-screen__lede">{lastSummary.tierMessage}</p>
          <div className="summary-screen__chips">
            <span>{lastSummary.cityLabel}</span>
            <span>
              {locale.formatDayProgress(lastSummary.day, lastSummary.endDay)}
            </span>
            <span>
              {latestRank > 0
                ? locale.summary.leaderboardRank(latestRank)
                : locale.summary.runLogged}
            </span>
          </div>

          <div className="summary-screen__stats">
            <article className="summary-stat">
              <p className="meta-label">{locale.summary.cashLabel}</p>
              <p>{locale.formatMoney(lastSummary.cash)}</p>
            </article>
            <article className="summary-stat">
              <p className="meta-label">{locale.summary.bankLabel}</p>
              <p>{locale.formatMoney(lastSummary.bankDeposit)}</p>
            </article>
            <article className="summary-stat">
              <p className="meta-label">{locale.summary.inventoryValueLabel}</p>
              <p>{locale.formatMoney(lastSummary.inventoryValue)}</p>
            </article>
            <article className="summary-stat">
              <p className="meta-label">{locale.summary.debtLabel}</p>
              <p>{locale.formatMoney(lastSummary.debt)}</p>
            </article>
          </div>

          <div className="summary-screen__actions">
            <button className="ghost-button" onClick={() => setScreen('menu')}>
              {locale.summary.backToLaunchBoard}
            </button>
            <button className="accent-button" onClick={startNewRun}>
              {locale.summary.startAnotherRun}
            </button>
          </div>
        </section>

        <section className="panel launch-card">
          <div className="panel__header">
            <div>
              <p className="eyebrow">{locale.menu.topRunsEyebrow}</p>
              <h2>{locale.summary.currentLeaderboardHeading}</h2>
            </div>
          </div>
          <ol className="scoreboard">
            {highScores.map((entry, index) => (
              <li key={`${entry.runId}-${entry.recordedAt}`} className="scoreboard__item">
                <div>
                  <p className="scoreboard__rank">{locale.formatRank(index + 1)}</p>
                  <p className="scoreboard__title">
                    {locale.formatScoreboardTitle(
                      entry.contentLabel,
                      entry.cityLabel,
                      entry.day,
                    )}
                  </p>
                  <p className="scoreboard__detail">{entry.tierMessage}</p>
                </div>
                <div className="scoreboard__score">
                  <strong>{locale.formatMoney(entry.score)}</strong>
                  <span>{locale.formatDate(entry.recordedAt)}</span>
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
  const travelLockedByHealth = game.health <= 0
  const travelDisabled = runClosed || travelLockedByHealth
  const liveOffers = drugs.filter((drug) => game.market[drug.id].available)
  const daysRemaining = Math.max(game.endDay - game.day, 0)
  const dayProgress = Math.min((game.day / game.endDay) * 100, 100)
  const maxDeposit = getMaxDepositAmount(game)
  const maxWithdraw = getMaxWithdrawAmount(game)
  const maxDebtPayment = getMaxDebtPayment(game)
  const maxBorrow = getMaxBorrowAmount(game)
  const healthRecoveryAmount = getMaxHealthRecoveryAmount(game)
  const healthRecoveryCost = getHealthRecoveryCost(game)
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
    liveOffers.find((drug) => game.market[drug.id].event) ??
    liveOffers.find((drug) => game.market[drug.id].modifier !== 'standard') ??
    cheapestOffer
  const featuredMarketEvent = featuredModifierDrug
    ? game.market[featuredModifierDrug.id].event
    : undefined
  const depositHint = actionLimitHint(
    depositAmount,
    maxDeposit,
    locale.run.depositButton,
    locale.hints.noCashToStash,
  )
  const withdrawHint = actionLimitHint(
    withdrawAmount,
    maxWithdraw,
    locale.hints.withdrawVerb,
    locale.hints.noBankReserve,
  )
  const payDebtHint = actionLimitHint(
    debtPaymentAmount,
    maxDebtPayment,
    locale.hints.payDebtVerb,
    game.debt <= 0 ? locale.hints.debtCleared : locale.hints.noCashForDebt,
  )
  const borrowHint = actionLimitHint(
    borrowAmount,
    maxBorrow,
    locale.run.borrowButton,
    locale.hints.loanCeilingReached,
  )

  return (
    <main className="shell">
      <header className="panel hero">
        <div className="hero__copy">
          <p className="eyebrow">{locale.run.dashboardEyebrow}</p>
          <h1>{locale.appTitle}</h1>
          <p className="hero__lede">
            {locale.run.heroLede(content.shortLabel)}
          </p>
          <div className="hero__ticker">
            <span>{currentCity.district}</span>
            <span>{locale.run.liveProducts(liveOffers.length)}</span>
            <span>{locale.run.nightsLeft(daysRemaining)}</span>
          </div>
        </div>
        <div className="hero__meta">
          <div className="hero__meta-row">
            <div>
              <p className="meta-label">{locale.run.operatingCity}</p>
              <p className="meta-value">{currentCity.label}</p>
            </div>
            <div>
              <p className="meta-label">{locale.run.runClock}</p>
              <p className="meta-value">
                {locale.formatDayProgress(game.day, game.endDay)}
              </p>
            </div>
          </div>
          <div className="progress-cluster">
            <div className="progress-cluster__copy">
              <p className="meta-label">{locale.run.campaignProgress}</p>
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
                ? locale.run.finalDayNote
                : travelLockedByHealth
                  ? locale.run.streetMedicTravelLock
                : locale.run.activeRunNote(daysRemaining)}
            </p>
          </div>
          <div className="hero__actions">
            <button className="ghost-button" onClick={saveAndReturnToMenu}>
              {locale.run.saveAndExit}
            </button>
            <button className="hero__reset" onClick={startNewRun}>
              {locale.run.newRun}
            </button>
          </div>
        </div>
      </header>

      {runClosed ? (
        <section className="panel run-status">
          <div>
            <p className="eyebrow">{locale.run.completeEyebrow}</p>
            <h2>{locale.run.completeHeading}</h2>
            <p className="run-status__copy">
              {locale.run.completeCopy}
            </p>
          </div>
          <div className="run-status__actions">
            <div>
              <p className="meta-label">{locale.run.currentScorePreview}</p>
              <p className="run-status__value">{locale.formatMoney(runValue)}</p>
            </div>
            <button className="accent-button" onClick={finalizeRun}>
              {locale.run.finalizeRun}
            </button>
          </div>
        </section>
      ) : null}

      <section className="stats-grid">
        <article className="panel stat-card">
          <p className="meta-label">{locale.run.cashOnHand}</p>
          <p className="stat-card__value">{locale.formatMoney(game.cash)}</p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">{locale.run.health}</p>
          <p className="stat-card__value">{game.health}%</p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">{locale.run.bankReserve}</p>
          <p className="stat-card__value">{locale.formatMoney(game.bankDeposit)}</p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">{locale.run.debtPressure}</p>
          <p className="stat-card__value">{locale.formatMoney(game.debt)}</p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">{locale.run.stashSpace}</p>
          <p className="stat-card__value">
            {usedSpace}/{game.totalSpace}
          </p>
        </article>
        <article className="panel stat-card">
          <p className="meta-label">{locale.run.runValue}</p>
          <p className="stat-card__value">{locale.formatMoney(runValue)}</p>
        </article>
      </section>

      <section className="signal-grid">
        <article className="panel signal-card">
          <p className="eyebrow">{locale.run.cheapestLane}</p>
          <h2>{cheapestOffer?.label ?? locale.run.noOpenMarket}</h2>
          <p className="signal-card__value">
            {cheapestOffer
              ? locale.formatMoney(game.market[cheapestOffer.id].price)
              : locale.run.unavailable}
          </p>
          <p className="signal-card__meta">
            {locale.run.cheapestLaneMeta(currentCity.label)}
          </p>
        </article>

        <article className="panel signal-card">
          <p className="eyebrow">{locale.run.highestTicket}</p>
          <h2>{priciestOffer?.label ?? locale.run.noOpenMarket}</h2>
          <p className="signal-card__value">
            {priciestOffer
              ? locale.formatMoney(game.market[priciestOffer.id].price)
              : locale.run.unavailable}
          </p>
          <p className="signal-card__meta">
            {locale.run.highestTicketMeta}
          </p>
        </article>

        <article className="panel signal-card">
          <p className="eyebrow">{locale.run.marketPulse}</p>
          <h2>{featuredModifierDrug?.label ?? currentCity.label}</h2>
          <p className="signal-card__value">
            {featuredModifierDrug
              ? featuredMarketEvent
                ? locale.formatMarketEventKind(featuredMarketEvent.kind)
                : locale.formatMarketModifier(game.market[featuredModifierDrug.id].modifier)
              : locale.formatHeatLabel(currentCity.cops)}
          </p>
          <p className="signal-card__meta">
            {featuredModifierDrug
              ? locale.run.marketPulseMeta
              : locale.run.marketPulseIdle}
          </p>
        </article>

        <article className="panel signal-card">
          <p className="eyebrow">{locale.run.bagLeader}</p>
          <h2>{inventoryLeaderDrug?.label ?? locale.run.emptyStash}</h2>
          <p className="signal-card__value">
            {inventoryLeaderDrug
              ? locale.formatUnits(inventoryLeader.quantity)
              : locale.formatUnits(0)}
          </p>
          <p className="signal-card__meta">
            {inventoryLeaderDrug
              ? locale.run.inventoryLeaderMeta
              : locale.run.emptyInventoryBoard}
          </p>
        </article>
      </section>

      <section className="ops-grid">
        <article className="panel finance-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">{locale.run.financeEyebrow}</p>
              <h2>{locale.run.financeHeading}</h2>
            </div>
            <p className="news-panel__summary">
              {locale.run.financeSummary}
            </p>
          </div>

          <div className="finance-panel__summary">
            <div className="finance-summary-card">
              <p className="meta-label">{locale.run.health}</p>
              <p>{game.health}%</p>
            </div>
            <div className="finance-summary-card">
              <p className="meta-label">{locale.run.bankReserve}</p>
              <p>{locale.formatMoney(game.bankDeposit)}</p>
            </div>
            <div className="finance-summary-card">
              <p className="meta-label">{locale.run.outstandingDebt}</p>
              <p>{locale.formatMoney(game.debt)}</p>
            </div>
            <div className="finance-summary-card">
              <p className="meta-label">{locale.run.creditRemaining}</p>
              <p>{locale.formatMoney(maxBorrow)}</p>
            </div>
          </div>

          <div className="finance-panel__grid">
            <label className="finance-control">
              <span>{locale.run.streetMedicLabel}</span>
              <div className="finance-control__row finance-control__row--single">
                <div className="finance-control__readout">
                  {healthRecoveryAmount > 0
                    ? `+${healthRecoveryAmount} health`
                    : `${game.health}%`}
                </div>
                <button
                  className="ghost-button"
                  disabled={healthRecoveryAmount <= 0}
                  onClick={() =>
                    setGame((current) =>
                      current ? recoverHealth(current) : current,
                    )
                  }
                >
                  {locale.run.streetMedicButton}
                </button>
              </div>
              <p className="finance-control__hint">
                {healthRecoveryAmount > 0
                  ? locale.run.streetMedicReady(
                      healthRecoveryAmount,
                      healthRecoveryCost,
                    )
                  : game.health >= GAME_CONFIG.maxHealth
                    ? locale.run.streetMedicNoNeed
                    : locale.run.streetMedicNoCash}
              </p>
            </label>

            <label className="finance-control">
              <span>{locale.run.depositLabel}</span>
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
                  {locale.run.depositButton}
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
              <span>{locale.run.withdrawLabel}</span>
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
                  {locale.run.withdrawButton}
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
              <span>{locale.run.payDebtLabel}</span>
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
                  {locale.run.payDebtButton}
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
              <span>{locale.run.borrowLabel}</span>
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
                  {locale.run.borrowButton}
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
              <p className="eyebrow">{locale.run.ledgerEyebrow}</p>
              <h2>{locale.run.ledgerHeading}</h2>
            </div>
            <p className="news-panel__summary">
              {locale.run.ledgerSummary}
            </p>
          </div>
          <ol className="activity-list">
            {game.activity.map((item) => (
              <li
                key={item.id}
                className={`activity-item activity-item--${item.kind}`}
              >
                <div className="activity-item__meta">
                  <span>{locale.run.activityMeta(item.day, item.kind)}</span>
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
              <p className="eyebrow">{locale.run.territoryEyebrow}</p>
              <h2>{content.map.title}</h2>
            </div>
            <div className="heat-cluster">
              <span className="heat-cluster__label">
                {locale.formatHeatLabel(currentCity.cops)}
              </span>
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
              disableTravel={travelDisabled}
              onFocusCity={setFocusedCityId}
              onTravelCity={handleTravel}
            />

            <div className="city-brief">
              <p className="eyebrow">{locale.run.focusedCityEyebrow}</p>
              <h3>{focusedCity.label}</h3>
              <p>{focusedCity.atmosphere}</p>
              <div className="city-brief__chips">
                <span>{focusedCity.district}</span>
                <span>{focusedCity.landmark}</span>
              </div>
              <dl className="city-brief__stats">
                <div>
                  <dt>{locale.run.heatLabel}</dt>
                  <dd>{focusedCity.cops}%</dd>
                </div>
                <div>
                  <dt>{locale.run.signatureLabel}</dt>
                  <dd>{focusedCity.signature}</dd>
                </div>
                <div>
                  <dt>{locale.run.statusLabel}</dt>
                  <dd>
                    {focusedCity.id === game.currentCityId
                      ? locale.run.currentTerritory
                      : runClosed
                        ? locale.run.travelLocked
                        : travelLockedByHealth
                          ? locale.run.tooHurtToTravel
                        : locale.run.availableToTravel}
                  </dd>
                </div>
              </dl>
              <button
                className="accent-button city-brief__action"
                disabled={focusedCity.id === game.currentCityId || travelDisabled}
                onClick={() => handleTravel(focusedCity.id)}
              >
                {focusedCity.id === game.currentCityId
                  ? locale.run.currentTerritory
                  : runClosed
                    ? locale.run.travelLocked
                    : travelLockedByHealth
                      ? locale.run.tooHurtToTravel
                    : locale.map.travelTo(focusedCity.label)}
              </button>
            </div>
          </div>
        </article>

        <aside className="panel news-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">{locale.run.streetChatterEyebrow}</p>
              <h2>{locale.run.signalFeedHeading}</h2>
            </div>
            <p className="news-panel__summary">
              {locale.run.signalFeedSummary}
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
            <p className="eyebrow">{locale.run.tradingFloorEyebrow}</p>
            <h2>{locale.run.marketBoardHeading}</h2>
          </div>
          <p className="market-panel__note">
            {locale.run.marketBoardNote}
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
            const badgeLabel =
              offer.available
                ? offer.event
                  ? locale.formatMarketEventKind(offer.event.kind)
                  : locale.formatMarketModifier(offer.modifier)
                : locale.run.hidden
            const badgeClassName = `offer-card__badge${
              offer.available && offer.event
                ? ` offer-card__badge--${offer.event.kind}`
                : offer.available && offer.modifier !== 'standard'
                  ? ` offer-card__badge--${offer.modifier}`
                  : ''
            }`
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
                      {offer.available
                        ? locale.formatMoney(offer.price)
                        : locale.run.offMarket}
                    </span>
                    <span className={badgeClassName}>{badgeLabel}</span>
                  </div>
                </div>

                <div className="offer-card__stats">
                  <span>{locale.run.ownedLabel(inventory)}</span>
                  <span>
                    {offer.available
                      ? locale.run.buyingRoom(maxBuy)
                      : locale.run.travelElsewhere}
                  </span>
                </div>

                <label className="trade-field">
                  <span>{locale.run.quantityLabel}</span>
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
                    {locale.run.maxBuyButton}
                  </button>
                  <button
                    className="accent-button"
                    disabled={buyDisabled}
                    onClick={() => commitBuy(drug.id)}
                  >
                    {locale.run.buyButton}
                  </button>
                  <button
                    className="ghost-button"
                    disabled={maxSell === 0}
                    onClick={() => fillMaxSell(drug.id)}
                  >
                    {locale.run.maxSellButton}
                  </button>
                  <button
                    className="accent-button accent-button--secondary"
                    disabled={sellDisabled}
                    onClick={() => commitSell(drug.id)}
                  >
                    {locale.run.sellButton}
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
