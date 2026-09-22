import { describe, expect, it } from 'vitest'
import { SECTIONS, canAccessFeature, filterFeaturesByUser } from './permissions'

const feature = (id) => ({ id, routes: [] })
const superAdmin = { is_super_admin: true, permissions: [] }
const limited = (permissions = []) => ({ is_super_admin: false, permissions })

describe('canAccessFeature', () => {
  it('denies everything when there is no signed-in user', () => {
    expect(canAccessFeature(feature('requests'), null)).toBe(false)
    expect(canAccessFeature(feature('dashboard'), null)).toBe(false)
  })

  it('lets a super admin into every section, including users', () => {
    expect(canAccessFeature(feature('users'), superAdmin)).toBe(true)
    for (const id of SECTIONS) expect(canAccessFeature(feature(id), superAdmin)).toBe(true)
  })

  it('lets a limited admin into only the sections they were given', () => {
    const user = limited(['requests', 'projects'])
    expect(canAccessFeature(feature('requests'), user)).toBe(true)
    expect(canAccessFeature(feature('projects'), user)).toBe(true)
    expect(canAccessFeature(feature('services'), user)).toBe(false)
  })

  it('always allows account, even with zero permissions', () => {
    expect(canAccessFeature(feature('account'), limited([]))).toBe(true)
  })

  it('never lets a limited admin into users or the dashboard overview, even with every section granted', () => {
    const user = limited(['users', 'dashboard', ...SECTIONS])
    expect(canAccessFeature(feature('users'), user)).toBe(false)
    expect(canAccessFeature(feature('dashboard'), user)).toBe(false)
  })
})

describe('filterFeaturesByUser', () => {
  it('keeps only what the signed-in admin can see, in the original order', () => {
    const features = ['dashboard', 'requests', 'services', 'users', 'account'].map(feature)

    expect(filterFeaturesByUser(features, limited(['requests'])).map((f) => f.id)).toEqual(['requests', 'account'])
    expect(filterFeaturesByUser(features, superAdmin).map((f) => f.id)).toEqual(['dashboard', 'requests', 'services', 'users', 'account'])
    expect(filterFeaturesByUser(features, null)).toEqual([])
  })
})
