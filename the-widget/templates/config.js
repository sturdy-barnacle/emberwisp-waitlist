// Email Template Configuration
// Key branding values can be set via environment variables (recommended)
// or edited directly here as fallbacks

export const emailConfig = {
  // Project/Company Information (set via EMAIL_PROJECT_NAME, EMAIL_SENDER_NAME)
  projectName: process.env.EMAIL_PROJECT_NAME || "Your Project",
  senderName: process.env.EMAIL_SENDER_NAME || "The Team",
  
  // Logo Configuration (set via EMAIL_LOGO_URL)
  // Recommended: 200px wide max, PNG, JPG, or SVG format
  // Branded templates: Shows placeholder SVG if empty (unless brandedHeaderTextOnly is true)
  logoUrl: process.env.EMAIL_LOGO_URL || "",
  
  // Branded template text-only header option
  brandedHeaderTextOnly: process.env.EMAIL_BRANDED_TEXT_ONLY === 'true',
  
  // Branding Colors (set via EMAIL_PRIMARY_COLOR)
  primaryColor: process.env.EMAIL_PRIMARY_COLOR || "#4f46e5",
  textColor: "#333",
  headingColor: "#111",
  secondaryTextColor: "#666",
  
  // Email Content
  confirmationSubject: "Confirm your waitlist signup",
  confirmationPreheader: "Please confirm your email address to join our waitlist",
  welcomeSubject: "You're on the waitlist! 🎉",
  welcomePreheader: "Thanks for joining! You'll be among the first to know when we launch",
  
  // Customizable Messages
  confirmationGreeting: "Confirm your email",
  confirmationMessage: "Thanks for signing up! Please confirm your email address by clicking the button below:",
  confirmationButtonText: "Confirm my email",
  confirmationLinkExpiry: "This link expires in 24 hours.",
  confirmationIgnoreMessage: "If you didn't sign up for our waitlist, you can safely ignore this email.",
  
  welcomeGreeting: "You're on the waitlist! 🎉",
  welcomeMessage: "Thanks for signing up, we're excited to have you.",
  welcomeBody: "We're working hard to get everything ready, and you'll be among the first to know when we launch.",
  welcomeFeedbackMessage: "In the meantime, feel free to reply to this email if you have any questions or feedback. We read every message.",
  welcomeSignature: "Cheers,",
  welcomeFooter: "You received this email because you signed up for our waitlist. If this wasn't you, you can safely ignore this email.",
  
  // Unsubscribe configuration
  unsubscribeText: "Unsubscribe from these emails",
  unsubscribeFooter: "You're receiving this email because you're subscribed to our emails. You can unsubscribe at any time.",
  
  // SPAM Compliance (CAN-SPAM Act requirements)
  // Physical postal address - REQUIRED for marketing emails
  // Can be street address, P.O. Box, or private mailbox
  senderAddress: process.env.EMAIL_SENDER_ADDRESS || "",
  // Advertisement disclosure - optional, only if emails are promotional
  advertisementDisclosure: process.env.EMAIL_ADVERTISEMENT_DISCLOSURE || "",
  
  // GDPR Compliance
  // Privacy policy URL - recommended for GDPR compliance
  privacyPolicyUrl: process.env.EMAIL_PRIVACY_POLICY_URL || "",
};

