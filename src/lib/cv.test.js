import { dateRange, formatMonth } from './cv'

describe('formatMonth', () => {
  it('turns an API month into MM/YYYY and ignores anything else', () => {
    expect(formatMonth('2024-10')).toBe('10/2024')
    expect(formatMonth(null)).toBe('')
    expect(formatMonth('10/2024')).toBe('')
  })
})

describe('dateRange', () => {
  it('joins start and end, uses the present label for a current entry, and copes with missing dates', () => {
    expect(dateRange('2019-09', '2022-10', false, 'Present')).toBe('09/2019 – 10/2022')
    expect(dateRange('2022-10', null, true, 'Present')).toBe('10/2022 – Present')
    expect(dateRange('2022-10', '2023-01', true, 'Present')).toBe('10/2022 – Present')
    expect(dateRange(null, '2023-01', false, 'Present')).toBe('01/2023')
    expect(dateRange('2023-01', null, false, 'Present')).toBe('01/2023')
    expect(dateRange(null, null, false, 'Present')).toBe('')
  })
})
