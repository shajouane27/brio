'use client'

export interface Illustration {
  legende: string
  imageUrl: string
  sourceUrl: string
  sourceTitle: string
}

export default function Illustrations({ images }: { images: Illustration[] }) {
  if (!images?.length) return null
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700">🖼️</span>
        Illustrations
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((im, i) => (
          <figure key={i} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={im.imageUrl}
              alt={im.legende}
              loading="lazy"
              className="w-full max-w-full h-44 object-contain bg-white"
            />
            <figcaption className="p-2.5 text-xs">
              <span className="block text-slate-700 font-medium">{im.legende}</span>
              <a
                href={im.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-slate-400 hover:text-brand-600 mt-0.5 truncate"
              >
                Source : Wikimedia Commons — {im.sourceTitle}
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
