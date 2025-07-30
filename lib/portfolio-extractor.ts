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
  
  // Extract projects - enhanced selectors for modern portfolios
  const projects: PortfolioContent['projects'] = [];
  
  // Try multiple selector strategies
  const projectSelectors = [
    '.project, .portfolio-item, article, .work-item, .card',
    '[class*="project"]:not(button):not(a)',
    '[class*="work"]:not(nav):not(button)',
    '[class*="portfolio"]:not(nav):not(button)',
    '[data-project], [data-work]',
    'section > div > div > div',
    '.grid > div, .flex > div'
  ];
  
  projectSelectors.forEach(selector => {
    $(selector).each((_, el) => {
      const $el = $(el);
      const projectName = $el.find('h1, h2, h3, h4, [class*="title"], [class*="heading"]').first().text().trim() ||
                          $el.children().first().text().trim();
      const projectDesc = $el.find('p, [class*="description"], [class*="summary"]').first().text().trim() ||
                          $el.text().substring(0, 200).trim();
      const techs = $el.find('.tech, .technology, .stack, .tag, .badge, [class*="tech"], [class*="skill"], span')
        .map((_, tech) => {
          const text = $(tech).text().trim();
          return text.length > 1 && text.length < 30 ? text : null;
        })
        .get()
        .filter(t => t);
      
      // Check if this looks like a project (has name and some content)
      if (projectName && projectName.length > 2 && projectName.length < 100 && 
          (projectDesc.length > 10 || techs.length > 0)) {
        // Avoid duplicates
        const exists = projects.some(p => p.name === projectName);
        if (!exists) {
          projects.push({
            name: projectName,
            description: projectDesc,
            technologies: [...new Set(techs)], // Remove duplicate techs
            link: $el.find('a[href*="github"], a[href*="live"], a[href*="demo"]').first().attr('href') || ''
          });
        }
      }
    });
  });
  
  // Fallback: Look for project sections by headings
  if (projects.length === 0) {
    $('h2, h3, h4').each((_, heading) => {
      const headingText = $(heading).text().toLowerCase();
      if (headingText.includes('project') || headingText.includes('work') || headingText.includes('portfolio')) {
        const $container = $(heading).parent();
        $container.children().each((_, child) => {
          const $child = $(child);
          if ($child.is('div, article, section')) {
            const name = $child.find('h3, h4, h5').first().text().trim() || 
                        $child.children().first().text().trim();
            if (name && name.length > 2) {
              projects.push({
                name: name,
                description: $child.text().substring(0, 200).trim(),
                technologies: [],
                link: $child.find('a').first().attr('href') || ''
              });
            }
          }
        });
      }
    });
  }
  
  // Extract skills - enhanced selectors
  const skills: string[] = [];
  const skillSelectors = [
    '.skill, .technology, .tech-stack li, .skills li',
    '[class*="skill"]:not(h1):not(h2):not(h3)',
    '[class*="tech"]:not(h1):not(h2):not(h3)',
    '.badge, .tag, .chip',
    'ul li span, ul li small'
  ];
  
  skillSelectors.forEach(selector => {
    $(selector).each((_, el) => {
      const skill = $(el).text().trim();
      if (skill && skill.length > 1 && skill.length < 50 && !skill.includes('\n')) {
        skills.push(skill);
      }
    });
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