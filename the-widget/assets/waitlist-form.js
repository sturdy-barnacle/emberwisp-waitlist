(function() {
  // Get configuration from data attributes or use defaults
  const form = document.getElementById('waitlist-signup');
  if (!form) return;

  const formContainer = form.closest('.waitlist-form');
  const API_URL = formContainer?.dataset.apiUrl || form.dataset.apiUrl || 'https://your-waitlist-api.vercel.app/api/subscribe';
  const SOURCE = formContainer?.dataset.source || form.dataset.source || 'website';
  const TURNSTILE_SITE_KEY = formContainer?.dataset.turnstileSiteKey || form.dataset.turnstileSiteKey || '';
  const PRIVACY_POLICY_URL = formContainer?.dataset.privacyPolicyUrl || form.dataset.privacyPolicyUrl || '';

  const emailInput = document.getElementById('waitlist-email');
  const submitBtn = document.getElementById('waitlist-submit');
  const buttonText = submitBtn?.querySelector('.waitlist-form__button-text');
  const buttonLoading = submitBtn?.querySelector('.waitlist-form__button-loading');
  const message = document.getElementById('waitlist-message');
  const consentContainer = document.getElementById('waitlist-consent');
  const consentCheckbox = document.getElementById('waitlist-consent-checkbox');
  const privacyLink = document.getElementById('waitlist-privacy-link');

  if (!emailInput || !submitBtn || !message) return;

  // Setup privacy policy and consent checkbox
  if (PRIVACY_POLICY_URL && consentContainer && privacyLink) {
    privacyLink.href = PRIVACY_POLICY_URL;
    consentContainer.style.display = 'block';
  }

  let turnstileToken = null;
  let turnstileWidgetId = null;

  // Initialize Turnstile if enabled
  if (TURNSTILE_SITE_KEY) {
    // Wait for Turnstile to load
    function initTurnstile() {
      if (typeof turnstile !== 'undefined') {
        const container = document.getElementById('turnstile-container');
        if (container) {
          turnstileWidgetId = turnstile.render('#turnstile-container', {
            sitekey: TURNSTILE_SITE_KEY,
            callback: function(token) {
              turnstileToken = token;
            },
            'expired-callback': function() {
              turnstileToken = null;
            },
            'error-callback': function() {
              turnstileToken = null;
              showMessage('Captcha error. Please refresh and try again.', 'error');
            },
          });
        }
      } else {
        // Retry after a short delay
        setTimeout(initTurnstile, 100);
      }
    }
    
    if (document.readyState === 'complete') {
      initTurnstile();
    } else {
      window.addEventListener('load', initTurnstile);
    }
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    emailInput.disabled = isLoading;
    if (buttonText) buttonText.style.display = isLoading ? 'none' : 'inline';
    if (buttonLoading) buttonLoading.style.display = isLoading ? 'inline' : 'none';
  }

  function showMessage(text, type = 'success') {
    message.textContent = text;
    message.className = 'waitlist-form__message waitlist-form__message--' + type;
  }

  function resetTurnstile() {
    if (TURNSTILE_SITE_KEY && turnstileWidgetId !== null && typeof turnstile !== 'undefined') {
      turnstile.reset(turnstileWidgetId);
      turnstileToken = null;
    }
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email) return;

    // Check consent checkbox if privacy policy is provided
    if (PRIVACY_POLICY_URL && consentCheckbox && !consentCheckbox.checked) {
      showMessage('Please agree to the Privacy Policy to continue.', 'error');
      return;
    }

    // Check captcha if enabled
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      showMessage('Please complete the captcha verification.', 'error');
      return;
    }

    setLoading(true);
    message.textContent = '';

    try {
      const body = { email, source: SOURCE };
      
      // Add captcha token if enabled
      if (TURNSTILE_SITE_KEY && turnstileToken) {
        body.turnstileToken = turnstileToken;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if double opt-in is required
        if (data.requiresConfirmation) {
          showMessage(data.message || 'Please check your inbox to confirm your email.', 'info');
        } else {
          showMessage(data.message || "You're on the list!", 'success');
        }
        emailInput.value = '';
        
        // Reset consent checkbox if present
        if (consentCheckbox) {
          consentCheckbox.checked = false;
        }
        
        // Track signup event
        if (typeof gtag !== 'undefined') {
          gtag('event', 'waitlist_signup', { source: SOURCE });
        }
      } else if (response.status === 409) {
        // Already subscribed
        showMessage(data.message || "You're already on the waitlist!", 'success');
      } else if (response.status === 429) {
        // Rate limited
        showMessage(data.message || 'Too many requests. Please try again later.', 'error');
      } else if (data.error === 'captcha_required' || data.error === 'captcha_failed') {
        showMessage(data.message || 'Captcha verification failed.', 'error');
        resetTurnstile();
      } else {
        showMessage(data.error || 'Something went wrong. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Waitlist signup error:', error);
      showMessage('Unable to connect. Please try again later.', 'error');
    } finally {
      setLoading(false);
      // Reset captcha for next attempt
      if (!emailInput.value) {
        resetTurnstile();
      }
    }
  });
})();

