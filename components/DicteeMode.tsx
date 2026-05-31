'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect } from 'react'
import { toJpeg, isImageFile } from '@/lib/image'

interface Props {
  courseText: string
  niveau: string
  onClose: () => void
}

interface MotCorrige {
  mot: string
  correct: boolean
  correction: string
  regle: string
}
interface DicteeResult {
  note_finale: string
  appreciation: string
  mots: MotCorrige[]
}

function getSynth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' ? window.speechSynthesis : null
}

// Découpe le texte en phrases.
function toSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 inline" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function DicteeMode({ courseText, niveau, onClose }: Props) {
  const [phase, setPhase] = useState<'loading' | 'reading' | 'photo' | 'correcting' | 'done'>('loading')
  const [dictee, setDictee] = useState('')
  const [error, setError] = useState('')

  // Lecture
  const sentencesRef = useRef<string[]>([])
  const [idx, setIdx] = useState(0)
  const [readState, setReadState] = useState<'idle' | 'playing' | 'paused' | 'finished'>('idle')
  const idxRef = useRef(0)
  const pausedRef = useRef(false)
  const gapRef = useRef<number | undefined>(undefined)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // Photo + correction
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<DicteeResult | null>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // 1) Génère la dictée
  useEffect(() => {
    let cancelled = false
    fetch('/api/dictee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseText, niveau }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.text) {
          setDictee(d.text)
          sentencesRef.current = toSentences(d.text)
          setPhase('reading')
        } else {
          setError(d.error || 'Génération impossible')
        }
      })
      .catch(() => { if (!cancelled) setError('Erreur de génération de la dictée') })
    return () => { cancelled = true; getSynth()?.cancel() }
  }, [courseText, niveau])

  // Voix française
  useEffect(() => {
    const synth = getSynth()
    if (!synth) return
    const pick = () => {
      const vs = synth.getVoices()
      voiceRef.current = vs.find((v) => v.lang === 'fr-FR') || vs.find((v) => v.lang.startsWith('fr')) || null
    }
    pick()
    synth.onvoiceschanged = pick
  }, [])

  function clearGap() { if (gapRef.current) { clearTimeout(gapRef.current); gapRef.current = undefined } }

  // Lit la phrase i, puis pause naturelle de 3 s avant la suivante
  function speak(i: number) {
    const synth = getSynth()
    const sentences = sentencesRef.current
    if (!synth || !sentences[i]) return
    clearGap()
    synth.cancel()
    idxRef.current = i
    setIdx(i)
    pausedRef.current = false
    setReadState('playing')
    const u = new SpeechSynthesisUtterance(sentences[i])
    u.lang = 'fr-FR'
    u.rate = 0.8
    u.pitch = 1.1
    if (voiceRef.current) u.voice = voiceRef.current
    u.onend = () => {
      if (pausedRef.current) return
      if (i + 1 < sentences.length) {
        gapRef.current = window.setTimeout(() => { if (!pausedRef.current) speak(i + 1) }, 3000)
      } else {
        setReadState('finished')
      }
    }
    synth.speak(u)
  }

  function pause() { getSynth()?.cancel(); pausedRef.current = true; clearGap(); setReadState('paused') }
  function resume() { speak(idxRef.current) }
  function repeat() { speak(idxRef.current) }
  function next() {
    if (idxRef.current + 1 < sentencesRef.current.length) speak(idxRef.current + 1)
    else { getSynth()?.cancel(); clearGap(); setReadState('finished') }
  }

  // Photo
  async function addFile(f: File) {
    if (!isImageFile(f)) { setError('Choisis une image (photo de ta feuille).'); return }
    setError('')
    const jpeg = await toJpeg(f)
    setFile(jpeg)
    setPreview(URL.createObjectURL(jpeg))
  }
  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) addFile(f)
    e.target.value = ''
  }

  async function correct() {
    if (!file) return
    setPhase('correcting')
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('dictee', dictee)
      fd.append('niveau', niveau)
      const res = await fetch('/api/correct-dictee', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.correction)
      setPhase('done')
    } catch {
      setError('La correction a échoué. Réessaie.')
      setPhase('photo')
    }
  }

  function goPhoto() { getSynth()?.cancel(); clearGap(); setPhase('photo') }

  // ── En-tête commun ──────────────────────────────────────────────────────────
  const Header = (
    <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
      <button onClick={() => { getSynth()?.cancel(); clearGap(); onClose() }} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg shrink-0">←</button>
      <h2 className="font-bold text-slate-900 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 text-accent-700">🎤</span>
        Mode dictée
      </h2>
    </div>
  )

  if (phase === 'loading') {
    return (
      <div className="mt-6 space-y-5">
        {Header}
        <div className="text-center py-10 text-slate-500">
          <Spinner /> <span className="ml-2">Préparation de ta dictée…</span>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
      </div>
    )
  }

  // ── Lecture ─────────────────────────────────────────────────────────────────
  if (phase === 'reading') {
    const total = sentencesRef.current.length
    return (
      <div className="mt-6 space-y-5">
        {Header}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
          <div className="text-5xl mb-3">{readState === 'playing' ? '🔊' : '🎧'}</div>
          <p className="text-xl font-bold text-slate-800">Écris ce que tu entends sur ta feuille ✏️</p>
          <p className="text-sm text-slate-400 mt-1">Phrase {Math.min(idx + 1, total)} / {total}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {readState === 'idle' && (
              <BigBtn onClick={() => speak(0)} tone="accent">▶ Commencer la dictée</BigBtn>
            )}
            {readState === 'playing' && (
              <BigBtn onClick={pause} tone="slate">⏸ Pause</BigBtn>
            )}
            {readState === 'paused' && (
              <BigBtn onClick={resume} tone="accent">▶ Reprendre</BigBtn>
            )}
            {(readState === 'playing' || readState === 'paused') && (
              <>
                <BigBtn onClick={repeat} tone="ghost">🔁 Répéter la phrase</BigBtn>
                <BigBtn onClick={next} tone="ghost">⏭ Phrase suivante</BigBtn>
              </>
            )}
          </div>

          {readState === 'finished' && (
            <p className="text-emerald-600 font-semibold mt-4">Dictée terminée ! 🎉</p>
          )}
        </div>

        <button onClick={goPhoto} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl shadow-md transition-colors">
          📸 Photographier ma dictée
        </button>
      </div>
    )
  }

  // ── Photo ───────────────────────────────────────────────────────────────────
  if (phase === 'photo' || phase === 'correcting') {
    return (
      <div className="mt-6 space-y-5">
        {Header}
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onInput} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onInput} />

        <div
          onClick={() => galleryRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-brand-300 rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Ma dictée" className="w-full max-h-60 object-contain rounded-2xl border border-slate-200 bg-white" />
          ) : (
            <div className="py-4">
              <div className="text-4xl mb-2">📄</div>
              <p className="font-bold text-slate-800 text-lg">Choisis la photo de ta dictée</p>
            </div>
          )}
        </div>

        <button onClick={() => cameraRef.current?.click()} className="w-full flex items-center justify-center gap-2.5 bg-accent-500 hover:bg-accent-600 text-white font-semibold py-4 rounded-2xl transition-all">
          📷 Prendre une photo
        </button>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

        {preview && (
          <button onClick={correct} disabled={phase === 'correcting'} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-md transition-colors">
            {phase === 'correcting' ? <><Spinner /> Correction en cours…</> : '✓ Corriger ma dictée'}
          </button>
        )}
      </div>
    )
  }

  // ── Résultat ────────────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const fautes = result.mots.filter((m) => !m.correct)
    return (
      <div className="mt-6 space-y-5 animate-fade-in-up">
        {Header}

        {/* Note */}
        <div className="rounded-3xl p-7 text-center text-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg">
          <div className="text-6xl font-extrabold tracking-tight">{result.note_finale}</div>
          <p className="text-white/90 text-sm mt-3 max-w-sm mx-auto">{result.appreciation}</p>
        </div>

        {/* Texte corrigé mot par mot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">Ta dictée corrigée</h3>
          <p className="leading-loose text-lg">
            {result.mots.map((m, i) => (
              m.correct ? (
                <span key={i} className="text-emerald-600">{m.mot} </span>
              ) : (
                <span key={i} className="inline-flex flex-col items-center align-bottom mx-0.5">
                  <span className="text-rose-500 line-through decoration-2">{m.mot}</span>
                  <span className="text-emerald-700 font-semibold text-sm">{m.correction}</span>
                </span>
              )
            ))}
          </p>
        </div>

        {/* Règles des fautes */}
        {fautes.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900">Pour progresser</h3>
            {fautes.map((m, i) => (
              <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm">
                <span className="text-rose-500 line-through">{m.mot}</span>
                <span className="mx-2 text-slate-400">→</span>
                <span className="text-emerald-700 font-semibold">{m.correction}</span>
                {m.regle && <p className="text-slate-600 mt-1">{m.regle}</p>}
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors text-sm">Terminer</button>
      </div>
    )
  }

  return null
}

function BigBtn({ onClick, tone, children }: { onClick: () => void; tone: 'accent' | 'slate' | 'ghost'; children: React.ReactNode }) {
  const cls = tone === 'accent'
    ? 'bg-accent-500 hover:bg-accent-600 text-white'
    : tone === 'slate'
    ? 'bg-slate-700 hover:bg-slate-800 text-white'
    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
  return (
    <button onClick={onClick} className={`flex items-center gap-2 font-bold px-5 py-3 rounded-2xl shadow-sm transition-colors ${cls}`}>
      {children}
    </button>
  )
}
