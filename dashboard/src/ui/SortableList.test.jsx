import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'

// jsdom has no layout, so a real drag cannot be simulated: capture the DndContext props and fire the events ourselves.
const dnd = vi.hoisted(() => ({ props: null }))
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    DndContext: (props) => {
      dnd.props = props
      return <actual.DndContext {...props} />
    },
  }
})

const { SortableList } = await import('./SortableList')

const items = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
  { id: 'c', name: 'Gamma' },
]

const renderList = (props = {}) =>
  renderWithProviders(<SortableList items={items} ariaLabel="Things" renderItem={(item, { handle, index }) => <div>{handle}<span>{`${index + 1}. ${item.name}`}</span></div>} {...props} />)

describe('SortableList', () => {
  it('renders every item with its own accessible drag handle', () => {
    renderList()
    expect(screen.getByRole('list', { name: 'Things' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    const handles = screen.getAllByRole('button', { name: 'Drag to reorder' })
    expect(handles).toHaveLength(3)
    expect(handles[0]).toHaveAttribute('aria-roledescription', 'sortable') // dnd-kit keyboard semantics
    expect(handles[0]).toHaveAttribute('tabindex', '0')
    expect(screen.getByText('2. Beta')).toBeInTheDocument()
  })

  it('calls onReorder with the moved array when an item is dropped on another', () => {
    const onReorder = vi.fn()
    renderList({ onReorder })

    act(() => dnd.props.onDragEnd({ active: { id: 'a' }, over: { id: 'c' } }))

    expect(onReorder).toHaveBeenCalledWith([items[1], items[2], items[0]])
    // the input array is never mutated
    expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('does nothing when dropped in place or outside', () => {
    const onReorder = vi.fn()
    renderList({ onReorder })

    act(() => dnd.props.onDragEnd({ active: { id: 'a' }, over: { id: 'a' } }))
    act(() => dnd.props.onDragEnd({ active: { id: 'a' }, over: null }))

    expect(onReorder).not.toHaveBeenCalled()
  })

  it('supports custom ids and grid layouts', () => {
    const onReorder = vi.fn()
    renderList({ onReorder, getId: (item) => item.name, layout: 'grid', className: 'grid grid-cols-3' })

    act(() => dnd.props.onDragEnd({ active: { id: 'Gamma' }, over: { id: 'Alpha' } }))

    expect(onReorder).toHaveBeenCalledWith([items[2], items[0], items[1]])
    expect(screen.getByRole('list')).toHaveClass('grid-cols-3')
  })

  it('announces moves in the UI language', () => {
    renderList()
    const { announcements } = dnd.props.accessibility
    expect(announcements.onDragStart({ active: { id: 'b' } })).toBe('Picked up item 2 of 3.')
    expect(announcements.onDragOver({ over: { id: 'c' } })).toBe('Moved item to position 3 of 3.')
    expect(announcements.onDragEnd({ over: { id: 'a' } })).toBe('Dropped item at position 1 of 3.')
    expect(announcements.onDragCancel()).toBe('Move cancelled.')
    expect(dnd.props.accessibility.screenReaderInstructions.draggable).toMatch(/space/i)
  })

  it('announces in Arabic for the Arabic UI', () => {
    renderWithProviders(<SortableList items={items} renderItem={(item) => <span>{item.name}</span>} />, { lang: 'ar' })
    expect(dnd.props.accessibility.announcements.onDragStart({ active: { id: 'a' } })).toBe('تم التقاط العنصر 1 من 3.')
  })

  it('renders trailing (non-sortable) children after the items', () => {
    renderList({ trailing: <li>add tile</li> })
    const listItems = screen.getAllByRole('listitem')
    expect(listItems[listItems.length - 1]).toHaveTextContent('add tile')
    expect(screen.getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3)
  })

  it('disables the handles when disabled', () => {
    renderList({ disabled: true })
    screen.getAllByRole('button', { name: 'Drag to reorder' }).forEach((handle) => expect(handle).toBeDisabled())
  })
})
