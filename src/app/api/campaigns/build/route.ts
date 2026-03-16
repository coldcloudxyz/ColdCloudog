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

function buildPrompt(
  goal: string,
  campaignName: string,
  qa: { question: string; answer: string }[]
): string {
  const qaBlock = qa
    .map((item, i) => `Q${i + 1}: ${item.question}\nA${i + 1}: ${item.answer}`)
    .join('\n\n')

  const goalLabel: Record<string, string> = {
    promotion:   'Product Promotion',
    meeting:     'Meeting Booking',
    followup:    'Follow-up Outreach',
    partnership: 'Partnership Outreach',
    hiring:      'Hiring Outreach',
  }

  return `You are an expert B2B email copywriter.

Campaign name: "${campaignName}"
Campaign goal: ${goalLabel[goal] ?? goal}

Information provided by the sender:
${qaBlock}

Write a sequence of exactly 3 cold outreach emails for this campaign.

Rules:
- Each email must be short (under 120 words)
- Be conversational, specific, and human — never generic
- Use these variables where appropriate: {{name}}, {{company}}, {{website}}
- Email 1 is the initial outreach
- Email 2 is a follow-up sent 3 days later
- Email 3 is a final polite follow-up sent 7 days after email 1

Respond ONLY with valid JSON — no markdown, no extra text:

{
  "emails": [
    { "step_number": 1, "delay_days": 0, "subject": "...", "email_template": "..." },
    { "step_number": 2, "delay_days": 3, "subject": "...", "email_template": "..." },
    { "step_number": 3, "delay_days": 7, "subject": "...", "email_template": "..." }
  ]
}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaign_id, goal, campaign_name, qa } = await req.json()

    if (!campaign_id || !goal || !campaign_name || !Array.isArray(qa)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const filteredQA = qa.filter((item: any) => item.answer?.trim())

    if (filteredQA.length > 0) {
      await supabase
        .from('campaign_inputs')
        .delete()
        .eq('campaign_id', campaign_id)
        .eq('user_id', user.id)

      await supabase
        .from('campaign_inputs')
        .insert(
          filteredQA.map((item: any) => ({
            campaign_id,
            user_id:  user.id,
            question: item.question,
            answer:   item.answer.trim(),
          }))
        )
    }

    await supabase
      .from('campaigns')
      .update({ campaign_goal: goal })
      .eq('id', campaign_id)
      .eq('user_id', user.id)

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [{ role: 'user', content: buildPrompt(goal, campaign_name, filteredQA) }],
      max_tokens:  1500,
      temperature: 0.7,
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) throw new Error('OpenAI returned an empty response')

    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim()

    let parsed: { emails: any[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      throw new Error('AI returned malformed JSON. Please try again.')
    }

    if (!Array.isArray(parsed.emails) || parsed.emails.length === 0) {
      throw new Error('AI did not return any emails')
    }

    await supabase
      .from('campaign_steps')
      .delete()
      .eq('campaign_id', campaign_id)
      .eq('user_id', user.id)

    const { data: steps, error: stepsErr } = await supabase
      .from('campaign_steps')
      .insert(
        parsed.emails.map((e: any) => ({
          campaign_id,
          user_id:        user.id,
          step_number:    e.step_number,
          delay_days:     e.delay_days,
          subject:        e.subject,
          email_template: e.email_template,
        }))
      )
      .select()

    if (stepsErr) throw stepsErr

    return NextResponse.json({ steps: steps ?? [] })
  } catch (e: any) {
    console.error('[campaigns/build]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}