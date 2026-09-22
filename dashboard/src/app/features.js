// Auto-discovery of features: every src/features/<area>/index.jsx that default-exports { id, nav, routes }.
// Nothing to register by hand — see docs/UI-KIT.md ("Adding a feature").
const modules = import.meta.glob('../features/*/index.jsx', { eager: true })

export const NAV_GROUPS = ['main', 'content', 'system']

function isValid(feature) {
  return Boolean(feature && typeof feature.id === 'string' && Array.isArray(feature.routes))
}

/** Modules → valid feature objects sorted by nav order. Invalid ones are skipped with a console warning. */
export function collectFeatures(mods = modules) {
  const seen = new Set()
  return Object.entries(mods)
    .map(([path, mod]) => {
      const feature = mod?.default
      if (!isValid(feature)) {
        console.warn(`[features] ${path} must default-export { id, nav, routes } — skipped`)
        return null
      }
      if (seen.has(feature.id)) {
        console.warn(`[features] duplicate feature id "${feature.id}" in ${path} — skipped`)
        return null
      }
      seen.add(feature.id)
      return feature
    })
    .filter(Boolean)
    .sort((a, b) => (a.nav?.order ?? 999) - (b.nav?.order ?? 999))
}

/** Sidebar model: [{ group: 'main', items: [{ id, to, icon, label, order }] }] (empty groups omitted). */
export function buildNav(features) {
  return NAV_GROUPS.map((group) => ({
    group,
    items: features
      .filter((feature) => feature.nav && (feature.nav.group ?? 'content') === group)
      .map((feature) => ({ id: feature.id, ...feature.nav }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
  })).filter((entry) => entry.items.length)
}

/** All feature routes, ready for <Route>/useRoutes children (paths are relative to the app root). */
export const buildRoutes = (features) => features.flatMap((feature) => feature.routes)

export const features = collectFeatures()
