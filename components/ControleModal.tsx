'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface ControleModalProps {
  onConfirm: (duree: string, notation: string) => void
  onClose: () => void
}

export default function ControleModal({ onConfirm, onClose }: ControleModalProps) {
  const t = useTranslations('Controle')
  const tCommon = useTranslations('Common')
  const [duree, setDuree] = useState('1h')
  const [notation, setNotation] = useState('/20')

  const DUREES = [
    { value: '30min', label: t('dur_30'), icon: '⏱️' },
    { value: '1h',    label: t('dur_1h'), icon: '🕐' },
    { value: '2h',    label: t('dur_2h'), icon: '🕑' },
    { value: '3h',    label: t('dur_3h'), icon: '🕒' },
  ]
  const NOTATIONS = [
    { value: '/20',    label: t('not_20_label'),   sublabel: t('not_20_sub') },
    { value: '/100',   label: t('not_100_label'),  sublabel: t('not_100_sub') },
    { value: 'lettres',label: t('not_lett_label'), sublabel: t('not_lett_sub') },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('parametres')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('personnalise')}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">{t('duree')}</label>
          <div className="grid grid-cols-4 gap-2">
            {DUREES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuree(d.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-all
                  ${duree === d.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
              >
                <span className="text-lg">{d.icon}</span>
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">{t('notation')}</label>
          <div className="space-y-2">
            {NOTATIONS.map((n) => (
              <button
                key={n.value}
                onClick={() => setNotation(n.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
                  ${notation === n.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="text-left">
                  <div className={`font-medium ${notation === n.value ? 'text-indigo-700' : 'text-slate-800'}`}>
                    {n.label}
                  </div>
                  <div className="text-xs text-slate-500">{n.sublabel}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${notation === n.value ? 'border-indigo-500' : 'border-slate-300'}`}>
                  {notation === n.value && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            {tCommon('annuler')}
          </button>
          <button
            onClick={() => onConfirm(duree, notation)}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
          >
            {t('generer')}
          </button>
        </div>
      </div>
    </div>
  )
}
