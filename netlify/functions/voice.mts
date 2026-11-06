import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'
import { getSession } from '../lib/auth.js'

/**
 * Optional premium System voice. When ELEVENLABS_API_KEY is configured, lines are synthesised with a
 * deep masculine voice and cached in Netlify Blobs so each line is only ever generated once.
 * Without the key the endpoint answers 404 and the client falls back to its built-in voice engine.
 */
const STYLE_SETTINGS: Record<string, { stability: number; similarity_boost: number; style: number; speed: number }> = {
  normal: { stability: 0.55, similarity_boost: 0.8, style: 0.35, speed: 0.92 },
  warning: { stability: 0.35, similarity_boost: 0.8, style: 0.7, speed: 0.9 },
  epic: { stability: 0.4, similarity_boost: 0.85, style: 0.65, speed: 0.85 },
  dark: { stability: 0.5, similarity_boost: 0.85, style: 0.55, speed: 0.8 },
}

export default async (req: Request, context: Context) => {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return new Response('Premium voice not configured', { status: 404 })
  const session = await getSession(context)
  if (!session) return new Response('Unauthorized', { status: 401 })
  const url = new URL(req.url)
  const text = (url.searchParams.get('text') ?? '').trim().slice(0, 240)
  const style = url.searchParams.get('style') ?? 'normal'
  if (!text) return new Response('Missing text', { status: 400 })
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'
  const key = createHash('sha256').update(`${voiceId}:${style}:${text}`).digest('hex')
  const store = getStore('system-voice')
  const cached = await store.get(key, { type: 'arrayBuffer' })
  if (cached) return new Response(cached, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=31536000' } })
  const settings = STYLE_SETTINGS[style] ?? STYLE_SETTINGS.normal
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: settings }),
  })
  if (!res.ok) return new Response('Voice provider error', { status: 502 })
  const audio = await res.arrayBuffer()
  await store.set(key, audio, { metadata: { text, style } })
  return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=31536000' } })
}

export const config: Config = { path: '/api/voice' }
