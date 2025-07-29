// Test script to diagnose Browserless API issues
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BROWSERLESS_API_KEY;

console.log('🧪 Testing Browserless API...');
console.log('API Key format:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');
console.log('API Key length:', API_KEY ? API_KEY.length : 0);

if (!API_KEY) {
  console.error('❌ BROWSERLESS_API_KEY not found in .env.local');
  process.exit(1);
}

async function testBrowserlessFormats() {
  const testUrl = 'https://example.com';
  
  // Test different authentication formats
  const tests = [
    {
      name: 'Token in URL parameter',
      url: `https://chrome.browserless.io/screenshot?token=${API_KEY}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl,
        fullPage: true,
        type: 'png'
      })
    },
    {
      name: 'Bearer token in header',
      url: 'https://chrome.browserless.io/screenshot',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        url: testUrl,
        fullPage: true,
        type: 'png'
      })
    },
    {
      name: 'Production endpoint with token in body',
      url: 'https://production-sfo.browserless.io/chrome/screenshot',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl,
        token: API_KEY,
        fullPage: true,
        type: 'png'
      })
    },
    {
      name: 'Simple token header',
      url: 'https://chrome.browserless.io/screenshot',
      headers: { 
        'Content-Type': 'application/json',
        'token': API_KEY
      },
      body: JSON.stringify({
        url: testUrl,
        fullPage: true,
        type: 'png'
      })
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔄 Testing: ${test.name}`);
      console.log(`   URL: ${test.url.replace(API_KEY, 'HIDDEN')}`);
      
      const response = await fetch(test.url, {
        method: 'POST',
        headers: test.headers,
        body: test.body
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`✅ SUCCESS: ${test.name} works!`);
        
        // Test the content endpoint too
        const contentUrl = test.url.includes('production-sfo') 
          ? 'https://production-sfo.browserless.io/chrome/content'
          : test.url.includes('token=')
          ? `https://chrome.browserless.io/content?token=${API_KEY}`
          : 'https://chrome.browserless.io/content';
          
        const contentHeaders = test.url.includes('token=') 
          ? { 'Content-Type': 'application/json' }
          : test.headers;
          
        const contentBody = test.url.includes('production-sfo')
          ? JSON.stringify({ url: testUrl, token: API_KEY })
          : JSON.stringify({ url: testUrl });
          
        const contentResponse = await fetch(contentUrl, {
          method: 'POST',
          headers: contentHeaders,
          body: contentBody
        });
        
        console.log(`   Content API: ${contentResponse.status} ${contentResponse.statusText}`);
        
        if (contentResponse.ok) {
          console.log(`✅ Content endpoint also works!`);
          return test; // Return the working configuration
        }
        
      } else {
        const errorText = await response.text().catch(() => 'No error text');
        console.log(`❌ FAILED: ${errorText.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
  
  return null;
}

// Run the test
testBrowserlessFormats()
  .then(workingConfig => {
    if (workingConfig) {
      console.log(`\n🎉 Found working configuration: ${workingConfig.name}`);
      console.log('Use this format in your app!');
    } else {
      console.log('\n💔 No working configuration found');
      console.log('Possible issues:');
      console.log('1. API key is invalid or expired');
      console.log('2. Account has no credits/is suspended');
      console.log('3. API endpoint has changed');
      console.log('4. Rate limiting is in effect');
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
  });
