// Test Browserless API with EXACT format from official docs
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BROWSERLESS_API_KEY;

console.log('🧪 Testing Browserless with OFFICIAL docs format...');
console.log('API Key format:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

async function testOfficialFormat() {
  const testUrl = 'https://example.com';
  
  console.log('\n🔄 Testing Screenshot API with official format');
  console.log('URL: https://production-sfo.browserless.io/screenshot?token=YOUR_TOKEN');
  console.log('Headers: Cache-Control: no-cache, Content-Type: application/json');
  
  try {
    // EXACT format from official Browserless docs
    const response = await fetch(`https://production-sfo.browserless.io/screenshot?token=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: testUrl,
        options: {
          fullPage: true,
          type: 'png'
        }
      })
    });
    
    console.log(`Screenshot Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Screenshot API works with official format!');
      console.log(`Response size: ${response.headers.get('content-length')} bytes`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      // Now test the content/scrape API
      console.log('\n🔄 Testing Content/Scrape API...');
      
      // Try scrape endpoint (based on docs mentioning /rest-apis/scrape)
      const scrapeResponse = await fetch(`https://production-sfo.browserless.io/scrape?token=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: testUrl,
          elements: [
            { selector: 'title' },
            { selector: 'h1' },
            { selector: 'h2' },
            { selector: 'p' }
          ]
        })
      });
      
      console.log(`Scrape Status: ${scrapeResponse.status} ${scrapeResponse.statusText}`);
      
      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        console.log('✅ Scrape API works too!');
        console.log('Scraped elements:', scrapeData);
        
        return { screenshot: true, scrape: true };
      } else {
        // Try legacy content endpoint
        console.log('Scrape failed, trying legacy content endpoint...');
        
        const contentResponse = await fetch(`https://production-sfo.browserless.io/content?token=${API_KEY}`, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: testUrl
          })
        });
        
        console.log(`Content Status: ${contentResponse.status} ${contentResponse.statusText}`);
        
        if (contentResponse.ok) {
          const html = await contentResponse.text();
          console.log('✅ Content API works!');
          console.log(`HTML length: ${html.length} characters`);
          console.log(`HTML preview: ${html.substring(0, 150)}...`);
          
          return { screenshot: true, content: true };
        } else {
          const errorText = await contentResponse.text();
          console.log('❌ Content API failed:', errorText.substring(0, 200));
          return { screenshot: true, content: false };
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Screenshot API failed:', errorText.substring(0, 500));
      
      // Check if it's a plan/endpoint issue
      if (response.status === 401) {
        console.log('\n🔍 Checking account plan compatibility...');
        console.log('The docs mention: "You might be using an endpoint not supported by your plan"');
        console.log('Possible issues:');
        console.log('1. Using v2 endpoints when on dedicated/legacy plan');
        console.log('2. API key expired or invalid');
        console.log('3. Account suspended or out of credits');
        console.log('4. Wrong regional endpoint');
      }
      
      return { screenshot: false };
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { screenshot: false };
  }
}

// Test different regional endpoints
async function testRegionalEndpoints() {
  const endpoints = [
    'https://production-sfo.browserless.io', // San Francisco (default US)
    'https://production-lon.browserless.io', // London, UK
    'https://production-ams.browserless.io'  // Amsterdam, NL
  ];
  
  console.log('\n🌍 Testing regional endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔄 Testing: ${endpoint}`);
      
      const response = await fetch(`${endpoint}/screenshot?token=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://example.com',
          options: {
            fullPage: true,
            type: 'png'
          }
        })
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ ${endpoint} works!`);
        return endpoint;
      }
      
    } catch (error) {
      console.log(`   ❌ ${endpoint} failed: ${error.message}`);
    }
  }
  
  return null;
}

// Run comprehensive test
async function runComprehensiveTest() {
  console.log('🚀 Running comprehensive Browserless test...\n');
  
  const primaryResult = await testOfficialFormat();
  
  if (!primaryResult.screenshot) {
    console.log('\n🌍 Primary endpoint failed, testing regional endpoints...');
    const workingEndpoint = await testRegionalEndpoints();
    
    if (workingEndpoint) {
      console.log(`\n✅ Found working endpoint: ${workingEndpoint}`);
    } else {
      console.log('\n❌ All endpoints failed');
    }
  }
  
  console.log('\n📊 Final Results:');
  console.log(`   Screenshot API: ${primaryResult.screenshot ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Content/Scrape API: ${primaryResult.scrape || primaryResult.content ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (primaryResult.screenshot) {
    console.log('\n🎉 SUCCESS! Browserless is working correctly!');
    console.log('\n📝 Correct implementation:');
    console.log('URL: https://production-sfo.browserless.io/screenshot?token=YOUR_TOKEN');
    console.log('Headers: Cache-Control: no-cache, Content-Type: application/json');
    console.log('Body: { "url": "...", "options": { "fullPage": true, "type": "png" } }');
  } else {
    console.log('\n💔 Browserless API is not working');
    console.log('Next steps:');
    console.log('1. Check your account at https://browserless.io');
    console.log('2. Verify API key is correct');
    console.log('3. Check account credits and status');
    console.log('4. Try generating a new API key');
  }
}

runComprehensiveTest().catch(console.error);
