'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export default function ImageDropzone() {
  const { uploadedImage, setUploadedImage, setError } = useAppStore()
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File size must be less than 5MB')
        toast.error('File size must be less than 5MB')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Please upload a PNG, JPEG, or WebP image')
        toast.error('Please upload a PNG, JPEG, or WebP image')
      }
      return
    }

    const file = acceptedFiles[0]
    if (file) {
      setUploadedImage(file)
      setError(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      toast.success('Image uploaded successfully!')
    }
  }, [setUploadedImage, setError])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpeg', '.jpg', '.webp']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  })

  const removeImage = () => {
    setUploadedImage(null)
    setPreview(null)
    setError(null)
  }

  if (uploadedImage && preview) {
    return (
      <Card className="relative p-6 bg-black/20 border-white/10 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Image uploaded</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeImage}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-black/50"
            />
          </div>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p><span className="font-medium">Name:</span> {uploadedImage.name}</p>
            <p><span className="font-medium">Size:</span> {(uploadedImage.size / 1024 / 1024).toFixed(2)}MB</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative">
      <div
        {...getRootProps()}
        className={cn(
          "relative p-12 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200",
          "bg-black/20 backdrop-blur-sm",
          isDragActive && !isDragReject && "border-blue-400/50 bg-blue-400/10",
          isDragReject && "border-red-400/50 bg-red-400/10",
          !isDragActive && "border-white/20 hover:border-white/40 hover:bg-white/5"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragActive && !isDragReject && "bg-blue-400/20 text-blue-400",
            isDragReject && "bg-red-400/20 text-red-400",
            !isDragActive && "bg-white/10 text-white/70"
          )}>
            {isDragReject ? (
              <X className="w-8 h-8" />
            ) : isDragActive ? (
              <Upload className="w-8 h-8" />
            ) : (
              <ImageIcon className="w-8 h-8" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">
              {isDragActive ? (
                isDragReject ? "Invalid file type" : "Drop your image here"
              ) : (
                "Upload a website screenshot"
              )}
            </h3>
            <p className="text-sm text-gray-400">
              {isDragReject ? (
                "Please upload a PNG, JPEG, or WebP image"
              ) : (
                "Drag and drop your image here, or click to browse"
              )}
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Supports PNG, JPEG, WebP • Max 5MB</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
