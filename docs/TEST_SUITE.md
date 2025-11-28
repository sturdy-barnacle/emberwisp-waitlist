# Testing Guide

This guide helps you test your waitlist widget to make sure everything works correctly. **For most indie projects, manual testing is all you need** - no complex test suites required!

**⚠️ Note:** This guide assumes you're using **Resend** for email sending. If you've customized the API code to use a different email service, adjust the testing steps accordingly.

## Quick Testing Checklist

**Start here if you just want to make sure it works:**

- [ ] Form submits successfully with a valid email
- [ ] Contact record created in database
- [ ] Invalid emails are rejected (try `notanemail` or `test@`)
- [ ] Confirmation email arrives in your inbox
- [ ] Clicking the confirmation link works
- [ ] Contact marked as verified after confirmation
- [ ] Welcome email arrives after confirmation
- [ ] Form looks good on mobile
- [ ] Form looks good on desktop

**That's it!** If all these pass, you're good to go. The sections below go into more detail if you want to test edge cases.

## Detailed Testing Guide

### 1. Basic Form Testing

**How to test:**
1. Open your site in a browser
2. Try submitting the form with different inputs

**What to check:**

- ✅ **Valid email works**
  - Enter: `test@example.com`
  - Expected: Form submits, shows success message, email arrives

- ✅ **Invalid emails are rejected**
  - Try: `notanemail`, `test@`, `@example.com`, `test@example`
  - Expected: Form shows an error, doesn't submit

- ✅ **Duplicate email handling**
  - Submit the same email twice
  - Expected: First time works, second time shows "already subscribed" message

- ✅ **Loading state**
  - Submit form and watch the button
  - Expected: Button shows loading/disabled state while submitting

### 2. Email Flow Testing

**How to test:**
1. Submit your email through the form
2. Check your inbox (and spam folder!)
3. Click the confirmation link

**What to check:**

- ✅ **Confirmation email arrives**
  - Check: Email arrives within 1-2 minutes
  - Check: Email looks good (not broken HTML)
  - Check: Links work when clicked

- ✅ **Confirmation link works**
  - Click the link in the email
  - Expected: Redirects to success page, welcome email arrives

- ✅ **Welcome email arrives**
  - After confirming, check inbox
  - Expected: Welcome email arrives within 1-2 minutes

- ✅ **Expired/invalid links**
  - Try clicking an old confirmation link (from 24+ hours ago)
  - Expected: Shows error page with helpful message

### 3. Optional Features Testing

**If you enabled CAPTCHA:**
- ✅ CAPTCHA widget appears on the form
- ✅ Form won't submit without completing CAPTCHA
- ✅ Form submits successfully after completing CAPTCHA

**If you enabled rate limiting:**
- ✅ Try submitting 5-10 times rapidly
- ✅ After limit, form shows rate limit error
- ✅ Wait an hour, form works again

**If you disabled double opt-in:**
- ✅ Submitting form sends welcome email immediately (no confirmation needed)
- ✅ No confirmation email is sent

## Local Testing

The `local-test/` folder contains everything you need to test the waitlist widget locally without setting up a Jekyll site. This is the **recommended way** to test locally.

### Quick Start

1. **Navigate to the-widget directory:**
   ```bash
   cd the-widget
   ```

2. **Start the local development server:**
   ```bash
   npm run start:dev
   ```
   This starts the API server at `http://localhost:3000`

3. **Open the testing hub:**
   - Navigate to: `http://localhost:3000/` (testing hub)
   - Or directly to the test form: `http://localhost:3000/local-test/test-form.html`
   - The form is already configured to use the local API endpoint

4. **Configure CORS (first time only):**
   - Open `the-widget/api/shared/config.js`
   - Add `http://localhost:3000` to the `allowedOrigins` array:
   ```javascript
   export const CORS_CONFIG = {
     allowedOrigins: [
       'https://yourdomain.com',
       'http://localhost:3000', // For local testing
       'http://localhost:4000', // Jekyll local dev
     ],
   };
   ```

5. **Test the form:**
   - Enter a valid email address
   - Click "Join Waitlist"
   - Check browser console (F12) for any errors
   - Check your email inbox for confirmation email
   - Click the confirmation link to test the full flow

**For detailed testing instructions, see `the-widget/local-test/README.md`**

### What You Can Test

Using the local testing setup, you can test:

- ✅ **Form submission** - Valid and invalid emails
- ✅ **Loading states** - Button shows loading spinner
- ✅ **Error handling** - Invalid emails, duplicate submissions
- ✅ **Email flow** - Confirmation and welcome emails
- ✅ **Confirmation pages** - Success and error redirects
- ✅ **API responses** - Check network tab in browser dev tools
- ✅ **CORS configuration** - Verify requests work from localhost

### Testing with Turnstile CAPTCHA

If you want to test with CAPTCHA enabled:

1. **Get your Turnstile site key** from Cloudflare dashboard
2. **Edit `local-test/test-form.html`** - Uncomment the Turnstile section
3. **Replace** `YOUR_TURNSTILE_SITE_KEY_HERE` with your actual site key
4. **Test** - The form will now require CAPTCHA completion before submission

### Troubleshooting

**Form not loading:**
- Make sure `npm run start:dev` is running
- Check that you're accessing `http://localhost:3000/local-test/test-form.html` (not file://)
- Check browser console for errors

**CORS errors:**
- Add `http://localhost:3000` to `CORS_CONFIG.allowedOrigins` in `api/shared/config.js`
- Restart the dev server after making changes

**API not responding:**
- Check that the dev server is running without errors
- Verify `.env.local` file exists with all required variables
- Check terminal output for any error messages

**Emails not arriving:**
- Check Resend dashboard → Logs
- Verify `FROM_EMAIL` in `.env.local` matches your verified domain
- Check spam folder

**404 on confirmation or unsubscribe pages:**
- Make sure `vercel.json` has the rewrites configured
- Check that `.env.local` has:
  - `CONFIRM_SUCCESS_URL=/test-waitlist-confirmed`
  - `CONFIRM_ERROR_URL=/test-waitlist-error`
  - `UNSUBSCRIBE_SUCCESS_URL=/test-unsubscribe-success`
  - `UNSUBSCRIBE_ERROR_URL=/test-unsubscribe-error`
- Restart the dev server

For more troubleshooting, see `the-widget/local-test/README.md`

## Testing Tips

### Use Your Real Email

**Best practice:** Use your own email address for testing. This way you can:
- See exactly what users will see
- Test on real devices (phone, tablet, desktop)
- Check spam folders
- Test across different email clients

### Test Email Addresses

You can use any email address for testing:
- Your personal email (recommended)
- `test@yourdomain.com` (if you have a domain)
- Gmail with `+` aliases: `youremail+test1@gmail.com` (Gmail treats these as separate addresses)

### Local Testing

**The easiest way to test locally is using the built-in test form:**

#### Option 1: Using Local Testing Setup (Recommended)

This is the simplest way to test without setting up a Jekyll site:

1. **Start local server:**
   ```bash
   cd the-widget
   npm run start:dev
   ```

2. **Open testing hub:**
   - Navigate to: `http://localhost:3000/` (testing hub)
   - Or directly: `http://localhost:3000/local-test/test-form.html`
   - The form is pre-configured to use `http://localhost:3000/api/subscribe`

3. **Update CORS settings** (if needed):
   - Open `the-widget/api/shared/config.js`
   - Add `http://localhost:3000` to `CORS_CONFIG.allowedOrigins`:
   ```javascript
   export const CORS_CONFIG = {
     allowedOrigins: [
       'https://yourdomain.com',
       'https://www.yourdomain.com',
       'http://localhost:3000', // For local testing
       'http://localhost:4000', // Jekyll local dev
     ],
   };
   ```

4. **Test the form:**
   - Submit with valid emails
   - Test invalid emails
   - Check browser console (F12) for any errors
   - Verify emails arrive in your inbox
   - Test confirmation flow (click email link, verify redirects)

**See `the-widget/local-test/README.md` for complete testing guide.**

**Note:** For local testing, you'll still need:
- Supabase project set up
- Resend account with verified domain
- All environment variables configured in `.env.local`

#### Option 2: Testing with Jekyll Site

If you want to test with your actual Jekyll site:

1. **Start local server:**
   ```bash
   cd the-widget
   npm run start:dev
   ```

2. **Update CORS settings** in `api/shared/config.js` to include your Jekyll local URL (e.g., `http://localhost:4000`)

3. **Test locally** - submit forms from your Jekyll site, check emails, etc.

### Testing in Your CI/CD Pipeline

Since this is a drop-in plugin/widget, you'll integrate testing into your own project's CI/CD pipeline. Consider:

- **Manual testing checklist** (see below) before deploying to production
- **Integration tests** in your project's test suite that verify the widget works with your site
- **E2E tests** that test the complete signup flow in your staging environment

## Manual Testing Checklist

### Before Deployment

- [ ] Form submits successfully with valid email
- [ ] Invalid emails are rejected
- [ ] Confirmation email is received
- [ ] Confirmation link works
- [ ] Welcome email is received after confirmation
- [ ] Error page displays for invalid tokens
- [ ] Rate limiting works (test with multiple rapid submissions)
- [ ] CAPTCHA works (if enabled)
- [ ] Dark mode styles work correctly
- [ ] Mobile responsive design works
- [ ] CORS is configured correctly for production domain

### Email Testing

- [ ] Confirmation email renders correctly in:
  - [ ] Gmail (web)
  - [ ] Gmail (mobile)
  - [ ] Outlook
  - [ ] Apple Mail
- [ ] Welcome email renders correctly in same clients
- [ ] Plain text fallback works
- [ ] Links in emails work correctly

## Performance Testing

### Simple Load Testing (Optional)

For most indie projects, basic manual testing is sufficient. If you want to test rate limiting:

**Option 1: Manual browser testing**
- Open your form in multiple browser tabs
- Try submitting rapidly (5-10 times quickly)
- Verify rate limiting kicks in after your configured limit

**Option 2: Using curl (command line)**
```bash
# Test rapid submissions (replace with your actual API URL)
for i in {1..10}; do
  curl -X POST https://your-site.vercel.app/api/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com"}' &
done
wait
# Check if rate limiting blocked some requests
```

**Option 3: Free online tools** (for more thorough testing)
- [k6 Cloud](https://k6.io/cloud/) - Free tier available
- [Apache Bench](https://httpd.apache.org/docs/2.4/programs/ab.html) - Built into most systems
  ```bash
  ab -n 100 -c 10 -p test.json -T application/json https://your-site.vercel.app/api/subscribe
  ```

**What to verify:**
- Rate limiting returns 429 status after limit exceeded
- Legitimate users aren't blocked (test from different IPs)
- Your rate limit settings match your needs

### Database Performance (Usually Not Needed)

For typical waitlist use cases (< 10,000 signups), performance testing isn't necessary. Supabase handles this automatically.

**If you're expecting high volume:**
- Test with 100-1000 signups first (add test data manually)
- Check that the stats view loads quickly in Supabase dashboard
- If slow, Supabase will suggest indexes automatically

**Most indie devs can skip this** - Supabase is optimized for this use case out of the box.

## Security Testing (Optional)

**Good news:** The widget handles most security automatically! But if you want to verify:

- ✅ **Email validation** - Try submitting `test@` or `' OR 1=1--` - should be rejected
- ✅ **CORS protection** - Form should only work from your domain (check browser console for CORS errors)
- ✅ **Rate limiting** (if enabled) - Try rapid submissions, should block after limit
- ✅ **CAPTCHA** (if enabled) - Form shouldn't submit without completing CAPTCHA

**You don't need to test SQL injection or XSS** - Supabase and the code handle this automatically. If you're curious, you can try submitting `<script>alert('xss')</script>` as an email - it should be rejected as invalid.

## Common Issues & Solutions

### Emails Not Arriving

**Check:**
1. Spam folder (very common!)
2. Resend dashboard → Logs (see if emails are being sent)
3. `FROM_EMAIL` matches your verified Resend domain
4. Domain verification in Resend dashboard

### Form Not Submitting

**Check:**
1. Browser console for errors (F12 → Console tab)
2. CORS errors? Add your domain to `allowedOrigins` in `api/shared/config.js`:
   ```javascript
   export const CORS_CONFIG = {
     allowedOrigins: [
       'https://yourdomain.com',
       'http://localhost:3000', // For local testing
       // Add your domain here
     ],
   };
   ```
3. Network tab → see if API request is being made
4. API URL is correct in your form include (or local-test/test-form.html)
5. If using local testing, make sure `npm run start:dev` is running

### Confirmation Links Broken

**Check:**
1. `BASE_URL` environment variable matches your Vercel deployment URL
2. Links in email point to correct domain
3. Confirmation pages (`waitlist-confirmed.html`, `waitlist-error.html`) are deployed

### Rate Limiting Too Strict

**If legitimate users are being blocked:**
- Check your rate limit settings in `api/shared/config.js`:
  ```javascript
  export const RATE_LIMIT_CONFIG = {
    limit: 5,        // Adjust this number
    window: '1 h',   // Adjust time window
  };
  ```
- Default is 5 per hour per IP - adjust if needed
- Consider increasing limit or disabling for small sites

## When You're Done Testing

Once everything works:
- ✅ Deploy to production
- ✅ Test one more time on production URL
- ✅ Share with a friend to test from their device/email
- ✅ Monitor Resend dashboard for the first few signups

**That's it!** You don't need complex automated tests - manual testing is perfectly fine for most indie projects.

