import { coverFor, galleryBgs, iconPaths, initials } from './visuals'

test('coverFor returns a gradient and falls back to web', () => {
  expect(coverFor('web')).toContain('linear-gradient')
  expect(coverFor('unknown')).toBe(coverFor('web'))
})
test('galleryBgs returns four gradients', () => {
  expect(galleryBgs()).toHaveLength(4)
})
test('iconPaths covers all service + value keys', () => {
  ['web','mobile','design','erp','cloud','ai','support','quality','innovation','commit','transparency']
    .forEach((k) => expect(typeof iconPaths[k]).toBe('string'))
})
test('initials takes first two words', () => {
  expect(initials('Karim Salem')).toBe('KS')
})
