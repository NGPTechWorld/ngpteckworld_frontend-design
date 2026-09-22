import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useCommon } from '@/i18n'
import { cx } from '@/lib/cx'
import { focusRing } from './styles'

function Row({ id, item, index, renderItem, disabled, className, dragLabel }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      disabled={disabled}
      aria-label={dragLabel}
      title={dragLabel}
      {...attributes}
      {...listeners}
      className={cx(
        'inline-flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted transition-colors',
        'hover:bg-white/[.09] hover:text-ink active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40',
        focusRing,
      )}
    >
      <GripVertical size={18} aria-hidden="true" />
    </button>
  )

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx('relative list-none', isDragging && 'z-20 opacity-90 shadow-pop', className)}
    >
      {renderItem(item, { handle, isDragging, index })}
    </li>
  )
}

/**
 * Drag-and-drop (pointer, touch and keyboard) reordering. Controlled: you own `items`; `onReorder(nextItems)`
 * gets the new array after a drop (persist with `useReorder().mutate(next.map((i) => i.id))`).
 *
 *   <SortableList
 *     items={rows}
 *     onReorder={(next) => reorder.mutate(next.map((row) => row.id))}
 *     renderItem={(row, { handle, isDragging, index }) => <div className="flex items-center gap-3">{handle}{row.name}</div>}
 *   />
 *
 * `handle` is a ready drag-handle button — place it anywhere inside the row. `getId` (default item.id) must be
 * unique and stable. `layout="grid"` sorts in two dimensions (image galleries); `className` styles the <ul>
 * (give the grid its columns there), `itemClassName` each <li>. `trailing` = extra <li> elements appended after
 * the sortable ones (not draggable), e.g. an "add" tile.
 */
export function SortableList({ items, getId = (item) => item.id, onReorder, renderItem, layout = 'list', disabled = false, className, itemClassName, ariaLabel, trailing }) {
  const c = useCommon()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = items.map(getId)

  const position = (id) => ids.indexOf(id) + 1

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(active.id)
    const to = ids.indexOf(over.id)
    if (from < 0 || to < 0) return
    onReorder?.(arrayMove(items, from, to))
  }

  const announcements = {
    onDragStart: ({ active }) => c.dndPickedUp(position(active.id), ids.length),
    onDragOver: ({ over }) => (over ? c.dndMoved(position(over.id), ids.length) : undefined),
    onDragEnd: ({ over }) => (over ? c.dndDropped(position(over.id), ids.length) : c.dndCancelled),
    onDragCancel: () => c.dndCancelled,
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions: { draggable: c.dndInstructions } }}
    >
      <SortableContext items={ids} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy} disabled={disabled}>
        <ul aria-label={ariaLabel} className={cx(layout === 'list' && 'flex flex-col gap-2', className)}>
          {items.map((item, index) => (
            <Row key={ids[index]} id={ids[index]} item={item} index={index} renderItem={renderItem} disabled={disabled} className={itemClassName} dragLabel={c.dragHandle} />
          ))}
          {trailing}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
