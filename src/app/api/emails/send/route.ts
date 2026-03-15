import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId, email, name, message } = await req.json()

    if (!email)          return NextResponse.json({ error: 'Missing field: email'   }, { status: 400 })
    if (!name)           return NextResponse.json({ error: 'Missing field: name'    }, { status: 400 })
    if (!message?.trim()) return NextResponse.json({ error: 'Missing field: message' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
    }

    const fromEmail = process.env.EMAIL_FROM_ADDRESS
    if (!fromEmail) {
      return NextResponse.json({ error: 'EMAIL_FROM_ADDRESS is not configured' }, { status: 500 })
    }

    if (
      fromEmail.endsWith('@gmail.com') ||
      fromEmail.endsWith('@yahoo.com') ||
      fromEmail.endsWith('@hotmail.com')
    ) {
      return NextResponse.json(
        { error: `"${fromEmail}" cannot be used. Use a verified custom domain or onboarding@resend.dev for testing.` },
        { status: 400 }
      )
    }

    const fromName  = process.env.EMAIL_FROM_NAME ?? 'ColdCloud'
    const from      = `${fromName} <${fromEmail}>`
    const firstName = name.split(' ')[0]
    const subject   = `Quick note for ${firstName}`

    const htmlBody = message
      .split('\n\n')
      .map((para: string) =>
        `<p style="margin:0 0 16px 0">${para.replace(/\n/g, '<br/>')}</p>`
      )
      .join('')

    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1e293b">
    <div style="max-width:560px;margin:0 auto">
      ${htmlBody}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"/>
      <p style="margin:0;font-size:12px;color:#94a3b8">
        <a href="#" style="color:#0ea5e9;text-decoration:none">Unsubscribe</a>
      </p>
    </div>
  </body>
</html>`

    const resend = new Resend(apiKey)

    const { data, error: sendErr } = await resend.emails.send({
      from,
      to:      [email],
      subject,
      html,
      text: message,
    })

    if (sendErr) {
      console.error('[emails/send] Resend error:', sendErr)
      return NextResponse.json({ error: sendErr.message }, { status: 422 })
    }

    // Update lead status — scoped to this user
    if (leadId) {
      const { error: dbErr } = await supabase
        .from('leads')
        .update({
          status:        'contacted',
          email_sent_at: new Date().toISOString(),
          updated_at:    new Date().toISOString(),
        })
        .eq('id', leadId)
        .eq('user_id', user.id)

      if (dbErr) {
        console.warn('[emails/send] DB update failed:', dbErr.message)
      }
    }

    return NextResponse.json({
      success:   true,
      messageId: data?.id,
      sentTo:    email,
      subject,
    })
  } catch (e: any) {
    console.error('[emails/send]', e.message)
    return NextResponse.json(
      { error: e.message ?? 'Unexpected server error' },
      { status: 500 }
    )
  }
}