import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-client'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const { leadId, email, name, message } = await req.json()

    if (!email)           return NextResponse.json({ error: 'Missing: email'   }, { status: 400 })
    if (!name)            return NextResponse.json({ error: 'Missing: name'    }, { status: 400 })
    if (!message?.trim()) return NextResponse.json({ error: 'Missing: message' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

    const fromEmail = process.env.EMAIL_FROM_ADDRESS
    if (!fromEmail) return NextResponse.json({ error: 'EMAIL_FROM_ADDRESS not configured' }, { status: 500 })

    if (['@gmail.com', '@yahoo.com', '@hotmail.com'].some(d => fromEmail.endsWith(d))) {
      return NextResponse.json(
        { error: `"${fromEmail}" cannot be used. Use a verified custom domain or onboarding@resend.dev for testing.` },
        { status: 400 }
      )
    }

    // Check user settings for a custom sender name
    const { data: settings } = await supabase!
      .from('user_settings')
      .select('sender_name')
      .eq('user_id', user!.id)
      .single()

    const fromName = settings?.sender_name || process.env.EMAIL_FROM_NAME || 'ColdCloud'
    const from     = `${fromName} <${fromEmail}>`
    const subject  = `Quick note for ${name.split(' ')[0]}`

    const htmlBody = message
      .split('\n\n')
      .map((p: string) => `<p style="margin:0 0 16px 0">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1e293b">
<div style="max-width:560px;margin:0 auto">${htmlBody}
<hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"/>
<p style="margin:0;font-size:12px;color:#94a3b8"><a href="#" style="color:#0ea5e9;text-decoration:none">Unsubscribe</a></p>
</div></body></html>`

    const resend = new Resend(apiKey)
    const { data, error: sendErr } = await resend.emails.send({ from, to: [email], subject, html, text: message })
    if (sendErr) return NextResponse.json({ error: sendErr.message }, { status: 422 })

    if (leadId) {
      await supabase!.from('leads')
        .update({ status: 'contacted', email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('user_id', user!.id)
    }

    return NextResponse.json({ success: true, messageId: data?.id, sentTo: email })
  } catch (e: any) {
    console.error('[emails/send]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}