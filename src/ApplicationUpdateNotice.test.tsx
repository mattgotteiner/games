import { render, screen } from '@testing-library/preact'
import { describe, expect, it } from 'vitest'
import { ApplicationUpdateNotice } from './ApplicationUpdateNotice'

describe('ApplicationUpdateNotice', () => {
  it('does not render when the running copy is current', () => {
    render(<ApplicationUpdateNotice status="current" />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces that an out-of-date copy is downloading', () => {
    render(<ApplicationUpdateNotice status="downloading" />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'This copy is out of date. Downloading the latest version of Games',
    )
  })

  it('announces that the downloaded update is loading', () => {
    render(<ApplicationUpdateNotice status="loading" />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'The latest version has downloaded. Loading the new copy',
    )
  })

  it('alerts with recovery guidance when the update fails', () => {
    render(<ApplicationUpdateNotice status="failed" />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Check your connection, then reload the page to try again.',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You can keep using this copy for now.',
    )
  })
})
