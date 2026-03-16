import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-client'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const { leadId, website, company, name } = await req.json()
    if (!company || !name) {
      return NextResponse.json({ error: 'company and name are required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })

    let websiteContext = ''
    if (website) {
      try {
        const res = await fetch(website, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        })
        const html = await res.text()
        websiteContext = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000)
      } catch { /* continue without context */ }
    }

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Write a short personalized B2B cold email.
Target: ${name} at ${company}${website ? ` (${website})` : ''}
${websiteContext ? `Website context: ${websiteContext}` : ''}

Rules: under 100 words, conversational, reference something specific about their company, soft CTA for 15-min call, sign off with [Your Name]. Write ONLY the email body.`,
      }],
      max_tokens: 300, temperature: 0.7,
    })

    const message = completion.choices[0]?.message?.content?.trim()
    if (!message) throw new Error('OpenAI returned empty response')

    if (leadId) {
      await supabase!.from('leads')
        .update({ personalized_message: message, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('user_id', user!.id)
    }

    return NextResponse.json({ message })
  } catch (e: any) {
    console.error('[messages/generate]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}