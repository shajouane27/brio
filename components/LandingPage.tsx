'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Camera, BookOpen, CheckCircle, BarChart2, Users, Globe,
  Zap, Star, ArrowRight, Check, Clock, Trophy, Brain,
  Sparkles, Menu, X, GraduationCap, FileText, MessageSquare,
  TrendingUp, Shield, ChevronDown, Award
} from 'lucide-react'

function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeIn()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-bold text-slate-900 text-lg">Brio</span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Comment ça marche</a>
          <a href="#pricing" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Tarifs</a>
          <Link href="/auth/login" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium">Se connecter</Link>
          <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
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

function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 220, height: 440 }}>
      {/* Phone frame */}
      <div className="absolute inset-0 bg-slate-900 rounded-[36px] shadow-2xl" />
      <div className="absolute inset-[2px] bg-white rounded-[34px] overflow-hidden">
        {/* Status bar */}
        <div className="h-7 bg-indigo-600 flex items-center justify-between px-4">
          <span className="text-white text-[9px] font-medium">9:41</span>
          <div className="w-16 h-4 bg-slate-900 rounded-full" />
          <div className="flex gap-1">
            <div className="w-3 h-1.5 bg-white rounded-sm opacity-80" />
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
          </div>
        </div>
        {/* Header */}
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
        {/* Content */}
        <div className="p-2.5 space-y-2">
          {/* Upload card */}
          <div className="border-2 border-dashed border-indigo-200 rounded-xl p-2.5 flex flex-col items-center gap-1 bg-indigo-50">
            <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Camera size={12} className="text-indigo-600" />
            </div>
            <p className="text-indigo-600 text-[9px] font-semibold">Photographier mon cours</p>
            <p className="text-slate-400 text-[8px]">jusqu'à 10 pages</p>
          </div>
          {/* Recent exercise card */}
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
          {/* Score */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-2.5">
            <p className="text-white text-[9px] font-semibold mb-1">Progression cette semaine</p>
            <div className="flex items-end gap-1 h-10">
              {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-white/30 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-600 rounded-full" />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-24 px-4 sm:px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={14} />
              <span>Propulsé par l'intelligence artificielle</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
              Votre enfant{' '}
              <span className="text-indigo-600">photographie son cours.</span>{' '}
              Brio s'occupe du reste.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Exercices personnalisés, contrôles types, correction automatique et suivi de progression — du CP à la Terminale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-2xl transition-colors shadow-lg shadow-indigo-200 text-base"
              >
                Essayer gratuitement
                <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-2xl border border-slate-200 transition-colors text-base"
              >
                Voir comment ça marche
                <ChevronDown size={18} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-1.5"><Check size={14} className="text-green-500" />Gratuit pour commencer</div>
              <div className="flex items-center gap-1.5"><Check size={14} className="text-green-500" />Sans carte bancaire</div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-3xl" />
              <div className="relative">
                <PhoneMockup />
              </div>
              {/* Floating badges */}
              <div className="absolute -left-8 top-12 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 border border-slate-100">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">18/20</p>
                  <p className="text-[10px] text-slate-500">Contrôle corrigé</p>
                </div>
              </div>
              <div className="absolute -right-6 bottom-20 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 border border-slate-100">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Zap size={16} className="text-indigo-600" />
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

function Problem() {
  const problems = [
    {
      icon: Brain,
      title: 'Mon enfant ne sait pas par où commencer',
      desc: 'Face à 20 pages de cours, impossible de savoir quoi réviser en priorité. Brio structure les révisions automatiquement.',
      color: 'text-orange-500 bg-orange-50',
    },
    {
      icon: Clock,
      title: "Les cours particuliers coûtent trop cher",
      desc: "Un professeur particulier, c'est 30€ à 50€ de l'heure. Brio offre un accompagnement personnalisé à une fraction du prix.",
      color: 'text-red-500 bg-red-50',
    },
    {
      icon: Trophy,
      title: "Je n'ai pas toujours le temps de l'aider",
      desc: 'Entre travail et vie de famille, suivre les révisions est complexe. Brio accompagne votre enfant de façon autonome.',
      color: 'text-violet-500 bg-violet-50',
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Les parents font face à un défi quotidien
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Vous n'êtes pas seuls. Brio est conçu pour répondre aux vraies difficultés des familles.
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${p.color}`}>
                  <p.icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">"{p.title}"</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Camera,
      title: 'Photographiez le cours',
      desc: "Votre enfant prend en photo son cours, jusqu'à 10 pages. Brio extrait automatiquement le contenu.",
      color: 'bg-indigo-600',
    },
    {
      number: '02',
      icon: FileText,
      title: 'Brio génère les exercices',
      desc: 'En quelques secondes, Brio crée des exercices personnalisés ou un contrôle type adapté au niveau et au programme.',
      color: 'bg-indigo-600',
    },
    {
      number: '03',
      icon: CheckCircle,
      title: 'Correction avec explications',
      desc: 'Les réponses sont corrigées automatiquement avec des explications pédagogiques détaillées pour chaque question.',
      color: 'bg-indigo-600',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
            <Zap size={14} />
            <span>Simple et rapide</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Simple comme 1, 2, 3
          </h2>
        </FadeIn>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-indigo-100" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className="flex flex-col items-center text-center relative">
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 ${step.color} rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200`}>
                      <step.icon size={28} className="text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-700 text-xs font-extrabold">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: Camera, title: 'Photo du cours', desc: "Photographiez jusqu'à 10 pages. Brio extrait et analyse le contenu automatiquement.", color: 'text-indigo-600 bg-indigo-50' },
    { icon: FileText, title: 'Contrôles types', desc: 'Des contrôles générés sur mesure, alignés sur le programme officiel de chaque niveau.', color: 'text-violet-600 bg-violet-50' },
    { icon: MessageSquare, title: 'Correction pédagogique', desc: 'Chaque erreur est expliquée avec des conseils adaptés pour progresser vraiment.', color: 'text-green-600 bg-green-50' },
    { icon: TrendingUp, title: 'Suivi de progression', desc: 'Graphiques et statistiques pour visualiser les progrès au fil du temps.', color: 'text-blue-600 bg-blue-50' },
    { icon: Shield, title: 'Espace parent', desc: 'Suivez les activités et résultats de vos enfants depuis votre tableau de bord dédié.', color: 'text-orange-600 bg-orange-50' },
    { icon: Globe, title: 'France & Portugal', desc: "Adapté aux programmes scolaires français et portugais. D'autres pays arrivent bientôt.", color: 'text-red-600 bg-red-50' },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Tout ce dont votre enfant a besoin
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Une suite complète d'outils pédagogiques dans une seule application.
          </p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon size={20} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function SchoolLevels() {
  const levels = [
    { cycle: 'École primaire', grades: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'], color: 'bg-green-100 text-green-700 border-green-200' },
    { cycle: 'Collège', grades: ['6ème', '5ème', '4ème', '3ème'], color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { cycle: 'Lycée', grades: ['2nde', '1ère', 'Terminale'], color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  ]
  const subjects = ['Mathématiques', 'Français', 'Histoire-Géo', 'Sciences', 'Physique-Chimie', 'SVT', 'Anglais', 'Espagnol', 'Philosophie', 'Économie']

  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
            <GraduationCap size={14} />
            <span>Tous les niveaux</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Du CP à la Terminale
          </h2>
          <p className="text-lg text-slate-500">
            Brio s'adapte au niveau et au programme de chaque élève.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {levels.map((cycle, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-slate-50 rounded-2xl p-5">
                <p className="text-sm font-semibold text-slate-500 mb-3">{cycle.cycle}</p>
                <div className="flex flex-wrap gap-2">
                  {cycle.grades.map((g) => (
                    <span key={g} className={`px-3 py-1 rounded-xl text-sm font-semibold border ${cycle.color}`}>{g}</span>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Toutes les matières</p>
            <div className="flex flex-wrap justify-center gap-2">
              {subjects.map((s) => (
                <span key={s} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

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
      badge: '⭐ Populaire',
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
    <section id="pricing" className="py-20 px-4 sm:px-6 bg-slate-50">
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
              <div className={`relative rounded-2xl p-6 h-full flex flex-col ${
                plan.highlight
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 ring-4 ring-indigo-600/20'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <p className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                    {plan.period && <span className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{plan.period}</span>}
                  </div>
                  <p className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{plan.desc}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <Check size={15} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-indigo-200' : 'text-indigo-600'}`} />
                      <span className={plan.highlight ? 'text-indigo-100' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
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

function Testimonials() {
  const testimonials = [
    {
      name: 'Sophie M.',
      role: 'Maman de Lucas, 4ème',
      content: "Depuis que Lucas utilise Brio, il est beaucoup plus autonome dans ses révisions. Il n'attend plus que je sois disponible pour l'aider en maths. Ses notes ont vraiment progressé ce trimestre !",
      rating: 5,
    },
    {
      name: 'Karim B.',
      role: 'Papa de Yasmine, Terminale',
      content: "Brio a changé la façon dont ma fille révise. Elle photographie ses cours le soir et fait les exercices générés. La correction automatique avec les explications l'aide à vraiment comprendre, pas juste à mémoriser.",
      rating: 5,
    },
    {
      name: 'Marie-Christine D.',
      role: 'Maman de deux enfants, CM2 et 5ème',
      content: "Un seul abonnement pour mes deux enfants, deux programmes différents. Brio s'adapte à chacun. Le tableau de bord parent me permet de suivre leur progression sans les déranger.",
      rating: 5,
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
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
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-700 text-sm font-bold">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
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

function FinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-indigo-600">
      <FadeIn>
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500 text-indigo-100 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
            <Sparkles size={14} />
            <span>Commencez aujourd'hui</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Prêt à transformer les révisions de votre enfant ?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            Rejoignez les familles qui ont déjà adopté Brio pour accompagner leurs enfants vers le succès scolaire.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-600 font-bold px-8 py-4 rounded-2xl transition-colors shadow-lg text-base"
          >
            Essayer gratuitement pendant 7 jours
            <ArrowRight size={18} />
          </Link>
          <p className="mt-4 text-indigo-300 text-sm">
            Sans carte bancaire · Annulable à tout moment
          </p>
        </div>
      </FadeIn>
    </section>
  )
}

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
            <span className="text-slate-600 text-sm">· L'IA au service de la réussite scolaire</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
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
  )
}
