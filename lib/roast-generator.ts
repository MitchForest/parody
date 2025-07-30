import OpenAI from 'openai';
import { PortfolioContent } from './portfolio-extractor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRoast(content: PortfolioContent): Promise<string> {
  const cliches = content.skills.filter(s => s.startsWith('[CLICHÉ:')).map(s => s.replace('[CLICHÉ: ', '').replace(']', ''));
  const hasTodoApp = content.projects.some(p => p.name.toLowerCase().includes('todo') || p.description.toLowerCase().includes('todo'));
  const hasWeatherApp = content.projects.some(p => p.name.toLowerCase().includes('weather') || p.description.toLowerCase().includes('weather'));
  const hasCalculator = content.projects.some(p => p.name.toLowerCase().includes('calculator') || p.description.toLowerCase().includes('calculator'));
  
  const prompt = `You are a savage tech comedy roaster in the style of a Comedy Central Roast combined with tech Twitter snark. Create a BRUTAL, HILARIOUS roast of this developer's portfolio.

PORTFOLIO CONTENT:
Name: ${content.name}
Title/Role: ${content.title}
Tagline: ${content.tagline}
Projects: ${JSON.stringify(content.projects.map(p => ({ name: p.name, desc: p.description, tech: p.technologies })))}
Skills: ${content.skills.filter(s => !s.startsWith('[CLICHÉ:')).join(', ')}
Clichés found: ${cliches.join(', ')}
About: ${content.aboutMe}
Has Todo App: ${hasTodoApp}
Has Weather App: ${hasWeatherApp}
Has Calculator: ${hasCalculator}

ROASTING GUIDELINES:
- Be absolutely SAVAGE but clever - think Comedy Central Roast meets tech Twitter
- Reference specific things from their portfolio (project names, tech choices, descriptions)
- Mock their clichés and buzzwords mercilessly
- Reference current tech memes and debates (JavaScript fatigue, framework wars, etc.)
- Make fun of typical portfolio patterns (todo apps, weather apps, "passionate developer")
- Roast their tech stack choices with current context
- Include jokes about their GitHub contribution graph if they mention GitHub
- Mock any pretentious project names or descriptions
- Call out any obvious bootcamp projects
- Reference Silicon Valley culture and stereotypes
- Use tech-specific burns (npm install personality, git commit -m "fixed life", etc.)
- Be creative with programming metaphors
- Length: 25-40 seconds when read aloud (about 80-120 words MAX)
- START WITH YOUR BEST BURN - no warmup
- Pack every sentence with comedy gold
- End with a quick backhanded compliment
- Use modern slang and internet speak
- NO HOLDING BACK - this is comedy, not a code review
- CONCISE AND DEVASTATING - quality over quantity

Write the roast as a tight, punchy monologue. Every word counts. Make it GENUINELY FUNNY and BRUTAL from the first sentence.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a savage comedy roaster specializing in tech portfolios. Your style is brutal but clever, mixing technical knowledge with comedy central roast-style humor."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 300, // Reduced for shorter roasts
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const roast = response.choices[0]?.message?.content || "This portfolio is so bad, even AI refused to roast it.";
    
    // Clean up any potential formatting
    return roast.trim().replace(/\n\n+/g, '\n\n');
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate roast');
  }
}