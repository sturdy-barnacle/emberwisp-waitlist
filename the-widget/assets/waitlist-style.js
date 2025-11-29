/**
 * Waitlist Style Configuration
 * Automatically applies email template style to web pages and form
 * Reads style from URL parameter (from API redirects) or meta tag (for form)
 * Reads primary color from URL parameter or meta tag to match EMAIL_PRIMARY_COLOR
 */

(function() {
  'use strict';

  // Style configurations matching email templates
  const STYLES = {
    minimal: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      primaryColor: '#4f46e5', // Default fallback
      primaryColorHover: '#4338ca', // Default fallback
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
      primaryColor: '#4f46e5', // Default fallback
      primaryColorHover: '#4338ca', // Default fallback
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
      primaryColor: '#4f46e5', // Default fallback
      primaryColorHover: '#4338ca', // Default fallback
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
   * Calculate a darker hover color from primary color
   * Darkens by approximately 15%
   */
  function darkenColor(hex, percent = 15) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Darken each component
    const newR = Math.max(0, Math.floor(r * (1 - percent / 100)));
    const newG = Math.max(0, Math.floor(g * (1 - percent / 100)));
    const newB = Math.max(0, Math.floor(b * (1 - percent / 100)));
    
    // Convert back to hex
    return '#' + 
      newR.toString(16).padStart(2, '0') + 
      newG.toString(16).padStart(2, '0') + 
      newB.toString(16).padStart(2, '0');
  }

  /**
   * Validate hex color format
   */
  function isValidHexColor(hex) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  }

  /**
   * Get primary color from URL parameter or meta tag
   */
  function getPrimaryColor() {
    // Try URL parameter first (from API redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const urlColor = urlParams.get('color');
    if (urlColor && isValidHexColor(urlColor)) {
      return urlColor;
    }

    // Fallback to meta tag (for form on pages without URL param)
    const metaTag = document.querySelector('meta[name="waitlist-color"]');
    if (metaTag && metaTag.content && isValidHexColor(metaTag.content)) {
      return metaTag.content;
    }

    // Return null to use style default
    return null;
  }

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

    // Get primary color from URL/meta tag, or use style default
    const primaryColor = getPrimaryColor() || style.primaryColor;
    const primaryColorHover = getPrimaryColor() 
      ? darkenColor(primaryColor, 15) 
      : style.primaryColorHover;

    // Set CSS custom properties
    root.style.setProperty('--waitlist-primary-color', primaryColor);
    root.style.setProperty('--waitlist-primary-color-hover', primaryColorHover);
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

