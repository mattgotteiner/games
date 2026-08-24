import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('presents the application identity and honest empty catalog', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Games' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Game catalog' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No games yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /play/i })).not.toBeInTheDocument()
  })
})

