// Test HTML content extraction (our fallback strategy)
const cheerio = require('cheerio');

console.log('🧪 Testing HTML Content Extraction...');

// Test the enhanced HTML-only capture strategy
async function testHtmlExtraction() {
  const testUrl = 'https://example.com';
  
  console.log(`\n🔄 Testing HTML extraction for: ${testUrl}`);
  
  try {
    // Test direct fetch
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log(`   Fetch status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`   ✅ HTML fetched: ${html.length} characters`);
      
      // Test content extraction with Cheerio
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
      console.log(`      Navigation links: ${extractedContent.navigation.length} found`);
      console.log(`      Images: ${extractedContent.images.length} found`);
      
      if (extractedContent.paragraphs.length > 0) {
        console.log(`      First paragraph: "${extractedContent.paragraphs[0].substring(0, 100)}..."`);
      }
      
      return extractedContent;
    } else {
      console.log(`   ❌ Fetch failed: ${response.status}`);
      return null;
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Test CORS proxy fallback
async function testCorsProxyFallback() {
  const testUrl = 'https://stripe.com'; // Known to block direct access
  
  console.log(`\n🔄 Testing CORS proxy fallback for: ${testUrl}`);
  
  try {
    // Try AllOrigins proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(testUrl)}`;
    const response = await fetch(proxyUrl);
    
    console.log(`   Proxy status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const html = data.contents;
      
      console.log(`   ✅ Proxy HTML fetched: ${html.length} characters`);
      
      // Test extraction
      const $ = cheerio.load(html);
      const title = $('title').text();
      const h1Count = $('h1').length;
      
      console.log(`      Title: "${title}"`);
      console.log(`      H1s found: ${h1Count}`);
      
      return { title, h1Count, htmlLength: html.length };
    } else {
      console.log(`   ❌ Proxy failed: ${response.status}`);
      return null;
    }
    
  } catch (error) {
    console.log(`   ❌ Proxy error: ${error.message}`);
    return null;
  }
}

// Run tests
async function runHtmlTests() {
  console.log('🚀 Starting HTML extraction tests...\n');
  
  const directResult = await testHtmlExtraction();
  const proxyResult = await testCorsProxyFallback();
  
  console.log('\n📊 HTML Extraction Test Results:');
  console.log(`   Direct fetch: ${directResult ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   CORS proxy: ${proxyResult ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (directResult || proxyResult) {
    console.log('\n🎉 HTML extraction is WORKING! We can proceed without Browserless.');
    console.log('   The parody generator will use HTML content extraction as primary method.');
  } else {
    console.log('\n❌ Both HTML extraction methods failed. Check network connectivity.');
  }
}

runHtmlTests().catch(console.error);
