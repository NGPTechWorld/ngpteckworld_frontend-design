import { FolderKanban } from 'lucide-react'
import ProjectCreate from './ProjectCreate'
import ProjectEdit from './ProjectEdit'
import ProjectList from './ProjectList'

// The feature contract (docs/PLAN.md §7.1): auto-discovered by src/app/features.js — no registration needed.
export default {
  id: 'projects',
  nav: { order: 30, group: 'content', icon: FolderKanban, label: { ar: 'المشاريع', en: 'Projects' }, to: '/projects' },
  routes: [
    { path: 'projects', element: <ProjectList /> },
    { path: 'projects/new', element: <ProjectCreate /> },
    { path: 'projects/:id', element: <ProjectEdit /> },
  ],
}
