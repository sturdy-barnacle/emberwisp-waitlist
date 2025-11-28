// API route to serve the test unsubscribe error page

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEST - Unsubscribe Error</title>
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
      <h1>Unsubscribe Failed</h1>
      
      <div id="error-message">
        <p>We couldn't process your unsubscribe request. This can happen if:</p>
        <ul>
          <li>The unsubscribe link is invalid or expired</li>
          <li>You've already been unsubscribed</li>
          <li>There was a temporary server error</li>
        </ul>
      </div>
      
      <p>If you continue to receive emails, please contact support.</p>
      
      <a href="/local-test/test-form.html" class="error-button">Back to Test Form</a>
    </div>
  </div>

  <script>
    // Show specific error message based on URL param
    (function() {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason');
      
      const messages = {
        'missing-params': 'The unsubscribe link appears to be incomplete.',
        'database-error': 'We had trouble updating your preferences. Please try again.',
        'server-error': 'Our server encountered an error. Please try again later.',
      };
      
      if (reason && messages[reason]) {
        const messageDiv = document.getElementById('error-message');
        messageDiv.innerHTML = '<p>' + messages[reason] + '</p>';
      }
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}

