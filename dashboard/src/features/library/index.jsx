import { BookOpen } from 'lucide-react'
import BookCreate from './BookCreate'
import BookEdit from './BookEdit'
import BookList from './BookList'

const label = { ar: 'المكتبة', en: 'Library' }

export default {
  id: 'library',
  nav: { order: 44, group: 'content', icon: BookOpen, label, to: '/library' },
  routes: [
    { path: 'library', element: <BookList /> },
    { path: 'library/new', element: <BookCreate /> },
    { path: 'library/:id', element: <BookEdit /> },
  ],
}
