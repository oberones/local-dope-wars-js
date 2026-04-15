// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from '../src/App'
import { createNewGame } from '../src/game/core'
import { saveGame } from '../src/game/storage'

function renderApp() {
  const user = userEvent.setup()

  return {
    user,
    ...render(<App />),
  }
}

describe('app browser flows', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('starts a new run, saves it, and exposes continue on return to the menu', async () => {
    const { user } = renderApp()

    await user.click(
      screen.getByRole('button', {
        name: 'Start new run',
      }),
    )

    expect(await screen.findByRole('button', { name: 'Save and exit' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save and exit' }))

    expect(await screen.findByRole('button', { name: 'Continue saved run' })).toBeTruthy()
  })

  it('continues a final-day saved run and finalizes it through the summary screen', async () => {
    const savedGame = {
      ...createNewGame('gwinnett-county'),
      day: 30,
      endDay: 30,
      cash: 8_500,
      debt: 2_200,
      pawnDebt: 300,
      currentCityId: 'duluth',
    }

    saveGame(savedGame)

    const { user } = renderApp()

    await user.click(
      await screen.findByRole('button', {
        name: 'Continue saved run',
      }),
    )

    expect(await screen.findByRole('button', { name: 'Finalize run' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Finalize run' }))

    expect(await screen.findByText('Run closed')).toBeTruthy()
    expect(screen.getByText('Current leaderboard')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Back to launch board' }))

    expect(await screen.findByText('Top runs')).toBeTruthy()
    expect(
      screen.getByText((content) => content.includes('Gwinnett County · Duluth · Day 30')),
    ).toBeTruthy()
  })

  it('shows and dismisses queued event spotlight popups from a resumed run', async () => {
    const savedGame = {
      ...createNewGame('gwinnett-county'),
      newsCursor: 0,
      news: [
        {
          id: 1,
          tone: 'encounter' as const,
          text: 'Collectors found your route.',
          spotlight: {
            tone: 'alert' as const,
            title: 'Collection pressure hit',
            detail: 'Collectors clocked your route and leaned on your cash trail.',
            artKey: 'collector' as const,
            artLabel: 'Collectors',
          },
        },
      ],
    }

    saveGame(savedGame)

    const { user } = renderApp()

    const continueButton = await screen.findByRole('button', {
      name: 'Continue saved run',
    })
    await user.click(continueButton)

    const dismissButton = await screen.findByRole('button', {
      name: 'Keep moving',
    })

    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Collection pressure hit')).toBeTruthy()
    expect(document.activeElement).toBe(dismissButton)

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('forces a resumed pending cop-stop decision even when the spotlight is no longer queued', async () => {
    const savedGame = {
      ...createNewGame('gwinnett-county'),
      currentCityId: 'lawrenceville' as const,
      cash: 1_800,
      newsCursor: 2,
      pendingEncounter: {
        kind: 'cop-stop' as const,
        newsId: 1,
        cityId: 'lawrenceville' as const,
        cityLabel: 'Lawrenceville',
        cashDemand: 640,
        baseDamage: 10,
      },
      news: [
        {
          id: 1,
          tone: 'encounter' as const,
          text: 'Blue lights hit behind you near Lawrenceville. Decide fast.',
          spotlight: {
            tone: 'encounter' as const,
            title: 'Cop stop',
            detail:
              'A patrol car pins you down near Lawrenceville. You can floor it, fight back, or hand over up to $640 to cool it off.',
            artKey: 'rough-stop' as const,
            artLabel: 'Rough stop',
            decision: {
              kind: 'cop-stop' as const,
              choices: ['flee', 'fight', 'surrender'] as const,
            },
          },
        },
      ],
    }

    saveGame(savedGame)

    const { user } = renderApp()

    await user.click(
      await screen.findByRole('button', {
        name: 'Continue saved run',
      }),
    )

    const fleeButton = await screen.findByRole('button', {
      name: 'Floor it',
    })

    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(document.activeElement).toBe(fleeButton)

    await user.keyboard('{Escape}')

    expect(screen.getByRole('dialog')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Pay up' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    expect(
      screen.getByText('You paid $640 to settle the stop and keep breathing room.'),
    ).toBeTruthy()
  })

  it('renders a resumed jacker ambush decision and lets the player drop the stash', async () => {
    const savedGame = {
      ...createNewGame('gwinnett-county'),
      currentCityId: 'lawrenceville' as const,
      newsCursor: 2,
      inventory: {
        ...createNewGame('gwinnett-county').inventory,
        meth: 9,
      },
      pendingEncounter: {
        kind: 'jacker-ambush' as const,
        newsId: 1,
        cityId: 'lawrenceville' as const,
        cityLabel: 'Lawrenceville',
        drugId: 'meth' as const,
        drugLabel: 'Meth',
        quantityDemand: 3,
        baseDamage: 8,
      },
      news: [
        {
          id: 1,
          tone: 'encounter' as const,
          text: 'A rival crew boxed you in near Lawrenceville with eyes on your Meth.',
          spotlight: {
            tone: 'encounter' as const,
            title: 'Jacker ambush',
            detail:
              'A rival crew corners you near Lawrenceville. You can run it, fight back, or hand over 3 Meth to get free.',
            artKey: 'jacker-ambush' as const,
            artLabel: 'Rival crew',
            decision: {
              kind: 'jacker-ambush' as const,
              choices: ['flee', 'fight', 'surrender'] as const,
            },
          },
        },
      ],
    }

    saveGame(savedGame)

    const { user } = renderApp()

    await user.click(
      await screen.findByRole('button', {
        name: 'Continue saved run',
      }),
    )

    expect(await screen.findByText('Jacker ambush')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Drop the stash' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    expect(
      screen.getByText('You dropped 3 Meth to end the ambush without blood.'),
    ).toBeTruthy()
  })
})
