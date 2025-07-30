import { NextRequest, NextResponse } from 'next/server';
import { browserlessCapture } from '@/lib/browserless-correct';
import { extractPortfolioContent } from '@/lib/portfolio-extractor';
import { generateRoast } from '@/lib/roast-generator';
import { generateAudioRoast, audioBufferToDataUrl } from '@/lib/elevenlabs-tts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }
    
    console.log('🔥 Starting roast generation for:', url);
    
    // 1. Capture the website content
    console.log('📸 Capturing website content...');
    const { html } = await browserlessCapture(url);
    
    // 2. Extract portfolio content
    console.log('🔍 Extracting portfolio content...');
    const portfolioContent = extractPortfolioContent(html);
    console.log(`   Found: ${portfolioContent.name}, ${portfolioContent.projects.length} projects, ${portfolioContent.skills.length} skills`);
    
    // 3. Generate the roast
    console.log('🤖 Generating savage roast...');
    const roastText = await generateRoast(portfolioContent);
    console.log('   Roast generated, length:', roastText.length);
    
    // 4. Convert to speech
    console.log('🎙️ Converting roast to audio...');
    const audioBuffer = await generateAudioRoast(roastText);
    const audioUrl = audioBufferToDataUrl(audioBuffer);
    console.log('   Audio generated, size:', (audioBuffer.length / 1024).toFixed(1), 'KB');
    
    return NextResponse.json({
      success: true,
      text: roastText,
      audioUrl,
      portfolioName: portfolioContent.name
    });
    
  } catch (error) {
    console.error('❌ Roast generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate roast',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Portfolio Roaster API',
    endpoint: 'POST /api/roast',
    requiredBody: {
      url: 'string - The portfolio URL to roast'
    }
  });
}