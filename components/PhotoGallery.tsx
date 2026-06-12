'use client'

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
  /** Taille originale du fichier en octets (avant compression) */
  sizeOriginal?: number
  /** Taille compressée du fichier en octets */
  sizeCompressed?: number
}

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
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

  const hasSize = photo.sizeOriginal !== undefined && photo.sizeCompressed !== undefined
  const saved = hasSize ? Math.round(100 - (photo.sizeCompressed! / photo.sizeOriginal!) * 100) : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 aspect-[3/4]"
    >
      {/* Drag handle — couvre l'image sans couvrir les boutons */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute inset-0 cursor-grab active:cursor-grabbing z-10 ${disabled ? 'pointer-events-none' : ''}`}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.preview}
        alt={`Page ${index + 1}`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Page number badge */}
      <div className="absolute top-1.5 left-1.5 z-20 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm pointer-events-none">
        {index + 1}
      </div>

      {/* Bouton × — toujours visible (mobile-first : pas de hover) */}
      {!disabled && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-1.5 right-1.5 z-20 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-bold flex items-center justify-center shadow-md"
          aria-label={`Supprimer la page ${index + 1}`}
        >
          ×
        </button>
      )}

      {/* Taille originale → compressée */}
      {hasSize && (
        <div className="absolute bottom-0 inset-x-0 z-20 px-1 py-0.5 bg-black/55 pointer-events-none">
          <p className="text-[9px] text-white text-center leading-tight font-medium">
            {fmtSize(photo.sizeOriginal!)} → {fmtSize(photo.sizeCompressed!)}
            {saved > 0 && <span className="text-green-300 ml-0.5">−{saved}%</span>}
          </p>
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
