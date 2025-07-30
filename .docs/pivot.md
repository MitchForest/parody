# Portfolio Roaster Pivot Plan

## Executive Summary
Pivoting from a general website parody generator to a specialized **Portfolio Roaster** - a comedic critique tool for tech portfolio websites. Users input a portfolio URL, click "Roast", and receive an AI-generated roast that's read aloud with text-to-speech.

## Tech Stack
- **Frontend**: Next.js 15 (existing), simplified UI
- **Content Scraping**: Browserless API (existing integration)
- **AI Roasting**: OpenAI GPT-4o (new integration)
- **Text-to-Speech**: ElevenLabs API (new integration)
- **Deployment**: Vercel (existing)

## Architecture Overview

```
User Input (URL) → Browserless (Scrape) → OpenAI (Roast) → ElevenLabs (TTS) → Audio Playback
```

## Implementation Plan

### Phase 1: UI Simplification
1. **Remove existing complexity**
   - Strip out parody styles selector
   - Remove image transformation features
   - Remove site reconstruction logic
   - Remove multiple display modes

2. **New minimal UI**
   - Single input field for portfolio URL
   - One "Roast Me" button
   - Audio player for roast playback
   - Visual feedback during processing

### Phase 2: Backend Refactoring

#### 2.1 Content Extraction
```typescript
// Simplified extraction focused on portfolio content
interface PortfolioContent {
  name: string;
  tagline: string;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  skills: string[];
  aboutMe: string;
  socialLinks: string[];
}
```

#### 2.2 OpenAI Integration
```typescript
// Roast generation with GPT-4o
const generateRoast = async (content: PortfolioContent): Promise<string> => {
  const prompt = `
    You are a savage tech comedy roaster. Analyze this developer portfolio and create a hilarious, brutal roast.
    
    Context:
    - Name: ${content.name}
    - Tagline: ${content.tagline}
    - Projects: ${JSON.stringify(content.projects)}
    - Skills: ${content.skills.join(', ')}
    - About: ${content.aboutMe}
    
    Guidelines:
    - Be brutally funny but not genuinely mean-spirited
    - Reference current tech culture, memes, and zeitgeist
    - Mock their tech stack choices, project names, buzzwords
    - Comment on overused portfolio clichés
    - Include jokes about their GitHub contribution graph if visible
    - Reference trending tech Twitter debates
    - Keep it adult-level humor but not offensive
    - 60-90 seconds when read aloud
    - End with a backhanded compliment
  `;
  
  // Call OpenAI API
  return await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 500
  });
};
```

#### 2.3 ElevenLabs Integration
```typescript
// Text-to-speech with comedic voice
const generateAudio = async (roastText: string): Promise<Buffer> => {
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/{voice_id}', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: roastText,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5, // Add some personality
        use_speaker_boost: true
      }
    })
  });
  
  return Buffer.from(await response.arrayBuffer());
};
```

### Phase 3: API Endpoint

```typescript
// /api/roast
export async function POST(req: NextRequest) {
  const { url } = await req.json();
  
  // 1. Scrape portfolio content
  const html = await browserlessCapture(url);
  const content = extractPortfolioContent(html);
  
  // 2. Generate roast
  const roastText = await generateRoast(content);
  
  // 3. Convert to speech
  const audioBuffer = await generateAudio(roastText);
  
  // 4. Return audio and text
  return NextResponse.json({
    roastText,
    audioUrl: `data:audio/mp3;base64,${audioBuffer.toString('base64')}`,
    portfolioName: content.name
  });
}
```

### Phase 4: Frontend Implementation

```tsx
// Simplified main page
export default function RoastPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState<{
    text: string;
    audioUrl: string;
  } | null>(null);
  
  const handleRoast = async () => {
    setLoading(true);
    const response = await fetch('/api/roast', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    setRoast(data);
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-2xl w-full p-8">
        <h1 className="text-6xl font-bold text-red-500 mb-8 text-center">
          Portfolio Roaster 🔥
        </h1>
        
        <input
          type="url"
          placeholder="Enter portfolio URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-4 text-xl bg-gray-900 text-white rounded-lg mb-6"
        />
        
        <button
          onClick={handleRoast}
          disabled={loading || !url}
          className="w-full p-6 bg-red-600 text-white text-2xl font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Generating Roast...' : 'ROAST ME 🔥'}
        </button>
        
        {roast && (
          <div className="mt-8">
            <audio controls autoPlay className="w-full mb-4">
              <source src={roast.audioUrl} type="audio/mp3" />
            </audio>
            <p className="text-gray-300 text-lg">{roast.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Example Roast Output

> "Oh look, another 'Full Stack Developer' who put React, Node, and MongoDB on their resume. How original! I see you're a 'passionate problem solver' - did you solve the problem of having a personality? Your portfolio has more generic stock photos than a medical brochure. 
>
> Three Todo apps and a weather widget? Slow down there, Zuckerberg! And that 'innovative e-commerce platform'? It's literally a Shopify template with a different color scheme. 
>
> I love how you list 'Git' as a skill. Congratulations on knowing how to save files! Next you'll be listing 'breathing' and 'turning on computer.' 
>
> Your About Me section says you 'love clean code' but your GitHub shows 47 commits titled 'fixed stuff' and 'asdfasdf.' The only thing consistent about your code style is its inconsistency.
>
> But hey, at least you're brave enough to put yourself out there. That takes more courage than your color choices, which scream 'I discovered gradients yesterday and I'm making it everyone's problem.'"

## Content Extraction Strategy

Focus on extracting:
1. **Hero Section**: Name, title, tagline
2. **Projects**: Names, descriptions, tech stacks
3. **Skills**: Listed technologies, buzzwords
4. **About**: Personal descriptions, interests
5. **Design Elements**: Color schemes, fonts, animations
6. **Social Proof**: GitHub stats, testimonials
7. **Clichés**: "Passionate", "Problem solver", "Clean code"

## Roast Templates & Patterns

### Tech Stack Roasts
- "Another MERN stack developer? In 2024? It's giving 2019 bootcamp graduate"
- "TypeScript everywhere? Tell me you're overcompensating without telling me"
- "Still using jQuery in 2024? Your portfolio is older than some JavaScript frameworks"

### Project Roasts
- "A Todo app, a weather app, AND a calculator? The holy trinity of tutorial hell"
- "Your 'Netflix clone' has less features than actual Netflix had in 2007"
- "Calling a CRUD app an 'innovative platform' is like calling a bicycle a 'transportation solution'"

### Design Roasts
- "This gradient abuse should be a criminal offense"
- "Dark mode isn't a personality trait"
- "Your parallax scrolling is making me more nauseous than your code quality"

### About Me Roasts
- "Self-taught developer' means 'I watched YouTube tutorials'"
- "Passionate about clean code' but commits look like keyboard smashing"
- "Love learning new technologies' = 'I have 47 unfinished side projects'"

## Voice Selection (ElevenLabs)

Recommend using a voice with:
- Slight sarcasm capability
- Clear articulation for technical terms
- Comedic timing ability
- Not too robotic, needs personality

## Error Handling

```typescript
// Graceful failures with humor
const errorMessages = {
  scraping: "Can't access the portfolio. Is it hosted on localhost? 😏",
  parsing: "This portfolio broke our parser. That's... actually impressive.",
  ai: "Even AI refuses to roast this. It's either too good or too bad.",
  audio: "Speech synthesis failed. Some roasts are better left unspoken."
};
```

## MVP Features
1. URL input validation (must be accessible website)
2. Loading state with snarky messages
3. Text display with audio playback
4. Share button for social media
5. "Roast Again" for variations

## Future Enhancements
1. Roast intensity levels (Mild, Medium, Scorching)
2. Multiple voice options
3. Video roasts with animated avatar
4. Save favorite roasts
5. Leaderboard of most roasted portfolios
6. Category-specific roasts (designer, backend, frontend)

## Environment Variables
```env
BROWSERLESS_API_KEY=existing
OPENAI_API_KEY=new
ELEVENLABS_API_KEY=new
```

## Testing Strategy
1. Test with popular portfolio templates
2. Ensure appropriate content filtering
3. Audio quality checks
4. Rate limiting to prevent abuse
5. Error state testing

## Launch Checklist
- [ ] Remove old parody code
- [ ] Implement new UI
- [ ] Integrate OpenAI
- [ ] Integrate ElevenLabs
- [ ] Test with 10+ real portfolios
- [ ] Add content moderation
- [ ] Deploy to production
- [ ] Create demo video
- [ ] Prepare social media assets