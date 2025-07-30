import { NextRequest, NextResponse } from 'next/server';
import { generateAudioRoast, audioBufferToDataUrl } from '@/lib/elevenlabs-tts';

export async function POST(_req: NextRequest) {
  try {
    const introText = "Oh boy! It's time to get roasted! We're live streaming this, right? If that's the case, lemme turn off my safety filters so we can go full bore on these portfolio pages. Let's see what we're working with here...";
    
    console.log('🎤 Generating intro audio with ElevenLabs...');
    
    // Generate audio using the same voice as roasts
    const audioBuffer = await generateAudioRoast(introText);
    const audioUrl = audioBufferToDataUrl(audioBuffer);
    
    console.log('✅ Intro audio generated, size:', (audioBuffer.length / 1024).toFixed(1), 'KB');
    
    return NextResponse.json({
      success: true,
      audioUrl,
      size: audioBuffer.length
    });
    
  } catch (error) {
    console.error('❌ Intro audio generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate intro audio',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Intro Audio Generator API',
    endpoint: 'POST /api/intro-audio',
    description: 'Generates the AI comedian intro audio using ElevenLabs TTS'
  });
}