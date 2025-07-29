# Parody Site Generator - Final Technical Stack & Implementation

## Your Exact Tech Stack (All Decisions Made)

### Core Services
1. **Screenshot Service: Browserless.io** ($99/month for 5,000 screenshots)
   - No self-hosting needed
   - Simple API
   - Handles all browser complexity

2. **AI Models:**
   - **OpenAI GPT-4o** for content transformation (best quality)
   - **OpenAI GPT-4 Vision** for understanding website layouts
   - **Replicate SDXL** for generating parody images (optional feature)

3. **Content Extraction: Run Cheerio in your Next.js API**
   - Simple npm package
   - No hosting needed
   - Runs server-side

## The Complete Flow (What Actually Happens)

### Step 1: User Enters URL
```typescript
// User types: "https://mitchforest.com"
// Your frontend sends to your API
```

### Step 2: Capture Website (Using Browserless.io)
```typescript
// app/api/capture/route.ts
async function captureWebsite(url: string) {
  // Take screenshot
  const screenshotResponse = await fetch('https://chrome.browserless.io/screenshot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BROWSERLESS_API_KEY}`
    },
    body: JSON.stringify({
      url: url,
      options: {
        fullPage: true,
        type: 'png'
      }
    })
  });
  
  const screenshot = await screenshotResponse.buffer();
  
  // Also get the HTML content
  const contentResponse = await fetch('https://chrome.browserless.io/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BROWSERLESS_API_KEY}`
    },
    body: JSON.stringify({ url })
  });
  
  const html = await contentResponse.text();
  
  return { screenshot, html };
}
```

### Step 3: Extract Content Structure
```typescript
// Use Cheerio to parse HTML
import * as cheerio from 'cheerio';

function extractContent(html: string) {
  const $ = cheerio.load(html);
  
  return {
    title: $('title').text(),
    headings: {
      h1: $('h1').map((_, el) => $(el).text()).get(),
      h2: $('h2').map((_, el) => $(el).text()).get(),
      h3: $('h3').map((_, el) => $(el).text()).get(),
    },
    paragraphs: $('p').map((_, el) => $(el).text()).get(),
    navigation: $('nav a, header a').map((_, el) => ({
      text: $(el).text(),
      href: $(el).attr('href')
    })).get(),
    buttons: $('button, .button, .btn').map((_, el) => $(el).text()).get(),
    images: $('img').map((_, el) => ({
      alt: $(el).attr('alt'),
      src: $(el).attr('src')
    })).get()
  };
}
```

### Step 4: Transform with GPT-4o
```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateParody(content: ExtractedContent, style: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a comedy writer who creates parody versions of websites. 
                  Transform the content to match the ${style} style perfectly.`
      },
      {
        role: "user",
        content: `Transform this website content into ${style} style:
        
        Title: ${content.title}
        H1s: ${content.headings.h1.join(', ')}
        H2s: ${content.headings.h2.join(', ')}
        Paragraphs: ${content.paragraphs.join('\n')}
        Navigation: ${content.navigation.map(n => n.text).join(', ')}
        Buttons: ${content.buttons.join(', ')}
        
        Return as JSON with the same structure but transformed content.
        Make it funny and exaggerated but keep the same information architecture.`
      }
    ],
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### Step 5: Generate Final Output
```typescript
// Option A: Generate as HTML (Recommended)
function generateHTML(original: ExtractedContent, parody: ParodyContent) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${parody.title}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        /* Custom styles based on parody type */
        ${generateParodyStyles(parody.style)}
      </style>
    </head>
    <body class="bg-gray-50">
      <nav class="bg-white shadow p-4">
        ${parody.navigation.map(item => 
          `<a href="#" class="mx-4 hover:text-blue-500">${item.text}</a>`
        ).join('')}
      </nav>
      
      <main class="container mx-auto p-8">
        ${parody.headings.h1.map(h1 => `<h1 class="text-4xl font-bold mb-4">${h1}</h1>`).join('')}
        ${parody.paragraphs.map(p => `<p class="mb-4">${p}</p>`).join('')}
        ${parody.buttons.map(btn => 
          `<button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">${btn}</button>`
        ).join('')}
      </main>
    </body>
    </html>
  `;
}

// Option B: Generate as Image using Replicate (For sharing)
async function generateImage(screenshot: Buffer, parodySummary: string) {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
  
  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        prompt: `Website screenshot parody: ${parodySummary}, 
                 professional web design, high quality, detailed UI`,
        negative_prompt: "blurry, low quality, distorted text",
        num_inference_steps: 30,
        guidance_scale: 7.5
      }
    }
  );
  
  return output;
}
```

## Your Parody Styles (Pre-configured)

```typescript
export const PARODY_STYLES = {
  'corporate-buzzword': {
    name: 'Corporate Buzzword Overload',
    systemPrompt: 'Transform everything into ridiculous corporate speak with maximum buzzwords',
    examples: 'synergize, leverage, circle back, take this offline, move the needle'
  },
  'gen-z-brainrot': {
    name: 'Gen Z Brain Rot',
    systemPrompt: 'Make everything sound like TikTok comments and Gen Z slang',
    examples: 'no cap, fr fr, its giving, slay, bussin, ohio, skibidi'
  },
  'medieval': {
    name: 'Medieval Times',
    systemPrompt: 'Transform into medieval/renaissance language',
    examples: 'thee, thou, verily, forsooth, mine liege'
  },
  'infomercial': {
    name: 'Infomercial Madness',
    systemPrompt: 'Make everything sound like an over-the-top infomercial',
    examples: 'BUT WAIT THERES MORE, Call now!, Only $19.99!, Limited time offer!'
  },
  'conspiracy': {
    name: 'Conspiracy Theorist',
    systemPrompt: 'Make everything sound like a conspiracy theory',
    examples: 'they dont want you to know, wake up sheeple, follow the money'
  }
};
```

## Complete Next.js Implementation

### 1. Install Dependencies
```bash
bun add openai replicate cheerio
bun add @types/cheerio -D
```

### 2. Environment Variables
```env
# .env.local
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
BROWSERLESS_API_KEY=bless_...
```

### 3. Main API Route
```typescript
// app/api/generate-parody/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { PARODY_STYLES } from '@/lib/styles';

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const { url, style } = await req.json();
  
  try {
    // 1. Capture website
    const { screenshot, html } = await captureWebsite(url);
    
    // 2. Extract content
    const content = extractContent(html);
    
    // 3. Generate parody with GPT-4o
    const parodyContent = await generateParody(content, style);
    
    // 4. Create HTML output
    const parodyHTML = generateHTML(content, parodyContent);
    
    // 5. Optional: Generate shareable image
    const shareImage = await generateImage(screenshot, parodyContent.summary);
    
    return NextResponse.json({
      success: true,
      html: parodyHTML,
      imageUrl: shareImage,
      originalUrl: url,
      style: style
    });
    
  } catch (error) {
    console.error('Parody generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate parody' },
      { status: 500 }
    );
  }
}
```

### 4. Frontend Component
```tsx
// app/page.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PARODY_STYLES } from '@/lib/styles';

export default function Home() {
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState('corporate-buzzword');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const generateParody = async () => {
    setLoading(true);
    
    const response = await fetch('/api/generate-parody', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, style })
    });
    
    const data = await response.json();
    setResult(data);
    setLoading(false);
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Website Parody Generator</h1>
      
      <div className="space-y-4 max-w-xl">
        <Input
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        
        <Select value={style} onValueChange={setStyle}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PARODY_STYLES).map(([key, style]) => (
              <SelectItem key={key} value={key}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={generateParody} 
          disabled={loading || !url}
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate Parody'}
        </Button>
      </div>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Result:</h2>
          <iframe
            srcDoc={result.html}
            className="w-full h-[600px] border rounded"
          />
          <Button className="mt-4" asChild>
            <a href={result.imageUrl} download>Download as Image</a>
          </Button>
        </div>
      )}
    </div>
  );
}
```

## Cost Breakdown (Since cost isn't an issue)

- **Browserless.io**: $99/month (5,000 screenshots)
- **OpenAI GPT-4o**: ~$0.015 per generation
- **Replicate SDXL**: ~$0.0032 per image
- **Total per parody**: ~$0.02 + hosting

## Why These Choices Are The Best

1. **Browserless.io** > Self-hosted Puppeteer
   - Zero maintenance
   - Always up-to-date Chrome
   - Handles all edge cases

2. **GPT-4o** > Other LLMs
   - Best at understanding context
   - Most creative/funny outputs
   - Reliable JSON responses

3. **Cheerio** > Complex scraping tools
   - Lightweight
   - Runs in your API
   - Easy jQuery-like syntax

4. **Replicate SDXL** > DALL-E 3
   - Better for website mockups
   - More control over style
   - Can use ControlNet for layout preservation

This is the optimal setup - easy to implement, high quality results, and no infrastructure to manage!