// Per-section access control. Mirrors the backend's `App\Models\User::SECTIONS` exactly — a feature id here
// must be the same string as its `src/features/<id>/index.jsx`. Keep both lists in sync by hand; there is no
// single source of truth shared across the two codebases.
export const SECTIONS = ['faqs', 'page-content', 'partners', 'projects', 'requests', 'services', 'settings', 'stats', 'team', 'testimonials']

// Every signed-in admin gets this regardless of `permissions`: the signed-in admin's own profile/password.
const ALWAYS_VISIBLE = ['account']

// Features that are never a grantable section permission — a limited admin never sees them, however many
// SECTIONS they have (mirrors the backend's `super_admin`-only route groups: users.php, dashboard.php).
const SUPER_ADMIN_ONLY = ['users', 'dashboard']

// Visible only to the one account linked to it (mirrors the backend's per-request ownership check —
// TeamProfile.user_id — which no flat SECTIONS permission can express). Not gated by `permissions` at all:
// an admin with zero section permissions still sees this when their account has a linked team profile.
const SELF_SERVICE = { 'my-portfolio': (user) => Boolean(user.team_profile_id) }

/** Can the signed-in `user` see this feature at all (nav item + its routes)? */
export function canAccessFeature(feature, user) {
  if (!user) return false
  if (ALWAYS_VISIBLE.includes(feature.id)) return true
  if (feature.id in SELF_SERVICE) return SELF_SERVICE[feature.id](user)
  if (SUPER_ADMIN_ONLY.includes(feature.id)) return Boolean(user.is_super_admin)
  if (user.is_super_admin) return true
  return (user.permissions ?? []).includes(feature.id)
}

/** The features array trimmed to what `user` may see — feeds both the sidebar and the route table, so a
 * limited admin can no more navigate straight to a URL than click their way to it. */
export function filterFeaturesByUser(features, user) {
  return features.filter((feature) => canAccessFeature(feature, user))
}
