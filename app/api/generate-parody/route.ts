import { NextRequest, NextResponse } from 'next/server';
import { captureWebsite } from '@/lib/capture';
import { extractContent } from '@/lib/extract';
import { generateParody } from '@/lib/parody';
import { generateHTML } from '@/lib/generate';
import { generateImage, generateParodyImagePrompt } from '@/lib/image-generation';
import { ParodyStyleKey } from '@/lib/styles';

export async function POST(req: NextRequest) {
  try {
    const { url, style }: { url: string; style: ParodyStyleKey } = await req.json();
    
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

    // 1. Capture website
    console.log('Capturing website:', url);
    const { screenshot, html } = await captureWebsite(url);
    
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
      screenshotTaken: screenshot.length > 0
    });
    
  } catch (error) {
    console.error('Parody generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate parody',
        details: errorMessage
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
