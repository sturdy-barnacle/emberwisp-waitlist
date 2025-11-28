# Email Template Styles

This folder contains shared CSS styles for email templates, following DRY (Don't Repeat Yourself) principles.

## 📁 Style Files

- **`default.css`** - Minimal style (clean, simple design) - now the default
- **`minimal.css`** - Same as default.css (for reference)
- **`professional.css`** - Elegant serif design with formal styling

## 🎨 Design System

### Spacing Scale
- **Small**: 16px, 20px, 24px
- **Medium**: 32px, 40px, 48px  
- **Large**: 60px, 80px

### Typography Scale
- **Headers**: 24px (mobile) → 32px (desktop)
- **Body**: 16px
- **Secondary**: 14px
- **Small**: 12px
- **Tiny**: 11px

### Color Variables
Each template uses these placeholder variables:
- `{{primaryColor}}` - Brand/accent color
- `{{textColor}}` - Main text color
- `{{headingColor}}` - Header text color
- `{{secondaryTextColor}}` - Muted text color

## 🏗 Architecture

### Hybrid Approach
Templates use both embedded `<style>` tags and inline styles for maximum email client compatibility:

1. **Embedded CSS** - Modern email clients, better maintainability
2. **Inline Styles** - Fallback for older clients, guaranteed rendering

### Template Structure
```html
<head>
  <style>
    /* Embedded styles with CSS classes */
    .button { ... }
  </style>
</head>
<body>
  <!-- Inline styles as fallback -->
  <a class="button" style="display: inline-block; ...">
</body>
```

## 📱 Responsive Design

All templates include mobile-first responsive design:

```css
@media only screen and (max-width: 600px) {
  body { padding: 20px 16px; }
  h1 { font-size: 24px; }
  .button { padding: 14px 24px; }
}
```

## 🎯 Usage

### For Developers
1. **Modify shared styles** in this folder
2. **Regenerate previews** with `npm run generate-email-previews`
3. **Test across email clients** using tools like Litmus or Email on Acid

### For Customization
1. **Edit CSS variables** in template files
2. **Adjust spacing** by modifying margin/padding values
3. **Change typography** by updating font-family and sizes
4. **Customize colors** through template configuration

## 🔧 Maintenance

### Adding New Styles
1. Create new `.css` file in this folder
2. Follow existing naming convention
3. Include mobile responsiveness
4. Update template files to use new styles

### Best Practices
- **Keep specificity low** - Use classes over IDs
- **Test thoroughly** - Email clients are inconsistent
- **Maintain fallbacks** - Always include inline styles
- **Use web-safe fonts** - Fallback to system fonts

## 📊 Email Client Support

### Well Supported
- Gmail (web, mobile)
- Outlook (web)
- Apple Mail
- Thunderbird

### Limited Support
- Outlook (desktop) - Requires inline styles
- Older email clients - May ignore embedded CSS

### Testing Strategy
1. **Development** - Use browser preview
2. **Staging** - Test with real email clients
3. **Production** - Monitor delivery and rendering

---

*These styles are automatically embedded in email templates for optimal compatibility.*
