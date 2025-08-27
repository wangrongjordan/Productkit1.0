import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CompanyLogo from '../components/CompanyLogo'

describe('CompanyLogo Component', () => {
  it('renders with default props', () => {
    render(<CompanyLogo />)
    
    const logoImage = screen.getByAltText('公司Logo')
    expect(logoImage).toBeInTheDocument()
    expect(logoImage).toHaveAttribute('src', '/logo.png')
  })

  it('renders with large size', () => {
    render(<CompanyLogo size=\"large\" />)
    
    const logoContainer = screen.getByAltText('公司Logo').parentElement
    expect(logoContainer).toHaveClass('w-16', 'h-16')
  })

  it('renders with medium size', () => {
    render(<CompanyLogo size=\"medium\" />)
    
    const logoContainer = screen.getByAltText('公司Logo').parentElement
    expect(logoContainer).toHaveClass('w-12', 'h-12')
  })

  it('renders with small size', () => {
    render(<CompanyLogo size=\"small\" />)
    
    const logoContainer = screen.getByAltText('公司Logo').parentElement
    expect(logoContainer).toHaveClass('w-8', 'h-8')
  })

  it('applies custom className', () => {
    const customClass = 'custom-logo-class'
    render(<CompanyLogo className={customClass} />)
    
    const logoContainer = screen.getByAltText('公司Logo').parentElement
    expect(logoContainer).toHaveClass(customClass)
  })

  it('renders with company name text', () => {
    render(<CompanyLogo showText />)
    
    expect(screen.getByText('企业知识库')).toBeInTheDocument()
  })
})