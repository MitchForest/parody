import { NextRequest, NextResponse } from 'next/server';
import { captureWithFallbacks } from '@/lib/capture-strategies';
import { extractContent } from '@/lib/extract';
import { generateParody } from '@/lib/parody';
import { generateHTML } from '@/lib/generate';
import { ParodyStyleKey } from '@/lib/styles';

export async function POST(req: NextRequest) {
  let url: string = '';
  let style: ParodyStyleKey = 'corporate-buzzword';
  
  try {
    const body = await req.json();
    url = body.url;
    style = body.style;
    
    // Check required env vars
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.REPLICATE_API_TOKEN) {
      console.warn('Replicate API token not configured - image transformation disabled');
    }
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    
    // 1. Capture website
    console.log('🚀 Starting capture for:', url);
    const { html, strategy } = await captureWithFallbacks(url);
    console.log(`✅ Captured with strategy: ${strategy}`);
    
    // 2. Extract content (use existing working extraction)
    console.log('🔍 Extracting content...');
    const content = extractContent(html);
    console.log(`   - Found ${content.headings.h1.length} H1s, ${content.paragraphs.length} paragraphs`);
    
    // 3. Transform text (already working)
    console.log('🤖 Generating parody content...');
    const parodyContent = await generateParody(content, style);
    
    // 4. Generate simple HTML (skip complex image transformation for now)
    console.log('📄 Generating HTML...');
    const simpleHtml = generateHTML(content, parodyContent);
    
    const totalTime = Date.now() - startTime;
    
    // Create data URL for immediate preview
    const previewUrl = `data:text/html;base64,${Buffer.from(simpleHtml).toString('base64')}`;
    
    return NextResponse.json({
      success: true,
      html: simpleHtml,
      previewUrl,
      originalUrl: url,
      style: style,
      summary: parodyContent.summary,
      captureStrategy: strategy,
      stats: {
        totalProcessingTime: totalTime,
        imagesFound: 0, // Will add later
        sectionsFound: 0 // Will add later
      }
    });
    
  } catch (error) {
    console.error('❌ Parody generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate parody',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Parody Generator API - Simplified Version',
    endpoints: {
      'POST /api/generate-parody': 'Generate a parody of a website'
    },
    requiredBody: {
      url: 'string - The URL to parodify',
      style: 'string - The parody style to use'
    }
  });
}
