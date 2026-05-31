'use client'

interface Props {
  content: string
  niveau?: string
  notation?: string
}

// Nettoie le markdown léger (gras/italique) pour un rendu sobre.
function clean(s: string): string {
  return s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`/g, '').trim()
}

const ROMAN = /^(?:#{2,3}\s+)?((?:I{1,3}|IV|V|VI{0,3}|IX|X)\.)\s+(.*)$/i
const QUESTION = /^(\d+)[.)]\s+(.+)$/
const DOTS = /\.{6,}|…{2,}|_{6,}/

export default function ControleView({ content, niveau, notation }: Props) {
  const noteSuffix = notation === '/100' ? '/ 100' : notation === 'lettres' ? '' : '/ 20'
  const lines = content.split('\n')

  const blocks: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()

    // Ligne vide → espace d'aération
    if (!line || line === '---') { blocks.push(<div key={key++} className="h-3" />); continue }

    // On ignore les éventuelles lignes de tableau markdown (ancien format d'en-tête)
    if (/^\|.*\|$/.test(line) || /^\|?\s*:?-{2,}/.test(line)) continue

    // Titre principal (#)
    if (/^#\s/.test(line)) {
      blocks.push(
        <h1 key={key++} className="text-2xl font-extrabold text-center text-slate-900 mt-2 mb-4">
          {clean(line.replace(/^#\s+/, ''))}
        </h1>
      )
      continue
    }

    // Titre de partie (## / ### ou chiffre romain)
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
      blocks.push(
        <p key={key++} className="text-center text-slate-500 italic text-base mb-4">{clean(line)}</p>
      )
      continue
    }

    // Question numérotée
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
          {bareme && (
            <span className="shrink-0 mt-1 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full whitespace-nowrap">{bareme}</span>
          )}
        </div>
      )
      continue
    }

    // Ligne de réponse en pointillés (avec ou sans étiquette : "Je ......")
    if (DOTS.test(line)) {
      const label = clean(line.replace(/[.…_]{4,}.*$/, '').trim())
      blocks.push(
        <div key={key++} className="flex items-baseline gap-2 my-2.5">
          {label && <span className="text-base sm:text-lg text-slate-700 whitespace-nowrap">{label}</span>}
          <span className="flex-1 border-b border-dotted border-slate-400 translate-y-[-2px]" />
        </div>
      )
      continue
    }

    // Texte normal
    blocks.push(
      <p key={key++} className="text-base sm:text-lg text-slate-800 leading-relaxed my-1.5">{clean(line)}</p>
    )
  }

  return (
    <div>
      {/* En-tête type contrôle d'école */}
      <div className="border-2 border-slate-300 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-base">
        <HeaderField label="Nom" />
        <HeaderField label="Prénom" />
        <HeaderField label="Date" />
        <HeaderField label="Note" suffix={noteSuffix} />
        {niveau && <div className="sm:col-span-2 text-sm text-slate-400">Niveau : {niveau}</div>}
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
