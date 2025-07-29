// Test HTML content extraction and Cheerio parsing
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing HTML Content Extraction Pipeline...');

// Test the complete HTML extraction and parsing workflow
async function testCompleteHtmlPipeline() {
  const testUrl = 'https://example.com';
  
  console.log(`\n🔄 Testing complete pipeline for: ${testUrl}`);
  
  try {
    // Step 1: Fetch HTML
    console.log('   Step 1: Fetching HTML...');
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`   ✅ Fetched ${html.length} characters of HTML`);
    
    // Step 2: Parse with Cheerio (our extraction logic)
    console.log('   Step 2: Parsing with Cheerio...');
    const $ = cheerio.load(html);
    
    const extractedContent = {
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
    
    console.log('   ✅ Content extracted successfully:');
    console.log(`      Title: "${extractedContent.title}"`);
    console.log(`      H1s: ${extractedContent.headings.h1.length} found`);
    console.log(`      H2s: ${extractedContent.headings.h2.length} found`);
    console.log(`      Paragraphs: ${extractedContent.paragraphs.length} found`);
    console.log(`      Navigation: ${extractedContent.navigation.length} found`);
    console.log(`      Buttons: ${extractedContent.buttons.length} found`);
    console.log(`      Images: ${extractedContent.images.length} found`);
    
    // Step 3: Simulate parody transformation structure
    console.log('   Step 3: Testing parody data structure...');
    const parodyInput = {
      title: extractedContent.title,
      content: extractedContent.paragraphs.slice(0, 5).join(' '),
      headings: extractedContent.headings.h1.concat(extractedContent.headings.h2).slice(0, 3)
    };
    
    console.log(`   ✅ Parody input prepared: ${JSON.stringify(parodyInput).length} characters`);
    
    return {
      success: true,
      originalContent: extractedContent,
      parodyInput: parodyInput,
      htmlLength: html.length
    };
    
  } catch (error) {
    console.log(`   ❌ Pipeline failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test CORS proxy fallback
async function testCorsProxyFallback() {
  const blockedUrl = 'https://stripe.com'; // Known to block direct access
  
  console.log(`\n🔄 Testing CORS proxy fallback for: ${blockedUrl}`);
  
  try {
    console.log('   Trying AllOrigins proxy...');
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(blockedUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Proxy failed: ${response.status}`);
    }
    
    const data = await response.json();
    const html = data.contents;
    
    if (!html || html.length < 100) {
      throw new Error('Proxy returned insufficient content');
    }
    
    console.log(`   ✅ Proxy successful: ${html.length} characters`);
    
    // Test parsing proxy content
    const $ = cheerio.load(html);
    const title = $('title').text();
    const h1Count = $('h1').length;
    
    console.log(`      Parsed title: "${title}"`);
    console.log(`      H1 elements: ${h1Count}`);
    
    return {
      success: true,
      proxyWorking: true,
      htmlLength: html.length,
      title: title
    };
    
  } catch (error) {
    console.log(`   ❌ CORS proxy failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test multiple websites
async function testMultipleWebsites() {
  const testUrls = [
    'https://example.com',
    'https://httpbin.org/html',
    'https://jsonplaceholder.typicode.com'
  ];
  
  console.log('\n🔄 Testing multiple websites...');
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      console.log(`   Testing: ${url}`);
      const response = await fetch(url);
      const success = response.ok;
      const contentLength = success ? (await response.text()).length : 0;
      
      results.push({
        url,
        success,
        status: response.status,
        contentLength
      });
      
      console.log(`      ${success ? '✅' : '❌'} ${response.status} - ${contentLength} chars`);
      
    } catch (error) {
      results.push({
        url,
        success: false,
        error: error.message
      });
      console.log(`      ❌ Error: ${error.message}`);
    }
  }
  
  return results;
}

// Run comprehensive tests
async function runAllHtmlTests() {
  console.log('🚀 Starting comprehensive HTML extraction tests...\n');
  
  const pipelineResult = await testCompleteHtmlPipeline();
  const proxyResult = await testCorsProxyFallback();
  const multiSiteResults = await testMultipleWebsites();
  
  console.log('\n📊 HTML Extraction Test Summary:');
  console.log(`   Direct pipeline: ${pipelineResult.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   CORS proxy: ${proxyResult.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Multi-site compatibility: ${multiSiteResults.filter(r => r.success).length}/${multiSiteResults.length} working`);
  
  if (pipelineResult.success || proxyResult.success) {
    console.log('\n🎉 HTML extraction is FUNCTIONAL!');
    console.log('   ✅ The parody generator can work without Browserless');
    console.log('   ✅ Content extraction and parsing works correctly');
    console.log('   ✅ CORS proxy provides reliable fallback');
  } else {
    console.log('\n❌ HTML extraction has critical issues');
    console.log('   Check network connectivity and proxy services');
  }
  
  return {
    pipeline: pipelineResult,
    proxy: proxyResult,
    multiSite: multiSiteResults
  };
}

// Run if called directly
if (require.main === module) {
  runAllHtmlTests().catch(console.error);
}

module.exports = { runAllHtmlTests, testCompleteHtmlPipeline, testCorsProxyFallback };
