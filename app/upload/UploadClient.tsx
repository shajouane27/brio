'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback, useRef, useEffect } from 'react'
import ControleModal from '@/components/ControleModal'
import ResultPanel from '@/components/ResultPanel'
import PhotoGallery, { PhotoItem } from '@/components/PhotoGallery'
import { toJpeg, isImageFile } from '@/lib/image'
import { type Exercice } from '@/components/ExercicesPlayer'
import { type RegenFn } from '@/components/RegenButtons'
import { type Illustration } from '@/components/Illustrations'
import DicteeMode from '@/components/DicteeMode'
import { useLanguage } from '@/contexts/LanguageContext'

const PRIMAIRE = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '1º ano', '2º ano', '3º ano', '4º ano']

type Step = 'upload' | 'extracting' | 'extracted' | 'generating' | 'done'

const MAX_PHOTOS = 10

interface UploadClientProps {
  niveau: string
  pays?: string
  initialCourseText?: string
  initialCoursId?: string
  initialAction?: 'exercices' | 'controle'
}

// Prépare un fichier : conversion JPEG + création de la preview
async function prepareFile(file: File): Promise<PhotoItem> {
  const processedFile = await toJpeg(file)
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file: processedFile,
    preview: URL.createObjectURL(processedFile),
  }
}

type GenType = 'exercices' | 'controle' | 'fiche'

export default function UploadClient({ niveau, pays, initialCourseText, initialCoursId, initialAction }: UploadClientProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<Step>(initialCourseText ? 'extracted' : 'upload')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [courseText, setCourseText] = useState(initialCourseText ?? '')
  const [generatedContent, setGeneratedContent] = useState('')
  const [generatedExercices, setGeneratedExercices] = useState<Exercice[]>([])
  const [generationType, setGenerationType] = useState<GenType | null>(null)
  // Id du cours en cours (extraction auto ou réutilisation) — pour rattacher la fiche
  const coursIdRef = useRef<string | null>(initialCoursId ?? null)
  // Difficulté accrue en attente (régénération de contrôle après >70 %)
  const regenHarderRef = useRef(false)
  const [showControleModal, setShowControleModal] = useState(false)
  const [controleOptions, setControleOptions] = useState<{ duree: string; notation: string } | null>(null)
  const [illustrations, setIllustrations] = useState<{ images: Illustration[]; matiere: string | null }>({ images: [], matiere: null })
  const [detectedLang, setDetectedLang] = useState<string | null>(null)
  const [showDictee, setShowDictee] = useState(false)
  const [error, setError] = useState('')
  const isPrimaire = PRIMAIRE.some((n) => niveau.includes(n))

  // Récupère des illustrations Wikimedia + la matière (arrière-plan, non bloquant)
  // detectedLangForFetch est en closure mais se met à jour via le ref
  const fetchIllustrations = useCallback((text: string, lang?: string | null) => {
    fetch('/api/illustrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseText: text, niveau, detectedLang: lang ?? null }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setIllustrations({ images: d.images ?? [], matiere: d.matiere ?? null }) })
      .catch(() => { /* silencieux */ })
  }, [niveau])

  // Refs pour les inputs natifs (galerie + caméra)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  // Fonction centrale d'ajout de fichiers (utilisée par dropzone ET input caméra)
  const addFiles = useCallback(async (files: File[]) => {
    setError('')
    setIsProcessing(true)
    try {
      const newItems = await Promise.all(files.map(prepareFile))
      setPhotos((prev) => {
        const remaining = MAX_PHOTOS - prev.length
        if (remaining <= 0) {
          setError(`Maximum ${MAX_PHOTOS} photos.`)
          return prev
        }
        return [...prev, ...newItems.slice(0, remaining)]
      })
    } catch {
      setError('Erreur lors du traitement de la photo.')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const inputsDisabled = step === 'extracting' || isProcessing || photos.length >= MAX_PHOTOS

  // Sépare les images des fichiers non-image, ajoute les images,
  // et n'affiche une erreur que si AUCUN fichier valide n'a été retenu.
  function acceptFiles(all: File[]) {
    const images = all.filter(isImageFile)
    if (images.length > 0) {
      addFiles(images)
    } else if (all.length > 0) {
      setError(t('fichier_pas_image'))
    }
  }

  // Handler partagé pour les inputs natifs (galerie + caméra)
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    acceptFiles(Array.from(e.target.files ?? []))
    e.target.value = '' // reset pour pouvoir re-sélectionner le même fichier
  }

  // Drag & drop desktop (natif, sans librairie)
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragActive(false)
    if (inputsDisabled) return
    acceptFiles(Array.from(e.dataTransfer.files))
  }

  async function handleExtract() {
    if (!photos.length) return
    setStep('extracting')
    setError('')

    const formData = new FormData()
    for (const p of photos) {
      formData.append('images', p.file)
    }

    // Timeout de 2 min pour éviter le loading infini sur mobile (Bug 2)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120_000)

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Lecture robuste : certaines erreurs renvoient du HTML, pas du JSON
      const raw = await res.text()
      let data: { text?: string; error?: string; detectedLang?: string }
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error(`Réponse serveur invalide (${res.status})`)
      }

      if (!res.ok) throw new Error(data.error || `Erreur serveur (${res.status})`)
      setCourseText(data.text ?? '')
      const lang = data.detectedLang ?? null
      if (lang) setDetectedLang(lang)
      setStep('extracted')
      if (data.text) fetchIllustrations(data.text, lang)

      // Sauvegarde automatique du cours dans la bibliothèque (en arrière-plan)
      if (data.text) {
        fetch('/api/save-cours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contenu: data.text, niveau }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((saved) => { if (saved?.id) coursIdRef.current = saved.id })
          .catch(() => { /* silencieux : ne bloque pas l'élève */ })
      }
    } catch (e) {
      clearTimeout(timeoutId)
      if (e instanceof Error && e.name === 'AbortError') {
        setError(t('requete_trop_longue'))
      } else {
        setError(e instanceof Error ? e.message : 'Erreur inconnue')
      }
      setStep('upload')
    }
  }

  async function handleGenerate(type: GenType, options?: { duree: string; notation: string }, harder?: boolean) {
    setShowControleModal(false)
    setGenerationType(type)
    if (options) setControleOptions(options)
    setStep('generating')
    setError('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          courseText,
          niveau,
          pays: pays ?? 'fr-FR',
          detectedLang: detectedLang ?? null,
          coursId: coursIdRef.current ?? undefined,
          harder: harder ?? false,
          ...(options ?? {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (type === 'exercices') {
        setGeneratedExercices(Array.isArray(data.exercices) ? data.exercices : [])
        setGeneratedContent('')
      } else {
        setGeneratedContent(data.text)
        setGeneratedExercices([])
      }
      setStep('done')

      // Rattache la fiche de révision au cours correspondant (arrière-plan)
      if (type === 'fiche' && coursIdRef.current && data.text) {
        fetch('/api/save-cours', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: coursIdRef.current, fiche: data.text }),
        }).catch(() => { /* silencieux */ })
      }
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
    setGeneratedExercices([])
    setGenerationType(null)
    setControleOptions(null)
    setError('')
  }

  // Régénération depuis l'écran de correction : nouveau contenu sur le même cours
  const onRegenerate: RegenFn = (type, opts) => {
    if (type === 'controle') {
      regenHarderRef.current = opts?.harder ?? false
      setShowControleModal(true)
    } else {
      handleGenerate('exercices', undefined, opts?.harder)
    }
  }

  // Action déclenchée automatiquement depuis la bibliothèque (?action=...)
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    if (initialCourseText) fetchIllustrations(initialCourseText, null)
    if (initialAction && initialCourseText) {
      if (initialAction === 'exercices') handleGenerate('exercices')
      else if (initialAction === 'controle') setShowControleModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Step indicator ────────────────────────────────────────────────────────

  const STEPS = ['upload', 'extracting', 'extracted', 'generating', 'done'] as const
  const STEP_LABELS = [
    { id: 'upload', label: t('step_photos') },
    { id: 'extracted', label: t('step_contenu_extrait') },
    { id: 'done', label: t('step_genere') },
  ]
  const currentIdx = STEPS.indexOf(step)

  // Mode dictée (primaire) — remplace la vue, génère sa propre dictée du cours
  if (showDictee) {
    return <DicteeMode courseText={courseText} niveau={niveau} onClose={() => setShowDictee(false)} />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{t('page_upload_titre')}</h1>
        <p className="text-slate-500 mt-1.5">{t('page_upload_sous_titre')}</p>
      </div>

      {/* Step indicator 1-2-3 */}
      <div className="flex items-center justify-between max-w-md mb-10">
        {STEP_LABELS.map((s, i) => {
          const target = STEPS.indexOf(s.id as typeof STEPS[number])
          const isDone = currentIdx > target
          const isCurrent = currentIdx >= target && !isDone
          const isActive = currentIdx >= target
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${isDone ? 'bg-brand-600 text-white' : isCurrent ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-400'}`}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-semibold ${isActive ? 'text-brand-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-1 flex-1 mx-2 rounded-full -mt-5 ${currentIdx > target ? 'bg-brand-500' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Upload zone ──────────────────────────────────────────────────── */}
      {(step === 'upload' || step === 'extracting') && (
        <div className="space-y-4">
          {/* Inputs natifs cachés — galerie (multiple) + caméra (capture) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Zone d'ajout — shown only when under the limit */}
          {photos.length < MAX_PHOTOS && (
            <div className="space-y-3">
              {/* Galerie */}
              <div
                onClick={() => { if (!inputsDisabled) galleryInputRef.current?.click() }}
                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl px-6 py-10 sm:py-14 text-center transition-all
                  ${inputsDisabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}
                  ${isDragActive ? 'border-brand-400 bg-brand-50 scale-[1.01]' : 'border-slate-300 hover:border-brand-300 hover:bg-brand-50/40'}`}
              >
                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragActive ? 'bg-brand-100' : 'bg-slate-100'}`}>
                  {isProcessing ? (
                    <span className="text-3xl">⏳</span>
                  ) : isDragActive ? (
                    <span className="text-3xl">📥</span>
                  ) : (
                    <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  {isProcessing
                    ? t('traitement_photo')
                    : isDragActive
                    ? t('depose_photos')
                    : photos.length === 0
                    ? t('choisis_photos')
                    : t('ajouter_pages')}
                </p>
                {!isProcessing && (
                  <>
                    <p className="text-sm text-slate-500 mt-1">{t('depuis_galerie')}</p>
                    <p className="text-xs text-slate-400 mt-3">
                      JPG, PNG, WEBP, HEIC · Max 20 Mo ·{' '}
                      {MAX_PHOTOS - photos.length} emplacement{MAX_PHOTOS - photos.length > 1 ? 's' : ''} restant{MAX_PHOTOS - photos.length > 1 ? 's' : ''}
                    </p>
                  </>
                )}
              </div>

              {/* Bouton caméra dédié — orange franc, texte blanc */}
              <button
                type="button"
                disabled={inputsDisabled}
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2.5 bg-accent-500 hover:bg-accent-600 text-white disabled:opacity-40 disabled:pointer-events-none rounded-2xl py-4 font-semibold shadow-sm shadow-accent-500/25 transition-all"
              >
                <span className="text-xl">📷</span>
                {t('prendre_photo_btn')}
              </button>
            </div>
          )}

          {/* Gallery */}
          {photos.length > 0 && (
            <div className="space-y-3 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs">{photos.length}</span>
                  page{photos.length > 1 ? 's' : ''} · {t('glisse_reordonner')}
                </p>
                {photos.length === MAX_PHOTOS && (
                  <span className="text-xs text-accent-700 font-semibold bg-accent-50 px-2.5 py-1 rounded-full">
                    {t('maximum_atteint')}
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
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100">{error}</div>
          )}

          {photos.length > 0 && (
            <button
              onClick={handleExtract}
              disabled={step === 'extracting'}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-md shadow-brand-600/20 hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0 transition-all flex items-center justify-center gap-2 text-base"
            >
              {step === 'extracting' ? (
                <>
                  <Spinner />
                  {t('extraction_en_cours')} ({photos.length} page{photos.length > 1 ? 's' : ''})
                </>
              ) : (
                <>✨ {t('extraire_cours')} ({photos.length} page{photos.length > 1 ? 's' : ''})</>
              )}
            </button>
          )}

          {step === 'extracting' && (
            <p className="text-center text-sm text-slate-500 animate-pulse">
              {t('claude_analyse')}
            </p>
          )}
        </div>
      )}

      {/* ── Extracted text ───────────────────────────────────────────────── */}
      {(step === 'extracted' || step === 'generating') && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700">📄</span>
                {t('contenu_extrait_titre')}
                {photos.length > 0 && (
                  <span className="text-xs font-medium text-slate-400">· {photos.length} page{photos.length > 1 ? 's' : ''}</span>
                )}
              </h2>
              <button
                onClick={handleReset}
                className="text-sm font-medium text-slate-400 hover:text-brand-600 transition-colors"
              >
                ↺ {t('recommencer')}
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 max-h-64 overflow-y-auto border border-slate-100">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                {courseText}
              </pre>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100">{error}</div>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-500 mb-3">{t('que_generer')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleGenerate('exercices')}
                disabled={step === 'generating'}
                className="flex flex-col items-center justify-center gap-1 bg-white hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 disabled:opacity-50 text-emerald-700 font-bold py-5 rounded-2xl transition-all"
              >
                {step === 'generating' && generationType === 'exercices' ? (
                  <><Spinner /> {t('generation_label')}</>
                ) : (
                  <>
                    <span className="text-2xl">✏️</span>
                    <span>{t('generer_exercices')}</span>
                    <span className="text-xs font-medium text-emerald-500">{t('pour_sentrainer')}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowControleModal(true)}
                disabled={step === 'generating'}
                className="flex flex-col items-center justify-center gap-1 bg-white hover:bg-brand-50 border-2 border-brand-200 hover:border-brand-400 disabled:opacity-50 text-brand-700 font-bold py-5 rounded-2xl transition-all"
              >
                {step === 'generating' && generationType === 'controle' ? (
                  <><Spinner /> {t('generation_label')}</>
                ) : (
                  <>
                    <span className="text-2xl">📋</span>
                    <span>{t('generer_controle')}</span>
                    <span className="text-xs font-medium text-brand-400">{t('en_conditions_examen')}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleGenerate('fiche')}
                disabled={step === 'generating'}
                className="flex flex-col items-center justify-center gap-1 bg-white hover:bg-sky-50 border-2 border-sky-200 hover:border-sky-400 disabled:opacity-50 text-sky-700 font-bold py-5 rounded-2xl transition-all"
              >
                {step === 'generating' && generationType === 'fiche' ? (
                  <><Spinner /> {t('generation_label')}</>
                ) : (
                  <>
                    <span className="text-2xl">📋</span>
                    <span>{t('generer_fiche')}</span>
                    <span className="text-xs font-medium text-sky-500">{t('essentiel_5min')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Mode dictée — primaire (CP → CM2) uniquement */}
            {isPrimaire && (
              <button
                onClick={() => setShowDictee(true)}
                disabled={step === 'generating'}
                className="w-full mt-3 flex items-center justify-center gap-2.5 bg-white hover:bg-accent-50 border-2 border-accent-300 hover:border-accent-400 disabled:opacity-50 text-accent-700 font-bold py-4 rounded-2xl transition-all"
              >
                <span className="text-xl">🎤</span> {t('mode_dictee')}
                <span className="text-xs font-medium text-accent-500">{t('mode_dictee_desc')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────────────────── */}
      {step === 'done' && (generatedContent || generatedExercices.length > 0) && (
        <ResultPanel
          content={generatedContent}
          exercices={generatedExercices}
          type={generationType!}
          niveau={niveau}
          controleOptions={controleOptions ?? undefined}
          illustrations={illustrations}
          onReset={handleReset}
          onBack={() => setStep('extracted')}
          onRegenerate={onRegenerate}
        />
      )}

      {showControleModal && (
        <ControleModal
          onConfirm={(duree, notation) => {
            const harder = regenHarderRef.current
            regenHarderRef.current = false
            handleGenerate('controle', { duree, notation }, harder)
          }}
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
