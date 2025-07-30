// Quick test script for the roast API
async function testRoast() {
  console.log('🔥 Testing Portfolio Roaster API...\n');
  
  const testUrl = 'https://mattfarley.ca'; // Example portfolio
  
  try {
    console.log('📍 Testing with portfolio:', testUrl);
    console.log('⏳ Generating roast...\n');
    
    const response = await fetch('http://localhost:3002/api/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SUCCESS!\n');
      console.log('👤 Portfolio Name:', result.portfolioName);
      console.log('🎤 Audio URL Length:', result.audioUrl?.length || 0, 'chars');
      console.log('\n📝 THE ROAST:\n');
      console.log(result.text);
      console.log('\n🎧 Audio ready for playback!');
    } else {
      console.log('❌ FAILED:', result.error);
      console.log('Details:', result.details);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRoast();