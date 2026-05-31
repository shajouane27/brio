'use client'

import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  content: string
  /** Rendu inline (pas de marges de bloc) — pour de courts textes dans une ligne. */
  inline?: boolean
  className?: string
}

// Rendu bloc complet — pour les contrôles, exercices, longs contenus.
const blockComponents: Components = {
  h1: ({ node, ...p }) => <h1 className="text-xl font-bold text-slate-900 mt-5 mb-2 text-center" {...p} />,
  h2: ({ node, ...p }) => <h2 className="text-lg font-bold text-slate-900 mt-5 mb-2" {...p} />,
  h3: ({ node, ...p }) => <h3 className="text-base font-bold text-slate-800 mt-4 mb-1.5" {...p} />,
  h4: ({ node, ...p }) => <h4 className="text-sm font-bold text-slate-800 mt-3 mb-1" {...p} />,
  p: ({ node, ...p }) => <p className="text-sm leading-relaxed text-slate-700 my-2" {...p} />,
  ul: ({ node, ...p }) => <ul className="list-disc pl-5 my-2 space-y-1 text-sm text-slate-700" {...p} />,
  ol: ({ node, ...p }) => <ol className="list-decimal pl-5 my-2 space-y-1.5 text-sm text-slate-700" {...p} />,
  li: ({ node, ...p }) => <li className="leading-relaxed pl-1" {...p} />,
  strong: ({ node, ...p }) => <strong className="font-semibold text-slate-900" {...p} />,
  em: ({ node, ...p }) => <em className="italic" {...p} />,
  hr: () => <hr className="my-4 border-slate-200" />,
  table: ({ node, ...p }) => <div className="overflow-x-auto my-3"><table className="w-full text-sm border-collapse" {...p} /></div>,
  thead: ({ node, ...p }) => <thead className="bg-slate-50" {...p} />,
  th: ({ node, ...p }) => <th className="border border-slate-200 px-2.5 py-1.5 text-left font-semibold text-slate-700" {...p} />,
  td: ({ node, ...p }) => <td className="border border-slate-200 px-2.5 py-1.5 text-slate-700" {...p} />,
  blockquote: ({ node, ...p }) => <blockquote className="border-l-4 border-brand-200 pl-3 my-2 text-slate-600 italic" {...p} />,
  code: ({ node, ...p }) => <code className="bg-slate-100 rounded px-1 py-0.5 text-xs font-mono text-slate-800" {...p} />,
  a: ({ node, ...p }) => <a className="text-brand-600 underline" {...p} />,
}

// Rendu inline — hérite de la couleur du parent, pas de marges.
const inlineComponents: Components = {
  p: ({ node, ...p }) => <span {...p} />,
  strong: ({ node, ...p }) => <strong className="font-semibold" {...p} />,
  em: ({ node, ...p }) => <em className="italic" {...p} />,
  code: ({ node, ...p }) => <code className="bg-black/5 rounded px-1 text-xs font-mono" {...p} />,
}

export default function Markdown({ content, inline = false, className = '' }: MarkdownProps) {
  if (inline) {
    return (
      <span className={className}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
          {content}
        </ReactMarkdown>
      </span>
    )
  }

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={blockComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
