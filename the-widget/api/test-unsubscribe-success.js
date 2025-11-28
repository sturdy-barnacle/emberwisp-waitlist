// API route to serve the test unsubscribe success page

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEST - Unsubscribed Successfully</title>
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
      <div class="confirmation-icon">✅</div>
      <h1>Unsubscribed Successfully</h1>
      <p>You have been successfully unsubscribed from our email list.</p>
      <p>You will no longer receive emails from us.</p>
      <a href="/local-test/test-form.html" class="confirmation-button">Back to Test Form</a>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}

