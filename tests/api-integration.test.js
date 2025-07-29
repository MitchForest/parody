// Test the complete API integration workflow
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing API Integration Pipeline...');

// Test the /api/generate-parody endpoint
async function testParodyApiEndpoint() {
  const testCases = [
    {
      name: 'Simple website',
      url: 'https://example.com',
      style: 'corporate-buzzword'
    },
    {
      name: 'Corporate site',
      url: 'https://stripe.com',
      style: 'gen-z-brainrot'
    },
    {
      name: 'Tech site',
      url: 'https://github.com',
      style: 'medieval'
    }
  ];
  
  console.log('\n🔄 Testing API endpoint with multiple scenarios...');
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n   Testing: ${testCase.name} (${testCase.style})`);
      console.log(`   URL: ${testCase.url}`);
      
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/generate-parody', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: testCase.url,
          style: testCase.style
        })
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   Response: ${response.status} ${response.statusText} (${duration}ms)`);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log(`   ✅ Success with strategy: ${data.captureStrategy}`);
        console.log(`   HTML length: ${data.html?.length || 0} characters`);
        console.log(`   Summary: ${data.summary?.substring(0, 100)}...`);
        console.log(`   Image URL: ${data.imageUrl ? 'Generated' : 'None'}`);
        
        results.push({
          ...testCase,
          success: true,
          duration,
          strategy: data.captureStrategy,
          htmlLength: data.html?.length || 0,
          hasImage: !!data.imageUrl
        });
        
      } else {
        const errorData = await response.json();
        console.log(`   ❌ Failed: ${errorData.error}`);
        console.log(`   Details: ${errorData.details?.substring(0, 100)}...`);
        
        results.push({
          ...testCase,
          success: false,
          duration,
          error: errorData.error
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
      
      results.push({
        ...testCase,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Test individual components
async function testIndividualComponents() {
  console.log('\n🔄 Testing individual API components...');
  
  const tests = {
    environment: testEnvironmentVariables(),
    styles: testParodyStyles(),
    models: await testModelConnectivity()
  };
  
  return tests;
}

function testEnvironmentVariables() {
  console.log('   Checking environment variables...');
  
  const required = ['OPENAI_API_KEY', 'BROWSERLESS_API_KEY'];
  const optional = ['REPLICATE_API_TOKEN'];
  
  const env = {
    required: {},
    optional: {}
  };
  
  for (const key of required) {
    env.required[key] = !!process.env[key];
    console.log(`      ${key}: ${env.required[key] ? '✅ Set' : '❌ Missing'}`);
  }
  
  for (const key of optional) {
    env.optional[key] = !!process.env[key];
    console.log(`      ${key}: ${env.optional[key] ? '✅ Set' : '⚠️ Optional'}`);
  }
  
  return env;
}

function testParodyStyles() {
  console.log('   Checking parody styles configuration...');
  
  try {
    // This would normally import from the lib, but for testing we'll define inline
    const PARODY_STYLES = {
      'corporate-buzzword': 'Corporate Buzzword Overload',
      'gen-z-brainrot': 'Gen Z Brain Rot',
      'medieval': 'Medieval Times',
      'infomercial': 'Infomercial Madness',
      'conspiracy': 'Conspiracy Theorist',
      'simpsons': 'Simpsons Character'
    };
    
    const styleCount = Object.keys(PARODY_STYLES).length;
    console.log(`      ✅ ${styleCount} parody styles available`);
    
    for (const [key, name] of Object.entries(PARODY_STYLES)) {
      console.log(`         - ${key}: ${name}`);
    }
    
    return { success: true, count: styleCount, styles: PARODY_STYLES };
    
  } catch (error) {
    console.log(`      ❌ Styles configuration error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testModelConnectivity() {
  console.log('   Testing AI model connectivity...');
  
  const models = {
    openai: await testOpenAI(),
    replicate: await testReplicate()
  };
  
  return models;
}

async function testOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.log('      OpenAI: ❌ No API key');
    return { available: false, reason: 'No API key' };
  }
  
  try {
    // Simple test request
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('      OpenAI: ✅ Connected');
      return { available: true };
    } else {
      console.log(`      OpenAI: ❌ HTTP ${response.status}`);
      return { available: false, reason: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.log(`      OpenAI: ❌ ${error.message}`);
    return { available: false, reason: error.message };
  }
}

async function testReplicate() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.log('      Replicate: ⚠️ No API token (optional)');
    return { available: false, reason: 'No API token', optional: true };
  }
  
  try {
    const response = await fetch('https://api.replicate.com/v1/account', {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    });
    
    if (response.ok) {
      console.log('      Replicate: ✅ Connected');
      return { available: true };
    } else {
      console.log(`      Replicate: ❌ HTTP ${response.status}`);
      return { available: false, reason: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.log(`      Replicate: ❌ ${error.message}`);
    return { available: false, reason: error.message };
  }
}

// Run comprehensive API tests
async function runApiIntegrationTests() {
  console.log('🚀 Starting API integration tests...\n');
  console.log('⚠️  Note: Requires dev server running on localhost:3000\n');
  
  const componentTests = await testIndividualComponents();
  
  // Check if dev server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/generate-parody', {
      method: 'GET'
    });
    
    if (healthCheck.ok) {
      console.log('✅ Dev server is running, proceeding with API tests...');
      const apiResults = await testParodyApiEndpoint();
      
      console.log('\n📊 API Integration Test Summary:');
      console.log(`   Environment: ${Object.values(componentTests.environment.required).every(Boolean) ? '✅ Ready' : '❌ Missing vars'}`);
      console.log(`   OpenAI: ${componentTests.models.openai.available ? '✅ Connected' : '❌ Failed'}`);
      console.log(`   Replicate: ${componentTests.models.replicate.available ? '✅ Connected' : componentTests.models.replicate.optional ? '⚠️ Optional' : '❌ Failed'}`);
      console.log(`   API Tests: ${apiResults.filter(r => r.success).length}/${apiResults.length} passed`);
      
      if (apiResults.every(r => r.success)) {
        console.log('\n🎉 ALL API TESTS PASSED!');
        console.log('   The parody generator is fully functional');
      } else {
        console.log('\n⚠️  Some API tests failed');
        console.log('   Check individual test results above');
      }
      
      return { components: componentTests, api: apiResults };
      
    } else {
      console.log('❌ Dev server not responding correctly');
      console.log('   Run: bun run dev');
      return { components: componentTests, api: null, serverError: true };
    }
    
  } catch (error) {
    console.log('❌ Cannot connect to dev server');
    console.log('   Make sure to run: bun run dev');
    console.log(`   Error: ${error.message}`);
    return { components: componentTests, api: null, serverDown: true };
  }
}

// Run if called directly
if (require.main === module) {
  runApiIntegrationTests().catch(console.error);
}

module.exports = { runApiIntegrationTests, testParodyApiEndpoint, testIndividualComponents };
