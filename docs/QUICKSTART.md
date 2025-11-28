# Quick Start Guide

Get your waitlist widget up and running in minutes. **Perfect for beginners!** 🚀

## How This Works (Important!)

**You will need to install the API on its own server, and then use the drop-in code on your site.**

1. **The API (deployed to Vercel)** - This handles all the backend work:
   - Receives signup requests
   - Stores data in Supabase
   - Sends confirmation emails
   - Handles email confirmations
   - **This is a one-time setup** - you deploy it once to Vercel

2. **Your Jekyll Site (wherever it's hosted)** - This is your existing website:
   - Can be on GitHub Pages, Netlify, your own server, anywhere
   - You just add the form files (CSS/JS/HTML) to your existing site
   - The form on your site sends requests to the API on Vercel
   - **No changes to your hosting** - your Jekyll site stays where it is

**Think of it like this:**
- Your Jekyll site = The front door of your house (where visitors see the form)
- The Vercel API = The mailbox service (handles the signups and emails)
- They communicate over the internet, but are completely separate

**You don't need to:**
- Move your Jekyll site to a new server
- Install anything on your Jekyll site's server
- Run any code on your Jekyll site's server

**You just need to:**
- Deploy the API to Vercel (one-time, takes 5 minutes)
- Copy some files to your Jekyll site (the form, CSS, and JS)
- Point the form to your Vercel API URL

---

## What You'll Need

**Required (free accounts):**
- ✅ Node.js installed ([download here](https://nodejs.org/) if you don't have it)
- ✅ [Supabase](https://supabase.com) account (free tier is fine)
- ✅ [Resend](https://resend.com) account (free tier: 3,000 emails/month)
- ✅ [Vercel](https://vercel.com) account (free tier is fine)

**Optional (add later if needed):**
- ⚙️ [Upstash](https://upstash.com) account for rate limiting (free tier: 10k requests/day)
- ⚙️ [Cloudflare](https://cloudflare.com) account for CAPTCHA (always free)

**Time needed:** 15-30 minutes (mostly waiting for domain verification)

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

#### Step 3.3: Install Vercel CLI (If Needed)

**What this means:** Install the Vercel command-line tool so you can deploy.

**How to do it:**
```bash
npm install -g vercel
```

**Note:** If you already have Vercel CLI installed, you can skip this step. If you get an error about permissions, you might need to use `sudo` (Mac/Linux) or run as administrator (Windows).

---

#### Step 3.4: Login to Vercel

**What this means:** Connect your terminal to your Vercel account.

**How to do it:**
```bash
vercel login
```

**What happens:**
- Your browser will open
- You'll be asked to log in to Vercel (or create an account if you don't have one)
- After logging in, your terminal will be connected

**Wait for the success message** before continuing.

---

#### Step 3.5: Link Your Project to Vercel

**What this means:** Tell Vercel about this project and create a connection.

**How to do it:**
```bash
vercel
```

**Follow the prompts:**
- **Link to existing project?** → Type `N` and press Enter (this is your first time)
- **What's your project's name?** → Press Enter (uses default name, or type a custom name)
- **In which directory is your code located?** → Press Enter (uses current directory: `./`)
- **Want to override the settings?** → Type `N` and press Enter

**What this does:** Creates a `.vercel` folder in `the-widget/` that stores your project connection.

---

#### Step 3.6: Add Environment Variables

**What this means:** Tell Vercel your API keys and configuration so the API can work.

**Important:** You must run these commands **while in the `the-widget` folder**. Each command will prompt you to paste a value.

**Required variables (add these one at a time):**

```bash
# 1. Resend API Key
vercel env add RESEND_API_KEY
# When prompted, paste your Resend API key (starts with re_)
# Select environment: Press Enter for all (Development, Preview, Production)

# 2. Supabase URL
vercel env add SUPABASE_URL
# When prompted, paste your Supabase Project URL (from Step 1)
# Select environment: Press Enter for all

# 3. Supabase Service Key
vercel env add SUPABASE_SERVICE_KEY
# When prompted, paste your Supabase service_role key (from Step 1)
# Select environment: Press Enter for all

# 4. FROM_EMAIL
vercel env add FROM_EMAIL
# When prompted, enter: "Your Project Name <hello@yourdomain.com>"
# Replace with your actual project name and verified Resend domain email
# Select environment: Press Enter for all
```

**About BASE_URL:** You'll set this after deployment (see Step 3.9). For now, skip it.

**Optional variables (skip these for now, add later if needed):**
```bash
# Rate limiting (optional)
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# CAPTCHA (optional)
vercel env add TURNSTILE_SECRET_KEY

# Disable double opt-in (optional)
vercel env add DOUBLE_OPTIN
# Enter: false (if you want to skip email confirmation)
```

---

#### Step 3.7: Configure CORS

**What this means:** Tell the API which websites are allowed to use it (security feature).

**How to do it:**
1. Open `the-widget/api/shared/config.js` in a text editor
2. Find the `CORS_CONFIG` section (around line 27)
3. Replace `yourdomain.com` with your actual website domain(s):

```js
export const CORS_CONFIG = {
  allowedOrigins: [
    'https://yourdomain.com',        // ← Replace with your actual domain
    'https://www.yourdomain.com',    // ← Replace if you use www
    'http://localhost:4000',          // Keep this for local Jekyll testing
  ],
};
```

**Example:** If your site is `https://mysite.com`, it would look like:
```js
export const CORS_CONFIG = {
  allowedOrigins: [
    'https://mysite.com',
    'https://www.mysite.com',
    'http://localhost:4000',
  ],
};
```

**Save the file** after making changes.

---

#### Step 3.8: Deploy to Production

**What this means:** Upload your API code to Vercel so it's live on the internet.

**How to do it:**
```bash
vercel --prod
```

**What happens:**
- Vercel uploads your code
- It builds and deploys the API
- You'll see a URL like: `https://your-waitlist-api-abc123.vercel.app`
- **Copy this URL!** You'll need it for your Jekyll site

**✅ Checkpoint:** Your API is now live! Try visiting the URL - you should see "Not Found" (that's normal, the API only responds to `/api/subscribe`).

---

#### Step 3.9: Set BASE_URL Environment Variable

**What this means:** Tell the API what URL to use when generating confirmation email links. This should be your **Jekyll site's URL**, not the Vercel API URL.

**How to do it:**
```bash
vercel env add BASE_URL production
```

**When prompted:**
- Enter your **Jekyll site's URL** (where users will see the confirmation pages)
- Example: `https://mysite.com` or `https://www.mysite.com`
- **Important:** 
  - Use `https://` (not `http://`) for production
  - This is your **website URL**, NOT the Vercel API URL
  - This is where users will be redirected after clicking confirmation links
- Select environment: Choose `Production` (or press Enter if it's the only option)

**Why this matters:** 
- When users click confirmation links in emails, the API redirects them to your Jekyll site
- The confirmation pages (`waitlist-confirmed.html` and `waitlist-error.html`) are on your Jekyll site
- The API uses `BASE_URL` to build the confirmation link URLs in emails

**Example:**
- If your Jekyll site is at `https://mysite.com`, enter: `https://mysite.com`
- If your Jekyll site is at `https://www.mysite.com`, enter: `https://www.mysite.com`
- **Do NOT** enter your Vercel API URL here (like `https://your-api.vercel.app`)

---

#### Step 3.10: Verify Deployment

**What this means:** Make sure everything is working.

**How to check:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your project (should be named something like "waitlist-widget" or what you named it)
3. Click on it
4. Go to **Settings** → **Environment Variables**
5. Verify all your variables are there:
   - ✅ `RESEND_API_KEY`
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_KEY`
   - ✅ `FROM_EMAIL`
   - ✅ `BASE_URL` (should be your Jekyll site URL)

**If anything is missing, add it using `vercel env add VARIABLE_NAME production`**

---

**✅ Checkpoint:** Your API is deployed and ready! You should have:
- A Vercel URL like `https://your-waitlist-api-abc123.vercel.app`
- All environment variables set
- CORS configured for your domain

**Next:** You'll use this Vercel URL in your Jekyll site's form (Step 4).

**✅ Checkpoint:** Your API should be live! Try visiting your deployment URL - you should see "Not Found" (that's normal, the API only responds to `/api/subscribe`).

## Step 4: Add to Your Site

**What this does:** Adds the waitlist form to your website so people can sign up.

### For Jekyll Sites

**What you're doing:** You're copying files from this repository into your Jekyll site so the waitlist form can work. Think of it like adding a new feature to your website.

**Files you need to copy:** 6 files total

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

# 5. Copy the success page (shown after email confirmation)
cp PATH_TO_REPO/the-widget/jekyll/waitlist-confirmed.html .

# 6. Copy the error page (shown if confirmation fails)
cp PATH_TO_REPO/the-widget/jekyll/waitlist-error.html .
```

**Real example:** If your repo is at `~/projects/emberwisp-waitlist`, the commands would be:
```bash
cp ~/projects/emberwisp-waitlist/the-widget/jekyll/_includes/waitlist-form.html _includes/
cp ~/projects/emberwisp-waitlist/the-widget/assets/waitlist-form.css assets/
cp ~/projects/emberwisp-waitlist/the-widget/assets/waitlist-form.js assets/
cp ~/projects/emberwisp-waitlist/the-widget/assets/waitlist-pages.css assets/
cp ~/projects/emberwisp-waitlist/the-widget/jekyll/waitlist-confirmed.html .
cp ~/projects/emberwisp-waitlist/the-widget/jekyll/waitlist-error.html .
```

**Alternative: Manual Copying**
If you prefer using your file manager (Finder on Mac, File Explorer on Windows):
1. Open the repository folder: `the-widget/jekyll/_includes/waitlist-form.html`
2. Copy it to your Jekyll site's `_includes/` folder
3. Repeat for all 6 files, putting them in the correct locations as shown above

**How to verify:** After copying, check that these files exist in your Jekyll site:
- `_includes/waitlist-form.html` ✅
- `assets/waitlist-form.css` ✅
- `assets/waitlist-form.js` ✅
- `assets/waitlist-pages.css` ✅
- `waitlist-confirmed.html` (in your site's root folder) ✅
- `waitlist-error.html` (in your site's root folder) ✅

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

#### Step 5: Load the CSS and JavaScript

**What this means:** Your site needs to load the CSS (styling) and JavaScript (functionality) files for the form to work and look good.

**How to do it:**
1. Open your site's layout file. This is usually `_layouts/default.html` (the file that wraps around all your pages)
2. Find the `<head>` section (usually near the top)
3. Add these three lines inside the `<head>` section, before the closing `</head>` tag:

```html
<link rel="stylesheet" href="{{ '/assets/waitlist-form.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/waitlist-pages.css' | relative_url }}">
<script src="{{ '/assets/waitlist-form.js' | relative_url }}"></script>
```

**Example of what your layout file might look like:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{ page.title }}</title>
  
  <!-- Add these three lines here: -->
  <link rel="stylesheet" href="{{ '/assets/waitlist-form.css' | relative_url }}">
  <link rel="stylesheet" href="{{ '/assets/waitlist-pages.css' | relative_url }}">
  <script src="{{ '/assets/waitlist-form.js' | relative_url }}"></script>
  
</head>
<body>
  {{ content }}
</body>
</html>
```

**Why this matters:** Without these lines, the form won't have styling (will look broken) and won't work (won't submit emails).

---

#### Step 6: Verify Everything is in Place

**Before moving on, double-check:**

✅ **Files copied:**
- `_includes/waitlist-form.html` exists
- `assets/waitlist-form.css` exists
- `assets/waitlist-form.js` exists
- `assets/waitlist-pages.css` exists
- `waitlist-confirmed.html` exists in root
- `waitlist-error.html` exists in root

✅ **Form added to a page:**
- You added the `{% include waitlist-form.html ... %}` line to at least one page
- You replaced the API URL with your actual Vercel URL

✅ **CSS/JS loaded:**
- You added the three `<link>` and `<script>` lines to your layout file

**If all checkboxes are checked, you're ready for the next step!**

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

## Optional: Add Rate Limiting

**What it does:** Prevents spam by limiting how many signups per IP address.

**When to add:** If you're getting spam signups or want extra protection.

1. Create account at [upstash.com](https://upstash.com) (free tier: 10k requests/day)
2. Create a new Redis database
3. Copy the REST URL and REST Token
4. Add to Vercel:
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL production
   vercel env add UPSTASH_REDIS_REST_TOKEN production
   ```
5. Redeploy: `vercel --prod`

**Default limit:** 5 signups per IP per hour (you can change this in `api/shared/config.js` - edit `RATE_LIMIT_CONFIG`)

## Optional: Add CAPTCHA

**What it does:** Adds a "I'm not a robot" checkbox to prevent bots.

**When to add:** If you're getting bot signups.

1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Add a new site
3. Get your keys:
   - **Site key** → goes in your Jekyll include (see below)
   - **Secret key** → add to Vercel: `vercel env add TURNSTILE_SECRET_KEY`
4. Redeploy: `vercel --prod`

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
- Make sure CORS is configured for your domain in `api/shared/config.js`
- Check browser console (F12) for error messages

### Emails not arriving
- Check spam folder
- Verify your domain is verified in Resend
- Make sure `FROM_EMAIL` uses an email from your verified domain
- Check Resend dashboard → Logs for delivery status

### Confirmation link doesn't work
- Make sure `waitlist-confirmed.html` and `waitlist-error.html` are in your site's root folder
- Check that `BASE_URL` in Vercel matches your site's domain
- Verify the confirmation pages are deployed with your site

## Next Steps

Once everything is working:
- Customize the form styling by editing `assets/waitlist-form.css`
- Customize email templates (see `templates/` folder and `TEMPLATE_README.md`)
- Add rate limiting or CAPTCHA if needed
- Check out the main [README.md](../README.md) for advanced customization options
