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
    
    // Return the raw HTML content
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: parody.html }}
        style={{ width: '100%', height: '100vh' }}
      />
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
