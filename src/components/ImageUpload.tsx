interface ImageUploadProps {
  onImageLoad: (image: HTMLImageElement) => void
}

export default function ImageUpload({ onImageLoad }: ImageUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        onImageLoad(img)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        onImageLoad(img)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full max-w-md rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center transition hover:border-blue-500"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-10 w-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <h3 className="mb-2 text-xl font-semibold text-gray-900">上传图片</h3>
        <p className="mb-6 text-sm text-gray-600">
          拖拽图片到此处，或点击下方按钮选择文件
        </p>

        <label className="inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          选择图片
        </label>

        <p className="mt-4 text-xs text-gray-500">
          支持 JPG、PNG、WebP 等格式
        </p>
      </div>
    </div>
  )
}
