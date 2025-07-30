import OpenAI from 'openai';
import Replicate from 'replicate';
import { ParodyStyleKey } from '@/lib/styles';

export interface TransformationResult {
  url: string;
  originalUrl: string;
  context: 'hero' | 'content' | 'background' | 'icon';
  transformedAt: Date;
  model: 'dalle-3' | 'replicate' | 'cached';
}

export class ImageTransformer {
  private openai: OpenAI;
  private replicate: Replicate;
  private cache = new Map<string, string>(); // Simple in-memory cache

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
    
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!
    });
  }

  async transformImage(
    imageUrl: string,
    style: ParodyStyleKey,
    context: 'hero' | 'content' | 'background' | 'icon'
  ): Promise<TransformationResult> {
    const cacheKey = `${imageUrl}-${style}-${context}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return {
        url: this.cache.get(cacheKey)!,
        originalUrl: imageUrl,
        context,
        transformedAt: new Date(),
        model: 'cached'
      };
    }

    try {
      let transformedUrl: string;
      let model: 'dalle-3' | 'replicate';

      // Choose transformation method based on context and style
      if (this.shouldUseDallE(style, context)) {
        transformedUrl = await this.transformWithDallE(imageUrl, style, context);
        model = 'dalle-3';
      } else {
        transformedUrl = await this.transformWithReplicate(imageUrl, style, context);
        model = 'replicate';
      }

      // Cache the result
      this.cache.set(cacheKey, transformedUrl);

      return {
        url: transformedUrl,
        originalUrl: imageUrl,
        context,
        transformedAt: new Date(),
        model
      };
    } catch (error) {
      console.error('Image transformation failed:', error);
      // Return original URL as fallback
      return {
        url: imageUrl,
        originalUrl: imageUrl,
        context,
        transformedAt: new Date(),
        model: 'cached'
      };
    }
  }

  private shouldUseDallE(style: ParodyStyleKey, context: string): boolean {
    // Use DALL-E for hero images and content images that need high quality
    // Use Replicate for faster/cheaper transformations
    return (context === 'hero' || context === 'content') && 
           (style === 'simpsons' || style === 'medieval' || style === 'conspiracy');
  }

  private async transformWithDallE(
    imageUrl: string, 
    style: ParodyStyleKey, 
    context: string
  ): Promise<string> {
    const prompt = this.buildDallEPrompt(style, context);
    
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: this.getDallESize(context),
        quality: "standard",
        response_format: "url"
      });

      if (response.data && response.data[0] && response.data[0].url) {
        return response.data[0].url;
      }
      throw new Error('No image URL returned from DALL-E');
    } catch (error) {
      console.error('DALL-E generation failed:', error);
      throw error;
    }
  }

  private async transformWithReplicate(
    imageUrl: string,
    style: ParodyStyleKey, 
    context: string
  ): Promise<string> {
    try {
      // Download the original image first
      const imageBuffer = await this.downloadImage(imageUrl);
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

      const prompt = this.buildReplicatePrompt(style, context);
      
      // Use Stable Diffusion img2img for style transfer
      const output = await this.replicate.run(
        "stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
        {
          input: {
            prompt,
            image: base64Image,
            strength: this.getTransformationStrength(style, context),
            guidance_scale: 7.5,
            num_inference_steps: 30,
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      ) as string[];

      return output[0];
    } catch (error) {
      console.error('Replicate transformation failed:', error);
      throw error;
    }
  }

  private buildDallEPrompt(style: ParodyStyleKey, context: string): string {
    const stylePrompts = {
      'simpsons': {
        hero: "Create a Simpsons character portrait in Matt Groening's art style. Yellow skin, big eyes, overbite, simple cartoon lines. Springfield setting background.",
        content: "Transform into Simpsons cartoon style. Yellow color scheme, simple cartoon art, Matt Groening style illustration.",
        background: "Springfield cityscape in Simpsons art style. Nuclear plant, colorful cartoon buildings, clear sky.",
        icon: "Simple Simpsons-style icon. Yellow and bright colors, cartoon style, minimal design."
      },
      'corporate-buzzword': {
        hero: "Professional corporate headshot. Person in business suit, office background, stock photo style, overly polished.",
        content: "Corporate stock photo style. Business people, office setting, handshakes, meetings, professional lighting.",
        background: "Modern corporate office space. Glass buildings, meeting rooms, professional environment.",
        icon: "Corporate business icon. Professional, clean, business-themed symbol."
      },
      'gen-z': {
        hero: "Gen-Z style photo. Phone selfie, ring light, aesthetic background, trendy outfit, social media ready.",
        content: "Gen-Z aesthetic image. Colorful, trendy, social media style, phone photography, good lighting.",
        background: "Aesthetic Gen-Z background. Neon lights, trendy decor, Instagram-worthy setting.",
        icon: "Gen-Z style icon. Colorful, trendy, social media inspired design."
      },
      'medieval': {
        hero: "Medieval illuminated manuscript portrait. Gold leaf, ornate borders, period clothing, manuscript art style.",
        content: "Medieval tapestry or manuscript illustration. Rich colors, gold details, period-appropriate imagery.",
        background: "Medieval castle or monastery setting. Stone walls, tapestries, period architecture.",
        icon: "Medieval heraldic symbol. Shield, sword, crown, ornate medieval design."
      },
      'conspiracy': {
        hero: "Conspiracy theory style photo. Grainy, low quality, mysterious lighting, red string bulletin board background.",
        content: "Conspiracy theory aesthetic. Blurry photos, red strings, bulletin boards, mysterious documents.",
        background: "Conspiracy theory room. Cork board with red strings, newspaper clippings, dim lighting.",
        icon: "Conspiracy symbol. Eye, pyramid, mysterious symbol, monochrome design."
      }
    };

    const styleData = stylePrompts[style as keyof typeof stylePrompts];
    if (!styleData) return `Transform into ${style} style image appropriate for ${context}`;
    
    const prompt = styleData[context as keyof typeof styleData];
    return prompt || `Transform into ${style} style image appropriate for ${context}`;
  }

  private buildReplicatePrompt(style: ParodyStyleKey, context: string): string {
    const basePrompts = {
      'simpsons': "simpsons character, yellow skin, cartoon style, matt groening art, springfield",
      'corporate-buzzword': "corporate stock photo, business professional, office setting, polished",
      'gen-z': "gen-z aesthetic, social media style, trendy, colorful, phone photography",
      'medieval': "medieval manuscript, illuminated art, tapestry style, gold details",
      'conspiracy': "conspiracy theory, grainy photo, mysterious, bulletin board, red strings"
    };

    const contextModifiers = {
      hero: "portrait, main character, detailed, high quality",
      content: "scene, detailed illustration, thematic",
      background: "background, environmental, atmospheric",
      icon: "simple, iconic, minimal, symbolic"
    };

    const basePrompt = basePrompts[style as keyof typeof basePrompts] || style;
    const contextMod = contextModifiers[context as keyof typeof contextModifiers] || context;
    return `${basePrompt}, ${contextMod}, high quality, detailed`;
  }

  private getDallESize(context: string): "1024x1024" | "1792x1024" | "1024x1792" {
    switch (context) {
      case 'hero':
        return "1792x1024"; // Wide format for hero images
      case 'background':
        return "1792x1024"; // Wide format for backgrounds
      default:
        return "1024x1024"; // Square for content and icons
    }
  }

  private getTransformationStrength(style: ParodyStyleKey, context: string): number {
    // How much to transform the original image (0.0 = no change, 1.0 = complete transformation)
    const strengthMap = {
      'simpsons': { hero: 0.8, content: 0.7, background: 0.6, icon: 0.9 },
      'corporate-buzzword': { hero: 0.5, content: 0.4, background: 0.3, icon: 0.6 },
      'gen-z': { hero: 0.6, content: 0.5, background: 0.4, icon: 0.7 },
      'medieval': { hero: 0.8, content: 0.7, background: 0.6, icon: 0.9 },
      'conspiracy': { hero: 0.7, content: 0.6, background: 0.5, icon: 0.8 }
    };

    const styleData = strengthMap[style as keyof typeof strengthMap];
    if (!styleData) return 0.6;
    
    return styleData[context as keyof typeof styleData] || 0.6;
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Failed to download image:', error);
      throw error;
    }
  }

  async transformMultipleImages(
    images: Array<{
      url: string;
      context: 'hero' | 'content' | 'background' | 'icon';
    }>,
    style: ParodyStyleKey
  ): Promise<TransformationResult[]> {
    // Transform images in parallel with a concurrency limit
    const concurrencyLimit = 3;
    const results: TransformationResult[] = [];
    
    for (let i = 0; i < images.length; i += concurrencyLimit) {
      const batch = images.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(img => this.transformImage(img.url, style, img.context))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  // Clear cache method for memory management
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Utility function to validate image URLs
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
    
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:' || hasValidExtension;
  } catch {
    return false;
  }
}

// Export singleton instance
export const imageTransformer = new ImageTransformer();
