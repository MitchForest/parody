// Test Browserless API with correct token parameter format
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BROWSERLESS_API_KEY;

console.log('🧪 Testing Browserless with ?token= parameter...');
console.log('API Key format:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

async function testCorrectFormat() {
  const testUrl = 'https://example.com';
  
  console.log('\n🔄 Testing Screenshot API with ?token= parameter');
  
  try {
    // EXACT format from Browserless docs: ?token=YOUR_TOKEN
    const screenshotUrl = `https://chrome.browserless.io/screenshot?token=${API_KEY}`;
    
    const response = await fetch(screenshotUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: testUrl,
        fullPage: true,
        type: 'png'
      })
    });
    
    console.log(`Screenshot Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Screenshot API works!');
      console.log(`Response size: ${response.headers.get('content-length')} bytes`);
      
      // Test content API too
      console.log('\n🔄 Testing Content API with ?token= parameter');
      
      const contentUrl = `https://chrome.browserless.io/content?token=${API_KEY}`;
      const contentResponse = await fetch(contentUrl, {
        method: 'POST',
        headers: {
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
        console.log(`HTML preview: ${html.substring(0, 200)}...`);
        
        return true;
      } else {
        const errorText = await contentResponse.text();
        console.log('❌ Content API failed:', errorText.substring(0, 200));
        return false;
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Screenshot API failed:', errorText.substring(0, 500));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Run the test
testCorrectFormat()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCCESS! Browserless API is working correctly!');
      console.log('\n📝 Correct implementation:');
      console.log('Screenshot: https://chrome.browserless.io/screenshot?token=YOUR_TOKEN');
      console.log('Content: https://chrome.browserless.io/content?token=YOUR_TOKEN');
      console.log('Method: POST with JSON body');
    } else {
      console.log('\n💔 Browserless API still not working');
      console.log('Check your account at https://browserless.io');
    }
  })
  .catch(console.error);
