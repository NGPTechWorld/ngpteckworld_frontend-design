import { Briefcase } from 'lucide-react'
import MyPortfolioPage from './MyPortfolioPage'

// Visible only when the signed-in admin's account is linked to a team profile (user.team_profile_id) —
// see app/permissions.js (SELF_SERVICE). Lets that one person manage their own portfolio without needing
// the "team" section permission, which would let them edit everyone else's profile too.
export default {
  id: 'my-portfolio',
  nav: { order: 15, group: 'main', icon: Briefcase, label: { ar: 'بورتفوليو أعمالي', en: 'My Portfolio' }, to: '/my-portfolio' },
  routes: [{ path: 'my-portfolio', element: <MyPortfolioPage /> }],
}
