import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-client'
import OpenAI from 'openai'

function buildPrompt(goal: string, name: string, qa: { question: string; answer: string }[]) {
  const goalLabel: Record<string, string> = {
    promotion: 'Product Promotion', meeting: 'Meeting Booking',
    followup: 'Follow-up Outreach', partnership: 'Partnership Outreach', hiring: 'Hiring Outreach',
  }
  const qaBlock = qa.map((item, i) => `Q${i + 1}: ${item.question}\nA${i + 1}: ${item.answer}`).join('\n\n')
  return `You are an expert B2B email copywriter.
Campaign: "${name}" | Goal: ${goalLabel[goal] ?? goal}

Sender info:
${qaBlock}

Write exactly 3 emails. Rules:
- Under 120 words each
- Conversational and specific, never generic
- Use {{name}}, {{company}}, {{website}} variables
- Email 1: initial outreach (day 0)
- Email 2: follow-up (day 3)
- Email 3: final follow-up (day 7)

Respond ONLY with this exact JSON, no markdown:
{"emails":[{"step_number":1,"delay_days":0,"subject":"...","email_template":"..."},{"step_number":2,"delay_days":3,"subject":"...","email_template":"..."},{"step_number":3,"delay_days":7,"subject":"...","email_template":"..."}]}`
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const { campaign_id, goal, campaign_name, qa } = await req.json()

    if (!campaign_id || !goal || !campaign_name || !Array.isArray(qa)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })

    // Verify ownership
    const { data: campaign, error: campErr } = await supabase!
      .from('campaigns')
      .select('id')
      .eq('id', campaign_id)
      .eq('user_id', user!.id)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const filteredQA = qa.filter((item: any) => item.answer?.trim())

    // Save Q&A
    if (filteredQA.length > 0) {
      await supabase!.from('campaign_inputs').delete()
        .eq('campaign_id', campaign_id).eq('user_id', user!.id)
      await supabase!.from('campaign_inputs').insert(
        filteredQA.map((item: any) => ({
          campaign_id, user_id: user!.id,
          question: item.question, answer: item.answer.trim(),
        }))
      )
    }

    // Update goal
    await supabase!.from('campaigns')
      .update({ campaign_goal: goal })
      .eq('id', campaign_id).eq('user_id', user!.id)

    // Generate with OpenAI
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt(goal, campaign_name, filteredQA) }],
      max_tokens: 1500, temperature: 0.7,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()

    let parsed: { emails: any[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      throw new Error('AI returned malformed JSON. Please try again.')
    }

    if (!Array.isArray(parsed.emails) || parsed.emails.length === 0) {
      throw new Error('AI did not return any emails')
    }

    // Save steps
    await supabase!.from('campaign_steps').delete()
      .eq('campaign_id', campaign_id).eq('user_id', user!.id)

    const { data: steps, error: stepsErr } = await supabase!
      .from('campaign_steps')
      .insert(parsed.emails.map((e: any) => ({
        campaign_id, user_id: user!.id,
        step_number: e.step_number, delay_days: e.delay_days,
        subject: e.subject, email_template: e.email_template,
      })))
      .select()

    if (stepsErr) throw stepsErr
    return NextResponse.json({ steps: steps ?? [] })
  } catch (e: any) {
    console.error('[campaigns/build]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}