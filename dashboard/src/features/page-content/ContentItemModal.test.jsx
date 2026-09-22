import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ContentItemModal } from './ContentItemModal'
import { contentRoutes, makeItem } from './fixtures'

function setup({ collection = 'process_steps', item = null, extra, ...options } = {}) {
  const fake = contentRoutes({ items: item ? [item] : [] })
  const server = mockApi({ ...fake.routes, ...extra })
  const onClose = vi.fn()
  const view = renderWithProviders(<ContentItemModal collection={collection} item={item} onClose={onClose} />, options)
  return { server, onClose, ...view }
}

const dialog = () => within(screen.getByRole('dialog'))
const save = () => dialog().getByRole('button', { name: 'Save' })
const posts = (server) => server.calls('POST', '/content-items')

async function fillTitles(user) {
  await user.type(dialog().getByLabelText('Title (Arabic)'), 'عنوان')
  await user.type(dialog().getByLabelText('Title (English)'), 'A title')
}

describe('ContentItemModal — add', () => {
  it('opens on the first field with a bilingual title and description, active by default and no icon', () => {
    setup()

    expect(screen.getByRole('dialog', { name: 'Add a step' })).toBeInTheDocument()
    expect(dialog().getByLabelText('Title (Arabic)')).toHaveFocus()
    expect(dialog().getByLabelText('Title (Arabic)')).toHaveAttribute('dir', 'rtl')
    expect(dialog().getByLabelText('Title (English)')).toHaveAttribute('dir', 'ltr')
    expect(dialog().getByLabelText('Description (Arabic)').tagName).toBe('TEXTAREA')
    expect(dialog().getByLabelText('Description (English)').tagName).toBe('TEXTAREA')
    expect(dialog().getByRole('switch', { name: /Shown on the site/ })).toHaveAttribute('aria-checked', 'true')
    expect(dialog().queryByRole('combobox')).not.toBeInTheDocument()
    expect(save()).toBeEnabled()
  })

  it('names the dialog after the collection', () => {
    setup({ collection: 'why_us' })
    expect(screen.getByRole('dialog', { name: 'Add a reason' })).toBeInTheDocument()
  })

  it('validates the titles locally and sends nothing', async () => {
    const { user, server } = setup()

    await user.click(save())

    expect(await dialog().findAllByText('This field is required')).toHaveLength(2)
    expect(dialog().getByLabelText('Title (Arabic)')).toHaveAttribute('aria-invalid', 'true')
    expect(server.requests).toHaveLength(0)
  })

  it('creates the item with its collection, an empty description as null, then closes and toasts', async () => {
    const { user, server, onClose } = setup()
    await fillTitles(user)

    await user.click(save())

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(posts(server)).toHaveLength(1)
    expect(posts(server)[0].body).toEqual({
      collection: 'process_steps',
      title_ar: 'عنوان',
      title_en: 'A title',
      is_active: true,
      body_ar: null,
      body_en: null,
    })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('sends the description, trimmed, and the inactive flag', async () => {
    const { user, server } = setup({ collection: 'why_us' })
    await fillTitles(user)
    await user.type(dialog().getByLabelText('Description (Arabic)'), '  وصف  ')
    await user.type(dialog().getByLabelText('Description (English)'), 'Some text')
    await user.click(dialog().getByRole('switch', { name: /Shown on the site/ }))

    await user.click(save())

    await waitFor(() => expect(posts(server)).toHaveLength(1))
    expect(posts(server)[0].body).toEqual({
      collection: 'why_us',
      title_ar: 'عنوان',
      title_en: 'A title',
      is_active: false,
      body_ar: 'وصف',
      body_en: 'Some text',
    })
  })

  it.each(['process_steps', 'why_us'])('%s has no icon: no select, and icon_key is never sent', async (collection) => {
    const { user, server } = setup({ collection })
    expect(dialog().queryByRole('combobox')).not.toBeInTheDocument()
    await fillTitles(user)

    await user.click(save())

    await waitFor(() => expect(posts(server)).toHaveLength(1))
    expect(posts(server)[0].body).not.toHaveProperty('icon_key')
  })

  it('shows the server validation errors on the matching fields and stays open', async () => {
    const { user, onClose } = setup({
      extra: { 'POST /content-items': () => validationError({ title_en: ['The title en field must not be greater than 255 characters.'], body_ar: ['The body ar field is too long.'] }) },
    })
    await fillTitles(user)

    await user.click(save())

    expect(await screen.findByText('The title en field must not be greater than 255 characters.')).toBeInTheDocument()
    expect(screen.getByText('The body ar field is too long.')).toBeInTheDocument()
    expect(dialog().getByLabelText('Title (English)')).toHaveAttribute('aria-invalid', 'true')
    expect(dialog().getByLabelText('Title (English)')).toHaveFocus()
    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument() // toast
    expect(onClose).not.toHaveBeenCalled()
    expect(save()).toBeEnabled()
  })

  it('shows a toast and keeps what was typed when the server is down', async () => {
    const { user, onClose } = setup({ extra: { 'POST /content-items': () => reply(500, { message: 'boom' }) } })
    await fillTitles(user)

    await user.click(save())

    expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(dialog().getByLabelText('Title (English)')).toHaveValue('A title')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables Save while the request runs', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const { user, onClose } = setup({
      extra: {
        'POST /content-items': async ({ body }) => {
          await gate
          return reply(201, { data: makeItem(9, body.collection, body) })
        },
      },
    })
    await fillTitles(user)

    await user.click(save())

    expect(await dialog().findByRole('button', { name: 'Saving…' })).toBeDisabled()
    release()
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('Cancel and Escape close it without saving', async () => {
    const { user, server, onClose } = setup()
    await user.type(dialog().getByLabelText('Title (English)'), 'x')

    await user.click(dialog().getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(server.requests).toHaveLength(0)
  })

  it('is written in Arabic in the Arabic UI', async () => {
    const { user } = setup({ lang: 'ar' })

    expect(screen.getByRole('dialog', { name: 'إضافة خطوة' })).toBeInTheDocument()
    await user.click(dialog().getByRole('button', { name: 'حفظ' }))
    expect(await dialog().findAllByText('هذا الحقل مطلوب')).toHaveLength(2)
    expect(dialog().getByLabelText('العنوان (العربية)')).toBeInTheDocument()
    expect(dialog().getByRole('switch', { name: /ظاهر في الموقع/ })).toBeInTheDocument()
  })
})

describe('ContentItemModal — values (title + icon)', () => {
  it('has no description and an icon select of exactly the four icons, with a preview that follows the choice', async () => {
    const { user } = setup({ collection: 'values' })

    expect(screen.getByRole('dialog', { name: 'Add a value' })).toBeInTheDocument()
    expect(dialog().queryByLabelText('Description (Arabic)')).not.toBeInTheDocument()
    expect(dialog().queryByLabelText('Description (English)')).not.toBeInTheDocument()

    const select = dialog().getByRole('combobox', { name: 'Icon' })
    const options = within(select).getAllByRole('option')
    expect(options.map((option) => option.value)).toEqual(['quality', 'innovation', 'commit', 'transparency'])
    expect(options.map((option) => option.textContent)).toEqual(['Quality', 'Innovation', 'Commitment', 'Transparency'])
    expect(select).toHaveValue('quality') // there is no empty choice: a value always has an icon
    expect(screen.getByRole('dialog').querySelector('.lucide-star')).toBeInTheDocument()

    await user.selectOptions(select, 'innovation')
    expect(screen.getByRole('dialog').querySelector('.lucide-lightbulb')).toBeInTheDocument()
    await user.selectOptions(select, 'commit')
    expect(screen.getByRole('dialog').querySelector('.lucide-check')).toBeInTheDocument()
    await user.selectOptions(select, 'transparency')
    expect(screen.getByRole('dialog').querySelector('.lucide-eye')).toBeInTheDocument()
  })

  it('sends the chosen icon and no description', async () => {
    const { user, server } = setup({ collection: 'values' })
    await fillTitles(user)
    await user.selectOptions(dialog().getByRole('combobox', { name: 'Icon' }), 'transparency')

    await user.click(save())

    await waitFor(() => expect(posts(server)).toHaveLength(1))
    expect(posts(server)[0].body).toEqual({
      collection: 'values',
      title_ar: 'عنوان',
      title_en: 'A title',
      is_active: true,
      icon_key: 'transparency',
    })
  })

  it('sends the default icon (quality) when the user does not touch the select', async () => {
    const { user, server } = setup({ collection: 'values' })
    await fillTitles(user)

    await user.click(save())

    await waitFor(() => expect(posts(server)).toHaveLength(1))
    expect(posts(server)[0].body.icon_key).toBe('quality')
  })

  it('shows a server error about the icon under the select', async () => {
    const { user } = setup({ collection: 'values', extra: { 'POST /content-items': () => validationError({ icon_key: ['The selected icon key is invalid.'] }) } })
    await fillTitles(user)

    await user.click(save())

    expect(await screen.findByText('The selected icon key is invalid.')).toBeInTheDocument()
    expect(dialog().getByRole('combobox', { name: 'Icon' })).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('ContentItemModal — edit', () => {
  const step = makeItem(7, 'process_steps', { title_ar: 'التحليل', title_en: 'Discovery', body_ar: 'وصف الخطوة', body_en: null })

  it('loads the record and keeps Save disabled until something changes', async () => {
    const { user } = setup({ item: step })

    expect(screen.getByRole('dialog', { name: 'Edit step' })).toBeInTheDocument()
    expect(dialog().getByLabelText('Title (Arabic)')).toHaveValue('التحليل')
    expect(dialog().getByLabelText('Title (English)')).toHaveValue('Discovery')
    expect(dialog().getByLabelText('Description (Arabic)')).toHaveValue('وصف الخطوة')
    expect(dialog().getByLabelText('Description (English)')).toHaveValue('') // null → empty
    expect(save()).toBeDisabled()

    await user.type(dialog().getByLabelText('Title (English)'), '!')

    expect(save()).toBeEnabled()
  })

  it('saves with PUT — without the collection — and closes', async () => {
    const { user, server, onClose } = setup({ item: step })

    await user.clear(dialog().getByLabelText('Title (English)'))
    await user.type(dialog().getByLabelText('Title (English)'), 'Analysis')
    await user.click(dialog().getByRole('switch', { name: /Shown on the site/ }))
    await user.click(save())

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(server.calls('PUT', '/content-items/7')[0].body).toEqual({
      title_ar: 'التحليل',
      title_en: 'Analysis',
      is_active: false,
      body_ar: 'وصف الخطوة',
      body_en: null,
    })
    expect(server.calls('POST')).toHaveLength(0)
  })

  it('can clear a description (sent as null)', async () => {
    const { user, server } = setup({ item: step })

    await user.clear(dialog().getByLabelText('Description (Arabic)'))
    await user.click(save())

    await waitFor(() => expect(server.calls('PUT', '/content-items/7')).toHaveLength(1))
    expect(server.calls('PUT', '/content-items/7')[0].body.body_ar).toBeNull()
  })

  it('edits a value: its icon is selected, and only title, flag and icon are sent', async () => {
    const value = makeItem(8, 'values', { icon_key: 'commit' })
    const { user, server } = setup({ collection: 'values', item: value })
    expect(dialog().getByRole('combobox', { name: 'Icon' })).toHaveValue('commit')
    expect(dialog().queryByLabelText('Description (English)')).not.toBeInTheDocument()

    await user.selectOptions(dialog().getByRole('combobox', { name: 'Icon' }), 'innovation')
    await user.click(save())

    await waitFor(() => expect(server.calls('PUT', '/content-items/8')).toHaveLength(1))
    expect(server.calls('PUT', '/content-items/8')[0].body).toEqual({ title_ar: 'عنوان 8', title_en: 'Title 8', is_active: true, icon_key: 'innovation' })
  })

  it('a value saved without an icon starts on "Quality" (what the public site draws for it)', () => {
    setup({ collection: 'values', item: makeItem(9, 'values', { icon_key: null }) })
    expect(dialog().getByRole('combobox', { name: 'Icon' })).toHaveValue('quality')
  })

  it('shows server errors on an edit too', async () => {
    const { user } = setup({ item: step, extra: { 'PUT /content-items/:id': () => validationError({ body_ar: ['Description is too long.'] }) } })
    await user.type(dialog().getByLabelText('Description (Arabic)'), ' more')

    await user.click(save())

    expect(await screen.findByText('Description is too long.')).toBeInTheDocument()
    expect(dialog().getByLabelText('Description (Arabic)')).toHaveAttribute('aria-invalid', 'true')
  })
})
