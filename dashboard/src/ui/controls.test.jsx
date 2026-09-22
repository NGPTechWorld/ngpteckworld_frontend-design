import { screen, within } from '@testing-library/react'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { Alert } from './Alert'
import { Avatar } from './Avatar'
import { Badge, StatusBadge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { Checkbox } from './Checkbox'
import { ComingSoon } from './ComingSoon'
import { Dropdown } from './Dropdown'
import { EmptyState } from './EmptyState'
import { Field } from './Field'
import { FormActions } from './FormActions'
import { IconButton } from './IconButton'
import { Input } from './Input'
import { PageHeader } from './PageHeader'
import { PasswordInput } from './PasswordInput'
import { SearchInput } from './SearchInput'
import { Select } from './Select'
import { StatCard } from './StatCard'
import { Switch } from './Switch'
import { TabPanel, Tabs } from './Tabs'
import { Textarea } from './Textarea'

describe('Button / IconButton', () => {
  it('is a type=button by default, supports icons, loading and links', async () => {
    const onClick = vi.fn()
    const { user, rerender } = renderWithProviders(<Button icon={Plus} onClick={onClick}>Add</Button>)
    const button = screen.getByRole('button', { name: 'Add' })
    expect(button).toHaveAttribute('type', 'button')
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<Button loading onClick={onClick}>Add</Button>)
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('aria-busy', 'true')

    rerender(<Button to="/faqs/new">New</Button>)
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute('href', '/faqs/new')
  })

  it('IconButton requires and exposes its label', () => {
    renderWithProviders(<IconButton icon={Trash2} label="Delete row" tone="danger" />)
    const button = screen.getByRole('button', { name: 'Delete row' })
    expect(button).toHaveAttribute('title', 'Delete row')
  })
})

describe('Field + Input / Textarea / Select', () => {
  it('links label, control, hint and error', () => {
    renderWithProviders(
      <Field label="Name" hint="Public name" error="Too short" required>
        <Input defaultValue="x" />
      </Field>,
    )
    const input = screen.getByLabelText(/Name/)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Too short Public name')
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('accepts a react-hook-form style error object', () => {
    renderWithProviders(
      <Field label="Email" error={{ type: 'server', message: 'Taken' }}>
        <Input />
      </Field>,
    )
    expect(screen.getByText('Taken')).toBeInTheDocument()
  })

  it('renders email / url / number inputs left-to-right in an RTL UI', () => {
    renderWithProviders(
      <>
        <Input aria-label="mail" type="email" />
        <Input aria-label="plain" />
        <Input aria-label="forced" dir="rtl" type="url" />
      </>,
      { lang: 'ar' },
    )
    expect(screen.getByLabelText('mail')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByLabelText('plain')).not.toHaveAttribute('dir')
    expect(screen.getByLabelText('forced')).toHaveAttribute('dir', 'rtl')
  })

  it('unlike email/url/number, PasswordInput follows the page direction (RTL in Arabic)', () => {
    const { rerender } = renderWithProviders(<PasswordInput aria-label="pw" showLabel="Show" hideLabel="Hide" />, { lang: 'ar' })
    expect(screen.getByLabelText('pw')).not.toHaveAttribute('dir') // no override: inherits <html dir="rtl">

    rerender(<PasswordInput aria-label="pw" showLabel="Show" hideLabel="Hide" dir="ltr" />)
    expect(screen.getByLabelText('pw')).toHaveAttribute('dir', 'ltr') // still overridable
  })

  it('PasswordInput toggles visibility with its own show/hide labels', async () => {
    const { user } = renderWithProviders(<PasswordInput aria-label="pw" showLabel="Show password" hideLabel="Hide password" />)
    const field = screen.getByLabelText('pw')
    expect(field).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(field).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(field).toHaveAttribute('type', 'password')
  })

  it('Textarea and Select follow the same conventions', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(
      <>
        <Field label="Notes" error="Required">
          <Textarea rows={3} />
        </Field>
        <Field label="Status">
          <Select
            placeholder="Choose…"
            options={[
              { value: 'new', label: 'New' },
              { value: 'done', label: 'Done' },
            ]}
            onChange={(event) => onChange(event.target.value)}
          />
        </Field>
      </>,
    )
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-invalid', 'true')
    const select = screen.getByLabelText('Status')
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['Choose…', 'New', 'Done'])
    await user.selectOptions(select, 'done')
    expect(onChange).toHaveBeenCalledWith('done')
  })
})

describe('Switch / Checkbox', () => {
  it('Switch is a role=switch button reflecting and toggling its state', async () => {
    function Demo() {
      const [on, setOn] = useState(false)
      return <Switch checked={on} onChange={setOn} label="Active" description="Shown on the site" />
    }
    const { user } = renderWithProviders(<Demo />)
    const toggle = screen.getByRole('switch', { name: /Active/ })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByText('Active')) // the label toggles too
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    toggle.focus()
    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('Switch can be disabled and takes an aria-label', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Switch checked aria-label="Featured" disabled onChange={onChange} />)
    await user.click(screen.getByRole('switch', { name: 'Featured' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('Checkbox reports a boolean and supports indeterminate', async () => {
    const onChange = vi.fn()
    const { user, rerender } = renderWithProviders(<Checkbox checked={false} onChange={onChange} label="Pick" />)
    await user.click(screen.getByRole('checkbox', { name: 'Pick' }))
    expect(onChange).toHaveBeenCalledWith(true)

    rerender(<Checkbox checked={false} indeterminate onChange={onChange} aria-label="some" />)
    expect(screen.getByRole('checkbox', { name: 'some' }).indeterminate).toBe(true)
  })
})

describe('Badge / StatusBadge', () => {
  it('StatusBadge localizes known statuses and supports custom ones', () => {
    renderWithProviders(
      <>
        <StatusBadge status="new" />
        <StatusBadge status="in_progress" />
        <StatusBadge active />
        <StatusBadge active={false} />
        <StatusBadge status="archived" statuses={{ archived: { tone: 'warning', label: 'Archived' } }} />
        <Badge tone="gold">Featured</Badge>
      </>,
    )
    ;['New', 'In progress', 'Active', 'Inactive', 'Archived', 'Featured'].forEach((text) => expect(screen.getByText(text)).toBeInTheDocument())
  })

  it('StatusBadge speaks Arabic in the Arabic UI', () => {
    renderWithProviders(<StatusBadge status="done" />, { lang: 'ar' })
    expect(screen.getByText('تمت')).toBeInTheDocument()
  })
})

describe('FormActions', () => {
  it('Save is the submit button and disabled while saving or pristine', () => {
    const { rerender } = renderWithProviders(<FormActions cancelTo="/faqs" />)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled() // no `dirty` prop = create form
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/faqs')

    rerender(<FormActions dirty={false} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    rerender(<FormActions dirty />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()

    rerender(<FormActions dirty saving cancelTo="/x" />)
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  })

  it('supports onCancel and extra buttons', async () => {
    const onCancel = vi.fn()
    const { user } = renderWithProviders(<FormActions onCancel={onCancel}><button type="button">Extra</button></FormActions>)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Extra' })).toBeInTheDocument()
  })
})

describe('Tabs', () => {
  function Demo() {
    const [tab, setTab] = useState('general')
    return (
      <>
        <Tabs idPrefix="p" label="Sections" value={tab} onChange={setTab} tabs={[{ key: 'general', label: 'General' }, { key: 'media', label: 'Media', badge: 3 }, { key: 'team', label: 'Team', disabled: true }, { key: 'links', label: 'Links' }]} />
        <TabPanel idPrefix="p" value="general" active={tab}>General content</TabPanel>
        <TabPanel idPrefix="p" value="media" active={tab}>Media content</TabPanel>
      </>
    )
  }

  it('shows the active panel and switches on click', async () => {
    const { user } = renderWithProviders(<Demo />)
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('General content')
    expect(screen.getByRole('tab', { name: /Media/ })).toHaveTextContent('3')

    await user.click(screen.getByRole('tab', { name: /Media/ }))

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Media content')
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/Media/)
  })

  it('arrow keys move between enabled tabs (mirrored in RTL), Home and End jump', async () => {
    const { user } = renderWithProviders(<Demo />)
    screen.getByRole('tab', { name: 'General' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /Media/ })).toHaveFocus()
    await user.keyboard('{ArrowRight}') // skips the disabled tab
    expect(screen.getByRole('tab', { name: 'Links' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'General' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Links' })).toHaveFocus()
  })

  it('keepMounted keeps an inactive panel in the DOM, hidden', () => {
    renderWithProviders(
      <>
        <TabPanel idPrefix="p" value="a" active="b" keepMounted>
          <input aria-label="kept" />
        </TabPanel>
        <TabPanel idPrefix="p" value="c" active="b">
          <input aria-label="dropped" />
        </TabPanel>
      </>,
    )
    expect(screen.getByLabelText('kept', { selector: 'input' })).not.toBeVisible()
    expect(screen.queryByLabelText('dropped')).not.toBeInTheDocument()
  })

  it('reverses the arrow keys in RTL', async () => {
    const { user } = renderWithProviders(<Demo />, { lang: 'ar' })
    screen.getByRole('tab', { name: 'General' }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: /Media/ })).toHaveFocus()
  })
})

describe('Dropdown', () => {
  it('opens with the mouse, focuses the first item, closes on Escape and returns focus', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(
      <Dropdown ariaLabel="Menu" label="Actions" header={<p>Signed in as Sara</p>} items={[{ key: 'a', label: 'Do it', onClick }, { key: 'sep', separator: true }, { key: 'b', label: 'Danger', tone: 'danger' }]} />,
    )
    const trigger = screen.getByRole('button', { name: 'Menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Do it' })).toHaveFocus()
    expect(screen.getByText('Signed in as Sara')).toBeInTheDocument()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Danger' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Do it' })).toHaveFocus() // wraps

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('runs the item handler and closes; a click outside closes too; links navigate', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(
      <>
        <Dropdown ariaLabel="Menu" label="Actions" items={[{ key: 'a', label: 'Do it', onClick }, { key: 'l', label: 'Go', to: '/users' }, { key: 'x', label: 'Nope', disabled: true, onClick }]} />
        <p>outside</p>
      </>,
    )

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByRole('menuitem', { name: 'Go' })).toHaveAttribute('href', '/users')
    await user.click(screen.getByRole('menuitem', { name: 'Nope' }))
    expect(onClick).not.toHaveBeenCalled()

    await user.click(screen.getByRole('menuitem', { name: 'Do it' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByText('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens from the keyboard (ArrowDown on the trigger)', async () => {
    const { user } = renderWithProviders(<Dropdown ariaLabel="Menu" label="Actions" items={[{ key: 'a', label: 'One' }]} />)
    screen.getByRole('button', { name: 'Menu' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'One' })).toHaveFocus()
  })
})

describe('SearchInput', () => {
  it('debounces typing, commits on Enter, and clears', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<SearchInput value="" onChange={onChange} delay={80} />)
    const box = screen.getByRole('searchbox', { name: 'Search' })

    await user.type(box, 'abc')
    expect(onChange).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(onChange).toHaveBeenLastCalledWith('abc')

    await user.type(box, 'd{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('abcd') // immediately, without waiting
    expect(onChange).toHaveBeenCalledTimes(2)

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(box).toHaveValue('')
  })

  it('follows the value prop when the parent resets it', () => {
    const { rerender } = renderWithProviders(<SearchInput value="hello" onChange={() => {}} />)
    expect(screen.getByRole('searchbox')).toHaveValue('hello')
    rerender(<SearchInput value="" onChange={() => {}} />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })
})

describe('layout helpers', () => {
  it('PageHeader renders title, description, actions, back link and sets document.title', () => {
    renderWithProviders(<PageHeader title="FAQ" description="All questions" actions={<button>New</button>} backTo="/faqs" />)
    expect(screen.getByRole('heading', { level: 1, name: 'FAQ' })).toBeInTheDocument()
    expect(screen.getByText('All questions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/faqs')
    expect(document.title).toBe('FAQ · NGP Dashboard')
  })

  it('Card renders header, body and footer', () => {
    renderWithProviders(<Card title="Details" description="About it" actions={<button>Edit</button>} footer="footer text">body text</Card>)
    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument()
    expect(screen.getByText('body text')).toBeInTheDocument()
    expect(screen.getByText('footer text')).toBeInTheDocument()
  })

  it('EmptyState, Alert, StatCard, Avatar and ComingSoon render their content', () => {
    renderWithProviders(
      <>
        <EmptyState title="Nothing" description="Add one" action={<button>Add</button>} />
        <Alert tone="danger" title="Oops" action={<button>Retry</button>}>details</Alert>
        <StatCard label="New requests" value={12} to="/requests" hint="+3 today" />
        <Avatar name="sara" />
        <Avatar name="Broken" src="http://x/none.png" />
      </>,
    )
    expect(screen.getByText('Nothing')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Oops')
    expect(screen.getByRole('link', { name: /New requests/ })).toHaveAttribute('href', '/requests')
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('ComingSoon shows the section name in the current language', () => {
    renderWithProviders(<ComingSoon title={{ ar: 'المشاريع', en: 'Projects' }} />)
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })
})
