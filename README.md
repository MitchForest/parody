# Website Parody Generator

Transform any website into hilarious parodies using AI! Enter a URL, pick a comedy style, and watch as GPT-4o transforms the content into something completely different but structurally similar.

## Features

- **5 Parody Styles**: Corporate buzzwords, Gen Z slang, medieval language, infomercial madness, and conspiracy theories
- **AI-Powered**: Uses GPT-4o for intelligent content transformation
- **Website Capture**: Automatically captures and analyzes any website
- **HTML Output**: Generates downloadable HTML parodies
- **Optional AI Images**: Creates shareable parody images with Replicate SDXL

## Quick Start

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Configure environment variables** in `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   REPLICATE_API_TOKEN=your_replicate_token_here  # Optional
   BROWSERLESS_API_KEY=your_browserless_api_key_here
   ```

3. **Run the development server**:
   ```bash
   bun run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** and start creating parodies!

## How It Works

1. **Website Capture**: Uses [Browserless.io](https://browserless.io) to capture screenshots and HTML content
2. **Content Extraction**: Parses HTML with Cheerio to extract text, headings, navigation, etc.
3. **AI Transformation**: GPT-4o transforms content into the selected parody style
4. **HTML Generation**: Creates a styled HTML page with the parody content
5. **Optional Image**: Generates a shareable image version using Replicate SDXL

## Parody Styles

- **Corporate Buzzword Overload**: Synergize, leverage, circle back, take this offline
- **Gen Z Brain Rot**: No cap, fr fr, it's giving, slay, bussin, Ohio, skibidi  
- **Medieval Times**: Thee, thou, verily, forsooth, mine liege
- **Infomercial Madness**: BUT WAIT THERE'S MORE! Call now! Only $19.99!
- **Conspiracy Theorist**: They don't want you to know, wake up sheeple

## API Usage

Send a POST request to `/api/generate-parody`:

```javascript
const response = await fetch('/api/generate-parody', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    style: 'corporate-buzzword'
  })
});

const result = await response.json();
// Returns: { success, html, imageUrl?, summary, ... }
```

## Tech Stack

- **Next.js 15** - React framework
- **OpenAI GPT-4o** - Content transformation
- **Browserless.io** - Website capture
- **Cheerio** - HTML parsing
- **Replicate SDXL** - Image generation (optional)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Cost Breakdown

- **Browserless.io**: $99/month (5,000 screenshots)
- **OpenAI GPT-4o**: ~$0.015 per generation
- **Replicate SDXL**: ~$0.0032 per image (optional)
- **Total per parody**: ~$0.02 + hosting

## Examples

Try these URLs to see the parody generator in action:

- `https://stripe.com` → Corporate buzzword paradise
- `https://github.com` → Gen Z developer vibes
- `https://apple.com` → Medieval technology shoppe
- `https://amazon.com` → Infomercial marketplace madness

## Environment Setup

### Required APIs:

1. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com)
2. **Browserless.io API Key**: Sign up at [browserless.io](https://browserless.io)
3. **Replicate API Token** (optional): Get from [replicate.com](https://replicate.com)

### Development Commands:

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
```

## License

MIT License - feel free to parody responsibly! 🎭
