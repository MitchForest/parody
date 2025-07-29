import OpenAI from 'openai';
import Replicate from 'replicate';
import { ParodyStyleKey } from './styles';
import { CompleteExtraction } from './extract-complete';

export interface TransformedImage {
  originalSrc: string;
  transformedUrl: string;
  context: 'hero' | 'content' | 'background' | 'icon' | 'logo';
  style: ParodyStyleKey;
  method: 'dalle3' | 'replicate' | 'cached';
}

export class ImageTransformer {
  private openai: OpenAI;
  private replicate: Replicate;
  private cache: Map<string, string> = new Map();

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  }

  async transformAllImages(
    images: CompleteExtraction['images'],
    style: ParodyStyleKey,
    maxImages: number = 5
  ): Promise<TransformedImage[]> {
    console.log(`🎨 Transforming ${Math.min(images.length, maxImages)} images to ${style} style...`);

    const transformPromises = images
      .slice(0, maxImages) // Limit for cost control
      .map(async (img) => {
        try {
          const transformedUrl = await this.transformImage(img.src, style, img.context);
          return {
            originalSrc: img.src,
            transformedUrl,
            context: img.context,
            style,
            method: 'dalle3' as const
          };
        } catch (error) {
          console.warn(`Failed to transform image ${img.src}:`, error);
          // Return original as fallback
          return {
            originalSrc: img.src,
            transformedUrl: img.src,
            context: img.context,
            style,
            method: 'cached' as const
          };
        }
      });

    const results = await Promise.all(transformPromises);
    console.log(`✅ Transformed ${results.length} images successfully`);
    return results;
  }

  async transformImage(
    imageUrl: string,
    style: ParodyStyleKey,
    context: 'hero' | 'content' | 'background' | 'icon' | 'logo'
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${imageUrl}-${style}-${context}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    console.log(`   Transforming ${context} image to ${style} style...`);

    let transformedUrl: string;

    // Use different transformation methods based on style and context
    if (this.shouldUseDallE3(style, context)) {
      transformedUrl = await this.transformWithDallE3(imageUrl, style, context);
    } else {
      transformedUrl = await this.transformWithReplicate(imageUrl, style, context);
    }

    // Cache the result
    this.cache.set(cacheKey, transformedUrl);
    return transformedUrl;
  }

  private shouldUseDallE3(style: ParodyStyleKey, context: string): boolean {
    // Use DALL-E 3 for hero images and important content
    if (context === 'hero' || context === 'logo') return true;
    
    // Use DALL-E 3 for Simpsons style (best quality)
    if (style === 'simpsons') return true;
    
    // Use Replicate for other cases (faster/cheaper)
    return false;
  }

  private async transformWithDallE3(
    imageUrl: string,
    style: ParodyStyleKey,
    context: string
  ): Promise<string> {
    const prompt = this.generateDallE3Prompt(style, context);
    
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: this.getDallE3Size(context),
        quality: "hd",
        response_format: "url"
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E 3');
      }

      console.log(`   ✅ DALL-E 3 generated ${context} image`);
      return imageUrl;
    } catch (error) {
      console.error('DALL-E 3 transformation failed:', error);
      throw error;
    }
  }

  private async transformWithReplicate(
    imageUrl: string,
    style: ParodyStyleKey,
    context: string
  ): Promise<string> {
    const prompt = this.generateReplicatePrompt(style, context);
    
    try {
      // Download the original image first
      const imageBuffer = await this.downloadImage(imageUrl);
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

      // Use img2img transformation with Stable Diffusion
      const output = await this.replicate.run(
        "stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
        {
          input: {
            prompt,
            image: base64Image,
            strength: this.getTransformationStrength(style, context),
            guidance_scale: 7.5,
            num_inference_steps: 20, // Balance quality vs speed
            scheduler: "K_EULER"
          }
        }
      );

      const transformedUrl = Array.isArray(output) ? output[0] : output;
      console.log(`   ✅ Replicate generated ${context} image`);
      return transformedUrl as string;
    } catch (error) {
      console.error('Replicate transformation failed:', error);
      throw error;
    }
  }

  private generateDallE3Prompt(style: ParodyStyleKey, context: string): string {
    const basePrompts = {
      simpsons: {
        hero: "Portrait of a person in The Simpsons cartoon style, yellow skin, big round eyes, overbite, spiky hair, Springfield background, Matt Groening art style, high quality animation",
        logo: "Company logo transformed into The Simpsons cartoon style, yellow and bright colors, cartoon aesthetic, Springfield theme",
        content: "Image in The Simpsons cartoon style, bright colors, cartoon shading, Springfield setting",
        background: "Springfield cityscape background from The Simpsons, cartoon style, bright blue sky, yellow buildings",
        icon: "Simple icon in The Simpsons cartoon style, yellow and bright colors, minimal design"
      },
      'corporate-buzzword': {
        hero: "Professional corporate headshot, business suit, office background, stock photo style, high-end professional photography",
        logo: "Corporate logo design, modern business style, professional blue and gray colors, enterprise branding",
        content: "Professional business image, corporate setting, office environment, business people in suits",
        background: "Modern corporate office background, glass buildings, professional business environment",
        icon: "Professional business icon, corporate style, clean modern design"
      },
      'gen-z-brainrot': {
        hero: "Person taking selfie with phone, TikTok aesthetic, neon colors, social media style, Gen Z fashion",
        logo: "Logo with meme aesthetic, viral social media style, bright neon colors, internet culture",
        content: "Social media style image, TikTok aesthetic, phone screen, viral content style",
        background: "Neon lit room background, gaming setup, social media aesthetic, colorful LED lights",
        icon: "Social media app icon style, bright colors, mobile app aesthetic"
      },
      medieval: {
        hero: "Medieval portrait, renaissance painting style, royal clothing, castle background, illuminated manuscript art",
        logo: "Medieval heraldic emblem, coat of arms style, castle and knight theme, gothic lettering",
        content: "Medieval scene, castle setting, renaissance art style, historical painting",
        background: "Medieval castle background, gothic architecture, renaissance painting style",
        icon: "Medieval heraldic symbol, shield and sword, gothic design"
      },
      infomercial: {
        hero: "Enthusiastic spokesperson, bright studio lighting, cheesy smile, pointing gesture, infomercial style",
        logo: "Infomercial product logo, bright colors, 'AS SEEN ON TV' style, marketing graphics",
        content: "Product demonstration, infomercial style, bright studio lighting, marketing photography",
        background: "Bright studio background, infomercial set, promotional graphics",
        icon: "Product icon, marketing style, bright promotional colors"
      },
      conspiracy: {
        hero: "Mysterious person, shadowy lighting, bulletin board background, investigation aesthetic",
        logo: "Conspiracy theory style logo, mystery aesthetic, dark colors, investigation theme",
        content: "Investigation scene, bulletin board with red string, conspiracy aesthetic, documentary style",
        background: "Dark room with bulletin board, red string connections, investigation aesthetic",
        icon: "Mystery icon, conspiracy style, magnifying glass, investigation theme"
      }
    };

    return basePrompts[style]?.[context] || basePrompts[style]?.content || "High quality image";
  }

  private generateReplicatePrompt(style: ParodyStyleKey, context: string): string {
    const stylePrompts = {
      simpsons: "simpsons cartoon style, yellow skin, matt groening art, animated",
      'corporate-buzzword': "professional corporate style, business suit, office setting",
      'gen-z-brainrot': "tiktok aesthetic, neon colors, social media style, viral content",
      medieval: "medieval renaissance style, castle setting, historical painting",
      infomercial: "bright infomercial style, marketing photography, studio lighting",
      conspiracy: "conspiracy theory aesthetic, investigation style, documentary photography"
    };

    return stylePrompts[style] || "high quality, professional";
  }

  private getDallE3Size(context: string): "1024x1024" | "1792x1024" | "1024x1792" {
    switch (context) {
      case 'hero':
        return "1792x1024"; // Wide hero format
      case 'background':
        return "1792x1024"; // Wide background
      default:
        return "1024x1024"; // Square for most content
    }
  }

  private getTransformationStrength(style: ParodyStyleKey, context: string): number {
    // Higher strength = more transformation, lower = preserve more original
    const strengths = {
      simpsons: {
        hero: 0.8, // High transformation for cartoon effect
        content: 0.7,
        background: 0.6,
        icon: 0.5,
        logo: 0.7
      },
      'corporate-buzzword': {
        hero: 0.6, // Moderate transformation
        content: 0.5,
        background: 0.4,
        icon: 0.3,
        logo: 0.5
      },
      // Add other styles as needed
    };

    return strengths[style]?.[context] || 0.6; // Default strength
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Image download failed:', error);
      throw error;
    }
  }
}

// Convenience function for single image transformation
export async function transformSingleImage(
  imageUrl: string,
  style: ParodyStyleKey,
  context: 'hero' | 'content' | 'background' | 'icon' | 'logo' = 'content'
): Promise<string> {
  const transformer = new ImageTransformer();
  return transformer.transformImage(imageUrl, style, context);
}
