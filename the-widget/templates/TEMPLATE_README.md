# Email Template Editing Guide

This directory contains all the email templates used by the waitlist widget. You can easily customize them without touching any JavaScript code!

## 🚀 Quick Start

### **1. Set Branding via Environment Variables**

Configure your email branding in `.env`:

```bash
# Template style
EMAIL_TEMPLATE_STYLE=minimal          # or professional, branded

# Branding (optional - has defaults)
EMAIL_PROJECT_NAME=Your Project
EMAIL_SENDER_NAME=The Team
EMAIL_PRIMARY_COLOR=#4f46e5
EMAIL_LOGO_URL=https://yourdomain.com/logo.png
```

For detailed message customization, edit `config.js` in this directory.

### **2. Restart Your Application**

After changing the template style, restart your Vercel deployment or local server to apply changes.

### **3. Test Your Templates**

Generate previews to see how your emails will look:

```bash
npm run generate-email-previews
open example_emails/index.html
```

---

## 📁 File Structure

```
templates/
├── config.js                    # All customizable text and settings
├── confirmation-email.html      # HTML template for confirmation emails
├── confirmation-email.txt       # Plain text version
├── welcome-email.html           # HTML template for welcome emails
├── welcome-email.txt            # Plain text version
├── examples/                    # Example template variations
│   ├── *-minimal.html          # Simple, clean design
│   ├── *-branded.html          # Colorful with header/footer
│   └── *-professional.html      # Formal business style
└── README.md                    # This file
```

---

## 🎨 Available Template Styles

### **Minimal** (`EMAIL_TEMPLATE_STYLE=minimal`) - **Default**

**Best for**: Design agencies, minimalist brands, creative professionals, tech startups

**Design**: Clean, stark design with sharp edges and high contrast

**Features**:
- Bold typography with increased font weights
- Sharp, rectangular buttons (no border radius)
- Generous 60px vertical padding
- Black and white aesthetic with accent colors

**Files**: `confirmation-email.html`, `welcome-email.html` (root templates)

---

### **Professional** (`EMAIL_TEMPLATE_STYLE=professional`)

**Best for**: Law firms, consulting, financial services, formal businesses

**Design**: Elegant serif typography with structured layout

**Features**:
- Georgia serif typography
- Header sections with borders
- Formal color palette
- Enhanced letter-spacing and line-height
- Project name in signature
- **Logo support**: Optional centered logo at top (if `logoUrl` is set)

**Files**: `examples/confirmation-email-professional.html`, `examples/welcome-email-professional.html`

---

### **Branded** (`EMAIL_TEMPLATE_STYLE=branded`)

**Best for**: Companies with strong brand identity and custom colors, e-commerce

**Design**: Colorful header with logo/image support, optimized for custom brand colors

**Features**:
- Custom brand color header
- **Logo support**: Logo image in header (shows gradient placeholder SVG if `logoUrl` is empty, unless `brandedHeaderTextOnly` is true)
- **Background color logic**: Transparent background when ANY logo is used (custom or placeholder), primaryColor background when text-only header is selected
- Footer sections
- Optimized for brand colors
- Enhanced color customization
- Brand-focused layout

**Files**: `examples/confirmation-email-branded.html`, `examples/welcome-email-branded.html`

---

## 🛠 Customization Options

### **Method 1: Environment Variables (Quick Style Switch)**

Simply change your template style in `.env`:

```bash
# Switch to minimal design
EMAIL_TEMPLATE_STYLE=minimal

# Switch to professional design  
EMAIL_TEMPLATE_STYLE=professional

# Switch to branded design
EMAIL_TEMPLATE_STYLE=branded
```

### **Method 2: Content & Color Customization**

**Option A: Environment Variables (recommended for key branding)**

```bash
EMAIL_PROJECT_NAME=Your Startup
EMAIL_SENDER_NAME=The Founder
EMAIL_PRIMARY_COLOR=#4f46e5
EMAIL_LOGO_URL=https://yourdomain.com/logo.png
```

**Option B: Edit `templates/config.js` (for detailed customization)**

```javascript
export const emailConfig = {
  // These can also be set via environment variables (see above)
  projectName: process.env.EMAIL_PROJECT_NAME || "Your Startup",
  senderName: process.env.EMAIL_SENDER_NAME || "The Founder",
  primaryColor: process.env.EMAIL_PRIMARY_COLOR || "#4f46e5",
  logoUrl: process.env.EMAIL_LOGO_URL || "",
  
  // Branded template text-only header option
  brandedHeaderTextOnly: process.env.EMAIL_BRANDED_TEXT_ONLY === 'true',
  
  // Brand Colors (affects all templates)
  primaryColor: "#6366f1",      // Your brand color
  textColor: "#374151",         // Main text
  headingColor: "#111827",      // Headers
  secondaryTextColor: "#6b7280", // Muted text
  
  // Custom Messages
  confirmationGreeting: "Welcome aboard! 🚀",
  welcomeMessage: "Thanks for joining our exclusive waitlist!",
  // ... more options
};
```

**Common changes:**
- Change `projectName` to your actual project name
- Change `senderName` to your name or team name
- Update `primaryColor` to match your brand color
- Set `logoUrl` for Professional/Branded templates (Branded shows placeholder SVG if empty)
- Customize any of the message text

### **Method 3: HTML Design Customization**

Open `confirmation-email.html` or `welcome-email.html` and edit the HTML directly.

**Variables you can use:**
- `{{projectName}}` - Your project name
- `{{senderName}}` - Sender name
- `{{primaryColor}}` - Primary brand color
- `{{textColor}}` - Main text color
- `{{headingColor}}` - Heading color
- `{{secondaryTextColor}}` - Secondary text color
- `{{confirmUrl}}` - Confirmation link (confirmation emails only)
- Plus all the message variables from `config.js`

**Example:**
```html
<h1>{{confirmationGreeting}}</h1>
<p>{{confirmationMessage}}</p>
<a href="{{confirmUrl}}" style="background-color: {{primaryColor}};">
  {{confirmationButtonText}}
</a>
```

### **Method 4: Advanced Custom Templates**

For advanced users who want to create completely custom templates:

1. **Copy existing template**:
   ```bash
   cp templates/confirmation-email.html templates/my-custom-template.html
   ```

2. **Edit the HTML/CSS** in your new file

3. **Update the template mapping** in `api/shared/config.js`:
   ```javascript
   export const TEMPLATE_CONFIG = {
     templates: {
       // Add your custom template
       custom: {
         confirmation: 'my-custom-template.html',
         welcome: 'my-custom-welcome.html',
         // ...
       }
     }
   };
   ```

4. **Use your custom template**:
   ```bash
   EMAIL_TEMPLATE_STYLE=custom
   ```

---

## 📋 Template Variables Reference

### Available in All Templates

| Variable | Description | Example |
|----------|-------------|---------|
| `{{projectName}}` | Your project/company name | "My Awesome App" |
| `{{senderName}}` | Who the email is from | "The Team" |
| `{{primaryColor}}` | Primary brand color | "#4f46e5" |
| `{{textColor}}` | Main text color | "#333" |
| `{{headingColor}}` | Heading text color | "#111" |
| `{{secondaryTextColor}}` | Secondary text color | "#666" |

### Confirmation Email Variables

| Variable | Description |
|----------|-------------|
| `{{confirmUrl}}` | The confirmation link URL |
| `{{confirmationGreeting}}` | Email heading |
| `{{confirmationMessage}}` | Main message text |
| `{{confirmationButtonText}}` | Button text |
| `{{confirmationLinkExpiry}}` | Expiry notice |
| `{{confirmationIgnoreMessage}}` | Footer disclaimer |

### Welcome Email Variables

| Variable | Description |
|----------|-------------|
| `{{welcomeGreeting}}` | Email heading |
| `{{welcomeMessage}}` | First paragraph |
| `{{welcomeBody}}` | Main content |
| `{{welcomeFeedbackMessage}}` | Feedback invitation |
| `{{welcomeSignature}}` | Closing (e.g., "Cheers,") |
| `{{welcomeFooter}}` | Footer disclaimer |

---

## 🎯 Common Customizations

### Change Brand Colors

Set via environment variable (recommended):
```bash
EMAIL_PRIMARY_COLOR=#your-brand-color
```

Or edit `config.js`:
```javascript
primaryColor: "#your-brand-color",
```

### Add a Logo (Professional & Branded Templates)

**Easy logo support for Professional and Branded templates:**

1. **Set your logo URL** via environment variable (recommended):
   ```bash
   EMAIL_LOGO_URL=https://yourdomain.com/logo.png
   ```
   Or in `config.js`:
   ```javascript
   logoUrl: "https://yourdomain.com/logo.png", // Recommended: 200px max width
   ```

2. **Logo behavior:**
   - **Professional templates**: Logo appears centered at top (hidden if `logoUrl` is empty)
   - **Branded templates**: Logo appears in header (shows gradient placeholder SVG if `logoUrl` is empty, unless `brandedHeaderTextOnly` is true)

3. **Branded template background colors:**
   - **ANY logo** (custom or placeholder): Header background is transparent
   - **Text-only header**: Set `brandedHeaderTextOnly: true` in `config.js` to show text with primaryColor background

4. **Size constraints:**
   - Recommended: 200px wide maximum
   - Enforced: 250px maximum (auto-scaled if larger)
   - Formats: PNG, JPG, or SVG

**Note:** Branded templates include a professional gradient placeholder logo by default (with transparent background), so you'll always have a logo even before adding your own. Use `brandedHeaderTextOnly: true` if you prefer a text-only header with colored background.

### Change Font

Edit the `font-family` in the HTML template's `<body>` style:
```html
<body style="font-family: 'Your Font', sans-serif; ...">
```

### Add Social Links

Add to the footer section:
```html
<div style="text-align: center; margin-top: 20px;">
  <a href="https://twitter.com/yourhandle">Twitter</a> |
  <a href="https://github.com/yourrepo">GitHub</a>
</div>
```

---

## 🎯 Use Case Examples

### **Tech Startup**
```bash
EMAIL_TEMPLATE_STYLE=minimal
```
```javascript
// templates/config.js
export const emailConfig = {
  projectName: "TechFlow",
  primaryColor: "#3b82f6",
  confirmationGreeting: "Welcome to the future! 🚀",
};
```

### **Design Agency**
```bash
EMAIL_TEMPLATE_STYLE=minimal
```
```javascript
// templates/config.js
export const emailConfig = {
  projectName: "Studio Minimal",
  primaryColor: "#000000",
  confirmationGreeting: "Welcome",
};
```

### **Law Firm**
```bash
EMAIL_TEMPLATE_STYLE=professional
```
```javascript
// templates/config.js
export const emailConfig = {
  projectName: "Smith & Associates",
  primaryColor: "#1f2937",
  confirmationGreeting: "Confirm Your Consultation Request",
  senderName: "Sarah Smith, Partner",
};
```

### **E-commerce Brand**
```bash
EMAIL_TEMPLATE_STYLE=branded
```
```javascript
// templates/config.js
export const emailConfig = {
  logoUrl: "https://yourstore.com/logo.png", // Logo in header
  projectName: "Fashion Forward",
  primaryColor: "#ec4899",
  confirmationGreeting: "You're almost in! 💖",
  welcomeMessage: "Welcome to our exclusive fashion community!",
};
```

---

## 🔧 Development Workflow

### **1. Preview Templates**
```bash
# Generate previews for all templates
npm run generate-email-previews

# Open in browser
open example_emails/index.html
```

### **2. Test Template Switching**
```bash
# Test different styles
EMAIL_TEMPLATE_STYLE=minimal npm run generate-email-previews
EMAIL_TEMPLATE_STYLE=professional npm run generate-email-previews
```

### **3. Customize Content**
1. Edit `templates/config.js`
2. Regenerate previews
3. Deploy changes

### **4. Create Custom Templates**
1. Copy existing template
2. Modify HTML/CSS
3. Update template mapping
4. Test with previews

---

## 📊 Email Client Compatibility

All templates are tested and compatible with:

- ✅ **Gmail** (web, mobile)
- ✅ **Outlook** (web, desktop)
- ✅ **Apple Mail** (macOS, iOS)
- ✅ **Thunderbird**
- ✅ **Yahoo Mail**
- ✅ **Mobile clients** (iOS, Android)

### **Technical Implementation**
- **Hybrid CSS**: Embedded styles + inline fallbacks
- **Web-safe fonts**: System font stacks
- **Responsive design**: Mobile-optimized layouts
- **Template variables**: Easy customization

---

## 💡 Tips for Editing

1. **Test your changes**: After editing, redeploy to Vercel and send a test email
2. **Keep it simple**: Email clients have limited CSS support. Stick to inline styles.
3. **Mobile-friendly**: The templates use responsive design, but test on mobile devices
4. **Plain text fallback**: Always keep the `.txt` versions updated for email clients that don't support HTML
5. **Color accessibility**: Ensure sufficient contrast between text and background colors
6. **Start with existing templates** - Easier than building from scratch
7. **Test thoroughly** - Email clients render differently
8. **Use system fonts** - Better compatibility than web fonts
9. **Preview on mobile** - Many users read email on phones

---

## 🚨 Troubleshooting

### **Template Not Changing**
1. Check `.env` file has correct `EMAIL_TEMPLATE_STYLE` value
2. Restart your application/server
3. Verify template files exist in `templates/examples/`

### **Templates Not Updating**
- Make sure you redeployed to Vercel after making changes
- Check that file paths are correct (templates should be in `the-widget/templates/`)

### **Variables Not Replacing**
- Make sure variable names match exactly (case-sensitive)
- Use double curly braces: `{{variableName}}`
- Check `config.js` has the variable defined

### **Styling Issues**
1. Check `templates/config.js` for color values
2. Regenerate previews to test changes
3. Test across different email clients

### **Email Looks Broken**
- Test in multiple email clients (Gmail, Outlook, Apple Mail)
- Some CSS properties aren't supported in emails
- Use inline styles instead of `<style>` tags

### **Custom Template Errors**
1. Verify file paths in `TEMPLATE_CONFIG`
2. Check template file syntax (valid HTML)
3. Ensure all `{{variables}}` are defined in config

### **Preview Generation Issues**
1. Run `npm install` to ensure dependencies
2. Check file permissions on template files
3. Verify Node.js version compatibility

---

## 📱 Template Comparison

| Feature | Minimal | Professional | Branded |
|---------|---------|--------------|---------|
| **Typography** | Sans-serif Bold | Serif | Sans-serif |
| **Button Style** | Sharp | Rounded | Rounded |
| **Padding** | 60px | 50px | 40px |
| **Color Scheme** | High Contrast | Formal | Custom |
| **Best For** | Design/Creative | Business/Legal | Strong Brands |
| **Logo Support** | No | Yes (optional) | Yes (with placeholder) |

---

## Need Help?

- Check the main [README.md](../../README.md) for general setup
- See [docs/QUICKSTART.md](../../docs/QUICKSTART.md) for deployment steps
- Open an issue on GitHub if you need help
