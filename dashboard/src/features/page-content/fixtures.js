// Test data shared by the tests of this feature (nothing in the app imports this file).
import { paginated, reply } from '@/test/mockApi'

const makeText = (key, label, label_ar, type, value_ar, value_en) => ({ key, label, label_ar, type, value_ar, value_en })

/** Every group of the real API (6), with a few representative texts each. */
export const makeGroups = () => [
  {
    group: 'home_hero',
    label: 'Home page — hero',
    label_ar: 'الصفحة الرئيسية — الواجهة',
    items: [
      makeText('heroBadge', 'Hero badge', 'شارة الواجهة', 'text', 'شركة برمجيات', 'Software Studio'),
      makeText('heroSub', 'Hero description', 'وصف الواجهة', 'textarea', 'وصف الواجهة', 'Hero description text'),
    ],
  },
  {
    group: 'home_sections',
    label: 'Home page — section headings',
    label_ar: 'الصفحة الرئيسية — عناوين الأقسام',
    items: [makeText('servicesKick', 'Services — small heading', 'الخدمات — عنوان صغير', 'text', 'خدماتنا', 'What we do')],
  },
  {
    group: 'cta',
    label: 'Call-to-action banner',
    label_ar: 'شريط الدعوة لاتخاذ إجراء',
    items: [makeText('ctaTitle', 'Banner title', 'عنوان الشريط', 'text', 'جاهز لتبدأ؟', 'Ready to start?')],
  },
  {
    group: 'pages',
    label: 'Page headings & intros',
    label_ar: 'عناوين الصفحات ومقدماتها',
    items: [makeText('contactTitle', 'Contact page — title', 'صفحة التواصل — العنوان', 'text', 'لنبدأ الحديث', "Let's talk")],
  },
  {
    group: 'about',
    label: 'About page',
    label_ar: 'صفحة من نحن',
    items: [
      makeText('aboutTitle', 'Story — title', 'القصة — العنوان', 'text', 'قصتنا', 'Our Story'),
      makeText('aboutStory', 'Story — text', 'القصة — النص', 'textarea', 'نص القصة', 'The story text'),
    ],
  },
  {
    group: 'footer',
    label: 'Footer',
    label_ar: 'التذييل',
    items: [makeText('footRights', 'Copyright line', 'سطر حقوق النشر', 'text', 'جميع الحقوق محفوظة', 'All rights reserved')],
  },
]

/** Apply a `PUT /content/texts` body to groups the way the API does: only the keys and languages that are sent (null / '' clears). */
export function applyTextsUpdate(groups, items, { transform = (value) => value } = {}) {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const change = items.find((entry) => entry.key === item.key)
      if (!change) return item
      const next = { ...item }
      for (const lang of ['ar', 'en']) {
        if (`value_${lang}` in change) next[`value_${lang}`] = change[`value_${lang}`] === '' ? null : transform(change[`value_${lang}`])
      }
      return next
    }),
  }))
}

export const makeItem = (id, collection, over = {}) => ({
  id,
  collection,
  title_ar: `عنوان ${id}`,
  title_en: `Title ${id}`,
  body_ar: collection === 'values' ? null : `نص ${id}`,
  body_en: collection === 'values' ? null : `Body ${id}`,
  icon_key: collection === 'values' ? 'quality' : null,
  is_active: true,
  order: id - 1,
  created_at: '2026-09-01T10:00:00.000000Z',
  updated_at: '2026-09-01T10:00:00.000000Z',
  ...over,
})

/**
 * Routes of a stateful fake of the whole page-content API: texts and the three collections, with create / update /
 * delete / reorder changing what the next GET returns, like the real thing. `state.groups` / `state.items` are live.
 */
export function contentRoutes({ groups = makeGroups(), items = [], transform } = {}) {
  const state = { groups, items: items.map((item) => ({ ...item })), nextId: 100 } // copies: the routes mutate rows
  const byOrder = (a, b) => a.order - b.order

  return {
    state,
    routes: {
      'GET /content/texts': () => ({ data: state.groups }),
      'PUT /content/texts': ({ body }) => {
        state.groups = applyTextsUpdate(state.groups, body.items, { transform })
        return { data: state.groups }
      },
      'GET /content-items': ({ query }) => {
        const rows = state.items.filter((item) => !query.collection || item.collection === query.collection).sort(byOrder)
        return paginated(rows, { perPage: Number(query.per_page) || 15 })
      },
      'POST /content-items': ({ body }) => {
        const order = state.items.filter((item) => item.collection === body.collection).length
        const created = makeItem(state.nextId++, body.collection, { body_ar: null, body_en: null, icon_key: null, order, ...body })
        state.items.push(created)
        return reply(201, { data: created })
      },
      'PUT /content-items/:id': ({ params, body }) => {
        const index = state.items.findIndex((item) => item.id === Number(params.id))
        state.items[index] = { ...state.items[index], ...body }
        return { data: state.items[index] }
      },
      'DELETE /content-items/:id': ({ params }) => {
        state.items = state.items.filter((item) => item.id !== Number(params.id))
        return null
      },
      'POST /content-items/reorder': ({ body }) => {
        body.ids.forEach((id, position) => {
          const row = state.items.find((item) => item.id === id)
          if (row) row.order = position
        })
        return null
      },
    },
  }
}
