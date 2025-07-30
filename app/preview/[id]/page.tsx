import { notFound } from 'next/navigation';
import { displayManager } from '@/lib/display-manager';

interface PreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  
  try {
    const parody = await displayManager.getParody(id);
    
    if (!parody) {
      notFound();
    }
    
    // Use an iframe to display the complete HTML document
    // This prevents hydration issues and allows full HTML rendering
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(parody.html)}`;
    
    return (
      <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
        <iframe
          src={dataUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            margin: 0,
            padding: 0
          }}
          title="Parody Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  } catch (error) {
    console.error('Failed to load parody:', error);
    notFound();
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: PreviewPageProps) {
  const { id } = await params;
  
  try {
    const parody = await displayManager.getParody(id);
    
    if (!parody) {
      return {
        title: 'Parody Not Found',
        description: 'The requested parody could not be found.'
      };
    }
    
    return {
      title: `Parody - ${parody.style} style`,
      description: `A ${parody.style} style parody of ${parody.originalUrl}`,
      robots: 'noindex, nofollow' // Don't index parody pages
    };
  } catch {
    return {
      title: 'Parody Preview',
      description: 'Website parody preview'
    };
  }
}
