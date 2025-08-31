import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommandForm } from '@/components/CommandForm'
import '@testing-library/jest-dom'

describe('CommandForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders all form fields', () => {
    render(<CommandForm command="run" onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/股票代码/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/分析日期/i)).toBeInTheDocument()
    expect(screen.getByText(/选择分析师/i)).toBeInTheDocument()
    expect(screen.getByText(/LLM 提供商/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<CommandForm command="run" onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /开始分析/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  it('submits form with valid data', async () => {
    render(<CommandForm command="run" onSubmit={mockOnSubmit} />)
    
    const tickerInput = screen.getByLabelText(/股票代码/i)
    const dateInput = screen.getByLabelText(/分析日期/i)
    
    fireEvent.change(tickerInput, { target: { value: 'AAPL' } })
    fireEvent.change(dateInput, { target: { value: '2024-01-01' } })
    
    const submitButton = screen.getByRole('button', { name: /开始分析/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ticker: 'AAPL',
          date: '2024-01-01',
        })
      )
    })
  })

  it('shows loading state when isLoading is true', () => {
    render(<CommandForm command="run" onSubmit={mockOnSubmit} isLoading={true} />)
    
    const submitButton = screen.getByRole('button')
    expect(submitButton).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
