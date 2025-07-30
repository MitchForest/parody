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
  
  // State for slot machine animation
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningUrl, setSpinningUrl] = useState('');

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
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || 'Failed to generate roast');
      }
      
      const data = await response.json();
      setRoast(data);
      setShowPreview(true);
      
      // Auto-play the audio with 1.2x speed
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = 1.15; // Speed up by 15%
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
    } catch (error) {
      console.error('Roast generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to roast this portfolio: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to play a beep sound
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure the beep sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz frequency
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Lower volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1); // Quick fade
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1); // 100ms beep
    } catch {
      // Fallback for browsers that don't support Web Audio API
      console.log('Beep sound not supported');
    }
  };

  const selectRandomPortfolio = async () => {
    if (availablePortfolios.length === 0) {
      // All portfolios have been used, reset the list
      setUsedPortfolios(new Set());
      setAvailablePortfolios([...PORTFOLIO_LINKS]);
      alert('All portfolios have been roasted! Resetting the list...');
      return;
    }

    // Start the slot machine animation
    setIsSpinning(true);
    
    // Pre-determine the winner from available portfolios
    const randomIndex = Math.floor(Math.random() * availablePortfolios.length);
    const winner = availablePortfolios[randomIndex];
    
    // Slot machine spinning with gradually increasing delays (casino effect)
    const spinDelays = [80, 80, 100, 120, 150, 200, 280, 400, 600]; // milliseconds
    
    // Spin animation - cycle through random URLs
    for (let i = 0; i < spinDelays.length; i++) {
      await new Promise(resolve => setTimeout(resolve, spinDelays[i]));
      
      // Show random URL from all portfolios during spin (not just available ones)
      const randomSpinUrl = PORTFOLIO_LINKS[Math.floor(Math.random() * PORTFOLIO_LINKS.length)];
      setSpinningUrl(randomSpinUrl);
      
      // Play beep sound for each spin (except the last one for dramatic effect)
      if (i < spinDelays.length - 1) {
        playBeep();
      }
    }
    
    // Final dramatic pause before revealing winner (no beep here for suspense)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reveal the winner with emphasis
    setSpinningUrl(winner);
    setUrl(winner);
    
    // Play a slightly different "winner" beep
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Higher pitched "winner" sound
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch {
      console.log('Winner sound not supported');
    }
    
    // Small delay to let the user see the final selection
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // End spinning animation
    setIsSpinning(false);
    setSpinningUrl('');
    
    // Update tracking state
    setUsedPortfolios(prev => new Set([...prev, winner]));
    setAvailablePortfolios(prev => prev.filter(portfolio => portfolio !== winner));
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
        audioRef.current.playbackRate = 1.15; // Maintain 15% speed boost
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
                value={isSpinning ? spinningUrl : url}
                onChange={(e) => !isSpinning && setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && !isSpinning && handleRoast()}
                disabled={isSpinning}
                className={`text-lg bg-gray-800 border-gray-700 text-white placeholder-gray-500 h-14 transition-all duration-200 ${
                  isSpinning 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20 bg-gray-700 animate-pulse' 
                    : 'hover:border-gray-600'
                }`}
              />
              {isSpinning && (
                <div className="text-center">
                  <span className="text-orange-400 text-sm font-medium animate-bounce">
                    🎰 SPINNING... 🎰
                  </span>
                </div>
              )}
            </div>
            
            {/* Random Portfolio Selection */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  onClick={selectRandomPortfolio}
                  disabled={loading || isSpinning}
                  variant="outline"
                  className={`flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 transition-all duration-200 ${
                    isSpinning 
                      ? 'border-orange-500 bg-orange-900/20 text-orange-300 animate-pulse shadow-lg shadow-orange-500/10' 
                      : ''
                  }`}
                >
                  <Shuffle className={`mr-2 h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  {isSpinning 
                    ? 'SPINNING...' 
                    : `Random Portfolio (${availablePortfolios.length} left)`
                  }
                </Button>
                <Button 
                  onClick={resetPortfolioList}
                  disabled={loading || isSpinning}
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
              disabled={loading || !url || isSpinning}
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
                      <p className="text-sm text-gray-400">Audio Roast (1.15x speed)</p>
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