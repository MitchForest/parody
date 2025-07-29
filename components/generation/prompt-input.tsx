'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { PROMPT_TEMPLATES } from '@/config/ai-models'
import { cn } from '@/lib/utils'

export default function PromptInput() {
  const { prompt, setPrompt } = useAppStore()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const maxLength = 500

  const handleTemplateSelect = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      if (templateId === 'custom') {
        setSelectedTemplate('custom')
        setPrompt('')
      } else {
        setSelectedTemplate(templateId)
        setPrompt(template.prompt)
      }
    }
  }

  const handlePromptChange = (value: string) => {
    if (value.length <= maxLength) {
      setPrompt(value)
      if (selectedTemplate !== 'custom') {
        setSelectedTemplate('custom')
      }
    }
  }

  const clearPrompt = () => {
    setPrompt('')
    setSelectedTemplate(null)
  }

  return (
    <Card className="p-6 bg-black/20 border-white/10 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Parody Style</h3>
        </div>
        
        {/* Template Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PROMPT_TEMPLATES.filter(t => t.id !== 'custom').map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              onClick={() => handleTemplateSelect(template.id)}
              className={cn(
                "text-xs h-8 transition-all",
                selectedTemplate === template.id
                  ? "bg-blue-500/20 border-blue-400/50 text-blue-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
              )}
            >
              {template.name}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTemplateSelect('custom')}
            className={cn(
              "text-xs h-8 transition-all",
              selectedTemplate === 'custom' || (!selectedTemplate && prompt)
                ? "bg-purple-500/20 border-purple-400/50 text-purple-300"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
            )}
          >
            Custom
          </Button>
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              placeholder="Describe how you want to transform this website..."
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
            />
            {prompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPrompt}
                className="absolute top-2 right-2 p-1 h-6 w-6 text-gray-400 hover:text-white"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedTemplate && selectedTemplate !== 'custom' && (
                <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-400/30">
                  {PROMPT_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </Badge>
              )}
            </div>
            <span className={cn(
              "text-xs",
              prompt.length > maxLength * 0.9 ? "text-yellow-400" : "text-gray-500"
            )}>
              {prompt.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-400">Tips for better results:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>Be specific about the style or theme you want</li>
            <li>Mention if you want to keep certain elements unchanged</li>
            <li>Include tone preferences (funny, professional, etc.)</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
