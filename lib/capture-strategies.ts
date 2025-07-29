import { CaptureResult } from './capture';
import { browserlessCapture } from './browserless-correct';

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

// NOTE: Browserless function now imported from browserless-correct.ts

// Strategy 2: Playwright-based local capture (Secondary)
async function playwrightCapture(url: string): Promise<CaptureResult> {
  throw new Error('Playwright capture not implemented yet - use html-only fallback');
}

// Strategy 3: Enhanced HTML-only capture with CORS handling
async function htmlOnlyCapture(url: string): Promise<CaptureResult> {
  const normalizedUrl = normalizeUrl(url);
  console.log('[HTML-Only] Capturing:', normalizedUrl);

  // Try multiple approaches to get HTML
  const fetchStrategies = [
    // Strategy 1: Direct fetch
    () => fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }),
    // Strategy 2: Via CORS proxy (for blocked sites)
    () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(normalizedUrl)}`),
    // Strategy 3: Via another CORS proxy
    () => fetch(`https://corsproxy.io/?${encodeURIComponent(normalizedUrl)}`)
  ];

  let html = '';
  let success = false;

  for (const [index, strategy] of fetchStrategies.entries()) {
    try {
      console.log(`[HTML-Only] Trying fetch strategy ${index + 1}`);
      const response = await strategy();
      
      if (!response.ok) continue;
      
      if (index === 1) {
        // AllOrigins proxy response
        const data = await response.json();
        html = data.contents;
      } else {
        // Direct fetch or corsproxy
        html = await response.text();
      }
      
      if (html && html.length > 100) {
        success = true;
        console.log(`✅ [HTML-Only] Success with strategy ${index + 1}`);
        break;
      }
    } catch (error) {
      console.warn(`[HTML-Only] Strategy ${index + 1} failed:`, error);
    }
  }

  if (!success || !html) {
    throw new Error('All HTML fetch strategies failed');
  }
  
  // Create a realistic 1024x768 dummy screenshot
  const createDummyScreenshot = () => {
    // This creates a minimal valid PNG with website-like dimensions
    const width = 1024;
    const height = 768;
    
    // Create basic PNG header for a 1024x768 white image
    return Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x04, 0x00, 0x03, 0x00, // Width: 1024, Height: 768
      0x08, 0x02, 0x00, 0x00, 0x00, // 8-bit RGB
      0x9C, 0x6D, 0x20, 0x21, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length  
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x1D, 0x01, 0x01, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, // IDAT data
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
    ]);
  };

  return { 
    screenshot: createDummyScreenshot(), 
    html 
  };
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
// NOTE: Browserless is now WORKING with correct format! Setting as primary
export const captureStrategies: CaptureStrategy[] = [
  { name: 'browserless', execute: browserlessCapture, priority: 1 },
  { name: 'html-only', execute: htmlOnlyCapture, priority: 2 },
  { name: 'playwright', execute: playwrightCapture, priority: 3 },
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
