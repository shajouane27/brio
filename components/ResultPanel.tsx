'use client'

import { useState } from 'react'
import PdfDownloadButtons from './PdfDownloadButtons'
import CorrectionPanel from './CorrectionPanel'
import Markdown from './Markdown'
import ControleTimer from './ControleTimer'
import ControleView from './ControleView'
import ExercicesPlayer, { type Exercice } from './ExercicesPlayer'
import ControleFiller from './ControleFiller'
import { type RegenFn } from './RegenButtons'
import Illustrations, { type Illustration } from './Illustrations'
import SvgFigures from './SvgFigures'
import GeoMap from './GeoMap'
import { extractSvgs } from '@/lib/svg'

interface ResultPanelProps {
  content: string
  type: 'exercices' | 'controle' | 'fiche'
  niveau: string
  exercices?: Exercice[]
  controleOptions?: { duree: string; notation: string }
  illustrations?: { images: Illustration[]; matiere: string | null }
  onReset: () => void
  onBack: () => void
  onRegenerate?: RegenFn
}

const GEO_MATIERES = ['Histoire-Géographie', 'Histoire', 'Géographie']

export default function ResultPanel({ content, type, niveau, exercices, controleOptions, illustrations, onReset, onBack, onRegenerate }: ResultPanelProps) {
  const [copied, setCopied] = useState(false)
  const [showCorrection, setShowCorrection] = useState(false)
  const [showFiller, setShowFiller] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function downloadFichePdf() {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'fiche', meta: { niveau } }),
      })
      if (!res.ok) throw new Error('pdf')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'brio-fiche-revision.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Impossible de générer le PDF. Réessaie.')
    } finally {
      setPdfLoading(false)
    }
  }

  const isControle = type === 'controle'
  const isFiche = type === 'fiche'
  const isExercices = type === 'exercices'
  // Sépare les schémas SVG du texte (rendu à part, responsive)
  const body = isExercices ? { text: content, svgs: [] as string[] } : extractSvgs(content)
  const title = isControle ? 'Contrôle type généré' : isFiche ? 'Fiche de révision' : 'Exercices générés'
  const headerGradient = isControle
    ? 'from-brand-600 to-brand-700'
    : isFiche
    ? 'from-sky-500 to-cyan-600'
    : 'from-emerald-500 to-emerald-600'
  const headerIcon = isControle ? '📋' : isFiche ? '🗂️' : '✏️'

  if (showCorrection && isControle && controleOptions) {
    return (
      <CorrectionPanel
        controleContent={content}
        notation={controleOptions.notation}
        duree={controleOptions.duree}
        niveau={niveau}
        onClose={() => setShowCorrection(false)}
        onRegenerate={onRegenerate}
      />
    )
  }

  if (showFiller && isControle && controleOptions) {
    return (
      <ControleFiller
        controleContent={content}
        notation={controleOptions.notation}
        duree={controleOptions.duree}
        niveau={niveau}
        onClose={() => setShowFiller(false)}
        onRegenerate={onRegenerate}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Minuteur — contrôle uniquement */}
      {isControle && controleOptions && (
        <ControleTimer duree={controleOptions.duree} />
      )}

      {/* Main content card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className={`px-6 py-5 flex items-center justify-between text-white bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 text-xl">
              {headerIcon}
            </span>
            <div>
              <h2 className="font-bold text-lg leading-tight">{title}</h2>
              <p className="text-xs text-white/80 mt-0.5">Niveau {niveau}</p>
            </div>
          </div>
          {!isExercices && (
            <button
              onClick={handleCopy}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors shrink-0"
            >
              {copied ? '✓ Copié !' : 'Copier'}
            </button>
          )}
        </div>

        <div className="p-5 sm:p-7 max-h-[60vh] overflow-y-auto">
          {isExercices ? (
            <ExercicesPlayer exercices={exercices ?? []} onRegenerate={onRegenerate} />
          ) : isControle ? (
            <ControleView content={body.text} niveau={niveau} notation={controleOptions?.notation} />
          ) : (
            <Markdown content={body.text} />
          )}
          {body.svgs.length > 0 && (
            <div className="mt-5"><SvgFigures svgs={body.svgs} /></div>
          )}
        </div>
      </div>

      {/* Illustrations Wikimedia (matières scientifiques / géo) */}
      {illustrations && illustrations.images.length > 0 && (
        <Illustrations images={illustrations.images} />
      )}

      {/* Carte interactive — fiche d'Histoire-Géographie */}
      {isFiche && illustrations?.matiere && GEO_MATIERES.includes(illustrations.matiere) && (
        <GeoMap niveau={niveau} />
      )}

      {/* PDF download — contrôle only */}
      {isControle && controleOptions && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <PdfDownloadButtons
            content={content}
            meta={{ niveau, duree: controleOptions.duree, notation: controleOptions.notation }}
          />
        </div>
      )}

      {/* PDF download — fiche de révision */}
      {isFiche && (
        <button
          onClick={downloadFichePdf}
          disabled={pdfLoading}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-md shadow-sky-500/25 hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0 transition-all text-base"
        >
          {pdfLoading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <span className="text-xl">🖨️</span>
          )}
          Télécharger la fiche en PDF
        </button>
      )}

      {/* Actions contrôle — remplir dans l'app + corriger par photo */}
      {isControle && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setShowFiller(true)}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl shadow-md shadow-brand-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <span className="text-xl">✏️</span> Remplir dans l&apos;app
          </button>
          <button
            onClick={() => setShowCorrection(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold py-4 rounded-2xl shadow-md shadow-accent-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <span className="text-xl">📸</span> Corriger ma copie
          </button>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
        >
          ← Retour
        </button>
        <button
          onClick={onReset}
          className={`flex-1 py-3 rounded-xl text-white font-semibold transition-colors text-sm ${isControle ? 'bg-brand-600 hover:bg-brand-700' : isFiche ? 'bg-sky-600 hover:bg-sky-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          ✨ Nouveau cours
        </button>
      </div>
    </div>
  )
}
