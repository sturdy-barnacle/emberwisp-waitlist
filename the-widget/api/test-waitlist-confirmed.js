// API route to serve the test confirmation success page
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEST - Welcome to the Waitlist</title>
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
  <div class="confirmation-page">
    <div class="confirmation-card">
      <div class="confirmation-icon">🎉</div>
      <h1>You're confirmed!</h1>
      <p>Thanks for confirming your email. You're officially on the list.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <a href="/local-test/test-form.html" class="confirmation-button">Back to Test Form</a>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}

