'use client'

import { useState, useMemo } from 'react'
import CorrectionResultView, { type CorrectionResult } from './CorrectionResultView'
import RegenButtons, { type RegenFn } from './RegenButtons'
import ControleTimer from './ControleTimer'

interface Props {
  controleContent: string
  notation: string
  niveau: string
  duree?: string
  onClose: () => void
  onSaved?: () => void
  onRegenerate?: RegenFn
}

type Kind = 'qcm' | 'select' | 'text'

interface QItem {
  numero: string
  part: string
  lead: string          // énoncé (avec le barème retiré)
  bareme: string
  body: string[]        // tout le contenu sous l'énoncé (liste, options, pointillés…)
  kind: Kind
  options: string[]     // pour qcm : libellés des cases
  words: string[]       // pour select (entoure/souligne) : mots cliquables
  displayLead: string   // énoncé à afficher (liste retirée si déplacée en boutons)
  bodyContext: string[] // lignes de contexte à afficher (hors options/liste/pointillés)
}

function clean(s: string): string {
  return s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`/g, '').trim()
}

const CHECKBOX = /^(?:□|☐|◻|\[\s?\]|-\s*\[\s?\])\s*(.*)$/
const DOTS = /(?:\.{6,}|…{2,}|_{6,})/
const SELECT_CMD = /\b(entoure?z?|souligne?z?|encadre?z?|barre?z?|colorie|relie)\b/i

function extractWords(text: string): string[] {
  return text
    .split(/\s*(?:—|–|·|\/|,|;)\s*/)
    .map((w) => clean(w).replace(/\.+$/, '').trim())
    .filter((w) => w.length > 0 && w.length <= 40 && !/^[.…_]+$/.test(w))
}

// Découpe le sujet en questions en conservant TOUT le contenu de chacune.
function parseQuestions(md: string): QItem[] {
  const items: QItem[] = []
  let part = ''
  let current: QItem | null = null

  for (const raw of md.split('\n')) {
    const line = raw.trim()
    if (!line) { if (current) current.body.push(''); continue }

    const partM = line.match(/^#{2,3}\s+(.*)/)
    const romanM = line.match(/^((?:I{1,3}|IV|V|VI{0,3}|IX|X)\.)\s+(.*)$/i)
    if (partM || (romanM && !current)) {
      part = (partM ? partM[1] : `${romanM![1]} ${romanM![2]}`).replace(/\s*\([^)]*\)\s*$/, '').trim()
      current = null
      continue
    }
    if (/^#\s/.test(line) || line === '---') { continue }

    const qM = line.match(/^(\d+)[.)]\s+(.+)$/)
    if (qM && !DOTS.test(line)) {
      let text = qM[2].trim()
      let bareme = ''
      const bm = text.match(/\(\s*(\d+\s*(?:pts?|points?))\s*\)\s*$/i)
      if (bm) { bareme = bm[1].replace(/\s+/g, ' '); text = text.slice(0, bm.index).trim() }
      current = {
        numero: qM[1], part, lead: clean(text), bareme, body: [],
        kind: 'text', options: [], words: [], displayLead: clean(text), bodyContext: [],
      }
      items.push(current)
      continue
    }

    if (current) current.body.push(line)
  }

  // Détermine le type de chaque question + prépare le rendu
  for (const q of items) {
    const body = q.body.filter((l) => l.trim() !== '')

    // QCM : présence de cases à cocher
    const options = body.map((l) => l.match(CHECKBOX)).filter(Boolean).map((m) => clean(m![1]))
    if (options.length >= 2) {
      q.kind = 'qcm'
      q.options = options
      q.bodyContext = body.filter((l) => !CHECKBOX.test(l)).filter((l) => !DOTS.test(l)).map(clean).filter(Boolean)
      continue
    }

    // Entoure / Souligne : liste de mots cliquables
    if (SELECT_CMD.test(q.lead) || body.some((l) => SELECT_CMD.test(l))) {
      let words: string[] = []
      const ci = q.lead.indexOf(':')
      if (ci !== -1) {
        const w = extractWords(q.lead.slice(ci + 1))
        if (w.length >= 2) { words = w; q.displayLead = clean(q.lead.slice(0, ci + 1)) }
      }
      let usedIdx = -1
      if (words.length < 2) {
        for (let i = 0; i < body.length; i++) {
          const w = extractWords(body[i])
          if (w.length >= 3) { words = w; usedIdx = i; break }
        }
      }
      if (words.length >= 2) {
        q.kind = 'select'
        q.words = words
        q.bodyContext = body.filter((_, i) => i !== usedIdx).filter((l) => !DOTS.test(l)).map(clean).filter(Boolean)
        continue
      }
    }

    // Texte (rédaction / conjugaison / réponse libre) : on garde le contexte
    q.kind = 'text'
    q.bodyContext = body
      .map((l) => {
        if (DOTS.test(l)) {
          const label = clean(l.replace(/[.…_]{4,}.*$/, '').trim())
          return label // garde l'étiquette (Je, Tu…) comme contexte
        }
        return clean(l)
      })
      .filter(Boolean)
  }

  return items
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function ControleFiller({ controleContent, notation, niveau, duree, onClose, onSaved, onRegenerate }: Props) {
  const questions = useMemo(() => parseQuestions(controleContent), [controleContent])
  const [index, setIndex] = useState(0)
  const [texts, setTexts] = useState<Record<number, string>>({})
  const [chosen, setChosen] = useState<Record<number, string[]>>({})
  const [phase, setPhase] = useState<'fill' | 'correcting' | 'done'>('fill')
  const [result, setResult] = useState<CorrectionResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const total = questions.length

  function toggle(i: number, value: string) {
    setChosen((c) => {
      const cur = c[i] ?? []
      return { ...c, [i]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] }
    })
  }

  function reponseFor(i: number): string {
    const q = questions[i]
    if (q.kind === 'text') return texts[i] ?? ''
    return (chosen[i] ?? []).join(', ')
  }

  async function submit() {
    setPhase('correcting')
    setError('')
    try {
      const payload = {
        controleContent, notation, niveau,
        answers: questions.map((q, i) => ({ numero: q.numero, question: q.lead, bareme: q.bareme, reponse: reponseFor(i) })),
      }
      const res = await fetch('/api/correct-copie', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de correction')
      setResult(data.correction)
      setPhase('done')
      fetch('/api/save-controle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controleContent, correction: data.correction, notation, duree }),
      }).then((r) => { if (r.ok) { setSaved(true); onSaved?.() } }).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setPhase('fill')
    }
  }

  if (total === 0) {
    return (
      <div className="mt-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          Impossible de découper ce contrôle en questions automatiquement. Utilise plutôt la correction par photo.
        </div>
        <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">← Retour au contrôle</button>
      </div>
    )
  }

  if (phase === 'done' && result) {
    const obtained = result.questions.reduce((s, q) => s + parseFloat(q.points_obtenus || '0'), 0)
    const max = result.questions.reduce((s, q) => s + parseFloat(q.points_max || '0'), 0)
    const harder = max > 0 && obtained / max > 0.7
    return (
      <div className="mt-6 space-y-4">
        <CorrectionResultView result={result} saved={saved} />
        <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">Retour au contrôle</button>
        {onRegenerate && <RegenButtons onRegenerate={onRegenerate} harder={harder} />}
      </div>
    )
  }

  const q = questions[index]
  const isLast = index === total - 1

  return (
    <div className="mt-6 space-y-5">
      {/* Minuteur sticky */}
      {duree && <ControleTimer duree={duree} />}

      {/* En-tête + progression */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg shrink-0">←</button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-slate-900">Remplir le contrôle</span>
            <span className="text-xs font-semibold text-slate-400">Question {index + 1} / {total}</span>
          </div>
          <div className="flex items-center gap-1">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < index ? 'bg-brand-400' : i === index ? 'bg-brand-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Question complète + réponse */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {q.part && <p className="text-xs font-semibold text-brand-500 mb-1.5">{q.part}</p>}

        {/* Énoncé complet */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-slate-900 leading-relaxed text-[17px]">
            <span className="text-slate-400">{q.numero}.</span> {q.displayLead}
          </h3>
          {q.bareme && <span className="shrink-0 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full whitespace-nowrap">{q.bareme}</span>}
        </div>

        {/* Contexte (texte de référence, consignes…) */}
        {q.bodyContext.length > 0 && (
          <div className="text-slate-700 text-[15px] leading-relaxed space-y-0.5 mb-3">
            {q.bodyContext.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        )}

        {/* ── Zone de réponse selon le type ─────────────────────────────── */}
        {q.kind === 'qcm' ? (
          <div className="space-y-2 mt-3">
            {q.options.map((opt) => {
              const sel = (chosen[index] ?? []).includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => toggle(index, opt)}
                  className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${sel ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-brand-300 text-slate-700'}`}
                >
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-400'}`}>
                    {sel && '✓'}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        ) : q.kind === 'select' ? (
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-2">Tape sur les bons mots pour les sélectionner :</p>
            <div className="flex flex-wrap gap-2">
              {q.words.map((w) => {
                const sel = (chosen[index] ?? []).includes(w)
                return (
                  <button
                    key={w}
                    onClick={() => toggle(index, w)}
                    className={`px-3 py-2 rounded-xl border-2 font-semibold transition-all ${sel ? 'border-accent-400 bg-accent-100 text-accent-800' : 'border-slate-200 hover:border-accent-300 text-slate-700'}`}
                  >
                    {w}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <textarea
            value={texts[index] ?? ''}
            onChange={(e) => setTexts((t) => ({ ...t, [index]: e.target.value }))}
            rows={5}
            placeholder="Écris ta réponse ici…"
            className="w-full mt-3 px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm text-slate-800"
          />
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100">{error}</div>}

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0 || phase === 'correcting'} className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors text-sm">← Précédent</button>
        {isLast ? (
          <button onClick={submit} disabled={phase === 'correcting'} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold shadow-sm transition-all text-sm disabled:opacity-60">
            {phase === 'correcting' ? <><Spinner /> Correction en cours…</> : '✓ Soumettre ma copie'}
          </button>
        ) : (
          <button onClick={() => setIndex((i) => Math.min(total - 1, i + 1))} className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors text-sm">Question suivante →</button>
        )}
      </div>

      {phase === 'correcting' && <p className="text-center text-sm text-slate-500 animate-pulse">Claude corrige ta copie… 15–30 secondes.</p>}
    </div>
  )
}
