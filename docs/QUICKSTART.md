# Quick Start Guide

Get your waitlist widget up and running in minutes. **Perfect for beginners!** 🚀


## What You'll Need

**Required (free accounts):**
- ✅ Node.js installed ([download here](https://nodejs.org/) if you don't have it)
- ✅ [Supabase](https://supabase.com) account (free tier is fine)
- ✅ [Resend](https://resend.com) account (free tier: 3,000 emails/month)
- ✅ [Vercel](https://vercel.com) account (free tier is fine)

**Optional (add later if needed):**
- ⚙️ [Upstash](https://upstash.com) account for rate limiting (free tier: 10k requests/day)
- ⚙️ [Cloudflare](https://cloudflare.com) account for CAPTCHA (always free)

**Time needed:** 30 minutes to 1 hour (mostly waiting for domain verification)

## Step 1: Database Setup (Supabase)

**What this does:** Creates tables to store waitlist signups and contact information.

1. **Create account:** Go to [supabase.com](https://supabase.com) and sign up (free)
2. **Create a new project:**
   - Click "New Project"
   - Choose a name (e.g., "My Waitlist")
   - Set a database password (save this somewhere!)
   - Choose a region close to you
   - Wait 2-3 minutes for project to be created

3. **Run the database migration:**
   - In your Supabase dashboard, click **SQL Editor** (left sidebar)
   - Click **New Query**
   - Open `the-widget/supabase/setup.sql` from this repo
   - Copy all the SQL code and paste it into the editor
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - You should see "Success. No rows returned"

4. **Get your API credentials:**
   - Go to **Settings** → **API** (left sidebar)
   - Find **Project URL** → copy this (you'll need it as `SUPABASE_URL`)
   - Find **service_role key** (under "Project API keys") → copy this (you'll need it as `SUPABASE_SERVICE_KEY`)
     - ⚠️ **Important:** Use the `service_role` key, NOT the `anon` key!

**✅ Checkpoint:** You should have two values saved: a URL and a long key starting with `eyJ...`

**💡 Optional: Supabase Auth Integration**
The database includes a `user_id` column in the `contacts` table that's ready to link waitlist signups to Supabase Auth users (when they create accounts). No setup needed - it's automatically created and works out of the box. The column will be `NULL` for waitlist signups that never create accounts, which is expected and safe. See [../README.md](../README.md) for integration details.

## Step 2: Email Setup (Resend) - Required

**What this does:** Sets up email sending so users can receive confirmation and welcome emails.

1. **Create account:** Go to [resend.com](https://resend.com) and sign up (free tier: 3,000 emails/month)
2. **Verify your domain:**
   - Go to **Domains** in the Resend dashboard
   - Click **Add Domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Follow the DNS setup instructions to verify your domain
   - **This is required!** Emails can only be sent from verified domains
3. **Create an API key:**
   - Go to **API Keys**
   - Click **Create API Key**
   - Give it a name (e.g., "Waitlist Widget")
   - Copy the key (starts with `re_`) - you'll need this as `RESEND_API_KEY`

**✅ Checkpoint:** You should have an API key starting with `re_`

**⚠️ Important:** The `FROM_EMAIL` you'll set later must use an email address from your verified domain. For example, if you verified `yourdomain.com`, you can use `hello@yourdomain.com` or `noreply@yourdomain.com`.

## Step 3: Deploy the API to Vercel

**What this does:** Deploys the waitlist API to Vercel so your website can send signup requests to it. This is a **separate deployment** from your Jekyll site - your Jekyll site stays wherever it is.

**Important:** You're deploying the `the-widget/` folder to Vercel. This creates a serverless API that your Jekyll site will talk to.

---

#### Step 3.1: Navigate to the Widget Folder

**What this means:** You need to go into the `the-widget` folder where the API code lives.

**How to do it:**
1. Open your terminal
2. Navigate to the repository folder (where you downloaded/cloned this project)
3. Go into the `the-widget` folder:
   ```bash
   cd the-widget
   ```

**How to verify:** Type `ls` and you should see:
- `api/` folder
- `package.json`
- `vercel.json`
- `env.example` file
- Other files

---

#### Step 3.2: Install Dependencies

**What this means:** Install the packages the API needs to run.

**How to do it:**
```bash
npm install
```

**What this does:** Downloads all the required packages (like Resend, Supabase client, etc.)

**Wait for it to finish** - you'll see a lot of output. When it's done, you should see something like "added 307 packages".

---

#### Step 3.3: Create Your Environment File

**What this means:** Create a local copy of the environment file, fill in your values, then upload it to Vercel.

**How to do it:**
1. **Copy the example file:**
```bash
   cp env.example .env.local
   ```

2. **Open `.env.local` in a text editor** (like VS Code, Notepad, or TextEdit)

3. **Fill in your REQUIRED values** (replace the placeholder text):
   - `SUPABASE_URL` → Paste your Supabase Project URL (from Step 1)
   - `SUPABASE_SERVICE_KEY` → Paste your Supabase service_role key (from Step 1)
   - `RESEND_API_KEY` → Paste your Resend API key (from Step 2, starts with `re_`)
   - `FROM_EMAIL` → Enter: `Your Project Name <hello@yourdomain.com>`
     - Replace "Your Project Name" with your actual project name
     - Replace `hello@yourdomain.com` with an email from your verified Resend domain
   - `BASE_URL` → Enter your website URL: `https://yourdomain.com`
     - ⚠️ **Important:** This is your WEBSITE URL, NOT the Vercel API URL
   - `API_URL` → (Optional) Enter your API domain if different from BASE_URL: `https://api.yourdomain.com`
     - Only needed if your API is on a different domain than your main website
     - If not set, defaults to `BASE_URL` (backward compatible)
     - Example: If website is `www.lucette.app` and API is `a.lucette.app`, set `API_URL=https://a.lucette.app`
   - `CORS_ALLOWED_ORIGINS` → Enter your domains: `https://yourdomain.com,https://www.yourdomain.com`
     - Separate multiple domains with commas

4. **Optional values (can leave as-is or blank):**
   - Email branding (`EMAIL_PROJECT_NAME`, `EMAIL_PRIMARY_COLOR`, `EMAIL_LOGO_URL`, `EMAIL_BRANDED_TEXT_ONLY`, etc.) - can leave as-is, has defaults
   - `REPLY_TO_EMAIL` - Optional reply-to address for emails (leave blank to use FROM_EMAIL)
     - Example: `REPLY_TO_EMAIL="Support <support@yourdomain.com>"`
     - If not set, emails will not include a reply-to header
   - SPAM compliance (`EMAIL_SENDER_ADDRESS`, `EMAIL_ADVERTISEMENT_DISCLOSURE`) - see note below
   - Optional features (`RESEND_AUDIENCE_ID`, `TURNSTILE_SECRET_KEY`, `UPSTASH_*`, etc.) - leave blank if not using
   - Redirect URLs - can leave as-is, rarely need to change

   **SPAM Compliance Note:**
   - `EMAIL_SENDER_ADDRESS` - **REQUIRED for marketing emails** (CAN-SPAM Act). Set your physical postal address (street address, P.O. Box, or private mailbox). Example: `"123 Main St, City, State 12345"`
   - `EMAIL_ADVERTISEMENT_DISCLOSURE` - Optional, only needed if you customize emails to be promotional. Default waitlist emails are transactional/relationship-based and don't need this.

   **GDPR Compliance Note:**
   - `EMAIL_PRIVACY_POLICY_URL` - **Recommended for GDPR compliance**. Set your privacy policy URL. This will:
     - Add a privacy policy link to email footers
     - Enable a consent checkbox in the waitlist form (when privacy policy URL is provided to the form include)
   - Example: `EMAIL_PRIVACY_POLICY_URL=https://yourdomain.com/privacy`

5. **Save the file**

**💡 Tip:** The `.env.local` file is automatically ignored by git (won't be committed), so it's safe to store your secrets there.

**✅ Checkpoint:** You should have a `.env.local` file with all your REQUIRED values filled in.

---

#### Step 3.4: Deploy to Vercel

**What this means:** Upload your API code to Vercel so it's live on the internet.

**Choose one method:**

**Method A: Deploy via Vercel Dashboard** ⭐ *Recommended for beginners*

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Click "Add New" → "Project"**
3. **Import your repository:**
   - If your code is on GitHub/GitLab/Bitbucket, connect your account and select the repository
   - If your code is local only, you can use Method B below
4. **Configure the project:**
   - **Root Directory:** Set to `the-widget` (important!)
   - **Framework Preset:** Leave as default or select "Other"
   - **Build Command:** Leave empty (no build needed)
   - **Output Directory:** Leave empty
5. **Add environment variables:**
   - Click "Environment Variables" (or expand the section)
   - Click "Import" (or "Add" → "Import from .env file")
   - Select your `.env.local` file from the `the-widget` folder
   - Click "Import"
   - **Review and update values** by clicking on each variable:
     - Make sure all REQUIRED variables have your actual values (not placeholders)
     - For `BASE_URL`, set environment to **Production** only (click the variable, then change environment dropdown)
     - **Optional variables:** You can delete unused variables or leave them blank - they won't cause issues
6. **Click "Deploy"**
7. **Wait for deployment to complete** (usually 1-2 minutes)
8. **Copy your deployment URL** (looks like `https://your-waitlist-api-abc123.vercel.app`)

**Method B: Deploy via CLI** *For advanced users*

1. **Install Vercel CLI** (if you don't have it):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```
   (Opens browser to authenticate)

3. **Deploy:**
```bash
vercel --prod
```

4. **After deployment, import environment variables:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click on your project
   - Go to **Settings** → **Environment Variables**
   - Click "Import" and select your `.env.local` file from `the-widget` folder
   - Review and update values by clicking on each variable (make sure REQUIRED values are filled in)
   - **Important:** For `BASE_URL`, set it to **Production** environment only

**✅ Checkpoint:** Your API should be live! Visit your deployment URL - you should see "Not Found" (that's normal, the API only responds to `/api/subscribe`).

---

#### Step 3.5: Verify Your Deployment

**What this means:** Make sure everything is set up correctly.

**How to check:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your project and click on it
3. Go to **Settings** → **Environment Variables**
4. Verify all your variables are there:
   - ✅ `RESEND_API_KEY`
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_KEY`
   - ✅ `FROM_EMAIL`
   - ✅ `BASE_URL` (should be your website URL, set to Production only)
   - ✅ `API_URL` (optional - only if API is on different domain than website)
   - ✅ `CORS_ALLOWED_ORIGINS` (should include your domains)

**If anything is missing:**
- In Vercel dashboard, click "Add" and manually add any missing variables
- Make sure to set the correct environment (Production, Development, Preview) for each variable

**✅ Checkpoint:** Your API is deployed and ready! You should have:
- A Vercel URL like `https://your-waitlist-api-abc123.vercel.app` - **copy this!**
- All environment variables set correctly
- CORS configured for your domain

**Next:** You'll use this Vercel URL in your Jekyll site's form (Step 4).

## Step 4: Add to Your Site

**What this does:** Adds the waitlist form to your website so people can sign up.

### For Jekyll Sites

**What you're doing:** You're copying files from this repository into your Jekyll site so the waitlist form can work. Think of it like adding a new feature to your website.

**Files you need to copy:** 9 files total

---

#### Step 1: Find Your Jekyll Site Folder

**What this means:** You need to open the folder where your Jekyll website lives.

**How to do it:**
1. Open your terminal (Terminal on Mac, Command Prompt or PowerShell on Windows)
2. Navigate to your Jekyll site's folder. This is the folder that contains a file called `_config.yml`
   ```bash
   cd /path/to/your/jekyll/site
   ```
   **Example:** If your site is in `~/my-blog`, you would type:
   ```bash
   cd ~/my-blog
   ```

**How to verify you're in the right place:** Type `ls` (Mac/Linux) or `dir` (Windows) and you should see `_config.yml` in the list.

---

#### Step 2: Create Folders (If They Don't Exist)

**What this means:** Jekyll needs specific folders to organize files. We're making sure these folders exist.

**How to do it:**
```bash
mkdir -p _includes assets
```

**What this does:**
- `_includes/` - This is where Jekyll looks for reusable components (like our form)
- `assets/` - This is where CSS and JavaScript files go

**Don't worry if you get no output** - that means the folders already exist, which is fine!

---

#### Step 3: Copy the Files

**What this means:** We're copying files from this repository to your Jekyll site.

**First, find where you downloaded/cloned this repository:**
- If you downloaded it, it might be in `~/Downloads/emberwisp-waitlist`
- If you cloned it, it might be in `~/projects/emberwisp-waitlist` or wherever you put it
- **Remember this path** - you'll need it for the commands below

**Replace `PATH_TO_REPO` in the commands below** with your actual path. For example:
- If it's in `~/Downloads/emberwisp-waitlist`, replace `PATH_TO_REPO` with `~/Downloads/emberwisp-waitlist`
- If it's in `~/projects/emberwisp-waitlist`, replace `PATH_TO_REPO` with `~/projects/emberwisp-waitlist`

**Copy these files one by one:**

```bash
# 1. Copy the form component (this is the actual waitlist form)
cp PATH_TO_REPO/the-widget/jekyll/_includes/waitlist-form.html _includes/

# 2. Copy the CSS file (this makes the form look nice)
cp PATH_TO_REPO/the-widget/assets/waitlist-form.css assets/

# 3. Copy the JavaScript file (this makes the form work)
cp PATH_TO_REPO/the-widget/assets/waitlist-form.js assets/

# 4. Copy the pages CSS (this styles the confirmation pages)
cp PATH_TO_REPO/the-widget/assets/waitlist-pages.css assets/

# 5. Copy the style script (automatically matches email template style)
cp PATH_TO_REPO/the-widget/assets/waitlist-style.js assets/

# 6. Copy the success page (shown after email confirmation)
cp PATH_TO_REPO/the-widget/jekyll/waitlist-confirmed.html .

# 7. Copy the error page (shown if confirmation fails)
cp PATH_TO_REPO/the-widget/jekyll/waitlist-error.html .

# 8. Copy the unsubscribe success page (shown after successful unsubscribe)
cp PATH_TO_REPO/the-widget/jekyll/unsubscribe-success.html .

# 9. Copy the unsubscribe error page (shown if unsubscribe fails)
cp PATH_TO_REPO/the-widget/jekyll/unsubscribe-error.html .
```

**Real example:** If your repo is at `~/projects/emberwisp-waitlist`, the commands would be:
```bash
cp ~/projects/emberwisp-waitlist/the-widget/jekyll/_includes/waitlist-form.html _includes/
cp ~/projects/emberwisp-waitlist/the-widget/assets/waitlist-form.css assets/
cp ~/projects/emberwisp-waitlist/the-widget/assets/waitlist-form.js assets/
cp ~/projects/emberwisp-waitlist/the-widget/assets/waitlist-pages.css assets/
cp ~/projects/emberwisp-waitlist/the-widget/assets/waitlist-style.js assets/
cp ~/projects/emberwisp-waitlist/the-widget/jekyll/waitlist-confirmed.html .
cp ~/projects/emberwisp-waitlist/the-widget/jekyll/waitlist-error.html .
cp ~/projects/emberwisp-waitlist/the-widget/jekyll/unsubscribe-success.html .
cp ~/projects/emberwisp-waitlist/the-widget/jekyll/unsubscribe-error.html .
```

**Alternative: Manual Copying**
If you prefer using your file manager (Finder on Mac, File Explorer on Windows):
1. Open the repository folder: `the-widget/jekyll/_includes/waitlist-form.html`
2. Copy it to your Jekyll site's `_includes/` folder
3. Repeat for all 9 files, putting them in the correct locations as shown above

**How to verify:** After copying, check that these files exist in your Jekyll site:
- `_includes/waitlist-form.html` ✅
- `assets/waitlist-form.css` ✅
- `assets/waitlist-form.js` ✅
- `assets/waitlist-pages.css` ✅
- `assets/waitlist-style.js` ✅
- `waitlist-confirmed.html` (in your site's root folder) ✅
- `waitlist-error.html` (in your site's root folder) ✅
- `unsubscribe-success.html` (in your site's root folder) ✅
- `unsubscribe-error.html` (in your site's root folder) ✅
- `unsubscribe-success.html` (in your site's root folder) ✅
- `unsubscribe-error.html` (in your site's root folder) ✅

**Important note about confirmation and unsubscribe pages:**
- These pages must be on **your Jekyll site**, not on the API
- When users click links in their emails, the API redirects them to these pages on your site
- The Jekyll pages use permalinks that match the default API configuration:
  - `/waitlist-confirmed/` and `/waitlist-error/` for confirmation
  - `/unsubscribe-success/` and `/unsubscribe-error/` for unsubscribe
- If you need different URLs, change the permalinks in the Jekyll files and update the corresponding environment variables in Vercel:
  - `CONFIRM_SUCCESS_URL` and `CONFIRM_ERROR_URL` for confirmation pages
  - `UNSUBSCRIBE_SUCCESS_URL` and `UNSUBSCRIBE_ERROR_URL` for unsubscribe pages

---

#### Step 4: Add the Form to a Page

**What this means:** Now you need to tell Jekyll to show the form on one of your pages.

**How to do it:**
1. Open any page where you want the waitlist form (like `index.html`, `waitlist.md`, or any other page)
2. Add this line where you want the form to appear:
   ```liquid
   {% include waitlist-form.html api_url="https://your-waitlist-api-abc123.vercel.app/api/subscribe" %}
   ```

**Important:** Replace `your-waitlist-api-abc123.vercel.app` with your actual Vercel API URL from Step 3 (when you deployed the API).

**Example:** If your API URL is `https://my-waitlist-xyz789.vercel.app`, the line would be:
```liquid
{% include waitlist-form.html api_url="https://my-waitlist-xyz789.vercel.app/api/subscribe" %}
```

**Optional: Add privacy policy (enables consent checkbox for GDPR compliance):**
```liquid
{% include waitlist-form.html api_url="https://your-api.vercel.app/api/subscribe" privacy_policy_url="https://yourdomain.com/privacy" %}
```
When you provide a `privacy_policy_url`, a consent checkbox will appear in the form requiring users to agree to your privacy policy before submitting.

**Where to put it:** You can put this line anywhere in your page's content. For example, in `index.html`:
```html
---
layout: default
title: Home
---

<h1>Welcome to My Site</h1>
<p>Sign up for our waitlist:</p>

{% include waitlist-form.html api_url="https://your-waitlist-api-abc123.vercel.app/api/subscribe" %}

<p>More content here...</p>
```

---

#### Step 5: (Optional) Match Form Style with Email Style

**What this means:** The waitlist form and pages automatically match your email template style when users are redirected from the API (e.g., after confirming their email). However, if you want the form to match your email style on pages where users first see it (before any redirect), you can add a meta tag.

**How to do it (optional):**
1. Open your site's layout file. This is usually `_layouts/default.html` (the file that wraps around all your pages)
2. Find the `<head>` section (usually near the top)
3. Add this meta tag inside the `<head>` section:

```html
<meta name="waitlist-style" content="minimal">
```

Replace `minimal` with the same value as your `EMAIL_TEMPLATE_STYLE` environment variable:
- `minimal` - Clean, modern sans-serif design (default)
- `professional` - Elegant serif design
- `branded` - Branded design with logo support

**Example of what your layout file might look like:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{ page.title }}</title>
  
  <!-- Optional: Match form style with email style -->
  <meta name="waitlist-style" content="minimal">
  
</head>
<body>
  {{ content }}
</body>
</html>
```

**Optional: Match color too**

If you want the form to also match your email's primary color on initial pages (before any redirects), add a color meta tag:

```html
<meta name="waitlist-color" content="#4f46e5">
```

Replace `#4f46e5` with your `EMAIL_PRIMARY_COLOR` value from your API environment variables.

**Note:** The CSS and JavaScript files are automatically loaded by the included files and pages - you don't need to manually add them to your layout. The meta tags are only needed if you want the form to match your email style and color on pages where users first see it.

**Why this matters:** Without the meta tags, the form will default to `minimal` style with purple color on initial pages, but will automatically match your email style and color when users are redirected from the API (e.g., after clicking confirmation links).

---

#### Step 6: Verify Everything is in Place

**Before moving on, double-check:**

✅ **Files copied:**
- `_includes/waitlist-form.html` exists
- `assets/waitlist-form.css` exists
- `assets/waitlist-form.js` exists
- `assets/waitlist-pages.css` exists
- `assets/waitlist-style.js` exists
- `waitlist-confirmed.html` exists in root
- `waitlist-error.html` exists in root
- `unsubscribe-success.html` exists in root
- `unsubscribe-error.html` exists in root

✅ **Form added to a page:**
- You added the `{% include waitlist-form.html ... %}` line to at least one page
- You replaced the API URL with your actual Vercel URL

**If all checkboxes are checked, you're ready for the next step!**

**Note:** CSS/JS files are automatically loaded by the included files and pages - no manual setup needed!

### For Other Frameworks

See the main [README.md](../README.md) for framework-specific instructions. The API works with any framework - you just need to adapt the HTML/CSS/JS files.

## Step 5: Test It! 🎉

**Time to see if everything works!**

1. **Deploy your Jekyll site** (or start local server: `bundle exec jekyll serve`)

2. **Visit your site** and find the waitlist form

3. **Submit a test signup:**
   - Enter your email address
   - Click submit
   - You should see a success message

4. **Check your email:**
   - Look for a confirmation email (check spam folder too!)
   - Click the confirmation link
   - You should be redirected to a success page

5. **Check for welcome email:**
   - After confirming, you should receive a welcome email

**✅ If all of this works, you're done!** 🎊

**❌ Having issues?** See the Troubleshooting section below.

## Optional: Resend Contacts Sync

**What it does:** Syncs confirmed subscribers to a Resend Audience for marketing emails, with two-way sync for bounces and unsubscribes.

**When to add:** If you plan to send marketing/newsletter emails to confirmed waitlist subscribers.

**Quick setup:**

1. **Create a Resend Audience:**
   - Go to [resend.com/audiences](https://resend.com/audiences)
   - Click "Create Audience"
   - Name it (e.g., "Waitlist Confirmed")
   - Copy the Audience ID

2. **Add to Vercel:**
   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Click "Add"
   - Name: `RESEND_AUDIENCE_ID`
   - Value: Paste your Audience ID
   - Environment: Select "All" (or just "Production")
   - Click "Save"

3. **Set up webhooks:**
   - Go to [resend.com/webhooks](https://resend.com/webhooks)
   - Click "Add Webhook"
   - Endpoint URL: `https://your-api.vercel.app/api/webhooks/resend` (replace with your actual Vercel URL)
   - Select events: `email.bounced`, `email.complained`, `contact.unsubscribed`
   - Copy the signing secret

4. **Add webhook secret:**
   - In Vercel dashboard → **Settings** → **Environment Variables**
   - Click "Add"
   - Name: `RESEND_WEBHOOK_SECRET`
   - Value: Paste the signing secret
   - Environment: Select "All"
   - Click "Save"

5. **Redeploy:**
   - In Vercel dashboard, go to **Deployments**
   - Click the three dots (⋯) on your latest deployment
   - Click "Redeploy"

**For detailed setup instructions**, see the main [README.md](../README.md#2b-set-up-resend-contacts-sync-optional).

## Optional: Add Rate Limiting

**What it does:** Prevents spam by limiting how many signups per IP address.

**When to add:** If you're getting spam signups or want extra protection.

1. **Create account at [upstash.com](https://upstash.com)** (free tier: 10k requests/day)
2. **Create a new Redis database:**
   - Click "Create Database"
   - Choose a name (e.g., "Waitlist Rate Limiting")
   - Select a region close to you
   - Click "Create"
3. **Get your credentials:**
   - Copy the **REST URL** → `UPSTASH_REDIS_REST_URL`
   - Copy the **REST TOKEN** → `UPSTASH_REDIS_REST_TOKEN`
4. **Add to Vercel:**
   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Click "Add" for each:
     - Name: `UPSTASH_REDIS_REST_URL`, Value: Your REST URL
     - Name: `UPSTASH_REDIS_REST_TOKEN`, Value: Your REST TOKEN
   - Environment: Select "All"
   - Click "Save" for each
5. **Redeploy:**
   - In Vercel dashboard → **Deployments** → Click three dots (⋯) → "Redeploy"

**Default limit:** 5 signups per IP per hour (you can change this in `api/shared/config.js` if needed).

## Optional: Add CAPTCHA

**What it does:** Adds a "I'm not a robot" checkbox to prevent bots.

**When to add:** If you're getting bot signups.

1. **Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)**
2. **Add a new site:**
   - Click "Add Site"
   - Enter a site name (e.g., "Waitlist Widget")
   - Choose your domain (or use "localhost" for testing)
   - Select widget mode (recommended: "Managed" for invisible CAPTCHA)
   - Click "Create"
3. **Get your keys:**
   - **Site key** → You'll add this to your website's form (see Step 4)
   - **Secret key** → Add to Vercel (see below)
4. **Add secret key to Vercel:**
   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Click "Add"
   - Name: `TURNSTILE_SECRET_KEY`
   - Value: Paste your secret key
   - Environment: Select "All"
   - Click "Save"
5. **Redeploy:**
   - In Vercel dashboard → **Deployments** → Click three dots (⋯) → "Redeploy"

**Add CAPTCHA to your form:**
In your Jekyll page, update the include:
```liquid
{% include waitlist-form.html 
   api_url="https://your-api.vercel.app/api/subscribe" 
   turnstile_site_key="0x4AAAAAAA..." %}
```

Replace `0x4AAAAAAA...` with your actual site key from Cloudflare.

## Troubleshooting

### "Not Found" when visiting API URL
**This is normal!** The API only responds to specific endpoints like `/api/subscribe`. You can't visit the root URL directly.

### Form not showing up
- Check that you added the `{% include waitlist-form.html ... %}` line to your page
- Make sure the CSS/JS files are loaded in your layout
- Check browser console (F12) for errors

### Form not submitting
- Check that your API URL is correct in the include statement
- Make sure `CORS_ALLOWED_ORIGINS` environment variable includes your domain
- Check browser console (F12) for error messages

### Emails not arriving
- Check spam folder
- Verify your domain is verified in Resend
- Make sure `FROM_EMAIL` uses an email from your verified domain
- Check Resend dashboard → Logs for delivery status

### Confirmation link doesn't work
- Make sure `waitlist-confirmed.html`, `waitlist-error.html`, `unsubscribe-success.html`, and `unsubscribe-error.html` are in your site's root folder
- Check that `BASE_URL` in Vercel matches your site's domain (and is set to Production environment)
- If your API is on a different domain than your website, set `API_URL` to your API domain (e.g., `https://a.yourdomain.com`)
- Verify the confirmation pages are deployed with your site

### Environment variables not working
- In Vercel dashboard → **Settings** → **Environment Variables**, verify all variables are set
- Make sure `BASE_URL` is set to **Production** environment only
- After adding/changing variables, redeploy your project:
  - Go to **Deployments** → Click three dots (⋯) on latest deployment → "Redeploy"

## Next Steps

Once everything is working:
- Customize the form styling by editing `assets/waitlist-form.css`
- Customize email templates (see `templates/` folder and `TEMPLATE_README.md`)
- Add rate limiting or CAPTCHA if needed
- Check out the main [README.md](../README.md) for advanced customization options
