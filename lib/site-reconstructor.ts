import * as cheerio from 'cheerio';
import { CompleteExtraction } from './extract-complete';
import { TransformationResult } from './image-transformer';
import { ParodyStyleKey } from '@/lib/styles';

export interface TransformedContent {
  text: {
    title: string;
    headings: { h1: string[], h2: string[], h3: string[] };
    paragraphs: string[];
    navigation: Array<{ text: string; href?: string }>;
    buttons: string[];
  };
  images: TransformationResult[];
}

export class SiteReconstructor {
  async reconstructSite(
    original: CompleteExtraction,
    transformed: TransformedContent,
    style: ParodyStyleKey
  ): Promise<string> {
    const $ = cheerio.load(original.fullHtml);
    
    // 1. Replace text content
    this.replaceTextContent($, transformed.text);
    
    // 2. Replace images with transformed versions
    this.replaceImages($, transformed.images);
    
    // 3. Inject theme-specific styles
    const themeStyles = this.generateThemeStyles(style, original);
    this.injectStyles($, themeStyles);
    
    // 4. Add parody notice
    this.addParodyNotice($, style);
    
    // 5. Clean up and optimize
    this.cleanupHtml($);
    
    return $.html();
  }

  private replaceTextContent($: cheerio.CheerioAPI, text: TransformedContent['text']) {
    // Replace title
    $('title').text(text.title);
    
    // Replace headings
    text.headings.h1.forEach((newText, index) => {
      $('h1').eq(index).text(newText);
    });
    
    text.headings.h2.forEach((newText, index) => {
      $('h2').eq(index).text(newText);
    });
    
    text.headings.h3.forEach((newText, index) => {
      $('h3').eq(index).text(newText);
    });
    
    // Replace paragraphs
    text.paragraphs.forEach((newText, index) => {
      $('p').eq(index).text(newText);
    });
    
    // Replace navigation text
    text.navigation.forEach((navItem, index) => {
      $('nav a, .nav a, .navbar a').eq(index).text(navItem.text);
    });
    
    // Replace button text
    text.buttons.forEach((buttonText, index) => {
      const $button = $('button, .btn, .button, input[type="submit"]').eq(index);
      if ($button.is('input')) {
        $button.attr('value', buttonText);
      } else {
        $button.text(buttonText);
      }
    });
  }

  private replaceImages($: cheerio.CheerioAPI, transformedImages: TransformationResult[]) {
    transformedImages.forEach(imgResult => {
      // Replace regular img tags
      $(`img[src="${imgResult.originalUrl}"]`).attr('src', imgResult.url);
      
      // Replace background images in style attributes
      $(`[style*="${imgResult.originalUrl}"]`).each((i, el) => {
        const $el = $(el);
        const style = $el.attr('style') || '';
        const newStyle = style.replace(
          new RegExp(imgResult.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          imgResult.url
        );
        $el.attr('style', newStyle);
      });
      
      // Also check CSS background-image rules
      $('style').each((i, styleEl) => {
        const $styleEl = $(styleEl);
        let css = $styleEl.text();
        css = css.replace(
          new RegExp(imgResult.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          imgResult.url
        );
        $styleEl.text(css);
      });
    });
  }

  private generateThemeStyles(style: ParodyStyleKey, original: CompleteExtraction): string {
    const baseStyles = this.getBaseThemeStyles(style);
    const customizations = this.generateCustomizations(original, style);
    
    return `
      /* Parody Theme: ${style} */
      ${baseStyles}
      ${customizations}
      
      /* Parody improvements */
      .parody-notice {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      }
      
      /* Ensure transformed images fit well */
      img {
        max-width: 100%;
        height: auto;
      }
    `;
  }

  private getBaseThemeStyles(style: ParodyStyleKey): string {
    const themes = {
      'simpsons': `
        /* Simpsons Theme */
        * {
          font-family: 'Akbar', 'Comic Sans MS', cursive !important;
        }
        
        body {
          background: linear-gradient(135deg, #87CEEB 0%, #FFD90F 50%, #87CEEB 100%) !important;
          background-attachment: fixed;
        }
        
        h1, h2, h3, h4, h5, h6 {
          color: #FF6B6B !important;
          text-shadow: 3px 3px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000 !important;
          font-weight: bold !important;
        }
        
        a {
          color: #FF6B6B !important;
          text-decoration: underline !important;
        }
        
        a:hover {
          color: #FFD90F !important;
        }
        
        button, .btn, .button, input[type="submit"] {
          background: #FFD90F !important;
          border: 3px solid #000 !important;
          border-radius: 20px !important;
          font-weight: bold !important;
          color: #000 !important;
          padding: 10px 20px !important;
          cursor: pointer !important;
          text-shadow: none !important;
        }
        
        button:hover, .btn:hover, .button:hover {
          background: #FF6B6B !important;
          color: #FFD90F !important;
        }
        
        img {
          border: 5px solid #FFD90F !important;
          border-radius: 10px !important;
          box-shadow: 0 0 20px rgba(255, 217, 15, 0.5) !important;
        }
        
        p, span, div {
          text-shadow: 1px 1px 0 rgba(0,0,0,0.3);
        }
        
        /* Navigation styling */
        nav, .nav, .navbar {
          background: rgba(255, 217, 15, 0.9) !important;
          border: 2px solid #000 !important;
          border-radius: 15px !important;
        }
        
        /* Card/section styling */
        .card, .section, section {
          background: rgba(255, 255, 255, 0.9) !important;
          border: 2px solid #000 !important;
          border-radius: 15px !important;
          box-shadow: 5px 5px 0px #000 !important;
        }
      `,
      
      'corporate-buzzword': `
        /* Corporate Buzzword Theme */
        * {
          font-family: 'Arial', 'Helvetica', sans-serif !important;
        }
        
        body {
          background: linear-gradient(180deg, #E5E7EB 0%, #F3F4F6 100%) !important;
          color: #374151 !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
          color: #1E40AF !important;
          text-transform: uppercase !important;
          font-weight: 700 !important;
          letter-spacing: 1px !important;
        }
        
        .buzzword {
          background: #FEF3C7 !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-weight: bold !important;
          color: #92400E !important;
        }
        
        p::before {
          content: "• ";
          color: #1E40AF;
          font-weight: bold;
        }
        
        button, .btn, .button {
          background: #1E40AF !important;
          color: white !important;
          border: none !important;
          padding: 12px 24px !important;
          text-transform: uppercase !important;
          font-weight: bold !important;
          letter-spacing: 1px !important;
        }
        
        img {
          filter: contrast(1.2) saturate(0.8) !important;
          border-radius: 8px !important;
        }
      `,
      
      'gen-z': `
        /* Gen-Z Theme */
        * {
          font-family: 'Inter', '-apple-system', sans-serif !important;
        }
        
        body {
          background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7) !important;
          background-size: 400% 400% !important;
          animation: gradient 15s ease infinite !important;
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        h1, h2, h3 {
          color: #2D3436 !important;
          font-weight: 800 !important;
          text-align: center !important;
        }
        
        h1::after, h2::after {
          content: " ✨";
        }
        
        p {
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 15px !important;
          padding: 15px !important;
          margin: 10px 0 !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
        }
        
        img {
          border-radius: 20px !important;
          filter: saturate(1.2) contrast(1.1) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
        }
        
        button, .btn {
          background: linear-gradient(45deg, #FF6B6B, #4ECDC4) !important;
          border: none !important;
          border-radius: 25px !important;
          color: white !important;
          font-weight: 600 !important;
          padding: 12px 25px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
        }
      `,
      
      'medieval': `
        /* Medieval Theme */
        * {
          font-family: 'Cinzel', 'Georgia', serif !important;
        }
        
        body {
          background: 
            radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(160, 82, 45, 0.1) 0%, transparent 50%),
            linear-gradient(180deg, #8B4513 0%, #DEB887 50%, #F4E4BC 100%) !important;
          color: #3E2723 !important;
        }
        
        h1, h2, h3 {
          color: #8B0000 !important;
          text-align: center !important;
          font-weight: bold !important;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5) !important;
          border-bottom: 3px solid #DAA520 !important;
          padding-bottom: 10px !important;
        }
        
        h1::before, h2::before {
          content: "⚜ ";
          color: #DAA520;
        }
        
        h1::after, h2::after {
          content: " ⚜";
          color: #DAA520;
        }
        
        p {
          background: rgba(245, 245, 220, 0.9) !important;
          border: 2px solid #DAA520 !important;
          border-radius: 10px !important;
          padding: 15px !important;
          margin: 15px 0 !important;
          box-shadow: inset 0 0 10px rgba(218, 165, 32, 0.2) !important;
        }
        
        img {
          border: 5px solid #DAA520 !important;
          border-radius: 10px !important;
          box-shadow: 0 0 20px rgba(0,0,0,0.5) !important;
          filter: sepia(0.3) contrast(1.1) !important;
        }
        
        button, .btn {
          background: linear-gradient(45deg, #DAA520, #B8860B) !important;
          border: 2px solid #8B0000 !important;
          border-radius: 8px !important;
          color: #8B0000 !important;
          font-weight: bold !important;
          padding: 10px 20px !important;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.3) !important;
        }
      `,
      
      'conspiracy': `
        /* Conspiracy Theory Theme */
        * {
          font-family: 'Courier New', monospace !important;
        }
        
        body {
          background: 
            radial-gradient(circle at 30% 70%, rgba(139, 0, 0, 0.1) 0%, transparent 50%),
            linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%) !important;
          color: #E0E0E0 !important;
        }
        
        h1, h2, h3 {
          color: #FF4444 !important;
          text-transform: uppercase !important;
          font-weight: bold !important;
          text-shadow: 0 0 10px rgba(255, 68, 68, 0.5) !important;
          border-left: 5px solid #FF4444 !important;
          padding-left: 15px !important;
        }
        
        h1::before {
          content: "[CLASSIFIED] ";
          color: #FF4444;
          background: rgba(255, 68, 68, 0.2);
          padding: 2px 5px;
          margin-right: 10px;
        }
        
        p {
          background: rgba(0, 0, 0, 0.5) !important;
          border: 1px solid #444 !important;
          border-left: 3px solid #FF4444 !important;
          padding: 10px !important;
          margin: 10px 0 !important;
          position: relative !important;
        }
        
        p::before {
          content: "■ ";
          color: #FF4444;
        }
        
        img {
          border: 2px solid #FF4444 !important;
          filter: grayscale(0.5) contrast(1.2) brightness(0.8) !important;
          box-shadow: 0 0 15px rgba(255, 68, 68, 0.3) !important;
        }
        
        button, .btn {
          background: rgba(255, 68, 68, 0.2) !important;
          border: 2px solid #FF4444 !important;
          color: #FF4444 !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          padding: 8px 16px !important;
        }
        
        /* Add some "redacted" effects */
        .redacted::after {
          content: "█████████";
          background: #000;
          color: #000;
        }
      `
    };

    const themeStyle = themes[style as keyof typeof themes] || '';
    return themeStyle;
  }

  private generateCustomizations(original: CompleteExtraction, style: ParodyStyleKey): string {
    let customizations = '';
    
    // Apply original color scheme with theme modifications
    if (original.colorScheme) {
      // const { primary, secondary, background, text } = original.colorScheme;
      
      // Keep some original colors but modify them based on theme
      if (style === 'simpsons') {
        customizations += `
          /* Original color adaptations for Simpsons */
          .original-primary { color: #FFD90F !important; }
          .original-secondary { color: #FF6B6B !important; }
        `;
      }
    }
    
    // Preserve layout while applying theme
    if (original.layout.hasGrid) {
      customizations += `
        /* Preserve grid layouts */
        .grid, [style*="display: grid"], [style*="display:grid"] {
          display: grid !important;
        }
      `;
    }
    
    if (original.layout.hasFlexbox) {
      customizations += `
        /* Preserve flexbox layouts */
        .flex, [style*="display: flex"], [style*="display:flex"] {
          display: flex !important;
        }
      `;
    }
    
    return customizations;
  }

  private injectStyles($: cheerio.CheerioAPI, styles: string) {
    // Remove existing theme styles if any
    $('style[data-parody-theme]').remove();
    
    // Add new theme styles to head
    $('head').append(`<style data-parody-theme="true">${styles}</style>`);
  }

  private addParodyNotice($: cheerio.CheerioAPI, style: ParodyStyleKey) {
    const notice = `
      <div class="parody-notice">
        🎭 ${style.replace('-', ' ').toUpperCase()} PARODY
      </div>
    `;
    
    $('body').prepend(notice);
  }

  private cleanupHtml($: cheerio.CheerioAPI) {
    // Remove unnecessary scripts that might interfere
    $('script[src*="analytics"]').remove();
    $('script[src*="gtag"]').remove();
    $('script[src*="facebook"]').remove();
    
    // Remove tracking pixels
    $('img[src*="facebook.com/tr"]').remove();
    $('img[src*="google-analytics.com"]').remove();
    
    // Add meta tags for proper rendering
    if (!$('meta[charset]').length) {
      $('head').prepend('<meta charset="UTF-8">');
    }
    
    if (!$('meta[name="viewport"]').length) {
      $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
  }

  // Static method for quick transformations
  static async quickTransform(
    html: string,
    textTransformations: Record<string, string>,
    imageTransformations: Record<string, string>,
    style: ParodyStyleKey
  ): Promise<string> {
    const $ = cheerio.load(html);
    
    // Apply text transformations
    Object.entries(textTransformations).forEach(([selector, newText]) => {
      $(selector).text(newText);
    });
    
    // Apply image transformations
    Object.entries(imageTransformations).forEach(([originalSrc, newSrc]) => {
      $(`img[src="${originalSrc}"]`).attr('src', newSrc);
    });
    
    // Apply basic theme
    const reconstructor = new SiteReconstructor();
    const themeStyles = reconstructor.getBaseThemeStyles(style);
    $('head').append(`<style>${themeStyles}</style>`);
    
    return $.html();
  }
}

export const siteReconstructor = new SiteReconstructor();
