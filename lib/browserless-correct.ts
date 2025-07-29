// Correct Browserless implementation based on official docs
import { CaptureResult } from './capture';

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

// CORRECT Browserless.io implementation using official docs format
export async function browserlessCapture(url: string): Promise<CaptureResult> {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) throw new Error('BROWSERLESS_API_KEY not configured');

  const normalizedUrl = normalizeUrl(url);
  console.log('[Browserless] Capturing:', normalizedUrl);

  // CORRECT format: https://production-sfo.browserless.io/screenshot?token=YOUR_TOKEN
  const screenshotResponse = await fetch(`https://production-sfo.browserless.io/screenshot?token=${apiKey}`, {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: normalizedUrl,
      options: {
        fullPage: true,
        type: 'png'
      }
    })
  });

  if (!screenshotResponse.ok) {
    const errorText = await screenshotResponse.text();
    throw new Error(`Browserless screenshot failed: ${screenshotResponse.status} - ${errorText.substring(0, 200)}`);
  }

  const screenshot = Buffer.from(await screenshotResponse.arrayBuffer());

  // Get HTML content using correct production endpoint
  const contentResponse = await fetch(`https://production-sfo.browserless.io/content?token=${apiKey}`, {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: normalizedUrl
    })
  });

  if (!contentResponse.ok) {
    const errorText = await contentResponse.text();
    throw new Error(`Content extraction failed: ${contentResponse.status} - ${errorText.substring(0, 200)}`);
  }

  const html = await contentResponse.text();

  return { screenshot, html };
}
