import type { CSSProperties, KeyboardEvent } from 'react'
import './MapScene.css'
import type { CityDefinition, CityId } from '../game/types'

const ROUTES: Array<[CityId, CityId]> = [
  ['suwanee', 'duluth'],
  ['duluth', 'lawrenceville'],
  ['lawrenceville', 'dacula'],
  ['lawrenceville', 'grayson'],
  ['lawrenceville', 'snellville'],
  ['lawrenceville', 'lilburn'],
  ['duluth', 'norcross'],
  ['norcross', 'lilburn'],
  ['lilburn', 'snellville'],
]

const DISTRICTS = [
  {
    id: 'northwest',
    label: 'Norcross / Duluth',
    subtitle: 'Older corridors',
    points: '14,31 28,18 42,21 40,41 20,46 10,39',
    cityIds: ['norcross', 'duluth'] as CityId[],
  },
  {
    id: 'north',
    label: 'Suwanee / Dacula',
    subtitle: 'Wide-lane expansion',
    points: '41,21 58,11 84,23 84,39 71,42 40,41',
    cityIds: ['suwanee', 'dacula'] as CityId[],
  },
  {
    id: 'core',
    label: 'Lawrenceville core',
    subtitle: 'Courthouse gravity',
    points: '20,46 40,41 71,42 69,62 31,67 15,57',
    cityIds: ['lawrenceville', 'grayson'] as CityId[],
  },
  {
    id: 'south',
    label: 'Lilburn / Snellville',
    subtitle: 'Heat-heavy suburbs',
    points: '15,57 31,67 69,62 77,82 33,86 13,72',
    cityIds: ['lilburn', 'snellville'] as CityId[],
  },
] as const

const ARTERIALS = [
  'M18 39 C26 34, 34 30, 42 28 C53 25, 63 24, 78 26',
  'M21 49 C30 49, 39 49, 49 48 C61 47, 71 48, 79 54',
  'M30 18 C38 25, 44 31, 48 40 C52 49, 58 60, 70 78',
  'M16 67 C30 61, 42 57, 57 56 C67 55, 75 58, 84 63',
] as const

const LABELS = [
  { x: 19, y: 28, text: 'Historic routes' },
  { x: 62, y: 17, text: 'Expansion belt' },
  { x: 48, y: 46, text: 'Downtown grid' },
  { x: 58, y: 75, text: 'Suburban pressure' },
] as const

function getCityById(cities: CityDefinition[], cityId: CityId) {
  return cities.find((city) => city.id === cityId) ?? cities[0]
}

function nodeTint(cops: number) {
  if (cops < 20) {
    return '34, 197, 94'
  }

  if (cops < 50) {
    return '250, 204, 21'
  }

  return '239, 68, 68'
}

interface MapSceneProps {
  cities: CityDefinition[]
  currentCityId: CityId
  focusedCityId: CityId
  disableTravel: boolean
  onFocusCity: (cityId: CityId) => void
  onTravelCity: (cityId: CityId) => void
}

export function MapScene({
  cities,
  currentCityId,
  focusedCityId,
  disableTravel,
  onFocusCity,
  onTravelCity,
}: MapSceneProps) {
  const currentCity = getCityById(cities, currentCityId)
  const focusedCity = getCityById(cities, focusedCityId)

  function handleTravel(cityId: CityId) {
    if (disableTravel || cityId === currentCityId) {
      return
    }

    onTravelCity(cityId)
  }

  function handleKeyDown(cityId: CityId) {
    return (event: KeyboardEvent<SVGGElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return
      }

      event.preventDefault()
      handleTravel(cityId)
    }
  }

  return (
    <div className="county-map" onMouseLeave={() => onFocusCity(currentCityId)}>
      <div className="county-map__wash county-map__wash--left" />
      <div className="county-map__wash county-map__wash--right" />
      <div className="county-map__sweep" />
      <div className="county-map__hud">
        <span className="county-map__hud-chip">
          Focus: {focusedCity.label}
        </span>
        <span className="county-map__hud-chip">
          Heat {focusedCity.cops}%
        </span>
      </div>
      <div className="county-map__legend">
        <span className="county-map__legend-chip county-map__legend-chip--low">
          Low heat
        </span>
        <span className="county-map__legend-chip county-map__legend-chip--mid">
          Active corridor
        </span>
        <span className="county-map__legend-chip county-map__legend-chip--hot">
          Hot zone
        </span>
      </div>

      <svg
        className="county-map__scene"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Illustrated Gwinnett County market map"
      >
        <defs>
          <linearGradient id="county-amber-route" x1="0%" x2="100%">
            <stop offset="0%" stopColor="rgba(244, 197, 93, 0.15)" />
            <stop offset="50%" stopColor="rgba(244, 197, 93, 0.95)" />
            <stop offset="100%" stopColor="rgba(244, 197, 93, 0.15)" />
          </linearGradient>
          <marker
            id="county-arrow"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <path d="M0,0 L4,2 L0,4 Z" fill="#f4c95d" />
          </marker>
        </defs>

        <path
          className="county-map__plate"
          d="M18 13 L39 10 L58 12 L77 21 L88 34 L90 49 L86 66 L72 81 L55 90 L34 88 L18 75 L10 57 L10 36 Z"
        />

        {DISTRICTS.map((district) => {
          const isActive = district.cityIds.includes(currentCityId)
          const isFocused = district.cityIds.includes(focusedCityId)

          return (
            <polygon
              key={district.id}
              className={`county-map__district county-map__district--${district.id}${
                isActive ? ' is-active' : ''
              }${isFocused ? ' is-focused' : ''}`}
              points={district.points}
            />
          )
        })}

        {ARTERIALS.map((path, index) => (
          <path
            key={path}
            className={`county-map__arterial county-map__arterial--${index + 1}`}
            d={path}
          />
        ))}

        {ROUTES.map(([fromId, toId]) => {
          const from = getCityById(cities, fromId)
          const to = getCityById(cities, toId)
          const connectedToCurrent =
            fromId === currentCityId || toId === currentCityId
          const connectedToFocus =
            fromId === focusedCityId || toId === focusedCityId

          return (
            <line
              key={`${fromId}-${toId}`}
              className={`county-map__route${
                connectedToCurrent || connectedToFocus
                  ? ' county-map__route--active'
                  : ''
              }${
                connectedToCurrent && connectedToFocus
                  ? ' county-map__route--focus'
                  : ''
              }`}
              x1={from.map.x}
              y1={from.map.y}
              x2={to.map.x}
              y2={to.map.y}
            />
          )
        })}

        {focusedCityId !== currentCityId ? (
          <line
            className="county-map__travel-vector"
            x1={currentCity.map.x}
            y1={currentCity.map.y}
            x2={focusedCity.map.x}
            y2={focusedCity.map.y}
            markerEnd="url(#county-arrow)"
          />
        ) : null}

        {LABELS.map((label) => (
          <text
            key={`${label.text}-${label.x}`}
            className="county-map__scan-label"
            x={label.x}
            y={label.y}
          >
            {label.text}
          </text>
        ))}

        {cities.map((city) => {
          const isCurrent = city.id === currentCityId
          const isFocused = city.id === focusedCityId
          const isLocked = disableTravel || isCurrent

          return (
            <g
              key={city.id}
              className={`county-map__city-button${
                isCurrent ? ' county-map__city-button--active' : ''
              }${isFocused ? ' county-map__city-button--focused' : ''}${
                isLocked ? ' county-map__city-button--locked' : ''
              }`}
              style={
                {
                  '--city-tint': nodeTint(city.cops),
                } as CSSProperties
              }
              transform={`translate(${city.map.x} ${city.map.y})`}
              onClick={() => handleTravel(city.id)}
              onMouseEnter={() => onFocusCity(city.id)}
              onFocus={() => onFocusCity(city.id)}
              onBlur={() => onFocusCity(currentCityId)}
              onKeyDown={handleKeyDown(city.id)}
              tabIndex={0}
              role="button"
              aria-label={`Travel to ${city.label}`}
              aria-disabled={isLocked}
            >
              <circle className="county-map__city-hit" r="6.4" />
              <circle className="county-map__city-ring" r="3.35" />
              <circle className="county-map__city-core" r="1.1" />
              {isCurrent ? (
                <circle className="county-map__city-pulse" r="4.6" />
              ) : null}
              {isFocused && !isCurrent ? (
                <circle className="county-map__city-focus" r="5.5" />
              ) : null}
              <text className="county-map__city-label" x="4.5" y="-1.5">
                {city.label}
              </text>
              <text className="county-map__city-subtitle" x="4.5" y="1.7">
                {city.district}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
