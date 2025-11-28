// API route to serve the test confirmation error page
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test - Confirmation Error</title>
  <link rel="stylesheet" href="/assets/waitlist-pages.css">
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="error-page">
    <div class="error-card">
      <div class="error-icon">😕</div>
      <h1>Something went wrong</h1>
      
      <div id="error-message">
        <p>We couldn't confirm your email. This can happen if:</p>
        <ul>
          <li>The confirmation link has expired (links are valid for 24 hours)</li>
          <li>The link was already used</li>
          <li>The link was corrupted or incomplete</li>
        </ul>
      </div>
      
      <p>No worries, just sign up again and we'll send you a fresh confirmation link.</p>
      
      <a href="/local-test/test-form.html" class="error-button">Try Again</a>
    </div>
  </div>

  <script>
    // Show specific error message based on URL param
    (function() {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      
      const messages = {
        'missing_token': 'The confirmation link appears to be incomplete.',
        'invalid_token': 'This confirmation link is invalid or has already been used.',
        'expired_token': 'This confirmation link has expired. Links are valid for 24 hours.',
        'update_failed': 'We had trouble updating your signup. Please try again.',
        'server_error': 'Our server encountered an error. Please try again later.',
      };
      
      if (error && messages[error]) {
        const messageDiv = document.getElementById('error-message');
        messageDiv.innerHTML = '<p>' + messages[error] + '</p>';
      }
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}

