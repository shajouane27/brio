'use client'

import type { VisualType } from '@/services/wikimedia'

export interface Illustration {
  legende: string
  imageUrl: string
  sourceUrl: string
  sourceTitle: string
  title?: string
  description?: string
  type?: VisualType
  pertinence?: string
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  schema:   { label: 'Schéma',  color: 'bg-brand-100 text-brand-700' },
  carte:    { label: 'Carte',   color: 'bg-emerald-100 text-emerald-700' },
  portrait: { label: 'Portrait', color: 'bg-accent-100 text-accent-700' },
  photo:    { label: 'Photo',   color: 'bg-slate-100 text-slate-600' },
  other:    { label: 'Image',   color: 'bg-slate-100 text-slate-600' },
}

export default function Illustrations({ images }: { images: Illustration[] }) {
  if (!images?.length) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700">🖼️</span>
        Illustrations
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((im, i) => {
          const badge = TYPE_BADGE[im.type ?? 'other'] ?? TYPE_BADGE.other
          return (
            <figure key={i} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex flex-col">
              <div className="relative bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={im.imageUrl}
                  alt={im.legende}
                  loading="lazy"
                  className="w-full max-w-full h-48 object-contain"
                />
                {im.type && (
                  <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <figcaption className="p-3 text-xs flex-1 flex flex-col gap-1">
                <span className="block text-slate-800 font-semibold leading-snug">{im.legende}</span>
                {im.pertinence && (
                  <span className="block text-slate-500 text-xs leading-relaxed">{im.pertinence}</span>
                )}
                <a
                  href={im.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-slate-400 hover:text-brand-600 mt-auto truncate"
                >
                  Source : Wikimedia Commons — {im.sourceTitle ?? im.title}
                </a>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
