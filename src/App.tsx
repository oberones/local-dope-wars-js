import { useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { CITIES, DRUGS } from './game/content'
import { MapScene } from './components/MapScene'
import {
  buyDrug,
  createNewGame,
  getCurrentCity,
  getMaxBuyQuantity,
  getMaxSellQuantity,
  getNetWorth,
  getUsedSpace,
  sellDrug,
  travelToCity,
} from './game/core'
import type { CityId, DrugId, GameState, MarketOffer } from './game/types'

const moneyFormatter = new Intl.NumberFormat('en-US')

function createTradeDrafts() {
  return DRUGS.reduce(
    (drafts, drug) => {
      drafts[drug.id] = '0'
      return drafts
    },
    {} as Record<DrugId, string>,
  )
}

function formatMoney(value: number) {
  return `$${moneyFormatter.format(value)}`
}

function getCityById(cityId: CityId) {
  return CITIES.find((city) => city.id === cityId) ?? CITIES[0]
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

function App() {
  const [game, setGame] = useState<GameState>(() => createNewGame())
  const [focusedCityId, setFocusedCityId] = useState<CityId>(
    game.currentCityId,
  )
  const [tradeDrafts, setTradeDrafts] = useState<Record<DrugId, string>>(
    () => createTradeDrafts(),
  )

  const currentCity = getCurrentCity(game)
  const focusedCity = getCityById(focusedCityId)
  const usedSpace = getUsedSpace(game)
  const runValue = getNetWorth(game)
  const liveOffers = DRUGS.filter((drug) => game.market[drug.id].available)
  const daysRemaining = Math.max(game.endDay - game.day, 0)
  const dayProgress = Math.min((game.day / game.endDay) * 100, 100)
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
  const inventoryLeader = DRUGS.reduce<{
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
    ? DRUGS.find((drug) => drug.id === inventoryLeader.drugId)
    : undefined
  const featuredModifierDrug =
    liveOffers.find((drug) => game.market[drug.id].modifier !== 'standard') ??
    cheapestOffer

  function resetGame() {
    const freshGame = createNewGame()

    setGame(freshGame)
    setFocusedCityId(freshGame.currentCityId)
    setTradeDrafts(createTradeDrafts())
  }

  function setDraft(drugId: DrugId, nextValue: string) {
    setTradeDrafts((current) => ({
      ...current,
      [drugId]: nextValue,
    }))
  }

  function getDraftQuantity(drugId: DrugId) {
    const parsed = Number.parseInt(tradeDrafts[drugId], 10)

    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0
    }

    return parsed
  }

  function fillMaxBuy(drugId: DrugId) {
    setDraft(drugId, String(getMaxBuyQuantity(game, drugId)))
  }

  function fillMaxSell(drugId: DrugId) {
    setDraft(drugId, String(getMaxSellQuantity(game, drugId)))
  }

  function commitBuy(drugId: DrugId) {
    const quantity = getDraftQuantity(drugId)
    setGame((current) => buyDrug(current, drugId, quantity))
    setDraft(drugId, '0')
  }

  function commitSell(drugId: DrugId) {
    const quantity = getDraftQuantity(drugId)
    setGame((current) => sellDrug(current, drugId, quantity))
    setDraft(drugId, '0')
  }

  function handleTravel(cityId: CityId) {
    setFocusedCityId(cityId)
    setGame((current) => travelToCity(current, cityId))
  }

  return (
    <main className="shell">
      <header className="panel hero">
        <div className="hero__copy">
          <p className="eyebrow">Operational dashboard</p>
          <h1>Gwinnett County Dope Wars</h1>
          <p className="hero__lede">
            The rebuild now has a real visual lane: a surveillance-heavy map,
            a warmer Southern noir palette, and a cleaner command deck for
            running the Lawrenceville hustle.
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
              {daysRemaining === 0
                ? 'The run is over. Start fresh to keep building.'
                : `${daysRemaining} nights remain before the books close.`}
            </p>
          </div>
          <button className="hero__reset" onClick={resetGame}>
            Start fresh
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="panel stat-card">
          <p className="meta-label">Cash on hand</p>
          <p className="stat-card__value">{formatMoney(game.cash)}</p>
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

      <section className="overview-grid">
        <article className="panel city-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Territory scene</p>
              <h2>Gwinnett network</h2>
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
              cities={CITIES}
              currentCityId={game.currentCityId}
              focusedCityId={focusedCityId}
              disableTravel={game.day >= game.endDay}
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
                      : 'Available to travel'}
                  </dd>
                </div>
              </dl>
              <button
                className="accent-button city-brief__action"
                disabled={
                  focusedCity.id === game.currentCityId || game.day >= game.endDay
                }
                onClick={() => handleTravel(focusedCity.id)}
              >
                {focusedCity.id === game.currentCityId
                  ? 'Current territory'
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
              Live reports update when you travel or work the market.
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
              The board now has a stronger visual system, but it still runs on
              pure game-core functions, so we can keep layering in graphics
              without destabilizing gameplay.
            </p>
          </div>

        <div className="offer-grid">
          {DRUGS.map((drug) => {
            const offer = game.market[drug.id]
            const inventory = game.inventory[drug.id]
            const maxBuy = getMaxBuyQuantity(game, drug.id)
            const maxSell = getMaxSellQuantity(game, drug.id)

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
                    type="number"
                    min="0"
                    value={tradeDrafts[drug.id]}
                    onChange={(event) => setDraft(drug.id, event.target.value)}
                  />
                </label>

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
                    disabled={!offer.available}
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
                    disabled={maxSell === 0}
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
