import { create } from 'zustand'
import { AppState, ParodyResult } from '@/types'

interface AppStore extends AppState {
  setUploadedImage: (image: File | null) => void
  setPrompt: (prompt: string) => void
  setSelectedModel: (model: string) => void
  setGenerationStatus: (status: AppState['generationStatus']) => void
  setResult: (result: ParodyResult | null) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: AppState = {
  uploadedImage: null,
  prompt: '',
  selectedModel: 'replicate',
  generationStatus: 'idle',
  result: null,
  error: null,
}

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  
  setUploadedImage: (image) => set({ uploadedImage: image, error: null }),
  setPrompt: (prompt) => set({ prompt }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setGenerationStatus: (status) => set({ generationStatus: status }),
  setResult: (result) => set({ result, generationStatus: result ? 'complete' : 'idle' }),
  setError: (error) => set({ error, generationStatus: error ? 'error' : 'idle' }),
  
  reset: () => set({
    ...initialState,
    selectedModel: 'replicate', // Keep model selection
  }),
}))
