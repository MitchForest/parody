import { CaptureResult } from './capture';

export interface CaptureStrategy {
  name: string;
  execute: (url: string) => Promise<CaptureResult>;
  priority: number;
}

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

// Strategy 1: Browserless.io (Primary)
async function browserlessCapture(url: string): Promise<CaptureResult> {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) throw new Error('BROWSERLESS_API_KEY not configured');

  const normalizedUrl = normalizeUrl(url);
  console.log('[Browserless] Capturing:', normalizedUrl);

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
    throw new Error(`Browserless screenshot failed: ${screenshotResponse.status}`);
  }

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
    throw new Error(`Browserless content failed: ${contentResponse.status}`);
  }

  const screenshot = Buffer.from(await screenshotResponse.arrayBuffer());
  const html = await contentResponse.text();

  return { screenshot, html };
}

// Strategy 2: ScreenshotAPI (Secondary)
async function screenshotApiCapture(url: string): Promise<CaptureResult> {
  const normalizedUrl = normalizeUrl(url);
  console.log('[ScreenshotAPI] Capturing:', normalizedUrl);

  // Get HTML first
  const htmlResponse = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!htmlResponse.ok) {
    throw new Error(`Failed to fetch HTML: ${htmlResponse.status}`);
  }

  const html = await htmlResponse.text();

  // Use ScreenshotAPI for screenshot
  const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=YOUR_TOKEN&url=${encodeURIComponent(normalizedUrl)}&full_page=true&fresh=true&output=image&file_type=png&wait_for_event=load`;
  
  const screenshotResponse = await fetch(screenshotUrl);
  
  if (!screenshotResponse.ok) {
    throw new Error(`ScreenshotAPI failed: ${screenshotResponse.status}`);
  }

  const screenshot = Buffer.from(await screenshotResponse.arrayBuffer());
  return { screenshot, html };
}

// Strategy 3: HTML-only fallback with dummy screenshot
async function htmlOnlyCapture(url: string): Promise<CaptureResult> {
  const normalizedUrl = normalizeUrl(url);
  console.log('[HTML-Only] Capturing:', normalizedUrl);

  const response = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`HTML fetch failed: ${response.status}`);
  }

  const html = await response.text();
  
  // Create a better dummy screenshot - a simple webpage mockup
  const dummyScreenshot = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x03, 0x00,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x25, 0xDB, 0x56, 0xCA, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  return { screenshot: dummyScreenshot, html };
}

// Strategy 4: Template-based emergency fallback
async function templateBasedCapture(url: string): Promise<CaptureResult> {
  console.log('[Template] Emergency fallback for:', url);
  
  const templateHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Website Preview</title>
      <meta charset="UTF-8">
    </head>
    <body>
      <h1>Website: ${url}</h1>
      <p>This is a template-based capture fallback.</p>
      <p>The original website content could not be fetched.</p>
      <p>This will still generate a parody based on the URL and site type.</p>
    </body>
    </html>
  `;

  const dummyScreenshot = Buffer.from('mock-screenshot');
  
  return {
    screenshot: dummyScreenshot,
    html: templateHtml
  };
}

// Configure capture strategies in priority order
export const captureStrategies: CaptureStrategy[] = [
  { name: 'browserless', execute: browserlessCapture, priority: 1 },
  { name: 'screenshotapi', execute: screenshotApiCapture, priority: 2 },
  { name: 'html-only', execute: htmlOnlyCapture, priority: 3 },
  { name: 'template', execute: templateBasedCapture, priority: 4 }
];

// Main capture function that tries strategies in order
export async function captureWithFallbacks(url: string): Promise<CaptureResult & { strategy: string }> {
  let lastError: Error | null = null;

  for (const strategy of captureStrategies) {
    try {
      console.log(`Trying strategy: ${strategy.name}`);
      const result = await strategy.execute(url);
      console.log(`✅ Success with strategy: ${strategy.name}`);
      return { ...result, strategy: strategy.name };
    } catch (error) {
      console.warn(`❌ Strategy ${strategy.name} failed:`, error);
      lastError = error as Error;
      continue;
    }
  }

  throw new Error(`All capture strategies failed. Last error: ${lastError?.message}`);
}
