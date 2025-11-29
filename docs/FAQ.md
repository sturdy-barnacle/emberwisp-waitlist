# Frequently Asked Questions (FAQ)

A list of what I suspect will be common questions about the emberwisp waitlist widget.

## Setup & Configuration

### Do I need to manually create SPF, DKIM, DMARC, or MX records?

**No!** Resend handles this automatically.

When you add a domain in Resend:
1. Resend generates all the DNS records you need (SPF, DKIM, DMARC)
2. Resend shows you exactly what to add in their dashboard
3. You copy those records and add them to your domain registrar
4. Resend verifies them automatically

**What records does Resend provide?**
- **SPF** (TXT record) - Authorizes Resend to send emails
- **DKIM** (TXT record) - Signs emails for authentication  
- **DMARC** (TXT record) - Optional but recommended for better deliverability

**What you DON'T need:**
- **MX records** - Not required (Resend is for sending only, not receiving)

**How long does verification take?**
- Usually 5-15 minutes after adding DNS records
- Can take up to 24 hours in rare cases
- Resend dashboard will show "Verified" when ready

### Can I use a different email service instead of Resend?

**Yes, but you'll need to customize the code.**

The API code uses Resend, but you can modify it to use SendGrid, Mailgun, AWS SES, or any other email service.

**What to modify:**
1. **`api/shared/email-service.js`** - Replace the `sendConfirmationEmail()` and `sendWelcomeEmail()` functions
2. **`api/shared/config.js`** - Update `EMAIL_CONFIG` with your service's settings
3. **`package.json`** - Remove `resend`, add your email service's SDK

**The database schema works with any email service** - no changes needed there.

See `api/shared/README.md` for detailed customization examples.

### Where do I configure CORS allowed origins?

Set the `CORS_ALLOWED_ORIGINS` environment variable (comma-separated list):

```bash
vercel env add CORS_ALLOWED_ORIGINS
# Enter: https://yourdomain.com,https://www.yourdomain.com
```

Then redeploy: `vercel --prod`

Local development servers (`localhost:3000`, `localhost:4000`) are always allowed automatically.

### What does CORS stand for?

**CORS** stands for **Cross-Origin Resource Sharing**.

It's a browser security feature that controls which websites can make requests to your API. When your Jekyll site (on `yourdomain.com`) tries to send a form submission to your API (on `your-api.vercel.app`), the browser checks if the API allows requests from `yourdomain.com`.

**Why it matters:**
- Without CORS configuration, browsers will block requests from your site to the API
- You need to explicitly allow your domain in the API's CORS settings
- This prevents malicious websites from using your API

**In simple terms:** CORS is like a bouncer at a club. It checks if your website is on the "allowed list" before letting it talk to the API.

### How do I change the rate limit?

Edit `the-widget/api/shared/config.js`:

```js
export const RATE_LIMIT_CONFIG = {
  // Change these values:
  limit: 10,        // Number of requests
  window: '1 h',    // Time window ('1 h', '10 m', etc.)
};
```

Default is 5 signups per IP per hour.

## Troubleshooting

### "CORS error" in browser console

**Fix:** Add your domain to the `CORS_ALLOWED_ORIGINS` environment variable:
```bash
vercel env add CORS_ALLOWED_ORIGINS
# Enter: https://yourdomain.com,https://www.yourdomain.com
vercel --prod
```

### Emails not arriving

**Check in this order:**
1. **Spam folder** - Very common! Check spam/junk folder first
2. **Resend dashboard → Logs** - See if emails are being sent successfully
3. **Domain verification** - Should show green "Verified" checkmark in Resend
4. **FROM_EMAIL format** - Must match your verified domain (e.g., `hello@yourdomain.com`)
5. **DNS propagation** - If you just added DNS records, wait 5-15 minutes

### Confirmation links show "Not Found" or don't work

**Fix:** 

1. Make sure `BASE_URL` in Vercel matches your website URL (where confirmation pages live):

```bash
vercel env ls
# Check BASE_URL value
vercel env add BASE_URL production
# Enter: https://yourwebsite.com
```

2. If your API is on a different domain than your website, also set `API_URL`:

```bash
vercel env add API_URL production
# Enter: https://api.yourdomain.com (or your API domain)
```

**Example:** If your website is `www.lucette.app` and API is `a.lucette.app`:
- `BASE_URL=https://www.lucette.app` (for redirects to confirmation pages)
- `API_URL=https://a.lucette.app` (for API endpoint links in emails)

Then redeploy: `vercel --prod`

### Form submits but nothing happens

**Check:**
1. **Browser console** (F12 → Console tab) - Look for JavaScript errors
2. **Network tab** (F12 → Network) - Is the API request being made? Check for errors
3. **API URL** - Make sure the URL in your form include is correct
4. **CORS** - Check if CORS errors appear in console

### "Already subscribed" when it's a new email

**Likely cause:** The email is already in the database.

**Fix:** 
1. Go to Supabase dashboard → Table Editor → `waitlist` table
2. Search for the email address
3. Delete the entry if found if you need to

### Rate limiting too strict / legitimate users blocked

**Fix:** Increase the rate limit in `api/shared/config.js`:

```js
export const RATE_LIMIT_CONFIG = {
  limit: 20,     // Increase from default 5
  window: '1 h',
};
```

Or disable rate limiting by removing Upstash environment variables.

### CAPTCHA always fails

**Check:**
1. Site key (frontend) and secret key (backend) are from the same Turnstile widget
2. Secret key is set in Vercel: `vercel env add TURNSTILE_SECRET_KEY production`
3. Site key is included in your form: `turnstile_site_key="0x4AAAAAAA..."`
4. Domain matches between Turnstile widget and your site

## Database & Contacts

### Can I use the database with a different email service?

**Yes!** The database schema is email-service agnostic. It will work with Resend, SendGrid, Mailgun, AWS SES, or any email service.

The `email_bounced` and `email_unsubscribed` fields can be updated via webhooks from any email service.

## Resend Contacts Sync

### What is Resend Contacts sync?

**Optional feature** that syncs confirmed waitlist subscribers to a Resend Audience. This enables:
- Sending marketing/newsletter emails to confirmed subscribers via Resend
- Two-way sync of subscription preferences (bounces, unsubscribes)
- Keeping Supabase and Resend in sync automatically

### Is the sync automatic?

**Yes, sync is automatic once configured.** A manual migration script is available to sync existing contacts from Supabase to Resend (see [README.md](../README.md#2b-set-up-resend-contacts-sync-optional)).

| Direction | Trigger | Automatic? |
|-----------|---------|------------|
| Supabase → Resend | User confirms email | ✅ Yes |
| Supabase → Resend | User unsubscribes via your app | ✅ Yes |
| Resend → Supabase | Bounce/complaint/unsubscribe | ✅ Yes (webhook) |
| Existing contacts | One-time migration | Manual script |

**Prerequisites for automatic sync:**
1. `RESEND_AUDIENCE_ID` environment variable must be set
2. Webhook must be configured in Resend dashboard (for Resend → Supabase direction)

### Do I need to set up Resend Contacts sync?

**No, it's optional.** The waitlist widget works perfectly without it. Set it up if you want to:
- Send marketing emails to confirmed subscribers
- Use Resend's broadcast/campaign features
- Have automatic bounce/unsubscribe handling

### How does two-way sync work?

**Supabase → Resend:**
- User confirms email → Added to Resend Audience
- User unsubscribes via your app → Marked unsubscribed in Resend

**Resend → Supabase (via webhooks):**
- Email bounces → `email_bounced = true` in Supabase
- Spam complaint → `email_unsubscribed = true` in Supabase
- User unsubscribes via Resend → `email_unsubscribed = true` in Supabase

### How do I set up Resend webhooks?

1. Go to [Resend Webhooks](https://resend.com/webhooks)
2. Click "Add Webhook"
3. Set endpoint URL: `https://your-api.vercel.app/api/webhooks/resend`
4. Select events: `email.bounced`, `email.complained`, `contact.unsubscribed`
5. Copy the signing secret and add to Vercel: `vercel env add RESEND_WEBHOOK_SECRET`
6. Redeploy: `vercel --prod`

### How do I sync existing contacts to Resend?

Use the bulk sync script:

```bash
# Preview what would be synced
node scripts/sync-contacts-to-resend.js --dry-run

# Sync all confirmed, non-bounced, non-unsubscribed contacts
node scripts/sync-contacts-to-resend.js
```

The script syncs contacts that are:
- `email_verified = true`
- `email_bounced = false`
- `email_unsubscribed = false`

## Customization

### How do I customize email templates?

**Easy!** Use environment variables for key branding:

```bash
EMAIL_TEMPLATE_STYLE=minimal          # or professional, branded
EMAIL_PROJECT_NAME=Your Project
EMAIL_PRIMARY_COLOR=#4f46e5
EMAIL_LOGO_URL=https://yourdomain.com/logo.png
```

For detailed message customization, edit `the-widget/templates/config.js`.

Then redeploy: `vercel --prod`

See `the-widget/templates/TEMPLATE_README.md` for detailed instructions.

### How do I protect my customized templates from being overwritten when syncing from the main repo?

**Use Git's `.gitattributes` file with the `merge=ours` strategy.**

If you've customized email templates or styles and want to keep your changes when syncing updates from the main repository, create a `.gitattributes` file in the repository root:

**1. Create `.gitattributes` file:**

```bash
# Protect entire templates folder from upstream merges
the-widget/templates/** merge=ours
```

**2. Commit the file:**

```bash
git add .gitattributes
git commit -m "Protect templates folder from upstream merges"
```

**3. Now when you sync from main:**

```bash
git fetch upstream  # or origin, depending on your setup
git merge upstream/main  # Your templates won't be overwritten!
```

**How it works:**
- `merge=ours` tells Git to always keep your local version during merges
- Upstream changes to protected files won't overwrite your local changes
- You can still see what changed upstream in the merge commit
- Works for `git merge` and `git pull` (but not for `git rebase`)

**Protect specific files only:**

If you only want to protect certain files:

```gitattributes
# Protect specific files
the-widget/templates/config.js merge=ours
the-widget/templates/confirmation-email.html merge=ours
the-widget/templates/welcome-email.html merge=ours
```

**Protect styles folder:**

```gitattributes
# Protect styles folder
the-widget/templates/styles/** merge=ours
```

**Note:** If you ever want to accept upstream changes for a protected file, you can manually do:
```bash
git checkout --theirs the-widget/templates/some-file.html
git add the-widget/templates/some-file.html
git commit -m "Accept upstream changes for some-file.html"
```

### How do I add a logo to my emails?

**Professional and Branded templates support logos:**

1. **Set your logo URL** via environment variable (recommended):
   ```bash
   EMAIL_LOGO_URL=https://yourdomain.com/logo.png
   ```
   Or in `the-widget/templates/config.js`:
   ```javascript
   logoUrl: "https://yourdomain.com/logo.png", // Recommended: 200px max width
   ```

2. **Logo behavior:**
   - **Professional templates**: Logo appears centered at the top (hidden if `logoUrl` is empty)
   - **Branded templates**: Logo appears in the header (shows gradient placeholder SVG if `logoUrl` is empty, unless `brandedHeaderTextOnly` is true)

3. **Branded template background colors:**
   - **ANY logo** (custom or placeholder): Header background is transparent
   - **Text-only header**: Set `brandedHeaderTextOnly: true` in `config.js` to show text with primaryColor background

4. **Size constraints:**
   - Recommended: 200px wide maximum
   - Enforced: 250px maximum (auto-scaled if larger)
   - Formats: PNG, JPG, or SVG

**Note:** Branded templates include a gradient placeholder that you can replace with your own logo. Use `brandedHeaderTextOnly: true` if you prefer a text-only header with colored background.

### Button color doesn't match my email primary color

**Automatic matching:** Button and page colors automatically match your `EMAIL_PRIMARY_COLOR` when users are redirected from the API (e.g., after clicking confirmation links).

**For initial pages (before redirects):** If you want the form to match your email color on pages where users first see it, add a meta tag to your layout file:

```html
<meta name="waitlist-color" content="#4f46e5">
```

Replace `#4f46e5` with your `EMAIL_PRIMARY_COLOR` value from your API environment variables.

**Troubleshooting:**
- Make sure `waitlist-style.js` is loaded (check browser DevTools → Network tab)
- Verify the color format is valid hex (e.g., `#4f46e5`, not `4f46e5` or `rgb(...)`)
- Check that `EMAIL_PRIMARY_COLOR` is set in your Vercel environment variables
- After updating the API, redeploy to Vercel so redirects include the color parameter

### How do I style the form?

The form uses scoped CSS classes (`.waitlist-form__*`) in `assets/waitlist-form.css`.

**Options:**
- Override styles in your site's CSS
- Edit `assets/waitlist-form.css` directly
- Use CSS variables or custom classes

### Can I disable double opt-in?

**Yes, but FYI, this is not recommended.** Set the environment variable:

```bash
vercel env add DOUBLE_OPTIN production
# Enter: false
```

Then redeploy: `vercel --prod`

**Note:** Double opt-in is recommended for better email deliverability.

## Costs & Limits

### How much will this cost me?

**Free tier covers most indie projects:**

| Service | Free Tier |
|---------|-----------|
| Vercel | 100GB bandwidth |
| Supabase | 500MB database (millions of emails) |
| Resend | 3,000 emails/month |
| Upstash | 10k requests/day |
| Turnstile | Unlimited (always free) |

**Total: $0/month** for most projects.

### What happens if I exceed free tiers?

- **Resend:** $20/month for 50,000 emails
- **Upstash:** $0.20 per 100k requests
- **Vercel/Supabase:** Generous free tiers, unlikely to exceed

## Technical

### Can I use this with React/Next.js/Astro/etc.?

**Yep.** The API is framework-agnostic. The frontend files (`assets/`) are vanilla JavaScript that work with any framework.

**For React/Next.js:** Adapt `assets/waitlist-form.js` to React hooks.

**For Astro:** Nearly drop-in - swap Liquid syntax for Astro props.

See the main [README.md](../README.md) for framework-specific instructions.

### Do I need to modify the code to use this?

**Nope.** The widget works out of the box. You only need to:
1. Run `setup.sql` in Supabase
2. Set up Resend
3. Deploy to Vercel
4. Add the form to your site

**Customization is optional** - only needed if you want to change styling, email templates, or use a different email service.

### What's the difference between the database schema and API code?

- **Database schema** (`setup.sql`): Email-service agnostic, works with any provider
- **API code** (`api/*.js`): Uses Resend by default, but can be customized

If you customize the API to use a different email service, the database continues to work fine.

## Unsubscribe & Compliance

### Do emails include unsubscribe links?

**Yes!** All welcome emails automatically include unsubscribe links for legal compliance (CAN-SPAM Act, GDPR).

**How it works:**
- Each contact gets a unique, secure unsubscribe token
- Users can unsubscribe with one click via the email link
- Unsubscribe events are tracked in the contact activity timeline
- Users see success/error pages with appropriate feedback

**Customization:**
You can customize the unsubscribe text and footer message in `the-widget/templates/config.js`:
```javascript
unsubscribeText: "Unsubscribe from these emails",
unsubscribeFooter: "You're receiving this email because you're subscribed to our emails. You can unsubscribe at any time.",
```

**Note:** The default message is generic and works for waitlist, newsletters, and all future CRM email types.

### What happens when someone unsubscribes?

1. **Database update**: `email_unsubscribed` flag is set to `true`
2. **Timestamp**: `email_unsubscribed_at` records when they unsubscribed
3. **Activity log**: Unsubscribe event is added to contact timeline
4. **Future emails**: System will respect unsubscribe status (when CRM features are added)

### Can users resubscribe after unsubscribing?

Currently, users would need to sign up again through the waitlist form.

## Still Have Questions?

- Check the [Quick Start Guide](QUICKSTART.md) for step-by-step setup (same folder)
- See [TEST_SUITE.md](TEST_SUITE.md) for testing help (same folder)
- Review the main [README.md](../README.md) for detailed documentation

**Future CRM features** will include preference management for easier resubscription.

