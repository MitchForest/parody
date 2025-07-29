# 🧪 Parody Generator Tests

This directory contains all the working tests for the parody site generator. Each test file focuses on a specific component or integration.

## 📋 Available Tests

### 🔧 **Component Tests**

#### `bun run test:browserless`
Tests the Browserless.io API integration with the correct official format:
- ✅ Screenshot API with production endpoints
- ✅ Content API for HTML extraction  
- ✅ Authentication with `?token=` parameter
- ✅ Regional endpoint testing

#### `bun run test:html`
Tests the HTML content extraction and parsing pipeline:
- ✅ Direct website fetching
- ✅ CORS proxy fallback mechanisms
- ✅ Cheerio content parsing
- ✅ Multi-site compatibility testing

#### `bun run test:endpoints`
Tests different Browserless regional endpoints:
- ✅ San Francisco (production-sfo.browserless.io)
- ✅ London (production-lon.browserless.io) 
- ✅ Amsterdam (production-ams.browserless.io)

### 🔗 **Integration Tests**

#### `bun run test` (Main Test Suite)
Tests the complete API integration workflow:
- ✅ `/api/generate-parody` endpoint
- ✅ Environment variables configuration
- ✅ OpenAI API connectivity
- ✅ Replicate API connectivity (optional)
- ✅ End-to-end parody generation

## 🚀 Quick Test Commands

```bash
# Test everything (requires dev server running)
bun run test

# Test individual components
bun run test:browserless    # Browserless API
bun run test:html          # HTML extraction
bun run test:endpoints     # Regional endpoints

# Before running integration tests
bun run dev                # Start dev server first
```

## 📊 Test Results Interpretation

### ✅ **Success Indicators**
- All API endpoints return 200 OK
- Content extraction produces structured data
- Environment variables are properly configured
- AI models are accessible

### ❌ **Failure Indicators**
- 401/403 errors → Check API keys
- Network timeouts → Check connectivity
- Missing env vars → Check `.env.local`
- Dev server not running → Run `bun run dev`

## 🔧 **Test Requirements**

### **Environment Variables**
```env
OPENAI_API_KEY=sk-...          # Required for AI transformation
BROWSERLESS_API_KEY=...        # Required for website capture
REPLICATE_API_TOKEN=r8_...     # Optional for image generation
```

### **Network Access**
- Internet connectivity for external APIs
- Access to test websites (example.com, etc.)
- CORS proxy services (api.allorigins.win)

### **Dev Server** (for integration tests)
- Next.js dev server running on localhost:3000
- All API routes properly configured

## 📝 **Adding New Tests**

When adding new test files:

1. **Name Convention**: `feature-name.test.js`
2. **Add to package.json**: Include in scripts section
3. **Use Console Logging**: Clear ✅/❌ indicators
4. **Export Functions**: Allow module imports
5. **Handle Errors**: Graceful failure messages

### **Example Test Structure**
```javascript
// tests/new-feature.test.js
console.log('🧪 Testing New Feature...');

async function testNewFeature() {
  try {
    // Test logic here
    console.log('✅ Test passed');
    return { success: true };
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  testNewFeature().catch(console.error);
}

module.exports = { testNewFeature };
```

## 🎯 **Test Coverage**

- ✅ **Browserless API**: Complete integration testing
- ✅ **HTML Extraction**: Content parsing and fallbacks  
- ✅ **API Routes**: End-to-end workflow testing
- ✅ **Environment**: Configuration validation
- ✅ **AI Models**: Connectivity verification
- ⚠️ **Frontend**: UI testing not implemented
- ⚠️ **Performance**: Load testing not implemented

These tests ensure the parody generator is fully functional and reliable!
