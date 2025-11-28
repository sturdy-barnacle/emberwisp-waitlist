# Shared API Modules

This directory contains shared modules used by the API endpoints. These modules make customization easier and reduce code duplication.

## Files

### `config.js`
**Centralized configuration** - All environment variables and settings in one place.

**What's here:**
- Email service configuration (`EMAIL_CONFIG`)
- Database configuration (`DATABASE_CONFIG`)
- Application settings (`APP_CONFIG`) - includes URLs for confirmation and unsubscribe pages
- CORS allowed origins (`CORS_CONFIG`)
- Feature flags (`FEATURES`)
- Rate limiting configuration (`RATE_LIMIT_CONFIG`)
- Email template style selection (`TEMPLATE_CONFIG`)

**To customize:**
- **CORS origins:** Set `CORS_ALLOWED_ORIGINS` environment variable (comma-separated domains)
- **Feature flags:** Edit `FEATURES` object
- **Rate limits:** Edit `RATE_LIMIT_CONFIG`
- **Email template style:** Set `EMAIL_TEMPLATE_STYLE` environment variable to `minimal`, `professional`, or `branded`

### `database.js`
**Database client** - Supabase client initialization.

**What's here:**
- Singleton Supabase client instance
- Used by all API endpoints

**To customize:**
- If using a different database, replace the Supabase client initialization

### `email-service.js`
**Email sending abstraction** - Handles all email sending.

**What's here:**
- `sendConfirmationEmail()` - Sends confirmation emails
- `sendWelcomeEmail()` - Sends welcome emails

**⚠️ To use a different email service:**
This is the **only file you need to modify** to use SendGrid, Mailgun, AWS SES, etc.:
1. Replace Resend initialization
2. Update `sendConfirmationEmail()` function
3. Update `sendWelcomeEmail()` function
4. Update `package.json` dependencies

### `email-templates.js`
**Email template loading** - Loads and processes email templates.

**What's here:**
- `getConfirmationEmailHtml()` - Returns confirmation email HTML
- `getConfirmationEmailText()` - Returns confirmation email text
- `getWelcomeEmailHtml()` - Returns welcome email HTML
- `getWelcomeEmailText()` - Returns welcome email text

**To customize:**
- Edit templates in `templates/` folder
- Or change template style via `EMAIL_TEMPLATE_STYLE` environment variable

### `contacts.js`
**Contact management** - Utilities for unified contacts system.

**What's here:**
- `getOrCreateContact()` - Gets or creates a contact
- `updateContactVerified()` - Updates contact verification status
- `updateContactVerifiedByEmail()` - Fallback contact update

**To customize:**
- Usually no changes needed
- Works automatically with contacts table

### `resend-contacts.js`
**Resend Contacts API integration** - Syncs contacts to Resend Audience.

**What's here:**
- `syncContactToResend()` - Add/update contact in Resend Audience
- `updateResendContact()` - Update existing contact
- `unsubscribeResendContact()` - Mark contact as unsubscribed
- `removeResendContact()` - Remove contact from audience
- `isResendContactsSyncEnabled()` - Check if sync is configured

**To customize:**
- Set `RESEND_AUDIENCE_ID` environment variable to enable
- Sync happens automatically on email confirmation and unsubscribe

**Related:**
- Webhook handler at `api/webhooks/resend.js` receives Resend events
- Bulk sync script at `scripts/sync-contacts-to-resend.js`

### `utils.js`
**Shared utilities** - Common helper functions.

**What's here:**
- `isValidEmail()` - Email validation
- `normalizeEmail()` - Email normalization
- `generateToken()` - Secure token generation
- `getCorsHeaders()` - CORS header generation
- `getClientIp()` - IP address extraction

**To customize:**
- Usually no changes needed
- Add new utilities here if needed

## Customization Examples

### Using SendGrid Instead of Resend

1. **Update `email-service.js`:**
```js
import sgMail from '@sendgrid/mail';
import { EMAIL_CONFIG } from './config.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendConfirmationEmail(email, token, baseUrl) {
  const confirmUrl = `${baseUrl}/api/confirm?token=${token}`;
  
  await sgMail.send({
    to: email,
    from: EMAIL_CONFIG.fromEmail,
    subject: 'Confirm your waitlist signup',
    html: getConfirmationEmailHtml(confirmUrl),
    text: getConfirmationEmailText(confirmUrl),
  });
}

// Similar for sendWelcomeEmail()
```

2. **Update `config.js`:**
```js
export const EMAIL_CONFIG = {
  fromEmail: process.env.FROM_EMAIL || 'Your Project <hello@yourdomain.com>',
  sendgridApiKey: process.env.SENDGRID_API_KEY, // Changed from resendApiKey
};
```

3. **Update `package.json`:**
```json
{
  "dependencies": {
    "@sendgrid/mail": "^7.7.0",
    // Remove "resend": "^4.0.0"
  }
}
```

That's it! The rest of the code continues to work.

## Benefits

✅ **Easier customization** - Change email service in one file  
✅ **Less duplication** - Shared code in one place  
✅ **Better organization** - Clear separation of concerns  
✅ **Maintainability** - Update config in one place  

