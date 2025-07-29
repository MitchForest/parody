import OpenAI from 'openai';
import { ExtractedContent } from './extract';
import { PARODY_STYLES, ParodyStyleKey } from './styles';

export interface ParodyContent {
  title: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  paragraphs: string[];
  navigation: Array<{
    text: string;
    href?: string;
  }>;
  buttons: string[];
  summary: string;
  style: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateParody(content: ExtractedContent, style: ParodyStyleKey): Promise<ParodyContent> {
  const styleConfig = PARODY_STYLES[style];
  
  if (!styleConfig) {
    throw new Error(`Unknown parody style: ${style}`);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a comedy writer who creates parody versions of websites. 
                  Transform the content to match the ${styleConfig.name} style perfectly.
                  ${styleConfig.systemPrompt}
                  
                  Examples of this style: ${styleConfig.examples}`
      },
      {
        role: "user",
        content: `Transform this website content into ${styleConfig.name} style:
        
        Title: ${content.title}
        H1s: ${content.headings.h1.join(', ')}
        H2s: ${content.headings.h2.join(', ')}
        H3s: ${content.headings.h3.join(', ')}
        Paragraphs: ${content.paragraphs.slice(0, 10).join('\n')}
        Navigation: ${content.navigation.map(n => n.text).join(', ')}
        Buttons: ${content.buttons.join(', ')}
        
        Return as JSON with the same structure but transformed content.
        Make it funny and exaggerated but keep the same information architecture.
        Include a "summary" field with a brief description of the parody transformation.
        
        The JSON should have these exact fields:
        - title (string)
        - headings (object with h1, h2, h3 arrays)
        - paragraphs (array of strings)
        - navigation (array of objects with text and optional href)
        - buttons (array of strings)
        - summary (string describing the transformation)
        - style (string with the style name)`
      }
    ],
    response_format: { type: "json_object" }
  });

  const result = response.choices[0].message.content;
  if (!result) {
    throw new Error('No content generated from OpenAI');
  }

  try {
    return JSON.parse(result) as ParodyContent;
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error}`);
  }
}
