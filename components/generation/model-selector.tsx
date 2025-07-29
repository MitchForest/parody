'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, Clock, DollarSign, CheckCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AI_MODELS } from '@/config/ai-models'
import { cn } from '@/lib/utils'

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useAppStore()

  return (
    <Card className="p-6 bg-black/20 border-white/10 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">AI Model</h3>
        </div>
        
        <div className="grid gap-3">
          {AI_MODELS.map((model) => (
            <div
              key={model.id}
              className={cn(
                "relative p-4 rounded-lg border transition-all cursor-pointer group",
                selectedModel === model.id
                  ? "bg-blue-500/20 border-blue-400/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              )}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{model.name}</h4>
                    {selectedModel === model.id && (
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                    )}
                    {!model.available && (
                      <Badge variant="secondary" className="text-xs bg-gray-500/20 text-gray-400">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{model.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>~{model.estimatedTime}s</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <DollarSign className="w-3 h-3" />
                      <span>${model.cost.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant={selectedModel === model.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "ml-4",
                    selectedModel === model.id
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  )}
                  disabled={!model.available}
                >
                  {selectedModel === model.id ? "Selected" : "Select"}
                </Button>
              </div>
              
              {/* Speed Indicator */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">Speed:</span>
                <div className="flex-1 bg-gray-700/50 rounded-full h-1">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all",
                      model.estimatedTime <= 10 ? "bg-green-400" :
                      model.estimatedTime <= 15 ? "bg-yellow-400" : "bg-orange-400"
                    )}
                    style={{
                      width: `${Math.max(20, 100 - (model.estimatedTime * 3))}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 pt-2 border-t border-white/10">
          <p className="font-medium text-gray-400 mb-1">Model Comparison:</p>
          <ul className="space-y-1">
            <li>• <span className="text-green-400">Replicate</span>: Balanced speed and quality</li>
            <li>• <span className="text-blue-400">Gemini</span>: Fastest generation, creative results</li>
            <li>• <span className="text-purple-400">Claude</span>: Most detailed analysis, slower</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
