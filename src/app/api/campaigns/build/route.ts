import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import OpenAI from 'openai'

// ── Helpers ───────────────────────────────────────────────────

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
- Email 2 is a follow-up sent 3 days later (reference the first email briefly)
- Email 3 is a final polite follow-up sent 7 days after email 1

Respond ONLY with valid JSON in this exact shape — no markdown, no extra text:

{
  "emails": [
    {
      "step_number": 1,
      "delay_days": 0,
      "subject": "...",
      "email_template": "..."
    },
    {
      "step_number": 2,
      "delay_days": 3,
      "subject": "...",
      "email_template": "..."
    },
    {
      "step_number": 3,
      "delay_days": 7,
      "subject": "...",
      "email_template": "..."
    }
  ]
}`
}

// ── POST /api/campaigns/build ─────────────────────────────────
// Body: { campaign_id, goal, campaign_name, qa }
// 1. Saves Q&A to campaign_inputs
// 2. Calls OpenAI to generate 3 emails
// 3. Saves emails to campaign_steps
// 4. Returns the generated steps

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaign_id, goal, campaign_name, qa } = await req.json()

    if (!campaign_id || !goal || !campaign_name || !Array.isArray(qa)) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, goal, campaign_name, qa' },
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

    // ── 1. Verify campaign belongs to this user ───────────────
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // ── 2. Save Q&A inputs ────────────────────────────────────
    const filteredQA = qa.filter(
      (item: any) => item.answer?.trim()
    )

    if (filteredQA.length > 0) {
      // Delete any previous inputs for this campaign first
      await supabase
        .from('campaign_inputs')
        .delete()
        .eq('campaign_id', campaign_id)
        .eq('user_id', user.id)

      const { error: inputErr } = await supabase
        .from('campaign_inputs')
        .insert(
          filteredQA.map((item: any) => ({
            campaign_id,
            user_id:  user.id,
            question: item.question,
            answer:   item.answer.trim(),
          }))
        )

      if (inputErr) {
        console.error('[campaigns/build] input save error:', inputErr.message)
      }
    }

    // ── 3. Update campaign goal ───────────────────────────────
    await supabase
      .from('campaigns')
      .update({ campaign_goal: goal })
      .eq('id', campaign_id)
      .eq('user_id', user.id)

    // ── 4. Generate email sequence with OpenAI ────────────────
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [{ role: 'user', content: buildPrompt(goal, campaign_name, filteredQA) }],
      max_tokens:  1500,
      temperature: 0.7,
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) throw new Error('OpenAI returned an empty response')

    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim()

    let parsed: { emails: any[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('[campaigns/build] JSON parse failed. Raw output:', raw)
      throw new Error('AI returned malformed JSON. Please try again.')
    }

    if (!Array.isArray(parsed.emails) || parsed.emails.length === 0) {
      throw new Error('AI did not return any emails')
    }

    // ── 5. Save generated steps ───────────────────────────────
    // Delete any previous steps for this campaign first
    await supabase
      .from('campaign_steps')
      .delete()
      .eq('campaign_id', campaign_id)
      .eq('user_id', user.id)

    const stepsToInsert = parsed.emails.map((e: any) => ({
      campaign_id,
      user_id:        user.id,
      step_number:    e.step_number,
      delay_days:     e.delay_days,
      subject:        e.subject,
      email_template: e.email_template,
    }))

    const { data: steps, error: stepsErr } = await supabase
      .from('campaign_steps')
      .insert(stepsToInsert)
      .select()

    if (stepsErr) throw stepsErr

    return NextResponse.json({ steps: steps ?? [] })
  } catch (e: any) {
    console.error('[campaigns/build]', e.message)
    return NextResponse.json(
      { error: e.message ?? 'Failed to build campaign' },
      { status: 500 }
    )
  }
}