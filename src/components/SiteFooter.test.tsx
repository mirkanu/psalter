// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { SiteFooter } from './SiteFooter'

afterEach(() => {
  cleanup()
})

describe('SiteFooter — desktop-only, Install-free (quick task 260817-p17)', () => {
  it('renders no element with text "Install"', () => {
    render(<SiteFooter />)
    expect(screen.queryByText('Install')).toBeNull()
  })

  it('still renders About / Copyright / Feedback / Changelog and the "Made by GSD Labs" credit', () => {
    render(<SiteFooter />)
    expect(screen.getByText('About')).toBeTruthy()
    expect(screen.getByText('Copyright')).toBeTruthy()
    expect(screen.getByText('Feedback')).toBeTruthy()
    expect(screen.getByText('Changelog')).toBeTruthy()
    expect(screen.getByText('Made by GSD Labs')).toBeTruthy()
  })

  it('the <footer> element carries hidden and md:block classes (mobile-hidden, desktop-shown)', () => {
    const { container } = render(<SiteFooter />)
    const footerClass = container.querySelector('footer')?.className ?? ''
    expect(footerClass).toContain('hidden')
    expect(footerClass).toContain('md:block')
  })
})
