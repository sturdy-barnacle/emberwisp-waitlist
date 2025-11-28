# Local Testing Guide

This folder contains resources and instructions for testing the waitlist widget locally.

## Quick Start

1. **Start the dev server:**
   ```bash
   cd the-widget
   npm run start:dev
   ```

2. **Open the testing hub:**
   - Navigate to `http://localhost:3000/` (testing hub with links to all test pages)

3. **Test the flow:**
   - Submit an email address
   - Check your inbox for a confirmation email
   - Click the confirmation link
   - You should be redirected to `/test-waitlist-confirmed`
   - Check for a welcome email

## Test Pages

### Test Form
- **URL:** `http://localhost:3000/local-test/test-form.html`
- **Purpose:** Test the waitlist signup form without setting up a Jekyll site
- **Features:**
  - Basic form with default settings
  - Pre-configured to use `http://localhost:3000/api/subscribe`
  - Source tracking set to "test-page"

### Confirmation Pages
These pages are automatically used by the API when redirecting after email confirmation:

- **Success:** `http://localhost:3000/test-waitlist-confirmed`
  - Shown when email confirmation succeeds
  - Also shown if already confirmed (`?status=already_confirmed`)

- **Error:** `http://localhost:3000/test-waitlist-error`
  - Shown when confirmation fails
  - Error types:
    - `?error=missing_token` - Link incomplete
    - `?error=invalid_token` - Invalid or already used
    - `?error=expired_token` - Link expired (24 hours)
    - `?error=update_failed` - Database update failed
    - `?error=server_error` - Server error

### Unsubscribe Pages
These pages are used when users click unsubscribe links in emails:

- **Success:** `http://localhost:3000/test-unsubscribe-success`
  - Shown when unsubscribe succeeds

- **Error:** `http://localhost:3000/test-unsubscribe-error`
  - Shown when unsubscribe fails
  - Error types:
    - `?reason=missing-params` - Link incomplete
    - `?reason=database-error` - Database update failed
    - `?reason=server-error` - Server error

**Note:** These pages use the `test-` prefix for local testing. The URLs are configured via environment variables in `.env.local`:
- `CONFIRM_SUCCESS_URL` / `CONFIRM_ERROR_URL` for confirmation pages
- `UNSUBSCRIBE_SUCCESS_URL` / `UNSUBSCRIBE_ERROR_URL` for unsubscribe pages

## Environment Setup

Make sure your `.env.local` file has the correct values for local testing:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
RESEND_API_KEY=re_your-api-key
FROM_EMAIL=Your Project <hello@yourdomain.com>

# Important: Use http:// for localhost (not https://)
BASE_URL=http://localhost:3000

# Local testing: Use test- prefixed pages
CONFIRM_SUCCESS_URL=/test-waitlist-confirmed
CONFIRM_ERROR_URL=/test-waitlist-error
UNSUBSCRIBE_SUCCESS_URL=/test-unsubscribe-success
UNSUBSCRIBE_ERROR_URL=/test-unsubscribe-error
```

**Note:** The `BASE_URL` must use `http://` (not `https://`) for local testing, as localhost doesn't have SSL.

## Testing Checklist

- [ ] Dev server is running (`npm run start:dev`)
- [ ] Environment variables are set in `.env.local`
- [ ] `BASE_URL` is set to `http://localhost:3000`
- [ ] Test form loads at `http://localhost:3000/local-test/test-form.html`
- [ ] Can submit email successfully
- [ ] Confirmation email arrives
- [ ] Confirmation link works (redirects to `/test-waitlist-confirmed`)
- [ ] Welcome email arrives after confirmation
- [ ] Confirmation error pages work (try an expired/invalid token)
- [ ] Unsubscribe link in welcome email works (redirects to `/test-unsubscribe-success`)

## Troubleshooting

### "supabaseUrl is required" error
- Make sure `.env.local` has `SUPABASE_URL` set
- Restart the dev server after changing `.env.local`

### Confirmation link uses `https://localhost:3000`
- Check that `BASE_URL=http://localhost:3000` in `.env.local`
- Restart the dev server
- Submit a new signup to get a new email

### 404 on `/test-waitlist-confirmed` or `/test-waitlist-error`
- These pages are served via API routes (`api/test-waitlist-confirmed.js` and `api/test-waitlist-error.js`)
- Check that `vercel.json` has the rewrites configured
- Check that `.env.local` has `CONFIRM_SUCCESS_URL=/test-waitlist-confirmed` and `CONFIRM_ERROR_URL=/test-waitlist-error`
- Restart the dev server

### CORS errors
- Add `http://localhost:3000` to `CORS_CONFIG.allowedOrigins` in `api/shared/config.js`
- Restart the dev server

## API Endpoints

When testing, these endpoints are available:

- `POST /api/subscribe` - Sign up for waitlist
- `GET /api/confirm?token=...` - Confirm email (redirects to success/error pages)
- `GET /api/unsubscribe?token=...` - Unsubscribe from emails

## Next Steps

Once local testing works, you're ready to use the widget on your site:

### If You Haven't Deployed the API Yet

1. **Deploy the API to Vercel:**
   ```bash
   cd the-widget
   vercel --prod
   ```
   You'll get a URL like `https://your-waitlist-api-abc123.vercel.app`

2. **Set environment variables in Vercel dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add all variables from `.env.local` (use your production domain for `BASE_URL`)
   - Update CORS settings in `api/shared/config.js` with your production domain

3. **Add the widget to your site:**
   - Copy the form files (`assets/`, `jekyll/_includes/`) to your site
   - Point the form to your deployed API URL
   - See the main [README.md](../../README.md) or [docs/QUICKSTART.md](../../docs/QUICKSTART.md) for integration instructions

### If You Already Have the API Deployed

1. **Verify your API URL** is correct in your site's form
2. **Add confirmation pages** to your site (copy from `jekyll/waitlist-confirmed.html` and `jekyll/waitlist-error.html`)
3. **Update `BASE_URL`** in Vercel to match your site's domain (for confirmation email links)
4. **Test on your live site** to ensure everything works

**Note:** The confirmation pages (`waitlist-confirmed.html`, `waitlist-error.html`) should be on your site, not the API. The API redirects to these pages after email confirmation.

