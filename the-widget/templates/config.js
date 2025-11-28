// Email Template Configuration
// Edit these values to customize your email templates

export const emailConfig = {
  // Project/Company Information
  projectName: "Your Project",
  senderName: "The Team",
  
  // Logo Configuration
  // Recommended: 200px wide max, PNG, JPG, or SVG format
  // Maximum enforced size: 250px wide (will be scaled down if larger)
  // Branded templates: Shows placeholder SVG logo if logoUrl is empty (unless brandedHeaderTextOnly is true)
  // Professional templates: Hides logo if logoUrl is empty
  logoUrl: "", // e.g., "https://yourdomain.com/logo.png"
  
  // Branded template text-only header option
  // If true and logoUrl is empty: Shows text (projectName) with primaryColor background
  // If false and logoUrl is empty: Shows placeholder SVG logo with transparent background
  brandedHeaderTextOnly: false, // Set to true for text-only header with background color
  
  // Branding Colors
  primaryColor: "#4f46e5",      // Button and link color
  textColor: "#333",             // Main text color
  headingColor: "#111",         // Heading text color
  secondaryTextColor: "#666",   // Secondary text color
  
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
};

