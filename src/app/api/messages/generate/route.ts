import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

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
        // continue without context
      }
    }

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are an expert cold email copywriter. Write a short, personalized B2B outreach email.

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

Write ONLY the email body. No subject line, no extra text.`,
      }],
      max_tokens:  300,
      temperature: 0.7,
    })

    const message = completion.choices[0]?.message?.content?.trim()
    if (!message) throw new Error('OpenAI returned an empty response')

    if (leadId) {
      await supabase
        .from('leads')
        .update({
          personalized_message: message,
          updated_at:           new Date().toISOString(),
        })
        .eq('id', leadId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ message })
  } catch (e: any) {
    console.error('[messages/generate]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}