'use client'

export default function SvgFigures({ svgs }: { svgs: string[] }) {
  if (!svgs?.length) return null
  return (
    <div className="space-y-4">
      {svgs.map((svg, i) => (
        <div
          key={i}
          className="brio-svg max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ))}
    </div>
  )
}
