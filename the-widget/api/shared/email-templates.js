// Email template loading and variable replacement
// Loads HTML/text templates from templates/ folder and replaces variables with config values

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { emailConfig } from '../../templates/config.js';
import { TEMPLATE_CONFIG, APP_CONFIG } from './config.js';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatesDir = join(__dirname, '../../templates');

// Simple template variable replacement
function replaceVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

// Load template file
function loadTemplate(filename) {
  try {
    const filePath = join(templatesDir, filename);
    return readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    console.error(`Error loading template ${filename}:`, error);
    throw error;
  }
}

// Build variables object from config and dynamic values
function buildVariables(additionalVars = {}) {
  // Generate unsubscribe URL based on available data
  let unsubscribeUrl = `${APP_CONFIG.baseUrl}${APP_CONFIG.unsubscribeErrorUrl}`;
  
  if (additionalVars.unsubscribeToken) {
    // Prefer token-based unsubscribe (more secure)
    unsubscribeUrl = `${APP_CONFIG.baseUrl}/api/unsubscribe?token=${additionalVars.unsubscribeToken}`;
  } else if (additionalVars.email) {
    // Fallback to email-based unsubscribe
    unsubscribeUrl = `${APP_CONFIG.baseUrl}/api/unsubscribe?email=${encodeURIComponent(additionalVars.email)}`;
  }
  
  // Generate logo HTML if logoUrl is provided
  // Recommended max: 200px wide, Enforced max: 250px (scaled down automatically)
  let logoHtml = '';
  let logoHeaderHtml = '';
  let brandedHeaderBgColor = ''; // Branded template header background color
  
  // Default placeholder SVG logo for branded templates (data URI)
  // Professional gradient placeholder - users should replace with their own logo
  const defaultPlaceholderLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2MzY2ZjE7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4YjVjZjY7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI2dyYWQpIiByeD0iNiIvPjx0ZXh0IHg9IjEwMCIgeT0iMzgiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMC41cHgiPllvdXIgTG9nbzwvdGV4dD48L3N2Zz4=';
  
  // Check if user wants text-only header (no logo at all)
  const useTextOnly = emailConfig.brandedHeaderTextOnly === true;
  
  if (emailConfig.logoUrl && emailConfig.logoUrl.trim() !== '') {
    // Professional template: Logo above content
    logoHtml = `<div class="logo-container" style="text-align: center; padding: 30px 20px 20px 20px; margin-bottom: 30px;">
    <img src="${emailConfig.logoUrl}" alt="${emailConfig.projectName}" style="max-width: 250px; width: auto; height: auto; display: block; margin: 0 auto;" />
  </div>`;
    
    // Branded template: Custom logo in header - transparent background (ANY logo = transparent)
    logoHeaderHtml = `<div class="logo" style="color: white; font-size: 24px; font-weight: bold;">
      <img src="${emailConfig.logoUrl}" alt="${emailConfig.projectName}" style="max-width: 250px; width: auto; height: auto; display: block; margin: 0 auto;" />
    </div>`;
    brandedHeaderBgColor = 'transparent'; // Transparent background when ANY logo is used
  } else if (useTextOnly) {
    // Branded template: Text-only header - WITH background color (primaryColor)
    logoHeaderHtml = `<div class="logo" style="color: white; font-size: 24px; font-weight: bold;">${emailConfig.projectName}</div>`;
    brandedHeaderBgColor = emailConfig.primaryColor; // Show background color for text-only header
  } else {
    // Branded template: Placeholder SVG logo - transparent background (ANY logo = transparent)
    logoHeaderHtml = `<div class="logo" style="color: white; font-size: 24px; font-weight: bold;">
      <img src="${defaultPlaceholderLogo}" alt="${emailConfig.projectName}" style="max-width: 250px; width: auto; height: auto; display: block; margin: 0 auto;" />
    </div>`;
    brandedHeaderBgColor = 'transparent'; // Transparent background when using placeholder logo (it's still a logo)
  }
  
  return {
    ...emailConfig,
    unsubscribeUrl,
    logoHtml, // Professional template: Logo above content (empty if no logoUrl)
    logoHeaderHtml, // Branded template: Logo in header (image or placeholder)
    brandedHeaderBgColor, // Branded template: Header background color (transparent if any logo, primaryColor if text-only)
    ...additionalVars,
  };
}

// Get the current template style from environment
function getCurrentTemplateStyle() {
  const style = TEMPLATE_CONFIG.emailStyle;
  // Handle 'default' as alias for 'minimal' (backward compatibility)
  const normalizedStyle = style === 'default' ? 'minimal' : style;
  if (!TEMPLATE_CONFIG.templates[normalizedStyle]) {
    console.warn(`Unknown email template style: ${style}. Falling back to 'minimal'.`);
    return 'minimal';
  }
  return normalizedStyle;
}

// Get template filename for current style
function getTemplateFile(type) {
  const style = getCurrentTemplateStyle();
  return TEMPLATE_CONFIG.templates[style][type];
}

export function getConfirmationEmailHtml(confirmUrl) {
  const templateFile = getTemplateFile('confirmation');
  const template = loadTemplate(templateFile);
  const variables = buildVariables({ confirmUrl });
  return replaceVariables(template, variables);
}

export function getConfirmationEmailText(confirmUrl) {
  const templateFile = getTemplateFile('confirmationText');
  const template = loadTemplate(templateFile);
  const variables = buildVariables({ confirmUrl });
  return replaceVariables(template, variables);
}

export function getWelcomeEmailHtml(unsubscribeToken = null, email = null) {
  const templateFile = getTemplateFile('welcome');
  const template = loadTemplate(templateFile);
  const variables = buildVariables({ unsubscribeToken, email });
  return replaceVariables(template, variables);
}

export function getWelcomeEmailText(unsubscribeToken = null, email = null) {
  const templateFile = getTemplateFile('welcomeText');
  const template = loadTemplate(templateFile);
  const variables = buildVariables({ unsubscribeToken, email });
  return replaceVariables(template, variables);
}
