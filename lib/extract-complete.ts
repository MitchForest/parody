import * as cheerio from 'cheerio';
import { ExtractedContent } from './extract';

// Complete extraction interface that captures EVERYTHING from a website
export interface CompleteExtraction extends ExtractedContent {
  // Raw HTML for complete reconstruction
  fullHtml: string;
  
  // Visual Assets - All images, videos, media
  images: Array<{
    src: string;
    originalSrc: string;
    alt?: string;
    className?: string;
    id?: string;
    parentSelector: string;
    dimensions: { width: number; height: number };
    isBackground: boolean;
    dataAttributes?: Record<string, string>;
    context: 'hero' | 'content' | 'background' | 'icon' | 'logo';
  }>;
  
  videos: Array<{
    src: string;
    poster?: string;
    className?: string;
    parentSelector: string;
    autoplay?: boolean;
    loop?: boolean;
  }>;
  
  // Complete Document Structure
  documentStructure: {
    doctype: string;
    htmlAttributes: Record<string, string>;
    headContent: {
      meta: Array<{ name?: string; content?: string; property?: string }>;
      links: Array<{ rel: string; href: string; type?: string }>;
      scripts: Array<{ src?: string; inline?: string; type?: string }>;
      styles: Array<{ href?: string; inline?: string }>;
    };
    bodyAttributes: Record<string, string>;
    sections: Array<{
      selector: string;
      tagName: string;
      className: string;
      id?: string;
      children: any[];
      order: number;
      level: number;
    }>;
  };
  
  // Styling Information
  styling: {
    inlineStyles: Record<string, string>;
    cssRules: string[];
    colorScheme: {
      primary?: string;
      secondary?: string;
      background?: string;
      text?: string;
      accent?: string;
    };
    fonts: string[];
    isDarkMode?: boolean;
    customProperties: Record<string, string>; // CSS variables
  };
  
  // Layout Information
  layout: {
    isResponsive: boolean;
    breakpoints: string[];
    gridSystems: Array<{
      selector: string;
      columns: number;
      gap?: string;
    }>;
    flexboxes: Array<{
      selector: string;
      direction: string;
      justify: string;
      align: string;
    }>;
  };
  
  // Interactive Elements
  forms: Array<{
    selector: string;
    action?: string;
    method: string;
    fields: Array<{
      type: string;
      name?: string;
      placeholder?: string;
      required?: boolean;
      label?: string;
    }>;
  }>;
  
  // Scripts and Functionality
  scripts: Array<{
    src?: string;
    inline?: string;
    type: string;
    async?: boolean;
    defer?: boolean;
  }>;
  
  // SEO and Meta Information
  seo: {
    title: string;
    description?: string;
    keywords?: string;
    ogTags: Record<string, string>;
    canonicalUrl?: string;
    robots?: string;
  };
}

export class CompleteExtractor {
  
  extractComplete(html: string, url: string): CompleteExtraction {
    const $ = cheerio.load(html);
    
    // Start with basic extraction
    const basicExtraction = this.extractBasicContent($);
    
    return {
      ...basicExtraction,
      fullHtml: html,
      images: this.extractAllImages($, url),
      videos: this.extractVideos($),
      documentStructure: this.extractDocumentStructure($),
      styling: this.extractStyling($),
      layout: this.extractLayoutInfo($),
      forms: this.extractForms($),
      scripts: this.extractScripts($),
      seo: this.extractSEOInfo($)
    };
  }
  
  private extractBasicContent($: cheerio.CheerioAPI): ExtractedContent {
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
      buttons: $('button, .button, .btn, input[type="submit"]').map((_, el) => $(el).text() || $(el).attr('value') || '').get(),
      images: $('img').map((_, el) => ({
        alt: $(el).attr('alt'),
        src: $(el).attr('src')
      })).get()
    };
  }
  
  private extractAllImages($: cheerio.CheerioAPI, baseUrl: string): CompleteExtraction['images'] {
    const images: CompleteExtraction['images'] = [];
    
    // Extract <img> elements
    $('img').each((i, el) => {
      const $el = $(el);
      const src = $el.attr('src');
      if (!src) return;
      
      const absoluteSrc = this.resolveUrl(src, baseUrl);
      const parentSelector = this.getParentSelector($el);
      
      images.push({
        src: absoluteSrc,
        originalSrc: src,
        alt: $el.attr('alt'),
        className: $el.attr('class'),
        id: $el.attr('id'),
        parentSelector,
        dimensions: {
          width: parseInt($el.attr('width') || '0') || 0,
          height: parseInt($el.attr('height') || '0') || 0
        },
        isBackground: false,
        context: this.determineImageContext($el, parentSelector),
        dataAttributes: this.getDataAttributes($el)
      });
    });
    
    // Extract background images from CSS
    $('*').each((i, el) => {
      const $el = $(el);
      const style = $el.attr('style');
      if (style && style.includes('background-image')) {
        const matches = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
        if (matches && matches[1]) {
          const src = matches[1];
          const absoluteSrc = this.resolveUrl(src, baseUrl);
          
          images.push({
            src: absoluteSrc,
            originalSrc: src,
            parentSelector: this.getElementSelector($el),
            dimensions: { width: 0, height: 0 },
            isBackground: true,
            context: 'background',
            className: $el.attr('class'),
            id: $el.attr('id')
          });
        }
      }
    });
    
    return images;
  }
  
  private extractVideos($: cheerio.CheerioAPI): CompleteExtraction['videos'] {
    const videos: CompleteExtraction['videos'] = [];
    
    $('video').each((i, el) => {
      const $el = $(el);
      const src = $el.attr('src') || $el.find('source').first().attr('src');
      if (src) {
        videos.push({
          src,
          poster: $el.attr('poster'),
          className: $el.attr('class'),
          parentSelector: this.getParentSelector($el),
          autoplay: $el.attr('autoplay') !== undefined,
          loop: $el.attr('loop') !== undefined
        });
      }
    });
    
    // Also check for embedded videos (YouTube, Vimeo, etc.)
    $('iframe').each((i, el) => {
      const $el = $(el);
      const src = $el.attr('src');
      if (src && (src.includes('youtube.com') || src.includes('vimeo.com'))) {
        videos.push({
          src,
          className: $el.attr('class'),
          parentSelector: this.getParentSelector($el)
        });
      }
    });
    
    return videos;
  }
  
  private extractDocumentStructure($: cheerio.CheerioAPI): CompleteExtraction['documentStructure'] {
    return {
      doctype: '<!DOCTYPE html>', // Default, could be enhanced
      htmlAttributes: this.getElementAttributes($('html')),
      headContent: {
        meta: $('meta').map((_, el) => {
          const $el = $(el);
          return {
            name: $el.attr('name'),
            content: $el.attr('content'),
            property: $el.attr('property')
          };
        }).get(),
        links: $('link').map((_, el) => {
          const $el = $(el);
          return {
            rel: $el.attr('rel') || '',
            href: $el.attr('href') || '',
            type: $el.attr('type')
          };
        }).get(),
        scripts: this.extractScripts($),
        styles: $('style, link[rel="stylesheet"]').map((_, el) => {
          const $el = $(el);
          return {
            href: $el.attr('href'),
            inline: el.tagName === 'style' ? $el.html() : undefined
          };
        }).get()
      },
      bodyAttributes: this.getElementAttributes($('body')),
      sections: this.extractSections($)
    };
  }
  
  private extractSections($: cheerio.CheerioAPI): CompleteExtraction['documentStructure']['sections'] {
    const sections: CompleteExtraction['documentStructure']['sections'] = [];
    
    // Extract major structural elements
    const structuralSelectors = [
      'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
      '.hero', '.banner', '.content', '.sidebar', '.container'
    ];
    
    structuralSelectors.forEach(selector => {
      $(selector).each((i, el) => {
        const $el = $(el);
        sections.push({
          selector,
          tagName: el.tagName,
          className: $el.attr('class') || '',
          id: $el.attr('id'),
          children: [], // Could be enhanced to include child structure
          order: sections.length,
          level: this.getElementLevel($el)
        });
      });
    });
    
    return sections;
  }
  
  private extractStyling($: cheerio.CheerioAPI): CompleteExtraction['styling'] {
    const styling: CompleteExtraction['styling'] = {
      inlineStyles: {},
      cssRules: [],
      colorScheme: {},
      fonts: [],
      customProperties: {}
    };
    
    // Extract inline styles
    $('[style]').each((i, el) => {
      const $el = $(el);
      const selector = this.getElementSelector($el);
      const style = $el.attr('style');
      if (style) {
        styling.inlineStyles[selector] = style;
      }
    });
    
    // Extract CSS rules from <style> tags
    $('style').each((i, el) => {
      const css = $(el).html();
      if (css) {
        styling.cssRules.push(css);
      }
    });
    
    // Extract color scheme (basic implementation)
    const bodyStyle = $('body').attr('style') || '';
    if (bodyStyle.includes('background')) {
      const bgMatch = bodyStyle.match(/background(?:-color)?:\s*([^;]+)/);
      if (bgMatch) {
        styling.colorScheme.background = bgMatch[1].trim();
      }
    }
    
    // Extract fonts
    const fontMatches = styling.cssRules.join(' ').match(/font-family:\s*([^;}]+)/g);
    if (fontMatches) {
      styling.fonts = [...new Set(fontMatches.map(match => 
        match.replace('font-family:', '').trim()
      ))];
    }
    
    return styling;
  }
  
  private extractLayoutInfo($: cheerio.CheerioAPI): CompleteExtraction['layout'] {
    return {
      isResponsive: $('meta[name="viewport"]').length > 0,
      breakpoints: [], // Could be enhanced by parsing CSS
      gridSystems: this.extractGridSystems($),
      flexboxes: this.extractFlexboxes($)
    };
  }
  
  private extractGridSystems($: cheerio.CheerioAPI): CompleteExtraction['layout']['gridSystems'] {
    const grids: CompleteExtraction['layout']['gridSystems'] = [];
    
    // Look for common grid classes
    $('.grid, .row, .container-fluid, .d-grid').each((i, el) => {
      const $el = $(el);
      grids.push({
        selector: this.getElementSelector($el),
        columns: $el.children().length || 12, // Default or count children
        gap: '1rem' // Default
      });
    });
    
    return grids;
  }
  
  private extractFlexboxes($: cheerio.CheerioAPI): CompleteExtraction['layout']['flexboxes'] {
    const flexboxes: CompleteExtraction['layout']['flexboxes'] = [];
    
    $('.flex, .d-flex, .flexbox').each((i, el) => {
      const $el = $(el);
      flexboxes.push({
        selector: this.getElementSelector($el),
        direction: 'row', // Default
        justify: 'flex-start', // Default
        align: 'stretch' // Default
      });
    });
    
    return flexboxes;
  }
  
  private extractForms($: cheerio.CheerioAPI): CompleteExtraction['forms'] {
    const forms: CompleteExtraction['forms'] = [];
    
    $('form').each((i, el) => {
      const $form = $(el);
      const fields: CompleteExtraction['forms'][0]['fields'] = [];
      
      $form.find('input, textarea, select').each((j, field) => {
        const $field = $(field);
        fields.push({
          type: $field.attr('type') || field.tagName.toLowerCase(),
          name: $field.attr('name'),
          placeholder: $field.attr('placeholder'),
          required: $field.attr('required') !== undefined,
          label: $field.closest('.form-group, .field').find('label').text() || $field.attr('aria-label')
        });
      });
      
      forms.push({
        selector: this.getElementSelector($form),
        action: $form.attr('action'),
        method: $form.attr('method') || 'GET',
        fields
      });
    });
    
    return forms;
  }
  
  private extractScripts($: cheerio.CheerioAPI): CompleteExtraction['scripts'] {
    const scripts: CompleteExtraction['scripts'] = [];
    
    $('script').each((i, el) => {
      const $el = $(el);
      scripts.push({
        src: $el.attr('src'),
        inline: $el.attr('src') ? undefined : $el.html(),
        type: $el.attr('type') || 'text/javascript',
        async: $el.attr('async') !== undefined,
        defer: $el.attr('defer') !== undefined
      });
    });
    
    return scripts;
  }
  
  private extractSEOInfo($: cheerio.CheerioAPI): CompleteExtraction['seo'] {
    const ogTags: Record<string, string> = {};
    
    $('meta[property^="og:"]').each((i, el) => {
      const $el = $(el);
      const property = $el.attr('property');
      const content = $el.attr('content');
      if (property && content) {
        ogTags[property] = content;
      }
    });
    
    return {
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      ogTags,
      canonicalUrl: $('link[rel="canonical"]').attr('href'),
      robots: $('meta[name="robots"]').attr('content')
    };
  }
  
  // Helper methods
  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return new URL(baseUrl).origin + url;
    return new URL(url, baseUrl).href;
  }
  
  private getElementSelector($el: cheerio.Cheerio<cheerio.Element>): string {
    const id = $el.attr('id');
    if (id) return `#${id}`;
    
    const className = $el.attr('class');
    if (className) return `.${className.split(' ')[0]}`;
    
    return $el.prop('tagName')?.toLowerCase() || 'element';
  }
  
  private getParentSelector($el: cheerio.Cheerio<cheerio.Element>): string {
    const parent = $el.parent();
    return this.getElementSelector(parent);
  }
  
  private getElementAttributes($el: cheerio.Cheerio<cheerio.Element>): Record<string, string> {
    const attrs: Record<string, string> = {};
    const element = $el.get(0);
    if (element && element.attribs) {
      Object.assign(attrs, element.attribs);
    }
    return attrs;
  }
  
  private getDataAttributes($el: cheerio.Cheerio<cheerio.Element>): Record<string, string> {
    const dataAttrs: Record<string, string> = {};
    const attrs = this.getElementAttributes($el);
    
    Object.keys(attrs).forEach(key => {
      if (key.startsWith('data-')) {
        dataAttrs[key] = attrs[key];
      }
    });
    
    return dataAttrs;
  }
  
  private determineImageContext($el: cheerio.Cheerio<cheerio.Element>, parentSelector: string): CompleteExtraction['images'][0]['context'] {
    const src = $el.attr('src') || '';
    const alt = $el.attr('alt') || '';
    const className = $el.attr('class') || '';
    
    // Check for hero/banner context
    if (parentSelector.includes('hero') || parentSelector.includes('banner') || 
        className.includes('hero') || className.includes('banner')) {
      return 'hero';
    }
    
    // Check for logo context
    if (src.includes('logo') || alt.includes('logo') || className.includes('logo')) {
      return 'logo';
    }
    
    // Check for icon context
    if (src.includes('icon') || className.includes('icon') || 
        parseInt($el.attr('width') || '0') < 50) {
      return 'icon';
    }
    
    // Default to content
    return 'content';
  }
  
  private getElementLevel($el: cheerio.Cheerio<cheerio.Element>): number {
    let level = 0;
    let current = $el;
    
    while (current.parent().length > 0) {
      level++;
      current = current.parent();
    }
    
    return level;
  }
}

// Export the extractor function
export function extractComplete(html: string, url: string = ''): CompleteExtraction {
  const extractor = new CompleteExtractor();
  return extractor.extractComplete(html, url);
}
