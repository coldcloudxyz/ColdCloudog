import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { leadId, website, company, name } = await req.json()

    if (!company || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })

    // Build context from website if provided
    let websiteContext = ''
    if (website) {
      try {
        const res = await fetch(website, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        })
        const html = await res.text()
        // Extract readable text from HTML (basic extraction)
        websiteContext = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000)
      } catch (e) {
        // Website fetch failed, continue without context
      }
    }

    const prompt = `You are an expert cold email copywriter. Write a short, personalized B2B outreach email.

Target:
- Name: ${name}
- Company: ${company}
- Website: ${website || 'Not provided'}
${websiteContext ? `\nWebsite content excerpt:\n${websiteContext}` : ''}

Requirements:
1. Reference something specific about their company (from website context if available, otherwise make a reasonable inference)
2. Keep it under 100 words
3. Be conversational and human, not salesy
4. End with a soft CTA for a 15-minute call
5. Do NOT use generic phrases like "I hope this email finds you well"
6. Sign off with [Your Name]

Write ONLY the email body, no subject line, no extra commentary.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    })

    const message = completion.choices[0]?.message?.content?.trim()
    if (!message) throw new Error('No message generated')

    // Save to database if leadId provided
    if (leadId) {
      try {
        const supabase = createAdminClient()
        await supabase
          .from('leads')
          .update({ personalized_message: message, updated_at: new Date().toISOString() })
          .eq('id', leadId)
      } catch (e) {
        // DB save failed, still return message
      }
    }

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Message generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate message' },
      { status: 500 }
    )
  }
}
