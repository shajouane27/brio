'use client'

import Image from 'next/image'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface PhotoItem {
  id: string
  file: File
  preview: string
}

interface PhotoGalleryProps {
  photos: PhotoItem[]
  onChange: (photos: PhotoItem[]) => void
  disabled?: boolean
}

function SortablePhoto({ photo, index, onRemove, disabled }: {
  photo: PhotoItem
  index: number
  onRemove: () => void
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 aspect-[3/4]"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute inset-0 cursor-grab active:cursor-grabbing z-10 ${disabled ? 'pointer-events-none' : ''}`}
      />

      <Image
        src={photo.preview}
        alt={`Page ${index + 1}`}
        fill
        className="object-cover"
        sizes="120px"
      />

      {/* Page number badge */}
      <div className="absolute top-1.5 left-1.5 z-20 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm pointer-events-none">
        {index + 1}
      </div>

      {/* Delete button */}
      {!disabled && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Supprimer la page ${index + 1}`}
        >
          ×
        </button>
      )}

      {/* Drag hint on hover */}
      {!disabled && (
        <div className="absolute bottom-0 inset-x-0 z-20 py-1 bg-black/40 text-white text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ↕ Déplacer
        </div>
      )}
    </div>
  )
}

export default function PhotoGallery({ photos, onChange, disabled }: PhotoGalleryProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id)
      const newIndex = photos.findIndex((p) => p.id === over.id)
      onChange(arrayMove(photos, oldIndex, newIndex))
    }
  }

  function handleRemove(id: string) {
    onChange(photos.filter((p) => p.id !== id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <SortablePhoto
              key={photo.id}
              photo={photo}
              index={i}
              onRemove={() => handleRemove(photo.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
