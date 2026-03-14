import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const leads = Array.isArray(body) ? body : [body]

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(apiKey)

    const fromName = process.env.EMAIL_FROM_NAME || 'Sahil'
    const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'hello@thecoldcloud.xyz'

    const supabase = createAdminClient()

    const results = []

    for (const lead of leads) {

      if (!lead.email || !lead.message) {
        results.push({
          email: lead.email,
          status: 'failed',
          error: 'Missing email or message'
        })
        continue
      }

      const firstName = lead.name?.split(' ')[0] || 'there'

      const subject =
        lead.subject || `Quick idea for ${firstName}`

      const htmlMessage = lead.message
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>')

      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [lead.email],
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:560px;margin:0 auto;padding:40px 20px;">

<p>${htmlMessage}</p>

<br/>

<p style="margin-top:30px;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;padding-top:16px;">
You received this email because we thought it might be relevant to you.
<br/>
<a href="#" style="color:#0ea5e9;">Unsubscribe</a>
</p>

</body>
</html>
`,
        text: lead.message
      })

      if (error) {
        results.push({
          email: lead.email,
          status: 'failed',
          error: error.message
        })
        continue
      }

      results.push({
        email: lead.email,
        status: 'sent',
        id: data?.id
      })

      if (lead.leadId) {
        try {
          await supabase
            .from('leads')
            .update({
              status: 'contacted',
              email_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.leadId)

        } catch (e) {
          console.log('Lead update failed')
        }
      }

      try {
        await supabase
          .from('email_logs')
          .insert({
            lead_id: lead.leadId || null,
            email: lead.email,
            subject,
            message: lead.message,
            provider: 'resend',
            provider_id: data?.id,
            created_at: new Date().toISOString()
          })

      } catch (e) {
        console.log('Log insert failed')
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('Email send error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}