import * as cheerio from 'cheerio';

export interface ExtractedContent {
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
  images: Array<{
    alt?: string;
    src?: string;
  }>;
}

export function extractContent(html: string): ExtractedContent {
  const $ = cheerio.load(html);
  
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
    buttons: $('button, .button, .btn').map((_, el) => $(el).text()).get(),
    images: $('img').map((_, el) => ({
      alt: $(el).attr('alt'),
      src: $(el).attr('src')
    })).get()
  };
}
