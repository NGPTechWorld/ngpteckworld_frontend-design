import { act } from '@testing-library/react'

// Drag & drop cannot run in jsdom (no layout). A page can hold several sortable lists at once (gallery, team, links),
// so every <DndContext> is wrapped in a marked <div> and its latest props are stored by id: a test then finds the list
// it wants by role/name and drops an item on another one.
//
//   vi.mock('@dnd-kit/core', async (importOriginal) => (await import('./dndCapture')).withDndCapture(await importOriginal()))
//   dropOn(screen.getByRole('list', { name: 'Team members' }), 1, 3)   // drop item id 1 on item id 3
const contexts = new Map()
const ids = new WeakMap()
let counter = 0

export function withDndCapture(actual) {
  return {
    ...actual,
    DndContext: (props) => {
      // `sensors` is memoised by <SortableList>, so it identifies the list across renders
      if (!ids.has(props.sensors)) ids.set(props.sensors, String(++counter))
      const id = ids.get(props.sensors)
      contexts.set(id, props)
      return (
        <div data-dnd={id}>
          <actual.DndContext {...props} />
        </div>
      )
    },
  }
}

export function dropOn(list, activeId, overId) {
  const props = contexts.get(list.closest('[data-dnd]').dataset.dnd)
  act(() => props.onDragEnd({ active: { id: activeId }, over: { id: overId } }))
}
