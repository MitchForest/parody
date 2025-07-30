import { NextRequest, NextResponse } from 'next/server';
import { generateAudioRoast, audioBufferToDataUrl } from '@/lib/elevenlabs-tts';

export async function POST(_req: NextRequest) {
  try {
    const cookingText = "Oh boy! It's time to cook. Gimme a sec while I review this abomination of a portfolio and remove my safety filters.";
    
    console.log('🔥 Generating cooking audio with ElevenLabs...');
    
    // Generate audio using the same voice as roasts
    const audioBuffer = await generateAudioRoast(cookingText);
    const audioUrl = audioBufferToDataUrl(audioBuffer);
    
    console.log('✅ Cooking audio generated, size:', (audioBuffer.length / 1024).toFixed(1), 'KB');
    
    return NextResponse.json({
      success: true,
      audioUrl,
      size: audioBuffer.length
    });
    
  } catch (error) {
    console.error('❌ Cooking audio generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate cooking audio',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cooking Audio Generator API',
    endpoint: 'POST /api/cooking-audio',
    description: 'Generates the AI comedian cooking audio using ElevenLabs TTS'
  });
}