# Waitlist API (v1)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/sturdy-barnacle/emberwisp-waitlist)

Simple, tinkerer-friendly, mostly-drop-in waitlist widget built to work on static sites: Jekyll, plain HTML, React, Astro, Hugo, or anything that can POST JSON.

**New to this project?** Check out the [Quick Start Guide](docs/QUICKSTART.md) to get up and running in minutes.

**Have questions?** See the [FAQ](docs/FAQ.md) for common questions about DNS records, troubleshooting, customization, and more.

---

## ⚠️ Important: How This Works

**This is a drop-in plugin with a separate API backend:**

- **The API** (this repository) → Deploy to **Vercel** (one-time setup, takes 5 minutes)
- **Your website** (Jekyll, React, etc.) → Stays **wherever it's already hosted** (GitHub Pages, Netlify, your server, etc.)
- **The form** → You copy some files (CSS/JS/HTML) to your existing website
- **They communicate** → Your form sends requests to the API you just deployed

**You do NOT need to:**
- Move your website to a new server
- Install anything on your website's server
- Run any backend code on your website's server

**You DO need to:**
- Deploy the API to Vercel (separate from your website)
- Copy form files to your website
- Point the form to your Vercel API URL

## Features

- ✅ **Email validation** and duplicate prevention
- ✅ **Unified contact system** with deduplication and merging
- ✅ **Resend Contacts sync** with two-way sync (optional - sync confirmed users to Resend Audience)
- ✅ **3 email template styles** (minimal/default, professional, branded)
- ✅ **Logo support** (optional logos for Professional and Branded templates; branded includes placeholder SVG by default)
- ✅ **Full customization** (colors, content, subjects, preheaders, logos)
- ✅ **Email preview system** for testing templates
- ✅ **Unsubscribe compliance** (CAN-SPAM, GDPR compliant unsubscribe links)
- ✅ **Welcome emails** via **Resend** (required - see note below)
- ✅ **Rate limiting** via Upstash Redis (optional)
- ✅ **CAPTCHA** via Cloudflare Turnstile (optional)
- ✅ **Double opt-in** email confirmation (optional, on by default)
- ✅ **Supabase storage** with contact activity tracking
- ✅ **CORS configuration**
- ✅ **Dark mode support**

**⚠️ Email Service Requirement:** This widget uses **Resend** for sending emails. The API code (`api/subscribe.js` and `api/confirm.js`) is hardcoded to use Resend. If you want to use a different email service (SendGrid, Mailgun, AWS SES, etc.), you will need to modify the API code yourself. The database schema is email-service agnostic and will work with any provider.

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│   Frontend      │     │            Vercel Functions          │
│  (Any Framework)│     │                                      │
│                 │     │  /api/subscribe                      │
│  waitlist-form  │────▶│    ├─ Rate limit check (Upstash)     │
│                 │     │    ├─ CAPTCHA verify (Turnstile)     │
└─────────────────┘     │    ├─ Contact deduplication         │
                        │    ├─ Store signup (Supabase)        │
                        │    └─ Send confirmation (Resend)     │
                        │                                      │
                        │  /api/confirm                        │
                        │    ├─ Validate token                 │
                        │    ├─ Mark confirmed (Supabase)      │
                        │    ├─ Sync to Resend Contacts ←───────── Optional
                        │    └─ Send welcome email (Resend)    │
                        │                                      │
                        │  /api/unsubscribe                    │
                        │    ├─ Validate token/email           │
                        │    ├─ Update unsubscribe status      │
                        │    ├─ Sync to Resend Contacts ←───────── Optional
                        │    └─ Log activity                   │
                        │                                      │
                        │  /api/webhooks/resend  ←───────────────── Optional
                        │    └─ Receive Resend events          │
                        │       (bounces, unsubscribes)        │
                        └──────────────────────────────────────┘
                                           │
                        ┌──────────────────┴───────────────────┐
                        │                                      │
              ┌─────────▼─────────┐              ┌─────────────▼─────────┐
              │   Database Layer  │              │   Resend Contacts     │
              │    (Supabase)     │◄────────────►│     (Optional)        │
              │                   │   Two-way    │                       │
              │  waitlist         │    sync      │  Audience for         │
              │  contacts         │              │  marketing emails     │
              │  contact_activity │              │                       │
              └───────────────────┘              └───────────────────────┘
```

## Framework Compatibility

The API (`api/` folder) is **completely framework-agnostic**: any frontend that can POST JSON will work. The `jekyll/` folder contains ready-to-use components for Jekyll, but they're easy to adapt.

| Component | Framework-specific? | To adapt |
|-----------|---------------------|----------|
| `api/*` | No: works with anything | Just deploy to Vercel |
| `api/shared/*` | No: shared utilities | Modify if customizing email service |
| `supabase/setup.sql` | No: just SQL | Run in Supabase SQL Editor |
| `assets/waitlist-form.css` | No: pure CSS | Use as-is or customize |
| `assets/waitlist-form.js` | No: vanilla JS | Use as-is or customize |
| `jekyll/_includes/waitlist-form.html` | Light Jekyll (Liquid tags) | See below |
| `jekyll/waitlist-*.html` | Light Jekyll (front matter) | See below |

### API Structure

The API is organized into shared modules for easier customization:

- `api/subscribe.js` - Main subscription endpoint
- `api/confirm.js` - Email confirmation endpoint
- `api/unsubscribe.js` - Unsubscribe endpoint
- `api/webhooks/resend.js` - Resend webhook handler (for two-way sync)
- `api/shared/config.js` - Centralized configuration (CORS, feature flags, etc.)
- `api/shared/email-service.js` - Email sending abstraction (modify here to use different email service)
- `api/shared/resend-contacts.js` - Resend Contacts API integration (for syncing to Audience)
- `api/shared/contacts.js` - Contact management utilities
- `api/shared/database.js` - Database client initialization
- `api/shared/utils.js` - Shared utility functions
- `scripts/sync-contacts-to-resend.js` - Bulk sync script for existing contacts

### Using with Other Frameworks

**Plain HTML / Vanilla JS:**
Copy the HTML from `waitlist-form.html`, and include the CSS/JS files:
- Copy `assets/waitlist-form.css` to your site
- Copy `assets/waitlist-form.js` to your site
- Add data attributes to the form container: `data-api-url`, `data-source`, `data-turnstile-site-key`
- Link the CSS and JS files in your HTML

**React / Next.js:**
Import `assets/waitlist-form.css` and adapt `assets/waitlist-form.js` to React hooks. The JavaScript logic maps directly to React patterns with `useState` for loading/message states.

**Astro:**
Nearly drop-in. Astro supports similar component includes. Swap Liquid syntax for Astro's `Astro.props`.

**Hugo:**
Move to `layouts/partials/`, replace Liquid (`{{ include.x }}`) with Go templating (`{{ .Get "x" }}`).

**Webflow / Squarespace / No-code:**
Upload `assets/waitlist-form.css` and `assets/waitlist-form.js` to your site's assets folder, then embed the HTML from `waitlist-form.html` in a custom code block. Set data attributes: `data-api-url`, `data-source`, `data-turnstile-site-key`.

## Quick Start

> **New to this project?** See the [Quick Start Guide](docs/QUICKSTART.md) for a condensed setup walkthrough.

For detailed setup instructions, continue reading:

### 1. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/setup.sql`
3. Get credentials from **Settings → API**:
   - Project URL → `SUPABASE_URL`
   - Service role key → `SUPABASE_SERVICE_KEY`

**What gets created:**
- `waitlist` table for signups
- `contacts` table for unified contact management (with unsubscribe tokens)
  - Optional `user_id` column for Supabase Auth integration (links to `auth.users` when contact creates account)
  - NULL for waitlist signups that never create accounts - this is expected and safe
- `contact_activity` table for timeline tracking (optional)
- Migration functions for existing data
- Database merge and deduplication functions (optional)
- Unsubscribe token generation function
- Indexes for performance (including `unsubscribe_token` and `user_id`)

### 2. Set Up Resend (Required)

**⚠️ IMPORTANT: Resend is Required**

The provided API code (`api/subscribe.js` and `api/confirm.js`) **requires Resend** and is hardcoded to use it. 

- ✅ **Using Resend?** Follow the steps below - everything will work out of the box.
- ❌ **Want to use a different email service?** You'll need to:
  1. Modify `api/subscribe.js` - replace all `resend.emails.send()` calls
  2. Modify `api/confirm.js` - replace all `resend.emails.send()` calls  
  3. Update environment variables to match your email service
  4. The database schema will work fine with any email service

**Setting up Resend:**

1. Create account at [resend.com](https://resend.com)
2. **Verify your domain** in **Domains** (e.g., `yourdomain.com`)
   - This is required! Emails can only be sent from verified domains
   - Follow Resend's DNS setup instructions to verify your domain
3. Create an API key → `RESEND_API_KEY`

**Important:** The `FROM_EMAIL` environment variable (set in Step 5) must use an email address from your verified domain. For example, if you verified `yourdomain.com`, you can use `hello@yourdomain.com` or `noreply@yourdomain.com`. Resend will reject emails from unverified domains.

### 2b. Set Up Resend Contacts Sync (Optional)

*Optional but recommended if you want to send marketing emails to confirmed subscribers.*

**What this does:** Syncs confirmed waitlist subscribers to a Resend Audience, enabling two-way sync of subscription preferences (bounces, unsubscribes).

**Sync is automatic once configured.** A manual migration script is available to sync existing contacts from Supabase to Resend (see "Bulk sync existing contacts" below).

| Direction | Trigger | Automatic? |
|-----------|---------|------------|
| Supabase → Resend | User confirms email | ✅ Yes |
| Supabase → Resend | User unsubscribes via your app | ✅ Yes |
| Resend → Supabase | Bounce/complaint/unsubscribe | ✅ Yes (webhook) |
| Existing contacts | One-time migration | Manual script |

**Setup:**

1. **Create a Resend Audience:**
   - Go to [Resend Audiences](https://resend.com/audiences)
   - Click "Create Audience"
   - Name it (e.g., "Waitlist Confirmed")
   - Copy the Audience ID

2. **Add environment variable:**
   ```bash
   vercel env add RESEND_AUDIENCE_ID
   # Paste your Audience ID when prompted
   ```

3. **Set up webhooks (for two-way sync):**
   - Go to [Resend Webhooks](https://resend.com/webhooks)
   - Click "Add Webhook"
   - Set endpoint URL: `https://your-api.vercel.app/api/webhooks/resend`
   - Select events: `email.bounced`, `email.complained`, `contact.unsubscribed`
   - Copy the signing secret

4. **Add webhook secret (recommended):**
   ```bash
   vercel env add RESEND_WEBHOOK_SECRET
   # Paste signing secret when prompted
   ```

5. **Redeploy:** `vercel --prod`

**How it works:**
- When a user confirms their email → Added to Resend Audience
- When a user unsubscribes via your app → Updated in Resend
- When Resend detects a bounce/complaint → Updated in Supabase
- All events logged in `contact_activity` table

**Bulk sync existing contacts:**
```bash
# Preview what would be synced
node scripts/sync-contacts-to-resend.js --dry-run

# Sync all confirmed contacts
node scripts/sync-contacts-to-resend.js
```

### 3. Set Up Upstash (Rate Limiting)

*Optional but recommended*

1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy your REST credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 4. Set Up Cloudflare Turnstile (CAPTCHA)

*Optional*

1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Add a new site
3. Get your keys:
   - Site key → goes in your Jekyll include
   - Secret key → `TURNSTILE_SECRET_KEY`

### 5. Deploy the API to Vercel

**What this does:** Deploys the `the-widget/` folder to Vercel as a serverless API. This is **separate from your website** - your website stays wherever it's hosted.

**Step-by-step:**

1. **Navigate to the widget folder:**
   ```bash
   cd the-widget
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Vercel CLI** (if you don't have it):
   ```bash
   npm install -g vercel
   ```

4. **Login to Vercel:**
   ```bash
   vercel login
   ```
   (Opens browser to authenticate)

5. **Link your project:**
   ```bash
   vercel
   ```
   - Follow the prompts:
     - Link to existing project? **No** (first time)
     - Project name? Press Enter (uses default)
     - Directory? Press Enter (uses current directory: `./`)
     - Override settings? **No**

6. **Add environment variables** (run these commands **one at a time** while in the `the-widget` folder):
   ```bash
   # Required variables
   vercel env add RESEND_API_KEY
   # Paste your Resend API key when prompted
   # Select environment: All (Development, Preview, Production)
   
   vercel env add SUPABASE_URL
   # Paste your Supabase Project URL when prompted
   # Select environment: All
   
   vercel env add SUPABASE_SERVICE_KEY
   # Paste your Supabase service_role key when prompted
   # Select environment: All
   
   vercel env add FROM_EMAIL
   # Enter: "Your Project Name <hello@yourdomain.com>"
   # Replace with your actual project name and verified Resend domain email
   # Select environment: All
   ```

7. **Configure CORS** (tell the API which domains can use it):
   ```bash
   vercel env add CORS_ALLOWED_ORIGINS
   # Enter comma-separated domains: https://yourdomain.com,https://www.yourdomain.com
   ```

8. **Deploy to production:**
   ```bash
   vercel --prod
   ```
   You'll get a URL like `https://your-waitlist-api-abc123.vercel.app` - **copy this!**

9. **Set BASE_URL** (your Jekyll site's URL for confirmation emails):
   ```bash
   vercel env add BASE_URL production
   # Enter your Jekyll site URL: https://yourdomain.com
   # Important: This is your WEBSITE URL, NOT the Vercel API URL
   # This is where users will see confirmation pages after clicking email links
   ```

**✅ Checkpoint:** Your API should be live! Visit your deployment URL - you should see "Not Found" (that's normal, the API only responds to `/api/subscribe`).

**📖 For detailed step-by-step instructions with ELI5 explanations, see [docs/QUICKSTART.md](docs/QUICKSTART.md).**

### 6. Configure CORS

Set the `CORS_ALLOWED_ORIGINS` environment variable (comma-separated list of domains):

```bash
vercel env add CORS_ALLOWED_ORIGINS
# Enter: https://yourdomain.com,https://www.yourdomain.com
```

Local development servers (`localhost:3000`, `localhost:4000`) are always allowed automatically.

### 7. Add to Your Site

The `jekyll/` folder contains ready-to-use components. Adapt as needed for your framework.

**For Jekyll:**

**📖 For detailed step-by-step instructions, see [docs/QUICKSTART.md](docs/QUICKSTART.md) - it includes ELI5-level explanations for each step.**

**Quick summary:**

1. **Copy 6 files to your Jekyll site:**
   - `jekyll/_includes/waitlist-form.html` → `_includes/` (the form component)
   - `assets/waitlist-form.css` → `assets/` (form styling)
   - `assets/waitlist-form.js` → `assets/` (form functionality)
   - `assets/waitlist-pages.css` → `assets/` (confirmation page styling)
   - `jekyll/waitlist-confirmed.html` → your site root (success page)
   - `jekyll/waitlist-error.html` → your site root (error page)

2. **Add the form to any page:**
   ```liquid
   {% include waitlist-form.html api_url="https://your-waitlist-api.vercel.app/api/subscribe" %}
   ```
   Replace `your-waitlist-api.vercel.app` with your actual Vercel API URL.

3. **Load CSS/JS in your layout file** (`_layouts/default.html`):
   ```html
   <link rel="stylesheet" href="{{ '/assets/waitlist-form.css' | relative_url }}">
   <link rel="stylesheet" href="{{ '/assets/waitlist-pages.css' | relative_url }}">
   <script src="{{ '/assets/waitlist-form.js' | relative_url }}"></script>
   ```

**Advanced options:**

   **With source tracking:**
   ```liquid
   {% include waitlist-form.html api_url="https://your-api.vercel.app/api/subscribe" source="homepage" %}
   ```

   **With CAPTCHA:**
   ```liquid
   {% include waitlist-form.html api_url="https://your-api.vercel.app/api/subscribe" turnstile_site_key="0x4AAAAAAA..." %}
   ```

   **All options:**
   ```liquid
   {% include waitlist-form.html api_url="https://your-api.vercel.app/api/subscribe" source="landing" turnstile_site_key="0x4AAAAAAA..." %}
   ```

**For other frameworks:**

See the "Framework Compatibility" section above for adaptation instructions.

### Why Jekyll as the Reference?

The `jekyll/` folder exists because Jekyll is the lowest common denominator for static sites:

- **No build step required**: The components are just HTML, CSS, and vanilla JS. There's no JSX to transpile, no bundler to configure.
- **Easy to copy-paste**: If you can read the Jekyll version, you can adapt it to anything. React developers know how to convert vanilla JS to hooks; the reverse is harder.
- **Static site = needs external API**: Jekyll can't run server-side code, which is exactly why this Vercel-based architecture exists. If you're using Next.js, you might just put the API route in your own app.
- **Common for landing pages**: Many indie projects use Jekyll (or Hugo, or plain HTML) for marketing sites while building the actual product in something else.

The Jekyll-specific bits are minimal: just Liquid's `{{ include.param }}` syntax and the YAML front matter on the confirmation pages. The CSS and JavaScript in `assets/` are framework-agnostic and can be used with any static site generator or framework.

---

## Security Features

### Rate Limiting

When Upstash is configured, each IP address is limited to **5 signups per hour**. This prevents:
- Spam attacks
- Email list bombing
- Resource exhaustion

The limit can be adjusted in `api/subscribe.js`:
```js
limiter: Ratelimit.slidingWindow(5, '1 h'), // Change as needed
```

### CAPTCHA (Cloudflare Turnstile)

When enabled, users must complete a CAPTCHA challenge before submitting. Turnstile is:
- Privacy-friendly (no tracking)
- Usually invisible (smart challenge)
- Free for any volume

### Double Opt-in

Enabled by default. The flow is:

1. User submits email → receives confirmation email
2. User clicks confirmation link → marked as confirmed, receives welcome email

Benefits:
- Prevents fake signups
- Confirms email ownership
- Reduces spam complaints
- Required for GDPR compliance in some cases

To disable, set `DOUBLE_OPTIN=false` in your environment.

---

## API Reference

### POST /api/subscribe

**Request:**
```json
{
  "email": "user@example.com",
  "source": "homepage",
  "turnstileToken": "..." // Only if CAPTCHA enabled
}
```

**Responses:**

| Status | Body | Meaning |
|--------|------|---------|
| 200 | `{ success: true, requiresConfirmation: true }` | Signup saved, confirmation email sent |
| 200 | `{ success: true }` | Signup confirmed (if double opt-in disabled) |
| 409 | `{ error: "already_subscribed" }` | Email already on waitlist |
| 429 | `{ error: "rate_limited" }` | Too many requests from this IP |
| 400 | `{ error: "captcha_required" }` | CAPTCHA token missing |
| 400 | `{ error: "captcha_failed" }` | CAPTCHA verification failed |

### GET /api/confirm?token=xxx

Handles email confirmation clicks. Redirects to:
- `/waitlist-confirmed` on success
- `/waitlist-error?error=<code>` on failure

### GET /api/unsubscribe?token=xxx

Handles unsubscribe requests. Accepts either `token` (secure) or `email` (fallback). Redirects to:
- `/unsubscribe-success` on success
- `/unsubscribe-error?reason=<code>` on failure

### POST /api/webhooks/resend

*Optional - only if Resend Contacts sync is configured.*

Receives webhook events from Resend for two-way sync:

| Event | Action |
|-------|--------|
| `email.bounced` | Sets `email_bounced = true` in contacts |
| `email.complained` | Sets `email_unsubscribed = true` |
| `contact.unsubscribed` | Sets `email_unsubscribed = true` |
| `email.delivered/opened/clicked` | Logged to `contact_activity` |

**Response:** `200 OK` with `{ received: true }`

---

## Database Schema

The database includes a unified contacts system that links waitlist signups to Supabase Auth users (when they create accounts).

**Main tables:**

```sql
-- Waitlist signups
create table waitlist (
  id uuid primary key,
  email text unique not null,
  source text default 'website',
  created_at timestamptz default now(),
  confirmed boolean default false,
  confirmed_at timestamptz,
  confirmation_token text,
  token_expires_at timestamptz,
  metadata jsonb default '{}',
  contact_id uuid references contacts(id) on delete cascade
);

-- Unified contacts (single source of truth for email identity)
create table contacts (
  id uuid primary key,
  email text unique not null,
  email_normalized text unique not null,
  user_id uuid references auth.users(id) on delete set null, -- Optional: links to Supabase Auth
  -- ... email preferences, unsubscribe tokens, etc.
);
```

**Supabase Auth Integration:**
- The `contacts.user_id` column optionally links contacts to Supabase Auth users
- When a waitlist signup creates an account, you can link them: `UPDATE contacts SET user_id = auth_user_id WHERE email = user_email`
- NULL for waitlist signups that never create accounts - this is expected and safe
- Enables cross-system queries: "All waitlist signups who became app users"

### Stats View

```sql
select * from waitlist_stats;
```

Returns:
```json
{
  "confirmed_signups": 89,
  "pending_signups": 12,
  "total_signups": 101,
  "confirmed_last_24h": 5,
  "confirmed_last_7d": 23,
  "unique_sources": 3
}
```

---

## Customization

### Using a Different Email Service

The API is organized with shared modules, making it simple to customize.

**To use SendGrid, Mailgun, AWS SES, or another email service:**

1. Modify `api/shared/email-service.js`:
   - Replace the `sendConfirmationEmail()` function
   - Replace the `sendWelcomeEmail()` function
   - Update initialization to use your email service's SDK

2. Update `api/shared/config.js`:
   - Add your email service's API key to `EMAIL_CONFIG`
   - Update `fromEmail` if needed

3. Update `package.json`:
   - Remove `resend` dependency
   - Add your email service's SDK

**That's it!** The rest of the code will continue to work. The database schema is email-service agnostic.

### Email Templates

**Quick Template Selection** (Recommended):
```bash
# In your .env file, choose one of:
EMAIL_TEMPLATE_STYLE=minimal      # Simple, clean design (default)
EMAIL_TEMPLATE_STYLE=professional # Elegant serif, formal
EMAIL_TEMPLATE_STYLE=branded      # Custom brand colors
# Note: 'default' is an alias for 'minimal' (backward compatibility)
```

**Template Examples:**

<p align="center">
  <img src="_example_emails_public/example_confirmation.png" alt="Email Template Examples - Confirmation" width="600"/>
  <br/>
  <em>Confirmation email templates (minimal, professional, branded)</em>
</p>

<p align="center">
  <img src="_example_emails_public/example_welcome.png" alt="Email Template Examples - Welcome" width="600"/>
  <br/>
  <em>Welcome email templates (minimal, professional, branded)</em>
</p>

**Template Files**:
- **Configuration**: Environment variables or `the-widget/templates/config.js`
- **Default templates** (minimal style): `the-widget/templates/`
- **Style variations**: `the-widget/templates/examples/`
- **Complete guide**: `the-widget/templates/TEMPLATE_README.md`

**Quick customization via environment variables:**
```bash
EMAIL_TEMPLATE_STYLE=minimal          # or professional, branded
EMAIL_PROJECT_NAME=Your Project
EMAIL_SENDER_NAME=The Team
EMAIL_PRIMARY_COLOR=#4f46e5
EMAIL_LOGO_URL=https://yourdomain.com/logo.png
```

**Or edit `templates/config.js`** for detailed message customization.

**Preview Templates**:
```bash
npm run generate-email-previews
open example_emails/index.html
```

**For detailed instructions**, see the [Template Editing Guide](the-widget/templates/TEMPLATE_README.md).

### Unsubscribe Compliance

**⚖️ Legal Compliance**: All welcome emails include unsubscribe links to comply with CAN-SPAM Act and GDPR requirements.

**How it works:**
1. **Secure tokens**: Each contact gets a unique unsubscribe token for secure unsubscribe links
2. **One-click unsubscribe**: Users can unsubscribe via `/api/unsubscribe?token=...` or `/api/unsubscribe?email=...`
3. **Activity tracking**: Unsubscribe events are logged in the contact activity timeline
4. **Success/error pages**: Users see appropriate feedback after unsubscribe attempts

**Customization:**
```javascript
// In the-widget/templates/config.js
unsubscribeText: "Unsubscribe from these emails",
unsubscribeFooter: "You're receiving this email because you're subscribed to our emails. You can unsubscribe at any time.",
```

**Note:** The default unsubscribe message is generic and works seamlessly with both waitlist and future CRM features (newsletters, product updates, etc.).

**Database fields:**
- `contacts.email_unsubscribed` - Boolean flag
- `contacts.email_unsubscribed_at` - Timestamp
- `contacts.unsubscribe_token` - Secure token for unsubscribe links

**Redirect pages** (on your Jekyll site):
- `/unsubscribe-success` - Confirmation page (configurable via `UNSUBSCRIBE_SUCCESS_URL`)
- `/unsubscribe-error` - Error handling page (configurable via `UNSUBSCRIBE_ERROR_URL`)

**Style variations** are available in `the-widget/templates/examples/`:
- Professional (elegant serif, formal business style)
- Branded (colorful with header/footer sections)
- Note: Minimal style is now the default (root templates)

Templates use a simple `{{variable}}` system.

### Styling

The form uses scoped CSS classes (`.waitlist-form__*`) defined in `assets/waitlist-form.css`. You can:
- Override styles in your Jekyll theme's CSS
- Edit `assets/waitlist-form.css` directly to customize
- Use CSS variables or custom classes to theme the widget

### Rate Limits

Adjust in `api/subscribe.js`:
```js
limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 per hour
limiter: Ratelimit.slidingWindow(3, '10 m'), // 3 per 10 minutes
```

### Confirmation Pages

Edit `waitlist-confirmed.html` and `waitlist-error.html` to match your site's design.

---

## Local Development

```bash
cd the-widget
npm install

# Create .env.local with your credentials
cp env.example .env.local

# Run locally
npm run start:dev
```

API available at `http://localhost:3000/api/subscribe`.

**Test the form locally:**
- Open `http://localhost:3000/` in your browser (testing hub)
- Or directly: `http://localhost:3000/local-test/test-form.html`
- This test page allows you to test the waitlist form without setting up a Jekyll site
- Make sure `npm run start:dev` is running before testing
- See `the-widget/local-test/README.md` for detailed testing instructions

---

## Cost Estimate

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Vercel | 100GB bandwidth | More than enough |
| Supabase | 500MB database | Millions of emails |
| Resend | 3,000 emails/mo | Then $20/mo for 50k |
| Upstash | 10k requests/day | Then $0.20/100k |
| Turnstile | Unlimited | Always free |

**Total: $0/month** for most indie projects.

---

## Database Merging (Advanced)

If you need to merge multiple databases or import external contact data:

1. **Backup everything first** - Export all databases before merging
2. **Import data** - Use pg_dump/restore or manual import to combine databases  
3. **Analyze duplicates**: `SELECT * FROM public.analyze_duplicate_contacts();`
4. **Merge duplicates**: `SELECT * FROM public.merge_duplicate_contacts();`

See [docs/DATABASE_MERGE_GUIDE.md](docs/DATABASE_MERGE_GUIDE.md) for detailed instructions.

---

## Troubleshooting

For common issues and solutions, see the [FAQ](docs/FAQ.md) section.

**Quick fixes:**
- **CORS errors:** Add your domain to `CORS_ALLOWED_ORIGINS` environment variable and redeploy
- **Emails not sending:** Verify domain in Resend, check `FROM_EMAIL` matches
- **Rate limiting not working:** Check Upstash credentials are set correctly
- **CAPTCHA always fails:** Ensure site key (frontend) and secret key (backend) are from the same Turnstile widget
- **Confirmation links broken:** Check `BASE_URL` is set to your Vercel deployment URL

**For more help:** See [docs/FAQ.md](docs/FAQ.md) for detailed troubleshooting and common questions.

---

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/sturdy-barnacle/emberwisp-waitlist/issues) with:
- A clear description of the problem or feature
- Steps to reproduce (for bugs)
- Your environment details (Node version, framework, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add comments for complex logic
- Update documentation if needed
- Test your changes before submitting

### Areas for Contribution

- Additional framework integrations
- UI/UX improvements
- Performance optimizations
- Documentation improvements
- Bug fixes

---

## Contact

- Website: [emberwisp.xyz](https://emberwisp.xyz)
- Email: [k@emberwisp.xyz](mailto:k@emberwisp.xyz)
- GitHub: [@sturdy-barnacle](https://github.com/sturdy-barnacle)

---

## License

MIT
