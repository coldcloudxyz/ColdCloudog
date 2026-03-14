import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body ──────────────────────────────────────────
    const body = await req.json()
    const { leadId, email, name, message } = body

    // Validate every required field and log what arrived
    console.log('[emails/send] incoming request:', {
      leadId,
      email,
      name,
      messageLength: message?.length ?? 0,
    })

    if (!email) {
      return NextResponse.json(
        { error: 'Missing field: email' },
        { status: 400 }
      )
    }
    if (!name) {
      return NextResponse.json(
        { error: 'Missing field: name' },
        { status: 400 }
      )
    }
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Missing field: message' },
        { status: 400 }
      )
    }

    // ── 2. Validate API key ────────────────────────────────────
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[emails/send] RESEND_API_KEY is not set')
      return NextResponse.json(
        { error: 'Email service is not configured. Add RESEND_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    // ── 3. Resolve from address ────────────────────────────────
    //
    // IMPORTANT: EMAIL_FROM_ADDRESS must be an address on a domain
    // you have verified inside your Resend dashboard.
    //
    // Gmail addresses (anything @gmail.com) CANNOT be used as a
    // from address via Resend. Resend will report the email as
    // "Delivered" but Gmail will suppress it on arrival because
    // the message did not originate from Google's mail servers.
    //
    // If you do not yet have a verified domain, use:
    //   EMAIL_FROM_ADDRESS=onboarding@resend.dev
    // That address is pre-verified by Resend and works immediately.
    //
    const fromEmail = process.env.EMAIL_FROM_ADDRESS
    if (!fromEmail) {
      console.error('[emails/send] EMAIL_FROM_ADDRESS is not set')
      return NextResponse.json(
        { error: 'Sender address is not configured. Add EMAIL_FROM_ADDRESS to your environment variables.' },
        { status: 500 }
      )
    }

    // Block obviously broken from addresses before even calling Resend
    if (fromEmail.endsWith('@gmail.com') || fromEmail.endsWith('@yahoo.com') || fromEmail.endsWith('@hotmail.com')) {
      console.error('[emails/send] Invalid from address — free email providers cannot be used:', fromEmail)
      return NextResponse.json(
        {
          error: `"${fromEmail}" cannot be used as a sending address. Resend requires a verified custom domain. Use onboarding@resend.dev for testing or add a domain at resend.com/domains.`,
        },
        { status: 400 }
      )
    }

    const fromName = process.env.EMAIL_FROM_NAME || 'ColdCloud'
    const from = `${fromName} <${fromEmail}>`

    // ── 4. Build subject from lead name ────────────────────────
    //
    // Previously this was hardcoded to "Hello World" (Resend's
    // default example subject). It now uses the lead's first name.
    //
    const firstName = name.split(' ')[0]
    const subject = `Quick note for ${firstName}`

    // ── 5. Build HTML body ─────────────────────────────────────
    const htmlBody = message
      .split('\n\n')
      .map((para: string) => `<p style="margin:0 0 16px 0">${para.replace(/\n/g, '<br/>')}</p>`)
      .join('')

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
  </head>
  <body style="margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1e293b;background:#ffffff">
    <div style="max-width:560px;margin:0 auto">
      ${htmlBody}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"/>
      <p style="margin:0;font-size:12px;color:#94a3b8">
        You received this email because we thought it might be relevant to your work.
        <br/>
        <a href="#" style="color:#0ea5e9;text-decoration:none">Unsubscribe</a>
      </p>
    </div>
  </body>
</html>`

    // ── 6. Send ────────────────────────────────────────────────
    const resend = new Resend(apiKey)

    console.log('[emails/send] sending to:', email, 'from:', from, 'subject:', subject)

    const { data, error } = await resend.emails.send({
      from,
      to: [email],       // ← always the lead's email from the request body
      subject,
      html,
      text: message,     // plain-text fallback
    })

    if (error) {
      console.error('[emails/send] Resend error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 422 }
      )
    }

    console.log('[emails/send] success, messageId:', data?.id)

    // ── 7. Update lead status in Supabase ──────────────────────
    if (leadId) {
      try {
        // Lazy import so the route still works even if Supabase
        // env vars are missing during local testing
        const { createAdminClient } = await import('@/lib/supabase')
        const supabase = createAdminClient()
        const { error: dbError } = await supabase
          .from('leads')
          .update({
            status: 'contacted',
            email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId)

        if (dbError) {
          // Non-fatal — email was sent, just log the DB issue
          console.warn('[emails/send] DB update failed:', dbError.message)
        }
      } catch (dbErr: any) {
        console.warn('[emails/send] DB update exception:', dbErr.message)
      }
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      sentTo: email,
      sentFrom: from,
      subject,
    })

  } catch (err: any) {
    console.error('[emails/send] unhandled error:', err)
    return NextResponse.json(
      { error: err.message || 'Unexpected server error' },
      { status: 500 }
    )
  }
}