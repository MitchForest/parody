import { NextRequest, NextResponse } from 'next/server';
import { captureWithFallbacks } from '@/lib/capture-strategies';
import { extractContent } from '@/lib/extract';
import { generateParody } from '@/lib/parody';
import { generateHTML } from '@/lib/generate';
import { generateImage, generateParodyImagePrompt } from '@/lib/image-generation';
import { ParodyStyleKey } from '@/lib/styles';

export async function POST(req: NextRequest) {
  let url: string = '';
  let style: ParodyStyleKey = 'corporate-buzzword';
  
  try {
    const body = await req.json();
    url = body.url;
    style = body.style;
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }
    
    if (!style) {
      return NextResponse.json(
        { success: false, error: 'Style is required' },
        { status: 400 }
      );
    }

    // 1. Capture website with fallback strategies
    console.log('🚀 Starting capture for:', url);
    const { screenshot, html, strategy } = await captureWithFallbacks(url);
    console.log(`✅ Captured with strategy: ${strategy}`);
    
    // 2. Extract content
    console.log('Extracting content...');
    const content = extractContent(html);
    
    // 3. Generate parody with GPT-4o
    console.log('Generating parody with style:', style);
    const parodyContent = await generateParody(content, style);
    
    // 4. Create HTML output
    console.log('Generating HTML output...');
    const parodyHTML = generateHTML(content, parodyContent);
    
    // 5. Optional: Generate shareable image
    console.log('Generating parody image (optional)...');
    const imagePrompt = generateParodyImagePrompt(parodyContent);
    const shareImage = await generateImage(screenshot, imagePrompt);
    
    return NextResponse.json({
      success: true,
      html: parodyHTML,
      imageUrl: shareImage,
      originalUrl: url,
      style: style,
      summary: parodyContent.summary,
      captureStrategy: strategy,
      screenshotTaken: screenshot.length > 0
    });
    
  } catch (error) {
    console.error('❌ Parody generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
    
    // Log detailed error for debugging
    console.error('Error details:', {
      requestUrl: url,
      requestStyle: style,
      errorType,
      errorMessage,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate parody',
        details: errorMessage,
        errorType,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Parody Generator API',
    endpoints: {
      'POST /api/generate-parody': 'Generate a parody of a website'
    },
    requiredBody: {
      url: 'string - The URL to parodify',
      style: 'string - The parody style to use'
    }
  });
}
