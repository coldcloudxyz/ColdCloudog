import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { leadId, website, company, name } = await req.json()

    if (!company || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    })

    // =========================
    // Fetch website for context
    // =========================

    let websiteContext = ''

    if (website) {
      try {
        const res = await fetch(website, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(7000)
        })

        const html = await res.text()

        websiteContext = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 4000)

      } catch (e) {
        console.log('Website fetch failed')
      }
    }

    // =========================
    // AI Prompt
    // =========================

    const prompt = `
You are a world-class B2B cold email copywriter.

Write a highly personalized outreach email.

Target lead:
Name: ${name}
Company: ${company}
Website: ${website || 'Not provided'}

${websiteContext ? `Website content context:\n${websiteContext}` : ''}

Instructions:

• Mention something specific about their company, product, or market
• Use the website context if available
• Sound natural and human
• No generic phrases
• Keep the email under 90 words
• Write like a founder reaching out
• Avoid buzzwords
• Make it feel individually written

Goal:
Start a friendly conversation and ask if they would be open to a quick 15-minute call.

Sign off with:

Sahil  
Founder, ColdCloud

Output ONLY the email body.
`

    // =========================
    // Generate AI email
    // =========================

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-70b-192',
      messages: [
        { role: 'system', content: 'You write extremely personalized cold emails.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.9
    })

    const message = completion.choices[0]?.message?.content?.trim()

    if (!message) {
      throw new Error('No message generated')
    }

    // =========================
    // Save message in Supabase
    // =========================

    if (leadId) {
      try {
        const supabase = createAdminClient()

        await supabase
          .from('leads')
          .update({
            personalized_message: message,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)

      } catch (e) {
        console.log('Supabase save failed')
      }
    }

    return NextResponse.json({ message })

  } catch (error: any) {
    console.error('Message generation error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to generate message' },
      { status: 500 }
    )
  }
}