'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Flame, Volume2, VolumeX, ExternalLink, Shuffle } from 'lucide-react';

// Predefined portfolio list
const PORTFOLIO_LINKS = [
  'https://andrew.shindyapin.com/',
  'https://www.trevoralpert.com/projects',
  'https://cjonescode.github.io/',
  'https://www.sadaqat.ai/',
  'https://patrickskinner.tech/'
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState<{
    text: string;
    audioUrl: string;
    portfolioName?: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // State for random portfolio selection
  const [usedPortfolios, setUsedPortfolios] = useState<Set<string>>(new Set());
  const [availablePortfolios, setAvailablePortfolios] = useState<string[]>([...PORTFOLIO_LINKS]);

  const handleRoast = async () => {
    if (!url) return;
    
    setLoading(true);
    setRoast(null);
    
    try {
      const response = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate roast');
      }
      
      const data = await response.json();
      setRoast(data);
      setShowPreview(true);
      
      // Auto-play the audio
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
    } catch (error) {
      console.error('Roast generation failed:', error);
      alert('Failed to roast this portfolio. Is it a valid URL?');
    } finally {
      setLoading(false);
    }
  };

  const selectRandomPortfolio = () => {
    if (availablePortfolios.length === 0) {
      // All portfolios have been used, reset the list
      setUsedPortfolios(new Set());
      setAvailablePortfolios([...PORTFOLIO_LINKS]);
      alert('All portfolios have been roasted! Resetting the list...');
      return;
    }

    // Select random portfolio from available ones
    const randomIndex = Math.floor(Math.random() * availablePortfolios.length);
    const selectedPortfolio = availablePortfolios[randomIndex];
    
    // Update states
    setUrl(selectedPortfolio);
    setUsedPortfolios(prev => new Set([...prev, selectedPortfolio]));
    setAvailablePortfolios(prev => prev.filter(portfolio => portfolio !== selectedPortfolio));
  };

  const resetPortfolioList = () => {
    setUsedPortfolios(new Set());
    setAvailablePortfolios([...PORTFOLIO_LINKS]);
    setUrl('');
    setRoast(null);
    setShowPreview(false);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-black flex p-4">
      <div className={`${showPreview ? 'w-full lg:w-1/2' : 'max-w-2xl w-full mx-auto'} transition-all duration-500`}>
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-4">
            PORTFOLIO ROASTER
          </h1>
          <p className="text-xl text-gray-400">
            Drop your tech portfolio URL and prepare to get cooked 🔥
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Input
                id="url"
                placeholder="https://yourportfolio.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleRoast()}
                className="text-lg bg-gray-800 border-gray-700 text-white placeholder-gray-500 h-14"
              />
            </div>
            
            {/* Random Portfolio Selection */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  onClick={selectRandomPortfolio}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Random Portfolio ({availablePortfolios.length} left)
                </Button>
                <Button 
                  onClick={resetPortfolioList}
                  disabled={loading}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  title="Reset portfolio list"
                >
                  Reset
                </Button>
              </div>
              
              {usedPortfolios.size > 0 && (
                <div className="text-xs text-gray-500">
                  Roasted: {usedPortfolios.size} / {PORTFOLIO_LINKS.length} portfolios
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleRoast} 
              disabled={loading || !url}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-xl h-16"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Preparing the roast...
                </>
              ) : (
                <>
                  <Flame className="mr-2 h-6 w-6" />
                  ROAST THIS PORTFOLIO
                </>
              )}
            </Button>
            
            {roast && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={togglePlayPause}
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-400 hover:bg-gray-700"
                    >
                      {isPlaying ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </Button>
                    <div>
                      <p className="text-sm text-gray-400">Audio Roast</p>
                      <p className="text-xs text-gray-500">Click to {isPlaying ? 'pause' : 'play'}</p>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={roast.audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">
                    The Roast {roast.portfolioName && `of ${roast.portfolioName}`}:
                  </h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {roast.text}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setRoast(null);
                      setUrl('');
                      setShowPreview(false);
                    }}
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Roast Another
                  </Button>
                  <Button
                    onClick={() => {
                      if (roast.text) {
                        navigator.clipboard.writeText(roast.text);
                        alert('Roast copied to clipboard!');
                      }
                    }}
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Copy Roast
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-gray-600 text-sm mt-8">
          Made for fun. Don&apos;t take it personally. Or do. We&apos;re not your therapist.
        </p>
      </div>
      
      {/* Website Preview Sidebar */}
      {showPreview && url && (
        <div className="hidden lg:block w-1/2 pl-4">
          <Card className="bg-gray-900 border-gray-800 h-full sticky top-4">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400">Portfolio Preview</h3>
                <Button
                  onClick={() => window.open(url, '_blank')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-300"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open
                </Button>
              </div>
              <div className="bg-gray-800 rounded-lg overflow-hidden flex-1">
                <iframe
                  src={url}
                  className="w-full h-full"
                  title="Portfolio Preview"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}