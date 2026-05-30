'use client'

import { useState, useRef } from 'react'
import { toJpeg } from '@/lib/image'

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

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) addFile(f)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragActive(false)
    const f = Array.from(e.dataTransfer.files).find((x) => x.type.startsWith('image/'))
    if (f) addFile(f)
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

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-lg">←</button>
        <div>
          <h2 className="font-bold text-slate-900">📸 Corriger ma copie</h2>
          <p className="text-sm text-slate-500">Prends en photo ta copie — Claude la corrige automatiquement.</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-4">
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
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'}
              ${preview ? 'border-indigo-300 bg-indigo-50' : ''}`}
          >
            {processing ? (
              <div className="space-y-2">
                <div className="text-4xl">⏳</div>
                <p className="font-semibold text-slate-700">Traitement en cours…</p>
              </div>
            ) : preview ? (
              <div className="space-y-3">
                <div className="relative w-full max-h-52 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Aperçu copie" className="w-full object-contain max-h-52" />
                </div>
                <p className="text-sm text-indigo-600 font-medium">Clique pour changer la photo</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📄</div>
                <p className="font-semibold text-slate-700">
                  {isDragActive ? 'Dépose ici !' : 'Choisis la photo de ta copie'}
                </p>
                <p className="text-sm text-slate-400">JPG, PNG, WEBP, HEIC · Max 20 Mo</p>
              </div>
            )}
          </div>

          {/* Bouton caméra dédié */}
          <button
            type="button"
            disabled={processing}
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-indigo-300 hover:bg-slate-50 disabled:opacity-40 rounded-2xl py-4 text-slate-600 font-medium transition-all"
          >
            <span className="text-xl">📷</span>
            Prendre une photo
          </button>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          {preview && (
            <button
              onClick={handleCorrect}
              disabled={correcting}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
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
        <div className="space-y-4">
          {/* Note globale */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 text-center">
            {saved && (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-3">
                <span>✓</span> Sauvegardé dans tes résultats
              </div>
            )}
            <div className="text-5xl font-bold text-indigo-700 mb-1">{result.note_finale}</div>
            <div className="text-slate-600 text-sm mt-2 max-w-sm mx-auto">{result.appreciation}</div>
            {totalMax > 0 && (
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-1.5">
                  {totalObtained.toFixed(1)} / {totalMax} points
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-indigo-100">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (totalObtained / totalMax) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {result.questions.map((q, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl border p-4 space-y-2 ${q.correct ? 'border-emerald-200' : q.points_obtenus === '0' ? 'border-red-200' : 'border-amber-200'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${q.correct ? 'text-emerald-600' : q.points_obtenus === '0' ? 'text-red-500' : 'text-amber-600'}`}>
                      {q.correct ? '✓' : q.points_obtenus === '0' ? '✗' : '~'}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      Q{q.numero}. {q.enonce_court}
                    </span>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${q.correct ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {q.points_obtenus}/{q.points_max}
                  </span>
                </div>

                {q.reponse_eleve && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-400 font-medium">Ta réponse : </span>
                    <span className="text-sm text-slate-700">{q.reponse_eleve}</span>
                  </div>
                )}

                {q.bon_element && (
                  <div className="flex gap-1.5 items-start">
                    <span className="text-emerald-500 text-xs mt-0.5 shrink-0">✓</span>
                    <span className="text-xs text-emerald-700">{q.bon_element}</span>
                  </div>
                )}

                {q.a_ameliorer && (
                  <div className="flex gap-1.5 items-start">
                    <span className="text-amber-500 text-xs mt-0.5 shrink-0">→</span>
                    <span className="text-xs text-amber-700">{q.a_ameliorer}</span>
                  </div>
                )}

                {q.commentaire_peda && (
                  <p className="text-xs text-slate-500 italic pl-1 border-l-2 border-slate-200">
                    {q.commentaire_peda}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setResult(null); setPreview(null); setFile(null) }}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              Corriger une autre copie
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors text-sm"
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
