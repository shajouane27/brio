'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Camera, CheckCircle, Zap, Star, ArrowRight, Check, Clock,
  Trophy, Brain, Menu, X, GraduationCap, FileText, MessageSquare,
  TrendingUp, Shield, Globe, ChevronDown, Award, Sparkles,
} from 'lucide-react'

/* ─── Animations CSS injectées une seule fois ───────────────────────────── */
const CSS = `
@keyframes brio-float {
  0%,100% { transform: translateY(0) rotate(0deg) scale(1); }
  33%      { transform: translateY(-14px) rotate(6deg) scale(1.08); }
  66%      { transform: translateY(-7px)  rotate(-4deg) scale(1.04); }
}
@keyframes brio-float2 {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%     { transform: translateY(-18px) rotate(-8deg); }
}
@keyframes brio-gradient {
  0%,100% { background-position: 0% 50%; }
  50%     { background-position: 100% 50%; }
}
@keyframes brio-arrow {
  0%,100% { transform: translateX(0); opacity:1; }
  50%     { transform: translateX(7px); opacity:.6; }
}
@keyframes brio-pulse-badge {
  0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,.5); }
  50%     { box-shadow: 0 0 0 8px rgba(251,191,36,0); }
}
.brio-float  { animation: brio-float  4s ease-in-out infinite; }
.brio-float2 { animation: brio-float2 6s ease-in-out infinite; }
.brio-float3 { animation: brio-float  5s ease-in-out infinite 1s; }
.brio-float4 { animation: brio-float2 7s ease-in-out infinite .5s; }
.brio-gradient-anim {
  background-size: 300% 300%;
  animation: brio-gradient 6s ease infinite;
}
.brio-arrow { animation: brio-arrow 1.6s ease-in-out infinite; }
.brio-pulse-badge { animation: brio-pulse-badge 2s ease-in-out infinite; }
`

/* ─── Scroll fade-in ─────────────────────────────────────────────────────── */
function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeIn()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  )
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-300">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-bold text-slate-900 text-lg">Brio</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Comment ça marche</a>
          <a href="#pricing" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Tarifs</a>
          <Link href="/auth/login" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium">Se connecter</Link>
          <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
            Essayer gratuitement
          </Link>
        </div>
        <button className="md:hidden p-2 text-slate-600" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-4">
          <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm text-slate-700">Comment ça marche</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-sm text-slate-700">Tarifs</a>
          <Link href="/auth/login" onClick={() => setOpen(false)} className="text-sm font-medium text-indigo-600">Se connecter</Link>
          <Link href="/auth/register" onClick={() => setOpen(false)} className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center">
            Essayer gratuitement
          </Link>
        </div>
      )}
    </nav>
  )
}

/* ─── iPhone mockup ──────────────────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 220, height: 440 }}>
      <div className="absolute inset-0 bg-slate-900 rounded-[36px] shadow-2xl" />
      <div className="absolute inset-[2px] bg-white rounded-[34px] overflow-hidden">
        <div className="h-7 bg-indigo-600 flex items-center justify-between px-4">
          <span className="text-white text-[9px] font-medium">9:41</span>
          <div className="w-16 h-4 bg-slate-900 rounded-full" />
          <div className="flex gap-1">
            <div className="w-3 h-1.5 bg-white rounded-sm opacity-80" />
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
          </div>
        </div>
        <div className="bg-indigo-600 px-3 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-[9px]">Bonjour Emma 👋</p>
              <p className="text-white text-[11px] font-bold">Mes cours</p>
            </div>
            <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">E</span>
            </div>
          </div>
        </div>
        <div className="p-2.5 space-y-2">
          <div className="border-2 border-dashed border-indigo-200 rounded-xl p-2.5 flex flex-col items-center gap-1 bg-indigo-50">
            <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Camera size={12} className="text-indigo-600" />
            </div>
            <p className="text-indigo-600 text-[9px] font-semibold">Photographier mon cours</p>
            <p className="text-slate-400 text-[8px]">jusqu&apos;à 10 pages</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 bg-green-100 rounded-md flex items-center justify-center">
                <CheckCircle size={9} className="text-green-600" />
              </div>
              <p className="text-[9px] font-semibold text-slate-800">Mathématiques — 3ème</p>
            </div>
            <div className="space-y-1">
              {['Exercice 1 — Équations', 'Exercice 2 — Fonctions', 'Contrôle type'].map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${i < 2 ? 'bg-green-400' : 'bg-indigo-400'}`} />
                  <p className="text-[8px] text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl p-2.5">
            <p className="text-white text-[9px] font-semibold mb-1">Progression cette semaine</p>
            <div className="flex items-end gap-1 h-10">
              {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-white/30 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-600 rounded-full" />
    </div>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 px-4 sm:px-6"
      style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 40%, #3b82f6 100%)' }}>

      {/* Décoration géométrique SVG */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" aria-hidden>
        <circle cx="90%" cy="15%" r="180" fill="white" />
        <circle cx="5%"  cy="80%" r="120" fill="white" />
        <circle cx="50%" cy="105%" r="200" fill="white" />
      </svg>

      {/* Emojis flottants */}
      <span className="brio-float  absolute text-4xl select-none pointer-events-none hidden sm:block" style={{ top: '12%', left: '6%' }}>📸</span>
      <span className="brio-float2 absolute text-3xl select-none pointer-events-none hidden sm:block" style={{ top: '65%', left: '3%' }}>✏️</span>
      <span className="brio-float3 absolute text-3xl select-none pointer-events-none hidden sm:block" style={{ top: '20%', right: '4%' }}>⭐</span>
      <span className="brio-float4 absolute text-4xl select-none pointer-events-none hidden sm:block" style={{ top: '70%', right: '5%' }}>📊</span>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5 drop-shadow-sm">
              Votre enfant{' '}
              <span className="underline decoration-yellow-300 decoration-4 underline-offset-4">
                photographie son cours.
              </span>{' '}
              Brio s&apos;occupe du reste.
            </h1>
            <p className="text-lg text-indigo-100 leading-relaxed mb-8">
              Exercices personnalisés, contrôles types, correction automatique et suivi de progression — du CP à la Terminale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-yellow-50 text-indigo-700 font-bold px-6 py-3.5 rounded-2xl transition-all shadow-xl text-base">
                Essayer gratuitement
                <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3.5 rounded-2xl border border-white/30 transition-all text-base backdrop-blur-sm">
                Comment ça marche
                <ChevronDown size={18} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-indigo-200">
              <div className="flex items-center gap-1.5"><Check size={14} className="text-yellow-300" />Gratuit pour commencer</div>
              <div className="flex items-center gap-1.5"><Check size={14} className="text-yellow-300" />Sans carte bancaire</div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-6 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20" />
              <div className="relative">
                <PhoneMockup />
              </div>
              {/* Floating badges */}
              <div className="absolute -left-10 top-10 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">18/20</p>
                  <p className="text-[10px] text-slate-500">Contrôle corrigé</p>
                </div>
              </div>
              <div className="absolute -right-8 bottom-20 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Zap size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Exercices prêts</p>
                  <p className="text-[10px] text-slate-500">En 30 secondes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Problème ───────────────────────────────────────────────────────────── */
function Problem() {
  const problems = [
    {
      icon: Brain,
      title: 'Mon enfant ne sait pas par où commencer',
      desc: 'Face à 20 pages de cours, impossible de savoir quoi réviser. Brio structure les révisions automatiquement.',
      bg: '#FFF0E6',
      border: '#F97316',
      iconBg: '#FED7AA',
      iconColor: '#EA580C',
    },
    {
      icon: Clock,
      title: 'Les cours particuliers coûtent trop cher',
      desc: "Un prof particulier, c'est 30€–50€/h. Brio offre un accompagnement personnalisé à une fraction du prix.",
      bg: '#FFE6F0',
      border: '#EC4899',
      iconBg: '#FBCFE8',
      iconColor: '#BE185D',
    },
    {
      icon: Trophy,
      title: "Je n'ai pas toujours le temps de l'aider",
      desc: 'Entre travail et vie de famille, suivre les révisions est complexe. Brio accompagne votre enfant de façon autonome.',
      bg: '#E6F0FF',
      border: '#3B82F6',
      iconBg: '#BFDBFE',
      iconColor: '#1D4ED8',
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Les parents font face à un défi quotidien
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Vous n&apos;êtes pas seuls. Brio est conçu pour répondre aux vraies difficultés des familles.
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="rounded-2xl p-6 h-full border-l-4"
                style={{ backgroundColor: p.bg, borderLeftColor: p.border }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: p.iconBg }}>
                  <p.icon size={26} style={{ color: p.iconColor }} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">&ldquo;{p.title}&rdquo;</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Comment ça marche ──────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      number: '1',
      emoji: '📸',
      icon: Camera,
      title: 'Photographiez le cours',
      desc: "Votre enfant prend en photo son cours, jusqu'à 10 pages. Brio extrait automatiquement le contenu.",
      gradient: 'from-violet-500 to-indigo-500',
      shadow: 'shadow-indigo-200',
    },
    {
      number: '2',
      emoji: '✨',
      icon: FileText,
      title: 'Brio génère les exercices',
      desc: 'En quelques secondes, Brio crée des exercices personnalisés ou un contrôle type adapté au programme.',
      gradient: 'from-indigo-500 to-blue-500',
      shadow: 'shadow-blue-200',
    },
    {
      number: '3',
      emoji: '✅',
      icon: CheckCircle,
      title: 'Correction avec explications',
      desc: 'Chaque réponse est corrigée automatiquement avec des explications pédagogiques détaillées.',
      gradient: 'from-blue-500 to-emerald-500',
      shadow: 'shadow-emerald-200',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6" style={{ backgroundColor: '#F5F0FF' }}>
      {/* Déco SVG */}
      <svg className="absolute opacity-20 pointer-events-none w-32 h-32" style={{ right: '5%', top: '30%' }} viewBox="0 0 100 100" aria-hidden>
        <polygon points="50,5 95,75 5,75" fill="#6366f1" />
      </svg>

      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <Zap size={14} />
            <span>Simple et rapide</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Simple comme 1, 2, 3
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Flèches animées desktop */}
          <div className="hidden md:flex absolute top-16 left-[33%] items-center" style={{ width: '34%' }}>
            <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
            <span className="brio-arrow text-indigo-400 text-xl ml-1">→</span>
          </div>
          <div className="hidden md:flex absolute top-16 left-[66%] items-center" style={{ width: '34%' }}>
            <div className="flex-1 border-t-2 border-dashed border-blue-300" />
            <span className="brio-arrow text-blue-400 text-xl ml-1" style={{ animationDelay: '.4s' }}>→</span>
          </div>

          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  {/* Grand cercle coloré */}
                  <div className={`w-24 h-24 bg-gradient-to-br ${step.gradient} rounded-3xl flex items-center justify-center shadow-2xl ${step.shadow} text-4xl`}>
                    {step.emoji}
                  </div>
                  {/* Badge numéro */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full border-2 border-slate-200 flex items-center justify-center shadow-sm">
                    <span className="text-slate-700 text-sm font-extrabold">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Fonctionnalités ────────────────────────────────────────────────────── */
function Features() {
  const features = [
    {
      icon: Camera, title: 'Photo du cours',
      desc: "Photographiez jusqu'à 10 pages. Brio extrait et analyse le contenu automatiquement.",
      iconBg: '#EEF2FF', iconColor: '#4F46E5', cardBg: 'white', accent: '#EEF2FF',
    },
    {
      icon: FileText, title: 'Contrôles types',
      desc: 'Des contrôles générés sur mesure, alignés sur le programme officiel de chaque niveau.',
      iconBg: '#F5F0FF', iconColor: '#7C3AED', cardBg: 'white', accent: '#F5F0FF',
    },
    {
      icon: MessageSquare, title: 'Correction pédagogique',
      desc: 'Chaque erreur est expliquée avec des conseils adaptés pour progresser vraiment.',
      iconBg: '#ECFDF5', iconColor: '#059669', cardBg: 'white', accent: '#ECFDF5',
    },
    {
      icon: TrendingUp, title: 'Suivi de progression',
      desc: 'Graphiques et statistiques pour visualiser les progrès au fil du temps.',
      iconBg: '#EFF6FF', iconColor: '#2563EB', cardBg: 'white', accent: '#EFF6FF',
    },
    {
      icon: Shield, title: 'Espace parent',
      desc: 'Suivez les activités et résultats de vos enfants depuis votre tableau de bord dédié.',
      iconBg: '#FFF7ED', iconColor: '#EA580C', cardBg: 'white', accent: '#FFF7ED',
    },
    {
      icon: Globe, title: 'France & Portugal',
      desc: "Adapté aux programmes scolaires français et portugais. D'autres pays arrivent bientôt.",
      iconBg: '#FFF1F2', iconColor: '#E11D48', cardBg: 'white', accent: '#FFF1F2',
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-50 relative overflow-hidden">
      {/* Déco */}
      <svg className="absolute -bottom-10 -left-10 opacity-10 pointer-events-none" width="200" height="200" aria-hidden>
        <circle cx="100" cy="100" r="100" fill="#6366f1" />
      </svg>

      <div className="max-w-6xl mx-auto relative">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Tout ce dont votre enfant a besoin
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Une suite complète d&apos;outils pédagogiques dans une seule application.
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full
                hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: f.iconBg }}>
                  <f.icon size={24} style={{ color: f.iconColor }} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5 text-base">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Niveaux scolaires ──────────────────────────────────────────────────── */
function SchoolLevels() {
  const levels = [
    {
      cycle: 'École primaire', emoji: '🌱',
      grades: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
      badge: 'bg-green-100 text-green-800 border border-green-200',
      card: '#F0FDF4', header: '#16A34A',
    },
    {
      cycle: 'Collège', emoji: '📐',
      grades: ['6ème', '5ème', '4ème', '3ème'],
      badge: 'bg-blue-100 text-blue-800 border border-blue-200',
      card: '#EFF6FF', header: '#2563EB',
    },
    {
      cycle: 'Lycée', emoji: '🎓',
      grades: ['2nde', '1ère', 'Terminale'],
      badge: 'bg-violet-100 text-violet-800 border border-violet-200',
      card: '#F5F0FF', header: '#7C3AED',
    },
  ]
  const subjects = ['Mathématiques', 'Français', 'Histoire-Géo', 'Sciences', 'Physique-Chimie', 'SVT', 'Anglais', 'Espagnol', 'Philosophie', 'Économie']

  return (
    <section className="py-20 px-4 sm:px-6"
      style={{ background: 'linear-gradient(180deg, #F8FAFF 0%, #EEF2FF 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <GraduationCap size={14} />
            <span>Tous les niveaux</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Du CP à la Terminale
          </h2>
          <p className="text-lg text-slate-600">
            Brio s&apos;adapte au niveau et au programme de chaque élève.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {levels.map((cycle, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="rounded-2xl p-5 border border-white/80 shadow-sm" style={{ backgroundColor: cycle.card }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{cycle.emoji}</span>
                  <p className="text-sm font-bold" style={{ color: cycle.header }}>{cycle.cycle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cycle.grades.map((g) => (
                    <span key={g} className={`px-3 py-1.5 rounded-xl text-sm font-bold ${cycle.badge}`}>{g}</span>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Toutes les matières</p>
            <div className="flex flex-wrap justify-center gap-2">
              {subjects.map((s, i) => {
                const colors = ['bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700']
                return (
                  <span key={s} className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${colors[i % colors.length]}`}>
                    {s}
                  </span>
                )
              })}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ─── Tarifs ─────────────────────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: 'Gratuit',
      price: '0€',
      period: '',
      desc: 'Pour découvrir Brio sans engagement',
      features: ['3 contrôles par mois', 'Correction automatique', 'Tableau de bord basique', '1 enfant'],
      cta: 'Commencer gratuitement',
      href: '/auth/register',
      highlight: false,
    },
    {
      name: 'Premium',
      price: '9,99€',
      period: '/mois',
      desc: "L'essentiel pour progresser vraiment",
      features: ['Contrôles illimités', 'Fiches de révision', 'Questions flash', 'Espace parent complet', "Jusqu'à 3 enfants"],
      cta: 'Essayer 7 jours gratuits',
      href: '/auth/register',
      highlight: true,
      badge: '⭐ Le plus populaire',
    },
    {
      name: 'Enseignant Pro',
      price: '24,99€',
      period: '/mois',
      desc: 'Pour les enseignants et tuteurs',
      features: ['Classe entière', 'Statistiques détaillées', 'Export groupé', 'Suivi individuel', 'Support prioritaire'],
      cta: "Contacter l'équipe",
      href: '/auth/register',
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Des tarifs pour chaque famille
          </h2>
          <p className="text-lg text-slate-500">
            Commencez gratuitement, évoluez quand vous en avez besoin.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className={`relative rounded-2xl p-6 h-full flex flex-col transition-all ${
                plan.highlight
                  ? 'text-white shadow-2xl shadow-indigo-300 scale-105'
                  : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
              }`}
                style={plan.highlight ? {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 60%, #4f46e5 100%)',
                } : {}}>

                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 brio-pulse-badge bg-amber-400 text-amber-900 text-xs font-extrabold px-4 py-1.5 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <p className={`text-sm font-bold mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                    {plan.period && <span className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{plan.period}</span>}
                  </div>
                  <p className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{plan.desc}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <Check size={16} className={`mt-0.5 flex-shrink-0 font-bold ${plan.highlight ? 'text-green-300' : 'text-green-500'}`} strokeWidth={3} />
                      <span className={plan.highlight ? 'text-indigo-100' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}
                  className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-white text-indigo-700 hover:bg-yellow-50 shadow-lg'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}>
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Témoignages ────────────────────────────────────────────────────────── */
function Testimonials() {
  const testimonials = [
    {
      name: 'Sophie M.',
      role: 'Maman de Lucas, 4ème',
      content: "Depuis que Lucas utilise Brio, il est beaucoup plus autonome dans ses révisions. Il n'attend plus que je sois disponible pour l'aider en maths. Ses notes ont vraiment progressé ce trimestre !",
      rating: 5,
      avatarBg: '#EEF2FF',
      avatarColor: '#4F46E5',
    },
    {
      name: 'Karim B.',
      role: 'Papa de Yasmine, Terminale',
      content: "Brio a changé la façon dont ma fille révise. Elle photographie ses cours le soir et fait les exercices générés. La correction avec les explications l'aide à vraiment comprendre.",
      rating: 5,
      avatarBg: '#F0FDF4',
      avatarColor: '#16A34A',
    },
    {
      name: 'Marie-Christine D.',
      role: 'Maman de deux enfants, CM2 et 5ème',
      content: "Un seul abonnement pour mes deux enfants, deux programmes différents. Brio s'adapte à chacun. Le tableau de bord parent me permet de suivre leur progression.",
      rating: 5,
      avatarBg: '#FFF7ED',
      avatarColor: '#EA580C',
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: '#F3F4F8' }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <Award size={14} />
            <span>Ce que disent les parents</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Des familles qui font confiance à Brio
          </h2>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                    style={{ backgroundColor: t.avatarBg, color: t.avatarColor }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA final ──────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden brio-gradient-anim"
      style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1, #3b82f6, #6366f1, #7c3aed)' }}>
      {/* Étoiles décoratives */}
      <span className="absolute text-3xl select-none pointer-events-none opacity-40 brio-float" style={{ top: '15%', left: '8%' }}>✨</span>
      <span className="absolute text-2xl select-none pointer-events-none opacity-30 brio-float2" style={{ bottom: '20%', left: '12%' }}>⭐</span>
      <span className="absolute text-3xl select-none pointer-events-none opacity-40 brio-float3" style={{ top: '20%', right: '10%' }}>🌟</span>
      <span className="absolute text-2xl select-none pointer-events-none opacity-30 brio-float4" style={{ bottom: '25%', right: '8%' }}>✨</span>

      {/* Cercles déco */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" aria-hidden>
        <circle cx="10%" cy="50%" r="140" fill="white" />
        <circle cx="90%" cy="50%" r="180" fill="white" />
      </svg>

      <FadeIn>
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-white/30">
            <Sparkles size={14} />
            <span>Commencez aujourd&apos;hui</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 drop-shadow-sm">
            Prêt à transformer les révisions de votre enfant ?
          </h2>
          <p className="text-indigo-200 text-lg mb-10">
            Rejoignez les familles qui ont déjà adopté Brio pour accompagner leurs enfants vers le succès scolaire.
          </p>
          <div className="relative inline-block">
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 bg-white hover:bg-yellow-50 text-indigo-700 font-extrabold px-10 py-4 rounded-2xl transition-all shadow-2xl text-base hover:scale-105 active:scale-100">
              Essayer gratuitement pendant 7 jours
              <ArrowRight size={20} />
            </Link>
          </div>
          <p className="mt-5 text-indigo-300 text-sm">
            Sans carte bancaire · Annulable à tout moment
          </p>
        </div>
      </FadeIn>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="font-bold text-white">Brio</span>
            <span className="text-slate-600 text-sm">· L&apos;IA au service de la réussite scolaire</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-600">
          © {new Date().getFullYear()} Brio. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="min-h-screen">
        <Navbar />
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <SchoolLevels />
        <Pricing />
        <Testimonials />
        <FinalCTA />
        <Footer />
      </div>
    </>
  )
}
