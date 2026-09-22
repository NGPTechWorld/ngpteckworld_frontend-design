import { Users } from 'lucide-react'
import UserCreate from './UserCreate'
import UserEdit from './UserEdit'
import UserList from './UserList'

const label = { ar: 'المستخدمون', en: 'Users' }

// Super-admin only (see app/permissions.js): managing other admins' accounts and their section permissions is
// never itself a grantable permission. Every admin's OWN account is the separate `account` feature (/account),
// which this list links to.
export default {
  id: 'users',
  nav: { order: 110, group: 'system', icon: Users, label, to: '/users' },
  routes: [
    { path: 'users', element: <UserList /> },
    { path: 'users/new', element: <UserCreate /> },
    { path: 'users/:id', element: <UserEdit /> },
  ],
}
