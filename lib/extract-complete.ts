/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cheerio from 'cheerio';
import { ExtractedContent } from './extract';

export interface CompleteExtraction {
  // Basic content (copied from ExtractedContent)
  title: string;
  headings: { h1: string[], h2: string[], h3: string[] };
  paragraphs: string[];
  navigation: Array<{ text: string; href?: string }>;
  buttons: string[];
  // Visual Assets
  images: Array<{
    src: string;
    originalSrc: string;
    alt?: string;
    className?: string;
    id?: string;
    parentSelector: string;
    dimensions?: { width: number; height: number };
    isBackground: boolean;
    dataAttributes?: Record<string, string>;
    context: 'hero' | 'content' | 'background' | 'icon';
  }>;
  
  // Media
  videos: Array<{
    src: string;
    poster?: string;
    className?: string;
    parentSelector: string;
    autoplay?: boolean;
  }>;
  
  // Structure
  documentStructure: {
    sections: Array<{
      selector: string;
      tagName: string;
      className: string;
      children: unknown[];
      order: number;
    }>;
  };
  
  // Styling
  inlineStyles: Record<string, string>;
  cssRules: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  
  // Interactive
  forms: Array<{
    action: string;
    method: string;
    fields: Array<{
      label: string;
      type: string;
      name: string;
      required?: boolean;
    }>;
  }>;
  
  scripts: Array<{
    src?: string;
    inline?: string;
    type: string;
  }>;
  
  // Layout info
  layout: {
    hasGrid: boolean;
    hasFlexbox: boolean;
    hasColumns: boolean;
    breakpoints: string[];
  };
  
  // Full HTML for reconstruction
  fullHtml: string;
}

export async function extractComplete(html: string): Promise<CompleteExtraction> {
  const $ = cheerio.load(html);
  
  // Extract all images with context detection
  const images = extractImages($);
  
  // Extract videos
  const videos = extractVideos($);
  
  // Extract document structure
  const documentStructure = extractDocumentStructure($);
  
  // Extract styling information
  const { inlineStyles, cssRules, colorScheme } = extractStyling($);
  
  // Extract forms
  const forms = extractForms($);
  
  // Extract scripts
  const scripts = extractScripts($);
  
  // Analyze layout
  const layout = analyzeLayout($);
  
  // Get basic content (from existing extract function)
  const basicContent = extractBasicContent($);
  
  return {
    ...basicContent,
    images,
    videos,
    documentStructure,
    inlineStyles,
    cssRules,
    colorScheme,
    forms,
    scripts,
    layout,
    fullHtml: $.html()
  };
}

function extractImages($: cheerio.CheerioAPI): CompleteExtraction['images'] {
  const images: CompleteExtraction['images'] = [];
  
  // Regular img tags
  $('img').each((i, elem) => {
    const $elem = $(elem);
    const src = $elem.attr('src');
    
    if (src) {
      const context = detectImageContext($elem);
      
      images.push({
        src: makeAbsoluteUrl(src),
        originalSrc: src,
        alt: $elem.attr('alt'),
        className: $elem.attr('class'),
        id: $elem.attr('id'),
        parentSelector: getParentSelector($elem),
        dimensions: {
          width: parseInt($elem.attr('width') || '0'),
          height: parseInt($elem.attr('height') || '0')
        },
        isBackground: false,
        dataAttributes: getDataAttributes($elem),
        context
      });
    }
  });
  
  // Background images in style attributes
  $('[style*="background-image"]').each((i, elem) => {
    const $elem = $(elem);
    const style = $elem.attr('style') || '';
    const match = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
    
    if (match && match[1]) {
      images.push({
        src: makeAbsoluteUrl(match[1]),
        originalSrc: match[1],
        className: $elem.attr('class'),
        id: $elem.attr('id'),
        parentSelector: getParentSelector($elem),
        isBackground: true,
        context: 'background'
      });
    }
  });
  
  return images;
}

function detectImageContext($elem: any): 'hero' | 'content' | 'background' | 'icon' {
  const src = $elem.attr('src') || '';
  const alt = $elem.attr('alt') || '';
  const className = $elem.attr('class') || '';
  
  // Check for hero indicators
  if (
    className.includes('hero') ||
    className.includes('banner') ||
    $elem.closest('.hero, .banner, header').length > 0 ||
    alt.toLowerCase().includes('hero')
  ) {
    return 'hero';
  }
  
  // Check for icons
  if (
    className.includes('icon') ||
    className.includes('logo') ||
    src.includes('icon') ||
    src.includes('logo') ||
    alt.toLowerCase().includes('icon') ||
    alt.toLowerCase().includes('logo')
  ) {
    return 'icon';
  }
  
  // Check dimensions for icons (small images)
  const width = parseInt($elem.attr('width') || '0');
  const height = parseInt($elem.attr('height') || '0');
  if ((width > 0 && width < 100) || (height > 0 && height < 100)) {
    return 'icon';
  }
  
  return 'content';
}

function extractVideos($: cheerio.CheerioAPI): CompleteExtraction['videos'] {
  const videos: CompleteExtraction['videos'] = [];
  
  $('video').each((i, elem) => {
    const $elem = $(elem);
    const src = $elem.attr('src') || $elem.find('source').first().attr('src');
    
    if (src) {
      videos.push({
        src: makeAbsoluteUrl(src),
        poster: $elem.attr('poster') ? makeAbsoluteUrl($elem.attr('poster')!) : undefined,
        className: $elem.attr('class'),
        parentSelector: getParentSelector($elem),
        autoplay: $elem.attr('autoplay') !== undefined
      });
    }
  });
  
  return videos;
}

function extractDocumentStructure($: cheerio.CheerioAPI): CompleteExtraction['documentStructure'] {
  const sections: CompleteExtraction['documentStructure']['sections'] = [];
  
  // Extract major structural elements
  $('header, nav, main, section, aside, footer, div[class*="section"], div[class*="container"]').each((i, elem) => {
    const $elem = $(elem);
    
    sections.push({
      selector: getElementSelector($elem),
      tagName: elem.tagName.toLowerCase(),
      className: $elem.attr('class') || '',
      children: [], // TODO: Extract child structure if needed
      order: i
    });
  });
  
  return { sections };
}

function extractStyling($: cheerio.CheerioAPI): {
  inlineStyles: Record<string, string>;
  cssRules: string[];
  colorScheme: CompleteExtraction['colorScheme'];
} {
  const inlineStyles: Record<string, string> = {};
  const cssRules: string[] = [];
  
  // Extract inline styles
  $('[style]').each((i, elem) => {
    const $elem = $(elem);
    const selector = getElementSelector($elem);
    inlineStyles[selector] = $elem.attr('style') || '';
  });
  
  // Extract CSS from style tags
  $('style').each((i, elem) => {
    cssRules.push($(elem).text());
  });
  
  // Extract color scheme (simplified)
  const colorScheme = extractColorScheme($);
  
  return { inlineStyles, cssRules, colorScheme };
}

function extractColorScheme($: cheerio.CheerioAPI): CompleteExtraction['colorScheme'] {
  // Simple color extraction - could be enhanced with more sophisticated analysis
  const colors = {
    primary: '#000000',
    secondary: '#666666', 
    background: '#ffffff',
    text: '#000000'
  };
  
  // Extract from common CSS variables or computed styles
  const rootStyle = $(':root').attr('style') || '';
  
  // Look for common color patterns
  const colorMatch = rootStyle.match(/--primary[^:]*:\s*([^;]+)/);
  if (colorMatch) {
    colors.primary = colorMatch[1].trim();
  }
  
  return colors;
}

function extractForms($: cheerio.CheerioAPI): CompleteExtraction['forms'] {
  const forms: CompleteExtraction['forms'] = [];
  
  $('form').each((i, elem) => {
    const $form = $(elem);
    const fields: CompleteExtraction['forms'][0]['fields'] = [];
    
    $form.find('input, textarea, select').each((j, field) => {
      const $field = $(field);
      const label = $field.prev('label').text() || 
                   $field.attr('placeholder') || 
                   $field.attr('name') || 
                   'Unnamed field';
      
      fields.push({
        label,
        type: $field.attr('type') || field.tagName.toLowerCase(),
        name: $field.attr('name') || '',
        required: $field.attr('required') !== undefined
      });
    });
    
    forms.push({
      action: $form.attr('action') || '',
      method: $form.attr('method') || 'GET',
      fields
    });
  });
  
  return forms;
}

function extractScripts($: cheerio.CheerioAPI): CompleteExtraction['scripts'] {
  const scripts: CompleteExtraction['scripts'] = [];
  
  $('script').each((i, elem) => {
    const $elem = $(elem);
    const src = $elem.attr('src');
    
    scripts.push({
      src: src ? makeAbsoluteUrl(src) : undefined,
      inline: src ? undefined : $elem.text(),
      type: $elem.attr('type') || 'text/javascript'
    });
  });
  
  return scripts;
}

function analyzeLayout($: cheerio.CheerioAPI): CompleteExtraction['layout'] {
  let hasGrid = false;
  let hasFlexbox = false;
  let hasColumns = false;
  const breakpoints: string[] = [];
  
  // Check for grid/flexbox in CSS
  $('style').each((i, elem) => {
    const css = $(elem).text();
    if (css.includes('display: grid') || css.includes('display:grid')) {
      hasGrid = true;
    }
    if (css.includes('display: flex') || css.includes('display:flex')) {
      hasFlexbox = true;
    }
    if (css.includes('columns:') || css.includes('column-count:')) {
      hasColumns = true;
    }
    
    // Extract media queries
    const mediaQueries = css.match(/@media[^{]+/g) || [];
    breakpoints.push(...mediaQueries);
  });
  
  return { hasGrid, hasFlexbox, hasColumns, breakpoints };
}

function extractBasicContent($: cheerio.CheerioAPI): ExtractedContent {
  return {
    title: $('title').text() || $('h1').first().text() || 'Untitled',
    headings: {
      h1: $('h1').map((i, el) => $(el).text()).get(),
      h2: $('h2').map((i, el) => $(el).text()).get(),
      h3: $('h3').map((i, el) => $(el).text()).get()
    },
    paragraphs: $('p').map((i, el) => $(el).text()).get().filter(p => p.trim().length > 0),
    navigation: $('nav a, .nav a, .navbar a').map((i, el) => ({
      text: $(el).text().trim(),
      href: $(el).attr('href')
    })).get(),
    buttons: $('button, .btn, .button, input[type="submit"]').map((i, el) => $(el).text() || $(el).attr('value') || '').get(),
    images: $('img').map((i, el) => ({
      src: $(el).attr('src'),
      alt: $(el).attr('alt')
    })).get()
  };
}

// Helper functions
function makeAbsoluteUrl(url: string): string {
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }
  // For now, return as-is. In production, would need base URL
  return url;
}

function getParentSelector($elem: any): string {
  const parent = $elem.parent();
  if (parent.length === 0) return 'body';
  
  return getElementSelector(parent);
}

function getElementSelector($elem: any): string {
  const tagName = $elem.prop('tagName')?.toLowerCase() || 'div';
  const id = $elem.attr('id');
  const className = $elem.attr('class');
  
  if (id) {
    return `${tagName}#${id}`;
  }
  
  if (className) {
    const cleanClasses = className.split(' ').filter((c: string) => c.length > 0).slice(0, 2).join('.');
    return `${tagName}.${cleanClasses}`;
  }
  
  return tagName;
}

function getDataAttributes($elem: any): Record<string, string> {
  const dataAttrs: Record<string, string> = {};
  const element = $elem.get(0);
  const attributes = element?.attribs;
  
  if (!attributes) {
    return dataAttrs;
  }
  
  Object.keys(attributes).forEach(key => {
    if (key.startsWith('data-')) {
      dataAttrs[key] = attributes[key];
    }
  });
  
  return dataAttrs;
}
