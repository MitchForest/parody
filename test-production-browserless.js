// Test the correct Browserless production endpoint
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BROWSERLESS_API_KEY;

console.log('🧪 Testing Browserless Production API...');
console.log('API Key format:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

async function testProductionEndpoint() {
  const testUrl = 'https://example.com';
  
  // Based on Browserless docs, try different auth methods for production endpoint
  const tests = [
    {
      name: 'Production with API-Token header',
      url: 'https://production-sfo.browserless.io/chrome/screenshot',
      headers: { 
        'Content-Type': 'application/json',
        'API-Token': API_KEY
      },
      body: JSON.stringify({
        url: testUrl,
        fullPage: true,
        type: 'png'
      })
    },
    {
      name: 'Production with Authorization Bearer',
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
    },
    {
      name: 'Production with token in URL',
      url: `https://production-sfo.browserless.io/chrome/screenshot?token=${API_KEY}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl,
        fullPage: true,
        type: 'png'
      })
    },
    {
      name: 'Production with token in body',
      url: 'https://production-sfo.browserless.io/chrome/screenshot',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl,
        token: API_KEY,
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
        return test;
      } else {
        const errorText = await response.text().catch(() => 'No error text');
        console.log(`❌ FAILED: ${errorText.substring(0, 300)}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
  
  return null;
}

// Also test if the API key is valid by checking a simple endpoint
async function testApiKeyValidity() {
  try {
    console.log('\n🔍 Testing API key validity...');
    
    // Try to get account info or limits
    const response = await fetch('https://production-sfo.browserless.io/pressure', {
      headers: {
        'API-Token': API_KEY
      }
    });
    
    console.log(`Pressure endpoint: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid! System pressure:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ API key may be invalid:', errorText.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing API key:', error.message);
    return false;
  }
}

// Run tests
async function runAllTests() {
  const keyValid = await testApiKeyValidity();
  
  if (keyValid) {
    const workingConfig = await testProductionEndpoint();
    
    if (workingConfig) {
      console.log(`\n🎉 SUCCESS! Working configuration found: ${workingConfig.name}`);
      console.log('\n📝 Implementation for your app:');
      console.log('```javascript');
      console.log(`const response = await fetch('${workingConfig.url.replace(API_KEY, '${API_KEY}')}', {`);
      console.log('  method: "POST",');
      console.log('  headers:', JSON.stringify(workingConfig.headers, null, 4).replace(API_KEY, '${API_KEY}'));
      console.log('  body:', workingConfig.body.replace(API_KEY, '${API_KEY}'));
      console.log('});');
      console.log('```');
    } else {
      console.log('\n💔 No working screenshot configuration found');
    }
  } else {
    console.log('\n🚨 API key appears to be invalid or account has issues');
    console.log('Please check:');
    console.log('1. Your Browserless account status');
    console.log('2. API key is correct and not expired');
    console.log('3. Account has sufficient credits');
  }
}

runAllTests().catch(console.error);
