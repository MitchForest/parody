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

  // Take screenshot - FIXED: Use token in URL, not Bearer header
  const screenshotResponse = await fetch(`https://chrome.browserless.io/screenshot?token=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({
      url: normalizedUrl,
      fullPage: true,
      type: 'png',
      waitForTimeout: 5000,
      blockAds: true
    })
  });

  if (!screenshotResponse.ok) {
    const errorText = await screenshotResponse.text();
    console.error('Screenshot API Error:', errorText);
    throw new Error(`Screenshot failed: ${screenshotResponse.status} ${screenshotResponse.statusText} - ${errorText}`);
  }

  const screenshot = Buffer.from(await screenshotResponse.arrayBuffer());

  // Get HTML content - FIXED: Use token in URL
  const contentResponse = await fetch(`https://chrome.browserless.io/content?token=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({ 
      url: normalizedUrl,
      waitForTimeout: 5000
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
