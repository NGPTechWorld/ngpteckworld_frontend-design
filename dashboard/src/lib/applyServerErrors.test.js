import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import { applyServerErrors } from './applyServerErrors'

describe('applyServerErrors', () => {
  it('maps 422 field errors onto setError (first message, first field focused) and reports handled', () => {
    const setError = vi.fn()
    const err = new ApiError({ status: 422, message: 'Invalid', errors: { question_ar: ['Required', 'Too long'], 'features_ar.0': ['Bad'] } })

    expect(applyServerErrors(setError, err)).toBe(true)

    expect(setError).toHaveBeenCalledWith('question_ar', { type: 'server', message: 'Required' }, { shouldFocus: true })
    expect(setError).toHaveBeenCalledWith('features_ar.0', { type: 'server', message: 'Bad' }, { shouldFocus: false })
    expect(setError).toHaveBeenCalledWith('root.server', { type: 'server', message: 'Invalid' })
  })

  it('ignores anything that is not a validation error', () => {
    const setError = vi.fn()
    expect(applyServerErrors(setError, new ApiError({ status: 500 }))).toBe(false)
    expect(applyServerErrors(setError, new Error('boom'))).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })
})
