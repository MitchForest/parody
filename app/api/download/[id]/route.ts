import { NextRequest, NextResponse } from 'next/server';
import { displayManager } from '@/lib/display-manager';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const parody = await displayManager.getParody(id);
    
    if (!parody) {
      return NextResponse.json(
        { error: 'Parody not found or expired' },
        { status: 404 }
      );
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `parody-${parody.style}-${timestamp}.html`;
    
    // Return the HTML file for download
    return new NextResponse(parody.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Download failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to download parody' },
      { status: 500 }
    );
  }
}

// Also support POST for additional download options
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { format = 'html' } = body;
    
    const parody = await displayManager.getParody(id);
    
    if (!parody) {
      return NextResponse.json(
        { error: 'Parody not found or expired' },
        { status: 404 }
      );
    }
    
    const content = parody.html;
    let contentType = 'text/html';
    let filename = `parody-${parody.style}-${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'html':
        contentType = 'text/html';
        filename += '.html';
        break;
        
      case 'pdf':
        // Could implement PDF generation here using puppeteer
        return NextResponse.json(
          { error: 'PDF format not yet implemented' },
          { status: 501 }
        );
        
      case 'zip':
        // Could implement ZIP with assets here
        return NextResponse.json(
          { error: 'ZIP format not yet implemented' },
          { status: 501 }
        );
        
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Download failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to download parody' },
      { status: 500 }
    );
  }
}
