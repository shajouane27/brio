'use client'

import React from 'react'

interface Props {
  content: string
  niveau?: string
  notation?: string
}

function clean(s: string): string {
  return s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`/g, '').trim()
}

const ROMAN = /^(?:#{2,3}\s+)?((?:I{1,3}|IV|V|VI{0,3}|IX|X)\.)\s+(.*)$/i
const QUESTION = /^(\d+)[.)]\s+(.+)$/
const DOTS = /(?:\.{6,}|…{2,}|_{6,})/
const DOTS_G = /(\.{6,}|…{2,}|_{6,})/g
const BOX = /[┌┐└┘├┤┬┴┼│─]/
const CHECKBOX = /^(?:□|☐|◻|\[\s?\]|-\s*\[\s?\])\s*(.*)$/
const DIVIDER = /^─{5,}$/
const TEXT_HEADER = /^📖\s*/
const TEXT_WARN = /^⚠️\s*/

// Rend une ligne contenant des pointillés : texte + traits à compléter, sur UNE ligne.
function FillLine({ line, k }: { line: string; k: number }) {
  const parts = line.split(DOTS_G).filter((p) => p !== '')
  return (
    <div key={k} className="flex flex-wrap items-end gap-x-2 gap-y-2 my-2.5">
      {parts.map((p, idx) =>
        /^(?:\.{6,}|…{2,}|_{6,})$/.test(p) ? (
          <span key={idx} className="flex-1 min-w-[90px] h-[1.5em] border-b border-dotted border-slate-400" />
        ) : (
          <span key={idx} className="text-base sm:text-lg text-slate-800 whitespace-pre-wrap">{clean(p)}</span>
        )
      )}
    </div>
  )
}

function Table({ rows, k }: { rows: string[]; k: number }) {
  const cells = (r: string) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  const header = cells(rows[0])
  const hasSep = rows[1] && /^\|?\s*:?-{2,}/.test(rows[1])
  const body = rows.slice(hasSep ? 2 : 1)
  return (
    <div key={k} className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} className="border-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-bold text-slate-800">{clean(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>
              {cells(r).map((c, ci) => (
                <td key={ci} className="border-2 border-slate-300 px-3 py-3 align-top text-slate-800 h-12">{clean(c) || ' '}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Regroupe les lignes entre deux séparateurs ─── dans un bloc "texte support" */
function preprocess(raw: string): string {
  const lines = raw.split('\n')
  const out: string[] = []
  let inBody = false

  for (const l of lines) {
    const t = l.trim()
    if (DIVIDER.test(t)) {
      if (!inBody) {
        out.push('__TEXT_OPEN__')
        inBody = true
      } else {
        out.push('__TEXT_CLOSE__')
        inBody = false
      }
      continue
    }
    out.push(l)
  }
  if (inBody) out.push('__TEXT_CLOSE__')
  return out.join('\n')
}

export default function ControleView({ content, niveau, notation }: Props) {
  const noteSuffix = notation === '/100' ? '/ 100' : notation === 'lettres' ? '' : '/ 20'
  const preprocessed = preprocess(content)
  const lines = preprocessed.split('\n')
  const blocks: React.ReactNode[] = []
  let key = 0
  let textBodyLines: string[] = []
  let inTextBody = false

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // Corps du texte support (entre __TEXT_OPEN__ et __TEXT_CLOSE__)
    if (trimmed === '__TEXT_OPEN__') { inTextBody = true; textBodyLines = []; continue }
    if (trimmed === '__TEXT_CLOSE__') {
      inTextBody = false
      blocks.push(
        <div key={key++} className="my-2 bg-slate-50 rounded-xl border border-slate-200 px-5 py-4 text-base sm:text-lg text-slate-800 leading-relaxed whitespace-pre-wrap italic">
          {textBodyLines.join('\n').trim()}
        </div>
      )
      textBodyLines = []
      continue
    }
    if (inTextBody) { textBodyLines.push(rawLine); continue }

    const line = trimmed // canonical trimmed line used below

    if (!line || line === '---') { blocks.push(<div key={key++} className="h-3" />); continue }

    // ── Texte support ────────────────────────────────────────────────────────

    // En-tête 📖 TEXTE / TEXTO / TEXT
    if (TEXT_HEADER.test(line)) {
      const label = line.replace(TEXT_HEADER, '').trim()
      blocks.push(
        <div key={key++} className="flex items-center gap-2 mt-6 mb-1">
          <span className="text-lg">📖</span>
          <span className="font-extrabold text-base sm:text-lg text-slate-900 uppercase tracking-wide">{label}</span>
        </div>
      )
      continue
    }

    // Séparateur ──── (restants non consommés par le préprocesseur)
    if (DIVIDER.test(line)) {
      blocks.push(<hr key={key++} className="my-1 border-slate-400" />)
      continue
    }

    // Instruction ⚠️ "Lisez / Leia / Read attentivement"
    if (TEXT_WARN.test(line)) {
      const txt = line.replace(TEXT_WARN, '').trim()
      blocks.push(
        <div key={key++} className="mt-2 mb-5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-base shrink-0">⚠️</span>
          <span className="text-sm sm:text-base font-semibold text-amber-800">{txt}</span>
        </div>
      )
      continue
    }

    // Tableau (lignes | … |)
    if (/^\|.*\|$/.test(line)) {
      const rows: string[] = []
      let j = i
      while (j < lines.length && /^\|.*\|$/.test(lines[j].trim())) { rows.push(lines[j].trim()); j++ }
      blocks.push(<Table key={key++} rows={rows} k={key} />)
      i = j - 1
      continue
    }

    // Cadre de schéma (caractères de dessin) → grand espace vide
    if (BOX.test(line)) {
      let j = i
      while (j < lines.length && BOX.test(lines[j].trim())) j++
      blocks.push(
        <div key={key++} className="border-2 border-dashed border-slate-300 rounded-xl h-44 my-3 flex items-center justify-center text-slate-300 text-sm">
          Espace pour le schéma
        </div>
      )
      i = j - 1
      continue
    }

    // Étiquette de schéma [ … ]
    if (/^\[.*\]$/.test(line)) {
      blocks.push(<p key={key++} className="text-center text-slate-500 italic text-sm mt-3">{clean(line.replace(/^\[|\]$/g, ''))}</p>)
      continue
    }

    // Titre principal
    if (/^#\s/.test(line)) {
      blocks.push(<h1 key={key++} className="text-2xl font-extrabold text-center text-slate-900 mt-2 mb-4">{clean(line.replace(/^#\s+/, ''))}</h1>)
      continue
    }

    // Titre de partie (## ou chiffre romain)
    const rm = line.match(ROMAN)
    if (rm) {
      blocks.push(
        <h2 key={key++} className="text-lg sm:text-xl font-bold text-center text-slate-900 mt-7 mb-4 pb-2 border-b-2 border-slate-200">
          {clean(`${rm[1]} ${rm[2]}`)}
        </h2>
      )
      continue
    }

    // Consigne en italique
    if (/^[*_].*[*_]$/.test(line)) {
      blocks.push(<p key={key++} className="text-center text-slate-500 italic text-base mb-4">{clean(line)}</p>)
      continue
    }

    // Case à cocher (QCM)
    const cb = line.match(CHECKBOX)
    if (cb) {
      blocks.push(
        <div key={key++} className="flex items-center gap-2.5 ml-2 my-2 text-base sm:text-lg text-slate-800">
          <span className="w-5 h-5 border-2 border-slate-400 rounded shrink-0" />
          <span>{clean(cb[1])}</span>
        </div>
      )
      continue
    }

    // Question numérotée (sans pointillés)
    const qm = line.match(QUESTION)
    if (qm && !DOTS.test(line)) {
      const bm = qm[2].match(/\(\s*\d+\s*(?:pts?|points?)\s*\)\s*$/i)
      const bareme = bm ? bm[0].replace(/[()]/g, '').trim() : ''
      const texte = bm ? qm[2].slice(0, bm.index).trim() : qm[2].trim()
      blocks.push(
        <div key={key++} className="flex items-start justify-between gap-3 mt-5 mb-1">
          <p className="text-[17px] sm:text-lg font-semibold text-slate-900 leading-relaxed">
            <span className="text-slate-500">{qm[1]}.</span> {clean(texte)}
          </p>
          {bareme && <span className="shrink-0 mt-1 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full whitespace-nowrap">{bareme}</span>}
        </div>
      )
      continue
    }

    // Ligne avec pointillés (réponse, conjugaison, texte à trous)
    if (DOTS.test(line)) {
      blocks.push(<FillLine key={key++} line={line} k={key} />)
      continue
    }

    // Texte normal
    blocks.push(<p key={key++} className="text-base sm:text-lg text-slate-800 leading-relaxed my-1.5">{clean(line)}</p>)
  }

  return (
    <div>
      {/* En-tête type contrôle d'école */}
      <div className="border-2 border-slate-300 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-base">
        <HeaderField label="Nom" />
        <HeaderField label="Prénom" />
        <HeaderField label="Classe" />
        <HeaderField label="Date" />
        <HeaderField label="Note" suffix={noteSuffix} />
        {niveau && <div className="text-sm text-slate-400 self-center">Niveau : {niveau}</div>}
      </div>

      {blocks}
    </div>
  )
}

function HeaderField({ label, suffix }: { label: string; suffix?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-semibold text-slate-700 whitespace-nowrap">{label} :</span>
      <span className="flex-1 border-b border-dotted border-slate-400 translate-y-[-2px]" />
      {suffix && <span className="text-slate-500 whitespace-nowrap">{suffix}</span>}
    </div>
  )
}
