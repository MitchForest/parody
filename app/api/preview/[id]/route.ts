import { NextRequest, NextResponse } from 'next/server';
import { displayManager } from '@/lib/display-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Parody ID is required' },
        { status: 400 }
      );
    }

    const parody = await displayManager.getParody(id);
    
    if (!parody) {
      return NextResponse.json(
        { error: 'Parody not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      html: parody.html,
      originalUrl: parody.originalUrl,
      style: parody.style,
      createdAt: parody.createdAt,
      metadata: parody.metadata
    });

  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
