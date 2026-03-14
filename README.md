# ColdCloud AI Lead Engine

**Automatically find leads and book meetings using AI.**

Built for agencies, SaaS founders, and B2B businesses who want to scale outbound sales with personalized AI outreach.

---

## ✨ Features

- **AI Message Generation** — GPT-4o-mini reads company websites and writes personalized cold emails
- **Lead Management** — CSV import, manual add, status tracking, full CRUD
- **Campaign System** — Group leads into campaigns with scheduling and tracking
- **Email Sending** — Powered by Resend with open/reply tracking
- **Meeting Booking** — Calendly integration for instant scheduling
- **Analytics Dashboard** — Conversion rates, funnel metrics, campaign performance
- **Dark Mode** — Full dark/light mode support
- **Fully Responsive** — Mobile + desktop optimized

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/coldcloud-ai-lead-engine
cd coldcloud-ai-lead-engine
npm install
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase-schema.sql` → Run
3. Go to **Settings → API** → copy your keys

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-proj-...
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=outreach@yourdomain.com
EMAIL_FROM_NAME=Your Name
```

### 4. Get Your API Keys

| Service | Where to Get |
|---------|-------------|
| **Supabase** | [supabase.com](https://app.supabase.com) → Project → Settings → API |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Resend** | [resend.com](https://resend.com) → API Keys (verify your domain first) |

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
coldcloud/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles + Tailwind
│   │   ├── auth/
│   │   │   ├── login/page.tsx          # Login page
│   │   │   └── signup/page.tsx         # Signup page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Dashboard layout + sidebar
│   │   │   ├── page.tsx                # Overview dashboard
│   │   │   ├── leads/page.tsx          # Lead management
│   │   │   ├── campaigns/page.tsx      # Campaign builder
│   │   │   ├── emails/page.tsx         # Email center + tracking
│   │   │   ├── analytics/page.tsx      # Analytics charts
│   │   │   └── settings/page.tsx       # Account settings
│   │   └── api/
│   │       ├── leads/route.ts          # Leads CRUD API
│   │       ├── campaigns/route.ts      # Campaigns API
│   │       ├── messages/generate/      # AI message generation
│   │       ├── emails/send/            # Resend email API
│   │       └── analytics/route.ts      # Analytics aggregation
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client
│   │   └── utils.ts                    # Shared utilities
│   └── types/
│       └── index.ts                    # TypeScript types
├── supabase-schema.sql                 # Complete DB schema
├── .env.example                        # Environment template
└── README.md
```

---

## 🌐 Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow prompts, then add environment variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add RESEND_API_KEY
vercel env add EMAIL_FROM_ADDRESS
vercel env add EMAIL_FROM_NAME
vercel --prod
```

### Option B: GitHub + Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add all environment variables in **Settings → Environment Variables**
5. Deploy!

---

## 🗄️ Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends Supabase auth) |
| `leads` | Lead records with status tracking |
| `campaigns` | Outreach campaigns |
| `email_events` | Email open/click/reply tracking |

### Lead Statuses

```
new → contacted → replied → meeting_booked → closed
                                           ↘ unqualified
```

---

## 📧 Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key
4. Add to `.env.local` as `RESEND_API_KEY`
5. Set `EMAIL_FROM_ADDRESS` to an address on your verified domain

> **Free tier**: 3,000 emails/month, 100/day — perfect for getting started.

---

## 🤖 AI Message Generation

The AI engine works in two stages:

1. **Website scraping** — Fetches the lead's company website
2. **GPT-4o-mini** — Generates a personalized cold email using the website context

To use your own OpenAI key, add it to `.env.local` as `OPENAI_API_KEY`.

Cost estimate: ~$0.001 per message generated (GPT-4o-mini pricing).

---

## 🔧 Customization

### Changing the AI prompt

Edit `src/app/api/messages/generate/route.ts` — find the `prompt` variable and customize it for your use case.

### Email templates

Edit `src/app/api/emails/send/route.ts` — the HTML template is in the `resend.emails.send()` call.

### Adding new lead fields

1. Add columns to `supabase-schema.sql`
2. Update `src/types/index.ts`
3. Update the form in `src/app/dashboard/leads/page.tsx`

---

## 🛡️ Security Notes

- All API routes use Supabase Row Level Security (RLS)
- API keys are server-side only (never exposed to client)
- Supabase handles auth with JWT tokens
- Service role key is only used in server-side API routes

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | OpenAI GPT-4o-mini |
| Email | Resend |
| Charts | Recharts |
| Animation | Framer Motion |
| Forms | React Hook Form |
| CSV | Papa Parse |

---

## 📄 License

MIT — free to use, modify, and deploy.

---

Built with ❤️ by ColdCloud
