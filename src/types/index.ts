export type LeadStatus = 'new' | 'contacted' | 'replied' | 'meeting_booked' | 'closed' | 'unqualified'

export interface Lead {
  id: string
  user_id: string
  campaign_id?: string
  name: string
  company: string
  email: string
  website?: string
  linkedin?: string
  status: LeadStatus
  notes?: string
  personalized_message?: string
  email_sent_at?: string
  email_opened_at?: string
  email_replied_at?: string
  meeting_booked_at?: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  calendly_link?: string
  send_schedule?: string
  total_leads: number
  emails_sent: number
  replies: number
  meetings_booked: number
  created_at: string
  updated_at: string
}

export interface Analytics {
  total_leads: number
  emails_sent: number
  replies: number
  meetings_booked: number
  conversion_rate: number
  open_rate: number
  reply_rate: number
  leads_by_status: Record<LeadStatus, number>
  emails_over_time: { date: string; sent: number; opened: number; replied: number }[]
}

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  plan: 'free' | 'pro' | 'enterprise'
  calendly_link?: string
  resend_api_key?: string
  openai_api_key?: string
}
