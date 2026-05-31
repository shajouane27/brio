import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'

export const maxDuration = 60
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const dictee = formData.get('dictee') as string | null
    const niveau = formData.get('niveau') as string | null

    if (!file || !dictee) {
      return NextResponse.json({ error: 'Photo et texte de la dictée requis' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const SUPPORTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const rawType = (file.type || '').toLowerCase()
    const mediaType = (SUPPORTED.includes(rawType) ? rawType : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Tu es un professeur des écoles bienveillant (niveau ${niveau ?? 'primaire'}).

Voici le TEXTE ORIGINAL de la dictée :
---
${dictee}
---

L'image est la photo de la dictée écrite à la main par l'élève. Compare ce que l'élève a écrit au texte original et corrige l'ORTHOGRAPHE mot par mot.

Réponds en JSON strict (sans markdown) :
{
  "note_finale": "16/20",
  "appreciation": "Encouragement final adapté à la note (1 phrase)",
  "mots": [
    {
      "mot": "le mot tel qu'écrit par l'élève",
      "correct": true,
      "correction": "",
      "regle": ""
    },
    {
      "mot": "chevals",
      "correct": false,
      "correction": "chevaux",
      "regle": "Le mot « cheval » prend un x au pluriel (les mots en -al font -aux)."
    }
  ]
}

Règles :
- Donne TOUS les mots de la dictée dans l'ordre, dans "mots".
- "correct": true si le mot est bien orthographié, false sinon.
- Pour chaque faute : "correction" = le mot juste, et "regle" = une explication COURTE et simple de la règle d'orthographe.
- Note sur 20, en enlevant des points selon le nombre de fautes.
- Sois encourageant.`,
          },
        ],
      }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return NextResponse.json({ error: 'Format de réponse inattendu' }, { status: 500 })
    const correction = JSON.parse(m[0])
    return NextResponse.json({ correction })
  } catch (error) {
    console.error('Correct-dictee error:', error)
    return NextResponse.json({ error: 'Erreur lors de la correction' }, { status: 500 })
  }
}
