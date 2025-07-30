import { NextRequest, NextResponse } from 'next/server';
import { captureWithFallbacks } from '@/lib/capture-strategies';
import { extractContent } from '@/lib/extract';
import { extractComplete } from '@/lib/extract-complete';
import { generateParody } from '@/lib/parody';
import { imageTransformer } from '@/lib/image-transformer';
import { siteReconstructor } from '@/lib/site-reconstructor';
import { displayManager } from '@/lib/display-manager';
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

    const startTime = Date.now();
    
    // 1. Capture website with fallback strategies
    console.log('🚀 Starting COMPLETE capture for:', url);
    const { html, strategy } = await captureWithFallbacks(url);
    console.log(`✅ Captured with strategy: ${strategy}`);
    
    // 2. COMPLETE extraction - everything from the website
    console.log('🔍 Performing complete extraction...');
    const completeExtraction = await extractComplete(html);
    console.log(`   - Found ${completeExtraction.images.length} images`);
    console.log(`   - Found ${completeExtraction.videos.length} videos`);
    console.log(`   - Found ${completeExtraction.documentStructure.sections.length} sections`);
    
    // 3. Generate parody text content with GPT-4o
    console.log('🤖 Generating parody text content...');
    const basicContent = extractContent(html); // For text transformation
    const parodyContent = await generateParody(basicContent, style);
    
    // 4. Transform images with AI (limit to first 5 for demo)
    console.log('🎨 Transforming images with AI...');
    const imagesToTransform = completeExtraction.images.slice(0, 5).map(img => ({
      url: img.src,
      context: img.context
    }));
    
    const transformedImages = await imageTransformer.transformMultipleImages(
      imagesToTransform,
      style
    );
    
    // 5. Reconstruct complete website
    console.log('🔨 Reconstructing complete website...');
    const transformedContent = {
      text: {
        title: parodyContent.title,
        headings: parodyContent.headings,
        paragraphs: parodyContent.paragraphs,
        navigation: parodyContent.navigation,
        buttons: parodyContent.buttons
      },
      images: transformedImages
    };
    
    const reconstructedSite = await siteReconstructor.reconstructSite(
      completeExtraction,
      transformedContent,
      style
    );
    
    // 6. Prepare display options
    console.log('📄 Preparing display options...');
    const displayResult = await displayManager.displayParody(
      reconstructedSite,
      url,
      style,
      {
        imagesTransformed: transformedImages.length,
        processingTime: Date.now() - startTime
      }
    );
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      ...displayResult,
      originalUrl: url,
      style: style,
      summary: parodyContent.summary,
      captureStrategy: strategy,
      stats: {
        totalProcessingTime: totalTime,
        imagesTransformed: transformedImages.length,
        sectionsFound: completeExtraction.documentStructure.sections.length,
        videosFound: completeExtraction.videos.length,
        formsFound: completeExtraction.forms.length
      }
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
