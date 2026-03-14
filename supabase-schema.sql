-- ============================================================
-- ColdCloud AI Lead Engine — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company text,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  calendly_link text,
  from_email text,
  from_name text,
  email_signature text,
  daily_send_limit integer default 50,
  send_delay_minutes integer default 2,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CAMPAIGNS TABLE
-- ============================================================
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  status text default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  calendly_link text,
  send_schedule jsonb, -- { time: "09:00", timezone: "America/New_York", days: ["Mon","Tue","Wed","Thu","Fri"] }
  total_leads integer default 0,
  emails_sent integer default 0,
  replies integer default 0,
  meetings_booked integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- LEADS TABLE
-- ============================================================
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  campaign_id uuid references public.campaigns on delete set null,
  name text not null,
  company text not null,
  email text not null,
  website text,
  linkedin text,
  status text default 'new' check (status in ('new', 'contacted', 'replied', 'meeting_booked', 'closed', 'unqualified')),
  notes text,
  personalized_message text,
  email_sent_at timestamptz,
  email_opened_at timestamptz,
  email_replied_at timestamptz,
  meeting_booked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint per user
create unique index leads_user_email_idx on public.leads(user_id, email);

-- ============================================================
-- EMAIL EVENTS TABLE (for tracking)
-- ============================================================
create table public.email_events (
  id uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  event_type text not null check (event_type in ('sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed')),
  metadata jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Campaigns
alter table public.campaigns enable row level security;
create policy "Users can CRUD own campaigns" on public.campaigns for all using (auth.uid() = user_id);

-- Leads
alter table public.leads enable row level security;
create policy "Users can CRUD own leads" on public.leads for all using (auth.uid() = user_id);

-- Email events
alter table public.email_events enable row level security;
create policy "Users can view own events" on public.email_events for select using (auth.uid() = user_id);
create policy "Users can insert own events" on public.email_events for insert with check (auth.uid() = user_id);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
create index leads_user_id_idx on public.leads(user_id);
create index leads_campaign_id_idx on public.leads(campaign_id);
create index leads_status_idx on public.leads(status);
create index leads_created_at_idx on public.leads(created_at desc);
create index campaigns_user_id_idx on public.campaigns(user_id);
create index email_events_lead_id_idx on public.email_events(lead_id);
create index email_events_user_id_idx on public.email_events(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_leads_updated_at before update on public.leads
  for each row execute procedure public.set_updated_at();

create trigger set_campaigns_updated_at before update on public.campaigns
  for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
