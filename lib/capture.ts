export interface CaptureResult {
  screenshot: Buffer;
  html: string;
}

export async function captureWebsite(url: string): Promise<CaptureResult> {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  
  if (!apiKey) {
    throw new Error('BROWSERLESS_API_KEY is not configured');
  }

  // Take screenshot
  const screenshotResponse = await fetch('https://chrome.browserless.io/screenshot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      url: url,
      options: {
        fullPage: true,
        type: 'png'
      }
    })
  });

  if (!screenshotResponse.ok) {
    throw new Error(`Screenshot failed: ${screenshotResponse.statusText}`);
  }

  const screenshot = Buffer.from(await screenshotResponse.arrayBuffer());

  // Get HTML content
  const contentResponse = await fetch('https://chrome.browserless.io/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ url })
  });

  if (!contentResponse.ok) {
    throw new Error(`Content extraction failed: ${contentResponse.statusText}`);
  }

  const html = await contentResponse.text();

  return { screenshot, html };
}
