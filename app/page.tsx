'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PARODY_STYLES } from '@/lib/styles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Globe, Sparkles } from 'lucide-react';

interface ParodyResult {
  success: boolean;
  parodyId?: string;
  parodyUrl?: string;
  blobUrl?: string;
  comparisonUrl?: string;
  downloadUrl?: string;
  originalUrl: string;
  style: string;
  summary: string;
  captureStrategy?: string;
  stats?: {
    imagesTransformed: number;
    textElementsTransformed: number;
    stylesApplied: number;
    totalProcessingTime: number;
    fileSize: number;
  };
  error?: string;
  errorType?: string;
  timestamp?: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState('corporate-buzzword');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParodyResult | null>(null);

  const generateParody = async () => {
    if (!url) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/generate-parody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, style })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Generation failed:', error);
      setResult({
        success: false,
        originalUrl: url,
        style,
        summary: '',
        error: 'Network error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const openParody = () => {
    if (!result?.parodyUrl) return;
    window.open(result.parodyUrl, '_blank');
  };
  
  const openComparison = () => {
    if (!result?.comparisonUrl) return;
    window.open(result.comparisonUrl, '_blank');
  };
  
  const downloadParody = () => {
    if (!result?.downloadUrl) return;
    window.open(result.downloadUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Website Parody Generator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform any website into hilarious parodies with AI
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Generate Parody
              </CardTitle>
              <CardDescription>
                Enter a website URL and choose a parody style to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium text-gray-700">
                  Website URL
                </label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-base"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="style" className="text-sm font-medium text-gray-700">
                  Parody Style
                </label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PARODY_STYLES).map(([key, styleConfig]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{styleConfig.name}</span>
                          <span className="text-xs text-gray-500">{styleConfig.examples}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={generateParody} 
                disabled={loading || !url}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Parody...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Parody
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Preview Styles</CardTitle>
              <CardDescription>
                See what each parody style does to content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(PARODY_STYLES).map(([key, styleConfig]) => (
                  <div 
                    key={key}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      style === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setStyle(key)}
                  >
                    <h3 className="font-semibold text-sm">{styleConfig.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{styleConfig.systemPrompt}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {result && (
          <Card className="mt-8 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <>
                        <Sparkles className="h-5 w-5 text-green-500" />
                        Parody Generated!
                      </>
                    ) : (
                      <>
                        <div className="h-5 w-5 rounded-full bg-red-500" />
                        Generation Failed
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {result.success 
                      ? (
                          <div className="space-y-2">
                            <p>{result.summary}</p>
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                              <div>
                                <span>Style: {PARODY_STYLES[result.style as keyof typeof PARODY_STYLES]?.name}</span>
                                {result.captureStrategy && <div>Method: {result.captureStrategy}</div>}
                              </div>
                              {result.stats && (
                                <div>
                                  <div>Images: {result.stats.imagesTransformed}</div>
                                  <div>Time: {(result.stats.totalProcessingTime / 1000).toFixed(1)}s</div>
                                  <div>Size: {(result.stats.fileSize / 1024).toFixed(1)} KB</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      : (
                          <div className="space-y-1">
                            <p className="text-red-600">{result.error}</p>
                            {result.errorType && <p className="text-xs text-gray-500">Type: {result.errorType}</p>}
                          </div>
                        )
                    }
                  </CardDescription>
                </div>
                {result.success && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={openParody} className="bg-green-600 hover:bg-green-700">
                      🚀 Open Parody
                    </Button>
                    <Button onClick={openComparison} variant="outline">
                      🔄 Compare
                    </Button>
                    <Button onClick={downloadParody} variant="outline">
                      💾 Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            {result.success && result.blobUrl && (
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={result.blobUrl}
                    className="w-full h-[400px]"
                    title="Parody Preview"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Preview • Click &quot;🚀 Open Parody&quot; for full experience
                </p>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
