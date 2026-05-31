'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect, useMemo } from 'react'
import CorrectionPanel from './CorrectionPanel'
import CorrectionResultView, { type CorrectionResult } from './CorrectionResultView'

interface Props {
  controleContent: string
  notation: string
  niveau: string
  duree?: string
  onClose: () => void
}

// Découpe le sujet en phrases lisibles (sans pointillés, tableaux, barèmes…).
function speechUnits(content: string): string[] {
  return content.split('\n').map((l) => l.trim())
    .filter((l) => l && l !== '---')
    .filter((l) => !/^[.…_]{4,}$/.test(l))
    .filter((l) => !/^[|┌┐└┘├┤┬┴┼│─]/.test(l))
    .filter((l) => !/^\|?[\s:|-]+$/.test(l))
    .map((l) => l
      .replace(/[#*>_`|□☐◻]/g, '')
      .replace(/\(\s*\d+\s*pts?\s*\)/gi, '')
      .replace(/\.{4,}/g, ' ')
      .trim())
    .filter(Boolean)
}

function getSynth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' ? window.speechSynthesis : null
}

export default function DicteeMode({ controleContent, notation, niveau, duree, onClose }: Props) {
  const units = useMemo(() => speechUnits(controleContent), [controleContent])
  const [idx, setIdx] = useState(0)
  const [readState, setReadState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  const [mode, setMode] = useState<'menu' | 'photo' | 'voice'>('menu')

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
    return () => { synth.cancel() }
  }, [])

  function speakFrom(i: number) {
    const synth = getSynth()
    if (!synth || !units[i]) return
    synth.cancel()
    setIdx(i)
    setReadState('playing')
    const u = new SpeechSynthesisUtterance(units[i])
    u.lang = 'fr-FR'
    u.rate = 0.8
    u.pitch = 1.1
    if (voiceRef.current) u.voice = voiceRef.current
    u.onend = () => {
      if (i + 1 < units.length) speakFrom(i + 1)
      else { setReadState('idle'); setIdx(0) }
    }
    synth.speak(u)
  }

  function play() {
    const synth = getSynth()
    if (!synth) return
    if (readState === 'paused') { synth.resume(); setReadState('playing') }
    else speakFrom(idx)
  }
  function pause() { const s = getSynth(); if (s) { s.pause(); setReadState('paused') } }
  function repeat() { speakFrom(idx) }

  // ── Correction par photo (réutilise le flux existant) ───────────────────────
  if (mode === 'photo') {
    return <CorrectionPanel controleContent={controleContent} notation={notation} duree={duree} niveau={niveau} onClose={() => setMode('menu')} />
  }

  if (mode === 'voice') {
    return <VoiceAnswer controleContent={controleContent} notation={notation} niveau={niveau} duree={duree} onClose={() => setMode('menu')} />
  }

  // ── Menu : lecture à voix haute + choix ─────────────────────────────────────
  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg shrink-0">←</button>
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 text-accent-700">🎤</span>
            Mode dictée
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Écoute bien et écris sur ta feuille.</p>
        </div>
      </div>

      {/* Lecture à voix haute */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
        <div className="text-5xl mb-3">{readState === 'playing' ? '🔊' : '🎧'}</div>
        <p className="text-lg font-semibold text-slate-800 min-h-[3.5rem] flex items-center justify-center px-2">
          {units[idx] || 'Appuie sur Écouter pour commencer.'}
        </p>
        {units.length > 0 && (
          <p className="text-xs text-slate-400 mt-1">Phrase {idx + 1} / {units.length}</p>
        )}

        <div className="flex items-center justify-center gap-3 mt-5">
          {readState !== 'playing' ? (
            <button onClick={play} className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold px-6 py-3 rounded-2xl shadow-sm transition-colors">
              ▶️ {readState === 'paused' ? 'Reprendre' : 'Écouter'}
            </button>
          ) : (
            <button onClick={pause} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl shadow-sm transition-colors">
              ⏸️ Pause
            </button>
          )}
          <button onClick={repeat} className="flex items-center gap-2 border border-slate-200 text-slate-600 font-semibold px-5 py-3 rounded-2xl hover:bg-slate-50 transition-colors">
            🔁 Répéter
          </button>
        </div>
      </div>

      {/* Choix de la suite */}
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-3 text-center">Quand tu as fini d&apos;écrire :</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => { getSynth()?.cancel(); setMode('photo') }} className="flex flex-col items-center gap-1 bg-white hover:bg-brand-50 border-2 border-brand-200 hover:border-brand-400 text-brand-700 font-bold py-5 rounded-2xl transition-all">
            <span className="text-2xl">📸</span>
            Photographier ma copie
          </button>
          <button onClick={() => { getSynth()?.cancel(); setMode('voice') }} className="flex flex-col items-center gap-1 bg-white hover:bg-accent-50 border-2 border-accent-200 hover:border-accent-400 text-accent-700 font-bold py-5 rounded-2xl transition-all">
            <span className="text-2xl">🎤</span>
            Dicter mes réponses
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Réponse dictée à l'oral ───────────────────────────────────────────────────
function VoiceAnswer({ controleContent, notation, niveau, duree, onClose }: Props) {
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [recError, setRecError] = useState('')
  const [phase, setPhase] = useState<'record' | 'correcting' | 'done'>('record')
  const [result, setResult] = useState<CorrectionResult | null>(null)
  const [saved, setSaved] = useState(false)
  const recRef = useRef<any>(null)
  const finalRef = useRef('')

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setRecError("La reconnaissance vocale n'est pas disponible sur ce navigateur. Tu peux écrire tes réponses ci-dessous.")
      return
    }
    const rec = new SR()
    rec.lang = 'fr-FR'
    rec.continuous = true
    rec.interimResults = true
    finalRef.current = transcript ? transcript + ' ' : ''
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalRef.current += t + ' '
        else interim += t
      }
      setTranscript((finalRef.current + interim).trimStart())
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  function stopListening() {
    try { recRef.current?.stop() } catch { /* ignore */ }
    setListening(false)
  }

  async function submit() {
    setPhase('correcting')
    try {
      const res = await fetch('/api/correct-copie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controleContent, notation, niveau, copieLibre: transcript }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setResult(data.correction)
      setPhase('done')
      fetch('/api/save-controle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controleContent, correction: data.correction, notation, duree }),
      }).then((r) => { if (r.ok) setSaved(true) }).catch(() => {})
    } catch {
      setPhase('record')
      setRecError('La correction a échoué. Réessaie.')
    }
  }

  if (phase === 'done' && result) {
    return (
      <div className="mt-6 space-y-4">
        <CorrectionResultView result={result} saved={saved} />
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors text-sm">Terminer</button>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg shrink-0">←</button>
        <h2 className="font-bold text-slate-900">🎤 Dicter mes réponses</h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
        <button
          onClick={listening ? stopListening : startListening}
          className={`inline-flex items-center gap-2 font-bold px-6 py-3.5 rounded-2xl shadow-sm transition-colors ${listening ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' : 'bg-accent-500 hover:bg-accent-600 text-white'}`}
        >
          {listening ? '⏹️ Arrêter' : '🎤 Parler'}
        </button>
        <p className="text-xs text-slate-400 mt-2">{listening ? 'Je t\'écoute…' : 'Appuie et parle. Tu pourras corriger ton texte ensuite.'}</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Ta réponse (tu peux la corriger) :</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          placeholder="Ton texte apparaîtra ici…"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm text-slate-800"
        />
      </div>

      {recError && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl">{recError}</div>}

      <button
        onClick={submit}
        disabled={!transcript.trim() || phase === 'correcting'}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-sm transition-colors"
      >
        {phase === 'correcting' ? 'Correction en cours…' : '✓ Soumettre mes réponses'}
      </button>
    </div>
  )
}
