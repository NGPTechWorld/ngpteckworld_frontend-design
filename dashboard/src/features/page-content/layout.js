import { FileText, House, Info, Megaphone } from 'lucide-react'

export const COLLECTIONS = ['process_steps', 'values', 'why_us']

/**
 * Which text groups and collections each tab shows. Every group of the API and every collection appears exactly
 * once: Home (hero, section headings, "How we work" steps), About (story, values, why-us), Pages (headings of the
 * inner pages) and Banner & footer (the two blocks that repeat on several pages).
 */
export const TAB_LAYOUT = [
  { key: 'home', icon: House, groups: ['home_hero', 'home_sections'], collections: ['process_steps'] },
  { key: 'about', icon: Info, groups: ['about'], collections: ['values', 'why_us'] },
  { key: 'pages', icon: FileText, groups: ['pages'], collections: [] },
  { key: 'shared', icon: Megaphone, groups: ['cta', 'footer'], collections: [] },
]

/** Resolve the group names of TAB_LAYOUT against the API groups. A group the layout does not know yet lands in the last tab, never nowhere. */
export function buildTabs(groups) {
  const byName = new Map(groups.map((group) => [group.group, group]))
  const placed = new Set(TAB_LAYOUT.flatMap((tab) => tab.groups))
  const extra = groups.filter((group) => !placed.has(group.group))

  return TAB_LAYOUT.map((tab, index) => ({
    ...tab,
    groups: [...tab.groups.map((name) => byName.get(name)).filter(Boolean), ...(index === TAB_LAYOUT.length - 1 ? extra : [])],
  }))
}

/** text key → key of the tab that shows it (to jump to the tab of an invalid field). */
export function tabOfKeys(tabs) {
  const map = {}
  for (const tab of tabs) for (const group of tab.groups) for (const item of group.items) map[item.key] = tab.key
  return map
}

/** Arabic label with a fallback to the English one (the API sends both). */
export const labelOf = (record, lang) => (lang === 'ar' ? record.label_ar || record.label : record.label) || ''
