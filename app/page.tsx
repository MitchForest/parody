'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Wand2, ArrowRight, Github, Twitter } from 'lucide-react'
import ImageDropzone from '@/components/upload/image-dropzone'
import PromptInput from '@/components/generation/prompt-input'
import ModelSelector from '@/components/generation/model-selector'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export default function Home() {
  const { 
    uploadedImage, 
    prompt, 
    selectedModel, 
    generationStatus,
    setGenerationStatus 
  } = useAppStore()
  
  const [progress, setProgress] = useState(0)

  const canGenerate = uploadedImage && prompt.trim().length > 0

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('Please upload an image and enter a prompt')
      return
    }

    setGenerationStatus('generating')
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setProgress(100)
      setTimeout(() => {
        setGenerationStatus('complete')
        toast.success('Parody generated successfully!')
      }, 500)
    } catch (error) {
      setGenerationStatus('error')
      toast.error('Generation failed. Please try again.')
    } finally {
      clearInterval(progressInterval)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">Parody Generator</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Transform Websites into
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Hilarious Parodies
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Upload any website screenshot and let AI transform it into a comedy masterpiece. 
              Choose your style, pick your model, and watch the magic happen.
            </p>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-sm text-gray-500">AI Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">&lt;30s</div>
                <div className="text-sm text-gray-500">Generation Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">∞</div>
                <div className="text-sm text-gray-500">Possibilities</div>
              </div>
            </div>
          </div>

          {/* Generation Interface */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column */}
            <div className="space-y-6">
              <ImageDropzone />
              <PromptInput />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <ModelSelector />
              
              {/* Generation Button */}
              <Card className="p-6 bg-black/20 border-white/10 backdrop-blur-sm">
                <div className="space-y-4">
                  {generationStatus === 'generating' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Generating parody...</span>
                        <span className="text-white">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-gray-500 text-center">
                        This usually takes 15-30 seconds
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate || generationStatus === 'generating'}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-600 hover:to-pink-600 text-white border-0"
                  >
                    {generationStatus === 'generating' ? (
                      <>
                        <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Parody
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  {!canGenerate && (
                    <p className="text-xs text-gray-500 text-center">
                      Upload an image and enter a prompt to generate
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Example Gallery */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">See It In Action</h3>
            <p className="text-gray-400 mb-8">Here are some examples of what you can create</p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Corporate Jargon", desc: "LinkedIn → Buzzword Paradise" },
                { title: "Gen Z Vibes", desc: "News Site → Chronically Online" },
                { title: "Medieval Times", desc: "E-commerce → Ye Olde Shoppe" }
              ].map((example, i) => (
                <Card key={i} className="p-6 bg-black/20 border-white/10 backdrop-blur-sm hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-4 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">{example.title}</h4>
                  <p className="text-sm text-gray-400">{example.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Parody Generator. Made with ✨ and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
