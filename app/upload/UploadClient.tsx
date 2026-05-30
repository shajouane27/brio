'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import ControleModal from '@/components/ControleModal'
import ResultPanel from '@/components/ResultPanel'
import PhotoGallery, { PhotoItem } from '@/components/PhotoGallery'

type Step = 'upload' | 'extracting' | 'extracted' | 'generating' | 'done'

const MAX_PHOTOS = 10

interface UploadClientProps {
  niveau: string
}

export default function UploadClient({ niveau }: UploadClientProps) {
  const [step, setStep] = useState<Step>('upload')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [courseText, setCourseText] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [generationType, setGenerationType] = useState<'exercices' | 'controle' | null>(null)
  const [showControleModal, setShowControleModal] = useState(false)
  const [controleOptions, setControleOptions] = useState<{ duree: string; notation: string } | null>(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    setPhotos((prev) => {
      const remaining = MAX_PHOTOS - prev.length
      if (remaining <= 0) {
        setError(`Maximum ${MAX_PHOTOS} photos.`)
        return prev
      }
      const toAdd = acceptedFiles.slice(0, remaining)
      const newItems: PhotoItem[] = toAdd.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      }))
      return [...prev, ...newItems]
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: MAX_PHOTOS,
    maxSize: 20 * 1024 * 1024,
    disabled: step === 'extracting' || photos.length >= MAX_PHOTOS,
  })

  async function handleExtract() {
    if (!photos.length) return
    setStep('extracting')
    setError('')

    const formData = new FormData()
    for (const p of photos) {
      formData.append('images', p.file)
    }

    try {
      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCourseText(data.text)
      setStep('extracted')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setStep('upload')
    }
  }

  async function handleGenerate(type: 'exercices' | 'controle', options?: { duree: string; notation: string }) {
    setShowControleModal(false)
    setGenerationType(type)
    if (options) setControleOptions(options)
    setStep('generating')
    setError('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, courseText, niveau, ...(options ?? {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedContent(data.text)
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setStep('extracted')
    }
  }

  function handleReset() {
    photos.forEach((p) => URL.revokeObjectURL(p.preview))
    setStep('upload')
    setPhotos([])
    setCourseText('')
    setGeneratedContent('')
    setGenerationType(null)
    setControleOptions(null)
    setError('')
  }

  // ── Step indicator ────────────────────────────────────────────────────────

  const STEPS = ['upload', 'extracting', 'extracted', 'generating', 'done'] as const
  const STEP_LABELS = [
    { id: 'upload', label: 'Photos' },
    { id: 'extracted', label: 'Contenu extrait' },
    { id: 'done', label: 'Généré' },
  ]
  const currentIdx = STEPS.indexOf(step)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analyser un cours</h1>
        <p className="text-slate-500 mt-1">Prends en photo toutes les pages de ton cours et laisse Brio faire le reste.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEP_LABELS.map((s, i) => {
          const target = STEPS.indexOf(s.id as typeof STEPS[number])
          const isActive = currentIdx >= target
          return (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <div className={`h-0.5 w-8 ${isActive ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
              <div className={`flex items-center gap-1.5 text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {i + 1}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Upload zone ──────────────────────────────────────────────────── */}
      {(step === 'upload' || step === 'extracting') && (
        <div className="space-y-4">
          {/* Dropzone — shown only when under the limit */}
          {photos.length < MAX_PHOTOS && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all
                ${step === 'extracting' ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}
                ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'}`}
            >
              <input {...getInputProps()} />
              <div className="text-4xl mb-2">📸</div>
              <p className="font-semibold text-slate-700">
                {isDragActive ? 'Dépose ici !' : photos.length === 0 ? 'Dépose tes photos de cours ici' : 'Ajouter d\'autres pages'}
              </p>
              <p className="text-sm text-slate-400 mt-1">ou clique pour choisir des fichiers</p>
              <p className="text-xs text-slate-400 mt-2">
                JPG, PNG, WEBP, HEIC · Max 20 Mo par photo ·{' '}
                {MAX_PHOTOS - photos.length} emplacement{MAX_PHOTOS - photos.length > 1 ? 's' : ''} restant{MAX_PHOTOS - photos.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Gallery */}
          {photos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {photos.length} page{photos.length > 1 ? 's' : ''} — glisse pour réordonner
                </p>
                {photos.length === MAX_PHOTOS && (
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    Maximum atteint
                  </span>
                )}
              </div>

              <PhotoGallery
                photos={photos}
                onChange={setPhotos}
                disabled={step === 'extracting'}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          {photos.length > 0 && (
            <button
              onClick={handleExtract}
              disabled={step === 'extracting'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {step === 'extracting' ? (
                <>
                  <Spinner />
                  Extraction en cours… ({photos.length} page{photos.length > 1 ? 's' : ''})
                </>
              ) : (
                <>✨ Extraire le cours ({photos.length} page{photos.length > 1 ? 's' : ''})</>
              )}
            </button>
          )}

          {step === 'extracting' && (
            <p className="text-center text-sm text-slate-500 animate-pulse">
              Claude analyse {photos.length > 1 ? 'toutes les pages' : 'la page'} et reconstitue le cours…
            </p>
          )}
        </div>
      )}

      {/* ── Extracted text ───────────────────────────────────────────────── */}
      {(step === 'extracted' || step === 'generating') && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <span>📄</span> Contenu extrait
                <span className="text-xs font-normal text-slate-400">({photos.length} page{photos.length > 1 ? 's' : ''})</span>
              </h2>
              <button
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Recommencer
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                {courseText}
              </pre>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleGenerate('exercices')}
              disabled={step === 'generating'}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {step === 'generating' && generationType === 'exercices' ? (
                <><Spinner /> Génération…</>
              ) : (
                <>✏️ Générer des exercices</>
              )}
            </button>

            <button
              onClick={() => setShowControleModal(true)}
              disabled={step === 'generating'}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {step === 'generating' && generationType === 'controle' ? (
                <><Spinner /> Génération…</>
              ) : (
                <>📋 Générer un contrôle type</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────────────────── */}
      {step === 'done' && generatedContent && (
        <ResultPanel
          content={generatedContent}
          type={generationType!}
          niveau={niveau}
          controleOptions={controleOptions ?? undefined}
          onReset={handleReset}
          onBack={() => setStep('extracted')}
        />
      )}

      {showControleModal && (
        <ControleModal
          onConfirm={(duree, notation) => handleGenerate('controle', { duree, notation })}
          onClose={() => setShowControleModal(false)}
        />
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
