export interface CaptureResult {
  screenshot: Buffer;
  html: string;
}

function normalizeUrl(url: string): string {
  // Add https:// if no protocol specified
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

export async function captureWebsite(url: string): Promise<CaptureResult> {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  
  if (!apiKey) {
    throw new Error('BROWSERLESS_API_KEY is not configured');
  }

  const normalizedUrl = normalizeUrl(url);
  console.log('Capturing URL:', normalizedUrl);

  // Take screenshot
  const screenshotResponse = await fetch('https://chrome.browserless.io/screenshot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      url: normalizedUrl,
      options: {
        fullPage: true,
        type: 'png',
        waitForTimeout: 3000
      }
    })
  });

  if (!screenshotResponse.ok) {
    const errorText = await screenshotResponse.text();
    console.error('Screenshot API Error:', errorText);
    throw new Error(`Screenshot failed: ${screenshotResponse.status} ${screenshotResponse.statusText} - ${errorText}`);
  }

  const screenshot = Buffer.from(await screenshotResponse.arrayBuffer());

  // Get HTML content
  const contentResponse = await fetch('https://chrome.browserless.io/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ 
      url: normalizedUrl,
      waitForTimeout: 3000
    })
  });

  if (!contentResponse.ok) {
    const errorText = await contentResponse.text();
    console.error('Content API Error:', errorText);
    throw new Error(`Content extraction failed: ${contentResponse.status} ${contentResponse.statusText} - ${errorText}`);
  }

  const html = await contentResponse.text();

  return { screenshot, html };
}
