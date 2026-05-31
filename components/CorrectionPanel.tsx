'use client'

import { useState, useRef } from 'react'
import { toJpeg, isImageFile } from '@/lib/image'

interface CorrectionQuestion {
  numero: string
  enonce_court: string
  reponse_eleve: string
  points_obtenus: string
  points_max: string
  correct: boolean
  bon_element: string
  a_ameliorer: string
  commentaire_peda: string
}

interface CorrectionResult {
  note_finale: string
  appreciation: string
  questions: CorrectionQuestion[]
}

interface CorrectionPanelProps {
  controleContent: string
  notation: string
  niveau: string
  duree?: string
  onClose: () => void
  onSaved?: () => void
}

export default function CorrectionPanel({ controleContent, notation, niveau, duree, onClose, onSaved }: CorrectionPanelProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [correcting, setCorrecting] = useState(false)
  const [result, setResult] = useState<CorrectionResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [isDragActive, setIsDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function addFile(f: File) {
    setProcessing(true)
    setResult(null)
    setError('')
    try {
      const jpeg = await toJpeg(f)
      setFile(jpeg)
      setPreview(URL.createObjectURL(jpeg))
    } catch {
      setError('Erreur lors du traitement de la photo.')
    } finally {
      setProcessing(false)
    }
  }

  function acceptFile(f: File | undefined) {
    if (!f) return
    if (isImageFile(f)) {
      addFile(f)
    } else {
      setError('Ce fichier n’est pas une image. Formats acceptés : JPG, PNG, WEBP, HEIC.')
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    acceptFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragActive(false)
    acceptFile(Array.from(e.dataTransfer.files)[0])
  }

  async function handleCorrect() {
    if (!file) return
    setCorrecting(true)
    setError('')

    const formData = new FormData()
    formData.append('image', file)
    formData.append('controleContent', controleContent)
    formData.append('notation', notation)
    formData.append('niveau', niveau)

    try {
      const res = await fetch('/api/correct', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.correction)

      // Auto-save in background
      fetch('/api/save-controle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controleContent,
          correction: data.correction,
          notation,
          duree,
        }),
      }).then((r) => {
        if (r.ok) { setSaved(true); onSaved?.() }
      }).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setCorrecting(false)
    }
  }

  const totalObtained = result?.questions.reduce((s, q) => s + parseFloat(q.points_obtenus || '0'), 0) ?? 0
  const totalMax = result?.questions.reduce((s, q) => s + parseFloat(q.points_max || '0'), 0) ?? 0

  const ratio = totalMax > 0 ? totalObtained / totalMax : null
  const tone = ratio === null ? 'brand' : ratio >= 0.7 ? 'emerald' : ratio >= 0.4 ? 'accent' : 'red'
  const heroClasses = {
    brand: 'from-brand-500 to-brand-700',
    emerald: 'from-emerald-500 to-emerald-600',
    accent: 'from-accent-500 to-accent-600',
    red: 'from-rose-500 to-rose-600',
  }[tone]
  const barClasses = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    accent: 'bg-accent-500',
    red: 'bg-rose-500',
  }[tone]

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg shrink-0">←</button>
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 text-accent-700">📸</span>
            Corriger ma copie
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Prends en photo ta copie — Claude la corrige automatiquement.</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-3">
          {/* Inputs natifs cachés — galerie + caméra */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
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

          {/* Zone galerie */}
          <div
            onClick={() => { if (!processing) galleryInputRef.current?.click() }}
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-brand-400 bg-brand-50' : preview ? 'border-brand-300 bg-brand-50/50' : 'border-slate-300 hover:border-brand-300 hover:bg-brand-50/40'}`}
          >
            {processing ? (
              <div className="space-y-2 py-4">
                <div className="text-4xl">⏳</div>
                <p className="font-semibold text-slate-700">Traitement en cours…</p>
              </div>
            ) : preview ? (
              <div className="space-y-3">
                <div className="relative w-full max-h-60 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Aperçu copie" className="w-full object-contain max-h-60" />
                </div>
                <p className="text-sm text-brand-600 font-semibold">Clique pour changer la photo</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-1">📄</div>
                <p className="font-bold text-slate-800 text-lg">
                  {isDragActive ? 'Dépose ici !' : 'Choisis la photo de ta copie'}
                </p>
                <p className="text-sm text-slate-400">JPG, PNG, WEBP, HEIC · Max 20 Mo</p>
              </div>
            )}
          </div>

          {/* Bouton caméra dédié — accent */}
          <button
            type="button"
            disabled={processing}
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2.5 bg-accent-50 hover:bg-accent-100 border border-accent-200 text-accent-700 disabled:opacity-40 rounded-2xl py-4 font-semibold transition-all"
          >
            <span className="text-xl">📷</span>
            Prendre une photo
          </button>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100">{error}</div>
          )}

          {preview && (
            <button
              onClick={handleCorrect}
              disabled={correcting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-md shadow-accent-500/25 hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0 transition-all text-base"
            >
              {correcting ? (
                <><Spinner /> Correction en cours…</>
              ) : (
                <>✨ Corriger ma copie</>
              )}
            </button>
          )}

          {correcting && (
            <p className="text-center text-sm text-slate-500 animate-pulse">
              Claude analyse ta copie… cela peut prendre 15–30 secondes.
            </p>
          )}
        </div>
      ) : (
        /* Résultats de correction */
        <div className="space-y-5 animate-fade-in-up">
          {/* Note globale — grande, couleur selon la performance */}
          <div className={`relative overflow-hidden rounded-3xl p-7 text-center text-white bg-gradient-to-br ${heroClasses} shadow-lg`}>
            <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              {saved && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 px-3 py-1 rounded-full mb-3">
                  <span>✓</span> Sauvegardé dans tes résultats
                </div>
              )}
              <div className="text-6xl font-extrabold tracking-tight leading-none drop-shadow-sm">{result.note_finale}</div>
              <p className="text-white/90 text-sm mt-3 max-w-sm mx-auto">{result.appreciation}</p>
              {totalMax > 0 && (
                <div className="mt-5 max-w-xs mx-auto">
                  <div className="text-xs font-medium text-white/80 mb-1.5">
                    {totalObtained.toFixed(1)} / {totalMax} points
                  </div>
                  <div className="h-2.5 bg-white/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (ratio ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Détail par question */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-3 px-1">Détail par question</h3>
            <div className="space-y-3">
              {result.questions.map((q, i) => {
                const status = q.correct ? 'ok' : q.points_obtenus === '0' ? 'ko' : 'partial'
                const badge = {
                  ok: { bg: 'bg-emerald-500', icon: '✓', border: 'border-l-emerald-400' },
                  ko: { bg: 'bg-rose-500', icon: '✗', border: 'border-l-rose-400' },
                  partial: { bg: 'bg-accent-500', icon: '~', border: 'border-l-accent-400' },
                }[status]
                return (
                  <div key={i} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${badge.border} p-4 space-y-2.5 shadow-sm`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className={`shrink-0 w-6 h-6 rounded-full ${badge.bg} text-white text-xs font-bold flex items-center justify-center mt-0.5`}>
                          {badge.icon}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          Q{q.numero}. {q.enonce_court}
                        </span>
                      </div>
                      <span className="text-sm font-bold shrink-0 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {q.points_obtenus}/{q.points_max}
                      </span>
                    </div>

                    {q.reponse_eleve && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2 ml-8">
                        <span className="text-xs text-slate-400 font-medium">Ta réponse : </span>
                        <span className="text-sm text-slate-700">{q.reponse_eleve}</span>
                      </div>
                    )}

                    {q.bon_element && (
                      <div className="flex gap-2 items-start ml-8 bg-emerald-50 rounded-lg px-3 py-2">
                        <span className="text-emerald-500 text-sm mt-0.5 shrink-0">✓</span>
                        <span className="text-xs text-emerald-800 leading-relaxed">{q.bon_element}</span>
                      </div>
                    )}

                    {q.a_ameliorer && (
                      <div className="flex gap-2 items-start ml-8 bg-accent-50 rounded-lg px-3 py-2">
                        <span className="text-accent-500 text-sm mt-0.5 shrink-0">→</span>
                        <span className="text-xs text-accent-800 leading-relaxed">{q.a_ameliorer}</span>
                      </div>
                    )}

                    {q.commentaire_peda && (
                      <div className="flex gap-2 items-start ml-8 bg-brand-50 rounded-lg px-3 py-2">
                        <span className="text-brand-500 text-sm mt-0.5 shrink-0">💡</span>
                        <span className="text-xs text-brand-800 italic leading-relaxed">{q.commentaire_peda}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setResult(null); setPreview(null); setFile(null) }}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              📸 Autre copie
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors text-sm"
            >
              Retour au contrôle
            </button>
          </div>
        </div>
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
