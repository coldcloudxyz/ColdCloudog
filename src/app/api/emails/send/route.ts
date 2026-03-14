import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { leadId, email, name, message, subject } = await req.json()

    if (!email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 })
    }

    const resend = new Resend(apiKey)

    const fromName = process.env.EMAIL_FROM_NAME || 'Your Name'
    const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'

    const emailSubject = subject || `Quick idea for ${name?.split(' ')[0] || 'you'}`

    // Build HTML version of the email
    const htmlMessage = message
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>')

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <p>${htmlMessage}</p>
          <br/>
          <p style="color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
            You received this email because we thought it might be relevant to you. 
            <a href="#" style="color: #0ea5e9;">Unsubscribe</a>
          </p>
        </body>
        </html>
      `,
      text: message,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Update lead status in database
    if (leadId) {
      try {
        const supabase = createAdminClient()
        await supabase
          .from('leads')
          .update({
            status: 'contacted',
            email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId)
      } catch (e) {
        // DB update failed, still return success
      }
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
