import { NextRequest, NextResponse } from 'next/server';
import { displayManager } from '@/lib/display-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const parody = await displayManager.getParody(id);
    
    if (!parody) {
      return new NextResponse('Parody not found', { status: 404 });
    }
    
    // Return the raw HTML content directly
    return new NextResponse(parody.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Robots-Tag': 'noindex, nofollow' // Don't index parody content
      }
    });
  } catch (error) {
    console.error('Failed to serve parody:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
