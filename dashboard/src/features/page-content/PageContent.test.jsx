import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import PageContent from './PageContent'
import { applyTextsUpdate, contentRoutes, makeGroups, makeItem } from './fixtures'

const items = [
  makeItem(1, 'process_steps'),
  makeItem(2, 'process_steps'),
  makeItem(3, 'values', { icon_key: 'innovation' }),
  makeItem(4, 'values'),
  makeItem(5, 'why_us'),
]

/** Page + a stateful fake API (texts and collections). `extra` overrides routes, `transform` mimics the server normalising a saved value. */
function setup({ extra, transform, groups, ...options } = {}) {
  const fake = contentRoutes({ items, transform, groups })
  const server = mockApi({ ...fake.routes, ...extra })
  return { fake, server, ...renderWithProviders(<PageContent />, { route: '/page-content', ...options }) }
}

const input = (label) => screen.getByLabelText(label)
const putCalls = (server) => server.calls('PUT', '/content/texts')
const openTab = (user, name) => user.click(screen.getByRole('tab', { name }))
const saveButton = () => screen.getByRole('button', { name: /^(Save changes|Saving…)$/ })

/** Replace the value of a text field. */
async function rewrite(user, label, text) {
  const field = input(label)
  await user.clear(field)
  if (text) await user.type(field, text)
}

describe('PageContent — loading and layout', () => {
  it('shows a spinner, then the info alert, four tabs and the save bar', async () => {
    setup()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Page content' })).toBeInTheDocument()

    expect(await screen.findByRole('tab', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Home', 'About', 'Pages', 'Banner & footer'])
    expect(screen.getByText('Leave a field empty and the website keeps its own built-in text.')).toBeInTheDocument()
    expect(screen.getByText(/within about a minute/)).toBeInTheDocument()
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
  })

  it('shows every group and every collection exactly once, with only the first tab open', async () => {
    setup()
    await screen.findByRole('tab', { name: 'Home' })

    for (const group of makeGroups()) {
      expect(screen.getAllByRole('heading', { level: 2, name: group.label, hidden: true })).toHaveLength(1)
    }
    for (const title of ['How we work — steps', 'Values', 'Why choose us']) {
      expect(screen.getAllByRole('heading', { level: 2, name: title, hidden: true })).toHaveLength(1)
    }
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(4)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'page-content-panel-home')
    expect(screen.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true')
  })

  it('puts hero, headings and steps on Home; story, values and why-us on About; the rest on their own tabs', async () => {
    const { user } = setup()
    await screen.findByRole('tab', { name: 'Home' })

    const home = screen.getByRole('tabpanel')
    expect(within(home).getByRole('heading', { name: 'Home page — hero' })).toBeInTheDocument()
    expect(within(home).getByRole('heading', { name: 'Home page — section headings' })).toBeInTheDocument()
    expect(within(home).getByRole('heading', { name: 'How we work — steps' })).toBeInTheDocument()
    expect(within(home).queryByRole('heading', { name: 'About page' })).not.toBeInTheDocument()

    await openTab(user, 'About')
    const about = screen.getByRole('tabpanel')
    for (const name of ['About page', 'Values', 'Why choose us']) expect(within(about).getByRole('heading', { name })).toBeInTheDocument()

    await openTab(user, 'Pages')
    expect(within(screen.getByRole('tabpanel')).getByRole('heading', { name: 'Page headings & intros' })).toBeInTheDocument()

    await openTab(user, 'Banner & footer')
    const shared = screen.getByRole('tabpanel')
    expect(within(shared).getByRole('heading', { name: 'Call-to-action banner' })).toBeInTheDocument()
    expect(within(shared).getByRole('heading', { name: 'Footer' })).toBeInTheDocument()
  })

  it('requests every collection with per_page 200', async () => {
    const { server } = setup()
    await screen.findByText('Title 1')

    const lists = server.calls('GET', '/content-items').map((call) => call.query)
    expect(lists.map((query) => query.collection).sort()).toEqual(['process_steps', 'values', 'why_us'])
    for (const query of lists) expect(query).toMatchObject({ per_page: '200', sort: 'order', dir: 'asc' })
  })

  it('shows a retryable error when the texts cannot be loaded (the info alert stays)', async () => {
    const { user, server } = setup({ extra: { 'GET /content/texts': () => reply(500, { message: 'boom' }) } })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
    expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(screen.getByText('Before you start')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()

    server.on('GET /content/texts', () => ({ data: makeGroups() }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('tab', { name: 'Home' })).toBeInTheDocument()
  })
})

describe('PageContent — the texts', () => {
  it('renders each text with an Arabic (rtl) and an English (ltr) box: a line for text, a textarea for textarea', async () => {
    setup()
    const badgeAr = await screen.findByLabelText('Hero badge (Arabic)')

    expect(badgeAr).toHaveValue('شركة برمجيات')
    expect(badgeAr).toHaveAttribute('dir', 'rtl')
    expect(badgeAr).toHaveAttribute('lang', 'ar')
    expect(badgeAr.tagName).toBe('INPUT')
    expect(input('Hero badge (English)')).toHaveValue('Software Studio')
    expect(input('Hero badge (English)')).toHaveAttribute('dir', 'ltr')
    expect(input('Hero description (English)').tagName).toBe('TEXTAREA')
    expect(input('Hero description (Arabic)')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByText('Small badge above the main headline on the home page.')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Hero badge' })).getByText('15 / 2000')).toBeInTheDocument()
  })

  it('reads the Arabic labels, hints and texts in the Arabic UI', async () => {
    setup({ lang: 'ar' })
    const badgeAr = await screen.findByLabelText('شارة الواجهة (العربية)')

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['الرئيسية', 'من نحن', 'الصفحات', 'الشريط والتذييل'])
    expect(screen.getByRole('heading', { level: 1, name: 'محتوى الصفحات' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'الصفحة الرئيسية — الواجهة' })).toBeInTheDocument()
    expect(badgeAr).toHaveValue('شركة برمجيات')
    expect(screen.getByLabelText('شارة الواجهة (English)')).toHaveValue('Software Studio')
    expect(screen.getByText('شارة صغيرة فوق العنوان الرئيسي في الصفحة الرئيسية.')).toBeInTheDocument()
    expect(screen.getByText('لا توجد تعديلات غير محفوظة')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'حفظ التعديلات' })).toBeDisabled()
    expect(screen.getByRole('heading', { level: 2, name: 'خطوات «كيف نعمل»' })).toBeInTheDocument()
  })

  it('falls back to the English label when a group or text has no Arabic label', async () => {
    const groups = makeGroups()
    groups[0].label_ar = null
    groups[0].items[0].label_ar = null
    setup({ lang: 'ar', groups })

    expect(await screen.findByRole('heading', { level: 2, name: 'Home page — hero' })).toBeInTheDocument()
    expect(screen.getByLabelText('Hero badge (العربية)')).toBeInTheDocument()
  })

  it('shows empty values as empty boxes that say the built-in text is used', async () => {
    const groups = makeGroups()
    groups[0].items[0].value_en = null
    setup({ groups })

    const field = await screen.findByLabelText('Hero badge (English)')
    expect(field).toHaveValue('')
    expect(field).toHaveAttribute('placeholder', 'Empty — the website shows its built-in text')
  })

  it('keeps every tab mounted: fields of closed tabs exist and typed values survive switching tabs', async () => {
    const { user } = setup()
    await screen.findByRole('tab', { name: 'Home' })
    expect(input('Story — title (English)')).not.toBeVisible() // About is closed but mounted

    await user.type(input('Hero badge (English)'), '!')
    await openTab(user, 'About')
    expect(input('Story — title (English)')).toBeVisible()
    expect(input('Hero badge (English)')).not.toBeVisible()
    await openTab(user, /Home/)

    expect(input('Hero badge (English)')).toHaveValue('Software Studio!')
  })

  it('counts characters under each field and turns the count red past 2000', async () => {
    setup()
    await screen.findByRole('tab', { name: 'Home' })
    const group = within(screen.getByRole('group', { name: 'Hero description' }))

    fireEvent.change(input('Hero description (English)'), { target: { value: 'abc' } })
    expect(group.getByText('3 / 2000')).toBeInTheDocument()

    fireEvent.change(input('Hero description (English)'), { target: { value: 'a'.repeat(2001) } })
    expect(group.getByText('2001 / 2000')).toHaveClass('text-danger')
  })
})

describe('PageContent — saving', () => {
  it('keeps Save disabled until something changes and counts the unsaved texts', async () => {
    const { user } = setup()
    await screen.findByRole('tab', { name: 'Home' })
    expect(saveButton()).toBeDisabled()

    await user.type(input('Hero badge (English)'), '!')
    expect(saveButton()).toBeEnabled()
    expect(screen.getByText('1 unsaved change')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Hero badge' })).getByText('Edited')).toBeInTheDocument()

    await user.type(input('Hero badge (Arabic)'), '!') // second language of the same text: still one change
    expect(screen.getByText('1 unsaved change')).toBeInTheDocument()

    await user.type(input('Contact page — title (English)'), '!')
    expect(screen.getByText('2 unsaved changes')).toBeInTheDocument()

    // typing everything back removes the edits again
    await user.type(input('Contact page — title (English)'), '{Backspace}')
    await user.type(input('Hero badge (English)'), '{Backspace}')
    await user.type(input('Hero badge (Arabic)'), '{Backspace}')
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
  })

  it('shows the number of edited texts on the tab that holds them', async () => {
    const { user } = setup()
    await screen.findByRole('tab', { name: 'Home' })

    await openTab(user, 'About')
    await user.type(input('Story — title (English)'), '!')
    await user.type(input('Story — text (Arabic)'), '!')

    expect(screen.getByRole('tab', { name: /About/ })).toHaveTextContent('2')
    expect(screen.getByRole('tab', { name: 'About, 2 edited' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Home' })).toBeInTheDocument() // no badge on the tabs without edits
  })

  it('sends ONLY the changed keys and languages, in the order of the page', async () => {
    const { user, server } = setup()
    await screen.findByRole('tab', { name: 'Home' })

    await openTab(user, 'About')
    await rewrite(user, 'Story — title (Arabic)', 'قصة جديدة') // typed first, but it comes after heroBadge on the page
    await openTab(user, /Home/)
    await rewrite(user, 'Hero badge (English)', 'New badge')
    await user.click(saveButton())

    await waitFor(() => expect(putCalls(server)).toHaveLength(1))
    expect(putCalls(server)[0].body).toEqual({
      items: [
        { key: 'heroBadge', value_en: 'New badge' },
        { key: 'aboutTitle', value_ar: 'قصة جديدة' },
      ],
    })
  })

  it('sends both languages of a text when both changed', async () => {
    const { user, server } = setup()
    await screen.findByRole('tab', { name: 'Home' })

    await rewrite(user, 'Hero badge (Arabic)', 'جديد')
    await rewrite(user, 'Hero badge (English)', 'Fresh')
    await user.click(saveButton())

    await waitFor(() => expect(putCalls(server)).toHaveLength(1))
    expect(putCalls(server)[0].body.items).toEqual([{ key: 'heroBadge', value_ar: 'جديد', value_en: 'Fresh' }])
  })

  it('trims spaces and sends an emptied text as null (= the website keeps its built-in text)', async () => {
    const { user, server } = setup()
    await screen.findByRole('tab', { name: 'Home' })

    await rewrite(user, 'Hero badge (English)', '  Trimmed  ')
    await rewrite(user, 'Services — small heading (Arabic)', '')
    await user.click(saveButton())

    await waitFor(() => expect(putCalls(server)).toHaveLength(1))
    expect(putCalls(server)[0].body.items).toEqual([
      { key: 'heroBadge', value_en: 'Trimmed' },
      { key: 'servicesKick', value_ar: null },
    ])
  })

  it('refreshes the form from the response: the stored value shows, nothing is dirty, the next save sends only new edits', async () => {
    const { user, server } = setup({ transform: (value) => `${value} (stored)` })
    await screen.findByRole('tab', { name: 'Home' })

    await rewrite(user, 'Hero badge (English)', 'New badge')
    await user.click(saveButton())

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(input('Hero badge (English)')).toHaveValue('New badge (stored)')
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
    expect(within(screen.getByRole('group', { name: 'Hero badge' })).queryByText('Edited')).not.toBeInTheDocument()

    await openTab(user, /Banner/)
    await rewrite(user, 'Copyright line (English)', 'Rights')
    await user.click(saveButton())

    await waitFor(() => expect(putCalls(server)).toHaveLength(2))
    expect(putCalls(server)[1].body).toEqual({ items: [{ key: 'footRights', value_en: 'Rights' }] })
  })

  it('freezes the fields and shows "Saving…" while the request runs', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const { user, server, fake } = setup()
    server.on('PUT /content/texts', async ({ body }) => {
      await gate
      fake.state.groups = applyTextsUpdate(fake.state.groups, body.items)
      return { data: fake.state.groups }
    })
    await screen.findByRole('tab', { name: 'Home' })
    await user.type(input('Hero badge (English)'), '!')

    await user.click(saveButton())

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(input('Hero badge (English)')).toHaveAttribute('readonly')
    release()
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(input('Hero badge (English)')).not.toHaveAttribute('readonly')
  })

  it('keeps the edits and shows a toast when the server is down', async () => {
    const { user } = setup({ extra: { 'PUT /content/texts': () => reply(500, { message: 'boom' }) } })
    await screen.findByRole('tab', { name: 'Home' })
    await user.type(input('Hero badge (English)'), '!')

    await user.click(saveButton())

    expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(input('Hero badge (English)')).toHaveValue('Software Studio!')
    expect(saveButton()).toBeEnabled()
    expect(screen.getByText('1 unsaved change')).toBeInTheDocument()
  })

  it('maps a 422 onto the right field, opens its tab and focuses it', async () => {
    const message = 'The items.0.value_en field must not be greater than 2000 characters.'
    const { user } = setup({ extra: { 'PUT /content/texts': () => validationError({ 'items.0.value_en': [message] }) } })
    await screen.findByRole('tab', { name: 'Home' })

    await openTab(user, 'About')
    await user.type(input('Story — title (English)'), '!')
    await openTab(user, /Home/)
    await user.click(saveButton())

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument() // toast
    expect(screen.getByRole('tab', { name: /About/ })).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(input('Story — title (English)')).toHaveFocus())
    expect(input('Story — title (English)')).toHaveAttribute('aria-invalid', 'true')
    expect(input('Story — title (Arabic)')).not.toHaveAttribute('aria-invalid')
    expect(saveButton()).toBeEnabled() // the user can correct and retry
  })

  it('shows a general alert for a 422 that is not about one value', async () => {
    const { user } = setup({ extra: { 'PUT /content/texts': () => validationError({ items: ['The items field is required.'] }) } })
    await screen.findByRole('tab', { name: 'Home' })
    await user.type(input('Hero badge (English)'), '!')

    await user.click(saveButton())

    expect(await screen.findByText('The server rejected some values')).toBeInTheDocument()
    expect(screen.getByText('The given data was invalid.')).toBeInTheDocument()
  })

  it('does not send text that is over 2000 characters: the error appears on its field, even in a closed tab', async () => {
    const { user, server } = setup()
    await screen.findByRole('tab', { name: 'Home' })

    await openTab(user, 'About')
    fireEvent.change(input('Story — text (English)'), { target: { value: 'a'.repeat(2001) } })
    await openTab(user, /Home/)
    await user.click(saveButton())

    expect(await screen.findByText('At most 2000 characters')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /About/ })).toHaveAttribute('aria-selected', 'true')
    expect(input('Story — text (English)')).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(input('Story — text (English)')).toHaveFocus())
    expect(putCalls(server)).toHaveLength(0)
  })

  it('accepts exactly 2000 characters', async () => {
    const { user, server } = setup()
    await screen.findByRole('tab', { name: 'Home' })

    fireEvent.change(input('Hero description (English)'), { target: { value: 'a'.repeat(2000) } })
    await user.click(saveButton())

    await waitFor(() => expect(putCalls(server)).toHaveLength(1))
    expect(putCalls(server)[0].body.items[0].value_en).toHaveLength(2000)
  })
})

describe('PageContent — unsaved edits', () => {
  it('reverts a single text to its saved value', async () => {
    const { user } = setup()
    await screen.findByRole('tab', { name: 'Home' })
    await user.type(input('Hero badge (English)'), '!')
    await user.type(input('Contact page — title (English)'), '!')
    const group = within(screen.getByRole('group', { name: 'Hero badge' }))

    await user.click(group.getByRole('button', { name: 'Revert “Hero badge” to saved' }))

    expect(input('Hero badge (English)')).toHaveValue('Software Studio')
    expect(group.queryByText('Edited')).not.toBeInTheDocument()
    expect(group.queryByRole('button', { name: /Revert/ })).not.toBeInTheDocument()
    expect(screen.getByText('1 unsaved change')).toBeInTheDocument() // the other text is untouched
    expect(input('Contact page — title (English)')).toHaveValue("Let's talk!")
  })

  it('discards every unsaved edit, but only after asking', async () => {
    const { user } = setup()
    await screen.findByRole('tab', { name: 'Home' })
    await user.type(input('Hero badge (English)'), '!')
    await user.type(input('Contact page — title (Arabic)'), '!')

    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    const dialog = screen.getByRole('dialog', { name: 'Discard changes?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(input('Hero badge (English)')).toHaveValue('Software Studio!')

    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Discard' }))

    await waitFor(() => expect(input('Hero badge (English)')).toHaveValue('Software Studio'))
    expect(input('Contact page — title (Arabic)')).toHaveValue('لنبدأ الحديث')
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeDisabled()
  })

  it('warns before the page is left, only while there are unsaved edits', async () => {
    const { user } = setup()
    await screen.findByRole('tab', { name: 'Home' })
    const leave = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(leave()).toBe(false)

    await user.type(input('Hero badge (English)'), '!')
    expect(leave()).toBe(true)

    await user.click(saveButton())
    await screen.findByText('Saved')
    expect(leave()).toBe(false)
  })

  it('removes the warning when the page closes', async () => {
    const { user, unmount } = setup()
    await screen.findByRole('tab', { name: 'Home' })
    await user.type(input('Hero badge (English)'), '!')

    unmount()

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('PageContent — collections inside the page', () => {
  it('adds a step through the modal, refreshes the list and never touches the texts', async () => {
    const { user, server } = setup()
    expect(await screen.findByText('Title 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add step' }))
    const dialog = screen.getByRole('dialog', { name: 'Add a step' })
    await user.type(within(dialog).getByLabelText('Title (Arabic)'), 'خطوة جديدة')
    await user.type(within(dialog).getByLabelText('Title (English)'), 'Brand new step')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Brand new step')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(server.calls('POST', '/content-items')[0].body).toMatchObject({ collection: 'process_steps', title_en: 'Brand new step' })
    expect(putCalls(server)).toHaveLength(0) // the modal's submit must not save the texts form behind it
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument()
  })

  it('does not lose text edits while a collection item is added', async () => {
    const { user } = setup()
    await screen.findByText('Title 2')
    await user.type(input('Hero badge (English)'), '!')

    await user.click(screen.getByRole('button', { name: 'Add step' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

    expect(input('Hero badge (English)')).toHaveValue('Software Studio!')
    expect(screen.getByText('1 unsaved change')).toBeInTheDocument()
  })

  it('opens an existing item in the modal to edit it', async () => {
    const { user, server } = setup()
    await screen.findByText('Title 2')

    await user.click(screen.getByRole('button', { name: 'Edit: Title 2' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit step' })
    expect(within(dialog).getByLabelText('Title (English)')).toHaveValue('Title 2')
    await user.clear(within(dialog).getByLabelText('Title (English)'))
    await user.type(within(dialog).getByLabelText('Title (English)'), 'Renamed step')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Renamed step')).toBeInTheDocument()
    expect(server.calls('PUT', '/content-items/2')[0].body).toMatchObject({ title_en: 'Renamed step' })
  })

  it('adds a value from the About tab (icon, no description)', async () => {
    const { user, server } = setup()
    await screen.findByRole('tab', { name: 'Home' })
    await openTab(user, 'About')

    await user.click(screen.getByRole('button', { name: 'Add value' }))
    const dialog = screen.getByRole('dialog', { name: 'Add a value' })
    await user.type(within(dialog).getByLabelText('Title (Arabic)'), 'الإتقان')
    await user.type(within(dialog).getByLabelText('Title (English)'), 'Craft')
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Icon' }), 'transparency')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/content-items')).toHaveLength(1))
    expect(server.calls('POST', '/content-items')[0].body).toEqual({
      collection: 'values',
      title_ar: 'الإتقان',
      title_en: 'Craft',
      is_active: true,
      icon_key: 'transparency',
    })
    expect(await screen.findByText('Craft')).toBeInTheDocument()
  })
})
