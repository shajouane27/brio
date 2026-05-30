'use client'

import { useState } from 'react'
import PdfDownloadButtons from './PdfDownloadButtons'
import CorrectionPanel from './CorrectionPanel'

interface ResultPanelProps {
  content: string
  type: 'exercices' | 'controle'
  niveau: string
  controleOptions?: { duree: string; notation: string }
  onReset: () => void
  onBack: () => void
}

export default function ResultPanel({ content, type, niveau, controleOptions, onReset, onBack }: ResultPanelProps) {
  const [copied, setCopied] = useState(false)
  const [showCorrection, setShowCorrection] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isControle = type === 'controle'
  const accentColor = isControle ? 'indigo' : 'emerald'
  const title = isControle ? '📋 Contrôle type généré' : '✏️ Exercices générés'

  if (showCorrection && isControle && controleOptions) {
    return (
      <CorrectionPanel
        controleContent={content}
        notation={controleOptions.notation}
        duree={controleOptions.duree}
        niveau={niveau}
        onClose={() => setShowCorrection(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Main content card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${isControle ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
          <h2 className={`font-semibold flex items-center gap-2 ${isControle ? 'text-indigo-900' : 'text-emerald-900'}`}>
            {title}
          </h2>
          <button
            onClick={handleCopy}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${isControle ? 'text-indigo-600 hover:bg-indigo-100' : 'text-emerald-600 hover:bg-emerald-100'}`}
          >
            {copied ? '✓ Copié !' : 'Copier'}
          </button>
        </div>

        <div className="p-6 max-h-[55vh] overflow-y-auto">
          <FormattedContent content={content} />
        </div>
      </div>

      {/* PDF download — contrôle only */}
      {isControle && controleOptions && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <PdfDownloadButtons
            content={content}
            meta={{ niveau, duree: controleOptions.duree, notation: controleOptions.notation }}
          />
        </div>
      )}

      {/* Correction section — contrôle only */}
      {isControle && (
        <button
          onClick={() => setShowCorrection(true)}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          📸 Corriger ma copie
        </button>
      )}

      {/* Nav buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm"
        >
          ← Retour
        </button>
        <button
          onClick={onReset}
          className={`flex-1 py-3 rounded-xl text-white font-semibold transition-colors text-sm ${isControle ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          Nouveau cours
        </button>
      </div>
    </div>
  )
}

function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="space-y-1 font-sans">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-bold text-slate-900 mt-4 mb-1">{line.slice(4)}</h3>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold text-slate-900 mt-5 mb-2">{line.slice(3)}</h2>
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-xl font-bold text-slate-900 mt-6 mb-2">{line.slice(2)}</h1>
        }
        if (/^(I{1,3}|IV|V|VI{0,3}|IX|X)\.\s/i.test(line)) {
          return (
            <div key={i} className="mt-4 mb-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <span className="font-bold text-slate-800 text-sm">{line}</span>
            </div>
          )
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-slate-800 text-sm">{line.slice(2, -2)}</p>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <p key={i} className="text-slate-700 text-sm pl-4">• {line.slice(2)}</p>
        }
        if (/^\d+[\.\)]/.test(line)) {
          return <p key={i} className="text-slate-800 text-sm font-medium mt-2">{line}</p>
        }
        if (line.startsWith('   ') || line.startsWith('\t')) {
          return <p key={i} className="text-slate-600 text-sm pl-4">{line.trim()}</p>
        }
        if (!line.trim() || line === '---') {
          return <div key={i} className="h-2" />
        }
        return <p key={i} className="text-slate-700 text-sm leading-relaxed">{line}</p>
      })}
    </div>
  )
}
