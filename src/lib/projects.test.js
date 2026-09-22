import { pickFeatured } from './projects'

const p = (id, featured) => ({ id, featured })

test('shows the projects flagged as featured, in order', () => {
  const list = [p(1, false), p(2, true), p(3, false), p(4, true)]
  expect(pickFeatured(list).map((x) => x.id)).toEqual([2, 4])
})

test('caps the result at the limit', () => {
  const list = [p(1, true), p(2, true), p(3, true), p(4, true)]
  expect(pickFeatured(list).map((x) => x.id)).toEqual([1, 2, 3])
  expect(pickFeatured(list, 2).map((x) => x.id)).toEqual([1, 2])
})

test('falls back to the first projects when none is flagged', () => {
  const list = [p(1, false), p(2, false), p(3, false), p(4, false)]
  expect(pickFeatured(list).map((x) => x.id)).toEqual([1, 2, 3])
})

test('handles an empty list', () => {
  expect(pickFeatured([])).toEqual([])
})
