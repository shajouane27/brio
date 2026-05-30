import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Diagnostic temporaire : liste les modèles accessibles avec la clé API.
// Ouvrir https://brio-zeta.vercel.app/api/models dans le navigateur.
export async function GET() {
  try {
    const list = await anthropic.models.list({ limit: 100 })
    const ids = list.data.map((m) => m.id)
    return NextResponse.json({ count: ids.length, models: ids })
  } catch (error) {
    const detail =
      error instanceof Anthropic.APIError
        ? `${error.status ?? ''} ${error.message}`.trim()
        : error instanceof Error
        ? error.message
        : 'inconnue'
    return NextResponse.json({ error: detail }, { status: 500 })
  }
}
