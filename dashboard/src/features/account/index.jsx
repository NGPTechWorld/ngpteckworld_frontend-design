import AccountPage from './AccountPage'

// No `nav` entry: the top bar's "My account" menu links straight to /account, and the Users list
// (super-admin only) also has a card leading here. Reachable by every signed-in admin regardless of
// their section permissions — see app/permissions.js (ALWAYS_VISIBLE).
export default {
  id: 'account',
  routes: [{ path: 'account', element: <AccountPage /> }],
}
