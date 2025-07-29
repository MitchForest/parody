// Test Browserless PRODUCTION API with correct token parameter format
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BROWSERLESS_API_KEY;

console.log('🧪 Testing Browserless PRODUCTION endpoint...');
console.log('API Key format:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

async function testProductionCorrectFormat() {
  const testUrl = 'https://example.com';
  
  // Test different ways to use token with production endpoint
  const tests = [
    {
      name: 'Production with ?token= parameter',
      url: `https://production-sfo.browserless.io/chrome/screenshot?token=${API_KEY}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl,
        fullPage: true,
        type: 'png'
      })
    },
    {
      name: 'Production with token in body (as docs suggest)',
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
      name: 'Production with Authorization header',
      url: 'https://production-sfo.browserless.io/chrome/screenshot',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
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
      
      const response = await fetch(test.url.replace(API_KEY, 'HIDDEN'), {
        method: 'POST',
        headers: test.headers,
        body: test.body
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`✅ SUCCESS: ${test.name} works!`);
        console.log(`   Response size: ${response.headers.get('content-length')} bytes`);
        
        // Also test content endpoint
        const contentUrl = test.url.includes('?token=') 
          ? `https://production-sfo.browserless.io/chrome/content?token=${API_KEY}`
          : 'https://production-sfo.browserless.io/chrome/content';
          
        const contentBody = test.url.includes('?token=')
          ? JSON.stringify({ url: testUrl })
          : test.body.replace('"type":"png",', '').replace('"fullPage":true,', '');
          
        const contentResponse = await fetch(contentUrl.replace(API_KEY, 'HIDDEN'), {
          method: 'POST',
          headers: test.headers,
          body: contentBody
        });
        
        console.log(`   Content API: ${contentResponse.status} ${contentResponse.statusText}`);
        
        if (contentResponse.ok) {
          const html = await contentResponse.text();
          console.log(`   ✅ Content works too! HTML length: ${html.length}`);
          console.log(`   HTML preview: ${html.substring(0, 100)}...`);
        }
        
        return test;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${errorText.substring(0, 300)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  return null;
}

// Run the test
testProductionCorrectFormat()
  .then(workingConfig => {
    if (workingConfig) {
      console.log('\n🎉 SUCCESS! Found working Browserless configuration!');
      console.log(`Configuration: ${workingConfig.name}`);
      console.log('\n📝 Use this in your app:');
      console.log(`URL: ${workingConfig.url.replace(API_KEY, 'YOUR_TOKEN')}`);
      console.log('Headers:', JSON.stringify(workingConfig.headers, null, 2));
      console.log('Body:', workingConfig.body.replace(API_KEY, 'YOUR_TOKEN'));
    } else {
      console.log('\n💔 All production endpoint tests failed');
      console.log('Your Browserless account may need attention:');
      console.log('1. Check account status at https://browserless.io');
      console.log('2. Verify you have credits remaining');
      console.log('3. Try generating a new API key');
    }
  })
  .catch(console.error);
