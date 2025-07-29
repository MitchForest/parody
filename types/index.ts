export interface ParodyResult {
  id: string
  originalImage: string
  generatedContent: string
  prompt: string
  model: string
  timestamp: number
  downloadUrl?: string
}

export interface AIProvider {
  name: string
  id: string
  generateParody(image: Buffer, prompt: string): Promise<ParodyResult>
  estimateTime(): number
  getCost(): number
}

export interface AppState {
  uploadedImage: File | null
  prompt: string
  selectedModel: string
  generationStatus: 'idle' | 'uploading' | 'generating' | 'complete' | 'error'
  result: ParodyResult | null
  error: string | null
}

export interface UploadResponse {
  success: boolean
  imageUrl?: string
  error?: string
}

export interface GenerateRequest {
  imageUrl: string
  prompt: string
  model: string
}

export interface GenerateResponse {
  success: boolean
  result?: ParodyResult
  error?: string
}

export type SupportedModel = 'replicate' | 'gemini' | 'anthropic'

export interface ModelConfig {
  id: SupportedModel
  name: string
  description: string
  estimatedTime: number
  cost: number
  available: boolean
}
