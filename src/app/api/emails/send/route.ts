import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

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

    const { leadId, email, name, message } = await req.json()

    if (!email)           return NextResponse.json({ error: 'Missing: email'   }, { status: 400 })
    if (!name)            return NextResponse.json({ error: 'Missing: name'    }, { status: 400 })
    if (!message?.trim()) return NextResponse.json({ error: 'Missing: message' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    const fromEmail = process.env.EMAIL_FROM_ADDRESS
    if (!fromEmail) {
      return NextResponse.json({ error: 'EMAIL_FROM_ADDRESS not configured' }, { status: 500 })
    }

    if (
      fromEmail.endsWith('@gmail.com') ||
      fromEmail.endsWith('@yahoo.com')  ||
      fromEmail.endsWith('@hotmail.com')
    ) {
      return NextResponse.json(
        { error: `"${fromEmail}" cannot be used. Use a verified domain or onboarding@resend.dev for testing.` },
        { status: 400 }
      )
    }

    const fromName  = process.env.EMAIL_FROM_NAME ?? 'ColdCloud'
    const from      = `${fromName} <${fromEmail}>`
    const firstName = name.split(' ')[0]
    const subject   = `Quick note for ${firstName}`

    const htmlBody = message
      .split('\n\n')
      .map((p: string) => `<p style="margin:0 0 16px 0">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1e293b">
  <div style="max-width:560px;margin:0 auto">
    ${htmlBody}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"/>
    <p style="margin:0;font-size:12px;color:#94a3b8">
      <a href="#" style="color:#0ea5e9;text-decoration:none">Unsubscribe</a>
    </p>
  </div>
</body></html>`

    const resend = new Resend(apiKey)
    const { data, error: sendErr } = await resend.emails.send({
      from,
      to:      [email],
      subject,
      html,
      text: message,
    })

    if (sendErr) {
      return NextResponse.json({ error: sendErr.message }, { status: 422 })
    }

    if (leadId) {
      await supabase
        .from('leads')
        .update({
          status:        'contacted',
          email_sent_at: new Date().toISOString(),
          updated_at:    new Date().toISOString(),
        })
        .eq('id', leadId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true, messageId: data?.id, sentTo: email })
  } catch (e: any) {
    console.error('[emails/send]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}