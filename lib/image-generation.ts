import Replicate from 'replicate';
import { ParodyContent } from './parody';

export async function generateImage(screenshot: Buffer, parodySummary: string): Promise<string | null> {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    
    if (!process.env.REPLICATE_API_TOKEN) {
      console.warn('REPLICATE_API_TOKEN not configured, skipping image generation');
      return null;
    }
    
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: `Website screenshot parody: ${parodySummary}, 
                   professional web design, high quality, detailed UI, modern interface`,
          negative_prompt: "blurry, low quality, distorted text, broken layout, ugly, deformed",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 1024,
          height: 768
        }
      }
    );
    
    // Return the first image URL from the output
    if (Array.isArray(output)) {
      return output[0] as string;
    }
    return output as unknown as string;
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}

export function generateParodyImagePrompt(parody: ParodyContent): string {
  return `Create a parody website mockup in ${parody.style} style. 
          Title: "${parody.title}". 
          Theme: ${parody.summary}. 
          Make it look like a real website but with humorous ${parody.style} content. 
          Professional web design with clear typography and modern UI elements.`;
}
