import * as cheerio from 'cheerio';

export interface PortfolioContent {
  name: string;
  tagline: string;
  title: string;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  skills: string[];
  aboutMe: string;
  socialLinks: string[];
  experience: string[];
  education: string[];
  testimonials: string[];
  contactInfo: string[];
}

export function extractPortfolioContent(html: string): PortfolioContent {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style').remove();
  
  // Extract name - try various selectors
  const name = 
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().split('-')[0].trim() ||
    'Anonymous Developer';
  
  // Extract tagline/subtitle
  const tagline = 
    $('h2').first().text().trim() ||
    $('meta[name="description"]').attr('content') ||
    $('.hero-subtitle, .tagline, .subtitle').first().text().trim() ||
    '';
  
  // Extract title/role
  const title = 
    $('.role, .title, .position').first().text().trim() ||
    $('h2:contains("Developer"), h2:contains("Engineer"), h2:contains("Designer")').first().text().trim() ||
    '';
  
  // Extract projects
  const projects: PortfolioContent['projects'] = [];
  $('.project, .portfolio-item, article, .work-item, .card').each((_, el) => {
    const $el = $(el);
    const projectName = $el.find('h3, h4, .project-title').first().text().trim();
    const projectDesc = $el.find('p, .project-description').first().text().trim();
    const techs = $el.find('.tech, .technology, .stack, .tag, .badge')
      .map((_, tech) => $(tech).text().trim())
      .get()
      .filter(t => t.length > 0);
    
    if (projectName) {
      projects.push({
        name: projectName,
        description: projectDesc,
        technologies: techs,
        link: $el.find('a').first().attr('href') || ''
      });
    }
  });
  
  // Extract skills
  const skills: string[] = [];
  $('.skill, .technology, .tech-stack li, .skills li').each((_, el) => {
    const skill = $(el).text().trim();
    if (skill && skill.length < 50) { // Avoid paragraphs
      skills.push(skill);
    }
  });
  
  // Also look for skills in specific sections
  $('h2, h3').each((_, heading) => {
    const headingText = $(heading).text().toLowerCase();
    if (headingText.includes('skill') || headingText.includes('tech')) {
      $(heading).nextAll('ul, ol').first().find('li').each((_, li) => {
        skills.push($(li).text().trim());
      });
    }
  });
  
  // Extract about me
  let aboutMe = '';
  $('h2, h3').each((_, heading) => {
    const headingText = $(heading).text().toLowerCase();
    if (headingText.includes('about')) {
      aboutMe = $(heading).nextAll('p').slice(0, 3).text().trim();
    }
  });
  
  if (!aboutMe) {
    aboutMe = $('.about, .bio, .introduction').text().trim();
  }
  
  // Extract social links
  const socialLinks: string[] = [];
  $('a[href*="github.com"], a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) socialLinks.push(href);
  });
  
  // Extract experience
  const experience: string[] = [];
  $('.experience, .work-experience, .job').each((_, el) => {
    const exp = $(el).text().trim();
    if (exp && exp.length < 200) {
      experience.push(exp);
    }
  });
  
  // Extract education
  const education: string[] = [];
  $('.education, .school, .degree').each((_, el) => {
    const edu = $(el).text().trim();
    if (edu && edu.length < 200) {
      education.push(edu);
    }
  });
  
  // Extract testimonials
  const testimonials: string[] = [];
  $('.testimonial, .review, blockquote').each((_, el) => {
    const testimonial = $(el).text().trim();
    if (testimonial && testimonial.length > 20) {
      testimonials.push(testimonial);
    }
  });
  
  // Extract contact info
  const contactInfo: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    contactInfo.push($(el).attr('href') || '');
  });
  
  // Look for generic buzzwords and clichés
  const allText = $('body').text().toLowerCase();
  const cliches = [
    'passionate', 'problem solver', 'clean code', 'best practices',
    'cutting edge', 'innovative', 'creative', 'team player',
    'self-starter', 'detail-oriented', 'full stack', 'ninja',
    'rockstar', 'guru', '10x', 'unicorn'
  ];
  
  const foundCliches = cliches.filter(cliche => allText.includes(cliche));
  
  // Add clichés to skills for roasting purposes
  skills.push(...foundCliches.map(c => `[CLICHÉ: ${c}]`));
  
  return {
    name,
    tagline,
    title,
    projects: projects.slice(0, 10), // Limit to 10 projects
    skills: [...new Set(skills)].slice(0, 30), // Unique skills, max 30
    aboutMe: aboutMe.slice(0, 500), // Limit length
    socialLinks: [...new Set(socialLinks)],
    experience: experience.slice(0, 5),
    education: education.slice(0, 3),
    testimonials: testimonials.slice(0, 3),
    contactInfo: [...new Set(contactInfo)]
  };
}