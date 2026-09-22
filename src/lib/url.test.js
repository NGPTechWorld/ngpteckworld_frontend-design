import { toHttpUrl } from './url'

test('keeps http and https links', () => {
  expect(toHttpUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
  expect(toHttpUrl('  http://example.com  ')).toBe('http://example.com/')
})

test.each([[''], [null], [undefined], ['not a url'], ['javascript:alert(1)'], ['data:text/html,hi'], ['ftp://example.com']])(
  'rejects %s',
  (input) => {
    expect(toHttpUrl(input)).toBeNull()
  },
)
