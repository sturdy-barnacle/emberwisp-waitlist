// API route to serve the local test index page at root URL
// This makes http://localhost:3000/ show the test hub

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Local Testing - Waitlist Widget</title>
  <style>
    body {
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    
    h1 {
      color: #222;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 10px;
    }
    
    .status {
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .status.success {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      color: #065f46;
    }
    
    .status.warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    
    .status.error {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }
    
    .test-link {
      display: inline-block;
      margin: 10px 0;
      padding: 12px 24px;
      background: #4f46e5;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: background-color 0.15s;
    }
    
    .test-link:hover {
      background: #4338ca;
    }
    
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .section h2 {
      margin-top: 0;
      color: #444;
    }
    
    code {
      background: #e8e8e8;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
      font-family: 'Monaco', 'Courier New', monospace;
    }
    
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <h1>🧪 Local Testing Hub</h1>
  
  <div class="status success" id="server-status">
    <strong>✓ Server Running</strong>
    <p>If you can see this page, the dev server is working!</p>
  </div>
  
  <div class="section">
    <h2>Quick Test</h2>
    <p>Test the waitlist form:</p>
    <a href="/local-test/test-form.html" class="test-link">Open Test Form →</a>
  </div>
  
  <div class="section">
    <h2>Test Pages</h2>
    <ul>
      <li><strong>Test Form:</strong> <a href="/local-test/test-form.html">/local-test/test-form.html</a></li>
      <li><strong>Confirmation Success:</strong> <a href="/test-waitlist-confirmed">/test-waitlist-confirmed</a></li>
      <li><strong>Confirmation Error:</strong> <a href="/test-waitlist-error">/test-waitlist-error</a></li>
      <li><strong>Unsubscribe Success:</strong> <a href="/test-unsubscribe-success">/test-unsubscribe-success</a></li>
      <li><strong>Unsubscribe Error:</strong> <a href="/test-unsubscribe-error">/test-unsubscribe-error</a></li>
    </ul>
  </div>
  
  <div class="section">
    <h2>Testing Flow</h2>
    <ol>
      <li>Open the <a href="/local-test/test-form.html">test form</a></li>
      <li>Submit your email address</li>
      <li>Check your inbox for a confirmation email</li>
      <li>Click the confirmation link in the email</li>
      <li>You should be redirected to <code>/test-waitlist-confirmed</code></li>
      <li>Check for a welcome email</li>
    </ol>
  </div>
  
  <div class="section">
    <h2>Environment Check</h2>
    <p>Make sure your <code>.env.local</code> file has:</p>
    <ul>
      <li><code>SUPABASE_URL</code> - Your Supabase project URL</li>
      <li><code>SUPABASE_SERVICE_KEY</code> - Your Supabase service role key</li>
      <li><code>RESEND_API_KEY</code> - Your Resend API key</li>
      <li><code>FROM_EMAIL</code> - Email from your verified Resend domain</li>
      <li><code>BASE_URL=http://localhost:3000</code> - <strong>Must use http:// (not https://)</strong></li>
      <li><code>CONFIRM_SUCCESS_URL=/test-waitlist-confirmed</code> - Success page URL</li>
      <li><code>CONFIRM_ERROR_URL=/test-waitlist-error</code> - Error page URL</li>
    </ul>
  </div>
  
  <div class="section">
    <h2>API Endpoints</h2>
    <ul>
      <li><code>POST /api/subscribe</code> - Sign up for waitlist</li>
      <li><code>GET /api/confirm?token=...</code> - Confirm email</li>
      <li><code>GET /api/unsubscribe?token=...</code> - Unsubscribe</li>
    </ul>
  </div>
  
  <div class="section">
    <h2>Need Help?</h2>
    <p>See <code>local-test/README.md</code> for detailed testing instructions and troubleshooting.</p>
  </div>
  
  <script>
    // Check if server is responding
    fetch('/api/subscribe', { method: 'OPTIONS' })
      .then(() => {
        // Server is up
      })
      .catch(() => {
        const status = document.getElementById('server-status');
        status.className = 'status error';
        status.innerHTML = '<strong>✗ Server Not Responding</strong><p>Make sure <code>npm run start:dev</code> is running in the <code>the-widget</code> directory.</p>';
      });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}

