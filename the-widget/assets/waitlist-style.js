/**
 * Waitlist Style Configuration
 * Automatically applies email template style to web pages and form
 * Reads style from URL parameter (from API redirects) or meta tag (for form)
 */

(function() {
  'use strict';

  // Style configurations matching email templates
  const STYLES = {
    minimal: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      primaryColor: '#4f46e5',
      primaryColorHover: '#4338ca',
      textColor: '#333',
      headingColor: '#111',
      secondaryTextColor: '#666',
      borderRadius: '0.5rem',
      buttonBorderRadius: '0.5rem',
      buttonPadding: '0.75rem 1.5rem',
      fontWeight: '500',
      headingFontWeight: '700'
    },
    professional: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      primaryColor: '#4f46e5',
      primaryColorHover: '#4338ca',
      textColor: '#333',
      headingColor: '#111',
      secondaryTextColor: '#666',
      borderRadius: '0.25rem',
      buttonBorderRadius: '0.25rem',
      buttonPadding: '0.875rem 2rem',
      fontWeight: '500',
      headingFontWeight: '400',
      lineHeight: '1.8'
    },
    branded: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      primaryColor: '#4f46e5',
      primaryColorHover: '#4338ca',
      textColor: '#333',
      headingColor: '#111',
      secondaryTextColor: '#666',
      borderRadius: '0.5rem',
      buttonBorderRadius: '0.5rem',
      buttonPadding: '0.75rem 1.5rem',
      fontWeight: '500',
      headingFontWeight: '600'
    }
  };

  /**
   * Get style from URL parameter or meta tag
   */
  function getStyle() {
    // Try URL parameter first (from API redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const urlStyle = urlParams.get('style');
    if (urlStyle && STYLES[urlStyle]) {
      return urlStyle;
    }

    // Fallback to meta tag (for form on pages without URL param)
    const metaTag = document.querySelector('meta[name="waitlist-style"]');
    if (metaTag && metaTag.content && STYLES[metaTag.content]) {
      return metaTag.content;
    }

    // Default to minimal
    return 'minimal';
  }

  /**
   * Apply CSS variables to document root
   */
  function applyStyle(styleName) {
    const style = STYLES[styleName] || STYLES.minimal;
    const root = document.documentElement;

    // Set CSS custom properties
    root.style.setProperty('--waitlist-primary-color', style.primaryColor);
    root.style.setProperty('--waitlist-primary-color-hover', style.primaryColorHover);
    root.style.setProperty('--waitlist-text-color', style.textColor);
    root.style.setProperty('--waitlist-heading-color', style.headingColor);
    root.style.setProperty('--waitlist-secondary-text-color', style.secondaryTextColor);
    root.style.setProperty('--waitlist-font-family', style.fontFamily);
    root.style.setProperty('--waitlist-border-radius', style.borderRadius);
    root.style.setProperty('--waitlist-button-border-radius', style.buttonBorderRadius);
    root.style.setProperty('--waitlist-button-padding', style.buttonPadding);
    root.style.setProperty('--waitlist-font-weight', style.fontWeight);
    root.style.setProperty('--waitlist-heading-font-weight', style.headingFontWeight);
    
    if (style.lineHeight) {
      root.style.setProperty('--waitlist-line-height', style.lineHeight);
    }

    // Add data attribute for CSS selectors if needed
    root.setAttribute('data-waitlist-style', styleName);
  }

  // Apply style on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const style = getStyle();
      applyStyle(style);
    });
  } else {
    // DOM already loaded
    const style = getStyle();
    applyStyle(style);
  }
})();

