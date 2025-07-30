export async function generateAudioRoast(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVEN_LABS_API_KEY not configured');
  }
  
  // Using the provided voice ID
  const voiceId = 'UgBBYS2sOqTuMpoF3BR0';
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2', // Using the v2 model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          },
          // Speed up the voice by 1.2x
          output_format: 'mp3_44100_128'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      throw new Error(`ElevenLabs API failed: ${response.status} - ${error}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return audioBuffer;
  } catch (error) {
    console.error('TTS generation error:', error);
    throw new Error('Failed to generate audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Alternative voices for different roast styles
export const VOICE_OPTIONS = {
  adam: 'pNInz6obpgDQGcFmaJgB', // Friendly but sarcastic
  antoni: 'ErXwobaYiN019PkySvjV', // More dramatic
  arnold: 'VR6AewLTigWG4xSOukaG', // Deep and authoritative
  bella: 'EXAVITQu4vr4xnSDxMaL', // Female voice option
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Young and energetic
};

// Get a data URL from the audio buffer for frontend playback
export function audioBufferToDataUrl(buffer: Buffer): string {
  const base64 = buffer.toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
}