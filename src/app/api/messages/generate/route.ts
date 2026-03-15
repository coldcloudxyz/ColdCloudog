import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId, website, company, name } = await req.json()

    if (!company || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: company and name' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Scrape website for context
    let websiteContext = ''
    if (website) {
      try {
        const res = await fetch(website, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal:  AbortSignal.timeout(5000),
        })
        const html = await res.text()
        websiteContext = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000)
      } catch {
        // Continue without website context
      }
    }

    const openai = new OpenAI({ apiKey })

    const prompt = `You are an expert cold email copywriter. Write a short, personalized B2B outreach email.

Target:
- Name: ${name}
- Company: ${company}
- Website: ${website ?? 'Not provided'}
${websiteContext ? `\nWebsite content excerpt:\n${websiteContext}` : ''}

Requirements:
1. Reference something specific about their company
2. Keep it under 100 words
3. Be conversational and human — not salesy
4. End with a soft CTA for a 15-minute call
5. Never start with "I hope this email finds you well"
6. Sign off with [Your Name]

Write ONLY the email body. No subject line, no extra commentary.`

    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  300,
      temperature: 0.7,
    })

    const message = completion.choices[0]?.message?.content?.trim()
    if (!message) throw new Error('OpenAI returned an empty response')

    // Save back to the lead row — scoped to this user
    if (leadId) {
      const { error: updateErr } = await supabase
        .from('leads')
        .update({
          personalized_message: message,
          updated_at:           new Date().toISOString(),
        })
        .eq('id', leadId)
        .eq('user_id', user.id)

      if (updateErr) {
        console.warn('[messages/generate] DB update failed:', updateErr.message)
      }
    }

    return NextResponse.json({ message })
  } catch (e: any) {
    console.error('[messages/generate]', e.message)
    return NextResponse.json(
      { error: e.message ?? 'Failed to generate message' },
      { status: 500 }
    )
  }
}